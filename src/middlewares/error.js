const Errorhandler = require("../utils/error-handeler");

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";

    // MySQL wrong ID error
    if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err &&
        err.message.includes("JSON")
    ) {
        const message = `Invalid MySQL ID`;
        return next(new Errorhandler(message, 400));
    }

    // MySQL duplicate key error
    if (err.errno === 1062) {
        const message = `Duplicate entry. ${err.message}`;
        return next(new Errorhandler(message, 400));
    }

    // MySQL authentication error
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
        const message = "Invalid credentials. Access denied.";
        return next(new Errorhandler(message, 401)); // 401 for unauthorized
    }

    // Wrong JWT error
    if (err.name === "JsonWebTokenError") {
        const message = `Json Web Token is invalid, Try again`;
        err = new Errorhandler(message, 400);
    }

    //  JWT expire error
    if (err.name === "TokenExpiredError") {
        const message = `Json Web Token is Expired, Try again`;
        err = new Errorhandler(message, 400);
    }

    res.status(err.statusCode).json({
        success: false,
        error: err.message,
    });
};
