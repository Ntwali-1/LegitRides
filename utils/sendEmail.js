const nodemailer = require('nodemailer')
require('dotenv').config()

async function sendEmail(to,subject,text) {
  const transporter = nodemailer.createTransport({
    service:'gmail',
    auth:{
      user:process.env.EMAILUSER,
      pass:process.env.EMAILPASS
    }
  })

  const mailOptions = {
    from:process.env.EMAIL,
    to,
    subject,
    text
  }

  await transporter.sendMail(mailOptions);
}

module.exports = sendEmail;

