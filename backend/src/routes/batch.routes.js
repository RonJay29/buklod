// import express from "express";
// import {
//   getAllBatches,
//   getBatchesByDevice,
//   getBatchReadings,
//   sealBatch,
//   invokeBatch,
// } from "../controller/batch.controller.js";
// import { authenticate, authorize } from "../middleware/auth.middleware.js";

// const router = express.Router();
// router.use(authenticate);

// router.get("/",                        getAllBatches);          // GET  /api/batches
// router.get("/device/:deviceId",        getBatchesByDevice);    // GET  /api/batches/device/:deviceId
// router.get("/:id/readings",            getBatchReadings);      // GET  /api/batches/:id/readings
// router.post("/:id/seal",   authorize("admin"), sealBatch);     // POST /api/batches/:id/seal
// router.post("/:id/invoke", authorize("admin"), invokeBatch);   // POST /api/batches/:id/invoke

// export default router;
import express from "express";
import {
  getAllBatches,
  getBatchesByDevice,
  getBatchReadings,
  sealBatch,
  invokeBatch,
  getLedgerSummary,
} from "../controller/batch.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

// ── Static routes (must be BEFORE /:id) ──────────────────────────────────────
router.get("/ledger-summary", getLedgerSummary);            // GET  /api/batches/ledger-summary

// ── Collection routes ─────────────────────────────────────────────────────────
router.get("/",                     getAllBatches);          // GET  /api/batches
router.get("/device/:deviceId",     getBatchesByDevice);    // GET  /api/batches/device/:deviceId

// ── Per-batch routes ──────────────────────────────────────────────────────────
router.get( "/:id/readings",        getBatchReadings);      // GET  /api/batches/:id/readings
router.post("/:id/seal",   authorize("admin"), sealBatch);  // POST /api/batches/:id/seal
router.post("/:id/invoke", authorize("admin"), invokeBatch);// POST /api/batches/:id/invoke

export default router;