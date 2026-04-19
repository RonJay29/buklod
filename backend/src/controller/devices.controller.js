// import pool   from "../config/db.js";
// import crypto from "crypto";

// function generateCertificateSerial() {
//   return crypto.randomBytes(16).toString("hex")
//     .toUpperCase().match(/.{2}/g).join(":");
// }

// // ── Shared SELECT — joins all 3 tables ────────────────────────────────────────
// const SELECT_FIELDS = `
//   d.id,
//   d.device_name                              AS "name",
//   d.deveui                                   AS "deviceId",
//   d.description,
//   d.location,
//   TO_CHAR(d.timestamp, 'Mon DD, YYYY')       AS "dateAdded",
//   di.identity_status                         AS "certStatus",
//   di.certificate,
//   TO_CHAR(di.signed_date,  'Mon DD, YYYY')   AS "certifiedDate",
//   TO_CHAR(di.revoked_date, 'Mon DD, YYYY')   AS "revokedDate"
// `;

// const FROM_JOINED = `
//   FROM device d
//   LEFT JOIN device_identity di ON di.device_id = d.id
// `;

// // ── GET /api/devices ──────────────────────────────────────────────────────────
// export async function getAllDevices(req, res) {
//   try {
//     const result = await pool.query(
//       `SELECT ${SELECT_FIELDS} ${FROM_JOINED} ORDER BY d.timestamp DESC`
//     );
//     return res.status(200).json({ devices: result.rows });
//   } catch (err) {
//     console.error("getAllDevices:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── GET /api/devices/:id ──────────────────────────────────────────────────────
// export async function getDevice(req, res) {
//   const { id } = req.params;
//   try {
//     const result = await pool.query(
//       `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`, [id]
//     );
//     if (!result.rows.length) return res.status(404).json({ message: "Device not found" });
//     return res.status(200).json({ device: result.rows[0] });
//   } catch (err) {
//     console.error("getDevice:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── POST /api/devices ─────────────────────────────────────────────────────────
// export async function addDevice(req, res) {
//   const { name, location, description, devEUI, certificate } = req.body;

//   if (!name || !location || !devEUI) {
//     return res.status(400).json({ message: "Name, location, and DevEUI are required" });
//   }

//   const normalizedEUI = devEUI.trim().toUpperCase();
//   if (!/^[0-9A-F]{16}$/.test(normalizedEUI)) {
//     return res.status(400).json({ message: "DevEUI must be exactly 16 hex characters" });
//   }

//   const isUnsigned = !certificate || certificate === "UNSIGNED";

//   const client = await pool.connect();
//   try {
//     await client.query("BEGIN");

//     // Check duplicate DevEUI
//     const dup = await client.query("SELECT id FROM device WHERE deveui = $1", [normalizedEUI]);
//     if (dup.rows.length > 0) {
//       await client.query("ROLLBACK");
//       return res.status(409).json({ message: "Device with this DevEUI already exists" });
//     }

//     // Insert into device
//     const deviceResult = await client.query(
//       `INSERT INTO device (device_name, deveui, description, location)
//        VALUES ($1, $2, $3, $4)
//        RETURNING id`,
//       [name.trim(), normalizedEUI, description?.trim() || null, location.trim()]
//     );
//     const deviceId = deviceResult.rows[0].id;

//     // Insert into device_identity
//     if (isUnsigned) {
//       await client.query(
//         `INSERT INTO device_identity (device_id, identity_status) VALUES ($1, 'unsigned')`,
//         [deviceId]
//       );
//     } else {
//       await client.query(
//         `INSERT INTO device_identity (device_id, identity_status, certificate, signed_date)
//          VALUES ($1, 'signed', $2, NOW())`,
//         [deviceId, certificate]
//       );
//     }

//     await client.query("COMMIT");

//     // Return full joined row
//     const full = await pool.query(
//       `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`, [deviceId]
//     );
//     return res.status(201).json({ message: "Device enrolled successfully", device: full.rows[0] });
//   } catch (err) {
//     await client.query("ROLLBACK");
//     console.error("addDevice:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   } finally {
//     client.release();
//   }
// }

