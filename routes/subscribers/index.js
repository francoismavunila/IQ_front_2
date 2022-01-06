const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport');
const {body , validationResult} = require('express-validator');
const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const mime = require('mime');
const html = fs.readFileSync('views/welcome.hbs','utf8');
const subscriber = require('../../models/subscriber_model');
const sub_Authenticated = require('../../config/sub_authenticated');
const genAccess = require('../../config/token_gen');
const sendMail = require('../../config/sendmail')
const programs = require('../../models/program_model');
const cat = require('../../models/program_categories');
const fetch = require('node-fetch');
var request = require('request');
var jwt = require('jsonwebtoken');

const authUrl = "https://api-m.sandbox.paypal.com/v1/oauth2/token";
const clientIdAndSecret = "ARxo1slqoFzPlTECeuhG9NmcqNxfQ5nfovsojfuZompOXWE4LLEDL66Br_xARnKdQ6gn0U-Cnfxu146o:EDCQ8-cHXfv_a1No4yoYPts4pIeuCN7ssVON9NwM1BpQN3B60UmL6AtusH6zzvoIuKg_tC49Nu41HgdA";
const base64 = Buffer.from(clientIdAndSecret).toString('base64')

router.get('/',function(req , res){
	res.render('subscribers/sub_login',{
   
	})
   });
   
 router.get('/signUp',function(req , res){
	res.render('subscribers/sub_register',{
   
	})
   });

router.post('/signUp',body('email').isEmail().withMessage('must be a valid email'),
   body('name').not().isEmpty().withMessage('name must not be empty'),
   body('surname').not().isEmpty().withMessage('surname must not be empty'),
   body('password').not().isEmpty().withMessage('password must not be empty'),
   function(req , res){
    
	const error = validationResult(req);
    var val_errors=[];  

	if(!error.isEmpty()){
		error.errors.forEach(function(item){
		console.log(item.msg);
		val_errors.push(item.msg);	
		});
		console.log('error fetching checking subscriber');
    	res.status(400).json({success:false ,message : val_errors});
		
		}
		else
		{

	 var name = req.body.name;
	 var surname = req.body.surname;
	 var email = req.body.email;
	 var password = req.body.password;
     const token = genAccess({name, surname, email,password});
	 console.log(token);
	 
	 


	 subscriber.findOne({Email:email},function(err,sub){
         if(err){
			console.log('error fetching checking subscriber');
    	    res.status(500).json({success: false,message : "server error"});
		 }else if(sub){
            console.log('subscriber email already exists');
    	    res.status(500).json({success: false, message : "email already exists"});
		 }else{
			var mail = async ()=>{
				try{
					var response = await sendMail({
					   email: email,
					   subject : "subscriber activation",
					   html : `<h3>Hello ${name}</h3> <br><p>Thank you for subscribing to our website, click the following link to activate your account</p><br><a href=${process.env.SITE_URL}/subscriber/activate/${token}>activate account</a>`
					});
					res.status(200).json({success: true, message:"done, check your email address to activate your account"});
				}catch(error){
				   console.log("send email error"+error);
				   res.status(500).json({success: false, message:"there was an error during signup"});
				}
			 }
			 
		mail();
		
		 }
	 });
	}
   });

router.get('/activate/:token',function(req, res){
 var token = req.params.token;
 console.log(token);
 jwt.verify(token, process.env.JWT_HASH, function(error, dec_token){
	 if(error){
		 console.log("there was an error:"+error);
		 res.status(400).json({success: false,message:"expired or invalid token"});
	 }else{
		 console.log(dec_token);
		const {name, surname, email,password} = dec_token;
		console.log(name+surname+email+password);

		subscriber.findOne({Email:email},function(err,sub){
            if(err){
				console.log('error fetching checking subscriber');
				res.status(500).json({success: false, message : "server error"});
			 }else if(sub){
				console.log('subscriber email already exists');
				res.status(500).json({success: false,message : "email already exists"});
			 }else{
			    bcrypt.genSalt(saltRounds,(err , salt)=>{
					bcrypt.hash(password,salt,(err , password_hash)=>{
						var Subscriber = new subscriber ({
							Name : name ,
							Surname : surname,
							Password : password_hash,
							Email : email,
							Subscriber_id :"",
							Plan_id : "",
							Start_time : "",
							Status_Update_Time :"",
							Payment_email_address :""
					  });
					  Subscriber.save(function(err){
						if(err){
							console.log('err saving subscriber');
							res.status(500).json({success: false,message : "error saving subscriber"});
						}else{
							res.redirect("/subscriber/signUp");
						}
					})
					})
				})
			 }
		})
		
	 }
 })
});
router.get('/forgot_password',function(req,res){
	console.log('here');
	res.render('subscribers/reset_email');
})
router.post('/forgot_password',function(req,res){
 var email = req.body.email;
 console.log(email);
 subscriber.findOne({Email:email},function(error,_sub){
	 if(error){
		 console.log(error)
		 res.status(400).json({success:false,message:'the email address is not registered with us'});
	 }else{
		const token = genAccess({email});
		var mail = async ()=>{
			try{
				var response = await sendMail({
				   email: email,
				   subject : "reset password",
				   html : `<h3>Hello </h3> <br><p>Thank you for subscribing to our website, click the following link to reset your password</p><br><a href=${process.env.SITE_URL}/subscriber/reset/${token}>reset password</a>`
				});
				res.status(200).json({success: true, message:"done, check your email address to reset your account"});
			}catch(error){
			   console.log("send email error"+error);
			   res.status(500).json({success: false, message:"there was an error during verification"});
			}
		 }
		 
		mail();
	 }
 })
})

