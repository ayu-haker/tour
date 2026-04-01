import { Router, RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from "../db";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-prod";
const JWT_EXPIRY = "7d";

// Login route
const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const pool = getPool();
    const [users] = await pool.execute(
      "SELECT id, username, password_hash, role, is_active FROM users WHERE username = ?",
      [username]
    );

    const user = (users as any)[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: "User account is disabled" });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Update last login
    await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Login failed" });
  }
};

// Register route (optional - can be disabled in production)
const handleRegister: RequestHandler = async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const pool = getPool();

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if ((existingUsers as any).length > 0) {
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, name, role, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, name || username, "user", true]
    );

    const userId = (result as any).insertId;

    // Create JWT token
    const token = jwt.sign(
      { id: userId, username, role: "user" },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        username,
        role: "user",
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || "Registration failed" });
  }
};

// Verify token route
const handleVerifyToken: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Get current user route
const handleGetCurrentUser: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const pool = getPool();

    const [users] = await pool.execute(
      "SELECT id, username, email, name, role, is_active, last_login FROM users WHERE id = ?",
      [decoded.id]
    );

    const user = (users as any)[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error: any) {
    res.status(401).json({ error: error?.message || "Unauthorized" });
  }
};

// Logout route (optional - just for client-side token clearing)
const handleLogout: RequestHandler = (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};

// Routes
router.post("/login", handleLogin);
router.post("/register", handleRegister);
router.get("/verify", handleVerifyToken);
router.get("/me", handleGetCurrentUser);
router.post("/logout", handleLogout);

export default router;
