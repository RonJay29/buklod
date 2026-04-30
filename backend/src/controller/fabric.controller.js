// import pool from "../config/db.js";
// import { getContract } from "../config/fabric.js";

// function parseFabricResult(resultBytes) {
//   if (!resultBytes) return null;

//   const raw = resultBytes.toString().trim();
//   if (!raw) return null;

//   try {
//     return JSON.parse(raw);
//   } catch {
//     return { raw };
//   }
// }

// export async function fabricHealth(req, res) {
//   return res.json({
//     ok: true,
//     message: "Fabric backend route is ready",
//   });
// }

// export async function registerDeviceOnChainById(deviceId) {
//   let gateway;
//   let client;

//   try {
//     const result = await pool.query(
//       `
//       SELECT
//         d.id AS "deviceId",
//         d.device_name AS "deviceName",
//         d.deveui AS "devEUI",
//         d.location,
//         d.description,
//         di.identity_status AS "identityStatus",
//         di.certificate,
//         di.signed_date AS "signedDate",
//         di.revoked_date AS "revokedDate",
//         d.timestamp AS "registeredAt"
//       FROM device d
//       LEFT JOIN device_identity di ON di.device_id = d.id
//       WHERE d.id = $1
//       `,
//       [deviceId]
//     );

//     if (!result.rows.length) {
//       throw new Error("Device not found in PostgreSQL");
//     }

//     const row = result.rows[0];

//     const payload = {
//       deviceId: row.deviceId,
//       deviceName: row.deviceName,
//       devEUI: row.devEUI,
//       location: row.location,
//       description: row.description ?? "",
//       identityStatus: row.identityStatus ?? "unsigned",
//       certificate: row.certificate ?? "",
//       signedDate: row.signedDate ? new Date(row.signedDate).toISOString() : "",
//       revokedDate: row.revokedDate ? new Date(row.revokedDate).toISOString() : "",
//       registeredAt: row.registeredAt ? new Date(row.registeredAt).toISOString() : "",
//       status: "active",
//     };

//     const conn = await getContract();
//     gateway = conn.gateway;
//     client = conn.client;

//     const resultBytes = await conn.contract.submitTransaction(
//       "RegisterDevice",
//       JSON.stringify(payload)
//     );

//     return {
//       success: true,
//       function: "RegisterDevice",
//       message: "Device registered on blockchain successfully",
//       data: parseFabricResult(resultBytes),
//       payload,
//     };
//   } finally {
//     gateway?.close();
//     client?.close();
//   }
// }

// export async function registerDeviceOnChain(req, res) {
//   try {
//     const { deviceId } = req.params;
//     const result = await registerDeviceOnChainById(deviceId);

//     return res.json(result);
//   } catch (error) {
//     console.error("registerDeviceOnChain error:", error);
//     return res.status(500).json({
//       success: false,
//       function: "RegisterDevice",
//       error: error.message,
//     });
//   }
// }

// export async function readRegisteredDevice(req, res) {
//   let gateway;
//   let client;

//   try {
//     const conn = await getContract();
//     gateway = conn.gateway;
//     client = conn.client;

//     const resultBytes = await conn.contract.evaluateTransaction(
//       "ReadRegisteredDevice",
//       String(req.params.deviceId)
//     );

//     return res.json({
//       success: true,
//       function: "ReadRegisteredDevice",
//       data: parseFabricResult(resultBytes),
//     });
//   } catch (error) {
//     console.error("readRegisteredDevice error:", error);
//     return res.status(500).json({
//       success: false,
//       function: "ReadRegisteredDevice",
//       error: error.message,
//     });
//   } finally {
//     gateway?.close();
//     client?.close();
//   }
// }

// export async function getAllRegisteredDevices(req, res) {
//   let gateway;
//   let client;

//   try {
//     const conn = await getContract();
//     gateway = conn.gateway;
//     client = conn.client;

//     const resultBytes = await conn.contract.evaluateTransaction(
//       "GetAllRegisteredDevices"
//     );

//     return res.json({
//       success: true,
//       function: "GetAllRegisteredDevices",
//       data: parseFabricResult(resultBytes),
//     });
//   } catch (error) {
//     console.error("getAllRegisteredDevices error:", error);
//     return res.status(500).json({
//       success: false,
//       function: "GetAllRegisteredDevices",
//       error: error.message,
//     });
//   } finally {
//     gateway?.close();
//     client?.close();
//   }
// }

