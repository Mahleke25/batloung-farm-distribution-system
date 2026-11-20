const mysql = require('mysql2/promise');

let db;

if (process.env.DATABASE_URL) {

    // Production: Connect to EthioDeploy's hosted MySQL database
    const databaseUrl = new URL(process.env.DATABASE_URL);

    db = mysql.createPool({
        host: databaseUrl.hostname,
        user: decodeURIComponent(databaseUrl.username),
        password: decodeURIComponent(databaseUrl.password),
        database: decodeURIComponent(databaseUrl.pathname.substring(1)),
        port: Number(databaseUrl.port || 3306),

        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

} else {

    // Development: Connect to the local MySQL database
    db = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,

        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

}

module.exports = db;