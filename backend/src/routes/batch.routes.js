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
} from "../controller/batch.controller.js";

const router = express.Router();

router.get("/", getAllBatches);
router.get("/device/:deviceId", getBatchesByDevice);
router.get("/:id/readings", getBatchReadings);
router.post("/:id/seal", sealBatch);
router.post("/:id/invoke", invokeBatch);

export default router;