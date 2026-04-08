import type { AIAnalysisSettings } from "./types";

const allowedRelationTypes = new Set([
  "similar_to",
  "extends",
  "contradicts",
  "same_dataset_family",
  "same_method_family",
  "shares_hypothesis_with",
  "could_merge_with"
]);

export type IdeaForGraph = {
  id: string;
  title: string;
  summary: string;
  motivation: string;
  hypothesis: string;
  novelty: string;
  tagsJson: string;
  experiments: {
    title: string;
    objective: string;
    status: string;
    modelName: string;
    methodChanges: string;
    datasetName: string;
    resultSummary: string;
  }[];
  decisionLogs: {
    title: string;
    content: string;
  }[];
};

export type GraphRelationCandidate = {
  sourceIdeaId: string;
  targetIdeaId: string;
  relationType: string;
  confidence: number;
  rationale: string;
  evidence: string[];
  generatedByModel: boolean;
  modelProvider: string;
  modelName: string;
  analysisVersion: string;
};

export type GraphAnalysisProvider = {
  inferRelations: (ideas: IdeaForGraph[], settings: AIAnalysisSettings) => Promise<GraphRelationCandidate[]> | GraphRelationCandidate[];
};

export function getGraphAnalysisProvider(settings: AIAnalysisSettings): GraphAnalysisProvider {
  if (settings.modelProvider === "openai-compatible") {
    return openAICompatibleProvider;
  }

  if (settings.modelProvider === "mock-llm") {
    return mockLlmProvider;
  }

  return ruleEngineProvider;
}

export function countGraphCandidatePairs(ideas: IdeaForGraph[], settings: AIAnalysisSettings): number {
  return buildCandidatePairs(ideas, settings).length;
}

const ruleEngineProvider: GraphAnalysisProvider = {
  inferRelations(ideas, settings) {
    const candidates: GraphRelationCandidate[] = [];

    for (const pair of buildCandidatePairs(ideas, settings)) {
      const relation = inferRuleRelation(pair.source, pair.target, settings);

      if (relation && relation.confidence >= settings.confidenceThreshold) {
        candidates.push(relation);
      }
    }

    return candidates
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, Math.max(1, Math.floor(ideas.length * settings.maxCandidateNeighbors * settings.maxGraphDensity)));
  }
};

const mockLlmProvider: GraphAnalysisProvider = {
  inferRelations(ideas, settings) {
    return ruleEngineProvider.inferRelations(ideas, {
      ...settings,
      confidenceThreshold: Math.max(0.35, settings.confidenceThreshold - 0.1),
      modelProvider: "mock-llm",
      modelName: settings.modelName || "mock-relation-model"
    });
  }
};

const openAICompatibleProvider: GraphAnalysisProvider = {
  async inferRelations(ideas, settings) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required when modelProvider is openai-compatible.");
    }

    const baseUrl = normalizeBaseUrl(process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1");
    const candidates = await requestOpenAICompatibleRelations(baseUrl, apiKey, ideas, settings);

    return candidates
      .filter((candidate) => candidate.confidence >= settings.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, Math.max(1, Math.floor(ideas.length * settings.maxCandidateNeighbors * settings.maxGraphDensity)));
  }
};

