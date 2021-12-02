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
const aws = require('aws-sdk');
const KEY_ID = "AKIA6GNFNQ22P2W2SQEQ";
const SECRET_KEY = "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"



     
  

//user directed to login page
router.get('/',function(req , res){
	res.render('admin/login',{
		title : "login",
        layout :'login'
	});
});



//admin dashboard
router.get('/dashboard',ensureAuthenticated ,function(req , res){
	
     	res.render('admin/index',{
						title : 'admin dashboard',
						layout : 'admin',
						id : req.user._id,
						name : req.user.Name,
						surname : req.user.Surname,
						Email : req.user.Email,
						cell : req.user.CellNumber,
						department : req.user.Department,
						power : req.user.AdminPower,
						about : req.user.About,
						image : req.user.Image,
						position : req.user.Position
					});


console.log(req.flash('success'));
});

//post login
router.post('/login', function(req ,res ,next){

    passport.authenticate('admin' , {
    	successRedirect : '/admin/dashboard',
    	failureRedirect : '/admin',
    	failureFlash : true 
    })(req , res , next);
});


//handle logout requests

router.get('/logout',function(req , res){
	req.logout();
	res.redirect('/admin');
});

/*
//code was for handling activation of account , but has since been removed bcoz user activation is no longer necessary
router.get('/activate',function(req , res){
	res.render('admin/activate',{
		title : "activate account" ,
        layout :'login'
	});
});


router.post('/activate',function(req , res, next){
		
		var password = req.body.password;
		var email = req.body.email;
        

		body('email').isEmail();
		body('password').isEmpty();
		const errors = validationResult(req);
		if(!errors.isEmpty()){
			return res.status(400).json({errors:errors.array()});
		}

    admin.findOne({Email : email} , function(err , _admin){
      	if(_admin){
          console.log(_admin);

      		    bcrypt.genSalt(saltRounds,(err , salt)=>{

			    	bcrypt.hash(password,salt,(err , hash)=>{
						_admin.Email = email;
			      		_admin.Password = hash;
			      		_admin.AccountStatus='active';
			      		_admin.save(function(err){
			      			if(err){
						    		req.flash('error_msg','error while in saving activating user');
						    		console.log('err');
						    		res.redirect('/activate');
						    	}
						    	res.redirect('/admin');
			      		});
			    	});
			    });
      	   }
      	 else{
          
			req.flash('error_msg','User email not registered for activation');
						    		console.log('err');
						    		res.redirect('/activate');   
      	}
      });

      
  
});*/

//get registration page when registering a user
router.get('/registration',ensureAuthenticated, function(req , res ,next){

	depart.find({}).lean().exec(function(err , _depart){
	if(err){
		console.log('failed to get departments')
	}
	else{

        res.render('admin/registration',{
		title : 'User registration',
		department : _depart,
        layout : 'admin',
        image : req.user.Image
        
	     });       
	}

});

	
});



//post registration

