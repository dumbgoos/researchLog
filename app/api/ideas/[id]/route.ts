import { NextRequest, NextResponse } from "next/server";
import { deleteIdea, updateIdea } from "@/lib/repository";
import type { Idea, IdeaStatus } from "@/lib/types";

const ideaStatuses: IdeaStatus[] = ["Inbox", "Exploring", "Running", "Iterating", "Paused", "Archived", "Paper-ready"];
const priorities: Idea["priority"][] = ["Low", "Medium", "High"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();
  const status = payload.status === undefined ? undefined : (String(payload.status) as IdeaStatus);
  const priority = payload.priority === undefined ? undefined : (String(payload.priority) as Idea["priority"]);

  if ((status !== undefined && !ideaStatuses.includes(status)) || (priority !== undefined && !priorities.includes(priority))) {
    return NextResponse.json({ error: "Invalid idea status or priority." }, { status: 400 });
  }

  const title = payload.title === undefined ? undefined : String(payload.title).trim();
  const summary = payload.summary === undefined ? undefined : String(payload.summary).trim();

  if (title === "" || summary === "") {
    return NextResponse.json({ error: "Idea title and summary cannot be empty." }, { status: 400 });
  }

  const idea = await updateIdea(id, {
    title,
    summary,
    motivation: payload.motivation === undefined ? undefined : String(payload.motivation).trim(),
    hypothesis: payload.hypothesis === undefined ? undefined : String(payload.hypothesis).trim(),
    novelty: payload.novelty === undefined ? undefined : String(payload.novelty).trim(),
    status,
    priority,
    tags: payload.tags === undefined ? undefined : parseStringArray(payload.tags),
    relatedPapers: payload.relatedPapers === undefined ? undefined : parseStringArray(payload.relatedPapers)
  });

  return NextResponse.json(idea);
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item: unknown): item is string => typeof item === "string") : [];
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await deleteIdea(id);
  return NextResponse.json({ ok: true });
}
