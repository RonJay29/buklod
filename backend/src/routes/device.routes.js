import express from "express";
import {
  getNextDeviceId,
  getAllDevices,
  getDevice,
  addDevice,
  editDevice,
  deleteDevice,
  generateCertificate,
  signCertificate,
  revokeCertificate,
} from "../controller/devices.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

// Any logged-in user
router.get("/next-id",                   getNextDeviceId);       // GET  /api/devices/next-id
router.get("/generate-certificate",      generateCertificate);   // GET  /api/devices/generate-certificate
router.get("/",                          getAllDevices);          // GET  /api/devices
router.get("/:id",                       getDevice);             // GET  /api/devices/:id

// Admin only
router.post("/",                         authorize("admin"), addDevice);
router.put("/:id",                       authorize("admin"), editDevice);
router.delete("/:id",                    authorize("admin"), deleteDevice);
router.put("/:id/sign-certificate",      authorize("admin"), signCertificate);
router.put("/:id/revoke-certificate",    authorize("admin"), revokeCertificate);

export default router;