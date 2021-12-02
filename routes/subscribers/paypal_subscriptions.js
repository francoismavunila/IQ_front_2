const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const request = require('request');

/*this was used at start to set up subscriptions , but letter I moved to the "subscribers/index" bcoz with this
was creating a new product and with everysubscription */
const authUrl = "https://api-m.sandbox.paypal.com/v1/oauth2/token";
const clientIdAndSecret = "ARxo1slqoFzPlTECeuhG9NmcqNxfQ5nfovsojfuZompOXWE4LLEDL66Br_xARnKdQ6gn0U-Cnfxu146o:EDCQ8-cHXfv_a1No4yoYPts4pIeuCN7ssVON9NwM1BpQN3B60UmL6AtusH6zzvoIuKg_tC49Nu41HgdA";
const base64 = Buffer.from(clientIdAndSecret).toString('base64')
//get the access token
router.get('/',(req,res)=>{
    var package_id = req.query.package_id;
    fetch(authUrl, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'en_US',
            'Authorization': `Basic ${base64}`,
        },
        body: 'grant_type=client_credentials'
    }).then(function(response) {
        return response.json();
    }).then(function(data) {
        console.log("succ");
        console.log(data.access_token);
        if(data.access_token){
            res.redirect("/payments/subscribe_paypal/product?access_token="+data.access_token+"&package_id="+package_id);
        }else{
            res.send("there is no token");
        }
    }).catch(function() {
        console.log("fail");
        console.log("couldn't get auth token");
    });
   });

 router.get('/product',(req,res)=>{
    var access_token = req.query.access_token;
    var id =encodeURI(uuidv4())
    var token = encodeURI(access_token);
    var package_id = req.query.package_id;
    console.log("token is"+token);
    console.log("id is"+id);
     var prod = {"name": "Video Streaming Service",
     "description": "Video streaming service",
    "type": "SERVICE",
    "category": "SOFTWARE",
    "image_url": "https://example.com/streaming.jpg",
     "home_url": "https://example.com/home"
    }
    var myProduct = JSON.stringify(prod);
    fetch("https://api-m.sandbox.paypal.com/v1/catalogs/products", {
        body: myProduct ,
        headers: {
          'Authorization': 'Bearer '+token ,
          'Content-Type': "application/json",
          'Paypal-Request-Id': id
        },
        method: "POST"
      }).then(function(response){
         return response.json();
      }).then(function(data){
          var prod_id= data.id;
          console.log(prod_id);
          res.redirect("/payments/subscribe_paypal/create_plan?access_token="+token+"&prod_id="+prod_id+"&package_id="+package_id)
      }).catch(function(){
        console.log("fail");
        console.log("couldn't get auth token");
      })

    
 })  
 
 router.get('/create_plan',(req,res)=>{
  // {\n      \"product_id\":"+prod_id_string+",\n      \"name\": \"Basic Plan\",\n      \"description\": \"Basic plan\",\n      \"billing_cycles\": [\n        {\n          \"frequency\": {\n            \"interval_unit\": \"MONTH\",\n            \"interval_count\": 1\n          },\n          \"tenure_type\": \"TRIAL\",\n          \"sequence\": 1,\n          \"total_cycles\": 1\n        },\n        {\n          \"frequency\": {\n            \"interval_unit\": \"MONTH\",\n            \"interval_count\": 1\n          },\n          \"tenure_type\": \"REGULAR\",\n          \"sequence\": 2,\n          \"total_cycles\": 12,\n          \"pricing_scheme\": {\n            \"fixed_price\": {\n              \"value\": \"10\",\n              \"currency_code\": \"USD\"\n            }\n          }\n        }\n      ],\n      \"payment_preferences\": {\n        \"auto_bill_outstanding\": true,\n        \"setup_fee\": {\n          \"value\": \"10\",\n          \"currency_code\": \"USD\"\n        },\n        \"setup_fee_failure_action\": \"CONTINUE\",\n        \"payment_failure_threshold\": 3\n      },\n      \"taxes\": {\n        \"percentage\": \"10\",\n        \"inclusive\": false\n      }\n    }





  "{\n \"name\":\"Premium Video Plus\",\n \"description\":\"Premium plan with video download feature\",  \n \"product_id\":"+prod_id_string+",\n \"billing_cycles\":[\n  {\n \"frequency\":{\n \"interval_unit\":"+period+",\n \"interval_count\":"+int_count+"},\n \"tenure_type\":\"REGULAR\",\n  \"sequence\":1,\n \"total_cycles\":0,\n  \"pricing_scheme\":{\n  \"fixed_price\":{\n  \"value\":"+price+",\n \"currency_code\":\"USD\" \n } \n }\n }\n ],\n \"payment_preferences\":{\"auto_bill_outstanding\":true,\n \"payment_failure_threshold\":1}}"
     var access_token = req.query.access_token;
    var package_id = req.query.package_id;
    var id = req.query.prod_id;
    var token = encodeURI(access_token);
    var prod_id = encodeURI(id);
    var prod_id_string = JSON.stringify(prod_id);
    var vari = 'MONTH';
    var varis = JSON.stringify(vari)
    switch(package_id){
      case '111':
        var period = "MONTH";
        var int_count = "1";
        var price= "10";
        var plan_name = "monthlySubscription";
        break;
      case '222':
        var period = "MONTH";
        var int_count = "3";
        var price= "50"; 
        var plan_name = "quartelySubscription";
        break;
      case '333':
        var period = "Year";
        var int_count = "1";
        var price= "75";
        var plan_name = "yearlySubscription";
        break;  
    }
  //  console.log("string :"+vari[0]+"json string :"+varis[0]);
    fetch("https://api-m.sandbox.paypal.com/v1/billing/plans", {
        body:"  {\n \"name\":\""+plan_name+"\",\n \"description\":\"Premium plan with video download feature\",  \n \"product_id\":"+prod_id_string+",\n \"billing_cycles\":[\n  {\n \"frequency\":{\n \"interval_unit\":\""+period+"\",\n \"interval_count\":\""+int_count+"\"},\n \"tenure_type\":\"REGULAR\",\n  \"sequence\":1,\n \"total_cycles\":0,\n  \"pricing_scheme\":{\n  \"fixed_price\":{\n  \"value\":\""+price+"\",\n \"currency_code\":\"USD\" \n } \n }\n }\n ],\n \"payment_preferences\":{\"auto_bill_outstanding\":true,\n \"payment_failure_threshold\":1}}" ,
        headers: {
          // Accept: "application/json",
          Authorization: 'Bearer '+token,
          'Content-Type': 'application/json',
          // 'Paypal-Request-Id': 'PLAN-18062020-001',
          // Prefer: 'return=representation'
        },
        method: "POST"
      }).then(function(response){
        return response.json();
      }).then(function(data){
        var plan_id = data.id;
        console.log(period);
        console.log(data);
        res.redirect("/payments/subscribe_paypal/pay?access_token="+access_token+"&plan_id="+plan_id)
      }).catch(function(error){
        console.log("plan creation fail");
        console.log(error);
      });
 })

 router.get('/pay',(req , res)=>{
   var access_token = req.query.access_token;
   var plan_id = req.query.plan_id;
   console.log(access_token+"and"+plan_id);
   res.render("payments/paypal_sub",{
     plan_id : plan_id,
     access_token:access_token
   })
 
	})
  

module.exports = router;
