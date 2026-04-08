import { NextRequest, NextResponse } from "next/server";
import { deleteDecision, updateDecision } from "@/lib/repository";
import type { DecisionLog } from "@/lib/types";

const decisionTypes: DecisionLog["decisionType"][] = ["continue", "pause", "pivot", "replace", "archive"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();
  const decisionType =
    payload.decisionType === undefined ? undefined : (String(payload.decisionType) as DecisionLog["decisionType"]);

  if (decisionType !== undefined && !decisionTypes.includes(decisionType)) {
    return NextResponse.json({ error: "Invalid decision type." }, { status: 400 });
  }

  const title = payload.title === undefined ? undefined : String(payload.title).trim();
  const content = payload.content === undefined ? undefined : String(payload.content).trim();

  if (title === "" || content === "") {
    return NextResponse.json({ error: "Decision title and content cannot be empty." }, { status: 400 });
  }

  const decision = await updateDecision(id, {
    title,
    content,
    decisionType,
    experimentId: payload.experimentId === undefined ? undefined : String(payload.experimentId).trim()
  });

  return NextResponse.json(decision);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await deleteDecision(id);
  return NextResponse.json({ ok: true });
}
