import { NextRequest, NextResponse } from "next/server";
import { accessVaultSecret } from "@/lib/repository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();
  const actionType = String(payload.actionType ?? "reveal");

  if (actionType !== "reveal" && actionType !== "copy") {
    return NextResponse.json({ error: "Invalid secret access action." }, { status: 400 });
  }

  try {
    const result = await accessVaultSecret(id, String(payload.vaultPassword ?? ""), actionType);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not access vault secret." }, { status: 403 });
  }
}
