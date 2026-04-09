import { NextRequest, NextResponse } from "next/server";
import { createExperiment } from "@/lib/repository";
import type { ExperimentResultArtifact, ExperimentStatus } from "@/lib/types";

const experimentStatuses: ExperimentStatus[] = ["Planned", "Running", "Done", "Failed", "Superseded"];

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const title = String(payload.title ?? "").trim();
  const ideaId = String(payload.ideaId ?? "").trim();
  const status = String(payload.status ?? "Planned") as ExperimentStatus;

  if (!title || !ideaId || !experimentStatuses.includes(status)) {
    return NextResponse.json({ error: "Title, linked idea, and valid status are required." }, { status: 400 });
  }

  const configJson = normalizeJsonText(payload.configJson, "{}");
  const resultMetricsJson = normalizeJsonText(payload.resultMetricsJson, "{}");
  const resultArtifacts = payload.resultArtifactsJson === undefined ? [] : normalizeResultArtifacts(payload.resultArtifactsJson);

  if (configJson === null || resultMetricsJson === null || resultArtifacts === null) {
    return NextResponse.json({ error: "Config, metrics, and result artifacts must be valid JSON." }, { status: 400 });
  }

  const experiment = await createExperiment({
    ideaId,
    title,
    objective: String(payload.objective ?? "").trim() || "Objective to be clarified.",
    experimentType: String(payload.experimentType ?? "").trim() || "New method trial",
    status,
    modelName: String(payload.modelName ?? "").trim(),
    methodChanges: String(payload.methodChanges ?? "").trim(),
    datasetName: String(payload.datasetName ?? "").trim() || "Not specified",
    datasetVersion: String(payload.datasetVersion ?? "").trim(),
    configJson,
    linkedAssetIds: parseStringArray(payload.linkedAssetIds),
    serverAssetId: normalizeOptionalString(payload.serverAssetId),
    runtimeEnv: String(payload.runtimeEnv ?? "").trim(),
    branchName: String(payload.branchName ?? "").trim(),
    commitId: String(payload.commitId ?? "").trim(),
    runCommand: String(payload.runCommand ?? "").trim(),
    wandbUrl: String(payload.wandbUrl ?? "").trim(),
    logPath: String(payload.logPath ?? "").trim(),
    ckptPath: String(payload.ckptPath ?? "").trim(),
    resultMetricsJson,
    resultSummary: String(payload.resultSummary ?? "").trim() || "Pending analysis.",
    resultArtifacts,
    analysis: String(payload.analysis ?? "").trim(),
    nextSteps: String(payload.nextSteps ?? "").trim()
  });

  return NextResponse.json(experiment, { status: 201 });
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item: unknown): item is string => typeof item === "string") : [];
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function normalizeJsonText(value: unknown, fallback: string): string | null {
  const raw = String(value ?? "").trim() || fallback;

  try {
    JSON.parse(raw);
    return raw;
  } catch {
    return null;
  }
}

function normalizeResultArtifacts(value: unknown): ExperimentResultArtifact[] | null {
  const raw = String(value ?? "").trim() || "[]";

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") {
        return [];
      }

      const record = item as Record<string, unknown>;
      const title = String(record.title ?? "").trim();
      const kind = String(record.kind ?? "").trim();
      const content = String(record.content ?? "");

      if (!title || !content || !["markdown", "image", "table"].includes(kind)) {
        return [];
      }

      return [
        {
          id: String(record.id ?? `artifact-${crypto.randomUUID()}`),
          title,
          kind: kind as ExperimentResultArtifact["kind"],
          content,
          fileName: typeof record.fileName === "string" ? record.fileName : undefined,
          mimeType: typeof record.mimeType === "string" ? record.mimeType : undefined
        }
      ];
    });
  } catch {
    return null;
  }
}
