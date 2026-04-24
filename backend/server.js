require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const initDB = require('./initDB');
const candidateRoute = require('./routes/candidate');
const clientRoute = require('./routes/client');
const cvParserRoute = require('./routes/cvParser');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use(candidateRoute);
app.use(clientRoute);
app.use(cvParserRoute);

app.get('/api/health', (req, res) => {
    res.json({ status: "Server is running" });
});

initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

app.use((err, req, res, next) => {
    console.error('Global error handler:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});