// export async function commitSealedBatch(req, res) {
//   let gateway;
//   let client;

//   try {
//     const { batchId } = req.params;

//     const batchResult = await pool.query(
//       `
//       SELECT
//         b.id AS "batchId",
//         b.device_id AS "deviceId",
//         b.status,
//         b.record_count AS "recordCount",
//         b.created_at AS "createdAt",
//         b.sealed_at AS "sealedAt",
//         b.committed_at AS "committedAt",
//         d.device_name AS "deviceName",
//         d.deveui AS "devEUI",
//         d.location,
//         d.description,
//         di.identity_status AS "identityStatus",
//         di.certificate,
//         di.signed_date AS "signedDate",
//         di.revoked_date AS "revokedDate"
//       FROM device_data_batch b
//       JOIN device d ON d.id = b.device_id
//       LEFT JOIN device_identity di ON di.device_id = d.id
//       WHERE b.id = $1
//       `,
//       [batchId]
//     );

//     if (!batchResult.rows.length) {
//       return res.status(404).json({
//         success: false,
//         error: "Batch not found in PostgreSQL",
//       });
//     }

//     const batch = batchResult.rows[0];

//     if (String(batch.status).toLowerCase() !== "sealed") {
//       return res.status(400).json({
//         success: false,
//         error: "Only sealed batches can be committed to blockchain",
//       });
//     }

//     const recordsResult = await pool.query(
//       `
//       SELECT
//         id,
//         device_id AS "deviceId",
//         raw_payload AS "rawPayload",
//         decoded_data AS "decodedData",
//         timestamp,
//         batch_id AS "batchId"
//       FROM device_data
//       WHERE batch_id = $1
//       ORDER BY timestamp ASC
//       `,
//       [batchId]
//     );

//     const records = recordsResult.rows.map((row) => ({
//       id: row.id,
//       deviceId: row.deviceId,
//       rawPayload: row.rawPayload,
//       decodedData: row.decodedData ?? {},
//       timestamp: new Date(row.timestamp).toISOString(),
//       batchId: row.batchId,
//     }));

//     const payload = {
//       batchId: batch.batchId,
//       deviceId: batch.deviceId,
//       deviceName: batch.deviceName,
//       devEUI: batch.devEUI,
//       location: batch.location,
//       description: batch.description ?? "",
//       identityStatus: batch.identityStatus ?? "unsigned",
//       certificate: batch.certificate ?? "",
//       signedDate: batch.signedDate ? new Date(batch.signedDate).toISOString() : "",
//       revokedDate: batch.revokedDate ? new Date(batch.revokedDate).toISOString() : "",
//       batchStatus: "sealed",
//       recordCount: batch.recordCount ?? records.length,
//       createdAt: batch.createdAt ? new Date(batch.createdAt).toISOString() : "",
//       sealedAt: batch.sealedAt ? new Date(batch.sealedAt).toISOString() : "",
//       committedAt: batch.committedAt ? new Date(batch.committedAt).toISOString() : "",
//       records,
//     };

//     const conn = await getContract();
//     gateway = conn.gateway;
//     client = conn.client;

//     const resultBytes = await conn.contract.submitTransaction(
//       "CommitSealedDeviceBatch",
//       JSON.stringify(payload)
//     );

//     const parsed = parseFabricResult(resultBytes);

//     await pool.query(
//       `
//       UPDATE device_data_batch
//       SET status = 'committed',
//           committed_at = NOW()
//       WHERE id = $1
//       `,
//       [batchId]
//     );

//     return res.json({
//       success: true,
//       function: "CommitSealedDeviceBatch",
//       message: "Sealed batch committed to blockchain successfully",
//       data: parsed,
//       payload,
//     });
//   } catch (error) {
//     console.error("commitSealedBatch error:", error);
//     return res.status(500).json({
//       success: false,
//       function: "CommitSealedDeviceBatch",
//       error: error.message,
//     });
//   } finally {
//     gateway?.close();
//     client?.close();
//   }
// }

// export async function readCommittedBatch(req, res) {
//   let gateway;
//   let client;

