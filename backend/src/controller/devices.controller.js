import pool   from "../config/db.js";
import crypto from "crypto";

function generateCertificateSerial() {
  return crypto.randomBytes(16).toString("hex")
    .toUpperCase()
    .match(/.{2}/g)
    .join(":");
}

// Auto-generate next sequential device ID
async function generateDeviceId() {
  const result = await pool.query(
    `SELECT device_id FROM devices
     WHERE device_id ~ '^DEV-[0-9]+$'
     ORDER BY CAST(SUBSTRING(device_id FROM 5) AS INTEGER) DESC
     LIMIT 1`
  );
  if (result.rows.length === 0) return "DEV-001";
  const num = parseInt(result.rows[0].device_id.replace("DEV-", ""), 10);
  return `DEV-${String(num + 1).padStart(3, "0")}`;
}

const SELECT_FIELDS = `
  id,
  name,
  device_id                                AS "deviceId",
  mac_address                              AS "macAddress",
  location,
  certificate,
  cert_status                              AS "certStatus",
  TO_CHAR(date_added,     'Mon DD, YYYY')  AS "dateAdded",
  TO_CHAR(certified_date, 'Mon DD, YYYY')  AS "certifiedDate",
  TO_CHAR(revoked_date,   'Mon DD, YYYY')  AS "revokedDate"
`;

// ── GET next auto-generated device ID (preview only, not saved) ───────────────
export async function getNextDeviceId(req, res) {
  try {
    const deviceId = await generateDeviceId();
    return res.status(200).json({ deviceId });
  } catch (err) {
    console.error("getNextDeviceId error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET all devices ───────────────────────────────────────────────────────────
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

// ── GET single device ─────────────────────────────────────────────────────────
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

// ── POST add device — device_id auto-generated ────────────────────────────────
export async function addDevice(req, res) {
  const { name, macAddress, location } = req.body;

  if (!name || !macAddress || !location) {
    return res.status(400).json({ message: "Name, MAC Address, and Location are required" });
  }

  try {
    const dupMac = await pool.query(
      "SELECT id FROM devices WHERE mac_address = $1", [macAddress]
    );
    if (dupMac.rows.length > 0) {
      return res.status(409).json({ message: "MAC address already registered" });
    }

    // Generate inside a transaction to avoid race conditions
    const client = await pool.connect();
    let device;
    try {
      await client.query("BEGIN");
      const deviceId = await generateDeviceId();
      const result = await client.query(
        `INSERT INTO devices (name, device_id, mac_address, location)
         VALUES ($1, $2, $3, $4)
         RETURNING ${SELECT_FIELDS}`,
        [name, deviceId, macAddress, location]
      );
      await client.query("COMMIT");
      device = result.rows[0];
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    return res.status(201).json({
      message: `Device added with ID ${device.deviceId}`,
      device,
    });
  } catch (err) {
    console.error("addDevice error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── PUT edit device — blocked if signed OR revoked ────────────────────────────
export async function editDevice(req, res) {
  const { id }                         = req.params;
  const { name, macAddress, location } = req.body;

  if (!name || !macAddress || !location) {
    return res.status(400).json({ message: "Name, MAC Address, and Location are required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id, cert_status FROM devices WHERE id = $1", [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }

    const status = existing.rows[0].cert_status;
    if (status === "signed") {
      return res.status(403).json({ message: "Cannot edit a device with a signed certificate. Revoke it first." });
    }
    if (status === "revoked") {
      return res.status(403).json({ message: "Cannot edit a revoked device." });
    }

    const dupMac = await pool.query(
      "SELECT id FROM devices WHERE mac_address = $1 AND id != $2", [macAddress, id]
    );
    if (dupMac.rows.length > 0) {
      return res.status(409).json({ message: "MAC address already in use" });
    }

    // device_id is never changed on edit
    const result = await pool.query(
      `UPDATE devices
       SET name        = $1,
           mac_address = $2,
           location    = $3
       WHERE id = $4
       RETURNING ${SELECT_FIELDS}`,
      [name, macAddress, location, id]
    );

    return res.status(200).json({
      message: "Device updated successfully",
      device:  result.rows[0],
    });
  } catch (err) {
    console.error("editDevice error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── DELETE remove device ──────────────────────────────────────────────────────
export async function deleteDevice(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM devices WHERE id = $1 RETURNING id, name", [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }
    return res.status(200).json({
      message: `Device "${result.rows[0].name}" removed successfully`,
    });
  } catch (err) {
    console.error("deleteDevice error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── GET generate certificate preview ─────────────────────────────────────────
export async function generateCertificate(req, res) {
  try {
    return res.status(200).json({ certificate: generateCertificateSerial() });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

// ── PUT sign certificate ──────────────────────────────────────────────────────
export async function signCertificate(req, res) {
  const { id }          = req.params;
  const { certificate } = req.body;

  if (!certificate) {
    return res.status(400).json({ message: "Certificate serial is required" });
  }

  try {
    const existing = await pool.query(
      "SELECT id, cert_status FROM devices WHERE id = $1", [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }
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

    return res.status(200).json({
      message: "Certificate signed successfully",
      device:  result.rows[0],
    });
  } catch (err) {
    console.error("signCertificate error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
}

// ── PUT revoke certificate ────────────────────────────────────────────────────
export async function revokeCertificate(req, res) {
  const { id } = req.params;
  try {
    const existing = await pool.query(
      "SELECT id, cert_status FROM devices WHERE id = $1", [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Device not found" });
    }
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