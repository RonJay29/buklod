// import pool from "../config/db.js";

// const BATCH_SELECT = `
//   b.id,
//   b.device_id     AS "deviceId",
//   d.device_name   AS "deviceName",
//   d.deveui        AS "devEUI",
//   b.status,
//   b.tx_id         AS "txId",
//   b.record_count  AS "recordCount",
//   TO_CHAR(b.created_at   AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "createdAt",
//   TO_CHAR(b.sealed_at    AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "sealedAt",
//   TO_CHAR(b.committed_at AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "committedAt"
// `;

// // ── GET /api/batches ──────────────────────────────────────────────────────────
// // All batches across all devices, newest first
// export async function getAllBatches(req, res) {
//   try {
//     const result = await pool.query(
//       `SELECT ${BATCH_SELECT}
//        FROM device_data_batch b
//        JOIN device d ON d.id = b.device_id
//        ORDER BY b.created_at DESC`
//     );
//     return res.status(200).json({ batches: result.rows });
//   } catch (err) {
//     console.error("getAllBatches:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── GET /api/batches/device/:deviceId ─────────────────────────────────────────
// // Batches for a single device
// export async function getBatchesByDevice(req, res) {
//   const { deviceId } = req.params;
//   try {
//     const result = await pool.query(
//       `SELECT ${BATCH_SELECT}
//        FROM device_data_batch b
//        JOIN device d ON d.id = b.device_id
//        WHERE b.device_id = $1
//        ORDER BY b.created_at DESC`,
//       [deviceId]
//     );
//     return res.status(200).json({ batches: result.rows });
//   } catch (err) {
//     console.error("getBatchesByDevice:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── GET /api/batches/:id/readings ─────────────────────────────────────────────
// // All readings that belong to a batch
// export async function getBatchReadings(req, res) {
//   const { id } = req.params;
//   try {
//     const batch = await pool.query(
//       "SELECT id FROM device_data_batch WHERE id = $1", [id]
//     );
//     if (!batch.rows.length) return res.status(404).json({ message: "Batch not found" });

//     const result = await pool.query(
//       `SELECT id, raw_payload AS "rawPayload", decoded_data AS "decodedData",
//               TO_CHAR(timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "timestamp"
//        FROM device_data
//        WHERE batch_id = $1
//        ORDER BY timestamp DESC`,
//       [id]
//     );
//     return res.status(200).json({ readings: result.rows });
//   } catch (err) {
//     console.error("getBatchReadings:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── POST /api/batches/:id/seal ────────────────────────────────────────────────
// // Seal a batch — no more readings can be added
// export async function sealBatch(req, res) {
//   const { id } = req.params;
//   try {
//     const check = await pool.query(
//       "SELECT id, status, record_count FROM device_data_batch WHERE id = $1", [id]
//     );
//     if (!check.rows.length) return res.status(404).json({ message: "Batch not found" });

//     const { status, record_count } = check.rows[0];
//     if (status !== "open") {
//       return res.status(400).json({ message: `Batch is already ${status}` });
//     }
//     if (record_count === 0) {
//       return res.status(400).json({ message: "Cannot seal an empty batch — add readings first" });
//     }

//     await pool.query(
//       `UPDATE device_data_batch SET status = 'sealed', sealed_at = NOW() WHERE id = $1`,
//       [id]
//     );

//     const full = await pool.query(
//       `SELECT ${BATCH_SELECT}
//        FROM device_data_batch b
//        JOIN device d ON d.id = b.device_id
//        WHERE b.id = $1`, [id]
//     );
//     return res.status(200).json({ message: "Batch sealed", batch: full.rows[0] });
//   } catch (err) {
//     console.error("sealBatch:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── POST /api/batches/:id/invoke ──────────────────────────────────────────────
// // Invoke sealed batch to Hyperledger Fabric
// export async function invokeBatch(req, res) {
//   const { id } = req.params;
//   try {
//     const check = await pool.query(
//       `SELECT ${BATCH_SELECT}
//        FROM device_data_batch b
//        JOIN device d ON d.id = b.device_id
//        WHERE b.id = $1`, [id]
//     );
//     if (!check.rows.length) return res.status(404).json({ message: "Batch not found" });

