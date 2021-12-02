const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport');
const ensureAuthenticated = require('../config/authentication');
const {body , validationResult} = require('express-validator');
const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const cat = require('../models/program_categories');
const cat1 = require('../models/products_categories');
const programs = require('../models/program_model');
const prod = require('../models/products_model');
const program_content = require('../models/program_content_model');
const admin = require('../models/admin_profile');
const lesson = require('../models/lesson_models');
const mime = require('mime');


router.get('/',function(req , res){
 res.render('index',{

 })
});


//get about us
router.get("/about" ,function(req , res){
     admin.find({}).lean().exec(function(err , _users){
       if(err){
          console.log("failed to change program details with error "+err);
          res.status(200).send({message : "server error",successful : 0});
       }
       res.render('about',{
       users : _users
     });
     });
  });


//get program categories
router.get("/programs" ,function(req , res){
	cat.find({}).lean().exec(function(err , _cat){
		if(err){
          	console.log('error fetching categories');
    	    res.status(500).json({error : "server error"});
		}else if(_cat){
			//console.log(_cat);
	        res.render("programs_categories",{
			layout : "admin_header",
			cat : _cat
		    });
		}else{
         	console.log('couldnt fetch cat');
    	    res.status(500).json({error : "server error"});
		}
	});
  });

//get program categories
router.get("/products" ,function(req , res){
 
   cat1.find({}).lean().exec(function(err , _cat){
      if(err){
            console.log('error fetching categories');
          res.status(500).json({error : "server error"});
      }else if(_cat){
          prod.find({}).lean().exec(function(err , _prod){
              if(err){
                     console.log('error fetching categories');
                   res.status(500).json({error : "server error"});
               }else if(_prod){
                  res.render("products",{
                     layout : "admin_header",
                     cat : _cat,
                     prod : _prod
                   }); 
               }
          });
     
      }else{
            console.log('couldnt fetch cat');
          res.status(500).json({error : "server error"});
      }
   });
  });




  //get programs
router.get("/programs/:id",function(req,res){
	var id = req.params.id;
   cat.findOne({_id : id} ,function(err , _cat){
   	if(_cat){
   		var catName = _cat.Name;
   		console.log('category found is ' + _cat);
   		programs.find({Category : catName}).lean().exec(function(err , _program){
              var today = new Date();
              var available =[];
               var not_available =[];
               _program.forEach(element => {
               var date  = new Date(element.Date);
              if(today.getTime()<date.getTime()){
               delete element.Video;
               delete element.Audio;
               delete element.Article;
               delete element.Youtube;
                    not_available.push(element)
              }else{
                     available.push(element);
              }
            });
            console.log(not_available);
            console.log(available);
   			if(_program){
		   			res.render("programs",{
		   			layout : 'admin_header',
		   			program_available : available,
                  program_unAvailable : not_available,
                  cat_name : catName
		   		});
   			}else if(err){
   				console.log('err0r is in the first '+err);
   			  console.log('error fetching program');
    	      res.status(500).json({error : "server error"});
   			}	else{
		   			res.render("program_categories",{
		   			layout : 'admin_header',
		   			program : _program,
                  cat_name : catName
		   		});
		   	}
   		});
   		
   	}else if(err){
   		console.log('error is in the second '+err);
     	console.log('error fetching programs');
    	res.status(500).json({error : "server error"});
   	}
   	else{
   		req.flash('error_msg', 'category not found');
   		res.redirect("/programs");
   	}
   });
});	
     
router.get('/lessons',(req , res)=>{
	var prog_name = req.query.prog_name;
	var cat_name = req.query.cat;
   var prog_image = req.query.prog_img;
	lesson.find({Program: prog_name}).lean().exec(function(err , _lessons){
      var today = new Date();
      var available =[];
       var not_available =[];
       _lessons.forEach(element => {
       var date  = new Date(element.Date);
      if(today.getTime()<date.getTime()){
            not_available.push(element)
      }else{
             available.push(element);
      }
   });
		if(err){
			res.status(500).json({error : "server error"});
         console.log("could not fetch lessons");
		}
		res.render("lessons",{
			layout :'main',
         prog_name: prog_name,
			cat_name : cat_name,
         prog_image : prog_image,
         available : available
		})
	})

});
//get program content
router.get("/program_content",function(req,res){
	var prog_name = req.query.prog_name; 
   var less_name = req.query.less_name;
   var cat_name = req.query.cat_name;
   	program_content.find({ProgName : prog_name,LessName:less_name,CatName:cat_name}).lean().exec(function(err , _prog_cont){
      if(_prog_cont){
		   		res.render("program_content",{
		   			layout : 'admin_header',
		   			program_cont : _prog_cont,
		   			prog_name : prog_name
		   		});
   			}else if(err){
   				console.log('err0r is in the first '+err);
   			  console.log('error fetching program');
    	      res.status(500).json({error : "server error"});
   			}	else{
		   			res.render("program_content",{
		   			layout : 'admin',
		   			program_cont : _prog_cont,
		   			prog_name : prog_name
		   		});
		   	}
   	});
});
  
