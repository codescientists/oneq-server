const { createConnection } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

const tableSchemas = {
    tiles: `
    CREATE TABLE IF NOT EXISTS {{prefix}}tiles_products (
      id VARCHAR(255) PRIMARY KEY,
      brand VARCHAR(255),
      surface VARCHAR(255),
      dimensions VARCHAR(255),
      shadeName VARCHAR(255),
      areaInOneBox DECIMAL(10,2),
      mrp DECIMAL(10,2),
      sno VARCHAR(255)
    )
  `,
    adhesive: `
    CREATE TABLE IF NOT EXISTS {{prefix}}adhesive_products (
      id VARCHAR(255) PRIMARY KEY,
      brand VARCHAR(255),
      category VARCHAR(255),
      mrp DECIMAL(10,2),
      dPrice DECIMAL(10,2),
      noOfBags INT,
      totalAmount DECIMAL(10,2),
      sno VARCHAR(255)
    )
  `,
    cpsw: `
    CREATE TABLE IF NOT EXISTS {{prefix}}cpsw_products (
      id VARCHAR(255) PRIMARY KEY,
      brand VARCHAR(255),
      productCode VARCHAR(255),
      description TEXT,
      image TEXT,
      mrp DECIMAL(10,2),
      dPrice DECIMAL(10,2),
      nos INT,
      totalAmount DECIMAL(10,2),
      sno VARCHAR(255)
    )
  `
};

// CREATE
exports.createProduct = async (req, res) => {
    const { domain, product } = req.body;
    const { productType } = req.params;

    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const connection = await createConnection(dbConfig);
        const schema = tableSchemas[productType];

        if (!schema) return res.status(400).json({ success: false, message: 'Invalid product type' });

        await connection.query(schema.replace('{{prefix}}', prefix));

        const table = `${prefix}${productType}_products`;
        const keys = Object.keys(product);
        const values = Object.values(product);
        const placeholders = keys.map(() => '?').join(', ');

        await connection.query(
            `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
            values
        );

        res.status(201).json({ success: true, message: `${productType} product created` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// READ
exports.getAllProducts = async (req, res) => {
    const { domain } = req.body;

    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const productTypes = ['tiles', 'adhesive', 'cpsw'];
        const connection = await createConnection(dbConfig);

        const results = {};

        for (const type of productTypes) {
            const table = `${prefix}${type}_products`;
            try {
                const [rows] = await connection.query(`SELECT * FROM ${table}`);
                results[type] = rows;
            } catch (err) {
                // Optional: Log missing table or continue silently
                results[type] = [];
                console.warn(`Failed to fetch from ${table}:`, err.message);
            }
        }

        res.json(results);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// UPDATE
exports.updateProduct = async (req, res) => {
    const { domain, id, updates } = req.body;
    const { productType } = req.params;
    console.log("UPDATING")
    console.log(domain, id, updates, productType)
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const table = `${prefix}${productType}_products`;

        const connection = await createConnection(dbConfig);
        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        await connection.query(
            `UPDATE ${table} SET ${keys} WHERE id = ?`,
            [...values, id]
        );

        res.json({ success: true, message: `${productType} updated` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE
exports.deleteProduct = async (req, res) => {
    const { domain, id } = req.body;
    const { productType } = req.params;

    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const table = `${prefix}${productType}_products`;

        const connection = await createConnection(dbConfig);
        await connection.query(`DELETE FROM ${table} WHERE id = ?`, [id]);

        res.json({ success: true, message: `${productType} deleted` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