router.get('/reset/:token',function(req, res){
	var token = req.params.token;
	console.log(token);
    res.render('subscribers/reset',{
		layout : 'main',
		token : token
	})
   });

router.post('/password/reset',function(req, res){
	var password=req.body.password;
	var token = req.body.token;

	jwt.verify(token, process.env.JWT_HASH, function(error, dec_token){
		if(error){
			console.log("there was an error:"+error);
			res.status(400).json({success: false,message:"expired or invalid token"});
		}else{
		   console.log(dec_token);
		   const {email} = dec_token;
		   console.log(email);
		   subscriber.findOne({Email:email},function(err,sub){
				if(err){
					console.log('error fetching checking subscriber');
					res.status(500).json({success: false, message : "server error"});
				}else{
					bcrypt.genSalt(saltRounds,(err , salt)=>{
						bcrypt.hash(password,salt,(err , password_hash)=>{
							sub.Password=password_hash;
							sub.save(function(err){
								if(err){
									console.log('err saving subscriber');
									res.status(500).json({success: false,message : "error saving subscriber"});
								}else{
									res.status(500).json({success: true,message : "done, visit the site to login"});
								}
							})
						})
					})
				}
			})
			 
		}
	})
})

router.post('/login', function(req ,res ,next){
    passport.authenticate('sub' , {
    	successRedirect : '/subscriber/done',
    	failureRedirect : '/subscriber/fail',
    	failureFlash : true 
    })(req , res , next);
});

router.get('/done',sub_Authenticated,function(req , res){
	res.status(200).json({success:true ,message : 'done, getting to your home page in 2 seconds...', redirect:'/subscriber/home'});
})

router.get('/fail',sub_Authenticated,function(req , res){
	console.log('failed');
	res.status(200).json({success: false ,message : 'failed to login, password and username does not match'});
})

router.get('/home',sub_Authenticated,function(req , res){
 res.render('subscribers/home',{
   layout : 'main',
   id : req.user._id,
   name : req.user.Name,
   surname : req.user.Surname,
   email : req.user.Email
 });
})

router.get('/logout',function(req , res){
	req.logout();
	res.redirect('/subscriber');
});

