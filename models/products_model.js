var mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
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
	Product_image :{
		type : String,	
	},
	Price :{
		type : String,
		required : true
	},
    Contact : {
    type : String ,
    required : true
    },
});

const products = mongoose.model('products',ProductSchema);

module.exports = products;