// dbConnection.js
const mysql = require('mysql2/promise');

const pools = {}; // domain → pool map

function createPool(config) {
    const key = config.host + config.database;  // simple unique key
    if (!pools[key]) {
        pools[key] = mysql.createPool({
            host: config.host,
            user: config.username,
            password: config.password,
            database: config.database,
            waitForConnections: true,
            connectionLimit: 10,   // can adjust
            queueLimit: 0
        });
    }
    return pools[key];
}

module.exports = { createPool };
