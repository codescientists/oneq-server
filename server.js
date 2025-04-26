const express = require("express");
const cors = require("cors");
const multer = require("multer");
const ftp = require("basic-ftp");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());

const migrateDataRoutes = require('./routes/migrateData');
const tilesRoutes = require('./routes/tilesRoutes');
const adhesiveRoutes = require('./routes/adhesiveRoutes');
const cpswRoutes = require('./routes/cpswRoutes');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const staffRoutes = require('./routes/staffRoutes');
const quotationRoutes = require('./routes/quotationRoutes');
const settingRoutes = require('./routes/settingRoutes');

const { getConfigForDomain } = require("./utils/dbConfigManager");

app.use('/api/v1', migrateDataRoutes);
app.use('/api/v1/tiles', tilesRoutes);
app.use('/api/v1/adhesive', adhesiveRoutes);
app.use('/api/v1/cpsw', cpswRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/staffs', staffRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/settings', settingRoutes);


app.get('/api/v1/check-installed', (req, res) => {
    const domain = req.headers['x-tenant-domain'];

    const config = getConfigForDomain(domain);

    res.json({ installed: !!config });
});

// Store file temporarily
const upload = multer({ dest: "temp_uploads/" });

app.post("/api/v1/upload", upload.single("image"), async (req, res) => {
    const file = req.file;
    const originalExt = path.extname(file.originalname);
    const remoteFilename = `${Date.now()}-${Math.random().toString(36).substring(2)}${originalExt}`;

    const client = new ftp.Client();
    try {
        await client.access({
            host: "82.180.143.227",
            user: "u417227553.mediumblue-rook-336283.hostingersite.com",
            password: "CodeScientist@4321",
            secure: false,
            port: 21,
            family: 4,
        });

        await client.uploadFrom(file.path, `/public_html/uploads/${remoteFilename}`);

        await client.send(`SITE CHMOD 644 /public_html/uploads/${remoteFilename}`);

        client.close();

        // Remove local temp file
        fs.unlinkSync(file.path);

        res.json({
            status: "success",
            imageUrl: `https://mediumblue-rook-336283.hostingersite.com/uploads/${remoteFilename}`,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: "error", message: "Upload failed" });
    }
});

app.get("/api/v1/test", (req, res) => {
    res.status(200).json({ message: "Congrats! Your API is working perfectly." })
})

app.listen(8080, () => {
    console.log("Server running on port 8080");
});
