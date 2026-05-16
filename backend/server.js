const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Force Node.js to use Google DNS to bypass local SRV lookup errors
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('MediCore API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
