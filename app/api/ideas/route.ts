import { NextRequest, NextResponse } from "next/server";
import { createIdea } from "@/lib/repository";
import type { IdeaStatus } from "@/lib/types";

const ideaStatuses: IdeaStatus[] = ["Inbox", "Exploring", "Running", "Iterating", "Paused", "Archived", "Paper-ready"];

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const title = String(payload.title ?? "").trim();
  const summary = String(payload.summary ?? "").trim();
  const status = String(payload.status ?? "Inbox") as IdeaStatus;

  if (!title || !summary || !ideaStatuses.includes(status)) {
    return NextResponse.json({ error: "Title, summary, and valid status are required." }, { status: 400 });
  }

  const idea = await createIdea({
    title,
    summary,
    motivation: String(payload.motivation ?? "").trim(),
    hypothesis: String(payload.hypothesis ?? "").trim() || "Hypothesis to be refined.",
    novelty: String(payload.novelty ?? "").trim(),
    status,
    tags: parseStringArray(payload.tags),
    relatedPapers: parseStringArray(payload.relatedPapers)
  });

  return NextResponse.json(idea, { status: 201 });
}

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item: unknown): item is string => typeof item === "string") : [];
}
