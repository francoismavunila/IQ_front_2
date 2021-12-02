

const fs = require('fs-extra');
const readline = require('readline');
const assert = require('assert')
const express = require('express');
const router = express.Router();
const { google } = require("googleapis");
const OAuth2Data = require('../../client_secret.json');
const CLIENT_ID = OAuth2Data.web.client_id;
const CLIENT_SECRET = OAuth2Data.web.client_secret;
const REDIRECT_URL = OAuth2Data.web.redirect_uris[0];
const cat = require('../../models/program_categories');
const programs = require('../../models/program_model');
const program_content = require('../../models/program_content_model');

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
 REDIRECT_URL
);
var authed = false;
var title , description;
var tags = [];
const SCOPES =
  "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/userinfo.profile";

router.get("/",function(req , res){
    if(!authed){
    var url = oAuth2Client.generateAuthUrl({
       access_type: 'offline',
       scope: SCOPES
    });
    res.render("admin/programs/youtube-upload",{
      layout : "admin",
      url : url
    })
  }else{
  
    res.render("admin/programs/youtube-content",{
      layout:"admin"
    })
  }
});
router.get("/upload",function(req , res){
  var code = req.query.code;
  if(code){
      oAuth2Client.getToken(code, (error, token) => {
        if(error) throw error;
         console.log("authenticated");
         oAuth2Client.setCredentials(token);
         authed = true;
         res.redirect("/admin/youtube")
      })
  }
})
router.post("/upload/vid",function(req , res){

  function youtubeUpload(path){
    var path = path;
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
                            res.status(200).send({message : "successfully uploaded to youtube",successful : 1});
                            //fs.unlinkSync(videoFilePath);
                            //res.render("index", { name: 'name', pic: 'pic', success: true });
                          }
                        );
  };


 var dir;
            var path;
            var _prog_cont;
            var name = "testing";
            var title = "testing";

          req.busboy.on('field',function(fieldname ,val, fieldnameTruncated , valTruncted , encoding , mimetype){
                    console.log("executing the req.busboy.on(field,.....");

                  if(fieldname=="prog_name"){
                           name = "testing";
                           console.log(name);
                           console.log("1");
                  }else if(fieldname=="prog_title"){
                            title = val;
                                
                          }
                     
                });


           
       req.busboy.on('file',function(fieldname , file , filename , transferencoding , mimetype){
            console.log("in file now and file name"+filename);         
            if(filename !=""){
                            console.log(name + ' '+ title);
                  dir ='programs/'+name+'/'+title+'/videos';
                  console.log(dir);
                   fs.ensureDir(dir).then(function(){
                          global.path = dir+'/'+filename;
                          //console.log(path);
                       file.pipe(fs.createWriteStream(global.path));
                  }).catch(err=>{
                    console.log("failed to create directory with error"+err);
                    res.status(200).send({message : " error while uploading video ",successful : 0});
                  });

                file.on('end',function(data){
                  console.log("path is "+global.path);

                   program_content.findOne({Title : title} ,function(err , _program_cont){
                    console.log(name + ' '+ title);

                    if(_program_cont){
                                      _program_cont.Video.push({"url" : path});
                                        _program_cont.save(function(err){
                      if(err){
                          console.log(err);
                          res.status(200).send({message : " error while uploading video ",successful : 0});
                                          console.log("error , could not save video ");
                        }
                      else{
                           console.log("uploaded successfully to the server");
                           //res.status(200).send({message : "video successfully uploaded  ",successful : 1}); 
                           youtubeUpload(global.path); 
                          }
                    });

                    }else {
                   //res.status(200).send({message : " error while uploading video ",successful : 0});
                   console.log("error , could not find programs content");
                    }
                   })
                 });

            }else{
                 res.status(200).send({message : "empty "+fieldname+"!!!",successful : 0}); 
            }
                
                


                 
          });
                  

        req.busboy.on('finish' , function(){
            console.log('Done parsing form!');
               //youtubeUpload(global.path);
               console.log("on file end "+global.path);
          });
          
      req.pipe(req.busboy);
});


module.exports = router;