//     const batch = check.rows[0];
//     if (batch.status !== "sealed") {
//       return res.status(400).json({ message: `Batch must be sealed before invoking. Current status: ${batch.status}` });
//     }

//     // Fetch all readings for this batch
//     const readings = await pool.query(
//       `SELECT id, raw_payload, decoded_data,
//               TO_CHAR(timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS timestamp
//        FROM device_data
//        WHERE batch_id = $1
//        ORDER BY timestamp ASC`,
//       [id]
//     );

//     // Build the dataset payload for Fabric
//     const dataset = {
//       batchId:    batch.id,
//       deviceId:   batch.devEUI,
//       deviceName: batch.deviceName,
//       createdAt:  batch.createdAt,
//       sealedAt:   batch.sealedAt,
//       recordCount: batch.recordCount,
//       readings:   readings.rows.map(r => ({
//         id:          r.id,
//         rawPayload:  r.raw_payload,
//         decodedData: r.decoded_data,
//         timestamp:   r.timestamp,
//       })),
//     };

//     // ── Fabric invocation ─────────────────────────────────────────────────────
//     // Replace this block with your actual Fabric SDK / REST gateway call.
//     // For now we simulate a successful invoke and generate a mock tx_id.
//     let txId;
//     try {
//       // TODO: const txId = await fabricGateway.submitTransaction("CreateDataset", JSON.stringify(dataset));
//       txId = `tx_${Date.now().toString(16)}_${Math.random().toString(16).slice(2, 10)}`;
//     } catch (fabricErr) {
//       // Mark batch as failed if Fabric throws
//       await pool.query(
//         "UPDATE device_data_batch SET status = 'failed' WHERE id = $1", [id]
//       );
//       return res.status(502).json({ message: "Fabric invocation failed", detail: fabricErr.message });
//     }

//     // Mark committed
//     await pool.query(
//       `UPDATE device_data_batch
//        SET status = 'committed', tx_id = $1, committed_at = NOW()
//        WHERE id = $2`,
//       [txId, id]
//     );

//     const full = await pool.query(
//       `SELECT ${BATCH_SELECT}
//        FROM device_data_batch b
//        JOIN device d ON d.id = b.device_id
//        WHERE b.id = $1`, [id]
//     );

//     return res.status(200).json({
//       message:  "Batch committed to Hyperledger Fabric",
//       txId,
//       dataset,
//       batch:    full.rows[0],
//     });
//   } catch (err) {
//     console.error("invokeBatch:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }
import pool from "../config/db.js";
import { commitSealedBatchById } from "./fabric.controller.js";

const BATCH_SELECT = `
  b.id,
  b.device_id     AS "deviceId",
  d.device_name   AS "deviceName",
  d.deveui        AS "devEUI",
  b.status,
  b.tx_id         AS "txId",
  b.record_count  AS "recordCount",
  TO_CHAR(b.created_at   AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "createdAt",
  TO_CHAR(b.sealed_at    AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "sealedAt",
  TO_CHAR(b.committed_at AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "committedAt"
`;

