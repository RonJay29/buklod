import fs from "fs";
import path from "path";
import crypto from "crypto";
import grpc from "@grpc/grpc-js";
import { connect, signers, hash } from "@hyperledger/fabric-gateway";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const channelName = "lorawanchannel";
const chaincodeName = "lorawancc";
const mspId = "GatewayMSP";

const cryptoPath = path.resolve(__dirname, "..", "..", "fabric-crypto");
const tlsCertPath = path.join(cryptoPath, "peer-ca.pem");
const certPath = path.join(cryptoPath, "appUser", "cert.pem");
const keyPath = path.join(cryptoPath, "appUser", "key.pem");

const peerEndpoint = "peer0.gatewayorg.buklod.com:7051";
const peerHostAlias = "peer0.gatewayorg.buklod.com";

function newGrpcConnection() {
  const tlsRootCert = fs.readFileSync(tlsCertPath);
  const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);

  return new grpc.Client(peerEndpoint, tlsCredentials, {
    "grpc.ssl_target_name_override": peerHostAlias,
    "grpc.default_authority": peerHostAlias,
  });
}

function newIdentity() {
  const credentials = fs.readFileSync(certPath);
  return { mspId, credentials };
}

function newSigner() {
  const privateKeyPem = fs.readFileSync(keyPath);
  const privateKey = crypto.createPrivateKey(privateKeyPem);
  return signers.newPrivateKeySigner(privateKey);
}

export async function getContract() {
  const client = newGrpcConnection();

  const gateway = connect({
    client,
    identity: newIdentity(),
    signer: newSigner(),
    hash: hash.sha256,
  });

  const network = gateway.getNetwork(channelName);
  const contract = network.getContract(chaincodeName);

  return { client, gateway, contract };
}