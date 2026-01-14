import { CompactDecrypt } from "jose";
import crypto from "crypto";

export async function verifyBillDeskSignature(jws, signingKey) {
  const [header, payload, signature] = jws.split(".");

  const data = `${header}.${payload}`;

  const hmac = crypto.createHmac("sha256", Buffer.from(signingKey, "utf8"));
  hmac.update(data);
  const expected = hmac.digest("base64url");

  if (expected !== signature) {
    throw new Error("❌ Invalid BillDesk signature");
  }

  return JSON.parse(Buffer.from(payload, "base64url").toString());
}

export async function decryptBillDeskJWE(jwe, encryptionKey) {
  const encKey = Buffer.from(encryptionKey, "utf8");

  const { plaintext } = await CompactDecrypt(jwe, encKey);

  return JSON.parse(Buffer.from(plaintext).toString());
}
