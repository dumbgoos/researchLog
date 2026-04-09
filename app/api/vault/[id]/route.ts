import { NextRequest, NextResponse } from "next/server";
import { deleteVaultAsset, updateVaultAsset } from "@/lib/repository";
import type { VaultAsset, VaultAssetType } from "@/lib/types";

const assetTypes: VaultAssetType[] = ["Token", "Server", "Platform", "Template"];
const assetStatuses: VaultAsset["status"][] = ["Active", "Expired", "Revoked", "Archived"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const payload = await request.json();
  const assetType = payload.assetType === undefined ? undefined : (String(payload.assetType) as VaultAssetType);
  const status = payload.status === undefined ? undefined : (String(payload.status) as VaultAsset["status"]);

  if ((assetType !== undefined && !assetTypes.includes(assetType)) || (status !== undefined && !assetStatuses.includes(status))) {
    return NextResponse.json({ error: "Invalid asset type or status." }, { status: 400 });
  }

  const name = payload.name === undefined ? undefined : String(payload.name).trim();
  const metadata = payload.metadata === undefined ? undefined : normalizeMetadata(payload.metadata);

  if (name === "") {
    return NextResponse.json({ error: "Asset name cannot be empty." }, { status: 400 });
  }

  if (assetType === "Token" && metadata && !metadata.baseUrl) {
    return NextResponse.json({ error: "LLM token assets should include a base URL." }, { status: 400 });
  }

  if (assetType === "Server" && metadata && (!metadata.username || !(metadata.ipAddress || metadata.host))) {
    return NextResponse.json({ error: "Server assets require a username and an IP or host." }, { status: 400 });
  }

  const asset = await updateVaultAsset(id, {
    assetType,
    name,
    provider: payload.provider === undefined ? undefined : String(payload.provider).trim(),
    secret: payload.secret === undefined ? undefined : String(payload.secret).trim(),
    status,
    metadata
  });

  return NextResponse.json(asset);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  await deleteVaultAsset(id);
  return NextResponse.json({ ok: true });
}

function normalizeMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, String(entryValue ?? "").trim()]).filter(([, entryValue]) => entryValue)
  );
}