async function requestOpenAICompatibleRelations(
  baseUrl: string,
  apiKey: string,
  ideas: IdeaForGraph[],
  settings: AIAnalysisSettings
): Promise<GraphRelationCandidate[]> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(getOpenAIRequestTimeoutMs()),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: settings.modelName,
      temperature: settings.analysisMode === "Exploratory" ? 0.45 : settings.analysisMode === "Conservative" ? 0.1 : 0.25,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You infer useful research idea relationships. Return only JSON with a relations array. Each relation must include sourceIdeaId, targetIdeaId, relationType, confidence, rationale, and evidence."
        },
        {
          role: "user",
          content: JSON.stringify({
            settings: {
              analysisMode: settings.analysisMode,
              analysisFocus: settings.analysisFocus,
              graphGranularity: settings.graphGranularity,
              maxCandidateNeighbors: settings.maxCandidateNeighbors,
              confidenceThreshold: settings.confidenceThreshold,
              explanationVerbosity: settings.explanationVerbosity
            },
            relationTypes: [
              "similar_to",
              "extends",
              "contradicts",
              "same_dataset_family",
              "same_method_family",
              "shares_hypothesis_with",
              "could_merge_with"
            ],
            candidatePairs: buildCandidatePairs(ideas, settings).map((pair) => ({
              sourceIdeaId: pair.source.id,
              targetIdeaId: pair.target.id,
              retrievalScore: pair.score
            })),
            ideas: ideas.map(toCompactIdea)
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI-compatible graph request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as OpenAICompatibleResponse;
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI-compatible graph request returned no message content.");
  }

  return parseLLMRelations(content, ideas, settings);
}

function parseLLMRelations(content: string, ideas: IdeaForGraph[], settings: AIAnalysisSettings): GraphRelationCandidate[] {
  const ideaIds = new Set(ideas.map((idea) => idea.id));
  const parsed = parseJsonObject(content);
  const relations = Array.isArray(parsed.relations) ? parsed.relations : [];
  const seen = new Set<string>();

  return relations
    .map((relation) => {
      if (!isRecord(relation)) {
        return null;
      }

      const sourceIdeaId = String(relation.sourceIdeaId ?? "");
      const targetIdeaId = String(relation.targetIdeaId ?? "");

      if (!ideaIds.has(sourceIdeaId) || !ideaIds.has(targetIdeaId) || sourceIdeaId === targetIdeaId) {
        return null;
      }

      const relationType = normalizeRelationType(String(relation.relationType ?? "similar_to"));
      const relationKey = [sourceIdeaId, targetIdeaId].sort().join("::") + `::${relationType}`;

      if (seen.has(relationKey)) {
        return null;
      }

      seen.add(relationKey);

      return {
        sourceIdeaId,
        targetIdeaId,
        relationType,
        confidence: clampConfidence(Number(relation.confidence)),
        rationale: limitText(String(relation.rationale ?? "Model inferred a research relationship."), 420),
        evidence: normalizeEvidence(relation.evidence),
        generatedByModel: true,
        modelProvider: settings.modelProvider,
        modelName: settings.modelName,
        analysisVersion: `${settings.modelProvider}-${settings.analysisMode.toLowerCase()}-v1`
      };
    })
    .filter((relation): relation is GraphRelationCandidate => relation !== null);
}

function buildCandidatePairs(ideas: IdeaForGraph[], settings: AIAnalysisSettings): { source: IdeaForGraph; target: IdeaForGraph; score: number }[] {
  const pairs: { source: IdeaForGraph; target: IdeaForGraph; score: number }[] = [];
  const maxPairs = Math.max(1, Math.ceil(ideas.length * settings.maxCandidateNeighbors));
  const minScore = settings.analysisMode === "Exploratory" ? 0.08 : settings.analysisMode === "Conservative" ? 0.16 : 0.12;

  for (let sourceIndex = 0; sourceIndex < ideas.length; sourceIndex += 1) {
    for (let targetIndex = sourceIndex + 1; targetIndex < ideas.length; targetIndex += 1) {
      const source = ideas[sourceIndex];
      const target = ideas[targetIndex];
      const score = candidateScore(source, target);

      if (score >= minScore) {
        pairs.push({ source, target, score });
      }
    }
  }

  return pairs.sort((a, b) => b.score - a.score).slice(0, maxPairs);
}

function candidateScore(source: IdeaForGraph, target: IdeaForGraph): number {
  const sourceTags = parseStringArray(source.tagsJson);
  const targetTags = parseStringArray(target.tagsJson);
  const sharedTags = sourceTags.filter((tag) => targetTags.includes(tag)).length;
  const sharedDatasets = intersectionCount(
    uniqueStrings(source.experiments.map((experiment) => experiment.datasetName).filter(Boolean)),
    uniqueStrings(target.experiments.map((experiment) => experiment.datasetName).filter(Boolean))
  );
  const sharedMethods = intersectionCount(
    uniqueStrings(source.experiments.map((experiment) => experiment.modelName).filter(Boolean)),
    uniqueStrings(target.experiments.map((experiment) => experiment.modelName).filter(Boolean))
  );
  const keywordOverlap = overlapScore(tokenizeIdea(source), tokenizeIdea(target));
  return Number(Math.min(1, sharedTags * 0.18 + sharedDatasets * 0.28 + sharedMethods * 0.24 + keywordOverlap).toFixed(3));
}

function inferRuleRelation(source: IdeaForGraph, target: IdeaForGraph, settings: AIAnalysisSettings): GraphRelationCandidate | null {
  const sourceTags = parseStringArray(source.tagsJson);
  const targetTags = parseStringArray(target.tagsJson);
  const sharedTags = sourceTags.filter((tag) => targetTags.includes(tag));
  const sourceDatasets = uniqueStrings(source.experiments.map((experiment) => experiment.datasetName).filter(Boolean));
  const targetDatasets = uniqueStrings(target.experiments.map((experiment) => experiment.datasetName).filter(Boolean));
  const sharedDatasets = sourceDatasets.filter((dataset) => targetDatasets.includes(dataset));
  const sourceMethods = uniqueStrings(source.experiments.map((experiment) => experiment.modelName).filter(Boolean));
  const targetMethods = uniqueStrings(target.experiments.map((experiment) => experiment.modelName).filter(Boolean));
  const sharedMethods = sourceMethods.filter((method) => targetMethods.includes(method));
  const keywordOverlap = overlapScore(tokenizeIdea(source), tokenizeIdea(target));
  const modeBoost = settings.analysisMode === "Exploratory" ? 0.08 : settings.analysisMode === "Conservative" ? -0.08 : 0;
  const evidence = [
    sharedTags.length ? `shared tags: ${sharedTags.join(", ")}` : "",
    sharedDatasets.length ? `shared datasets: ${sharedDatasets.join(", ")}` : "",
    sharedMethods.length ? `shared methods/models: ${sharedMethods.join(", ")}` : "",
    keywordOverlap > 0 ? `text overlap score: ${keywordOverlap.toFixed(2)}` : "",
    `focus: ${settings.analysisFocus}`
  ].filter(Boolean);

  if (sharedDatasets.length > 0) {
    return makeRelation(source, target, "same_dataset_family", 0.68 + sharedTags.length * 0.05 + keywordOverlap * 0.2 + modeBoost, "Ideas use overlapping dataset signals in their experiments.", evidence, settings);
  }

  if (sharedMethods.length > 0) {
    return makeRelation(source, target, "same_method_family", 0.64 + sharedTags.length * 0.05 + keywordOverlap * 0.2 + modeBoost, "Ideas share model or method signals in their experiments.", evidence, settings);
  }

  if (sharedTags.length >= 2 || keywordOverlap >= 0.22) {
    return makeRelation(source, target, sharedTags.length >= 2 ? "similar_to" : "shares_hypothesis_with", 0.55 + sharedTags.length * 0.08 + keywordOverlap * 0.35 + modeBoost, "Ideas share semantic keywords, tags, or hypothesis language.", evidence, settings);
  }

  return null;
}

function makeRelation(
  source: IdeaForGraph,
  target: IdeaForGraph,
  relationType: string,
  confidence: number,
  rationale: string,
  evidence: string[],
  settings: AIAnalysisSettings
): GraphRelationCandidate {
  return {
    sourceIdeaId: source.id,
    targetIdeaId: target.id,
    relationType,
    confidence: clampConfidence(confidence),
    rationale,
    evidence,
    generatedByModel: settings.modelProvider !== "rule-engine",
    modelProvider: settings.modelProvider,
    modelName: settings.modelName,
    analysisVersion: `${settings.modelProvider}-${settings.analysisMode.toLowerCase()}-v1`
  };
}

function toCompactIdea(idea: IdeaForGraph) {
  return {
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    motivation: idea.motivation,
    hypothesis: idea.hypothesis,
    novelty: idea.novelty,
    tags: parseStringArray(idea.tagsJson),
    experiments: idea.experiments.map((experiment) => ({
      title: experiment.title,
      objective: experiment.objective,
      status: experiment.status,
      modelName: experiment.modelName,
      methodChanges: experiment.methodChanges,
      datasetName: experiment.datasetName,
      resultSummary: experiment.resultSummary
    })),
    decisions: idea.decisionLogs.map((decision) => ({
      title: decision.title,
      content: decision.content
    }))
  };
}

function parseJsonObject(content: string): { relations?: unknown[] } {
  try {
    return JSON.parse(content) as { relations?: unknown[] };
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    return match ? (JSON.parse(match[0]) as { relations?: unknown[] }) : {};
  }
}

function normalizeRelationType(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return allowedRelationTypes.has(normalized) ? normalized : "similar_to";
}

function normalizeEvidence(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => limitText(String(item).trim(), 220)).filter(Boolean).slice(0, 6);
  }

  const evidence = limitText(String(value ?? "").trim(), 220);
  return evidence ? [evidence] : ["Model-provided relation candidate."];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/g, "");
}

