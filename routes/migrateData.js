const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { saveConfigForDomain } = require('../utils/dbConfigManager');

router.post('/migrate-data', async (req, res) => {
    const { domain, dbConfig, data, prefix = '' } = req.body;

    if (!dbConfig || !data) {
        return res.status(400).json({ success: false, message: 'Missing dbConfig or data' });
    }

    try {
        const connection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.username,
            password: dbConfig.password,
            database: dbConfig.database,
            port: dbConfig.port
        });

        // ---------- Tiles Products ----------
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

        for (const product of data.products.tiles || []) {
            await connection.query(
                `INSERT INTO ${prefix}tiles_products (id, brand, surface, dimensions, shadeName, areaInOneBox, mrp, sno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
        }

        // ---------- Adhesive Products ----------
        await connection.query(`
        CREATE TABLE IF NOT EXISTS ${prefix}adhesive_products (
          id VARCHAR(255) PRIMARY KEY,
          brand VARCHAR(255),
          category VARCHAR(255),
          mrp DECIMAL(10,2),
          dPrice DECIMAL(10,2),
          noOfBags INT,
          totalAmount DECIMAL(10,2),
          sno VARCHAR(255)
        )
      `);

        for (const product of data.products.adhesive || []) {
            await connection.query(
                `INSERT INTO ${prefix}adhesive_products (id, brand, category, mrp, dPrice, noOfBags, totalAmount, sno) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    product.id,
                    product.brand,
                    product.category,
                    product.mrp,
                    product.dPrice,
                    product.noOfBags,
                    product.totalAmount,
                    product.sno || null,
                ]
            );
        }

        // ---------- CP-SW Products ----------
        await connection.query(`
        CREATE TABLE IF NOT EXISTS ${prefix}cpsw_products (
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
      `);

        for (const product of data.products['cp-sw'] || []) {
            await connection.query(
                `INSERT INTO ${prefix}cpsw_products (id, brand, productCode, description, image, mrp, dPrice, nos, totalAmount, sno) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    product.id,
                    product.brand,
                    product.productCode,
                    product.description,
                    product.image,
                    product.mrp,
                    product.dPrice,
                    product.nos,
                    product.totalAmount,
                    product.sno || null,
                ]
            );
        }


        // ---------- Customers ----------
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

        for (const customer of data.customers || []) {
            await connection.query(
                `INSERT INTO ${prefix}customers (id, name, companyName, email, phone, address, city, state, zipCode, customerCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        }

        // ---------- Quotations ----------
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

        for (const quotation of data.quotations || []) {
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
                    JSON.stringify(quotation.products), // storing products as JSON
                    quotation.taxRate,
                    quotation.subtotal,
                    quotation.taxAmount,
                    quotation.grandTotal,
                    quotation.termsAndConditions,
                    quotation.createdAt
                ]
            );
        }


        // ---------- Staff ----------
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

        for (const staff of data.staff || []) {
            await connection.query(
                `INSERT INTO ${prefix}staff (
                    id, name, email, phone, position, branch, branchAddress, branchCity, branchState, branchZipCode, staffCode
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
        }


        // ---------- Business Settings ----------
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
            logo TEXT
            )
        `);

        if (data.settings) {
            await connection.query(
                `INSERT INTO ${prefix}settings (
                    id, businessName, businessAddress, businessCity, businessState, businessZipCode, businessPhone, businessEmail, logo
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
                    data.settings.businessName,
                    data.settings.businessAddress,
                    data.settings.businessCity,
                    data.settings.businessState,
                    data.settings.businessZipCode,
                    data.settings.businessPhone,
                    data.settings.businessEmail,
                    data.settings.logo
                ]
            );
        }

        await connection.end();

        saveConfigForDomain(domain, dbConfig);


        res.json({ success: true, message: 'Data migrated successfully!' });
    } catch (error) {
        console.error('Migration Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