router.post('/registration',body('email').isEmail().withMessage('must be a valid email'),
	body('name').not().isEmpty().withMessage('name must not be empty'),
	body('surname').not().isEmpty().withMessage('surname must not be empty'),
	body('admin_power').not().isEmpty().withMessage('prev must not be empty'),
	body('department').not().isEmpty().withMessage('department must not be empty'),function(req , res, next){

        const error = validationResult(req);
        

		if(!error.isEmpty()){
			error.errors.forEach(function(item){
			req.flash('error_msg', item.msg);	
			});
			console.log('validation errors');
			res.redirect('/admin/registration');
			}
			else
			{
// function for updating schema changes    
   
  // this function adds two new fields to the schema
  /* function updateSchema(){
    	admin.update({} ,{$addFields : {'AccountStatus' : {type : String} }} ,{multi : true} , function(err){
    		if (err) {console.log('failed to update schema')}
    	});
    }

    updateSchema();*/
   /* function updateSchema(){
    	admin.update({} ,{$rename : {'AccountStatus' : 'Position'}} ,{multi : true} , function(err){
    		if (err) {console.log('failed to update schema')}
    	});
    }
*/
  
		var name = req.body.name;
		var surname = req.body.surname;
		var email = req.body.email;
		var department = req.body.department;
		var admin_power = req.body.admin_power;
		var position = req.body.position;
        var reg_password = Math.random().toString(36).slice(-5);


		console.log(reg_password);
		admin_power = admin_power== 'true' ? 1 : 0;
		

    admin.findOne({Email : email} , function(err , _admin){
      	if(_admin){
      		req.flash('error_msg','email exist try another one');
      		
      		console.log(errors);
      		res.redirect('/admin/registration');
      		
      	   }
      	 else{

			    var Admin = new admin ({
					   	Name : name ,
					   	Surname : surname,
					   	Password : reg_password,
					   	Email : email,
					   	Department : department ,
					   	AdminPower : admin_power ,
					   	CellNumber :'',
					   	About : '',
					   	Image : '',
					   	Position : position
			 		});


                  bcrypt.genSalt(saltRounds,(err , salt)=>{
			    	bcrypt.hash(reg_password,salt,(err , hash)=>{
			             Admin.Password=hash;

			   		 Admin.save(function(err){
			        	if(err){
				    		req.flash('error_msg','error while saving user');
				    		console.log('err');
				    		res.redirect('/admin');
			    		}
			    	//send email to user
							var transporter =nodemailer.createTransport({
						        	service : 'gmail' ,
						        	auth : {
						        		user : 'twisemind@gmail.com',
						        		pass : '0783857780frA'
						        	}
						        });
						        
						        var mailOptions={
						        	from : 'twisemind@gmail.com',
						        	to : email ,
						        	subject : 'Infinity Quo Admin Registration',
						        	html : '<p>Infinity Quo has Granted you the previledge of becoming one of the Administrators , You are given permission to edit</p> '+
						        	          '<p>things pertaining to your department.</p>' + '<p>Use this link<a>infinityquo/admin/activate</a> to activate your account , your password is</p>'+reg_password
						        };
						        transporter.sendMail(mailOptions,function(error ,info){
						        	if(error){
						        		console.log(error);
						        	}
						        	else{
						        		console.log('email sent :'+ info.response);
						        	}
						        });
					    	res.redirect('/admin/users');
			    });
			    		 
			    	});
			    });


			    /*bcrypt.genSalt(saltRounds,(err , salt)=>{
			    	bcrypt.hash(Admin.Password,salt,(err , hash)=>{
			             Admin.Password=hash;
			    		 Admin.save(function(err){
			   	           if(err){
			   		          console.log(err);
			   		          res.redirect('/admin');
			   		          console.log('failed to save');
			            	}
			               else{
			   		          res.redirect('/admin');
			   		          console.log('saved successfully');
			                	}

			             });
			    	});
			    });*/
      	}
      });

			}
   
      
  
});


//get admin
router.get('/users',ensureAuthenticated ,function(req ,res){
	admin.find({}).lean().exec(function(err , _admins){
		if(err){
    		     console.log('error fetching admins');
    		     res.status(500).json({error : "server error"});
    	    }
        else{
        	res.render('admin/users',{
        		layout :'admin',
        		users : _admins,
        		 image : req.user.Image
        		 
        	  });
        }

	});
});


//get edit admin
router.get('/users/edit/:id',ensureAuthenticated ,function(req,res){

 admin.findOne({_id : req.params.id},function(err,_admin){
 	if(_admin){
 		depart.find({}).lean().exec(function(err , _depart){
 			if(err){
 				console.log('error fetching depart');
    	        res.status(500).json({error : "server error"});
 			}
 			else{
 				res.render('admin/edit_admin',{
		 			name : _admin.Name,
		 			surname: _admin.Surname,
		 			email : _admin.Email,
		 			cell :_admin.CellNumber,
		 			about :_admin.About,
		 			department :_admin.Department,
		 			departments :_depart,
		 			Position :_admin.Position,
		 			id : _admin._id,
		 			layout :'admin',
		 			image : req.user.Image
		 		});
 			}
 		});
 		
 	}
 	else{
 		console.log('error fetching admin');
    	res.status(500).json({error : "server error"});
 	}
 });
});


