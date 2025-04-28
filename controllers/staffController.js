const { createPool } = require('../utils/dbConnection');
const { getConfigForDomain } = require('../utils/dbConfigManager');

// CREATE Staff
exports.createStaff = async (req, res) => {
    const { domain, staff } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        if (!dbConfig) return res.status(400).json({ success: false, message: 'No DB config found for domain' });

        const { prefix } = dbConfig;
        pool = createPool(dbConfig);
        connection = await pool.getConnection();

        await connection.query(`
      CREATE TABLE IF NOT EXISTS ${prefix}staff (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        position VARCHAR(100),
        branch VARCHAR(255),
        branchAddress TEXT,
        branchCity VARCHAR(100),
        branchState VARCHAR(100),
        branchZipCode VARCHAR(20),
        staffCode VARCHAR(100)
      )
    `);

        await connection.query(
            `INSERT INTO ${prefix}staff (
        id, name, email, phone, position,
        branch, branchAddress, branchCity,
        branchState, branchZipCode, staffCode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                staff.id,
                staff.name,
                staff.email,
                staff.phone,
                staff.position,
                staff.branch,
                staff.branchAddress,
                staff.branchCity,
                staff.branchState,
                staff.branchZipCode,
                staff.staffCode
            ]
        );

        res.status(201).json({ success: true, message: 'Staff created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// GET All Staff
exports.getAllStaff = async (req, res) => {
    const { domain } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        const [rows] = await connection.query(`SELECT * FROM ${prefix}staff`);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// UPDATE Staff
exports.updateStaff = async (req, res) => {
    const { domain, id, updates } = req.body;
    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;

        const keys = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);

        await connection.query(
            `UPDATE ${prefix}staff SET ${keys} WHERE id = ?`,
            [...values, id]
        );

        res.json({ success: true, message: 'Staff updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// DELETE Staff
exports.deleteStaff = async (req, res) => {
    const { domain, id } = req.body;

    let pool, connection;
    try {
        const dbConfig = getConfigForDomain(domain);
        pool = createPool(dbConfig);
        connection = await pool.getConnection();
        const { prefix } = dbConfig;
        const table = `${prefix}staff`;

        // Step 1: Delete the staff
        await connection.query(`DELETE FROM ${table} WHERE id = ?`, [id]);

        // Step 2: Rearrange staffcode in one shot
        // First reset a session variable @row := 0
        await connection.query(`SET @row = 0`);

        await connection.query(`
        UPDATE ${table}
        JOIN (
          SELECT id, (@row := @row + 1) AS row_num
          FROM ${table}
          ORDER BY id ASC
        ) AS ranked
        ON ${table}.id = ranked.id
        SET ${table}.staffcode = CONCAT('STAFF', LPAD(ranked.row_num, 4, '0'))
      `);

        res.json({ success: true, message: 'Staff deleted and staffcode rearranged' });
    } catch (error) {
        console.error('Error deleting staff:', error);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        if (connection) connection.release();
    }
};