// // ── PUT /api/devices/:id ──────────────────────────────────────────────────────
// // Only allowed when identity_status = 'unsigned'
// export async function editDevice(req, res) {
//   const { id }                           = req.params;
//   const { name, location, description }  = req.body;

//   if (!name || !location) {
//     return res.status(400).json({ message: "Name and location are required" });
//   }

//   try {
//     // Check status via device_identity
//     const check = await pool.query(
//       `SELECT di.identity_status FROM device d
//        JOIN device_identity di ON di.device_id = d.id
//        WHERE d.id = $1`, [id]
//     );
//     if (!check.rows.length) return res.status(404).json({ message: "Device not found" });

//     const status = check.rows[0].identity_status;
//     if (status === "signed")  return res.status(403).json({ message: "Cannot edit a signed device. Revoke first." });
//     if (status === "revoked") return res.status(403).json({ message: "Cannot edit a revoked device." });

//     await pool.query(
//       `UPDATE device SET device_name = $1, location = $2, description = $3 WHERE id = $4`,
//       [name.trim(), location.trim(), description?.trim() || null, id]
//     );

//     const full = await pool.query(
//       `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`, [id]
//     );
//     return res.status(200).json({ message: "Device updated", device: full.rows[0] });
//   } catch (err) {
//     console.error("editDevice:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── DELETE /api/devices/:id ───────────────────────────────────────────────────
// export async function deleteDevice(req, res) {
//   const { id } = req.params;
//   try {
//     // CASCADE deletes device_identity and device_data rows automatically
//     const result = await pool.query(
//       "DELETE FROM device WHERE id = $1 RETURNING device_name", [id]
//     );
//     if (!result.rows.length) return res.status(404).json({ message: "Device not found" });
//     return res.status(200).json({ message: `Device "${result.rows[0].device_name}" removed` });
//   } catch (err) {
//     console.error("deleteDevice:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── GET /api/devices/generate-certificate ────────────────────────────────────
// export async function generateCertificate(req, res) {
//   return res.status(200).json({ certificate: generateCertificateSerial() });
// }

// // ── PUT /api/devices/:id/sign-certificate ────────────────────────────────────
// export async function signCertificate(req, res) {
//   const { id }          = req.params;
//   const { certificate } = req.body;

//   if (!certificate) return res.status(400).json({ message: "Certificate is required" });

//   try {
//     const check = await pool.query(
//       "SELECT id, identity_status FROM device_identity WHERE device_id = $1", [id]
//     );
//     if (!check.rows.length) return res.status(404).json({ message: "Device not found" });
//     if (check.rows[0].identity_status === "signed") {
//       return res.status(409).json({ message: "Device already has a signed certificate" });
//     }

//     await pool.query(
//       `UPDATE device_identity
//        SET identity_status = 'signed',
//            certificate     = $1,
//            signed_date     = NOW(),
//            revoked_date    = NULL
//        WHERE device_id = $2`,
//       [certificate, id]
//     );

//     const full = await pool.query(
//       `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`, [id]
//     );
//     return res.status(200).json({ message: "Certificate signed", device: full.rows[0] });
//   } catch (err) {
//     console.error("signCertificate:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── PUT /api/devices/:id/revoke-certificate ───────────────────────────────────
// export async function revokeCertificate(req, res) {
//   const { id } = req.params;
//   try {
//     const check = await pool.query(
//       "SELECT id, identity_status FROM device_identity WHERE device_id = $1", [id]
//     );
//     if (!check.rows.length) return res.status(404).json({ message: "Device not found" });
//     if (check.rows[0].identity_status !== "signed") {
//       return res.status(400).json({ message: "Only signed certificates can be revoked" });
//     }

//     await pool.query(
//       `UPDATE device_identity
//        SET identity_status = 'revoked',
//            certificate     = NULL,
//            revoked_date    = NOW()
//        WHERE device_id = $1`,
//       [id]
//     );

//     const full = await pool.query(
//       `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`, [id]
//     );
//     return res.status(200).json({ message: "Certificate revoked", device: full.rows[0] });
//   } catch (err) {
//     console.error("revokeCertificate:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── GET /api/devices/:id/data ─────────────────────────────────────────────────
// export async function getDeviceData(req, res) {
//   const { id }  = req.params;
//   const limit   = Math.min(parseInt(req.query.limit  ?? "200", 10), 500);
//   const offset  = parseInt(req.query.offset ?? "0", 10);

