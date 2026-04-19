// import express from "express";
// import {
//   fabricHealth,
//   registerDeviceOnChain,
//   readRegisteredDevice,
//   getAllRegisteredDevices,
//   commitSealedBatch,
//   readCommittedBatch,
//   getAllCommittedBatches,
//   getCommittedBatchesByDevice,
// } from "../controller/fabric.controller.js";

// const router = express.Router();

// router.get("/health", fabricHealth);

// // device registry
// router.post("/devices/:deviceId/register", registerDeviceOnChain);
// router.get("/devices/:deviceId", readRegisteredDevice);
// router.get("/devices", getAllRegisteredDevices);

// // committed batches
// router.post("/batches/:batchId/commit", commitSealedBatch);
// router.get("/batches/:batchId", readCommittedBatch);
// router.get("/batches", getAllCommittedBatches);
// router.get("/devices/:deviceId/batches", getCommittedBatchesByDevice);

// export default router;

import express from "express";
import {
  fabricHealth,
  getChannelInfo, // ADDED
  registerDeviceOnChain,
  readRegisteredDevice,
  getAllRegisteredDevices,
  commitSealedBatch,
  readCommittedBatch,
  getAllCommittedBatches,
  getCommittedBatchesByDevice,
} from "../controller/fabric.controller.js";

const router = express.Router();

router.get("/health", fabricHealth);
router.get("/channel-info", getChannelInfo);

// device registry
router.post("/devices/:deviceId/register", registerDeviceOnChain);
router.get("/devices/:deviceId", readRegisteredDevice);
router.get("/devices", getAllRegisteredDevices);

// committed batches
router.post("/batches/:batchId/commit", commitSealedBatch);
router.get("/batches/:batchId", readCommittedBatch);
router.get("/batches", getAllCommittedBatches);
router.get("/devices/:deviceId/batches", getCommittedBatchesByDevice);

export default router;