const { createPool } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// GET Business Settings
exports.getSettings = async (req, res) => {
    const { domain } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        const [rows] = await connection.query(`SELECT * FROM ${prefix}settings WHERE id = 1`);
        res.json(rows[0] || {});
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// UPSERT Business Settings
exports.updateSettings = async (req, res) => {
    const { domain, settings } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        await connection.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}settings (
        id INT PRIMARY KEY,
        businessName VARCHAR(255),
        businessAddress TEXT,
        businessCity VARCHAR(100),
        businessState VARCHAR(100),
        businessZipCode VARCHAR(20),
        businessPhone VARCHAR(50),
        businessEmail VARCHAR(255),
        superAdminEmail VARCHAR(255),
        superAdminPassword VARCHAR(255),
        logo TEXT
      )
    `);

        await connection.query(
            `INSERT INTO ${prefix}settings (
        id, businessName, businessAddress, businessCity,
        businessState, businessZipCode, businessPhone,
        businessEmail, logo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        businessName = VALUES(businessName),
        businessAddress = VALUES(businessAddress),
        businessCity = VALUES(businessCity),
        businessState = VALUES(businessState),
        businessZipCode = VALUES(businessZipCode),
        businessPhone = VALUES(businessPhone),
        businessEmail = VALUES(businessEmail),
        logo = VALUES(logo)
      `,
            [
                1,
                settings.businessName,
                settings.businessAddress,
                settings.businessCity,
                settings.businessState,
                settings.businessZipCode,
                settings.businessPhone,
                settings.businessEmail,
                settings.logo
            ]
        );

        res.json({ success: true, message: 'Settings saved' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
