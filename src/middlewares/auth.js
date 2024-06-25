const db = require("../config/db");
const ErrorHandeler = require("../utils/error-handeler");
const catchAsyncError = require("./catchAsyncError");
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {

    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
        return next(
            new ErrorHandeler("Please log in to get access to this resource", 401)
        );
    }

    // Split the header into two parts: 'Bearer' and the actual token
    const [bearer, token] = authorizationHeader.split(" ");

    if (!token || bearer.toLowerCase() !== "bearer") {
        return next(
            new ErrorHandeler("Invalid authorization format. Use Bearer token.", 401)
        );
    }

    try {
        let decodedData;

        decodedData = jwt.verify(token, process.env.JWT_SECRET);

        const currentTime = new Date().getTime();

        // Check if the token has not expired
        if (decodedData.exp * 1000 < currentTime) {
            await db('tbl_admin').update({ auth_token: " ", login_status: 0 }).where({ id: decodedData.id })
            return next(
                new ErrorHandeler("Token has expired. Please log in again.", 401)
            );
        }

        req.user = await db('tbl_admin').where({ id: decodedData.id }).first()
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error);
        return next(new ErrorHandeler("Invalid token. Please log in again.", 401));
    }
});




// exports.authorizedRoles = (roll) => {
//     return (req, res, next) => {

//         if (req.user.usertype) {
//             return next(new ErrorHandeler(`User:" ${req.user.fname} " is not allowed to access this resource`, 403))
//         }
//         if (req.user.admintype !== roll && !req.user.is_verify && !req.user.is_blocked && !req.user.adminId) {
//             return next(
//                 new ErrorHandeler(
//                     `User:" ${req.user.fname} " is not allowed to access this resource`,
//                     401
//                 )
//             );
//         }

//         if (!req.user.is_active) {
//             return next(new ErrorHandeler("Admin Login require ", 401))
//         }

//         if (req.user.admintype !== 1 && req.user.login_device_count > 1) {
//             return next(new ErrorHandeler("Reach out the device Limit ", 401))
//         }

//         if (req.user.admintype === 1 && req.user.login_device_count > 5) {
//             return next(new ErrorHandeler("Reach out the device Limit ", 401))
//         }

//         next();
//     };
// };



