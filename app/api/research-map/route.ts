import { NextResponse } from "next/server";
import { getResearchMapSnapshot, regenerateResearchMap } from "@/lib/repository";

export async function GET() {
  const snapshot = await getResearchMapSnapshot();
  return NextResponse.json(snapshot);
}

export async function POST() {
  const snapshot = await regenerateResearchMap();
  return NextResponse.json(snapshot);
}
