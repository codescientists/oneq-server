const { createConnection } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// CREATE
exports.createTile = async (req, res) => {
    const { domain, product } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        await connection.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}tiles_products (
        id VARCHAR(255) PRIMARY KEY,
        brand VARCHAR(255),
        surface VARCHAR(255),
        dimensions VARCHAR(255),
        shadeName VARCHAR(255),
        areaInOneBox DECIMAL(10,2),
        mrp DECIMAL(10,2),
        sno VARCHAR(255)
      )
    `);
        await connection.query(
            `INSERT INTO ${prefix}tiles_products VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                product.id,
                product.brand,
                product.surface,
                product.dimensions,
                product.shadeName,
                product.areaInOneBox,
                product.mrp,
                product.sno || null,
            ]
        );
        res.status(201).json({ success: true, message: 'Tile product created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// READ
exports.getAllTiles = async (req, res) => {
    const { domain } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        const [rows] = await connection.query(`SELECT * FROM ${prefix}tiles_products`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// UPDATE
exports.updateTile = async (req, res) => {
    const { domain, id, updates } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        await connection.query(
            `UPDATE ${prefix}tiles_products SET ${keys} WHERE id = ?`,
            [...values, id]
        );
        res.json({ success: true, message: 'Tile updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE
exports.deleteTile = async (req, res) => {
    const { domain, id } = req.body;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });
        const { prefix } = dbConfig;

        const connection = await createConnection(dbConfig);
        await connection.query(`DELETE FROM ${prefix}tiles_products WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Tile deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
