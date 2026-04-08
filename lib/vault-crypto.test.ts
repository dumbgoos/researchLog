import { afterEach, describe, expect, test } from "bun:test";
import { decryptVaultSecret, encryptVaultSecret, isVaultAuthorized, maskSecret } from "./vault-crypto";

const originalVaultKey = process.env.VAULT_ENCRYPTION_KEY;
const originalVaultPassword = process.env.VAULT_PASSWORD;

afterEach(() => {
  process.env.VAULT_ENCRYPTION_KEY = originalVaultKey;
  process.env.VAULT_PASSWORD = originalVaultPassword;
});

describe("vault crypto", () => {
  test("encrypts and decrypts a secret without returning plaintext payloads", () => {
    process.env.VAULT_ENCRYPTION_KEY = "test-key-for-vault-crypto";

    const encrypted = encryptVaultSecret("sk-test-123456");

    expect(encrypted).toStartWith("v1:");
    expect(encrypted).not.toContain("sk-test-123456");
    expect(decryptVaultSecret(encrypted)).toBe("sk-test-123456");
  });

  test("masks secret previews", () => {
    expect(maskSecret("")).toBe("");
    expect(maskSecret("short")).toBe("****");
    expect(maskSecret("sk-test-123456")).toBe("sk-t****3456");
  });

  test("checks the vault password", () => {
    process.env.VAULT_PASSWORD = "correct horse";

    expect(isVaultAuthorized("correct horse")).toBe(true);
    expect(isVaultAuthorized("wrong horse")).toBe(false);
  });
});
