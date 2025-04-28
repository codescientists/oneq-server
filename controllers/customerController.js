const { createPool } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// CREATE Customer
exports.createCustomer = async (req, res) => {
    const { domain, customer } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        await connection.query(`
          CREATE TABLE IF NOT EXISTS ${prefix}customers (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            companyName VARCHAR(255),
            email VARCHAR(255),
            phone VARCHAR(50),
            address TEXT,
            city VARCHAR(100),
            state VARCHAR(100),
            zipCode VARCHAR(20),
            customerCode VARCHAR(255),
            notes TEXT
          )
        `);

        await connection.query(
            `INSERT INTO ${prefix}customers (id, name, companyName, email, phone, address, city, state, zipCode, customerCode, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                customer.id,
                customer.name,
                customer.companyName,
                customer.email,
                customer.phone,
                customer.address,
                customer.city,
                customer.state,
                customer.zipCode,
                customer.customerCode,
                customer.notes || ''
            ]
        );

        res.status(201).json({ success: true, message: 'Customer created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// READ All Customers
exports.getAllCustomers = async (req, res) => {
    const { domain } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        const [rows] = await connection.query(`SELECT * FROM ${prefix}customers`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// UPDATE Customer
exports.updateCustomer = async (req, res) => {
    const { domain, id, updates } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        await connection.query(
            `UPDATE ${prefix}customers SET ${keys} WHERE id = ?`,
            [...values, id]
        );

        res.json({ success: true, message: 'Customer updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// DELETE Customer
exports.deleteCustomer = async (req, res) => {
    const { domain, id } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        const table = `${prefix}customers`;

        // 1. Delete customer
        await connection.query(`DELETE FROM ${table} WHERE id = ?`, [id]);

        // 2. Rearrange customerCode
        await connection.query(`SET @row = 0`);
        await connection.query(`
            UPDATE ${table}
            JOIN (
                SELECT id, (@row := @row + 1) AS row_num
                FROM ${table}
                ORDER BY id ASC
            ) AS ranked
            ON ${table}.id = ranked.id
            SET ${table}.customerCode = CONCAT('CUSTOMER', LPAD(ranked.row_num, 4, '0'))
        `);

        res.json({ success: true, message: 'Customer deleted and customerCode rearranged' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
