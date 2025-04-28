const { createPool } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// CREATE Quotation
exports.createQuotation = async (req, res) => {
    const { domain, quotation } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        await connection.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}quotations (
        id VARCHAR(255) PRIMARY KEY,
        quotationNumber VARCHAR(255),
        quotationDate VARCHAR(100),
        validityDays INT,
        customerName VARCHAR(255),
        customerEmail VARCHAR(255),
        customerPhone VARCHAR(50),
        customerAddress TEXT,
        staffId VARCHAR(255),
        staffName VARCHAR(255),
        staffPosition VARCHAR(255),
        staffCode VARCHAR(255),
        companyName VARCHAR(255),
        companyAddress TEXT,
        companyCity VARCHAR(100),
        companyState VARCHAR(100),
        companyZipCode VARCHAR(20),
        companyPhone VARCHAR(50),
        companyEmail VARCHAR(255),
        products JSON,
        taxRate DECIMAL(5,2),
        subtotal DECIMAL(10,2),
        taxAmount DECIMAL(10,2),
        grandTotal DECIMAL(10,2),
        termsAndConditions TEXT,
        createdAt VARCHAR(100)
      )
    `);

        await connection.query(
            `INSERT INTO ${prefix}quotations (
        id, quotationNumber, quotationDate, validityDays,
        customerName, customerEmail, customerPhone, customerAddress,
        staffId, staffName, staffPosition, staffCode,
        companyName, companyAddress, companyCity, companyState, companyZipCode,
        companyPhone, companyEmail,
        products, taxRate, subtotal, taxAmount, grandTotal,
        termsAndConditions, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                quotation.id,
                quotation.quotationNumber,
                quotation.quotationDate,
                quotation.validityDays,
                quotation.customerName,
                quotation.customerEmail,
                quotation.customerPhone,
                quotation.customerAddress,
                quotation.staffId,
                quotation.staffName,
                quotation.staffPosition,
                quotation.staffCode,
                quotation.companyName,
                quotation.companyAddress,
                quotation.companyCity,
                quotation.companyState,
                quotation.companyZipCode,
                quotation.companyPhone,
                quotation.companyEmail,
                JSON.stringify(quotation.products),
                quotation.taxRate,
                quotation.subtotal,
                quotation.taxAmount,
                quotation.grandTotal,
                quotation.termsAndConditions,
                quotation.createdAt
            ]
        );

        res.status(201).json({ success: true, message: 'Quotation created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// GET All Quotations
exports.getAllQuotations = async (req, res) => {
    const { domain } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        const [rows] = await connection.query(`SELECT * FROM ${prefix}quotations`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// GET One Quotation
exports.getOneQuotation = async (req, res) => {
    const { domain, quotationId } = req.body;

    if (!quotationId) {
        return res.status(400).json({ success: false, message: 'Quotation ID is required' });
    }

    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        const [rows] = await connection.query(
            `SELECT * FROM ${prefix}quotations WHERE id = ? LIMIT 1`,
            [quotationId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }

        res.json({ success: true, quotation: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};


// UPDATE Quotation
exports.updateQuotation = async (req, res) => {
    const { domain, id, updates } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        if (updates.products) {
            updates.products = JSON.stringify(updates.products);
        }

        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        await connection.query(
            `UPDATE ${prefix}quotations SET ${keys} WHERE id = ?`,
            [...values, id]
        );

        res.json({ success: true, message: 'Quotation updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// DELETE Quotation
exports.deleteQuotation = async (req, res) => {
    const { domain, id } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        await connection.query(`DELETE FROM ${prefix}quotations WHERE id = ?`, [id]);
        res.json({ success: true, message: 'Quotation deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