//post edit admin
router.post('/users/edit',
	body('name').not().isEmpty().withMessage('name must not be empty'),
	body('surname').not().isEmpty().withMessage('surname must not be empty'),
	body('email').isEmail().withMessage('Invalid Email Address'),
	function(req , res){
 
	  var id = req.body.id;	
      const error = validationResult(req);
      
  		if(!error.isEmpty()){
			error.errors.forEach(function(item){
			req.flash('error_msg', item.msg);	
			});
			console.log('validation errors');
			res.redirect('/admin/users/edit/'+id);

			}
			else{
				var  name = req.body.name;
				var surname = req.body.surname;
				var cell = req.body.cell;
                var email = req.body.email;
                var about = req.body.about;
                var department = req.body.department;
                var position = req.body.position;
                var admin_power = req.body.admin_power;
                var imageData = req.body.image;
                 //var imageData = req.bo == null ? 'no_user/profile' :  id+'/'+imageFile.name  ;
                 //console.log(imageData);
                
               

                admin.findOne({Email: email , _id :{$ne : id}},function(err , _admiN){
                	if (err){
                		console.log('error fetching admin');
    	                res.status(500).json({error : "server error"});
                	}
                	else if(_admiN){
                		console.log("that email address already exists");
                		req.flash('error_msg','that email address aready exists choose another');
                		res.redirect('/admin/users/edit/'+id);
                	}
                	else{
                	    admin.findOne({_id : id},function(error ,_admin){
                          if(_admin){
		                           	 _admin.Name = name;
		                           	 _admin.Surname = surname;
		                             _admin.Department = department;
		                             _admin.Email = email;
		                             _admin.AdminPower = admin_power;
		                             _admin.CellNumber = cell;
		                             _admin.About = about;
		                             _admin.Position = position;
		                            

		                             if(imageData != ""){
			                             var dir ='uploads/admin/'+id;
			                             var path = dir+'/'+'profile.png';
			                             var image_bin_Data = imageData.replace(/^data:image\/\w+;base64,/," ");
						                 const buff = Buffer.from(image_bin_Data , 'base64');
						                // const image = buff.toString('utf-8');

			                             fs.ensureDir(dir).then(function(){
	                                       fs.writeFile(path , buff ,function(err){
	                                        	if(err){
	                                        		console.log(err);
                             			            req.flash('error_msg' ,' failed to upload profile picture , contact the developer for assistance');
		                             			  _admin.save(function(err){
					                     	       	 if(err){
					                     	       	 	console.log('error while updating information');
					                                    res.status(500).json({error : "server error"});
					                     	       	   }
				                     			      });
		                             			     
		                             			      	res.redirect('/admin/users/edit/'+id);     
	                                        	}
	                                        	else{
				                             			 _admin.Image = 'profile.png';
				                             			 _admin.save(function(err){
				                             			 	if(err){
				                             			 	console.log('error while updating information');
				    	                                    res.status(500).json({error : "server error"});
				                             			 	}
				                             			 });
				                             			 res.redirect('/admin/users');
				                             		}
	                                       });
			                             }).catch(err=>{
                                               console.log('error in creating a directory');
				                             	console.log(err);
				                             	req.flash('error_msg',"failed to upload profile picture , contact the developer for assistance");
				                     	       _admin.save(function(err){
					                     	       	 if(err){
					                     	       	 	console.log('error while updating information');
					                                    res.status(500).json({error : "server error"});
					                     	       	 }
				                     			 });
				                     	       res.redirect('/admin/users/edit/'+id);
			                             });
	                                   }
	                                   else{
	                                   	 _admin.save(function(err){
		                     	       	 if(err){
		                     	       	 	console.log('error while updating information');
		                                    res.status(500).json({error : "server error"});
		                     	       	   }
	                     			      });
                         			     
                         			      	res.redirect('/admin/users/edit/'+id); 
                                          }
       
                           }
                               else {
			                   	 console.log('error fetching admin');
			                     res.status(500).json({error : "server error"});
			                   }
        
                          
                	    });
                	}
                });
			}

});

