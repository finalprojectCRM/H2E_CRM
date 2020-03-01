var node_mailer = require('nodemailer');

var transporter = node_mailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'h2e.crm@gmail.com',
        pass: 'H2E_CRM!@'
    }
});

var mailOptions = {
    from: 'h2e.crm@gmail.com',
    to: 'yebolenko@gmail.com',
    subject: 'Sending Email using Node.js',
    text: 'That was easy!'
};

transporter.sendMail(mailOptions, function(error, info){
    if (error) {
        console.log(error);
    } else {
        console.log('Email sent: ' + info.response);
    }
});