router.get("/ourprograms",function(req,res){
   console.log("called");
   programs.find({}, function(err, result) {
      if (err) {
        res.send(err);
      } else {
      console.log(result);
      res.status(200).json({temp : 123});
      console.log("called after the end point");
      }
    })
    .limit(5);
});

 //get program content by id
router.get("/program_contents/:id",function(req,res){
	var prog_id = req.params.id; 
    
   	program_content.find({_id : prog_id}).lean().exec(function(err , _prog_cont){
      if(_prog_cont){
		   		res.render("program_content2",{
		   			layout : 'admin_header',
		   			program_cont : _prog_cont,
		   		});
   			}else if(err){
   				console.log('err0r is in the first '+err);
   			  console.log('error fetching program');
    	      res.status(500).json({error : "server error"});
   			}	else{
		   			res.render("admin/programs/program_content",{
		   			layout : 'admin',
		   			program_cont : _prog_cont,
		   			prog_name : prog_name
		   		});
		   	}
   	});
}); 


   //streams video files
  router.get('/program_content/video/streaming',function(req ,res){
      var doc_id = req.query.doc;
      var sub_id = req.query.sub;

      program_content.findOne({_id : doc_id },function(err ,_prog_cont){
         if(_prog_cont){
            var prog = _prog_cont.Video.id(sub_id);
           // console.log("video url"+prog);
               var fileStat = fs.statSync(prog.url);
               //console.log(fileStat);
               var fileSize = fileStat.size;
               var range = req.headers.range;
               console.log(range);
               if(range){
               	console.log("range available");
                   var parts = range.replace(/bytes=/,"").split("-");
                   var start = parseInt(parts[0],10);
                   var end = parts[1] ? parseInt(parts[1],10) : fileSize-1;
                   var chunkSize = (end-start)+1;
                   var file = fs.createReadStream(prog.url ,{start , end});
                   file.on("error", error=>{
                   	console.log("error reading file");
                   	console.log(error);
                   	res.sendStatus(500);
                   })
                   var vid_mime = mime.lookup(prog.url);
                   console.log(vid_mime);
                   var head= {
                   	   'content-Range' : 'bytes ' + start +"-"+ end + "/" + fileSize,
                   	   'Accept-Ranges' : 'bytes',
                   	   'Content-Length': chunkSize,
                   	   'Content-Type'  : vid_mime
                   }
                   console.log(head);
                   res.writeHead(206,head);
                   file.pipe(res);
               }else{
               	     var vid_mime = mime.lookup(prog.url);
               	     console.log(vid_mime)
               	     console.log('no range');
	                 res.writeHead(200 ,{
		               	"Content-Length":fileSize,
		               	"Content-Type" : vid_mime
	                 });
	                 fs.createReadStream(prog.url).pipe(res);
               }
               
             
               
         }else{
            console.log("cannot get prog content");
         }
      });
   
  });

//streaming audio files
   router.get('/program_content/audio/streaming',function(req ,res){
      var doc_id = req.query.doc;
      var sub_id = req.query.sub;

      program_content.findOne({_id : doc_id },function(err ,_prog_cont){
         if(_prog_cont){
            var prog = _prog_cont.Audio.id(sub_id);
            console.log("audio url"+prog.url);
               var fileStat = fs.statSync(prog.url);
               //console.log(fileStat);
               var fileSize = fileStat.size;
               var range = req.headers.range;
               console.log(range);
               if(range){
               	console.log("range available");
                   var parts = range.replace(/bytes=/,"").split("-");
                   var start = parseInt(parts[0],10);
                   var end = parts[1] ? parseInt(parts[1],10) : fileSize-1;
                   var chunkSize = (end-start)+1;
                   var file = fs.createReadStream(prog.url ,{start , end});
                   var audio_mime = mime.lookup(prog.url);
                   console.log(audio_mime);
                   var head= {
                   	   'content-Range' : 'bytes ' + start +"-"+ end + "/" + fileSize,
                   	   'Accept-Ranges' : 'bytes',
                   	   'Content-Length': chunkSize,
                   	   'Content-Type'  : audio_mime
                   }
                   console.log(head);
                   res.writeHead(206,head);
                   file.pipe(res);
               }else{
               	     var audio_mime = mime.lookup(prog.url);
               	     console.log('no range');
	                 res.writeHead(200 ,{
		               	"Content-Length":fileSize,
		               	"Content-Type" : audio_mime
	                 });
	                 fs.createReadStream(prog.url).pipe(res);
               }
               
             
               
         }else{
            console.log("cannot get prog content");
         }
      });
   
  });


//Sending docs
  router.get('/program_content/article/streaming',function(req ,res){
      var doc_id = req.query.doc;
      var sub_id = req.query.sub;

      program_content.findOne({_id : doc_id },function(err ,_prog_cont){
         if(_prog_cont){
            var prog = _prog_cont.Article.id(sub_id);
            console.log("article url"+prog.url);
               var data = fs.readFileSync(prog.url);
               console.log(data);
               res.contentType("application/pdf");
               res.send(data);
                
         }else{
            console.log("cannot get prog content");
         }
      });
   
  });


//products


module.exports = router;