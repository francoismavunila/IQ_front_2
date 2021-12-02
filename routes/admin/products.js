const express = require('express');
const router = express.Router();
const admin = require('../../models/admin_profile');
const depart = require('../../models/departments');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport');
const ensureAuthenticated = require('../../config/authentication');
const {body , validationResult} = require('express-validator');
const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const cat = require('../../models/products_categories');
const prod = require('../../models/products_model');



     
  

//get  categories
router.get('/',ensureAuthenticated,function(req , res){
	cat.find({}).lean().exec(function(err , _cat){
		if(err){
          	console.log('error fetching categories');
    	    res.status(500).json({error : "server error"});
		}else if(_cat){
			console.log(_cat);
	        res.render("admin/products/products_cat",{
			layout : "admin",
			cat : _cat
		    });
		}else{
         	console.log('couldnt fetch cat');
    	    res.status(500).json({error : "server error"});
		}
	});
});

//get products
router.get("/prod/:cat_name",ensureAuthenticated,function(req,res){
	var catName = req.params.cat_name;
 
   		prod.find({Category : catName}).lean().exec(function(err , _prod){
   			if(_prod){
   				  console.log(_prod);
		   		res.render("admin/products/products",{
		   			layout : 'admin',
		   			prod : _prod,
		   		});
   			}else if(err){
   			  console.log('error fetching products');
    	      res.status(500).json({error : "server error"});
   			}	
   		});
   		
});

//get add products page
router.get('/add',ensureAuthenticated,function(req , res){
  	cat.find({}).lean().exec(function(err , _cat){
       if(_cat){
	       	res.render('admin/products/add_products',{
	       	title : "Add Products",
					layout : "admin",
					cat : _cat
				});
       }
       else if(err){
	       	console.log('error is ' +err);
	       	console.log('error fetching categories');
	    	res.status(500).json({error : "server error"});
       }else{
       	req.flash('error_msg', 'please add categories first');
       	res.redirect("/admin/programs/categories");
       }
	})

});

//get add products category
router.get('/addCat',ensureAuthenticated,function(req , res){
	res.render('admin/products/add_products_cat',{
		title : "Add Products",
        layout :'admin'
	});
});

//post categories
router.post("/addCat",ensureAuthenticated,
  body('cat_name').not().isEmpty().withMessage('name must not be empty'),
	body('description').not().isEmpty().withMessage('description must not be empty'),
	function(req , res){
       const error = validationResult(req);
      
  		if(!error.isEmpty()){
			error.errors.forEach(function(item){
			req.flash('error_msg', item.msg);	
			});
			console.log('validation errors');
			res.redirect('/admin/products/addCat');

			}
			else{
				var  cat_name = req.body.cat_name;
				var description = req.body.description;

				var categories = new cat({
					Name : cat_name,
					Description : description
				});

				categories.save(function(err){
					if(err){
                      console.log('error saving category');
    	                res.status(500).json({error : "server error"});
					}else{
					 res.redirect('/admin/products/');	
					}
				});
			
				
        }
    });

router.post("/add",ensureAuthenticated,
	 body('product_name').not().isEmpty().withMessage('provide program name for the program'),
	 body('category').not().isEmpty().withMessage('provide categoy for the program'),
	 body('description').not().isEmpty().withMessage('provide description for the program'),
	 body('price').not().isEmpty().withMessage('provide price for the program'),
	 body('contact').not().isEmpty().withMessage('provide trainer for the program'),
	 function(req , res){
        const error = validationResult(req);
    if(!error.isEmpty()){
			res.status(200).send({message : error.errors,successful : 0});
			}
		else{
           var prod_name =  req.body.product_name;
           var description = req.body.description;
           var price =req.body.price;
           var category = req.body.category;
           var contact = req.body.contact;
           var imageData = req.body.image;

           prod.findOne({Name : prod_name} ,function(err , _prod){
             if(_prod){
             	req.flash('error_msg','the product name exist , choose another one');
             	res.render('admin/products/add_products',{
			      	 layout : 'admin',
	              prod_name : req.body.prod_name,
				        description  :req.body.description,
				        price :req.body.price,
				        category : req.body.category,
				        contact : req.body.contact
				});
             }
             else if(err){
               	console.log('error fetching product');
    	        res.status(500).json({error : "server error"});
             }
             else{
               var product = new prod({
               	Name : prod_name,
               	Category : category,
               	Description : description,
               	Price : price ,
               	Contact : contact,
               	Product_image : '/programs/noImage_product.png'
               });
              


		                             if(imageData != ""){
			                             var dir ='uploads/products/'+category;
			                             var path = dir+'/'+prod_name+'.png';
			                             var image_bin_Data = imageData.replace(/^data:image\/\w+;base64,/," ");
						                 const buff = Buffer.from(image_bin_Data , 'base64');
						                // const image = buff.toString('utf-8');

			                             fs.ensureDir(dir).then(function(){
	                                       fs.writeFile(path , buff ,function(err){
	                                        if(err){
	                                        		console.log(err);
                             			            req.flash('error_msg' ,' failed to upload thumbnail , contact the developer for assistance');
							                             			 product.save(function(err){
										                     	       	 if(err){
										                     	       	 	console.log('error while adding product');
										                                    res.status(500).json({error : "server error"});
										                     	       	   }
							                             	         else{
							                             	         	res.redirect('/admin/products/');
							                             	         }
																                   });   	    
			                                      }
	                                        	else{
				                             			 product.Product_image = '/products/'+category+'/'+prod_name+'.png';
				                             			 product.save(function(err){
				                             			 	if(err){
				                             			 	  console.log('error while adding program');
				    	                                res.status(500).json({error : "server error"});
				                             			 	}else{
				                             			 	 res.redirect('/admin/products/');
				                             			 	}
				                             			 });
				                             		}
	                                       });
			                             }).catch(err=>{
                                               console.log('error in creating a directory');
				                             	console.log(err);
				                             	req.flash('error_msg',"failed to upload the image , contact the developer for assistance");
				                     	        product.save(function(err){
					                     	       	 if(err){
					                     	       	 	console.log(' error while adding product');
					                                    res.status(500).json({error : "server error"});
					                     	       	 }
					                     	       	 else{
					                     	       	 	res.redirect('/admin/products/');
					                     	       	 }
				                     			 });
			                             });
	                                   }
	                                   else{
	                                   	 product.save(function(err){
				                     	       	 if(err){
				                     	       	 	console.log('rror while adding program');
				                                    res.status(500).json({error : "server error"});
				                     	       	   }else{
				                     	       	   	res.redirect('/admin/products/');
				                     	       	   }
	                     			      });
                         			     
                                   }
       
             }
           });
		}
});


