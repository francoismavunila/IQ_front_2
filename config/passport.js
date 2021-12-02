const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const admin = require('../models/admin_profile');
const subscriber = require('../models/subscriber_model');

module.exports = function (passport){
	passport.use('admin',
       new LocalStrategy({usernameField : 'email'},function(email , password , done){
       	admin.findOne({Email : email},function(err , user){
       		if(err){
            console.log('server eror');
       			return done(err,{message : 'server error'});
            
       		}
       		if(!user){
            console.log('user not registered');
       			return done(null , false);
            

       		}
            bcrypt.compare(password ,user.Password , function(err , isMatch){
            	if(err){
                throw err;
                console.log('password auth erroe');
              } 

            	if(isMatch){
                console.log('admin found');
				
            		return done(null , user);
                
            	}
            	else{
                console.log('wrong password');
            		return done(null , false ,{message : 'incorrect password'});
                
            	}
            })
       	})
       })
		);

		passport.use('sub',
			new LocalStrategy({usernameField : 'email'},function(email , password , done){
				subscriber.findOne({Email : email},function(err , user){
					if(err){
				 console.log('server eror');
						return done(err,{message : 'server error'});
				 
					}
					if(!user){
				 console.log('user not registered');
						return done(null , false);
				 
	 
					}
				 bcrypt.compare(password ,user.Password , function(err , isMatch){
					 if(err){
					 throw err;
					 console.log('password auth error');
				   } 
	 
					 if(isMatch){
					 console.log('subscriber found');
				
						 return done(null , user);
					 
					 }
					 else{
					 console.log('wrong password');
						 return done(null , false ,{message : 'incorrect password'});
					 
					 }
				 })
				})
			})
			 )
//called during login during login request
	passport.serializeUser(function(user , done){
    console.log("ser");
		done (null , user);
	});
//called on all subsequent requests , it is called by passport.session()  
//   passport.deserializeUser(function(id ,done){
// 	subscriber.findById(id , function(err , user){
//         console.log('des');
// 		if(user==null){
// 			console.log("welcome admin");
// 			done(err , user);
// 		}else{
// 			console.log("welcome subcriber"+user);
//     		done(err , user);
// 		}
// 	});
//     });
// // }
passport.deserializeUser(function(user ,done){
    if(user!=null){
    done(null,user);
	}
});

 }