function getOpenAIRequestTimeoutMs(): number {
  const timeout = Number.parseInt(process.env.OPENAI_REQUEST_TIMEOUT_MS ?? "20000", 10);
  return Number.isFinite(timeout) ? Math.min(120000, Math.max(1000, timeout)) : 20000;
}

function limitText(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function tokenizeIdea(idea: IdeaForGraph): string[] {
  return uniqueStrings(
    [
      idea.title,
      idea.summary,
      idea.motivation,
      idea.hypothesis,
      idea.novelty,
      ...parseStringArray(idea.tagsJson),
      ...idea.experiments.flatMap((experiment) => [
        experiment.title,
        experiment.objective,
        experiment.modelName,
        experiment.methodChanges,
        experiment.datasetName,
        experiment.resultSummary
      ]),
      ...idea.decisionLogs.flatMap((decision) => [decision.title, decision.content])
    ]
      .join(" ")
      .toLowerCase()
      .split(/[^a-z0-9\u4e00-\u9fff]+/u)
      .filter((token) => token.length > 2)
  );
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function overlapScore(sourceTokens: string[], targetTokens: string[]): number {
  if (sourceTokens.length === 0 || targetTokens.length === 0) {
    return 0;
  }

  const targetSet = new Set(targetTokens);
  const overlap = sourceTokens.filter((token) => targetSet.has(token)).length;
  return overlap / Math.max(sourceTokens.length, targetTokens.length);
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function intersectionCount(source: string[], target: string[]): number {
  const targetSet = new Set(target);
  return source.filter((value) => targetSet.has(value)).length;
}

function clampConfidence(value: number): number {
  const confidence = Number.isFinite(value) ? value : 0.5;
  return Math.min(0.95, Math.max(0.1, Number(confidence.toFixed(2))));
}

type OpenAICompatibleResponse = {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
};