//post delete prog
router.get('/delete/:id',ensureAuthenticated, function(req ,res){
	var id = req.params.id;
	prod.findOne({_id : id} ,function(err , _prod){
		if(err){
    		     console.log('could not remove programs');
    		     res.status(500).json({error : "server error"});
    	    }
    else{
    	    var name = _prod.Name;
    	    prod.findByIdAndRemove(id,function(err){
             if(err){
	    		     console.log('could not remove programs');
	    		     res.status(500).json({error : "server error"});
             }else{
		         	 
                 try {
									    fs.unlinkSync('uploads/'+_prod.Product_image);
									    console.log("Program is deleted.");
									    res.redirect('/admin/products/');
									  }catch (error) {
									    console.log('could not remove product with error'+error);
									    res.status(200).send({message : "successfully deleted from data base , but failed to delete the file , you can manually delete from the server",successful : 0});
									}
	             }
    	    })
    	        
    	 }
	});
});

//delete products categories
router.get('/categories/delete/:id',function(req ,res){
	var id = req.params.id;
	console.log(id);
	cat.findOne({_id : id},function(err , _cat){
		console.log(_cat);
		cat_name = _cat.Name;
     	if(err){
          console.log("failed to find category"+err);
         res.status(200).send({message : "failed to delete category",successful : 0});
       	}
       	  prod.find({Category : cat_name}).lean().exec(function(error , _prod){
       	  	console.log("available products are "+_prod)
    	           	if(err){
					    		     console.log('could not remove category');
					    		     res.status(500).json({error : "server error"});
					    	    }else if(_prod!=""){
                       console.log('products available');
					    		      res.status(200).send({message : "before deleting the category , first delete the products under that category"});   
					    	    }else{
					    	    	  cat.findByIdAndRemove(id ,function(err){
												if(err){
										    		     console.log('could not remove category');
										    		     res.status(500).json({error : "server error"});
										    	    }
										    	    else{
										    	         res.redirect('/admin/products');
										    	       }
											});
					    	    }
                   													 
							})
	
	})

});


//post edit cat
router.post('/categories/edit',ensureAuthenticated,
	 body('cat_name').not().isEmpty().withMessage('provide categoryS name for the department'),
	 function(req ,res){
	 	 const error = validationResult(req);
  		if(!error.isEmpty()){
			res.status(200).send({message : "cat name must not be empty",successful : 0});
			}
		else{
	       var id = req.body.id;
	       var cat_name = req.body.cat_name;
	       console.log(id);
	       console.log(cat_name);

	         cat.findOne({_id : id}, function(err , _cat){
		    if(_cat){
	               var prev_name = _cat.Name;
	              _cat.Name = cat_name;
	               _cat.save(function(err){
		             	if(err){
		             	console.log(err);
		             	res.status(200).send({message : "couldnt change category name",successful : 0});	
			            }else{
			            	console.log(prev_name);
			            	prod.updateMany({"Category":prev_name},{"$set":{"Category":cat_name}},{"multi": true},(err, writeResult)=>{
			            		if(err){
                                  console.log(err);
                                  res.status(200).send({message : "couldnt change category name",successful : 0});
			            		}else{
                                   console.log(writeResult);
                                   res.redirect('/admin/products');
			            		}
			            	});
			             }
	           })
	       	}else{
	       	  console.log("failed to fetch category with error "+ err);
              res.status(200).send({message : "couldnt change categories name",successful : 0});
	       	}
	       
	       })
     	
	      
         }
});

