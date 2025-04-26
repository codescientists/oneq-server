const { createConnection } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// CREATE
exports.createCpsw = async (req, res) => {
    const { domain, product } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ${prefix}cpsw_products (
                id VARCHAR(255) PRIMARY KEY,
                brand VARCHAR(255),
                item VARCHAR(255),
                mrp DECIMAL(10,2),
                sno VARCHAR(255)
            )
        `);
        await connection.query(
            `INSERT INTO ${prefix}cpsw_products VALUES (?, ?, ?, ?, ?)`,
            [
                product.id,
                product.brand,
                product.item,
                product.mrp,
                product.sno || null,
            ]
        );
        res.status(201).json({ success: true, message: 'CPSW product created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// READ
exports.getAllCpsw = async (req, res) => {
    const { domain } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        const [rows] = await connection.query(`SELECT * FROM ${prefix}cpsw_products`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE
exports.updateCpsw = async (req, res) => {
    const { domain, id, updates } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        await connection.query(
            `UPDATE ${prefix}cpsw_products SET ${keys} WHERE id = ?`,
            [...values, id]
        );
        res.json({ success: true, message: 'CPSW product updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE
exports.deleteCpsw = async (req, res) => {
    const { domain, id } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        await connection.query(`DELETE FROM ${prefix}cpsw_products WHERE id = ?`, [id]);
        res.json({ success: true, message: 'CPSW product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