// ── GET /api/batches ──────────────────────────────────────────────────────────
export async function getAllBatches(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${BATCH_SELECT}
       FROM device_data_batch b
       JOIN device d ON d.id = b.device_id
       ORDER BY b.created_at DESC`
    );
    return res.status(200).json({ batches: result.rows });
  } catch (err) {
    console.error("getAllBatches:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/batches/device/:deviceId ─────────────────────────────────────────
export async function getBatchesByDevice(req, res) {
  const { deviceId } = req.params;
  try {
    const result = await pool.query(
      `SELECT ${BATCH_SELECT}
       FROM device_data_batch b
       JOIN device d ON d.id = b.device_id
       WHERE b.device_id = $1
       ORDER BY b.created_at DESC`,
      [deviceId]
    );
    return res.status(200).json({ batches: result.rows });
  } catch (err) {
    console.error("getBatchesByDevice:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/batches/:id/readings ─────────────────────────────────────────────
export async function getBatchReadings(req, res) {
  const { id } = req.params;
  try {
    const batch = await pool.query(
      "SELECT id FROM device_data_batch WHERE id = $1",
      [id]
    );
    if (!batch.rows.length) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const result = await pool.query(
      `SELECT
         id,
         raw_payload AS "rawPayload",
         decoded_data AS "decodedData",
         TO_CHAR(timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "timestamp"
       FROM device_data
       WHERE batch_id = $1
       ORDER BY timestamp DESC`,
      [id]
    );

    return res.status(200).json({ readings: result.rows });
  } catch (err) {
    console.error("getBatchReadings:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── POST /api/batches/:id/seal ────────────────────────────────────────────────
// Seal a batch, and optionally auto-invoke Fabric if ?invoke=true
export async function sealBatch(req, res) {
  const { id } = req.params;
  const autoInvoke = String(req.query.invoke || "").toLowerCase() === "true";

  try {
    const check = await pool.query(
      "SELECT id, status, record_count FROM device_data_batch WHERE id = $1",
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const { status, record_count } = check.rows[0];

    if (status !== "open") {
      return res.status(400).json({ message: `Batch is already ${status}` });
    }

    if (record_count === 0) {
      return res.status(400).json({
        message: "Cannot seal an empty batch — add readings first",
      });
    }

    await pool.query(
      `UPDATE device_data_batch
       SET status = 'sealed', sealed_at = NOW()
       WHERE id = $1`,
      [id]
    );

    const full = await pool.query(
      `SELECT ${BATCH_SELECT}
       FROM device_data_batch b
       JOIN device d ON d.id = b.device_id
       WHERE b.id = $1`,
      [id]
    );

    if (!autoInvoke) {
      return res.status(200).json({
        message: "Batch sealed",
        batch: full.rows[0],
      });
    }

    try {
      const blockchain = await commitSealedBatchById(id);

      const updated = await pool.query(
        `SELECT ${BATCH_SELECT}
         FROM device_data_batch b
         JOIN device d ON d.id = b.device_id
         WHERE b.id = $1`,
        [id]
      );

      return res.status(200).json({
        message: "Batch sealed and committed to blockchain",
        batch: updated.rows[0],
        blockchain,
      });
    } catch (fabricErr) {
      console.error("sealBatch autoInvoke error:", fabricErr.message);

      return res.status(200).json({
        message: "Batch sealed, but blockchain commit failed",
        batch: full.rows[0],
        blockchain: {
          success: false,
          error: fabricErr.message,
        },
      });
    }
  } catch (err) {
    console.error("sealBatch:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── POST /api/batches/:id/invoke ──────────────────────────────────────────────
// Invoke sealed batch to Hyperledger Fabric using real Fabric SDK
export async function invokeBatch(req, res) {
  const { id } = req.params;

  try {
    const check = await pool.query(
      `SELECT ${BATCH_SELECT}
       FROM device_data_batch b
       JOIN device d ON d.id = b.device_id
       WHERE b.id = $1`,
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const batch = check.rows[0];

    if (batch.status !== "sealed") {
      return res.status(400).json({
        message: `Batch must be sealed before invoking. Current status: ${batch.status}`,
      });
    }

    const blockchain = await commitSealedBatchById(id);

    const full = await pool.query(
      `SELECT ${BATCH_SELECT}
       FROM device_data_batch b
       JOIN device d ON d.id = b.device_id
       WHERE b.id = $1`,
      [id]
    );

    return res.status(200).json({
      message: "Batch committed to Hyperledger Fabric",
      blockchain,
      batch: full.rows[0],
    });
  } catch (err) {
    console.error("invokeBatch:", err.message);
    return res.status(500).json({
      message: "Fabric invocation failed",
      detail: err.message,
    });
  }
}