//get edit profile
router.get('/edit_profile/:id',ensureAuthenticated , function(req , res){
	admin.findOne({_id : req.params.id},function(error , _admin){
       if(_admin){
       	depart.find().lean().exec(function(err , _depart){
       		if(_depart){
       			 res.render('admin/edit_profile',{
		       		name : _admin.Name,
		 			surname: _admin.Surname,
		 			email : _admin.Email,
		 			cell :_admin.CellNumber,
		 			about :_admin.About,
		 			department :_admin.Department,
		 			departments :_depart,
		 			Position :_admin.Position,
		 			id : _admin._id,
		 			layout :'admin',
		 			image : req.user.Image
		       	});
       		}
       		else{
       			res.render('admin/edit_profile',{
		       		name : _admin.Name,
		 			surname: _admin.Surname,
		 			email : _admin.Email,
		 			cell :_admin.CellNumber,
		 			about :_admin.About,
		 			department :_admin.Department,
		 			Position :_admin.Position,
		 			id : _admin._id,
		 			layout :'admin',
		 			image : req.user.Image
		       	});
       		}
       	});
       	
       }
       else{
       	console.log('error fetching admin');
    	res.status(500).json({error : "server error"});
       }
	});
	
});


//post edit profile

router.post('/users/edit_profile',
	body('name').not().isEmpty().withMessage('name must not be empty'),
	body('surname').not().isEmpty().withMessage('surname must not be empty'),
	body('email').isEmail().withMessage('Invalid Email Address'),
	function(req , res){
     
	  var id = req.body.id;	
      const error = validationResult(req);
       
  		if(!error.isEmpty()){
			error.errors.forEach(function(item){
			req.flash('error_msg', item.msg);	
			});
			console.log('validation errors');
			res.redirect('/admin/users/edit/'+id);

			}
			else{
				var  name = req.body.name;
				var surname = req.body.surname;
				var cell = req.body.cell;
                var email = req.body.email;
                var about = req.body.about;
                var department = req.body.department;
                var position = req.body.position;
                var admin_power = req.body.admin_power;
                var imageData = req.body.image;
                var password = req.body.password;
                 //var imageData = req.bo == null ? 'no_user/profile' :  id+'/'+imageFile.name  ;
                 //console.log(imageData);
                
               

                admin.findOne({Email: email , _id :{$ne : id}},function(err , _admiN){
                	if (err){
                		console.log('error fetching admin');
    	                res.status(500).json({error : "server error"});
                	}
                	else if(_admiN){
                		console.log("that email address already exists");
                		req.flash('error_msg','that email address aready exists choose another');
                		res.redirect('/admin/edit_profile/'+id);
                	}
                	else{
                	    admin.findOne({_id : id},function(error ,_admin){
                          if(_admin){
		                           	 _admin.Name = name;
		                           	 _admin.Surname = surname;
		                             _admin.Department = department;
		                             _admin.Email = email;
		                             _admin.AdminPower = admin_power;
		                             _admin.CellNumber = cell;
		                             _admin.About = about;
		                             _admin.Position = position;
		                            

                          

		                             if(imageData != ""){
			                             var dir ='uploads/admin/'+id;
			                             var path = dir+'/'+'profile.png';
			                             var image_bin_Data = imageData.replace(/^data:image\/\w+;base64,/," ");
						                 const buff = Buffer.from(image_bin_Data , 'base64');
						                // const image = buff.toString('utf-8');

			                             fs.ensureDir(dir).then(function(){
	                                       fs.writeFile(path , buff ,function(err){
	                                        	if(err){
	                                        		console.log(err);
                             			            req.flash('error_msg' ,' failed to upload profile picture , contact the developer for assistance');
                             			             if(password!=""){
					                                    	bcrypt.genSalt(saltRounds,(err , salt)=>{
												    	     bcrypt.hash(password,salt,(err , hash)=>{
												             _admin.Password=hash;
												                _admin.save(function(err){
									                     	       	 if(err){
									                     	       	 	console.log('error while updating information');
									                                    res.status(500).json({error : "server error"});
									                     	       	   }
								                     			      });
						                             			     
						                             			      	res.redirect('/admin/edit_profile/'+id); 	
														    	});
														    });
					                                    }
					                                    else
					                                    {
						                                      _admin.save(function(err){
							                     	       	 if(err){
							                     	       	 	console.log('error while updating information');
							                                    res.status(500).json({error : "server error"});
							                     	       	   }
						                     			      });
				                             			     
				                             			      	res.redirect('/admin/edit_profile/'+id); 	
					                                    }
		                             			      
	                                        	}
	                                        	else{
                                                        if(password!=""){
					                                    	bcrypt.genSalt(saltRounds,(err , salt)=>{
												    	     bcrypt.hash(password,salt,(err , hash)=>{
												             _admin.Password=hash;
												               _admin.Image = 'profile.png';
							                             			 _admin.save(function(err){
							                             			 	if(err){
							                             			 	console.log('error while updating information');
							    	                                    res.status(500).json({error : "server error"});
							                             			 	}
							                             			 });
							                             			 res.redirect('/admin/users'); 	
														    	});
														    });
					                                    }
					                                    else
					                                    {
						                                     _admin.Image = 'profile.png';
						                             			 _admin.save(function(err){
						                             			 	if(err){
						                             			 	console.log('error while updating information');
						    	                                    res.status(500).json({error : "server error"});
						                             			 	}
						                             			 });
						                             			 res.redirect('/admin/users');	
							                              }
				                             		}
	                                       });
			                             }).catch(err=>{
                                               console.log('error in creating a directory');
				                             	console.log(err);
				                             	req.flash('error_msg',"failed to upload profile picture , contact the developer for assistance");
                                                
                                                 if(password!=""){
					                                    	bcrypt.genSalt(saltRounds,(err , salt)=>{
												    	     bcrypt.hash(password,salt,(err , hash)=>{
												             _admin.Password=hash;
												                 _admin.save(function(err){
								                     	       	 if(err){
								                     	       	 	console.log('error while updating information');
								                                    res.status(500).json({error : "server error"});
								                     	       	 }
							                     			 });
							                     	            res.redirect('/admin/edit_profile/'+id);
														    	});
														    });
					                                    }
					                                    else
					                                    {
						                                     _admin.save(function(err){
								                     	       	 if(err){
								                     	       	 	console.log('error while updating information');
								                                    res.status(500).json({error : "server error"});
								                     	       	 }
							                     			 });
							                     	       res.redirect('/admin/edit_profile/'+id);
					                                    }

			                             });
	                                   }
	                                   else{
                                             console.log('image empty');
	                                   	     if(password!=""){
                                                           console.log('password not empty')
					                                    	bcrypt.genSalt(saltRounds,(err , salt)=>{
												    	     bcrypt.hash(password,salt,(err , hash)=>{
												             _admin.Password=hash;
												               _admin.save(function(err){
								                     	       	 if(err){
								                     	       	 	console.log('error while updating information');
								                                    res.status(500).json({error : "server error"});
								                     	       	   }
							                     			      });
						                         			     
						                         			      	res.redirect('/admin/edit_profile/'+id); 	
														    	});
														    });
					                                    }
					                                    else
					                                    {
						                                      _admin.save(function(err){
								                     	       	 if(err){
								                     	       	 	console.log('error while updating information');
								                                    res.status(500).json({error : "server error"});
								                     	       	   }
							                     			      });
						                         			     
						                         			      	res.redirect('/admin/edit_profile/'+id); 	
					                                    }


	                                   	
                                          }
       
                           }
                               else {
			                   	 console.log('error fetching admin');
			                     res.status(500).json({error : "server error"});
			                   }
        
                          
                	    });
                	}
                });
			}

});


