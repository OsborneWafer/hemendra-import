const knex = require('knex'); // Assuming Knex.js
const dotenv = require("dotenv");
const fs = require('fs');

// config
dotenv.config({ path: ".env" });

console.log(process.env.HOST, process.env.DBUSER, process.env.PASSWORD, process.env.DBNAME)

/* const config = {
    client: 'mysql',
    connection: {
        host: process.env.HOST,
        user: process.env.DBUSER,
        password: process.env.PASSWORD,
        database: process.env.DBNAME,
        // port: process.env.PORT_DB,
    },
    pool: {
        min: 0,
        max: 25,
        acquireTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
    },
}; */



 const config = {
     client: 'mysql2',
     connection: {
         host: process.env.HOST,
         user: process.env.DBUSER,
         password: process.env.PASSWORD,
         database: process.env.DBNAME,
         port: process.env.PORT_DB,
         ssl: {
             rejectUnauthorized: true,
             ca: fs.readFileSync("ca.pem").toString(),

         },
     },
     pool: {
         min: 0,
         max: 12,
         acquireTimeoutMillis: 5000,
         idleTimeoutMillis: 600000
     },
     debug: true
 };


const db = knex(config);

db.raw('SELECT VERSION()').then((result) => {
    console.log('db connection successfully')
}).catch((err) => {
    console.log('db connection error ', err)
});

module.exports = db;