//   try {
//     const deviceCheck = await pool.query(
//       "SELECT id, device_name FROM device WHERE id = $1", [id]
//     );
//     if (!deviceCheck.rows.length) return res.status(404).json({ message: "Device not found" });

//     const result = await pool.query(
//       `SELECT id, raw_payload AS "rawPayload", decoded_data AS "decodedData",
//               TO_CHAR(timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "timestamp"
//        FROM device_data WHERE device_id = $1
//        ORDER BY timestamp DESC LIMIT $2 OFFSET $3`,
//       [id, limit, offset]
//     );
//     const total = await pool.query(
//       "SELECT COUNT(*) AS total FROM device_data WHERE device_id = $1", [id]
//     );
//     return res.status(200).json({
//       deviceId: id, name: deviceCheck.rows[0].device_name,
//       total: parseInt(total.rows[0].total, 10), limit, offset,
//       readings: result.rows,
//     });
//   } catch (err) {
//     console.error("getDeviceData:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── GET /api/devices/data/all ─────────────────────────────────────────────────
// export async function getAllDeviceData(req, res) {
//   const limit  = Math.min(parseInt(req.query.limit  ?? "200", 10), 500);
//   const offset = parseInt(req.query.offset ?? "0", 10);

//   try {
//     const result = await pool.query(
//       `SELECT dd.id, d.device_name AS device, d.deveui AS "deviceId",
//               dd.raw_payload AS "rawPayload", dd.decoded_data AS "decodedData",
//               TO_CHAR(dd.timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "timestamp"
//        FROM device_data dd
//        JOIN device d ON d.id = dd.device_id
//        ORDER BY dd.timestamp DESC LIMIT $1 OFFSET $2`,
//       [limit, offset]
//     );
//     const total = await pool.query("SELECT COUNT(*) AS total FROM device_data");
//     return res.status(200).json({
//       total: parseInt(total.rows[0].total, 10), limit, offset,
//       readings: result.rows,
//     });
//   } catch (err) {
//     console.error("getAllDeviceData:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }

// // ── POST /api/devices/:id/data ────────────────────────────────────────────────
// // Save a manually simulated or incoming sensor reading
// export async function saveDeviceData(req, res) {
//   const { id }                       = req.params;
//   const { rawPayload, decodedData }  = req.body;

//   if (!rawPayload) {
//     return res.status(400).json({ message: "rawPayload is required" });
//   }

//   try {
//     const deviceCheck = await pool.query(
//       "SELECT id, device_name FROM device WHERE id = $1", [id]
//     );
//     if (!deviceCheck.rows.length) {
//       return res.status(404).json({ message: "Device not found" });
//     }

//     // Ensure device is certified before accepting data
//     const identity = await pool.query(
//       "SELECT identity_status FROM device_identity WHERE device_id = $1", [id]
//     );
//     if (!identity.rows.length || identity.rows[0].identity_status !== "signed") {
//       return res.status(403).json({
//         message: "Device must have a signed certificate before data can be saved",
//       });
//     }

//     // ── Find or create open batch for this device ──────────────────────────
//     let batchId = null;
//     const existingBatch = await pool.query(
//       "SELECT id FROM device_data_batch WHERE device_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 1",
//       [id]
//     );
//     if (existingBatch.rows.length > 0) {
//       batchId = existingBatch.rows[0].id;
//     } else {
//       const newBatch = await pool.query(
//         "INSERT INTO device_data_batch (device_id) VALUES ($1) RETURNING id",
//         [id]
//       );
//       batchId = newBatch.rows[0].id;
//     }

//     // ── Insert reading linked to batch ──────────────────────────────────────
//     const result = await pool.query(
//       `INSERT INTO device_data (device_id, raw_payload, decoded_data, batch_id)
//        VALUES ($1, $2, $3, $4)
//        RETURNING id, raw_payload AS "rawPayload", decoded_data AS "decodedData",
//                  TO_CHAR(timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "timestamp"`,
//       [id, rawPayload.trim(), decodedData ? JSON.stringify(decodedData) : null, batchId]
//     );

