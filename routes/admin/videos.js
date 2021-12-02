const express = require('express');
const router = express.Router();
const passport = require('passport');
const ensureAuthenticated = require('../../config/authentication');
const {body , validationResult} = require('express-validator');
const vid = require('../../models/videos');
const fs = require('fs-extra');


router.get("/upload",ensureAuthenticated,function(req , res){
	res.render("admin/videos/upload",{
		layout : "admin",
	});
});

router.post("/upload",ensureAuthenticated,function(req , res){
  console.log("here");
   var video = new vid({
            	Name : '',
            	Description :'',
            	VidPath : '',
            	VidThumbnail : ''
            })

   var dir;
   var path;
   var name='';

    //for input name
     req.busboy.on('field',function(fieldname ,val, fieldnameTruncated , valTruncted , encoding , mimetype){

     	if(fieldname == 'vid_name'){
 			console.log('fieldname is '+ fieldname);
			name = val;
			console.log('name is '+name);
			video.Name = val;
			console.log('the name of the video is'+video.Name);
     	}
     	else if(fieldname == 'vid_description'){
     		console.log('value is '+ fieldname);
		    video.Description= val;
     	}
	
	});


  //for file upload
	req.busboy.on('file',function(fieldname , file , filename , transferencoding , mimetype){

       	if(fieldname == 'video'){
	 		 	console.log('this is for '+ fieldname);
			     if(name==''){
	              name = filename;
			     }
			     dir ='uploads/videos/'+name;
			    console.log(dir);
		     	 fs.ensureDir(dir).then(function(){
	                path = dir+'/'+filename;
	     	       file.pipe(fs.createWriteStream(path));
		     	});
		  
				
		  
		     file.on('end',function(data){
		     	console.log('finished');
	           video.VidPath= path;
		     });
        
     	}
     	else if(fieldname == 'thumbnail'){
     		   console.log('this is for' + fieldname);
		      fs.ensureDir(dir).then(function(){
                path = dir+'/'+filename;
     	       file.pipe(fs.createWriteStream(path));
	     	});
			
		     file.on('end',function(data){
		     	console.log('finished');
	           video.VidThumbnail= path;
		     });
	        
     	}
	

	
	});


	req.busboy.on('finish' , function(){
		console.log('Done parsing form!');
		video.save(function(err){
			if(err){
				console.log('error saving entry on database');
				req.flash('error_msg','error while saving user');
				res.status(500).json({error : "server error , couldnt save entry on database"}); 
			}
			    else{
			res.redirect('/admin/users'); 
		    }
		    
		});
		
		
	});
	
 req.pipe(req.busboy);
});

module.exports = router;

      const youtube = google.youtube({
                      version:"v3",
                      auth:oAuth2Client
                    })
                         youtube.videos.insert(
                          {
                            resource: {
                              // Video title and description
                              snippet: {
                                  title:"testing",
                                  description: "description",
                                  tags:"tags"
                              },
                              status: {
                                privacyStatus: "private",
                              },
                            },
                            // This is for the callback function
                            part: "snippet,status",

                            // Create the readable stream to upload the video
                            media: {
                              body: fs.createReadStream(path),
                            },
                          },
                          (err, data) => {
                            if(err){
                              console.log(err);
                               res.status(200).send({message : " error while uploading article ",successful : 0});
                              throw err;
                              res.render("")
                            } 
                            console.log(data)
                            console.log("Done.");
                            //fs.unlinkSync(videoFilePath);
                            res.render("index", { name: 'name', pic: 'pic', success: true });
                          }
                        );