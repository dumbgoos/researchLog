import { NextRequest, NextResponse } from "next/server";
import { getAIAnalysisSettings, updateAIAnalysisSettings } from "@/lib/repository";
import type { AIAnalysisSettings } from "@/lib/types";

const analysisModes: AIAnalysisSettings["analysisMode"][] = ["Conservative", "Balanced", "Exploratory"];
const analysisFocuses: AIAnalysisSettings["analysisFocus"][] = [
  "Problem-oriented",
  "Method-oriented",
  "Evolution-oriented",
  "Experiment-oriented"
];
const graphGranularities: AIAnalysisSettings["graphGranularity"][] = ["Coarse", "Medium", "Fine"];
const refreshBehaviors: AIAnalysisSettings["refreshBehavior"][] = [
  "Manual refresh only",
  "Refresh on idea creation",
  "Refresh on idea update",
  "Scheduled batch refresh",
  "Incremental refresh only for changed nodes"
];

export async function GET() {
  return NextResponse.json(await getAIAnalysisSettings());
}

export async function PATCH(request: NextRequest) {
  const payload = await request.json();
  const analysisMode = String(payload.analysisMode ?? "Balanced") as AIAnalysisSettings["analysisMode"];
  const analysisFocus = String(payload.analysisFocus ?? "Evolution-oriented") as AIAnalysisSettings["analysisFocus"];
  const graphGranularity = String(payload.graphGranularity ?? "Medium") as AIAnalysisSettings["graphGranularity"];
  const refreshBehavior = String(payload.refreshBehavior ?? "Manual refresh only") as AIAnalysisSettings["refreshBehavior"];
  const explanationVerbosity = String(payload.explanationVerbosity ?? "Concise") as AIAnalysisSettings["explanationVerbosity"];

  if (
    !analysisModes.includes(analysisMode) ||
    !analysisFocuses.includes(analysisFocus) ||
    !graphGranularities.includes(graphGranularity) ||
    !refreshBehaviors.includes(refreshBehavior) ||
    !["Concise", "Detailed"].includes(explanationVerbosity)
  ) {
    return NextResponse.json({ error: "Invalid AI analysis setting." }, { status: 400 });
  }

  const settings = await updateAIAnalysisSettings({
    analysisMode,
    analysisFocus,
    graphGranularity,
    refreshBehavior,
    explanationVerbosity,
    modelProvider: String(payload.modelProvider ?? "rule-engine").trim() || "rule-engine",
    modelName: String(payload.modelName ?? "local-rules-v1").trim() || "local-rules-v1",
    maxCandidateNeighbors: clampInt(payload.maxCandidateNeighbors, 1, 50, 8),
    confidenceThreshold: clampFloat(payload.confidenceThreshold, 0.1, 0.95, 0.55),
    tokenBudget: clampInt(payload.tokenBudget, 1000, 20000, 4000),
    maxGraphDensity: clampFloat(payload.maxGraphDensity, 0.05, 1, 0.35)
  });

  return NextResponse.json(settings);
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function clampFloat(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}
