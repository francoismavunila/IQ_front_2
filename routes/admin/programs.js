const express = require('express');
const router = express.Router();
const passport = require('passport');
const ensureAuthenticated = require('../../config/authentication');
const {body , validationResult} = require('express-validator');
const vid = require('../../models/videos');
const fs = require('fs-extra');
const cat = require('../../models/program_categories');
const programs = require('../../models/program_model');
const lesson = require('../../models/lesson_models');
const program_content = require('../../models/program_content_model');
var mime = require('mime');
var hbs = require('handlebars');
mime.lookup('/path/to/file.txt'); 



router.get("/categories",ensureAuthenticated,function(req , res){
	cat.find({}).lean().exec(function(err , _cat){
		if(err){
          	console.log('error fetching categories');
    	    res.status(500).json({error : "server error"});
		}else if(_cat){
			console.log(_cat);
	        res.render("admin/programs/program_category",{
			layout : "admin",
			cat : _cat
		    });
		}else{
         	console.log('couldnt fetch cat');
    	    res.status(500).json({error : "server error"});
		}
	});
	
});


router.get("/categories/add",ensureAuthenticated,function(req , res){
	res.render("admin/programs/add_category",{
		layout : "admin",
	});
});


router.post("/categories/add",ensureAuthenticated,
    body('cat_name').not().isEmpty().withMessage('name must not be empty'),
	body('description').not().isEmpty().withMessage('description must not be empty'),
	function(req , res){
       const error = validationResult(req);
      
  		if(!error.isEmpty()){
			error.errors.forEach(function(item){
			req.flash('error_msg', item.msg);	
			});
			console.log('validation errors');
			res.redirect('/admin/programs/categories/add');

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
					 res.redirect('/admin/programs/categories');	
					}
				});
			
				
             }
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
							programs.updateMany({"Category":prev_name},{"$set":{"Category":cat_name}},{"multi": true},(err, writeResult)=>{
			            		if(err){
                                  console.log(err);
                                  res.status(200).send({message : "couldnt change category name in the programs , this could be a fata error , contact your developer before proceeding",successful : 0});
			            		}else{
									program_content.updateMany({"CatName":prev_name},{"$set":{"CatName":cat_name}},{"multi": true},(err, writeResult)=>{
										if(err){
										  console.log(err);
										  res.status(200).send({message : "couldnt change category name in the programs , this could be a fata error , contact your developer before proceeding",successful : 0});
										}else{
										   console.log(writeResult);
										   res.redirect('/admin/programs/categories');
										}
									});
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

//post delete cat
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
       	  programs.find({Category : cat_name}).lean().exec(function(error , _prog){
       	  	console.log("available programs are "+_prog)
    	           	if(err){
					    		     console.log('could not remove category');
					    		     res.status(500).json({error : "server error"});
					    	    }else if(_prog!=""){
                       console.log('programs available');
					    		      res.status(200).send({message : "before deleting the category , first delete the programs under that category"});   
					    	    }else{
					    	    	  cat.findByIdAndRemove(id ,function(err){
												if(err){
										    		     console.log('could not remove category');
										    		     res.status(500).json({error : "server error"});
										    	    }
										    	    else{
										    	         res.redirect('/admin/programs/categories');
										    	       }
											});
					    	    }
                   													 
							})
	
	})

});


//programs
router.get("/categories/:id",ensureAuthenticated,function(req,res){
	var id = req.params.id;
   cat.findOne({_id : id} ,function(err , _cat){
   	if(_cat){
   		var catName = _cat.Name;
   		console.log('category found is ' + _cat);
   		programs.find({Category : catName}).lean().exec(function(err , _program){
   		 if(err){
   				console.log('err0r is in the first '+err);
   			  console.log('error fetching program');
    	      res.status(500).json({error : "server error"});
   			}else{
		   			res.render("admin/programs/programs",{
		   			layout : 'admin',
		   			program : _program,
					cat_name : catName
		   		});
		   	}
   		});
   		
   	}else if(err){
   		console.log('err0r is in the second '+err);
     	console.log('error fetching programs');
    	res.status(500).json({error : "server error"});
   	}
   	else{
   		req.flash('error_msg', 'category not found');
   		res.redirect("/admin/programs/categories");
   	}
   });
});


