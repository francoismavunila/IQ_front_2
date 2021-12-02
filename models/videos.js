var mongoose = require('mongoose');

const vidSchema = new mongoose.Schema({
	Name : {
		type : String ,
		required : true
	},
	Description : {
		type : String ,
		required : true
	},
    VidPath : {
    type : String ,
    required : true
  },
   VidThumbnail :{
		type : String,
	}
});

const vid = mongoose.model('videos',vidSchema);

module.exports = vid;