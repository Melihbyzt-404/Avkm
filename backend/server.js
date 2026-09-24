const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotalar
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Test Endpoint'i
app.get('/', (req, res) => {
    res.send('B2B & B2C Backend API Çalışıyor');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda aktif.`);
});