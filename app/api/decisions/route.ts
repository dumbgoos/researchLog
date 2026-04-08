import { NextRequest, NextResponse } from "next/server";
import { createDecision } from "@/lib/repository";
import type { DecisionLog } from "@/lib/types";

const decisionTypes: DecisionLog["decisionType"][] = ["continue", "pause", "pivot", "replace", "archive"];

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const title = String(payload.title ?? "").trim();
  const content = String(payload.content ?? "").trim();
  const ideaId = String(payload.ideaId ?? "").trim();
  const decisionType = String(payload.decisionType ?? "continue") as DecisionLog["decisionType"];

  if (!title || !content || !ideaId || !decisionTypes.includes(decisionType)) {
    return NextResponse.json({ error: "Title, content, linked idea, and valid decision type are required." }, { status: 400 });
  }

  const decision = await createDecision({
    ideaId,
    experimentId: normalizeOptionalString(payload.experimentId),
    title,
    content,
    decisionType
  });

  return NextResponse.json(decision, { status: 201 });
}

function normalizeOptionalString(value: unknown): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}