//deleting user
router.get('/users/delete/:id',function(req ,res){
	console.log("deleting");
	admin.findByIdAndRemove(req.params.id ,function(err){
		if(err){
    		     console.log('could not remove user');
    		     res.status(500).json({error : "server error"});
    	    }
    	    else{
    	         res.redirect('/admin/users');
    	       }
	});
});





//get departments

router.get('/departments',ensureAuthenticated ,function(req ,res ){
depart.find({}).lean().exec(function(err , _depart){
	if(err){
		console.log('failed to get departments')
	}
	else{
		admin.find({}).lean().exec(function(error,_admin){
			 if(error){console.log('failed to get Administrators')};
			   console.log(_admin);
			   var admins =[];
			    _admin.forEach(function(item){
					admins.push(item.Email);
				});
				console.log(req.body.dname);
				res.render('admin/departments',{
				 	department : _depart,
				 	admin  : admins,
				 	layout : 'admin',
				 	 image : req.user.Image
				 	
				});
		});
	}

});
 
});

//post add department
router.post('/department/add' ,body('dname').not().isEmpty().withMessage('department name must not be empty'),
  body('description').not().isEmpty().withMessage('provide description for the department'),
  body('goals').not().isEmpty().withMessage('write goals for the department'),
  function(req , res ){
  	 const error = validationResult(req);
  		if(!error.isEmpty()){
  			
			error.errors.forEach(function(item){
			req.flash('error_msg', item.msg);	
			});
			console.log('validation errors');
			res.render('admin/departments',{
			 layout : 'admin',
              dep_name : req.body.dname,
			  des  :req.body.description,
			  goal :req.body.goals,
			  add : true
			});
			}
			else{
			var dname =req.body.dname;
            var description = req.body.description;
            var goals = req.body.goals;
            var head =req.body.head;
            
             depart.findOne({Name: dname} , function(err , _depart){
              if(_depart){
              	req.flash('error_msg',"department name already exist choose another one");
              	res.render('admin/departments',{
				  layout : 'admin',
	              dep_name : req.body.dname,
				  des  :req.body.description,
				  goal :req.body.goals,
				  add : true
			    });
              }
              else{
              	var Department = new depart ({
              		Name : dname,
              		Description : description,
              		Goals : goals,
              		Head : head
              	});
              	Department.save(function(err){
              		if(err){
              			req.flash('error_msg',"error saving");
		              	res.render('admin/departments',{
						  layout : 'admin',
			              dep_name : req.body.dname,
						  des  :req.body.description,
						  goal :req.body.goals,
						  add : true
			    		});
              		}
              		else{
              			res.redirect('/admin/departments');
              		}
              	});
              }
             });

			}

});

