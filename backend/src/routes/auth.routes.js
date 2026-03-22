import express from "express";
import { register, login, refresh, logout, getMe } from "../controller/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);   // POST /api/auth/register
router.post("/login",    login);      // POST /api/auth/login
router.post("/refresh",  refresh);    // POST /api/auth/refresh
router.post("/logout",   logout);     // POST /api/auth/logout
router.get("/me",        authenticate, getMe); // GET  /api/auth/me (protected)

export default router;