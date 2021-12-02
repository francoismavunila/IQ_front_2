var mongoose = require('mongoose');

const Course_catSchema = new mongoose.Schema({
	Name : {
		type : String ,
		required : true
	},
	Description : {
		type : String ,
		required : true
	}
});

const course_cat = mongoose.model('programs_cat',Course_catSchema);

module.exports = course_cat;