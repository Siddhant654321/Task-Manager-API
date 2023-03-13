const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'fosterpatricia365@gmail.com',
        subject: 'Welcome to Task Manager',
        html: `Welcome to app ${name}. Let me know how you get along with the app.`
    })
}

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'fosterpatricia365@gmail.com',
        subject: 'Your Account is deleted',
        text: `We are sorry to hear that you have deleted your account ${name}. Please let me know if there's anything we could have done to kept you onboard by replying back to this email.`
    })
}

module.exports = {sendWelcomeEmail, sendCancellationEmail}