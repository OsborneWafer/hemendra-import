
const jwt = require("jsonwebtoken");

const getJWTToken = (userid) => {
    return jwt.sign(
        { id: userid, },
        process.env.JWT_SECRET.toString("utf-8"),
        {
            expiresIn: process.env.LOGIN_TOKEN_EXPIRE,
            algorithm: "HS256",
        }
    );
};

module.exports = { getJWTToken }