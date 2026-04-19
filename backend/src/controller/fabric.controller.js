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

function parseFabricResult(resultBytes) {
  if (!resultBytes) return null;

  const raw = Buffer.from(resultBytes).toString().trim(); // CHANGED
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

// ADDED: safely convert Buffer / Uint8Array / Array-like to Buffer
function toBuffer(value) {
  if (!value) return Buffer.alloc(0); // ADDED
  if (Buffer.isBuffer(value)) return value; // ADDED
  return Buffer.from(value); // ADDED
}

// CHANGED: now works for Uint8Array too
function parseBase64String(value) {
  const buf = toBuffer(value);
  if (!buf.length) return "";
  return buf.toString("base64");
}

// ADDED: minimal protobuf varint reader for QSCC GetChainInfo response
function readVarint(buf, offset) {
  let result = 0n;
  let shift = 0n;
  let pos = offset;

  while (pos < buf.length) {
    const byte = BigInt(buf[pos]);
    result |= (byte & 0x7fn) << shift;
    pos += 1;

    if ((byte & 0x80n) === 0n) {
      return { value: result, offset: pos };
    }

    shift += 7n;
  }

  throw new Error("Invalid protobuf varint");
}

// CHANGED: decode BlockchainInfo protobuf from QSCC GetChainInfo
function decodeBlockchainInfo(resultBytes) {
  const bytes = toBuffer(resultBytes); // CHANGED

  if (!bytes.length) {
    return {
      height: 0,
      currentBlockHash: "",
      previousBlockHash: "",
      rawHex: "",
    };
  }

  let offset = 0;
  let height = 0;
  let currentBlockHash = "";
  let previousBlockHash = "";

  while (offset < bytes.length) {
    const tagInfo = readVarint(bytes, offset);
    const tag = Number(tagInfo.value);
    offset = tagInfo.offset;

    const fieldNumber = tag >> 3;
    const wireType = tag & 0x7;

    if (fieldNumber === 1 && wireType === 0) {
      const valueInfo = readVarint(bytes, offset);
      height = Number(valueInfo.value);
      offset = valueInfo.offset;
    } else if ((fieldNumber === 2 || fieldNumber === 3) && wireType === 2) {
      const lengthInfo = readVarint(bytes, offset);
      const len = Number(lengthInfo.value);
      offset = lengthInfo.offset;

      const value = bytes.subarray(offset, offset + len);
      offset += len;

      if (fieldNumber === 2) {
        currentBlockHash = parseBase64String(value);
      } else if (fieldNumber === 3) {
        previousBlockHash = parseBase64String(value);
      }
    } else {
      if (wireType === 0) {
        const skip = readVarint(bytes, offset);
        offset = skip.offset;
      } else if (wireType === 2) {
        const lengthInfo = readVarint(bytes, offset);
        const len = Number(lengthInfo.value);
        offset = lengthInfo.offset + len;
      } else {
        throw new Error(`Unsupported protobuf wire type: ${wireType}`);
      }
    }
  }

  return {
    height,
    currentBlockHash,
    previousBlockHash,
    rawHex: bytes.toString("hex"), // CHANGED
  };
}

export async function fabricHealth(req, res) {
  return res.json({
    ok: true,
    message: "Fabric backend route is ready",
  });
}

// CHANGED: get channel info through Fabric SDK instead of peer CLI
export async function getChannelInfo(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    // ADDED: use gateway network directly
    const network = gateway.getNetwork("lorawanchannel"); // CHANGED
    const qscc = network.getContract("qscc"); // ADDED

    // ADDED: query QSCC system chaincode
    const resultBytes = await qscc.evaluateTransaction(
      "GetChainInfo",
      "lorawanchannel"
    );

    const decoded = decodeBlockchainInfo(resultBytes); // ADDED

    return res.json({
      success: true,
      function: "GetChainInfo",
      message: "Channel info fetched successfully",
      data: {
        channelName: "lorawanchannel",
        height: decoded.height,
        currentBlockHash: decoded.currentBlockHash,
        previousBlockHash: decoded.previousBlockHash,
        rawHex: decoded.rawHex,
      },
    });
  } catch (error) {
    console.error("getChannelInfo error:", error);
    return res.status(500).json({
      success: false,
      function: "GetChainInfo",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function registerDeviceOnChainById(deviceId) {
  let gateway;
  let client;

  try {
    const result = await pool.query(
      `
      SELECT
        d.id AS "deviceId",
        d.device_name AS "deviceName",
        d.deveui AS "devEUI",
        d.location,
        d.description,
        di.identity_status AS "identityStatus",
        di.certificate,
        di.signed_date AS "signedDate",
        di.revoked_date AS "revokedDate",
        d.timestamp AS "registeredAt"
      FROM device d
      LEFT JOIN device_identity di ON di.device_id = d.id
      WHERE d.id = $1
      `,
      [deviceId]
    );

    if (!result.rows.length) {
      throw new Error("Device not found in PostgreSQL");
    }

    const row = result.rows[0];

    const payload = {
      deviceId: row.deviceId,
      deviceName: row.deviceName,
      devEUI: row.devEUI,
      location: row.location,
      description: row.description ?? "",
      identityStatus: row.identityStatus ?? "unsigned",
      certificate: row.certificate ?? "",
      signedDate: row.signedDate ? new Date(row.signedDate).toISOString() : "",
      revokedDate: row.revokedDate ? new Date(row.revokedDate).toISOString() : "",
      registeredAt: row.registeredAt ? new Date(row.registeredAt).toISOString() : "",
      status: "active",
    };

    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.submitTransaction(
      "RegisterDevice",
      JSON.stringify(payload)
    );

    return {
      success: true,
      function: "RegisterDevice",
      message: "Device registered on blockchain successfully",
      data: parseFabricResult(resultBytes),
      payload,
    };
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function registerDeviceOnChain(req, res) {
  try {
    const { deviceId } = req.params;
    const result = await registerDeviceOnChainById(deviceId);

    return res.json(result);
  } catch (error) {
    console.error("registerDeviceOnChain error:", error);
    return res.status(500).json({
      success: false,
      function: "RegisterDevice",
      error: error.message,
    });
  }
}

export async function readRegisteredDevice(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.evaluateTransaction(
      "ReadRegisteredDevice",
      String(req.params.deviceId)
    );

    return res.json({
      success: true,
      function: "ReadRegisteredDevice",
      data: parseFabricResult(resultBytes),
    });
  } catch (error) {
    console.error("readRegisteredDevice error:", error);
    return res.status(500).json({
      success: false,
      function: "ReadRegisteredDevice",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function getAllRegisteredDevices(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.evaluateTransaction(
      "GetAllRegisteredDevices"
    );

    return res.json({
      success: true,
      function: "GetAllRegisteredDevices",
      data: parseFabricResult(resultBytes),
    });
  } catch (error) {
    console.error("getAllRegisteredDevices error:", error);
    return res.status(500).json({
      success: false,
      function: "GetAllRegisteredDevices",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function commitSealedBatchById(batchId) {
  let gateway;
  let client;

  try {
    const batchResult = await pool.query(
      `
      SELECT
        b.id AS "batchId",
        b.device_id AS "deviceId",
        b.status,
        b.tx_id AS "txId",
        b.record_count AS "recordCount",
        b.created_at AS "createdAt",
        b.sealed_at AS "sealedAt",
        b.committed_at AS "committedAt",
        d.device_name AS "deviceName",
        d.deveui AS "devEUI",
        d.location,
        d.description,
        di.identity_status AS "identityStatus",
        di.certificate,
        di.signed_date AS "signedDate",
        di.revoked_date AS "revokedDate"
      FROM device_data_batch b
      JOIN device d ON d.id = b.device_id
      LEFT JOIN device_identity di ON di.device_id = d.id
      WHERE b.id = $1
      `,
      [batchId]
    );

    if (!batchResult.rows.length) {
      throw new Error("Batch not found in PostgreSQL");
    }

    const batch = batchResult.rows[0];

    if (String(batch.status).toLowerCase() !== "sealed") {
      throw new Error("Only sealed batches can be committed to blockchain");
    }

    const recordsResult = await pool.query(
      `
      SELECT
        id,
        device_id AS "deviceId",
        raw_payload AS "rawPayload",
        decoded_data AS "decodedData",
        timestamp,
        batch_id AS "batchId"
      FROM device_data
      WHERE batch_id = $1
      ORDER BY timestamp ASC
      `,
      [batchId]
    );

    const records = recordsResult.rows.map((row) => ({
      id: row.id,
      deviceId: row.deviceId,
      rawPayload: row.rawPayload,
      decodedData: row.decodedData ?? {},
      timestamp: new Date(row.timestamp).toISOString(),
      batchId: row.batchId,
    }));

    const payload = {
      batchId: batch.batchId,
      deviceId: batch.deviceId,
      deviceName: batch.deviceName,
      devEUI: batch.devEUI,
      location: batch.location,
      description: batch.description ?? "",
      identityStatus: batch.identityStatus ?? "unsigned",
      certificate: batch.certificate ?? "",
      signedDate: batch.signedDate ? new Date(batch.signedDate).toISOString() : "",
      revokedDate: batch.revokedDate ? new Date(batch.revokedDate).toISOString() : "",
      batchStatus: "sealed",
      recordCount: batch.recordCount ?? records.length,
      createdAt: batch.createdAt ? new Date(batch.createdAt).toISOString() : "",
      sealedAt: batch.sealedAt ? new Date(batch.sealedAt).toISOString() : "",
      committedAt: batch.committedAt ? new Date(batch.committedAt).toISOString() : "",
      records,
    };

    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const submitted = await conn.contract.submitTransaction(
      "CommitSealedDeviceBatch",
      JSON.stringify(payload)
    );

    const parsed = parseFabricResult(submitted);

    await pool.query(
      `
      UPDATE device_data_batch
      SET status = 'committed',
          committed_at = NOW(),
          tx_id = COALESCE($2, tx_id)
      WHERE id = $1
      `,
      [batchId, payload.batchId ? String(payload.batchId) : null]
    );

    return {
      success: true,
      function: "CommitSealedDeviceBatch",
      message: "Sealed batch committed to blockchain successfully",
      data: parsed,
      payload,
    };
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function commitSealedBatch(req, res) {
  try {
    const { batchId } = req.params;
    const result = await commitSealedBatchById(batchId);

    return res.json(result);
  } catch (error) {
    console.error("commitSealedBatch error:", error);
    return res.status(500).json({
      success: false,
      function: "CommitSealedDeviceBatch",
      error: error.message,
    });
  }
}

export async function readCommittedBatch(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.evaluateTransaction(
      "ReadCommittedDeviceBatch",
      String(req.params.batchId)
    );

    return res.json({
      success: true,
      function: "ReadCommittedDeviceBatch",
      data: parseFabricResult(resultBytes),
    });
  } catch (error) {
    console.error("readCommittedBatch error:", error);
    return res.status(500).json({
      success: false,
      function: "ReadCommittedDeviceBatch",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function getAllCommittedBatches(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.evaluateTransaction(
      "GetAllCommittedDeviceBatches"
    );

    return res.json({
      success: true,
      function: "GetAllCommittedDeviceBatches",
      data: parseFabricResult(resultBytes),
    });
  } catch (error) {
    console.error("getAllCommittedBatches error:", error);
    return res.status(500).json({
      success: false,
      function: "GetAllCommittedDeviceBatches",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function getCommittedBatchesByDevice(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.evaluateTransaction(
      "GetCommittedDeviceBatchesByDeviceID",
      String(req.params.deviceId)
    );

    return res.json({
      success: true,
      function: "GetCommittedDeviceBatchesByDeviceID",
      data: parseFabricResult(resultBytes),
    });
  } catch (error) {
    console.error("getCommittedBatchesByDevice error:", error);
    return res.status(500).json({
      success: false,
      function: "GetCommittedDeviceBatchesByDeviceID",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}