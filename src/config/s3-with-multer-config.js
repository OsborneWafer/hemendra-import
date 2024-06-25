const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const dotenv = require("dotenv");




// config
dotenv.config({ path: ".env" });



const s3 = new AWS.S3({
    accessKeyId: process.env.S3ACCESSKEY,
    secretAccessKey: process.env.S3SECRATEKEY,
    region: process.env.S3REGION,
});

exports.upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.Bucket_Name,
    }),
});


