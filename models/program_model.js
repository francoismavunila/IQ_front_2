var mongoose = require('mongoose');

const ProgramSchema = new mongoose.Schema({
	Name : {
		type : String ,
		required : true
	},
	Category : {
     type : String ,
	 required : true
	},
	Description : {
		type : String ,
		required : true
	},
	Program_image :{
		type : String,
		
	},
	Price :{
		type : String,
		required : true
	},
	Duration:{
    type : String ,
    required : true
    },
	Trainer :{
     type:String,
     required : true
	},
	Date :{
    type : String ,
    required : true
    },
    Start_time : {
    type : String ,
    required : true
    },
});

const programs = mongoose.model('programs',ProgramSchema);

module.exports = programs;