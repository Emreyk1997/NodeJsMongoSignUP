const sgMail = require('@sendgrid/mail')
const config = require('../config')

sgMail.setApiKey(config.emailAPI.key)

const sendConfirmationEmail = (email, name) => {
    // console.log(config.emailAPI.key)
    sgMail.send({
        to: email,
        from: 'maslak42.food@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the Chatting app, ${name}. Let me know how you get along with the app.`
    }).then(() => console.log('Mail sent successfully'))
    .catch(error => console.error(error.toString()));
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'maslak42.food@gmail.com',
        subject: 'Sorry to see you go!',
        text: `Goodbye, ${name}. I hope to see you back sometime soon.`
    })
}

module.exports = {
    sendConfirmationEmail,
    sendCancelationEmail
}