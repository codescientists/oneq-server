const { createConnection } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// CREATE Customer
exports.createCustomer = async (req, res) => {
    const { domain, customer } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const connection = await createConnection(dbConfig);

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
        customerCode VARCHAR(255)
      )
    `);

        await connection.query(
            `INSERT INTO ${prefix}customers (id, name, companyName, email, phone, address, city, state, zipCode, customerCode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
                customer.customerCode
            ]
        );

        res.status(201).json({ success: true, message: 'Customer created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// READ All Customers
exports.getAllCustomers = async (req, res) => {
    const { domain } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const connection = await createConnection(dbConfig);
        const [rows] = await connection.query(`SELECT * FROM ${prefix}customers`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE Customer
exports.updateCustomer = async (req, res) => {
    const { domain, id, updates } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const connection = await createConnection(dbConfig);

        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        await connection.query(
            `UPDATE ${prefix}customers SET ${keys} WHERE id = ?`,
            [...values, id]
        );

        res.json({ success: true, message: 'Customer updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE Customer
exports.deleteCustomer = async (req, res) => {
    const { domain, id } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const connection = await createConnection(dbConfig);

        await connection.query(`DELETE FROM ${prefix}customers WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Customer deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