//get edit department page
router.get('/department/edit/:id',ensureAuthenticated ,function(req , res){
    admin.find({}).lean().exec(function(error , _admin){
    	if(error){
    		console.log('could not fetch admin data');
    		res.status(500).json({error : "could not fetch admin data"});
    	}
    	else{
    		var admins =[];
    		_admin.forEach(function(item){
					admins.push(item.Email);
				});

            depart.findOne({_id : req.params.id} , function(err ,_depart){
				res.render('admin/edit_department',{
					layout :'admin',
					 dep_name : _depart.Name,
					 des      :_depart.Description,
					 goal     :_depart.Goals,
					 head     :_depart.Head,
					 id       :_depart._id,
					 admin   : admins,
					  image : req.user.Image
				});
	       })
    	}
    });

	
});

//post edit department
router.post('/department/edit',
  body('dname').not().isEmpty().withMessage('department name cant be empty'),
  body('description').not().isEmpty().withMessage(' department description cant be empty'),
  body('goals').not().isEmpty().withMessage('department goals cant be empty'),
  function(req , res){

  	var id = req.body.id;

  	const error = validationResult(req);

  		if(!error.isEmpty()){

			error.errors.forEach(function(item){
			req.flash('error_msg', item.msg);	
			});
            
            console.log(id);
			console.log('validation errors');
			res.redirect('/admin/department/edit/'+id);
		}
		else{
		 var dname =req.body.dname;
         var description = req.body.description;
         var goals = req.body.goals;
         var head =req.body.head;

         depart.findOne({Name : dname ,_id :{$ne : id}} ,function(err , _dep){

         	if(_dep){
         		req.flash('error_msg','department name exist , choose another one');
         		res.redirect('/admin/department/edit/'+id);
         	}
         	else if(err){
    		     console.log('could not fetch depart data');
    		     res.status(500).json({error : "server error"});
    	         
    	         }
         	else{
         		 depart.findOne({_id : id} , function(error , _depart){

         			_depart.Name = dname;
         			_depart.Description = description;
         			_depart.Goals = goals;
         			_depart.Head =head;

         			_depart.save(function(err){
         				if(error){
			    		     console.log('could not save depart data');
			    		     res.status(500).json({error : "could save daprt "});
    	                   }
    	                   else{
    	                   	 res.redirect('/admin/departments');
    	                   }
         			});
         		});
         	}
         });
		}
     
});

//post delete depart
router.get('/department/delete/:id',function(req ,res){
	depart.findByIdAndRemove(req.params.id ,function(err){
		if(err){
    		     console.log('could not remove deprt');
    		     res.status(500).json({error : "server error"});
    	    }
    	    else{
    	         res.redirect('/admin/departments');
    	       }
	});
});




module.exports = router;