var mongoose = require('mongoose');

const SubscriberSchema = new mongoose.Schema({
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
        required : true
	},
    Email :{
    	type : String ,
        required : true
    },
    Subscriber_id : {
   	type : String
   },
   Plan_id :{
   	type : String
   },
   Start_time :{
    type : String 
   },
   Status_Update_Time :{
   	type : String
   },
   Payment_email_address :{
   	type : String
   },
   UserType: { 
	type: String, 
	default: 'subscriber' 
 },
 Content:{
	 type: Array,
	 unique: false
 },
},
{timestamps : true});

const subscriber = mongoose.model('Subscriber_info',SubscriberSchema);

module.exports = subscriber;