router.get('/getstarted',sub_Authenticated,function(req , res){
    subscriber.findOne({_id:req.user._id},function(err , _sub){
		console.log(_sub);
		if(err){
			console.log("could not fetch subscriber details :"+err)
			res.status(500).json({error : "error saving subscriber"});	
		}else{
		if(_sub.Subscriber_id!=""){
			console.log(_sub.Subscriber_id);
			fetch(authUrl, { 
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'Accept-Language': 'en_US',
					'Authorization': `Basic ${base64}`,
				},
				body: 'grant_type=client_credentials'
			}).then(function(response) {
				return response.json();
			}).then(function(data) {
				console.log("succ");
				console.log(data.access_token);
				if(data.access_token){
					var headers = {
						'Content-Type': 'application/json',
						'Authorization': 'Bearer '+data.access_token
					};
					console.log("id is "+_sub.Subscriber_id)
					var options = {
						url: 'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/'+_sub.Subscriber_id,
						headers: headers
					};
					
					function callback(error, response, body) {
						if (!error && response.statusCode == 200) {
							var data = JSON.parse(body);
							console.log(data.status);
							if(data.status=='ACTIVE'){
								switch(data.plan_id){
									case 'P-7GK47613232225841MFXCV2Q':
										console.log(_sub.Content.length);
										if(_sub.Content.length>0){
											var days =0;
											programs.find({_id:_sub.Content}).lean().exec(function(prog_err,progs){
												if(prog_err){
													console.log("could not fetch programs :"+err)
													res.status(500).json({error : "error accesing your programs contact the support team"});
												}else{
													res.render('subscribers/sub_programs',{
														header : "monthly Subsription",
                                                        name : _sub.Name,
														surname : _sub.Surname,
														email : _sub.Email,
														start_date : _sub.Start_time,
														days_left : days, 
														content : progs
													})
												}
											})
										
										}else{
											cat.find({}).lean().exec(function(cat_err ,_cat){
												if(err){
													console.log("could not fetch subscriber details :"+err)
													res.status(500).json({error : "error saving subscriber"});
												}else{
													programs.find({}).lean().exec(function(prog_err ,_prog){
														if(err){
															console.log("could not fetch subscriber details :"+err)
															res.status(500).json({error : "error saving subscriber"});
														}else{
															res.render('programs',{
																layout : 'main',
																prog : _prog,
																max : 3,
																cat : _cat
															})
														}
													})
												}	
											})
										}
										break;
									case 'P-9P503834VT1309506MF7BLSI':
										console.log(_sub.Content.length)
										// var cont = JSON.parse(_sub.Content);
										// console.log(cont);
										if(_sub.Content.length>0){
											var days =0;
											programs.find({_id:_sub.Content}).lean().exec(function(prog_err,progs){
												if(prog_err){
													console.log("could not fetch programs :"+err)
													res.status(500).json({error : "error accesing your programs contact the support team"});
												}else{
													res.render('subscribers/sub_programs',{
														header : "quarterly subscription",
														name : _sub.Name,
														surname : _sub.Surname,
														email : _sub.Email,
														start_date : _sub.Start_time,
														days_left : days, 
														content : progs
													})
												}
											})
										
										}else{
											cat.find({}).lean().exec(function(cat_err ,_cat){
												if(err){
													console.log("could not fetch subscriber details :"+err)
													res.status(500).json({error : "error saving subscriber"});
												}else{
													programs.find({}).lean().exec(function(prog_err ,_prog){
														if(err){
															console.log("could not fetch subscriber details :"+err)
															res.status(500).json({error : "error saving subscriber"});
														}else{
															res.render('subscribers/selectPrograms',{
																layout : 'main',
																prog : _prog,
																max : 6,
																cat : _cat
															})
														}
													})
												}	
											})
										}
										break;
									case 'P-8873523646632301LMFXC6UY':
										cat.find({}).lean().exec(function(prog_err, _cat){
											if(prog_err){
												console.log("could not fetch subscriber details :"+err)
												res.status(500).json({error : "error saving subscriber"});
											}else{
												res.render("programs_categories",{
													layout : "main",
													cat : _cat
													});
											}
										})
										break;
								}
							}else{
								res.send("your subscription has expired , subscribe to gain access to our content");
							}
						}else if(error){
							console.log("error:"+error);
						}else{
							console.log(response.body);
							console.log(response.statusCode);
						}
					}
					
					request(options, callback);
				}else{
					res.send("there is no token");
				}
			}).catch(function() {
				console.log("fail");
				console.log("couldn't get auth token");
			});
			
		}else{
			res.render('subscribers/pricecards',{
				layout:'main'
			})
		}
	}
	})

})
//add programs to the subscriber
router.post('/selected',sub_Authenticated,function(req,res){
	console.log(req.body);
	var selects = req.body;

	subscriber.findOne({_id:req.user._id},function(err,_sub){
		if(err){
			console.log("could not fetch subscriber details :"+err)
			res.status(500).json({error : "error fetching subscriber"});
		}else{
			_sub.Content=selects;
			_sub.save(function(error){
				if(error){
					console.log("could not save subscriber details :"+error)
					res.status(500).json({error : "error saving subscriber"});
				}else{
					res.redirect("/subscriber/getstarted");
				}
			})
		}
		
	})
	
})
//get the access token and redirect to subscribe
router.get('/pay',sub_Authenticated,function(req , res){
	switch(req.query.package_id){
		case '111':
			var package_id='P-7GK47613232225841MFXCV2Q';
			break;
		case '222':
			var package_id='P-9P503834VT1309506MF7BLSI';
			break;
		case '333':
			var package_id='P-8873523646632301LMFXC6UY';
			break;
	}
	fetch(authUrl, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Authorization': `Basic ${base64}`,
        },
        body: 'grant_type=client_credentials'
    }).then(function(response) {
        return response.json();
    }).then(function(data) {
        console.log("succ");
        console.log(data.access_token);
        if(data.access_token){
			res.render('payments/payments',{
				layout :'main',
				package_id : package_id,
				access_token : data.access_token
			  })
        }else{
            res.send("there is no token");
        }
    }).catch(function() {
        console.log("fail");
        console.log("couldn't get auth token");
    });
	
})

