module.exports = function(req ,res , next){
		if(req.isAuthenticated()){
			if(req.user.UserType=="subscriber"){
				console.log('sub isAuthenticated');
				return next();
			}else{
				req.flash('error' , 'Login to access the page');
				res.redirect('/subscriber');
			}
			
		}
		else{
			req.flash('error' , 'Login to access the page');
		 res.redirect('/subscriber');	
		}
	
	};