//   try {
//     const conn = await getContract();
//     gateway = conn.gateway;
//     client = conn.client;

//     const resultBytes = await conn.contract.evaluateTransaction(
//       "ReadCommittedDeviceBatch",
//       String(req.params.batchId)
//     );

//     return res.json({
//       success: true,
//       function: "ReadCommittedDeviceBatch",
//       data: parseFabricResult(resultBytes),
//     });
//   } catch (error) {
//     console.error("readCommittedBatch error:", error);
//     return res.status(500).json({
//       success: false,
//       function: "ReadCommittedDeviceBatch",
//       error: error.message,
//     });
//   } finally {
//     gateway?.close();
//     client?.close();
//   }
// }

// export async function getAllCommittedBatches(req, res) {
//   let gateway;
//   let client;

//   try {
//     const conn = await getContract();
//     gateway = conn.gateway;
//     client = conn.client;

//     const resultBytes = await conn.contract.evaluateTransaction(
//       "GetAllCommittedDeviceBatches"
//     );

//     return res.json({
//       success: true,
//       function: "GetAllCommittedDeviceBatches",
//       data: parseFabricResult(resultBytes),
//     });
//   } catch (error) {
//     console.error("getAllCommittedBatches error:", error);
//     return res.status(500).json({
//       success: false,
//       function: "GetAllCommittedDeviceBatches",
//       error: error.message,
//     });
//   } finally {
//     gateway?.close();
//     client?.close();
//   }
// }

// export async function getCommittedBatchesByDevice(req, res) {
//   let gateway;
//   let client;

//   try {
//     const conn = await getContract();
//     gateway = conn.gateway;
//     client = conn.client;

//     const resultBytes = await conn.contract.evaluateTransaction(
//       "GetCommittedDeviceBatchesByDeviceID",
//       String(req.params.deviceId)
//     );

//     return res.json({
//       success: true,
//       function: "GetCommittedDeviceBatchesByDeviceID",
//       data: parseFabricResult(resultBytes),
//     });
//   } catch (error) {
//     console.error("getCommittedBatchesByDevice error:", error);
//     return res.status(500).json({
//       success: false,
//       function: "GetCommittedDeviceBatchesByDeviceID",
//       error: error.message,
//     });
//   } finally {
//     gateway?.close();
//     client?.close();
//   }
// }
import pool from "../config/db.js";
import { getContract } from "../config/fabric.js";
import { BlockDecoder } from "fabric-common";

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseFabricResult(resultBytes) {
  if (!resultBytes) return null;
  const raw = Buffer.from(resultBytes).toString().trim();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return { raw }; }
}

function toBuffer(value) {
  if (!value) return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return value;

  if (value instanceof Uint8Array) return Buffer.from(value); // ADDED
  if (Array.isArray(value)) return Buffer.from(value); // ADDED
  if (typeof value === "string") return Buffer.from(value); // ADDED
  if (value?.data && Array.isArray(value.data)) return Buffer.from(value.data); // ADDED

  return Buffer.from(value);
}

function parseBase64String(value) {
  const buf = toBuffer(value);
  if (!buf.length) return "";
  return buf.toString("base64");
}

function readVarint(buf, offset) {
  let result = 0n, shift = 0n, pos = offset;
  while (pos < buf.length) {
    const byte = BigInt(buf[pos]);
    result |= (byte & 0x7fn) << shift;
    pos += 1;
    if ((byte & 0x80n) === 0n) return { value: result, offset: pos };
    shift += 7n;
  }
  throw new Error("Invalid protobuf varint");
}

