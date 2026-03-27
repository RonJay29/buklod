import crypto from "crypto";

// 🔐 Simulate Fabric CA issuing certificate
function generateMockPEM(devEUI) {
  const body = crypto.randomBytes(256).toString("base64");

  return `-----BEGIN CERTIFICATE-----
MIIB${body}
-----END CERTIFICATE-----`;
}

export async function getDeviceCertificate(req, res) {
  const { devEUI } = req.params;

  try {
    // ⚠️ validate DevEUI
    if (!devEUI || devEUI.length !== 16) {
      return res.status(400).json({
        message: "Invalid DevEUI"
      });
    }

    // ✅ MOCK VALID PEM CERTIFICATE
    const fakeCert = `-----BEGIN CERTIFICATE-----
MIIBszCCAVmgAwIBAgIUQ${devEUI}FAKECERTDATA1234567890
-----END CERTIFICATE-----`;

    return res.status(200).json({
      certificate: fakeCert
    });

  } catch (err) {
    console.error("Fabric CA error:", err.message);

    return res.status(500).json({
      message: "Fabric CA failed to generate certificate"
    });
  }
}