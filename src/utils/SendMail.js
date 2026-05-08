const nodemailer = require('nodemailer')
const config = require('../config/config')

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: config.GOOGLE_CLOUD_USER,
        clientId: config.GOOGLE_CLOUD_CLIENT_ID,
        clientSecret: config.GOOGLE_CLOUD_CLIENT_SECRET,
        refreshToken: config.GOOGLE_CLOUD_REFRESH_TOKEN
    }
})

transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Sanjay Bairagi" <${config.GOOGLE_CLOUD_USER}>`, 
      to, 
      subject, 
      text,
      html, 
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendEmail