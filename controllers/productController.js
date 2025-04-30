const { createPool } = require('../utils/dbConnection');
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
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
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
    } finally {
        if (connection) connection.release();
    }
};

// READ
exports.getAllProducts = async (req, res) => {
    const { domain } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const productTypes = ['tiles', 'adhesive', 'cpsw'];
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

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
    } finally {
        if (connection) connection.release();
    }
};


// UPDATE
exports.updateProduct = async (req, res) => {
    const { domain, id, updates } = req.body;
    const { productType } = req.params;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        const table = `${prefix}${productType}_products`;

        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        await connection.query(
            `UPDATE ${table} SET ${keys} WHERE id = ?`,
            [...values, id]
        );

        res.json({ success: true, message: `${productType} updated` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// DELETE
exports.deleteProduct = async (req, res) => {
    const { domain, id } = req.body;
    const { productType } = req.params;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) {
            return res.status(400).json({ success: false, message: 'No DB config found for domain' });
        }

        const { prefix } = dbConfig;
        const table = `${prefix}${productType}_products`;

        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        // Step 1: Delete the product
        await connection.query(`DELETE FROM ${table} WHERE id = ?`, [id]);

        // Step 2: Reset @sno
        await connection.query(`SET @sno = 0`);

        // Step 3: Update sno sequentially
        await connection.query(`
        UPDATE ${table}
        SET sno = (@sno := @sno + 1)
        ORDER BY id ASC
      `);

        res.json({ success: true, message: `${productType} deleted and SNO rearranged` });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};


// BULK CREATE
exports.bulkCreateProducts = async (req, res) => {
    const { domain, products } = req.body;
    const { productType } = req.params;
    let pool, connection;

    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) {
            return res.status(400).json({ success: false, message: 'No DB config found for domain' });
        }

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        const schema = tableSchemas[productType];
        if (!schema) {
            return res.status(400).json({ success: false, message: 'Invalid product type' });
        }

        await connection.query(schema.replace('{{prefix}}', prefix));

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ success: false, message: 'No products provided for bulk import' });
        }

        const table = `${prefix}${productType}_products`;

        // Fetch existing rows
        const [existingRows] = await connection.query(`SELECT * FROM ${table}`);

        // Compare all fields
        const getComparisonKeys = (productType) => {
            switch (productType) {
                case 'tiles':
                    return ['brand', 'dimensions', 'shadeName'];
                case 'adhesive':
                    return ['brand', 'category'];
                case 'cpsw':
                    return ['brand', 'productCode'];
                default:
                    return []; // fallback
            }
        };

        const comparisonKeys = getComparisonKeys(productType);

        const filteredProducts = products.filter(p => {
            return !existingRows.some(row => {
                return comparisonKeys.every(key => {
                    const val1 = p[key];
                    const val2 = row[key];

                    if (val1 === null || val2 === null) return val1 === val2;

                    if (typeof val1 === 'number' || typeof val2 === 'number') {
                        return Number(val1).toFixed(2) === Number(val2).toFixed(2);
                    }

                    return String(val1).trim().toLowerCase() === String(val2).trim().toLowerCase();
                });
            });
        });


        if (filteredProducts.length === 0) {
            return res.status(400).json({ success: false, message: 'All products are duplicates' });
        }

        // Insert new products
        const keys = Object.keys(filteredProducts[0]);
        const placeholders = filteredProducts.map(() => `(${keys.map(() => '?').join(', ')})`).join(', ');
        const values = filteredProducts.flatMap(product => keys.map(key => product[key]));

        const insertQuery = `
        INSERT INTO ${table} (${keys.join(', ')})
        VALUES ${placeholders}
      `;

        await connection.query(insertQuery, values);

        // Rearrange SNOs
        await connection.query(`SET @sno = 0`);
        await connection.query(`
        UPDATE ${table}
        SET sno = (@sno := @sno + 1)
        ORDER BY id ASC
      `);

        res.status(201).json({ success: true, message: `${filteredProducts.length} ${productType} products created successfully` });

    } catch (error) {
        console.error('Bulk create error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

exports.bulkDeleteProducts = async (req, res) => {
    const { domain, ids } = req.body;
    const { productType } = req.params;

    let pool, connection;

    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) {
            return res.status(400).json({ success: false, message: 'No DB config found for domain' });
        }

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        const schema = tableSchemas[productType];
        if (!schema) {
            return res.status(400).json({ success: false, message: 'Invalid product type' });
        }

        await connection.query(schema.replace('{{prefix}}', prefix));

        const table = `${prefix}${productType}_products`;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No IDs provided for deletion' });
        }

        // Use placeholders to safely insert ids
        const placeholders = ids.map(() => '?').join(', ');
        const deleteQuery = `DELETE FROM ${table} WHERE id IN (${placeholders})`;

        const [result] = await connection.query(deleteQuery, ids);

        // Reorder SNOs after deletion
        await connection.query(`SET @sno = 0`);
        await connection.query(`
        UPDATE ${table}
        SET sno = (@sno := @sno + 1)
        ORDER BY id ASC
      `);

        res.status(200).json({ success: true, message: `${result.affectedRows} ${productType} products deleted successfully` });

    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
