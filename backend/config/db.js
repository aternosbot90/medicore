const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // options not strictly needed for Mongoose 6+, but keeping connection simple
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Programmatically drop old single-tenant unique indexes to prevent E11000 crashes on startup
    try {
      await mongoose.connection.db.collection('users').dropIndex('staff_id_1');
      console.log('Stale global unique index staff_id_1 successfully dropped.');
    } catch (err) {
      // Index already dropped or not found, safe to ignore
    }

    try {
      await mongoose.connection.db.collection('medicines').dropIndex('sku_1');
      console.log('Stale global unique index sku_1 successfully dropped.');
    } catch (err) {
      // Index already dropped or not found, safe to ignore
    }

    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ staff_id: 'admin', tenantId: 'city_hospital' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      
      await User.create({
        tenantId: 'city_hospital',
        staff_id: 'admin',
        password_hash: hash,
        role: 'admin',
        name: 'System Administrator'
      });
      console.log('Default admin user created: admin / admin123 under tenant: city_hospital');
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
