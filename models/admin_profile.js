var mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
	Name : {
		type : String ,
		required : true
	},
	Surname : {
		type : String ,
		required : true
	},
	Password :{
		type : String,
	},
    Department :{
    	type : String ,
    },
   Email : {
   	type : String
   },
   AdminPower :{
   	type : Boolean 
   },
    CellNumber :{
    type : String 
   },
   About :{
   	type : String
   },
   Image :{
   	type : String
   },
   Position :{
    type : String
   },
   UserType: { 
       type: String, 
       default: 'admin' 
    }

},
{timestamps : true});

const admin = mongoose.model('Admin_Profiles',AdminSchema);

module.exports = admin;