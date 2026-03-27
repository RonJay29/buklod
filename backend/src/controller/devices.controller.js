import pool   from "../config/db.js";
import crypto from "crypto";

function generateCertificateSerial() {
  return crypto.randomBytes(16).toString("hex")
    .toUpperCase()
    .match(/.{2}/g)
    .join(":");
}

const SELECT_FIELDS = `
  id,
  name,
  deveui                                   AS "deviceId",
  location,
  certificate,
  hmac_length                              AS "hmacLength",
  cert_status                              AS "certStatus",
  TO_CHAR(date_added,     'Mon DD, YYYY')  AS "dateAdded",
  TO_CHAR(certified_date, 'Mon DD, YYYY')  AS "certifiedDate",
  TO_CHAR(revoked_date,   'Mon DD, YYYY')  AS "revokedDate"
`;

// ── GET /api/devices ───────────────────────────────────────────────────────
export async function getAllDevices(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM devices ORDER BY date_added DESC`
    );
    return res.status(200).json({ devices: result.rows });
  } catch (err) {
    console.error("getAllDevices error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/devices/:id ───────────────────────────────────────────────────
export async function getDevice(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT ${SELECT_FIELDS} FROM devices WHERE id = $1`, [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }
    return res.status(200).json({ device: result.rows[0] });
  } catch (err) {
    console.error("getDevice error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── POST /api/devices ──────────────────────────────────────────────────────
export async function addDevice(req, res) {
  const { name, location, devEUI, hmacLength, certificate } = req.body;

  if (!name || !location || !devEUI) {
    return res.status(400).json({ message: "Name, location, and DevEUI are required" });
  }

  const normalizedEUI = devEUI.toUpperCase();
  if (!/^[0-9A-F]{16}$/.test(normalizedEUI)) {
    return res.status(400).json({ message: "DevEUI must be exactly 16 hex characters" });
  }

  const isUnsigned = !certificate || certificate === "UNSIGNED";
  const certValue  = isUnsigned ? null : certificate;
  const certStatus = isUnsigned ? "unsigned" : "signed";

  if (!isUnsigned && !certificate.includes(":")) {
    return res.status(400).json({ message: "Invalid certificate serial format" });
  }

  try {
    const existing = await pool.query(
      "SELECT id FROM devices WHERE deveui = $1", [normalizedEUI]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: "Device with this DevEUI already exists" });
    }

    let result;
    if (isUnsigned) {
      result = await pool.query(
        `INSERT INTO devices (name, deveui, location, hmac_length, cert_status, date_added)
         VALUES ($1, $2, $3, $4, 'unsigned', NOW())
         RETURNING ${SELECT_FIELDS}`,
        [name, normalizedEUI, location, hmacLength || 16]
      );
    } else {
      result = await pool.query(
        `INSERT INTO devices (name, deveui, location, certificate, hmac_length, cert_status, certified_date, date_added)
         VALUES ($1, $2, $3, $4, $5, 'signed', NOW(), NOW())
         RETURNING ${SELECT_FIELDS}`,
        [name, normalizedEUI, location, certValue, hmacLength || 16]
      );
    }

    return res.status(201).json({ message: "Device enrolled successfully", device: result.rows[0] });
  } catch (err) {
    console.error("addDevice error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── PUT /api/devices/:id ───────────────────────────────────────────────────
export async function editDevice(req, res) {
  const { id }             = req.params;
  const { name, location } = req.body;

  if (!name || !location) {
    return res.status(400).json({ message: "Name and location are required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id, cert_status FROM devices WHERE id = $1", [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }
    const status = existing.rows[0].cert_status;
    if (status === "signed")  return res.status(403).json({ message: "Cannot edit a signed device. Revoke first." });
    if (status === "revoked") return res.status(403).json({ message: "Cannot edit a revoked device." });

    const result = await pool.query(
      `UPDATE devices SET name = $1, location = $2 WHERE id = $3 RETURNING ${SELECT_FIELDS}`,
      [name, location, id]
    );
    return res.status(200).json({ message: "Device updated successfully", device: result.rows[0] });
  } catch (err) {
    console.error("editDevice error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── DELETE /api/devices/:id ────────────────────────────────────────────────
export async function deleteDevice(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM devices WHERE id = $1 RETURNING id, name", [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }
    return res.status(200).json({ message: `Device "${result.rows[0].name}" removed successfully` });
  } catch (err) {
    console.error("deleteDevice error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/devices/generate-certificate ─────────────────────────────────
export async function generateCertificate(req, res) {
  try {
    return res.status(200).json({ certificate: generateCertificateSerial() });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

// ── PUT /api/devices/:id/sign-certificate ─────────────────────────────────
export async function signCertificate(req, res) {
  const { id }          = req.params;
  const { certificate } = req.body;

  if (!certificate) {
    return res.status(400).json({ message: "Certificate is required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id, cert_status FROM devices WHERE id = $1", [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ message: "Device not found" });

    // Allow re-signing a revoked device (the frontend Re-sign flow calls this)
    if (existing.rows[0].cert_status === "signed") {
      return res.status(409).json({ message: "Device already has a signed certificate" });
    }

    const result = await pool.query(
      `UPDATE devices
       SET certificate    = $1,
           cert_status    = 'signed',
           certified_date = NOW(),
           revoked_date   = NULL
       WHERE id = $2
       RETURNING ${SELECT_FIELDS}`,
      [certificate, id]
    );
    return res.status(200).json({ message: "Certificate signed successfully", device: result.rows[0] });
  } catch (err) {
    console.error("signCertificate error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── PUT /api/devices/:id/revoke-certificate ───────────────────────────────
export async function revokeCertificate(req, res) {
  const { id } = req.params;
  try {
    const existing = await pool.query(
      "SELECT id, cert_status FROM devices WHERE id = $1", [id]
    );
    if (existing.rows.length === 0) return res.status(404).json({ message: "Device not found" });
    if (existing.rows[0].cert_status !== "signed") {
      return res.status(400).json({ message: "Only signed certificates can be revoked" });
    }

    const result = await pool.query(
      `UPDATE devices
       SET certificate  = NULL,
           cert_status  = 'revoked',
           revoked_date = NOW()
       WHERE id = $1
       RETURNING ${SELECT_FIELDS}`,
      [id]
    );
    return res.status(200).json({
      message: `Certificate revoked for "${result.rows[0].name}"`,
      device:  result.rows[0],
    });
  } catch (err) {
    console.error("revokeCertificate error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── Utility: check whether a table exists in the public schema ─────────────
async function tableExists(tableName) {
  const { rows } = await pool.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1
     LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

// ── GET /api/devices/:id/data ──────────────────────────────────────────────
// Returns sensor readings for a single device.
// Gracefully returns an empty array if sensor_readings does not exist yet.
export async function getDeviceData(req, res) {
  const { id }  = req.params;
  const limit   = Math.min(parseInt(req.query.limit  ?? "200", 10), 500);
  const offset  = parseInt(req.query.offset ?? "0", 10);

  try {
    const deviceCheck = await pool.query(
      "SELECT id, name FROM devices WHERE id = $1", [id]
    );
    if (deviceCheck.rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Return empty result gracefully when the readings table doesn't exist yet
    if (!(await tableExists("sensor_readings"))) {
      return res.status(200).json({
        deviceId: deviceCheck.rows[0].id,
        name:     deviceCheck.rows[0].name,
        total:    0,
        limit,
        offset,
        readings: [],
      });
    }

    const result = await pool.query(
      `SELECT
         sr.id,
         sr.temperature,
         sr.humidity,
         sr.soil_moisture                                 AS "soilMoisture",
         sr.rainfall,
         sr.certificate,
         TO_CHAR(sr.received_at, 'Mon DD, YYYY HH24:MI') AS "timestamp"
       FROM sensor_readings sr
       WHERE sr.device_id = $1
       ORDER BY sr.received_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) AS total FROM sensor_readings WHERE device_id = $1", [id]
    );

    return res.status(200).json({
      deviceId: deviceCheck.rows[0].id,
      name:     deviceCheck.rows[0].name,
      total:    parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
      readings: result.rows,
    });
  } catch (err) {
    console.error("getDeviceData error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET /api/devices/data/all ──────────────────────────────────────────────
// Returns all sensor readings joined with device info.
// Returns an EMPTY 200 response (not 500) when sensor_readings doesn't exist.
// This prevents the "All Received Data" card from showing a server error
// before the IoT devices have sent any data.
export async function getAllDeviceData(req, res) {
  const limit  = Math.min(parseInt(req.query.limit  ?? "200", 10), 500);
  const offset = parseInt(req.query.offset ?? "0", 10);

  try {
    // ── Guard: table does not exist yet → return empty, not 500 ───────────
    if (!(await tableExists("sensor_readings"))) {
      return res.status(200).json({ total: 0, limit, offset, readings: [] });
    }

    const result = await pool.query(
      `SELECT
         sr.id,
         d.name                                           AS device,
         d.deveui                                         AS "deviceId",
         sr.temperature,
         sr.humidity,
         sr.soil_moisture                                 AS "soilMoisture",
         sr.rainfall,
         sr.certificate,
         TO_CHAR(sr.received_at, 'Mon DD, YYYY HH24:MI') AS "timestamp"
       FROM   sensor_readings sr
       JOIN   devices d ON d.id = sr.device_id
       ORDER  BY sr.received_at DESC
       LIMIT  $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(
      "SELECT COUNT(*) AS total FROM sensor_readings"
    );

    return res.status(200).json({
      total:    parseInt(countResult.rows[0].total, 10),
      limit,
      offset,
      readings: result.rows,
    });
  } catch (err) {
    console.error("getAllDeviceData error:", err.message);
    return res.status(500).json({
      message: "Server error",
      ...(process.env.NODE_ENV !== "production" && { detail: err.message }),
    });
  }
}