/**
 * Database Initialization Script
 * 
 * This script initializes the MySQL database with required tables.
 * Run this once when setting up a new environment.
 * 
 * Usage:
 *   npx tsx server/init-db.ts
 * 
 * Environment Variables Required:
 *   DB_HOST - MySQL host (default: localhost)
 *   DB_PORT - MySQL port (default: 3306)
 *   DB_USER - MySQL user (default: root)
 *   DB_PASSWORD - MySQL password (default: empty)
 *   DB_NAME - Database name (default: tour_app)
 */

import "dotenv/config";
import mysql from "mysql2/promise";
import bcrypt from "bcrypt";

async function seedAdminUser(conn: mysql.Connection) {
  try {
    const username = "admin";
    const password = "admin@1234";
    const email = "admin@tour.local";

    // Check if admin already exists
    const [rows] = await conn.execute(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );

    if ((rows as any[]).length > 0) {
      console.log("✓ Admin user already exists (skipping)");
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert admin user
    await conn.execute(
      `INSERT INTO users (username, email, password_hash, name, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, "Administrator", "admin", true]
    );

    console.log("✓ Admin user created");
    console.log("  Username: admin");
    console.log("  Password: admin@1234");
    console.log("  Email: admin@tour.local");
  } catch (error) {
    console.error("✗ Error seeding admin user:", error);
    throw error;
  }
}

async function initializeDatabase() {
  const host = process.env.DB_HOST || "localhost";
  const user = process.env.DB_USER || "root";
  const password = process.env.DB_PASSWORD || "";
  const database = process.env.DB_NAME || "tour_app";
  const port = parseInt(process.env.DB_PORT || "3306");

  console.log("🚀 Starting database initialization...");
  console.log(`📍 Connecting to MySQL at ${host}:${port}`);

  // First connection - create database if not exists
  let conn = null;
  try {
    conn = await mysql.createConnection({
      host,
      user,
      password,
      port,
    });

    console.log("✓ Connected to MySQL server");

    // Create database if it doesn't exist
    await conn.execute(`CREATE DATABASE IF NOT EXISTS ${database}`);
    console.log(`✓ Database '${database}' ready`);

    await conn.end();
  } catch (error) {
    console.error("✗ Failed to create database:", error);
    process.exit(1);
  }

  // Second connection - create tables
  try {
    conn = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port,
    });

    console.log(`✓ Connected to database '${database}'`);

    const tables = [
      {
        name: "users",
        sql: `CREATE TABLE IF NOT EXISTS users (
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
      },
      {
        name: "sessions",
        sql: `CREATE TABLE IF NOT EXISTS sessions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          token VARCHAR(500) NOT NULL,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_expires_at (expires_at)
        )`,
      },
      {
        name: "bookings",
        sql: `CREATE TABLE IF NOT EXISTS bookings (
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
      },
      {
        name: "transactions",
        sql: `CREATE TABLE IF NOT EXISTS transactions (
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
      },
      {
        name: "api_logs",
        sql: `CREATE TABLE IF NOT EXISTS api_logs (
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
      },
    ];

    for (const table of tables) {
      await conn.execute(table.sql);
      console.log(`✓ Table '${table.name}' created/verified`);
    }

    // Seed admin user
    await seedAdminUser(conn);

    await conn.end();

    console.log("\n✨ Database initialization completed successfully!");
    console.log(`\n📋 Created tables: ${tables.map((t) => t.name).join(", ")}`);
    console.log(
      "\n💡 Next steps:",
      "\n  1. Update your .env with database credentials if needed",
      "\n  2. Run: npm run dev",
      "\n  3. Your app is ready to use!"
    );
  } catch (error) {
    console.error("✗ Error initializing database:", error);
    process.exit(1);
  }
}

initializeDatabase();
