import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { rm } from "fs/promises";
import { resolve } from "path";
import { createTestDatabase } from "./test-db";

const testDbPath = resolve(process.cwd(), "prisma", "test.db");
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalOpenAIKey = process.env.OPENAI_API_KEY;
const originalVaultKey = process.env.VAULT_ENCRYPTION_KEY;
const originalVaultPassword = process.env.VAULT_PASSWORD;

beforeAll(async () => {
  process.env.DATABASE_URL = "file:./test.db";
  process.env.OPENAI_API_KEY = "";
  process.env.VAULT_ENCRYPTION_KEY = "repository-test-key";
  process.env.VAULT_PASSWORD = "repository-test-password";

  await rm(testDbPath, { force: true });
  createTestDatabase(testDbPath);
});

afterAll(async () => {
  const { prisma } = await import("./prisma");
  await prisma.$disconnect();
  process.env.DATABASE_URL = originalDatabaseUrl;
  process.env.OPENAI_API_KEY = originalOpenAIKey;
  process.env.VAULT_ENCRYPTION_KEY = originalVaultKey;
  process.env.VAULT_PASSWORD = originalVaultPassword;
  await rm(testDbPath, { force: true });
});

describe("repository smoke tests", () => {
  test("seeds workspace, creates vault asset, audits reveal, and regenerates map", async () => {
    const repository = await import("./repository");
    const initialSnapshot = await repository.getWorkspaceSnapshot();

    expect(initialSnapshot.ideas.length).toBeGreaterThan(0);
    expect(initialSnapshot.experiments.length).toBeGreaterThan(0);

    const asset = await repository.createVaultAsset({
      assetType: "Token",
      name: "Test token",
      provider: "OpenAI",
      metadata: { usage_scope: "tests" },
      secret: "sk-repository-secret"
    });

    expect(asset.maskedPreview).toBe("sk-r****cret");

    const secret = await repository.accessVaultSecret(asset.id, "repository-test-password", "reveal");
    expect(secret.secret).toBe("sk-repository-secret");

    const map = await repository.regenerateResearchMap();
    expect(map.profiles.length).toBeGreaterThan(0);
    expect(map.jobs[0]?.status).toBe("done");

    await repository.updateAIAnalysisSettings({
      modelName: "test-model",
      modelProvider: "openai-compatible"
    });

    const fallbackMap = await repository.regenerateResearchMap();
    expect(fallbackMap.jobs[0]?.status).toBe("done");
    expect(fallbackMap.jobs[0]?.fallbackUsed).toBe(true);
    expect(fallbackMap.jobs[0]?.errorMessage).toContain("OPENAI_API_KEY");

    const snapshot = await repository.getWorkspaceSnapshot();
    expect(snapshot.vaultAuditLogs.some((audit) => audit.actionType === "reveal")).toBe(true);
  });
});
