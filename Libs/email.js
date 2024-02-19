const nodemailer = require('nodemailer');
module.exports = sendMail = (message) => {
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: "pataknrisbo@gmail.com",
            pass: "prsutaisteljaxD"
        }
    });
    transporter.sendMail(message, function(err, info) {
        if (err) {
        console.log(err)
        } else {
        }
    });
}