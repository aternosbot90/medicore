const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // options not strictly needed for Mongoose 6+, but keeping connection simple
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ staff_id: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      
      await User.create({
        staff_id: 'admin',
        password_hash: hash,
        role: 'admin',
        name: 'System Administrator'
      });
      console.log('Default admin user created: admin / admin123');
    }

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
