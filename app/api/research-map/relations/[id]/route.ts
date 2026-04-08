import { NextRequest, NextResponse } from "next/server";
import { deleteIdeaRelation, updateIdeaRelationStatus } from "@/lib/repository";
import type { IdeaRelationStatus } from "@/lib/types";

const relationStatuses: IdeaRelationStatus[] = ["Suggested", "Accepted", "Hidden", "Rejected"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();
  const status = String(payload.status ?? "Suggested") as IdeaRelationStatus;
  const reviewNote = payload.reviewNote === undefined ? undefined : String(payload.reviewNote).trim().slice(0, 1000);

  if (!relationStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid relation status." }, { status: 400 });
  }

  const relation = await updateIdeaRelationStatus(id, status, reviewNote);
  return NextResponse.json(relation);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await deleteIdeaRelation(id);
  return NextResponse.json({ ok: true });
}
