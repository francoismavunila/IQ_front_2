const http = require('http'); //for http req and responses
const app = require('./app');
const fs = require('fs-extra');


//USE PORT 3001 UNLESS THERE IS A PRE-SCONFIGURED PORT
 const port = process.env.PORT || 5001;
//listens to the server and executes the express() function which handles request
/* const server = https.createServer({
  key: fs.readFileSync('52098948_www.infinityquo.com.key'),
  cert: fs.readFileSync('52098948_www.infinityquo.com.cert')
  }, app);*/

  const server = http.createServer(app);

 server.listen(port);


 //the process.env.PORT - THIS MAY BE CONFIGURED BY THE ENVIRONMENT I WHICH YOU ARE RUNNING YOUR SERVER (YOUR HOST)
 //HTTP.createserver(function())-listens to the server and executes the function passed in
// set OPENSSL_CONF= C:\Program Files\OpenSSL-Win64\bin\cnf/openssl.cnf