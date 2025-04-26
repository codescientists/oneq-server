const { createConnection } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// CREATE
exports.createAdhesive = async (req, res) => {
    const { domain, product } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ${prefix}adhesive_products (
                id VARCHAR(255) PRIMARY KEY,
                brand VARCHAR(255),
                type VARCHAR(255),
                weight VARCHAR(255),
                mrp DECIMAL(10,2),
                sno VARCHAR(255)
            )
        `);
        await connection.query(
            `INSERT INTO ${prefix}adhesive_products VALUES (?, ?, ?, ?, ?, ?)`,
            [
                product.id,
                product.brand,
                product.type,
                product.weight,
                product.mrp,
                product.sno || null,
            ]
        );
        res.status(201).json({ success: true, message: 'Adhesive product created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// READ
exports.getAllAdhesives = async (req, res) => {
    const { domain } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        const [rows] = await connection.query(`SELECT * FROM ${prefix}adhesive_products`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE
exports.updateAdhesive = async (req, res) => {
    const { domain, id, updates } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        await connection.query(
            `UPDATE ${prefix}adhesive_products SET ${keys} WHERE id = ?`,
            [...values, id]
        );
        res.json({ success: true, message: 'Adhesive product updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE
exports.deleteAdhesive = async (req, res) => {
    const { domain, id } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        await connection.query(`DELETE FROM ${prefix}adhesive_products WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Adhesive product deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
