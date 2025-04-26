const mysql = require('mysql2/promise');

const createConnection = async (dbConfig) => {
    return mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.username,
        password: dbConfig.password,
        database: dbConfig.database,
        port: dbConfig.port,
    });
};

module.exports = { createConnection };
