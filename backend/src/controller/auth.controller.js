import bcrypt from "bcryptjs";
import pool   from "../config/db.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
} from "../config/token.js";

// ── Register ─────────────────────────────────────────────────────────────────
export async function register(req, res) {
  const { first_name, last_name, email, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    // Check if email already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const salt           = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, first_name, last_name, email, role, created_at`,
      [first_name, last_name, email.toLowerCase(), hashedPassword]
    );

    const user = result.rows[0];

    // Generate tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, expiresAt]
    );

    // Send refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(201).json({
      message: "Account created successfully",
      accessToken,
      user: {
        id:         user.id,
        first_name: user.first_name,
        last_name:  user.last_name,
        email:      user.email,
        role:       user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in DB (remove old ones for this user first — optional)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, refreshToken, expiresAt]
    );

    // Send refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        id:         user.id,
        first_name: user.first_name,
        last_name:  user.last_name,
        email:      user.email,
        role:       user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── Refresh ───────────────────────────────────────────────────────────────────
export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Refresh token not found" });
  }

  try {
    // Verify the refresh token signature
    const decoded = verifyRefreshToken(token);

    // Check it exists in the DB and is not expired
    const result = await pool.query(
      `SELECT rt.*, u.id, u.email, u.role
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      res.clearCookie("refreshToken");
      return res.status(403).json({ message: "Invalid or expired refresh token" });
    }

    const user = result.rows[0];

    // Issue new access token
    const newAccessToken = generateAccessToken(user);

    // Rotate refresh token (issue new one, delete old one)
    const newRefreshToken = generateRefreshToken(user);
    const expiresAt       = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
    await pool.query(
      "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.id, newRefreshToken, expiresAt]
    );

    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.clearCookie("refreshToken");
    return res.status(403).json({ message: "Invalid refresh token" });
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
export async function logout(req, res) {
  const token = req.cookies?.refreshToken;

  if (token) {
    // Remove from DB
    await pool.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
  }

  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out successfully" });
}

// ── Get current user ──────────────────────────────────────────────────────────
export async function getMe(req, res) {
  try {
    const result = await pool.query(
      "SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}