//     // ── Increment batch record count ────────────────────────────────────────
//     await pool.query(
//       "UPDATE device_data_batch SET record_count = record_count + 1 WHERE id = $1",
//       [batchId]
//     );

//     return res.status(201).json({
//       message: "Data saved successfully",
//       batchId,
//       data:    result.rows[0],
//     });
//   } catch (err) {
//     console.error("saveDeviceData:", err.message);
//     return res.status(500).json({ message: "Server error" });
//   }
// }
import pool from "../config/db.js";
import crypto from "crypto";
import { registerDeviceOnChainById } from "./fabric.controller.js";

function generateCertificateSerial() {
  return crypto.randomBytes(16).toString("hex")
    .toUpperCase().match(/.{2}/g).join(":");
}

// ── Shared SELECT — joins all 3 tables ────────────────────────────────────────
const SELECT_FIELDS = `
  d.id,
  d.device_name                              AS "name",
  d.deveui                                   AS "deviceId",
  d.description,
  d.location,
  TO_CHAR(d.timestamp, 'Mon DD, YYYY')       AS "dateAdded",
  di.identity_status                         AS "certStatus",
  di.certificate,
  TO_CHAR(di.signed_date,  'Mon DD, YYYY')   AS "certifiedDate",
  TO_CHAR(di.revoked_date, 'Mon DD, YYYY')   AS "revokedDate"
`;

const FROM_JOINED = `
  FROM device d
  LEFT JOIN device_identity di ON di.device_id = d.id
`;

