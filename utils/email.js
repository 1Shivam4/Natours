const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new EmailUser(user,url).sendWelcome();
// creating a new email object to send the emails
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Jonas Schmedtmann <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'Twilio',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      });
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Send the actual email
  async send(template, subject) {
    // so in this case we want to create an html form the email and send that html as the email
    // so inseted of rendering the email pug template
    // we will define html option into the mail options section
    // 1) Render HTML based on the pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define the email options
    const mailOptions = {
      form: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html)
    };

    // 3) Create a transport and send email
    // await transporter.sendMail(mailOptions);
    await this.newTransport().sendMail(mailOptions);
  }

  // this will call out the browser which will do the actual sending to the client
  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (Valid for only 10 minutes'
    );
  }
};

// const sendMail = async options => {
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USERNAME,
//     pass: process.env.EMAIL_PASSWORD
//   }
// });

// const mailOptions = {
//   form: `Shivam Sahni <${process.env.EMAIL_FROM}>`,
//   to: options.email,
//   subject: options.subject,
//   text: options.message
// };

// await transporter.sendMail(mailOptions);
// };
