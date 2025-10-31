const mysql = require('mysql2/promise');
require('dotenv').config();

// Support both standard and Railway environment variables
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.MYSQL_PORT || process.env.DB_PORT || 3306,
  user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'currency_converter',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database and create table if not exists
async function initializeDatabase() {
  try {
    // Get database name from environment
    const dbName = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'currency_converter';
    
    // Note: Railway creates the database automatically, so we only create the table
    // Create quotes table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        currency VARCHAR(3) NOT NULL,
        buy_price DECIMAL(10, 4) NOT NULL,
        sell_price DECIMAL(10, 4) NOT NULL,
        source VARCHAR(255) NOT NULL,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_currency_fetched (currency, fetched_at)
      )
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error.message);
  }
}

module.exports = {
  pool,
  initializeDatabase
};

