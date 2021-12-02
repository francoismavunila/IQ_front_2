const express = require('express');
const router = express.Router();
var paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AbedWA0HlIqpiCh5ld69Y57xnmpD8hew3JppSXCGHXmSPTWiuIJQfq0JnKp-eFaXLELOqBmVUo-cQbCx',
  'client_secret': 'EH_rtSh_JmdVFhc9tLE-UBtEdjRkWv4kPEBtkeoHS97CPnfeWoi1eXmy6zVhuZ14LtQyJdFLXw767Zrm'
});

router.get('/',(req,res)=>{
 res.render("payments/payment");
});


router.post('/',(req,res)=>{
        const create_payment_json = {
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "redirect_urls": {
                "return_url": "http://localhost:5001/payments/success",
                "cancel_url": "http://localhost:5001/payments/cancel"
            },
            "transactions": [{
                "item_list": {
                    "items": [{
                        "name": "item",
                        "sku": "item",
                        "price": "1000.00",
                        "currency": "USD",
                        "quantity": 1
                    }]
                },
                "amount": {
                    "currency": "USD",
                    "total": "1000.00"
                },
                "description": "This is the payment description."
            }]
        };
        
        
        paypal.payment.create(create_payment_json, function (error, payment) {
            if (error) {
                throw error;
            } else {
                console.log(payment);
              for(let i=0 ;i<payment.links.length;i++){
                  if(payment.links[i].rel=="approval_url"){
                      res.redirect(payment.links[i].href);
                  }
              }
            }
        });
});

router.get('/cancel',(req,res)=>{
 res.send("making paymet");
});
router.get('/success',(req,res)=>{
 var payerId=req.query.PayerID;
 var paymentId=req.query.paymentId;
 
const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "1000.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
            res.send('payment done');
        }
    });
});

module.exports = router;