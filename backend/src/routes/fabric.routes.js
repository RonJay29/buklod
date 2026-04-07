import express from "express";
import {
  fabricHealth,
  getAllRecords,
  readRecord,
  getRecordHistory,
  createRecord,
} from "../controller/fabric.controller.js";

const router = express.Router();

router.get("/health", fabricHealth);
router.get("/records", getAllRecords);
router.get("/records/:id", readRecord);
router.get("/records/:id/history", getRecordHistory);
router.post("/records", createRecord);

export default router;