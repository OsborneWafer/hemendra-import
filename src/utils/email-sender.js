const nodemailer = require("nodemailer");


// Create a nodemailer transporter using your email service credentials
const transporter = nodemailer.createTransport({
    service: "gmail", // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER_DETAILS,
        pass: process.env.EMAIL_PASSKEY,
    },
    tls: {
        rejectUnauthorized: false, // Allow self-signed certificates for devlopment not for the production
    },
});


async function sendOtpEmail(email, otp) {

    const mailOptions = {
        from: process.env.SENDER_EMIAL,
        to: email,
        subject: "OTP Verification",
        text: `Your OTP for verification is: ${otp}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email} with OTP.`);
    } catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
        
    }
}


module.exports = { sendOtpEmail }