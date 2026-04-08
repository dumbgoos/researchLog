import { NextResponse } from "next/server";
import { getWorkspaceSnapshot } from "@/lib/repository";

export async function GET() {
  const snapshot = await getWorkspaceSnapshot();
  return NextResponse.json(snapshot);
}
