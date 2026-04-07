import { getContract } from "../config/fabric.js";

function decodeCommaSeparatedBytes(rawValue) {
  const cleaned = rawValue.trim();

  if (!/^\d+(,\d+)*$/.test(cleaned)) {
    return rawValue;
  }

  const byteValues = cleaned
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => !Number.isNaN(value));

  return Buffer.from(byteValues).toString("utf8");
}

function parseFabricResult(resultBytes) {
  if (!resultBytes) {
    return null;
  }

  const rawResult = resultBytes.toString().trim();

  if (!rawResult) {
    return null;
  }

  let normalizedResult = rawResult;

  normalizedResult = decodeCommaSeparatedBytes(normalizedResult);

  try {
    return JSON.parse(normalizedResult);
  } catch {
    return {
      raw: rawResult,
      decoded: normalizedResult !== rawResult ? normalizedResult : undefined,
    };
  }
}

export async function fabricHealth(req, res) {
  return res.json({
    ok: true,
    message: "Fabric backend route is ready",
  });
}

export async function getAllRecords(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.evaluateTransaction("GetAllRecords");

    const parsedResult = parseFabricResult(resultBytes);

    console.log("GetAllRecords raw result:", resultBytes.toString());

    return res.json({
      success: true,
      function: "GetAllRecords",
      data: parsedResult,
    });
  } catch (error) {
    console.error("GetAllRecords error:", error);
    return res.status(500).json({
      success: false,
      function: "GetAllRecords",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function readRecord(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.evaluateTransaction(
      "ReadRecord",
      req.params.id
    );

    const parsedResult = parseFabricResult(resultBytes);

    console.log("ReadRecord raw result:", resultBytes.toString());

    return res.json({
      success: true,
      function: "ReadRecord",
      data: parsedResult,
    });
  } catch (error) {
    console.error("ReadRecord error:", error);
    return res.status(500).json({
      success: false,
      function: "ReadRecord",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function getRecordHistory(req, res) {
  let gateway;
  let client;

  try {
    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.evaluateTransaction(
      "GetRecordHistory",
      req.params.id
    );

    const parsedResult = parseFabricResult(resultBytes);

    console.log("GetRecordHistory raw result:", resultBytes.toString());

    return res.json({
      success: true,
      function: "GetRecordHistory",
      data: parsedResult,
    });
  } catch (error) {
    console.error("GetRecordHistory error:", error);
    return res.status(500).json({
      success: false,
      function: "GetRecordHistory",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}

export async function createRecord(req, res) {
  let gateway;
  let client;

  try {
    const {
      id,
      helmetId,
      responderId,
      responderName,
      bodyTemperature,
      environmentalTemp,
      smokeLevel,
      gasLevel,
      latitude,
      longitude,
      timestamp,
    } = req.body;

    const conn = await getContract();
    gateway = conn.gateway;
    client = conn.client;

    const resultBytes = await conn.contract.submitTransaction(
      "CreateRecord",
      String(id),
      String(helmetId),
      String(responderId),
      String(responderName),
      String(bodyTemperature),
      String(environmentalTemp),
      String(smokeLevel),
      String(gasLevel),
      String(latitude),
      String(longitude),
      String(timestamp)
    );

    const parsedResult = parseFabricResult(resultBytes);

    if (resultBytes && resultBytes.length > 0) {
      console.log("CreateRecord raw result:", resultBytes.toString());
    }

    return res.json({
      success: true,
      function: "CreateRecord",
      message: "Record created successfully",
      data: parsedResult,
    });
  } catch (error) {
    console.error("CreateRecord error:", error);
    return res.status(500).json({
      success: false,
      function: "CreateRecord",
      error: error.message,
    });
  } finally {
    gateway?.close();
    client?.close();
  }
}