router.get("/add",ensureAuthenticated,function(req , res){
	cat.find({}).lean().exec(function(err , _cat){
       if(_cat){
	       	res.render("admin/programs/add_program",{
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

router.post("/add",ensureAuthenticated,
	 body('program_name').not().isEmpty().withMessage('provide program name for the program'),
	 body('category').not().isEmpty().withMessage('provide categoy for the program'),
	 body('description').not().isEmpty().withMessage('provide description for the program'),
	 body('price').not().isEmpty().withMessage('provide price for the program'),
	 body('trainer').not().isEmpty().withMessage('provide trainer for the program'),
	 body('duration_hrs').not().isEmpty().withMessage('provide hours duration for the program'),
	 body('duration_mins').not().isEmpty().withMessage('provide duration_mins for the program'),
	 body('date').not().isEmpty().withMessage('provide release date for the program'),
	 body('release_time').not().isEmpty().withMessage('provide release_time for the program'),
	 function(req , res){
        const error = validationResult(req);
 if(!error.isEmpty()){
			res.status(200).send({message : error.errors,successful : 0});
			}
		else{
           var program_name =  req.body.program_name;
           var description = req.body.description;
           var price =req.body.price;
           var category = req.body.category;
           var trainer = req.body.trainer;
           var duration_hrs = req.body.duration_hrs;
           var duration_mins = req.body.duration_mins;
           var date = req.body.date;
           var release_time = req.body.release_time;
           var duration = (duration_hrs * 60) + (+duration_mins);
           var imageData = req.body.image;

           programs.findOne({Name : program_name} ,function(err , _program){
             if(_program){
             	req.flash('error_msg','the program name exist , choose another one');
             	res.render('admin/programs/program_category',{
				 layout : 'admin',
	              program_name : req.body.program_name,
				  description  :req.body.description,
				  price :req.body.price,
				  category : req.body.category,
				  trainer : req.body.trainer,
	              duration_hrs : req.body.duration_hrs,
	              duration_mins : req.body.duration_mins,
	              date : req.body.date,
	              release_time : req.body.release_time
				});
             }
             else if(err){
               	console.log('error fetching program');
    	        res.status(500).json({error : "server error"});
             }
             else{
               var program = new programs({
               	Name : program_name,
               	Category : category,
               	Description : description,
               	Price : price ,
               	Duration : duration,
               	Trainer : trainer,
               	Program_image : '/programs/noImage.png',
               	Date : date,
               	Start_time : release_time
               });
            
              


		                             if(imageData != ""){
			                             var dir ='uploads/programs/'+program_name;
			                             var path = dir+'/'+'thumbnail.png';
			                             var image_bin_Data = imageData.replace(/^data:image\/\w+;base64,/," ");
						                 const buff = Buffer.from(image_bin_Data , 'base64');
						                // const image = buff.toString('utf-8');

			                             fs.ensureDir(dir).then(function(){
	                                       fs.writeFile(path , buff ,function(err){
	                                        	if(err){
	                                        		console.log(err);
                             			            req.flash('error_msg' ,' failed to upload thumbnail , contact the developer for assistance');
		                             			  program.save(function(err){
					                     	       	 if(err){
					                     	       	 	console.log('error while adding program');
					                                    res.status(500).json({error : "server error"});
					                     	       	   }else{
														res.redirect('/admin/programs/categories'); 
														}
														  
				                     			      });
		                             			      
		                             			      	    
			                                         }
	                                        	else{
				                             			 program.Program_image = '/programs/'+program_name+'/thumbnail.png';
				                             			 program.save(function(err){
				                             			 	if(err){
				                             			 	console.log('error while adding program');
				    	                                    res.status(500).json({error : "server error"});
				                             			 	}else{
																res.redirect('/admin/programs/categories'); 
															  }
				                             			 });
				                             			
				                           
				                             		}
	                                       });
			                             }).catch(err=>{
                                               console.log('error in creating a directory');
				                             	console.log(err);
				                             	req.flash('error_msg',"failed to upload the image , contact the developer for assistance");
				                     	        program.save(function(err){
					                     	       	 if(err){
					                     	       	 	console.log(' error while adding program');
					                                    res.status(500).json({error : "server error"});
					                     	       	 }
				                     			 });
	                     	        		   progCont.save(function(err){
								               	if(err){
								                 console.log('error while saving program content name'+err);
												 res.status(500).json({error : "server error"});
								               	}else{
                                                  res.redirect('/admin/programs/categories'); 
								               	}
								               }); 
			                             });
	                                   }
	                                   else{
	                                   	 program.save(function(err){
		                     	       	 if(err){
		                     	       	 	console.log('rror while adding program');
		                                    res.status(500).json({error : "server error"});
		                     	       	   }else{
											res.redirect('/admin/programs/categories');
											   }
	                     			      });
                         			     
                                          }
       
             }
           });
		}
});

//get edit prog
router.get('/edit/:id',ensureAuthenticated, function(req ,res){
	var id = req.params.id;
	programs.findOne({_id : id },function(err,_prog){
        if(_prog){
	        cat.find({}).lean().exec(function(err , _cat){
	        	if(_cat){
	        		  console.log(_prog.Date);
		        	  res.render("admin/programs/edit_programs",{
			            layout : 'admin',
			            program_name : _prog.Name ,
			            category : _cat,
			            cat : _prog.Category,
			            description : _prog.Description,
			            price : _prog.Price ,
			            id : _prog._id ,
			            image : _prog.Program_image,
			            trainer : _prog.Trainer,
			            date : _prog.Date,
                        release_time : _prog.Start_time,
		              })
	        	}else{
	        		  res.render("admin/programs/edit_programs",{
			            layout : 'admin',
			            program_name : _prog.Name ,
			            category : _prog.Category,
			            cat : _prog.Category,
			            description : _prog.Description,
			            price : _prog.Price ,
			            id : _prog._id ,
			            image : _prog.Program_image,
			            trainer : _prog.Trainer,
			            date : _prog.Date,
                        release_time : _prog.Start_time
		              })
	        	}
	          
			}); 
        }else{
        	console.log("error while fetching program with error "+ err);
            res.status(500).json({error : "server error"});
        }
	})
});

//post edit program
router.post('/edit',ensureAuthenticated,
 body('program_name').not().isEmpty().withMessage('provide program name for the department'),
 body('category').not().isEmpty().withMessage('provide categoy for the department'),
 body('description').not().isEmpty().withMessage('provide description for the department'),
 body('price').not().isEmpty().withMessage('provide price for the department'),	
 body('trainer').not().isEmpty().withMessage('provide trainer for the program'),
 body('duration_hrs').not().isEmpty().withMessage('provide hours duration for the program'),
 body('duration_mins').not().isEmpty().withMessage('provide duration_mins for the program'),
 body('date').not().isEmpty().withMessage('provide release date for the program'),
 body('release_time').not().isEmpty().withMessage('provide release_time for the program'),
 function(req ,res){
 	    const error = validationResult(req);
  	    if(!error.isEmpty()){
			res.status(200).send({message : error.errors,successful : 0});
			}
		else{
		   var id = req.body.id;	
           var program_name =  req.body.program_name;
	       var description = req.body.description;
	       var price =req.body.price;
	       var category = req.body.category;
	       var imageData = req.body.image;
	       var trainer = req.body.trainer;
           var duration_hrs = req.body.duration_hrs;
           var duration_mins = req.body.duration_mins;
           var date = req.body.date;
           var release_time = req.body.release_time;
           var duration = (duration_hrs * 60) + (+duration_mins);

          programs.findOne({Name : program_name},function(err , _program){
          	if(_program){
          	 console.log("that program name already exist");
             res.status(200).send({message : "program title already exist ",successful : 0});
          	}else{
          		   //console.log(id);
                    programs.findOne({_id : id}, function(err , _prog){
		          	if(_prog){
					   var prev_name = _prog.Name;
		              _prog.Name = program_name;
		              _prog.Category = category;
		              _prog.Description = description;
		              _prog.Price = price;
		              _prog.Trainer = trainer;
		              _prog.Duration = duration;
		              _prog.Date = date;
		              _prog.Start_time = release_time;

		                if(imageData !== ""){
		                     var dir ='uploads/programs/'+program_name;
			                 var path = dir+'/'+'thumbnail.png';
			                 var image_bin_Data = imageData.replace(/^data:image\/\w+;base64,/," ");
			                 const buff = Buffer.from(image_bin_Data , 'base64');
			                 fs.ensureDir(dir).then(function(){
                                 fs.writeFile(path , buff ,function(err){
                                 	if(err){
                                 		console.log("failed to change program image  "+err);
	                                    res.status(200).send({message : "failed to change program image",successful : 0});
                                        _prog.save(function(err){
				                 	       	 if(err){
				                 	       	 	 console.log("failed to change program details with error "+err);
			                                     res.status(200).send({message : "failed to change program details",successful : 0});
				                 	       	 }else{
												
												lesson.updateMany({"Program":prev_name},{"$set":{"Program":program_name}},{"multi": true},(err, writeResult)=>{
													if(err){
													  console.log(err);
													  res.status(200).send({message : "couldnt change category name in the lessoss , this could be a fata error , contact your developer before proceeding",successful : 0});
													}else{
														program_content.updateMany({"ProgName":prev_name},{"$set":{"ProgName":program_name}},{"multi": true},(err, writeResult)=>{
															if(err){
															  console.log(err);
															  res.status(200).send({message : "couldnt change category name in the program content , this could be a fata error , contact your developer before proceeding",successful : 0});
															}else{
															   console.log(writeResult);
															   res.redirect('/admin/programs/categories');
															}
														  });	
														 }
														})	
											 }
				             			});
                                 	}else{
                                 	 _prog.Program_image = '/programs/'+program_name+'/thumbnail.png';
                                      _prog.save(function(err){
				                 	       	 if(err){
				                 	       	 	 console.log("failed to change program details with error "+err);
			                                     res.status(200).send({message : "failed to change program details",successful : 0});
				                 	       	 }else{
												lesson.updateMany({"Program":prev_name},{"$set":{"Program":program_name}},{"multi": true},(err, writeResult)=>{
													if(err){
													  console.log(err);
													  res.status(200).send({message : "couldnt change category name in the lessoss , this could be a fata error , contact your developer before proceeding",successful : 0});
													}else{
														program_content.updateMany({"ProgName":prev_name},{"$set":{"ProgName":program_name}},{"multi": true},(err, writeResult)=>{
															if(err){
															  console.log(err);
															  res.status(200).send({message : "couldnt change category name in the program content , this could be a fata error , contact your developer before proceeding",successful : 0});
															}else{
															   console.log(writeResult);
															   res.redirect('/admin/programs/categories');
															}
														  });	
														 }
														})	
												 }
				                 	    
				             			 }); 
                                 	}
                                 })
			                 }).catch(err=>{
		                        console.log("failed to change program image  "+err);
	                            res.status(200).send({message : "failed to change program image",successful : 0});
		             	        _prog.save(function(err){
		                 	       	 if(err){
		                 	       	 	 console.log("failed to change program details with error "+err);
	                                     res.status(200).send({message : "failed to change program details",successful : 0});
		                 	       	 }else{
										lesson.updateMany({"Program":prev_name},{"$set":{"Program":program_name}},{"multi": true},(err, writeResult)=>{
											if(err){
											  console.log(err);
											  res.status(200).send({message : "couldnt change category name in the lessoss , this could be a fata error , contact your developer before proceeding",successful : 0});
											}else{
												program_content.updateMany({"ProgName":prev_name},{"$set":{"ProgName":program_name}},{"multi": true},(err, writeResult)=>{
													if(err){
													  console.log(err);
													  res.status(200).send({message : "couldnt change category name in the program content , this could be a fata error , contact your developer before proceeding",successful : 0});
													}else{
													   console.log(writeResult);
													   res.redirect('/admin/programs/categories');
													}
												  });	
												 }
												})	
										 }
		                 	       	 
		             			 });
		                     });
		                }else{
		                	//save program details if image data is empty
		                   _prog.save(function(err){
			                if(err){
			                   	 console.log("failed to change program details with error "+err);
	                             res.status(200).send({message : "failed to change program details",successful : 0});
			                   	}else{
									lesson.updateMany({"Program":prev_name},{"$set":{"Program":program_name}},{"multi": true},(err, writeResult)=>{
										if(err){
										  console.log(err);
										  res.status(200).send({message : "couldnt change category name in the lessoss , this could be a fata error , contact your developer before proceeding",successful : 0});
										}else{
											program_content.updateMany({"ProgName":prev_name},{"$set":{"ProgName":program_name}},{"multi": true},(err, writeResult)=>{
												if(err){
												  console.log(err);
												  res.status(200).send({message : "couldnt change category name in the program content , this could be a fata error , contact your developer before proceeding",successful : 0});
												}else{
												   console.log(writeResult);
												   res.redirect('/admin/programs/categories');
												}
											  });	
											 }
											})	
								   }
		                  	      
		                    }) 
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

//post delete prog
router.get('/delete/:id',ensureAuthenticated, function(req ,res){
	var id = req.params.id;
	programs.findOne({_id : id} ,function(err , _prog){
		if(err){
    		     console.log('could not remove programs');
    		     res.status(500).json({error : "server error......can't find program"});
    	    }
    	else{
    	    lesson.find({Program : _prog.Name}).lean().exec(function(error , _prog_cont){
				if(error){
					console.log("error while fetching lessons  with error "+ err);
					res.status(500).json({error : "server error"});
				}else if(_prog_cont){
					console.log("program content exists");
					res.status(500).json({error : "first delete lessons"});
				}else{
					programs.findByIdAndRemove(id ,function(err){
						if(err){
								 console.log('could not remove program');
								 res.status(500).json({error : "server error"});
							}
							else{
								 res.redirect('/admin/programs/categories');
							   }
					});
				}
			})
    	 }
	});
});
//router to get lessons
router.get('/lessons',ensureAuthenticated,(req , res)=>{
	var prog_name = req.query.prog_name;
	var cat_name = req.query.cat;
	lesson.find({Program: prog_name}).lean().exec(function(err , _lessons){
		if(err){
			res.status(500).json({error : "server error"});
		}
		res.render("admin/programs/lessons",{
			layout :'admin',
			lessons : _lessons,
            prog_name: prog_name,
			cat_name : cat_name
		})
	})

});
router.get('/lessons/add',ensureAuthenticated,function(req , res){
	var prog_name = req.query.prog_name;
	var cat_name = req.query.cat_name;
	res.render("admin/programs/lessons_add",{
		layout:'admin',
		prog_name : prog_name,
		cat_name : cat_name
	})
})
router.post('/lessons/add',ensureAuthenticated,
body('less_name').not().isEmpty().withMessage('provide name '),	
body('description').not().isEmpty().withMessage('provide description'),
body('date').not().isEmpty().withMessage('provide release date for the program'),
body('release_time').not().isEmpty().withMessage('provide release_time for the program'),function(req ,res){
	const error = validationResult(req);
	 if(!error.isEmpty()){
	   res.status(200).send({message : error.errors,successful : 0});
	   }
   else{
	  var prog_name = req.query.prog_name;
	  var cat_name = req.query.cat_name;
	  var name = req.body.less_name;	
	  var date =  req.body.date;
	  var description = req.body.description;
	  var release_time =req.body.release_time;
	  var progCont = new program_content({
		ProgName : prog_name,
		CatName : cat_name,
		LessName : name
	});
	  lesson.findOne({Name:prog_name},(error, _less)=>{
        if(_less){
			res.status(100).json({message : "lesson name already exists"});
		}else if(error){
			res.status(500).json({error : "server error"});
			 console.log("finding error"+error);
		}else{
			var lessons = new lesson({
				Name : name,
				Program : prog_name,
				Description : description,
				Date : date,
				Start_time : release_time
			});
			lessons.save(function(error){
				if(error){
				 res.status(500).json({error : "server error"});	
				 console.log("not saved"+error);
				}else{
                   progCont.save(function(err){
					   if(err){
						res.status(500).json({error : "server error",message : "consider deleting this lesson because you cant upload content on it"});	
						console.log("prog content not saved"+err);
					   }else{
						res.redirect("/admin/programs/categories");
					   }
				   })
				}
				
			})
		}
	  })

      }
	});

//post edit cat
router.post('/lessons/edit',ensureAuthenticated,
	 body('less_name').not().isEmpty().withMessage('provide lesson name for the department'),
	 function(req ,res){
	 	 const error = validationResult(req);
  		if(!error.isEmpty()){
			res.status(200).send({message : "lesson name must not be empty",successful : 0});
			}
		else{
	       var id = req.body.id;
	       var less_name = req.body.less_name;
		   var cat_name = req.query.cat_name;
		   var prog_name = req.query.prog_name;
	       console.log(id);
	       console.log(less_name);

	        lesson.findOne({_id : id}, function(err , _less){
		    if(_less){
	               var prev_name = _less.Name;
	              _less.Name = less_name;
	               _less.save(function(err){
		             	if(err){
		             	console.log(err);
		             	res.status(200).send({message : "couldnt change lesson name",successful : 0});	
			            }else{
							program_content.updateMany({ProgName : prog_name,CatName :cat_name,LessName : prev_name},{"$set":{LessName:less_name}},{"multi": true},(err, writeResult)=>{
								if(err){
								  console.log(err);
								  res.status(200).send({message : "couldnt change category name in the program content , this could be a fata error , contact your developer before proceeding",successful : 0});
								}else{
								   console.log(writeResult);
								   res.redirect('/admin/programs/categories');
								}
							  });
			             }
	           })
	       	}else{
	       	  console.log("failed to fetch lessons with error "+ err);
              res.status(200).send({message : "couldnt change lesson name",successful : 0});
	       	}
	       
	       })
     	
	      
         }
});


//post delete prog
router.get('/lessons/delete',ensureAuthenticated, function(req ,res){
	var id = req.query.id;
	var cat = req.query.catName;
	lesson.findOne({_id : id} ,function(err , _less){
		if(err){
    		     console.log('could not remove lessons');
    		     res.status(500).json({error : "server error"});
    	    }
    	else{
    	    var less = _less.Name;
			var prog = _less.Program;
    	    lesson.findByIdAndRemove(id,function(err){
             if(err){
	    		     console.log('could not remove lesson');
	    		     res.status(500).json({error : "server error"});
             }else{
				 console.log(prog+" "+cat+" "+less);
              program_content.findOne({ProgName : prog,CatName : cat,LessName : less},function(err , _prog_cont){
                    if(err){
				    		     console.log('could not remove lessons');
				    		     res.status(500).json({error : "server error"});
    		           }	
    		            	 program_content.findByIdAndRemove(_prog_cont._id,function(err){
	                          if(err){
										    		     console.log('could not remove programs');
										    		     res.status(500).json({error : "server error"});
						    		         }
		    		         	 })
		    		         	 	 fs.rmdir("programs/"+cat+"/"+prog+"/"+lesson, { recursive: true }, (err) => {
												    if (err) {
												        console.log('could not remove program content with error'+err);
										            res.status(200).send({message : "successfully deleted from data base , but failed to delete the file , you can manually delete from the server",successful : 0});
												    }else if(!err){
                                    // fs.rmdir("uploads/programs/"+prog, { recursive: true }, (err) => {
									// 							    if (err) {
									// 							        console.log('could not remove image with error'+err);
									// 					            res.status(200).send({message : "successfully deleted from data base , but failed to delete the file , you can manually delete from the server",successful : 0});
									// 							    }else{
																     
									// 							    }   
									// 		          });
													  console.log(`${prog} is deleted!`);
													  res.status(200).send({message : "successfully deleted "});	
												    }
							          });

              })           
             }
    	    })
    	        
    	 }
	});
});

// router.get('/lessons/delete/:id',ensureAuthenticated, function(req ,res){
// 	var id = req.params.id;
// 	lesson.findOne({_id : id} ,function(err , _less){
// 		if(err){
//     		     console.log('could not remove lesson , cant find lesson');
//     		     res.status(500).json({error : "server error......can't find lesson"});
//     	    }
//     	else{
//     	    program_content.find({LessName : _less.Name}).lean().exec(function(error , _prog_cont){
// 				if(error){
// 					console.log("error while fetching prog cont  with error "+ err);
// 					res.status(500).json({error : "server error"});
// 				}else if(_prog_cont){
// 					console.log("program content exists");
// 					res.status(500).json({error : "first delete program content"});
// 				}else{
// 					lesson.findByIdAndRemove(id ,function(err){
// 						if(err){
// 								 console.log('could not remove lesson');
// 								 res.status(500).json({error : "server error"});
// 							}
// 							else{
// 								 res.redirect('/admin/programs/categories');
// 							   }
// 					});
// 				}
// 			})
//     	 }
// 	});
// });

//get program content
router.get("/program_content",ensureAuthenticated,function(req,res){
	var prog_name = req.query.prog_name; 
	var cat_name = req.query.cat_name; 
	var less_name = req.query.less_name;
     //a way to register handlebars
	 /* hbs.registerHelper("setVar" ,function(varName , varValue,options){
			options.data.root[varName] = varValue;
		});*/
    
   	program_content.find({ProgName : prog_name,CatName : cat_name,LessName : less_name}).lean().exec(function(err , _prog_cont){
      if(_prog_cont){
   			console.log("content is"+_prog_cont);
			   console.log(JSON.stringify(_prog_cont, null, 4 ))

		   	res.render("admin/programs/program_content",{
		   			layout : 'admin',
		   			prog : _prog_cont,
		   			prog_name : prog_name,
					cat_name : cat_name,
					less_name : less_name
		   		});
   			}else if(err){
   				console.log('err0r is in the first '+err);
   			  console.log('error fetching program');
    	      res.status(500).json({error : "server error"});
   			}else{
		   			res.render("admin/programs/program_content",{
		   			layout : 'admin',
		   			prog : _prog_cont,
		   			prog_name : prog_name,
					cat_name : cat_name,
					less_name : less_name
		   		});
		   	}
   	});
});

/*
router.get("/program_content/:name",ensureAuthenticated,function(req,res){
	var prog_name = req.params.name; 
     //a way to register handlebars
	 /* hbs.registerHelper("setVar" ,function(varName , varValue,options){
			options.data.root[varName] = varValue;
		});*/
    /*
   	program_content.find({Program_name : prog_name}).lean().exec(function(err , _prog_cont){
      if(_prog_cont){
   				    //var path = mime.lookup('/'+_prog_cont.Video_url);
   				   
   				    var today = new Date();
   				    var available =[];
   				    var not_available =[];
   				    _prog_cont.forEach(element => {
   				     var date	= new Date(element.Date)
					  if(today.getTime()<date.getTime()){
					  	delete element.Video;
					  	delete element.Audio;
					  	delete element.Article;
					  	delete element.Youtube;
                       not_available.push(element)
					  }else{
                        available.push(element);
					  }
					});
					console.log(not_available);
					console.log(available);
		   			res.render("admin/programs/program_content",{
		   			layout : 'admin',
		   			availableProg : available,
		   			unAvailableProg : not_available,
		   			prog_name : prog_name
		   		});
   			}else if(err){
   				console.log('err0r is in the first '+err);
   			  console.log('error fetching program');
    	      res.status(500).json({error : "server error"});
   			}else{
		   			res.render("admin/programs/program_content",{
		   			layout : 'admin',
		   			program_cont : _prog_cont,
		   			prog_name : prog_name
		   		});
		   	}
   	});
});*/

router.get("/program_content/add",ensureAuthenticated,function(req,res){
	var prog_name = req.query.prog_name;
	var cat_name = req.query.cat_name;
	var less_name = req.query.less_name;
	console.log(prog_name);
	res.render("admin/programs/add_program_content",{
		   			layout : 'admin',
                    prog_name : prog_name,
					cat_name : cat_name,
					less_name : less_name
		   		});
});



//post add prog cont details
router.post("/program_content_youtube",ensureAuthenticated,
	 body('youtube').not().isEmpty().withMessage('provide youtube id'),
	 function(req , res){
        const error = validationResult(req);
  		if(!error.isEmpty()){
			res.status(200).send({message : error.errors,successful : 0});
			}
		else{
           var youtube =  req.body.youtube;
           youtube_id = youtube.replace("youtu.be", "www.youtube.com/embed");
           var prog_name = req.body.prog_name;
		   program_content.updateOne({ProgName : name,CatName :cat_name,LessName : less_name},{$push :{Youtube :{url : path}}},function(error , success){
			if(error){
				res.status(500).send({message : " error while uploading article ",successful : 0});
				console.log("error , could not save article : "+error);
			}else{
				console.log("finish")
				res.status(200).send({message : "article successfully uploaded  ",successful : 1});
			}
		})
						   
    }         
});



//post add article for programs
router.post("/program_content_article",ensureAuthenticated,	function(req , res){
       
		
			var dir;
            var path;
            var cat_name;
			var less_name;
            var name = "";
     

                req.busboy.on('field',function(fieldname ,val, fieldnameTruncated , valTruncted , encoding , mimetype){
		                console.log("executing the req.busboy.on(field,.....");

					       	if(fieldname=="prog_name"){
			                     name = val;
			                     console.log("prog name"+name);
					       	}else if(fieldname=="cat_name"){
                                 cat_name = val;
								 console.log("cat name"+cat_name);
							}else if(fieldname="less_name"){
                                  less_name = val;
								  console.log("less name"+less_name);
							}
					       	 	 
						    });


           
			     req.busboy.on('file',function(fieldname , file , filename , transferencoding , mimetype){
						console.log("in file now");		      
					         if(filename !=""){
                                    
						     	 
							    dir ='programs/'+cat_name+'/'+name+'/'+less_name+'/articles';
							    console.log(dir);
						     	 fs.ensureDir(dir).then(function(){
						                path = dir+'/'+filename;
						     	       file.pipe(fs.createWriteStream(path));
					     	     
						     	}).catch(err=>{
						     		console.log(err);
						     		res.status(200).send({message : " error while uploading article ",successful : 0})
						     	});
						        }else{
						        	  res.status(200).send({message : "empty "+fieldname+"!!!",successful : 0});
						        }
								

						     file.on('end',function(data){
								program_content.updateOne({ProgName : name,CatName :cat_name,LessName : less_name},{$push :{Article :{url : path}}},function(error , success){
									if(error){
										res.status(500).send({message : " error while uploading article ",successful : 0});
					                    console.log("error , could not save article : "+error);
									}else{
										console.log("finish")
										res.status(200).send({message : "article successfully uploaded  ",successful : 1});
									}
								})
						     
						     });
					});
                 	

                 req.busboy.on('finish' , function(){
						console.log('Done parsing form!');
					});
					
			req.pipe(req.busboy);
     });




//post add audios for programs
router.post("/program_content_audio",ensureAuthenticated,	function(req , res){
       
		
			var dir;
            var path;
            var _prog_cont;
			var cat_name;
			var less_name;
            var name = "";
    

                req.busboy.on('field',function(fieldname ,val, fieldnameTruncated , valTruncted , encoding , mimetype){
		                console.log("executing the req.busboy.on(field,.....");
						if(fieldname=="prog_name"){
							name = val;
							console.log("prog name"+name);
						  }else if(fieldname=="cat_name"){
							cat_name = val;
							console.log("cat name"+cat_name);
					   }else if(fieldname="less_name"){
							 less_name = val;
							 console.log("less name"+less_name);
					   }
					       	 	 
					});


           
			     req.busboy.on('file',function(fieldname , file , filename , transferencoding , mimetype){
						console.log("in file now");		      
					        if(filename != ""){
							    dir ='programs/'+cat_name+'/'+name+'/'+less_name+'/audios';
							    console.log(dir);
						     	 fs.ensureDir(dir).then(function(){
					                path = dir+'/'+filename;
					     	       file.pipe(fs.createWriteStream(path));
						     	}).catch(err=>{
						     		console.log(err);
						     		res.status(200).send({message : " error while uploading audio ",successful : 0});
						     	});
					        }
					        else{
					        	 res.status(200).send({message : "empty "+fieldname+"!!!",successful : 0});
					        }
						    
						  
						   

						     file.on('end',function(data){
								program_content.updateOne({ProgName : name,CatName :cat_name,LessName : less_name},{$push :{Audio :{url : path}}},function(error , success){
									if(error){
										res.status(500).send({message : " error while uploading article ",successful : 0});
					                    console.log("error , could not save article : "+error);
									}else{
										console.log("finish")
										res.status(200).send({message : "audio successfully uploaded  ",successful : 1});
									}
								})
						     });
					});
                 	

                 req.busboy.on('finish' , function(){
						console.log('Done parsing form!');
					});
					
			req.pipe(req.busboy);
     });

//post add video for programs
router.post("/program_content_vid",ensureAuthenticated,	function(req , res){
			var dir;
            var path;
            var _prog_cont;
			var cat_name;
			var less_name;
            var name = "hghg";
            var youtube_id =""

                req.busboy.on('field',function(fieldname ,val, fieldnameTruncated , valTruncted , encoding , mimetype){
		                console.log("executing the req.busboy.on(field,.....");

									if(fieldname=="prog_name"){
										name = val;
										console.log("prog name"+name);
									}else if(fieldname=="cat_name"){
										cat_name = val;
										console.log("cat name"+cat_name);
								}else if(fieldname="less_name"){
										less_name = val;
										console.log("less name"+less_name);
								}
					       	 	 
						    });


           
			     req.busboy.on('file',function(fieldname , file , filename , transferencoding , mimetype){
						console.log("in file now");		      
						if(filename !=""){
							    dir ='programs/'+cat_name+'/'+name+'/'+less_name+'/videos';
							    console.log(dir);
						     	 fs.ensureDir(dir).then(function(){
					                path = dir+'/'+filename;
					     	       file.pipe(fs.createWriteStream(path));
						     	}).catch(err=>{
						     		console.log(err);
						     		res.status(200).send({message : " error while uploading video ",successful : 0});
						     	});
                             /*
						     var content_length = req.headers['content-length'];
						     var uploaded_data_length = 0;
						     var uploaded_data_percentage =0.01;
							 
						    file.on('data',function(data){
						    	uploaded_data_length += data.length;
                                uploaded_data_percentage =(uploaded_data_length/content_length)*100;
						    	console.log(uploaded_data_percentage+'%');
						    });*/
						}else{
						     res.status(200).send({message : "empty "+fieldname+"!!!",successful : 0});	
						}
						    
						    


						     file.on('end',function(data){
								program_content.updateOne({ProgName : name,CatName :cat_name,LessName : less_name},{$push :{Video :{url : path}}},function(error , success){
									if(error){
										res.status(500).send({message : " error while uploading article ",successful : 0});
					                    console.log("error , could not save article : "+error);
									}else{
										console.log("finish")
										res.status(200).send({message : "video successfully uploaded  ",successful : 1});
									}
								})
						     });
					});
                 	

                 req.busboy.on('finish' , function(){
						console.log('Done parsing form!');
						
					});
					
                
			   

		 
	       
		    
			req.pipe(req.busboy);
     }); 




   //streams video files
  router.get('/program_content/video/streaming',function(req ,res){
      var doc_id = req.query.doc;
      var sub_id = req.query.sub;

      program_content.findOne({_id : doc_id },function(err ,_prog_cont){
         if(_prog_cont){
            var prog = _prog_cont.Video.id(sub_id);
           // console.log("video url"+prog);
               var fileStat = fs.statSync(prog.url);
               //console.log(fileStat);
               var fileSize = fileStat.size;
               var range = req.headers.range;
               console.log(range);
               if(range){
               	console.log("range available");
                   var parts = range.replace(/bytes=/,"").split("-");
                   var start = parseInt(parts[0],10);
                   var end = parts[1] ? parseInt(parts[1],10) : fileSize-1;
                   var chunkSize = (end-start)+1;
                   var file = fs.createReadStream(prog.url ,{start , end});
                   file.on("error", error=>{
                   	console.log("error reading file");
                   	console.log(error);
                   	res.sendStatus(500);
                   })
                   var vid_mime = mime.lookup(prog.url);
                   console.log(vid_mime);
                   var head= {
                   	   'content-Range' : 'bytes ' + start +"-"+ end + "/" + fileSize,
                   	   'Accept-Ranges' : 'bytes',
                   	   'Content-Length': chunkSize,
                   	   'Content-Type'  : vid_mime
                   }
                   console.log(head);
                   res.writeHead(206,head);
                   file.pipe(res);
               }else{
               	     var vid_mime = mime.lookup(prog.url);
               	     console.log(vid_mime)
               	     console.log('no range');
	                 res.writeHead(200 ,{
		               	"Content-Length":fileSize,
		               	"Content-Type" : vid_mime
	                 });
	                 fs.createReadStream(prog.url).pipe(res);
               }
               
             
               
         }else{
            console.log("cannot get prog content");
         }
      });
   
  });

//streaming audio files
   router.get('/program_content/audio/streaming',function(req ,res){
      var doc_id = req.query.doc;
      var sub_id = req.query.sub;

      program_content.findOne({_id : doc_id },function(err ,_prog_cont){
         if(_prog_cont){
            var prog = _prog_cont.Audio.id(sub_id);
            console.log("audio url"+prog.url);
               var fileStat = fs.statSync(prog.url);
               //console.log(fileStat);
               var fileSize = fileStat.size;
               var range = req.headers.range;
               console.log(range);
               if(range){
               	console.log("range available");
                   var parts = range.replace(/bytes=/,"").split("-");
                   var start = parseInt(parts[0],10);
                   var end = parts[1] ? parseInt(parts[1],10) : fileSize-1;
                   var chunkSize = (end-start)+1;
                   var file = fs.createReadStream(prog.url ,{start , end});
                   var audio_mime = mime.lookup(prog.url);
                   console.log(audio_mime);
                   var head= {
                   	   'content-Range' : 'bytes ' + start +"-"+ end + "/" + fileSize,
                   	   'Accept-Ranges' : 'bytes',
                   	   'Content-Length': chunkSize,
                   	   'Content-Type'  : audio_mime
                   }
                   console.log(head);
                   res.writeHead(206,head);
                   file.pipe(res);
               }else{
               	     var audio_mime = mime.lookup(prog.url);
               	     console.log('no range');
	                 res.writeHead(200 ,{
		               	"Content-Length":fileSize,
		               	"Content-Type" : audio_mime
	                 });
	                 fs.createReadStream(prog.url).pipe(res);
               }
               
             
               
         }else{
            console.log("cannot get prog content");
         }
      });
   
  });


//Sending docs
  router.get('/program_content/article/streaming',function(req ,res){
      var doc_id = req.query.doc;
      var sub_id = req.query.sub;

      program_content.findOne({_id : doc_id },function(err ,_prog_cont){
         if(_prog_cont){
            var prog = _prog_cont.Article.id(sub_id);
            console.log("article url"+prog.url);
               var data = fs.readFileSync(prog.url);
               console.log(data);
               res.contentType("application/pdf");
               res.send(data);
                
         }else{
            console.log("cannot get prog content");
         }
      });
   
  });



   
  
  /* 
   programs.find({Program_name : prog_name}).lean().exec(function(err , _prog_cont){
     if(_prog_cont){

     }
   });

    //for input name
     req.busboy.on('field',function(fieldname ,val, fieldnameTruncated , valTruncted , encoding , mimetype){
		console.log('fieldname is '+ fieldname);
			name = val;
			console.log('name is '+name);
			video.Name = val;
			console.log('the name of the video is'+video.Name);
	});
  //for file upload
	req.busboy.on('file',function(fieldname , file , filename , transferencoding , mimetype){

       	if(fieldname == 'video'){
	 		 	console.log('this is for '+ fieldname);
			     if(name==''){
	              name = filename;
			     }
			     dir ='uploads/videos/'+name;
			    console.log(dir);
		     	 fs.ensureDir(dir).then(function(){
	                path = dir+'/'+filename;
	     	       file.pipe(fs.createWriteStream(path));
		     	});
		  
				
		  
		     file.on('end',function(data){
		     	console.log('finished');
	           video.VidPath= path;
		     });
        
     	}
     	else if(fieldname == 'thumbnail'){
     		   console.log('this is for' + fieldname);
		      fs.ensureDir(dir).then(function(){
                path = dir+'/'+filename;
     	       file.pipe(fs.createWriteStream(path));
	     	});
			
		     file.on('end',function(data){
		     	console.log('finished');
	           video.VidThumbnail= path;
		     });
	        
     	}
	

	
	});


	req.busboy.on('finish' , function(){
		console.log('Done parsing form!');
		video.save(function(err){
			if(err){
				console.log('error saving entry on database');
				req.flash('error_msg','error while saving user');
				res.status(500).json({error : "server error , couldnt save entry on database"}); 
			}
			    else{
			res.redirect('/admin/users'); 
		    }
		    
		});
		
		
	});
	
 req.pipe(req.busboy);
});
*/


//get delete video
router.get('/article/delete/',function(req ,res){
	  var doc_id = req.query.doc;
      var sub_id = req.query.sub;
   program_content.findOne({_id: doc_id},function(err , _prog){
   	if(err){
   		console.log("could not get program content with error "+err);
   		res.status(200).send({message : "failed"})
   	}else if(_prog){
   		 var art = _prog.Article.id(sub_id);
   		 var path = art.url;
   		_prog.Article.id(sub_id).remove();
   		_prog.save(function(err){
   			if(err){
   			  console.log('could not remove url from database'+err);
		      res.status(200).send({message : "server error"});	
   			}
        try {
			    fs.unlinkSync(path);
			    console.log("Article is deleted.");
			    res.redirect('/admin/programs/categories');
			}catch (error) {
			    console.log('could not remove article with error'+error);
			    res.status(200).send({message : "successfully deleted from data base , but failed to delete the file , you can manually delete from the server",successful : 0});
			}
   		});
   	}
   })
});

//get delete audio
router.get('/audio/delete/',function(req ,res){
	  var doc_id = req.query.doc;
      var sub_id = req.query.sub;
   program_content.findOne({_id: doc_id},function(err , _prog){
   	if(err){
   		console.log("could not get program content with error "+err);
   		res.status(200).send({message : "failed"})
   	}else if(_prog){
   		 var aud = _prog.Audio.id(sub_id);
   		 var path = aud.url;
   		  _prog.Audio.id(sub_id).remove();
   		_prog.save(function(err){
   			if(err){
   			  console.log('could not remove url from database'+err);
		      res.status(200).send({message : "server error"});	
   			}
           	try {
			    fs.unlinkSync(path);
			    console.log("audio is deleted.");
			    res.redirect('/admin/programs/categories');
			}catch (error) {
			    console.log('could not remove audio with error'+error);
			    res.status(200).send({message : "successfully deleted from data base , but failed to delete the file , you can manually delete from the server",successful : 0});
			}
   		});
   	}
   })
});

//get delete video
router.get('/video/delete/',function(req ,res){
	  var doc_id = req.query.doc;
      var sub_id = req.query.sub;
   program_content.findOne({_id: doc_id},function(err , _prog){
   	if(err){
   		console.log("could not get program content with error "+err);
   		res.status(200).send({message : "failed"})
   	}else if(_prog){
   		 var vid = _prog.Video.id(sub_id);
   		 var path = vid.url;
   		 _prog.Video.id(sub_id).remove();
   		_prog.save(function(err){
   			if(err){
   			  console.log('could not remove url from database'+err);
		      res.status(200).send({message : "server error"});	
   			}
           	try {
			    fs.unlinkSync(path);
			    console.log("video is deleted.");
			    res.redirect('/admin/programs/categories');
			}catch (error) {
			    console.log('could not remove video with error'+error);
			    res.status(200).send({message : "successfully deleted from data base , but failed to delete the file , you can manually delete from the server",successful : 0});
			}
   		});
   	}
   })
});

router.get('/youtube/delete/',function(req ,res){
	  var doc_id = req.query.doc;
      var sub_id = req.query.sub;
   program_content.findOne({_id: doc_id},function(err , _prog){
   	if(err){
   		console.log("could not get program content with error "+err);
   		res.status(200).send({message : "failed"})
   	}else if(_prog){
   		 var you = _prog.Youtube.id(sub_id);
   		 var path = you.url;
   		 _prog.Youtube.id(sub_id).remove();
   		_prog.save(function(err){
   			if(err){
   			  console.log('could not remove url from database'+err);
		      res.status(200).send({message : "server error"});	
   			}
          res.redirect('/admin/programs/categories'); 
   		});
   	}
   })
});
module.exports = router;