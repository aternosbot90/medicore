const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.resolve(__dirname, 'medicore.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staff_id TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL
      )
    `, async (err) => {
      if (err) {
        console.error("Error creating users table", err);
      } else {
        // Create default admin user if it doesn't exist
        const checkAdmin = "SELECT * FROM users WHERE staff_id = 'admin'";
        db.get(checkAdmin, [], async (err, row) => {
          if (!row) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin123', salt);
            db.run(
              "INSERT INTO users (staff_id, password_hash, role, name) VALUES (?, ?, ?, ?)",
              ['admin', hash, 'admin', 'System Administrator']
            );
            console.log("Default admin user created: admin / admin123");
          }
        });
      }
    });
  }
});

module.exports = db;