//get edit prog
router.get('/edit/:id',ensureAuthenticated, function(req ,res){
	var id = req.params.id;
	prod.findOne({_id : id },function(err,_prod){
        if(_prod){
	        cat.find({}).lean().exec(function(err , _cat){
	        	if(_cat){
		        	  res.render("admin/products/edit_products",{
			            layout : 'admin',
			            prod_name : _prod.Name ,
			            category : _cat,
			            cat : _prod.Category,
			            description : _prod.Description,
			            price : _prod.Price ,
			            id : _prod._id ,
			            image : _prod.Product_image,
			            contact : _prod.Contact,
		              })
	        	}else{
	        		  res.render("admin/products/edit_products",{
			            layout : 'admin',
			            prod_name : _prog.Name ,
			            category : _prod.Category,
			            cat : _prod.Category,
			            description : _prod.Description,
			            price : _prod.Price ,
			            id : _prod._id ,
			            image : _prod.Product_image,
			            contact : _prod.Contact,
		              })
	        	}
	          
			}); 
        }else{
        	console.log("error while fetching products with error "+ err);
            res.status(500).json({error : "server error"});
        }
	})
});

//post edit program
router.post('/edit',ensureAuthenticated,
 body('product_name').not().isEmpty().withMessage('provide program name for the department'),
 body('category').not().isEmpty().withMessage('provide categoy for the department'),
 body('description').not().isEmpty().withMessage('provide description for the department'),
 body('price').not().isEmpty().withMessage('provide price for the department'),	
 body('contact').not().isEmpty().withMessage('provide trainer for the program'),
 function(req ,res){
 	    const error = validationResult(req);
  	    if(!error.isEmpty()){
			res.status(200).send({message : error.errors,successful : 0});
			}
		else{
		       var id = req.body.id;	
           var prod_name =  req.body.product_name;
           var description = req.body.description;
           var price =req.body.price;
           var category = req.body.category;
           var contact = req.body.contact;
           var imageData = req.body.image;

          prod.findOne({Name : prod_name},function(err , _product){
          	if(_product){
          	 console.log("that program name already exist");
             res.status(200).send({message : "program title already exist ",successful : 0});
          	}else{
          		   console.log(id);
               prod.findOne({_id : id}, function(err , _prod){
		          	if(_prod){
		               _prod.Name = prod_name;
		               _prod.Description = description;
		               _prod.Price = price;
		               _prod.Category = category;
		               _prod.Product_image = '/programs/noImage_product.png';
		                                  if(imageData != ""){
			                             var dir ='uploads/products/'+category;
			                             var path = dir+'/'+prod_name+'.png';
			                             var image_bin_Data = imageData.replace(/^data:image\/\w+;base64,/," ");
						                 const buff = Buffer.from(image_bin_Data , 'base64');
						                // const image = buff.toString('utf-8');

			                             fs.ensureDir(dir).then(function(){
	                                       fs.writeFile(path , buff ,function(err){
	                                        if(err){
	                                        		console.log(err);
                             			            req.flash('error_msg' ,' failed to upload thumbnail , contact the developer for assistance');
							                             			 _prod.save(function(err){
										                     	       	 if(err){
										                     	       	 	console.log('error while adding product');
										                                    res.status(500).json({error : "server error"});
										                     	       	   }
							                             	         else{
							                             	         	res.redirect('/admin/products/');
							                             	         }
																                   });   	    
			                                      }
	                                        	else{
	                                        _prod.Product_image= '/products/'+category+'/'+prod_name+'.png';
				                             			 _prod.save(function(err){
				                             			 	if(err){
				                             			 	  console.log('error while adding program');
				    	                                res.status(500).json({error : "server error"});
				                             			 	}else{
				                             			 	 res.redirect('/admin/products/');
				                             			 	}
				                             			 });
				                             		}
	                                       });
			                             }).catch(err=>{
                                               console.log('error in creating a directory');
				                             	console.log(err);
				                             	req.flash('error_msg',"failed to upload the image , contact the developer for assistance");
				                     	        _prod.save(function(err){
					                     	       	 if(err){
					                     	       	 	console.log(' error while adding product');
					                                    res.status(500).json({error : "server error"});
					                     	       	 }
					                     	       	 else{
					                     	       	 	res.redirect('/admin/products/');
					                     	       	 }
				                     			 });
			                             });
	                                   }
	                                   else{
	                                   	 _prod.save(function(err){
				                     	       	 if(err){
				                     	       	 	console.log('rror while adding program');
				                                    res.status(500).json({error : "server error"});
				                     	       	   }else{
				                     	       	   	res.redirect('/admin/products/');
				                     	       	   }
	                     			      });
                         			     
                                   }
		          	}else{
		             console.log("error while fetching program with error "+ err);
		             res.status(500).json({error : "server error"});
		          	}
		          })
          	}
          })
		 }
     
});

module.exports = router;