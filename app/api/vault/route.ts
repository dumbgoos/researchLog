import { NextRequest, NextResponse } from "next/server";
import { createVaultAsset, getWorkspaceSnapshot } from "@/lib/repository";
import type { VaultAsset, VaultAssetType } from "@/lib/types";

export const runtime = "nodejs";

const assetTypes: VaultAssetType[] = ["Token", "Server", "Platform", "Template"];
const assetStatuses: VaultAsset["status"][] = ["Active", "Expired", "Revoked", "Archived"];

export async function GET() {
  const snapshot = await getWorkspaceSnapshot();
  return NextResponse.json({
    vaultAssets: snapshot.vaultAssets,
    vaultAuditLogs: snapshot.vaultAuditLogs
  });
}

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const assetType = String(payload.assetType ?? "Token") as VaultAssetType;
  const name = String(payload.name ?? "").trim();
  const provider = String(payload.provider ?? "").trim();
  const status = String(payload.status ?? "Active") as VaultAsset["status"];
  const secret = String(payload.secret ?? "").trim();

  if (!assetTypes.includes(assetType) || !assetStatuses.includes(status) || !name) {
    return NextResponse.json({ error: "Name, asset type, and valid status are required." }, { status: 400 });
  }

  if (assetType === "Token" && !secret) {
    return NextResponse.json({ error: "Token assets require a secret value." }, { status: 400 });
  }

  const asset = await createVaultAsset({
    assetType,
    name,
    provider,
    status,
    secret,
    metadata: normalizeMetadata(payload.metadata)
  });

  return NextResponse.json(asset, { status: 201 });
}

function normalizeMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, String(entryValue ?? "").trim()]).filter(([, entryValue]) => entryValue)
  );
}
