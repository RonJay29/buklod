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
  saveDeviceData,
  getDeviceData,
  getAllDeviceData,
  getDeviceActivity,
} from "../controller/devices.controller.js";
import { authenticate, authorize }  from "../middleware/auth.middleware.js";
import { getDeviceCertificate }      from "../controller/dummyFabricCA.js";

const router = express.Router();
router.use(authenticate);

// ── Static routes (must be BEFORE /:id to avoid "word" being treated as an ID)
router.get("/fabric/ca/certificate/:devEUI", getDeviceCertificate); // GET /api/devices/fabric/ca/certificate/:devEUI
router.get("/generate-certificate",          generateCertificate);  // GET /api/devices/generate-certificate
router.get("/data/all",                      getAllDeviceData);      // GET /api/devices/data/all
router.get("/activity",                      getDeviceActivity);    // GET /api/devices/activity

// ── Collection ────────────────────────────────────────────────────────────────
router.get("/", getAllDevices);                                       // GET /api/devices

// ── Per-device ────────────────────────────────────────────────────────────────
router.get( "/:id",      getDevice);                                 // GET  /api/devices/:id
router.get( "/:id/data", getDeviceData);                             // GET  /api/devices/:id/data
router.post("/:id/data", saveDeviceData);                            // POST /api/devices/:id/data

// ── Admin only ────────────────────────────────────────────────────────────────
router.post(  "/",                       authorize("admin"), addDevice);
router.put(   "/:id",                    authorize("admin"), editDevice);
router.delete("/:id",                    authorize("admin"), deleteDevice);
router.put(   "/:id/sign-certificate",   authorize("admin"), signCertificate);
router.put(   "/:id/revoke-certificate", authorize("admin"), revokeCertificate);

export default router;