function decodeBlockchainInfo(resultBytes) {
  const bytes = toBuffer(resultBytes);
  if (!bytes.length) return { height: 0, currentBlockHash: "", previousBlockHash: "", rawHex: "" };

  let offset = 0, height = 0, currentBlockHash = "", previousBlockHash = "";
  while (offset < bytes.length) {
    const tagInfo     = readVarint(bytes, offset);
    const tag         = Number(tagInfo.value);
    offset            = tagInfo.offset;
    const fieldNumber = tag >> 3;
    const wireType    = tag & 0x7;

    if (fieldNumber === 1 && wireType === 0) {
      const v = readVarint(bytes, offset);
      height = Number(v.value);
      offset = v.offset;
    } else if ((fieldNumber === 2 || fieldNumber === 3) && wireType === 2) {
      const lenInfo = readVarint(bytes, offset);
      const len     = Number(lenInfo.value);
      offset        = lenInfo.offset;
      const value   = bytes.subarray(offset, offset + len);
      offset       += len;
      if (fieldNumber === 2) currentBlockHash  = parseBase64String(value);
      else                   previousBlockHash = parseBase64String(value);
    } else {
      if (wireType === 0)      { offset = readVarint(bytes, offset).offset; }
      else if (wireType === 2) { const li = readVarint(bytes, offset); offset = li.offset + Number(li.value); }
      else throw new Error(`Unsupported protobuf wire type: ${wireType}`);
    }
  }
  return { height, currentBlockHash, previousBlockHash, rawHex: bytes.toString("hex") };
}

// ADDED: normalize decoded hash values into base64 string form
function normalizeHash(value) {
  if (!value) return "";
  return toBuffer(value).toString("base64");
}

// ADDED: normalize timestamp from Fabric decoded transaction header
function normalizeTimestamp(value) {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (value instanceof Date) return value.toISOString();

  if (typeof value === "object") {
    if (value.seconds !== undefined) {
      const seconds = Number(value.seconds || 0);
      const nanos = Number(value.nanos || 0);
      const ms = seconds * 1000 + Math.floor(nanos / 1_000_000);
      return new Date(ms).toISOString();
    }

    if (value.low !== undefined || value.high !== undefined) {
      return String(value);
    }
  }

  return String(value);
}

// ADDED: extract transaction info from decoded block
function extractTransactions(decodedBlock) {
  const envelopes = decodedBlock?.data?.data;

  // ADDED: safety check
  if (!Array.isArray(envelopes)) return [];

  return envelopes.map((env, index) => {
    const channelHeader =
      env?.payload?.header?.channel_header || // ADDED
      env?.payload?.header?.channelHeader || // ADDED
      {};

    return {
      txId: channelHeader.tx_id || channelHeader.txId || `tx-${index + 1}`, // ADDED
      timestamp: normalizeTimestamp(channelHeader.timestamp), // ADDED
      type: channelHeader.type || "", // ADDED
    };
  });
}

// ── Health ────────────────────────────────────────────────────────────────────
export async function fabricHealth(req, res) {
  return res.json({ ok: true, message: "Fabric backend route is ready" });
}

// ── Channel info ──────────────────────────────────────────────────────────────
export async function getChannelInfo(req, res) {
  let gateway, client;
  try {
    const conn    = await getContract();
    gateway       = conn.gateway;
    client        = conn.client;
    const network = gateway.getNetwork("lorawanchannel");
    const qscc    = network.getContract("qscc");
    const resultBytes = await qscc.evaluateTransaction("GetChainInfo", "lorawanchannel");
    const decoded = decodeBlockchainInfo(resultBytes);
    return res.json({
      success: true,
      function: "GetChainInfo",
      message: "Channel info fetched successfully",
      data: { channelName: "lorawanchannel", ...decoded },
    });
  } catch (error) {
    console.error("getChannelInfo error:", error);
    return res.status(500).json({ success: false, function: "GetChainInfo", error: error.message });
  } finally { gateway?.close(); client?.close(); }
}

