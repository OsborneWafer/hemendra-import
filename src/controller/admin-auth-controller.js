
const Errorhandler = require("../utils/error-handeler");
const db = require('../config/db');
const catchAsyncError = require("../middlewares/catchAsyncError");
const bcrypt = require('bcrypt');
const { generateOtp } = require("../utils/generate-otps");
const { sendOtpEmail } = require("../utils/email-sender");
const { getJWTToken } = require("../utils/jwtTokens");

exports.createAdmin = catchAsyncError(async (req, res, next) => {
    const { fname, lname, email, password } = req.body;

    // Input validation
    if (!fname || !lname || !email || !password) {
        return next(new Errorhandler("Invalid inputs", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Insert admin data with hashed password
        await db('tbl_admin').insert({
            fname,
            lname,
            email,
            password: hashedPassword,
            admin_type: 1,
        });

        res.status(201).json({
            success: true,
            message: "Admin created successfully",
        });
    } catch (error) {
        console.error(error);
        next(new Errorhandler("Failed to create admin", 500));
    }
});


exports.adminLogin = catchAsyncError(async (req, res, next) => {
    const { email, password } = req.body


    //Input validation
    if (!email, !password) {
        return next(new Errorhandler('Invalid Cridentials', 400))
    }


    try {
        const admin = await db('tbl_admin').where({ email: email }).first();
        if (!admin) {
            return next(new Errorhandler('Invalid Credentials', 400));
        }

        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return next(new Errorhandler('Invalid Credentials', 400)); // Unauthorized if password doesn't match
        }

        const otp = generateOtp();



        try {
            await db('tbl_admin')
                .update({ otp_hash: await bcrypt.hash(otp, 10), otp_created_on: new Date() })
                .where({ email });

            // Send OTP email to the admin (replace with your email sending logic)
            await sendOtpEmail(email, otp);

            res.status(200).json({
                success: true,
                data: { userid: admin.id },
                message: 'A verification code has been sent to your registered email address.',
            });
        } catch (error) {
            console.error(error); // Log the error for debugging
            next(new Errorhandler('Failed to send OTP', 500)); // Handle errors gracefully
        }


    } catch (error) {
        console.error(error);
        next(new Errorhandler('Failed to login admin', 500)); // Handle internal errors
    }
})


exports.adminLoginWithOtp = catchAsyncError(async (req, res, next) => {
    const { otp, userid } = req.body
    try {

        const admin = await db('tbl_admin').where({ id: userid }).select('id', 'email', 'fname', 'lname', 'otp_hash', 'otp_created_on').first()

        const validOtpWindow = 60000; // 1 min
        const isOtpValid = await bcrypt.compare(otp, admin.otp_hash)
        const isOtpExpire = (Date.now() - admin.otp_created_on.getTime()) > validOtpWindow;
        if (!isOtpValid || isOtpExpire) {
            return next(new Errorhandler('Invalid Otp', 400))
        }

        const jwtToken = await getJWTToken(admin.id)
        await db('tbl_admin').update({ login_status: 1, auth_token: jwtToken, last_login: new Date(Date.now()) }).where({ id: admin.id })


        res.status(200).json({
            success: true,
            adminData: {
                fname: admin.fname,
                lname: admin.lname,
                email: admin.email,
                id: admin.id
            },
            token: jwtToken,
            message: 'Login Successfully!'
        })

    } catch (error) {
        console.error(error);
        next(new Errorhandler('Failed to OTP varification ', 500)); // Handle internal errors
    }
})


exports.adminlogOut = catchAsyncError(async (req, res, next) => {
    try {
        await db('tbl_admin').update({ auth_token: " ", login_status: 0 }).where({ id: req.user.id || req.body.adminId })
        res.status(200).json({ success: true, message: 'Logout successfully' })

    } catch (error) {
        console.error(error);
        next(new Errorhandler('Internal Server Error', 500)); // Handle internal errors
    }
})