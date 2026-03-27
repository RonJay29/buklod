import express from "express";
import {
  getAllDevices,
  getDevice,
  addDevice,
  editDevice,
  deleteDevice,
  generateCertificate,
  signCertificate,
  revokeCertificate,
  getDeviceData,       // ← NEW: GET /api/devices/:id/data
  getAllDeviceData,     // ← NEW: GET /api/devices/data/all
} from "../controller/devices.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { getDeviceCertificate }    from "../controller/dummyFabricCA.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ── Fabric CA ──────────────────────────────────────────────────────────────
router.get("/fabric/ca/certificate/:devEUI", getDeviceCertificate);

// ── Certificate generation (any authenticated user) ────────────────────────
router.get("/generate-certificate", generateCertificate);   // GET  /api/devices/generate-certificate

// ── Sensor data (any authenticated user) ──────────────────────────────────
// IMPORTANT: /data/all must be registered BEFORE /:id so Express does not
// try to interpret "all" as a device ID.
router.get("/data/all", getAllDeviceData);                   // GET  /api/devices/data/all

// ── Device listing / profile ───────────────────────────────────────────────
router.get("/",    getAllDevices);                           // GET  /api/devices
router.get("/:id", getDevice);                              // GET  /api/devices/:id

// ── Per-device sensor data (any authenticated user) ────────────────────────
router.get("/:id/data", getDeviceData);                     // GET  /api/devices/:id/data

// ── Admin-only mutations ───────────────────────────────────────────────────
router.post(  "/",                       authorize("admin"), addDevice);
router.put(   "/:id",                    authorize("admin"), editDevice);
router.delete("/:id",                    authorize("admin"), deleteDevice);
router.put(   "/:id/sign-certificate",   authorize("admin"), signCertificate);
router.put(   "/:id/revoke-certificate", authorize("admin"), revokeCertificate);

export default router;