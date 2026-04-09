import { NextRequest, NextResponse } from "next/server";
import { deleteExperiment, updateExperiment } from "@/lib/repository";
import type { ExperimentResultArtifact, ExperimentStatus } from "@/lib/types";

const experimentStatuses: ExperimentStatus[] = ["Planned", "Running", "Done", "Failed", "Superseded"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();
  const status = payload.status === undefined ? undefined : (String(payload.status) as ExperimentStatus);

  if (status !== undefined && !experimentStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid experiment status." }, { status: 400 });
  }

  const title = payload.title === undefined ? undefined : String(payload.title).trim();

  if (title === "") {
    return NextResponse.json({ error: "Experiment title cannot be empty." }, { status: 400 });
  }

  const configJson = payload.configJson === undefined ? undefined : normalizeJsonText(payload.configJson, "{}");
  const resultMetricsJson =
    payload.resultMetricsJson === undefined ? undefined : normalizeJsonText(payload.resultMetricsJson, "{}");
  const resultArtifacts =
    payload.resultArtifactsJson === undefined ? undefined : normalizeResultArtifacts(payload.resultArtifactsJson);

  if (configJson === null || resultMetricsJson === null || resultArtifacts === null) {
    return NextResponse.json({ error: "Config, metrics, and result artifacts must be valid JSON." }, { status: 400 });
  }

  const experiment = await updateExperiment(id, {
    title,
    objective: payload.objective === undefined ? undefined : String(payload.objective).trim(),
    experimentType: payload.experimentType === undefined ? undefined : String(payload.experimentType).trim(),
    status,
    modelName: payload.modelName === undefined ? undefined : String(payload.modelName).trim(),
    methodChanges: payload.methodChanges === undefined ? undefined : String(payload.methodChanges).trim(),
    datasetName: payload.datasetName === undefined ? undefined : String(payload.datasetName).trim(),
    datasetVersion: payload.datasetVersion === undefined ? undefined : String(payload.datasetVersion).trim(),
    configJson,
    linkedAssetIds: payload.linkedAssetIds === undefined ? undefined : parseStringArray(payload.linkedAssetIds),
    serverAssetId: payload.serverAssetId === undefined ? undefined : String(payload.serverAssetId).trim(),
    runtimeEnv: payload.runtimeEnv === undefined ? undefined : String(payload.runtimeEnv).trim(),
    branchName: payload.branchName === undefined ? undefined : String(payload.branchName).trim(),
    commitId: payload.commitId === undefined ? undefined : String(payload.commitId).trim(),
    runCommand: payload.runCommand === undefined ? undefined : String(payload.runCommand).trim(),
    wandbUrl: payload.wandbUrl === undefined ? undefined : String(payload.wandbUrl).trim(),
    logPath: payload.logPath === undefined ? undefined : String(payload.logPath).trim(),
    ckptPath: payload.ckptPath === undefined ? undefined : String(payload.ckptPath).trim(),
    resultMetricsJson,
    resultSummary: payload.resultSummary === undefined ? undefined : String(payload.resultSummary).trim(),
    resultArtifacts,
    analysis: payload.analysis === undefined ? undefined : String(payload.analysis).trim(),
    nextSteps: payload.nextSteps === undefined ? undefined : String(payload.nextSteps).trim()
  });

  return NextResponse.json(experiment);
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item: unknown): item is string => typeof item === "string") : [];
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

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await deleteExperiment(id);
  return NextResponse.json({ ok: true });
}
