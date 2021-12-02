const express = require('express');
const router = express.Router();
const passport = require('passport');
const ensureAuthenticated = require('../../config/authentication');
const {body , validationResult} = require('express-validator');


router.get("/upload",function(req , res){
	res.render("admin/videos/upload",{
		layout : "admin",
	});
});

router.post("/upload",function(req , res){

req.busboy.on('file' , function(fieldname , file , filename , encoding , mimetype){
     console.log("inside the file on");
	});
req.busboy.on('field',function(key , value , keyTruncated , valueTruncated){
     console.log('inside the field on')
	});
   
});


module.exports = router;