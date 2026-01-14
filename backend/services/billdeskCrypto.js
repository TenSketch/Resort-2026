import { CompactEncrypt, CompactSign, compactDecrypt, compactVerify } from "jose";

export async function encryptRequest(payload, rawKey, keyId, clientId) {
    // Java's encryptionKey.getBytes() → UTF-8 (often not 32 bytes)
    const encKey = Buffer.from(rawKey, "utf8");

    const header = {
        alg: "dir",
        enc: "A256GCM",
        kid: keyId,
        clientid: clientId
    };

    console.log("🔐 Encrypt Request Headers:", JSON.stringify(header, null, 2));

    const jwe = await new CompactEncrypt(
        Buffer.from(JSON.stringify(payload))
    )
        .setProtectedHeader(header)
        .encrypt(encKey);

    console.log("🔐 Encrypted JWE:", jwe.substring(0, 100) + "...");

    return jwe;
}

export async function signEncryptedRequest(jwe, signingKey, keyId, clientId) {
    const signKey = Buffer.from(signingKey, "utf8");

    const header = {
        alg: "HS256",
        kid: keyId,
        clientid: clientId
    };

    console.log("✍️ Sign Request Headers:", JSON.stringify(header, null, 2));

    const jws = await new CompactSign(
        Buffer.from(jwe, "utf8")
    )
        .setProtectedHeader(header)
        .sign(signKey);

    console.log("✍️ Signed JWS:", jws.substring(0, 100) + "...");

    return jws;
}

export async function verifyAndDecryptResponse(jwsString, signingKey, encryptionKey) {
    // Step 1: Verify the signature
    const signKey = Buffer.from(signingKey, "utf8");
    const verifiedResult = await compactVerify(jwsString, signKey);

    console.log("✅ Signature verified");

    // Step 2: Decrypt the JWE (payload from verified JWS)
    const jweString = new TextDecoder().decode(verifiedResult.payload);
    const encKey = Buffer.from(encryptionKey, "utf8");

    const decryptedResult = await compactDecrypt(jweString, encKey);

    console.log("✅ Response decrypted");

    // Step 3: Parse the JSON
    const jsonResponse = JSON.parse(new TextDecoder().decode(decryptedResult.plaintext));

    return jsonResponse;
}

// Verify signature only
export async function verifySignature(jwsString, signingKey) {
    try {
        const signKey = Buffer.from(signingKey, "utf8");
        await compactVerify(jwsString, signKey);
        return true;
    } catch (err) {
        console.error("Signature verification failed:", err);
        return false;
    }
}

// Decrypt response (after verification)
export async function decryptResponse(jwsString, encryptionKey) {
    const signKey = Buffer.from(process.env.BILLDESK_SIGNING_KEY, "utf8");
    const verifiedResult = await compactVerify(jwsString, signKey);
    
    const jweString = new TextDecoder().decode(verifiedResult.payload);
    const encKey = Buffer.from(encryptionKey, "utf8");
    
    const decryptedResult = await compactDecrypt(jweString, encKey);
    const jsonResponse = JSON.parse(new TextDecoder().decode(decryptedResult.plaintext));
    
    return jsonResponse;
}
