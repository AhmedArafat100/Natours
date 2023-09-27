const nodemailer = require('nodemailer');
const pug = require('pug');
const {htmlToText} = require('html-to-text');


module.exports=class Email{
  constructor(user,url){
    this.to=user.email;
    this.firsName=user.name.split(' ')[0];
    this.url=url;
    this.from='Ahmed Mahmoud <ahmeddmahmoud11122@gmail.com>';
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'mandrillapp',
        host:process.env.SENDBLUE_HOST,
        port:process.env.SENDBLUE_HOST,
        auth: {
          user: process.env.SENDBLUE_USERNAME,
          pass: process.env.SENDBLUE_PASSWORD
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure:false,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  }

  async send(template,subject){
     
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html,{
        wordwrap:130
      })
    };


    await this.newTransport().sendMail(mailOptions);
  }

  sendWelcome(){
   this.send('welcome','welcome To Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }



}

