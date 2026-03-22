import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// ── Generate tokens ──────────────────────────────────────────────────────────

export function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role,  first_name: user.first_name, 
      last_name:  user.last_name },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m" }
  );
}

export function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d" }
  );
}

// ── Verify tokens ────────────────────────────────────────────────────────────

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
}

// ── Cookie options ───────────────────────────────────────────────────────────
// Refresh token goes in an httpOnly cookie so JS cannot access it

export const refreshCookieOptions = {
  httpOnly: true,               // not accessible via document.cookie
  secure:   process.env.NODE_ENV === "production",  // HTTPS only in prod
  sameSite: "strict",
  maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days in ms
};



