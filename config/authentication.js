module.exports = function(req ,res , next){
		if(req.isAuthenticated()){
			if(req.user.UserType=="admin"){
				console.log('isAuthenticated');
				res.locals.prof_image = req.user.Image;
				res.locals.user_id=req.user._id;
				//console.log(req.user.Image);
				//console.log(req.user._id);
				return next();
			}else{
				req.flash('error' , 'Login to access the page');
				res.redirect('/admin');
			}
			
		}
		else{
			req.flash('error' , 'Login to access the page');
		res.redirect('/admin');	
		}
	
	};
