var mongoose = require('mongoose');

const DepartSchema = new mongoose.Schema({
	Name : {
		type : String ,
		required : true
	},
	Description : {
		type : String ,
		required : true
	},
  Goals : {
    type : String ,
    required : true
  },
	Head :{
		type : String,
	}
});

const depart = mongoose.model('departments',DepartSchema);

module.exports = depart;