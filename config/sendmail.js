var nodemailer = require('nodemailer');

const sendEmail = async (options)=>{
    //create a transport to send mails
    let transport = nodemailer.createTransport({
        host : process.env.SMTP_HOST,
        port : process.env.SMTP_PORT,
        auth :{
            user : process.env.SMTP_EMAIL,
            pass : process.env.SMTP_PASSWORD
        },
    })

    //prepare message an send
    let message = {
        from : process.env.FROM_NAME +'<'+process.env.FROM_EMAIL+'>',
        to : options.email,
        subject: options.subject,
        html: options.html
    };

    let status = await transport.sendMail(message);
    console.log('sent '+status)
}

module.exports = sendEmail;