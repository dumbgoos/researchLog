import { NextRequest, NextResponse } from "next/server";
import { isVaultAuthorized } from "@/lib/vault-crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const vaultPassword = String(payload.vaultPassword ?? "");

  if (!vaultPassword || !isVaultAuthorized(vaultPassword)) {
    return NextResponse.json({ error: "Invalid vault password." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
