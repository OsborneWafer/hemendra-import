// Otp Generater
function generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000); // get 6 digit of an otp
    return otp.toString();
}



module.exports = { generateOtp }