// ── GET /api/devices ──────────────────────────────────────────────────────────
export async function getAllDevices(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${SELECT_FIELDS} ${FROM_JOINED} ORDER BY d.timestamp DESC`
    );
    return res.status(200).json({ devices: result.rows });
  } catch (err) {
    console.error("getAllDevices:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/devices/:id ──────────────────────────────────────────────────────
export async function getDevice(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`,
      [id]
    );
    if (!result.rows.length) {
      return res.status(404).json({ message: "Device not found" });
    }
    return res.status(200).json({ device: result.rows[0] });
  } catch (err) {
    console.error("getDevice:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── POST /api/devices ─────────────────────────────────────────────────────────
// Save to PostgreSQL first, then auto-register on blockchain
export async function addDevice(req, res) {
  const { name, location, description, devEUI, certificate } = req.body;

  if (!name || !location || !devEUI) {
    return res.status(400).json({
      message: "Name, location, and DevEUI are required",
    });
  }

  const normalizedEUI = devEUI.trim().toUpperCase();
  if (!/^[0-9A-F]{16}$/.test(normalizedEUI)) {
    return res.status(400).json({
      message: "DevEUI must be exactly 16 hex characters",
    });
  }

  const isUnsigned = !certificate || certificate === "UNSIGNED";

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const dup = await client.query(
      "SELECT id FROM device WHERE deveui = $1",
      [normalizedEUI]
    );
    if (dup.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        message: "Device with this DevEUI already exists",
      });
    }

    const deviceResult = await client.query(
      `INSERT INTO device (device_name, deveui, description, location)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name.trim(), normalizedEUI, description?.trim() || null, location.trim()]
    );
    const deviceId = deviceResult.rows[0].id;

    if (isUnsigned) {
      await client.query(
        `INSERT INTO device_identity (device_id, identity_status)
         VALUES ($1, 'unsigned')`,
        [deviceId]
      );
    } else {
      await client.query(
        `INSERT INTO device_identity (device_id, identity_status, certificate, signed_date)
         VALUES ($1, 'signed', $2, NOW())`,
        [deviceId, certificate]
      );
    }

    await client.query("COMMIT");

    const full = await pool.query(
      `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`,
      [deviceId]
    );

    let blockchain = null;
    let blockchainError = null;

    try {
      blockchain = await registerDeviceOnChainById(deviceId);
    } catch (error) {
      console.error("Auto blockchain registration failed:", error.message);
      blockchainError = error.message;
    }

    if (blockchainError) {
      return res.status(201).json({
        message: "Device enrolled in PostgreSQL, but blockchain registration failed",
        device: full.rows[0],
        blockchain: {
          success: false,
          error: blockchainError,
        },
      });
    }

    return res.status(201).json({
      message: "Device enrolled successfully in PostgreSQL and blockchain",
      device: full.rows[0],
      blockchain,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("addDevice:", err.message);
    return res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
}

// ── PUT /api/devices/:id ──────────────────────────────────────────────────────
export async function editDevice(req, res) {
  const { id } = req.params;
  const { name, location, description } = req.body;

  if (!name || !location) {
    return res.status(400).json({ message: "Name and location are required" });
  }

  try {
    const check = await pool.query(
      `SELECT di.identity_status FROM device d
       JOIN device_identity di ON di.device_id = d.id
       WHERE d.id = $1`,
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Device not found" });
    }

    const status = check.rows[0].identity_status;
    if (status === "signed") {
      return res.status(403).json({ message: "Cannot edit a signed device. Revoke first." });
    }
    if (status === "revoked") {
      return res.status(403).json({ message: "Cannot edit a revoked device." });
    }

    await pool.query(
      `UPDATE device
       SET device_name = $1, location = $2, description = $3
       WHERE id = $4`,
      [name.trim(), location.trim(), description?.trim() || null, id]
    );

    const full = await pool.query(
      `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`,
      [id]
    );

    return res.status(200).json({
      message: "Device updated",
      device: full.rows[0],
    });
  } catch (err) {
    console.error("editDevice:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── DELETE /api/devices/:id ───────────────────────────────────────────────────
export async function deleteDevice(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM device WHERE id = $1 RETURNING device_name",
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Device not found" });
    }

    return res.status(200).json({
      message: `Device "${result.rows[0].device_name}" removed`,
    });
  } catch (err) {
    console.error("deleteDevice:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/devices/generate-certificate ────────────────────────────────────
export async function generateCertificate(req, res) {
  return res.status(200).json({
    certificate: generateCertificateSerial(),
  });
}

// ── PUT /api/devices/:id/sign-certificate ────────────────────────────────────
export async function signCertificate(req, res) {
  const { id } = req.params;
  const { certificate } = req.body;

  if (!certificate) {
    return res.status(400).json({ message: "Certificate is required" });
  }

  try {
    const check = await pool.query(
      "SELECT id, identity_status FROM device_identity WHERE device_id = $1",
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Device not found" });
    }

    if (check.rows[0].identity_status === "signed") {
      return res.status(409).json({
        message: "Device already has a signed certificate",
      });
    }

    await pool.query(
      `UPDATE device_identity
       SET identity_status = 'signed',
           certificate     = $1,
           signed_date     = NOW(),
           revoked_date    = NULL
       WHERE device_id = $2`,
      [certificate, id]
    );

    const full = await pool.query(
      `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`,
      [id]
    );

    return res.status(200).json({
      message: "Certificate signed",
      device: full.rows[0],
    });
  } catch (err) {
    console.error("signCertificate:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── PUT /api/devices/:id/revoke-certificate ───────────────────────────────────
export async function revokeCertificate(req, res) {
  const { id } = req.params;

  try {
    const check = await pool.query(
      "SELECT id, identity_status FROM device_identity WHERE device_id = $1",
      [id]
    );

    if (!check.rows.length) {
      return res.status(404).json({ message: "Device not found" });
    }

    if (check.rows[0].identity_status !== "signed") {
      return res.status(400).json({
        message: "Only signed certificates can be revoked",
      });
    }

    await pool.query(
      `UPDATE device_identity
       SET identity_status = 'revoked',
           certificate     = NULL,
           revoked_date    = NOW()
       WHERE device_id = $1`,
      [id]
    );

    const full = await pool.query(
      `SELECT ${SELECT_FIELDS} ${FROM_JOINED} WHERE d.id = $1`,
      [id]
    );

    return res.status(200).json({
      message: "Certificate revoked",
      device: full.rows[0],
    });
  } catch (err) {
    console.error("revokeCertificate:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/devices/:id/data ─────────────────────────────────────────────────
export async function getDeviceData(req, res) {
  const { id } = req.params;
  const limit = Math.min(parseInt(req.query.limit ?? "200", 10), 500);
  const offset = parseInt(req.query.offset ?? "0", 10);

  try {
    const deviceCheck = await pool.query(
      "SELECT id, device_name FROM device WHERE id = $1",
      [id]
    );

    if (!deviceCheck.rows.length) {
      return res.status(404).json({ message: "Device not found" });
    }

    const result = await pool.query(
      `SELECT
         id,
         raw_payload AS "rawPayload",
         decoded_data AS "decodedData",
         TO_CHAR(timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "timestamp"
       FROM device_data
       WHERE device_id = $1
       ORDER BY timestamp DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const total = await pool.query(
      "SELECT COUNT(*) AS total FROM device_data WHERE device_id = $1",
      [id]
    );

    return res.status(200).json({
      deviceId: id,
      name: deviceCheck.rows[0].device_name,
      total: parseInt(total.rows[0].total, 10),
      limit,
      offset,
      readings: result.rows,
    });
  } catch (err) {
    console.error("getDeviceData:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/devices/data/all ─────────────────────────────────────────────────
export async function getAllDeviceData(req, res) {
  const limit = Math.min(parseInt(req.query.limit ?? "200", 10), 500);
  const offset = parseInt(req.query.offset ?? "0", 10);

  try {
    const result = await pool.query(
      `SELECT
         dd.id,
         d.device_name AS device,
         d.deveui AS "deviceId",
         dd.raw_payload AS "rawPayload",
         dd.decoded_data AS "decodedData",
         TO_CHAR(dd.timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "timestamp"
       FROM device_data dd
       JOIN device d ON d.id = dd.device_id
       ORDER BY dd.timestamp DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const total = await pool.query("SELECT COUNT(*) AS total FROM device_data");

    return res.status(200).json({
      total: parseInt(total.rows[0].total, 10),
      limit,
      offset,
      readings: result.rows,
    });
  } catch (err) {
    console.error("getAllDeviceData:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── POST /api/devices/:id/data ────────────────────────────────────────────────
export async function saveDeviceData(req, res) {
  const { id } = req.params;
  const { rawPayload, decodedData } = req.body;

  if (!rawPayload) {
    return res.status(400).json({ message: "rawPayload is required" });
  }

  try {
    const deviceCheck = await pool.query(
      "SELECT id, device_name FROM device WHERE id = $1",
      [id]
    );

    if (!deviceCheck.rows.length) {
      return res.status(404).json({ message: "Device not found" });
    }

    const identity = await pool.query(
      "SELECT identity_status FROM device_identity WHERE device_id = $1",
      [id]
    );

    if (!identity.rows.length || identity.rows[0].identity_status !== "signed") {
      return res.status(403).json({
        message: "Device must have a signed certificate before data can be saved",
      });
    }

    let batchId = null;

    const existingBatch = await pool.query(
      `SELECT id
       FROM device_data_batch
       WHERE device_id = $1 AND status = 'open'
       ORDER BY created_at DESC
       LIMIT 1`,
      [id]
    );

    if (existingBatch.rows.length > 0) {
      batchId = existingBatch.rows[0].id;
    } else {
      const newBatch = await pool.query(
        "INSERT INTO device_data_batch (device_id) VALUES ($1) RETURNING id",
        [id]
      );
      batchId = newBatch.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO device_data (device_id, raw_payload, decoded_data, batch_id)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         raw_payload AS "rawPayload",
         decoded_data AS "decodedData",
         TO_CHAR(timestamp AT TIME ZONE 'Asia/Manila', 'MM/DD/YY HH12:MI AM') AS "timestamp"`,
      [id, rawPayload.trim(), decodedData ? JSON.stringify(decodedData) : null, batchId]
    );

    await pool.query(
      "UPDATE device_data_batch SET record_count = record_count + 1 WHERE id = $1",
      [batchId]
    );

    return res.status(201).json({
      message: "Data saved successfully",
      batchId,
      data: result.rows[0],
    });
  } catch (err) {
    console.error("saveDeviceData:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}