import { describe, expect, test } from "bun:test";
import { getGraphAnalysisProvider } from "./graph-providers";
import type { AIAnalysisSettings } from "./types";

const settings: AIAnalysisSettings = {
  analysisMode: "Balanced",
  analysisFocus: "Evolution-oriented",
  graphGranularity: "Medium",
  refreshBehavior: "Manual refresh only",
  modelProvider: "rule-engine",
  modelName: "local-rules-v1",
  maxCandidateNeighbors: 8,
  confidenceThreshold: 0.5,
  tokenBudget: 4000,
  maxGraphDensity: 0.35,
  explanationVerbosity: "Concise"
};

const ideas = [
  {
    id: "idea-a",
    title: "Sparse attention for long context",
    summary: "Improve long context training stability.",
    motivation: "Current attention has memory pressure.",
    hypothesis: "Block sparse attention can retain quality.",
    novelty: "Adaptive blocks.",
    tagsJson: JSON.stringify(["attention", "long-context"]),
    experiments: [
      {
        title: "Ablation",
        objective: "Measure quality.",
        status: "Completed",
        modelName: "Transformer",
        methodChanges: "Block sparse attention",
        datasetName: "LongBench",
        resultSummary: "Lower memory use."
      }
    ],
    decisionLogs: []
  },
  {
    id: "idea-b",
    title: "Routing for long context attention",
    summary: "Route tokens for long context workloads.",
    motivation: "Attention remains expensive.",
    hypothesis: "Routing improves long context throughput.",
    novelty: "Token router.",
    tagsJson: JSON.stringify(["attention", "long-context"]),
    experiments: [
      {
        title: "Router test",
        objective: "Measure throughput.",
        status: "Completed",
        modelName: "Transformer",
        methodChanges: "Routing attention",
        datasetName: "LongBench",
        resultSummary: "Faster runs."
      }
    ],
    decisionLogs: []
  }
];

describe("graph providers", () => {
  test("rule-engine infers explainable local relations", async () => {
    const provider = getGraphAnalysisProvider(settings);
    const relations = await provider.inferRelations(ideas, settings);

    expect(relations.length).toBeGreaterThan(0);
    expect(relations[0]?.modelProvider).toBe("rule-engine");
    expect(relations[0]?.evidence.length).toBeGreaterThan(0);
  });

  test("openai-compatible provider requires an API key", async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "";

    const provider = getGraphAnalysisProvider({ ...settings, modelProvider: "openai-compatible" });

    await expect(provider.inferRelations(ideas, settings)).rejects.toThrow("OPENAI_API_KEY");
    process.env.OPENAI_API_KEY = originalKey;
  });
});
