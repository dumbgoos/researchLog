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

  test("reviews and deletes research map relations through the API route", async () => {
    const { prisma } = await import("./prisma");
    const { PATCH, DELETE } = await import("../app/api/research-map/relations/[id]/route");
    const snapshot = await import("./repository").then((repository) => repository.getWorkspaceSnapshot());
    const [sourceIdea, targetIdea] = snapshot.ideas;

    expect(sourceIdea).toBeDefined();
    expect(targetIdea).toBeDefined();

    const relation = await prisma.ideaRelation.create({
      data: {
        id: `relation-test-${crypto.randomUUID()}`,
        sourceIdeaId: sourceIdea.id,
        targetIdeaId: targetIdea.id,
        relationType: "Extends",
        confidence: 0.82,
        rationale: "API route smoke test relation",
        evidenceJson: JSON.stringify(["test evidence"]),
        modelProvider: "rule-engine",
        modelName: "local-rules-v1",
        analysisVersion: `test-${crypto.randomUUID()}`
      }
    });

    const patchResponse = await PATCH(
      new Request("http://localhost/api/research-map/relations/test", {
        body: JSON.stringify({ status: "Accepted", reviewNote: "Reviewed in route test." }),
        method: "PATCH"
      }) as Parameters<typeof PATCH>[0],
      { params: Promise.resolve({ id: relation.id }) }
    );
    const patched = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(patched.status).toBe("Accepted");
    expect(patched.reviewNote).toBe("Reviewed in route test.");

    const deleteResponse = await DELETE(
      new Request("http://localhost/api/research-map/relations/test") as Parameters<typeof DELETE>[0],
      { params: Promise.resolve({ id: relation.id }) }
    );
    const deleted = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deleted.ok).toBe(true);
    const deletedRelation = await prisma.ideaRelation.findUnique({ where: { id: relation.id } });
    expect(deletedRelation).toBeNull();
  });

  test("creates and updates workspace records through API routes", async () => {
    const { POST: createIdeaRoute } = await import("../app/api/ideas/route");
    const { PATCH: updateIdeaRoute } = await import("../app/api/ideas/[id]/route");
    const { POST: createExperimentRoute } = await import("../app/api/experiments/route");
    const { PATCH: updateExperimentRoute } = await import("../app/api/experiments/[id]/route");
    const { POST: createDecisionRoute } = await import("../app/api/decisions/route");
    const { PATCH: updateDecisionRoute } = await import("../app/api/decisions/[id]/route");
    const { POST: createVaultRoute } = await import("../app/api/vault/route");
    const { PATCH: updateVaultRoute } = await import("../app/api/vault/[id]/route");
    const { POST: accessSecretRoute } = await import("../app/api/vault/[id]/secret/route");

    const ideaResponse = await createIdeaRoute(
      jsonRequest({
        status: "Inbox",
        summary: "API route idea summary",
        tags: ["api", "quality"],
        title: "API route idea"
      })
    );
    const idea = await ideaResponse.json();

    expect(ideaResponse.status).toBe(201);
    expect(idea.title).toBe("API route idea");

    const updatedIdeaResponse = await updateIdeaRoute(
      jsonRequest({ priority: "High", status: "Exploring" }),
      { params: Promise.resolve({ id: idea.id }) }
    );
    const updatedIdea = await updatedIdeaResponse.json();

    expect(updatedIdeaResponse.status).toBe(200);
    expect(updatedIdea.status).toBe("Exploring");
    expect(updatedIdea.priority).toBe("High");

    const vaultResponse = await createVaultRoute(
      jsonRequest({
        assetType: "Token",
        metadata: { usage_scope: "api test" },
        name: "API route token",
        provider: "OpenAI",
        secret: "sk-api-route-secret"
      })
    );
    const vaultAsset = await vaultResponse.json();

    expect(vaultResponse.status).toBe(201);
    expect(vaultAsset.maskedPreview).toBe("sk-a****cret");

    const updatedVaultResponse = await updateVaultRoute(
      jsonRequest({ status: "Archived" }),
      { params: Promise.resolve({ id: vaultAsset.id }) }
    );
    const updatedVaultAsset = await updatedVaultResponse.json();

    expect(updatedVaultResponse.status).toBe(200);
    expect(updatedVaultAsset.status).toBe("Archived");

    const secretResponse = await accessSecretRoute(
      jsonRequest({
        actionType: "reveal",
        vaultPassword: "repository-test-password"
      }),
      { params: Promise.resolve({ id: vaultAsset.id }) }
    );
    const secret = await secretResponse.json();

    expect(secretResponse.status).toBe(200);
    expect(secret.secret).toBe("sk-api-route-secret");

    const experimentResponse = await createExperimentRoute(
      jsonRequest({
        configJson: "{\"lr\":0.001}",
        datasetName: "API dataset",
        ideaId: idea.id,
        linkedAssetIds: [vaultAsset.id],
        resultMetricsJson: "{\"acc\":0.9}",
        status: "Planned",
        title: "API route experiment"
      })
    );
    const experiment = await experimentResponse.json();

    expect(experimentResponse.status).toBe(201);
    expect(experiment.title).toBe("API route experiment");

    const updatedExperimentResponse = await updateExperimentRoute(
      jsonRequest({ status: "Running" }),
      { params: Promise.resolve({ id: experiment.id }) }
    );
    const updatedExperiment = await updatedExperimentResponse.json();

    expect(updatedExperimentResponse.status).toBe(200);
    expect(updatedExperiment.status).toBe("Running");

    const decisionResponse = await createDecisionRoute(
      jsonRequest({
        content: "Continue this line after API verification.",
        decisionType: "continue",
        experimentId: experiment.id,
        ideaId: idea.id,
        title: "API route decision"
      })
    );
    const decision = await decisionResponse.json();

    expect(decisionResponse.status).toBe(201);
    expect(decision.experimentId).toBe(experiment.id);

    const updatedDecisionResponse = await updateDecisionRoute(
      jsonRequest({ decisionType: "pause" }),
      { params: Promise.resolve({ id: decision.id }) }
    );
    const updatedDecision = await updatedDecisionResponse.json();

    expect(updatedDecisionResponse.status).toBe(200);
    expect(updatedDecision.decisionType).toBe("pause");
  });
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api-test", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST"
  }) as never;
}