router.post('/paypal/success',(req,res)=>{
	console.log("on success");
	var sub_id = req.body.subscriptionID;
	var access_token=req.body.facilitatorAccessToken;
	console.log(sub_id+":"+access_token);
	// fetch("https://api-m.sandbox.paypal.com/v1/billing/subscriptions/"+encodeURI(sub_id), {
	//   headers: {
	// 	Authorization: encodeURI(access_token) ,
	// 	'Content-Type': 'application/json'
	//   }
	//   }).then(function(response){
	// 	return response.json();
	//   }).then(function(data){
	// 	console.log(data);
	//   }).catch(function(error){
	// 	console.log("failed");
	// 	console.log(error);
	//   });
  
 
 var headers = {
     'Content-Type': 'application/json',
     'Authorization': 'Bearer '+access_token
 };
 
 var options = {
     url: 'https://api-m.sandbox.paypal.com/v1/billing/subscriptions/'+sub_id,
     headers: headers
 };
 
 function callback(error, response, body) {
     if (!error && response.statusCode == 200) {
         subscriber.findOne({_id:req.user._id},function(err,_sub){
			 if(err){
				console.log('cant fetch subscriber details upon saving subscription');
				res.status(500).json({error : "server errror"});
			 }else{
                var results = JSON.parse(body);
	
				 _sub.Subscriber_id=results.id;
				 _sub.Plan_id=results.plan_id;
				 _sub.Start_time=results.start_time;
				 _sub.Status_Update_Time=results.status_update_time;
				 _sub.Payment_email_address=results.subscriber.email_address;
				 _sub.save(function(err){
					 if(err){
						console.log('cant fetch save subscriber datails');
						res.status(500).json({error : "server errror"});
					 }else{
						console.log('done');
                        res.redirect('/subscriber/getstarted');
					 }
				 })
			 }
		 })
     }else if(error){
         console.log("error:"+error);
 	}else{
 		console.log(response.body);
 		console.log(response.statusCode);
 	}
 }
 
 request(options, callback);
 })















//post user signup for newsletter 
router.post('/newsletter/signup',
	 body('userName').not().isEmpty().withMessage('provide user name'),
	 body('userSurname').not().isEmpty().withMessage('provide user surname'),
	 body('userEmail').not().isEmpty().withMessage('provide email'),
	 function(req ,res){
	 	 const error = validationResult(req);
  		if(!error.isEmpty()){
			res.status(200).send({message : error,successful : 0});
			}
		else{
	      var name = req.body.userName;
	      var surname = req.body.userSurname;
	      var email = req.body.userEmail;
          
         async function main(){
         let testAccount = await nodemailer.createTestAccount();
     	 console.log("test account is"+testAccount.user+" password is:"+testAccount.pass);
     	 let transport = nodemailer.createTransport({
     		host : "smtp.gmail.com",
     		auth: {
     		port : 465 ,
     		secure : true ,
     			user : "brightonwizelvis21@gmail.com" ,
     			pass : "Clarioncall21"
     		},

     	});

     	 let info = await transport.sendMail({
     	 	from : '"infinity quo"<brightonwizelvis21@gmail.com>',
     	 	to : email,
     	 	subject : "newsletter subscription",
     	 	text :"hello "+name,
     	 	html : "html"
     	 });
     	 console.log("message sent:%s",info.messageId);
     	 console.log("Preview URL:%s",nodemailer.getTestMessageUrl(info));
         }


         main().catch(console.error);
        

	      /*var options={
	      	url:"",
	      	method:'POST',
	      	headers:{
	      		Authorisation : ""
	      	},
	      	body:postData
	      }
	      request(options,(err, response , body)=>{

	      })*/
         }
});

module.exports = router;