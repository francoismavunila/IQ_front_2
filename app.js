const express = require('express');
const path = require('path');//provides utilities for working with file and directory paths
const mongoose = require('mongoose'); //data base management
const hbs = require ('express-handlebars');//tamplating engine
const hbsHelpers = require('handlebars-helpers');
const session = require('express-session');//for session management
const {body , validationResult} = require('express-validator');//for validation
const bodyParser = require('body-parser');//used to pass variables from the body(forms)
const fileUpload = require('express-fileupload');//for uploading files
const flash = require('connect-flash');
const passport = require('passport');
const busboy = require('connect-busboy');
require("./config/passport")(passport);
const helpers = hbsHelpers();
require('dotenv').config('./config.env');
//console.log(process.env);
//connect to db
//connection to atlas
//mongodb+srv://Francois:<password>@cluster0.jcxen.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
//mongoose.connect(database.IQ_database);
console.log('database is'+process.env.DATABASE_LOCAL);
mongoose.connect('mongodb://localhost/IQ_database', {ssl : false});
const db = mongoose.connection;
db.on('error',console.error.bind(console , 'connection error:'));
db.once('open', function(){
	console.log('connected......');
})

//express

//initialize app
app = express();

var hb = hbs.create({
    helpers: {
		ifEquals:function(arg1, arg2, options) {
			return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
		}
    },
    layoutsDir:__dirname + '/views/layouts/',
    extname:'hbs',
	
});

app.engine('hbs', hb.engine);
//set up the view engine
//app.engine('hbs', hbs({helpers: helpers , extname:'hbs' , layoutsDir:__dirname + '/views/layouts/'}));//sets the  extension for the templating engine
app.set('views', path.join(__dirname,'views'));//sets directory where to look for view files
app.set('view engine','hbs');//sets the  view engine as handle bars



//set up the public folder for serving static files
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'uploads')));


//express validator middleware
//app.use(body());




//set up bodyparser middleware for adding the body data to the request object
app.use(bodyParser.urlencoded({
	limit : '50mb',
	extended:true
}));
app.use(bodyParser.json({
	limit : '50mb',
	extended : true
}));
//app.use(express.urlencoded());
//app.use(fileUpload());
//app.use(busboyBodyParser());
app.use(busboy());



//Express session middleware
app.use(session({
  secret: 'password',
  resave: true,
  saveUninitialized: true,
  //cookie: { secure: true }????????
}));

//flash connect
app.use(flash());//adds req.flash() function to the request
/*app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});
*/

//global variables
app.use(function(req ,res , next){
	res.locals.error = req.flash('error');
	res.locals.suc = req.flash('success');
	res.locals.errors = req.flash('error_msg');
	res.locals.success = req.flash('success_msg');
	var date = new Date();
	res.locals.currentYear = date.getFullYear() ;
	//console.log(req.busboy)
	
	
	
	next();
});

//passport init and sess
app.use(passport.initialize());
app.use(passport.session());



app.use('/favicon.ico', express.static('images/favicon.ico'));


//path to files that will handle my routes
var index = require('./routes/index.js'); 
var admin_pannel = require('./routes/admin/index.js');
var articles = require('./routes/admin/articles.js');
var products = require('./routes/admin/products.js');
var payments   = require('./routes/payments/payments.js');
var paypal_subscription = require('./routes/subscribers/paypal_subscriptions.js');
//var audios = require('./routes/admin/audios.js');
//var videos = require('./routes/admin/videos.js');
var programs = require('./routes/admin/programs.js');
var subscribers = require('./routes/subscribers/index.js')

//directing or handling routes
app.use('/',index);
app.use('/subscriber',subscribers);
app.use('/admin', admin_pannel);
app.use('/admin/programs',programs);
app.use('/payments', payments);
app.use('/payments/subscribe_paypal', paypal_subscription);
app.use('/admin/products', products);
//app.use('/admin/quotes' , quotes);
//app.use('/admin/pages', pages);
//app.use('/admin/audios', audios);
//app.use('/admin/videos', videos);

app.use((req,res,next)=>{
	const error = new Error('Not Found');
	error.status=404;
	next(error);
})

app.use((err,req,res,next)=>{
	res.status(err.status || 500).json({
		message :err.message
	})
})


module.exports = app;

