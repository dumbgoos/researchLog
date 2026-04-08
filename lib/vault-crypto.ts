import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from "crypto";

const ALGORITHM = "aes-256-gcm";

export function encryptVaultSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, getVaultKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return ["v1", iv.toString("base64url"), authTag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptVaultSecret(payload: string): string {
  const [version, iv, authTag, ciphertext] = payload.split(":");

  if (version !== "v1" || !iv || !authTag || !ciphertext) {
    throw new Error("Unsupported vault secret payload.");
  }

  const decipher = createDecipheriv(ALGORITHM, getVaultKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

export function maskSecret(secret: string): string {
  if (!secret) {
    return "";
  }

  if (secret.length <= 8) {
    return "****";
  }

  return `${secret.slice(0, 4)}****${secret.slice(-4)}`;
}

export function isVaultAuthorized(password: string): boolean {
  const expected = process.env.VAULT_PASSWORD || "researchlog-local-vault";
  const actualHash = createHash("sha256").update(password).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

function getVaultKey(): Buffer {
  const rawKey = process.env.VAULT_ENCRYPTION_KEY || "researchlog-local-dev-vault-key-change-me";
  return createHash("sha256").update(rawKey).digest();
}
