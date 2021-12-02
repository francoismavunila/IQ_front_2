var mongoose = require('mongoose');

const Products_catSchema = new mongoose.Schema({
	Name : {
		type : String ,
		required : true
	},
	Description : {
		type : String ,
		required : true
	}
});

const products_cat = mongoose.model('products_cat',Products_catSchema);

module.exports = products_cat;