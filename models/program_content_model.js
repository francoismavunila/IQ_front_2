var mongoose = require('mongoose');



const ProgramContSchema = new mongoose.Schema({
	ProgName : {
		type : String ,
		required : true
	},
  CatName : {
		type : String ,
		required : true
	},
  LessName : {
		type : String ,
		required : true
	},
  Video:[{
    	url :{
          type : String,
          sparse : true,
          unique : true  
        }, 
    }],
  Youtube:[{
      url :{
          type : String,
          sparse : true,
          unique : true  
        }, 
    }],
  Audio :[{
        url :{
          type : String,
          sparse : true,
          unique : true  
        } 
    }],
  Article :[{
    	url :{
          type : String,
          sparse : true,
          unique : true  
        } 
    }]
});

const program_content = mongoose.model('programs_content',ProgramContSchema);

module.exports = program_content;