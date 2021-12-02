var mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
	Name : {
		type : String ,
		required : true
	},
	Program : {
     type : String ,
	 required : true
	},
	Description : {
		type : String ,
		required : true
	},
	Date :{
	type : String ,
	required : true
	},
	Start_time : {
	type : String ,
	required : true
	}
});

const lesson = mongoose.model('lessons',LessonSchema);

module.exports = lesson;