// ADDED: brand new endpoint to fetch decoded blocks for ledger table
export async function getBlocks(req, res) {
  let gateway, client;

  try {
    // ADDED: support query limit and prevent too small / too large values
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 100);

    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const network = gateway.getNetwork("lorawanchannel");
    const qscc = network.getContract("qscc");

    // ADDED: first get chain info so we know latest height and current block hash
    const infoBytes = await qscc.evaluateTransaction("GetChainInfo", "lorawanchannel");
    const channelInfo = decodeBlockchainInfo(infoBytes);

    const blocks = [];

    // ADDED: used to derive current block hash while moving latest → oldest
    let newerBlockPrevHash = channelInfo.currentBlockHash;

    // ADDED: loop from latest block down to oldest block
    for (
      let blockNumber = channelInfo.height - 1;
      blockNumber >= 0 && blocks.length < limit;
      blockNumber -= 1
    ) {
      // ADDED: fetch specific block by number
      const blockBytes = await qscc.evaluateTransaction(
        "GetBlockByNumber",
        "lorawanchannel",
        String(blockNumber)
      );

      // ADDED: decode raw protobuf block into readable JS object
      const decodedBlock = BlockDecoder.decode(toBuffer(blockBytes));

      // ADDED: extract readable fields from decoded block
      const previousHash = normalizeHash(decodedBlock?.header?.previous_hash);
      const dataHash = normalizeHash(decodedBlock?.header?.data_hash);
      const txs = extractTransactions(decodedBlock);

      // ADDED: push block row data for frontend table
      blocks.push({
        number: Number(decodedBlock?.header?.number ?? blockNumber),
        block_hash: newerBlockPrevHash || "", // ADDED: current block hash
        previous_hash: previousHash || "", // ADDED
        data_hash: dataHash || "", // ADDED
        txs, // ADDED
      });

      // ADDED: prepare next older block's hash relationship
      newerBlockPrevHash = previousHash || "";
    }

    return res.json({
      success: true,
      function: "GetBlocks",
      message: "Blocks fetched successfully",
      data: {
        channelInfo,
        blocks,
      },
    });
  } catch (error) {
    console.error("getBlocks error:", error);
    return res.status(500).json({
      success: false,
      function: "GetBlocks",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

// ── Register device on chain + save fabric_tx_id back to device_identity ─────
export async function registerDeviceOnChainById(deviceId) {
  // Ensure deviceId is always an integer
  const deviceIdInt = parseInt(deviceId, 10);
  if (isNaN(deviceIdInt)) throw new Error(`Invalid deviceId: "${deviceId}"`);

  let gateway, client;
  try {
    const result = await pool.query(`
      SELECT
        d.id               AS "deviceId",
        d.device_name      AS "deviceName",
        d.deveui           AS "devEUI",
        d.location,
        d.description,
        di.identity_status AS "identityStatus",
        di.certificate,
        di.signed_date     AS "signedDate",
        di.revoked_date    AS "revokedDate",
        d.timestamp        AS "registeredAt"
      FROM device d
      LEFT JOIN device_identity di ON di.device_id = d.id
      WHERE d.id = $1
    `, [deviceIdInt]);

    if (!result.rows.length) throw new Error("Device not found in PostgreSQL");
    const row = result.rows[0];

    const payload = {
      deviceId:       deviceIdInt,               // integer
      deviceName:     row.deviceName,
      devEUI:         row.devEUI,
      location:       row.location,
      description:    row.description    ?? "",
      identityStatus: row.identityStatus ?? "unsigned",
      certificate:    row.certificate    ?? "",
      signedDate:     row.signedDate     ? new Date(row.signedDate).toISOString()    : "",
      revokedDate:    row.revokedDate    ? new Date(row.revokedDate).toISOString()   : "",
      registeredAt:   row.registeredAt   ? new Date(row.registeredAt).toISOString() : "",
      status:         "active",
    };

    const conn = await getContract();
    gateway = conn.gateway;
    client  = conn.client;

    // submitAsync gives us the real Fabric transaction ID directly from the SDK
    // without relying on the chaincode return value
    const submitResult = await conn.contract.submitAsync(
      "RegisterDevice",
      { arguments: [JSON.stringify(payload)] }
    );

    // getTransactionId() returns the 64-char hex SHA-256 transaction ID
    const fabricTxId  = submitResult.getTransactionId();

    // Wait for the transaction to be committed to the ledger
    const status = await submitResult.getStatus();
    if (!status.successful) {
      throw new Error(`RegisterDevice transaction failed with code: ${status.code}`);
    }

    // Parse chaincode return value (optional — for logging/response)
    const resultBytes = submitResult.getResult();
    const parsed      = parseFabricResult(resultBytes);

    // Save real Fabric tx_id back to device_identity
    await pool.query(`
      UPDATE device_identity
      SET fabric_tx_id         = $1,
          fabric_registered_at = NOW()
      WHERE device_id = $2
    `, [fabricTxId, deviceIdInt]);

    console.log(`[Fabric] RegisterDevice → ${fabricTxId} (device ${row.devEUI})`);

    return {
      success:   true,
      function:  "RegisterDevice",
      message:   "Device registered on blockchain successfully",
      fabricTxId,
      data:      parsed,
      payload,
    };
  } finally { gateway?.close(); client?.close(); }
}

export async function registerDeviceOnChain(req, res) {
  try {
    const result = await registerDeviceOnChainById(req.params.deviceId);
    return res.json(result);
  } catch (error) {
    console.error("registerDeviceOnChain error:", error);
    return res.status(500).json({ success: false, function: "RegisterDevice", error: error.message });
  }
}

export async function readRegisteredDevice(req, res) {
  let gateway, client;
  try {
    const conn = await getContract();
    gateway = conn.gateway; client = conn.client;
    const resultBytes = await conn.contract.evaluateTransaction("ReadRegisteredDevice", String(req.params.deviceId));
    return res.json({ success: true, function: "ReadRegisteredDevice", data: parseFabricResult(resultBytes) });
  } catch (error) {
    console.error("readRegisteredDevice error:", error);
    return res.status(500).json({ success: false, function: "ReadRegisteredDevice", error: error.message });
  } finally { gateway?.close(); client?.close(); }
}

export async function getAllRegisteredDevices(req, res) {
  let gateway, client;
  try {
    const conn = await getContract();
    gateway = conn.gateway; client = conn.client;
    const resultBytes = await conn.contract.evaluateTransaction("GetAllRegisteredDevices");
    return res.json({ success: true, function: "GetAllRegisteredDevices", data: parseFabricResult(resultBytes) });
  } catch (error) {
    console.error("getAllRegisteredDevices error:", error);
    return res.status(500).json({ success: false, function: "GetAllRegisteredDevices", error: error.message });
  } finally { gateway?.close(); client?.close(); }
}

// ── Commit sealed batch + save real tx_id back to device_data_batch ──────────
export async function commitSealedBatchById(batchId) {
  // Ensure batchId is always an integer — route params arrive as strings
  const batchIdInt = parseInt(batchId, 10);
  if (isNaN(batchIdInt)) throw new Error(`Invalid batchId: "${batchId}"`);

  let gateway, client;
  try {
    const batchResult = await pool.query(`
      SELECT
        b.id               AS "batchId",
        b.device_id        AS "deviceId",
        b.status,
        b.tx_id            AS "txId",
        b.record_count     AS "recordCount",
        b.created_at       AS "createdAt",
        b.sealed_at        AS "sealedAt",
        b.committed_at     AS "committedAt",
        d.device_name      AS "deviceName",
        d.deveui           AS "devEUI",
        d.location,
        d.description,
        di.identity_status AS "identityStatus",
        di.certificate,
        di.signed_date     AS "signedDate",
        di.revoked_date    AS "revokedDate"
      FROM device_data_batch b
      JOIN device d ON d.id = b.device_id
      LEFT JOIN device_identity di ON di.device_id = d.id
      WHERE b.id = $1
    `, [batchIdInt]);

    if (!batchResult.rows.length) throw new Error("Batch not found in PostgreSQL");
    const batch = batchResult.rows[0];

    if (String(batch.status).toLowerCase() !== "sealed") {
      throw new Error("Only sealed batches can be committed to blockchain");
    }

    const recordsResult = await pool.query(`
      SELECT
        id,
        device_id    AS "deviceId",
        raw_payload  AS "rawPayload",
        decoded_data AS "decodedData",
        timestamp,
        batch_id     AS "batchId"
      FROM device_data
      WHERE batch_id = $1
      ORDER BY timestamp ASC
    `, [batchIdInt]);

    const records = recordsResult.rows.map((row) => ({
      id:          row.id,
      deviceId:    row.deviceId,
      rawPayload:  row.rawPayload,
      decodedData: row.decodedData ?? {},
      timestamp:   new Date(row.timestamp).toISOString(),
      batchId:     row.batchId,
    }));

    const payload = {
      batchId:        batchIdInt,                // integer — chaincode expects number
      deviceId:       parseInt(batch.deviceId, 10), // integer
      deviceName:     batch.deviceName,
      devEUI:         batch.devEUI,
      location:       batch.location,
      description:    batch.description    ?? "",
      identityStatus: batch.identityStatus ?? "unsigned",
      certificate:    batch.certificate    ?? "",
      signedDate:     batch.signedDate     ? new Date(batch.signedDate).toISOString()     : "",
      revokedDate:    batch.revokedDate    ? new Date(batch.revokedDate).toISOString()    : "",
      batchStatus:    "sealed",
      recordCount:    batch.recordCount    ?? records.length,
      createdAt:      batch.createdAt      ? new Date(batch.createdAt).toISOString()      : "",
      sealedAt:       batch.sealedAt       ? new Date(batch.sealedAt).toISOString()       : "",
      committedAt:    batch.committedAt    ? new Date(batch.committedAt).toISOString()    : "",
      records,
    };

    const conn = await getContract();
    gateway = conn.gateway;
    client  = conn.client;

    // submitAsync gives us the real Fabric transaction ID directly from the SDK
    const submitResult = await conn.contract.submitAsync(
      "CommitSealedDeviceBatch",
      { arguments: [JSON.stringify(payload)] }
    );

    // getTransactionId() returns the 64-char hex SHA-256 transaction ID
    const fabricTxId = submitResult.getTransactionId();

    // Wait for the transaction to be committed to the ledger block
    const status = await submitResult.getStatus();
    if (!status.successful) {
      throw new Error(`CommitSealedDeviceBatch transaction failed with code: ${status.code}`);
    }

    // Parse chaincode return value
    const resultBytes = submitResult.getResult();
    const parsed      = parseFabricResult(resultBytes);

    // Save real Fabric tx_id to device_data_batch
    await pool.query(`
      UPDATE device_data_batch
      SET status       = 'committed',
          committed_at = NOW(),
          tx_id        = $2
      WHERE id = $1
    `, [batchIdInt, fabricTxId]);

    console.log(`[Fabric] CommitSealedDeviceBatch → ${fabricTxId} (batch ${batchIdInt})`);

    return {
      success:   true,
      function:  "CommitSealedDeviceBatch",
      message:   "Sealed batch committed to blockchain successfully",
      fabricTxId,
      data:      parsed,
      payload,
    };
  } finally { gateway?.close(); client?.close(); }
}

export async function commitSealedBatch(req, res) {
  try {
    const result = await commitSealedBatchById(req.params.batchId);
    return res.json(result);
  } catch (error) {
    console.error("commitSealedBatch error:", error);
    return res.status(500).json({ success: false, function: "CommitSealedDeviceBatch", error: error.message });
  }
}

export async function readCommittedBatch(req, res) {
  let gateway, client;
  try {
    const conn = await getContract();
    gateway = conn.gateway; client = conn.client;
    const resultBytes = await conn.contract.evaluateTransaction("ReadCommittedDeviceBatch", String(req.params.batchId));
    return res.json({ success: true, function: "ReadCommittedDeviceBatch", data: parseFabricResult(resultBytes) });
  } catch (error) {
    console.error("readCommittedBatch error:", error);
    return res.status(500).json({ success: false, function: "ReadCommittedDeviceBatch", error: error.message });
  } finally { gateway?.close(); client?.close(); }
}

export async function getAllCommittedBatches(req, res) {
  let gateway, client;
  try {
    const conn = await getContract();
    gateway = conn.gateway; client = conn.client;
    const resultBytes = await conn.contract.evaluateTransaction("GetAllCommittedDeviceBatches");
    return res.json({ success: true, function: "GetAllCommittedDeviceBatches", data: parseFabricResult(resultBytes) });
  } catch (error) {
    console.error("getAllCommittedBatches error:", error);
    return res.status(500).json({ success: false, function: "GetAllCommittedDeviceBatches", error: error.message });
  } finally { gateway?.close(); client?.close(); }
}

export async function getCommittedBatchesByDevice(req, res) {
  let gateway, client;
  try {
    const conn = await getContract();
    gateway = conn.gateway; client = conn.client;
    const resultBytes = await conn.contract.evaluateTransaction("GetCommittedDeviceBatchesByDeviceID", String(req.params.deviceId));
    return res.json({ success: true, function: "GetCommittedDeviceBatchesByDeviceID", data: parseFabricResult(resultBytes) });
  } catch (error) {
    console.error("getCommittedBatchesByDevice error:", error);
    return res.status(500).json({ success: false, function: "GetCommittedDeviceBatchesByDeviceID", error: error.message });
  } finally { gateway?.close(); client?.close(); }
}