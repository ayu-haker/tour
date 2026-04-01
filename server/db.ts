import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export async function initializeDatabase() {
  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "tour_app";
  const port = parseInt(process.env.DB_PORT || "3306");

  for (let i = 0; i < 10; i++) {
    try {
      pool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      const conn = await pool.getConnection();
      console.log("✓ MySQL Database connected successfully");
      conn.release();
      return;
    } catch (err) {
      console.log(`Waiting for DB... (attempt ${i + 1}/10)`);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
  throw new Error("Failed to connect to database after 10 attempts");
}

export function getPool(): mysql.Pool {
  if (!pool) {
    throw new Error(
      "Database pool not initialized. Call initializeDatabase() first.",
    );
  }
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✓ MySQL Database connection closed");
  }
}

export async function createTables() {
  const pool = getPool();

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      phone VARCHAR(20),
      role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_email (email),
      INDEX idx_role (role)
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      token VARCHAR(500) NOT NULL,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_expires_at (expires_at)
    )`,
    `CREATE TABLE IF NOT EXISTS bookings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      type ENUM('flight', 'train', 'hotel', 'cab', 'food') NOT NULL,
      reference_id VARCHAR(255),
      booking_details JSON,
      status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
      total_amount DECIMAL(10, 2),
      currency VARCHAR(3) DEFAULT 'INR',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_type (type),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )`,
    `CREATE TABLE IF NOT EXISTS transactions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      booking_id INT,
      amount DECIMAL(10, 2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'INR',
      status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
      payment_method VARCHAR(50),
      transaction_id VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_transaction_id (transaction_id)
    )`,
    `CREATE TABLE IF NOT EXISTS api_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      endpoint VARCHAR(255),
      method VARCHAR(10),
      status_code INT,
      response_time_ms INT,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_endpoint (endpoint),
      INDEX idx_created_at (created_at)
    )`,
  ];

  const conn = await pool.getConnection();

  try {
    for (const table of tables) {
      await conn.execute(table);
    }
    console.log("✓ Database tables initialized successfully");
  } catch (error) {
    console.error("✗ Error creating tables:", error);
    throw error;
  } finally {
    conn.release();
  }
}
