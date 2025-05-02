const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createPool } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// Super Admin Login
exports.loginSuperAdmin = async (req, res) => {
    const { domain, email, password } = req.body;
    let pool, connection;

    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        const [rows] = await connection.query(`SELECT superAdminEmail, superAdminPassword FROM ${prefix}settings WHERE id = 1`);
        const admin = rows[0];

        if (!admin || !admin.superAdminEmail) {
            return res.status(404).json({ success: false, message: 'Super admin not set' });
        }

        if (email !== admin.superAdminEmail || !bcrypt.compareSync(password, admin.superAdminPassword)) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign({ email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// Set or Update Super Admin Credentials
exports.setSuperAdminAuth = async (req, res) => {
    const { domain, email, password } = req.body;
    let pool, connection;

    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        const hashedPassword = bcrypt.hashSync(password, 10);

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
                logo TEXT,
                superAdminEmail VARCHAR(255),
                superAdminPassword VARCHAR(255)
            )
        `);

        await connection.query(
            `INSERT INTO ${prefix}settings (
                id, superAdminEmail, superAdminPassword
            ) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                superAdminEmail = VALUES(superAdminEmail),
                superAdminPassword = VALUES(superAdminPassword)
            `,
            [1, email, hashedPassword]
        );

        res.json({ success: true, message: 'Super admin credentials saved' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
