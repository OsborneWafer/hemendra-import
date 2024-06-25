const express = require('express')
const app = express()
const cors = require('cors')
const compression = require('compression')
const errorHandlerMiddleware = require("./middlewares/error");
const morgan = require("morgan");
const multer = require('multer');
const serverless = require("serverless-http");
const router = express.Router()


app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(
    cors({
        exposedHeaders: ["Authorization"],
        origin: "*",
    })
);




app.use(morgan("dev"));
app.use(compression())


// routes 
const adminAuthRoute = require('./routers/admin-auth-router')
const userRoutes = require('./routers/user-routers');

router.get('/api/v1/teasting', async (req, res) => {
    console.log('i am working')
    res.status(200).json({ message: 'i have sended the response', success: false })
})

app.use('/api/v1', adminAuthRoute)
app.use('/api/v1', userRoutes)

// hemendra 
//Express Error Handling

app.use(errorHandlerMiddleware)

app.use(`/.netlify/functions/api`, router);

// Export the app and the serverless function
module.exports = app;
module.exports.handler = serverless(app);