"use client";

import { useMemo, useState, type FormEvent } from "react";
import { vaultAssetTypes } from "@/lib/constants";
import { formatMetadataLines } from "@/lib/form-utils";
import type { VaultAsset, VaultAuditLog, VaultAssetType } from "@/lib/types";
import { ConfirmDeleteButton, EditorSection, EmptyState, FormStatusNote } from "@/components/form-controls";

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  textarea,
  required
}: {
  name: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? (
        <textarea defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} />
      ) : (
        <input defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} />
      )}
    </label>
  );
}

function CreateVaultAssetPanel({
  disabled,
  onSubmit,
  statusMessage
}: {
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  statusMessage?: string;
}) {
  const [assetType, setAssetType] = useState<VaultAssetType>("Token");
  const copy = getVaultFieldCopy(assetType);
  const metadata = {};

  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Add Vault Asset</h2>
          <p className="microcopy">Secrets are encrypted at rest and listed as masked previews only.</p>
        </div>
      </div>
      <form className="form editor-form" onSubmit={onSubmit}>
        <EditorSection title="Asset" description={copy.sectionDescription}>
          <div className="form-pair">
            <label className="field">
              <span>Type</span>
              <select name="assetType" onChange={(event) => setAssetType(event.target.value as VaultAssetType)} value={assetType}>
                {vaultAssetTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <Field name="provider" label={copy.providerLabel} placeholder={copy.providerPlaceholder} />
          </div>
          <StructuredVaultFields assetType={assetType} metadata={metadata} />
          <Field name="name" label="Name" placeholder={copy.namePlaceholder} required />
          <Field name="secret" label={copy.secretLabel} placeholder={copy.secretPlaceholder} />
          <Field name="metadata" label="Additional metadata" placeholder={copy.metadataPlaceholder} textarea />
          <p className="microcopy">
            {copy.metadataHint}
          </p>
          <p className="microcopy">
            Encrypted secret fields can hold passwords or private keys when needed. Prefer least-privilege service accounts over shared root credentials.
          </p>
        </EditorSection>
        <div className="form-actions">
          {statusMessage && <FormStatusNote tone="success">{statusMessage}</FormStatusNote>}
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Saving..." : "Save asset"}
          </button>
        </div>
      </form>
    </div>
  );
}

function VaultAssetList({
  assets,
  onOpenAsset,
  selectedAssetId
}: {
  assets: VaultAsset[];
  onOpenAsset: (id: string) => void;
  selectedAssetId?: string | null;
}) {
  const groupedAssets = vaultAssetTypes.map((assetType) => ({
    assetType,
    assets: assets.filter((asset) => asset.assetType === assetType)
  }));

  return (
    <div className="vault-sections">
      {assets.length === 0 && (
        <EmptyState
          description="Add a token, platform, server alias, or reusable template. Secrets stay encrypted and only appear as masked previews."
          title="No vault assets yet"
          tone="vault"
        />
      )}
      {groupedAssets.map(({ assetType, assets: group }) => (
        <section className="vault-section" key={assetType}>
          <div className="section-heading">
            <h3>{assetType}</h3>
            <span className="tag">{group.length}</span>
          </div>
          <div className="list">
            {group.map((asset) => (
              <article className={`row ${selectedAssetId === asset.id ? "selected-row" : ""}`} data-kind="vault" key={asset.id}>
                <div className="row-heading">
                  <h3>{asset.name}</h3>
                  <span className="pill">{asset.status}</span>
                </div>
                <p className="muted">{formatVaultSummary(asset)}</p>
                {asset.maskedPreview && <p className="secret-preview">{asset.maskedPreview}</p>}
                <div className="metadata-grid">
                  {getVaultMetadataEntries(asset).map(([key, value]) => (
                    <div className="metadata-item" key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <div className="tag-row">
                  <span className="tag">Created {asset.createdAt}</span>
                  <span className="tag">Updated {asset.updatedAt}</span>
                  {asset.lastUsedAt && <span className="tag">Used {asset.lastUsedAt}</span>}
                </div>
                <div className="row-actions">
                  <button className="secondary-button compact-button" onClick={() => onOpenAsset(asset.id)} type="button">
                    Open
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function VaultAuditList({ audits, assets }: { audits: VaultAuditLog[]; assets: VaultAsset[] }) {
  const assetById = new Map(assets.map((asset) => [asset.id, asset.name]));

  return (
    <div className="timeline">
      {audits.length === 0 && (
        <EmptyState
          description="Reveal, copy, rotate, and delete actions will appear here so sensitive asset usage stays traceable."
          title="No audit events yet"
          tone="vault"
        />
      )}
      {audits.map((audit) => (
        <article className="timeline-item" key={audit.id}>
          <span className="timeline-dot" aria-hidden="true" />
          <div>
            <div className="row-heading">
              <h3>{audit.actionType}</h3>
              <span className="tag">{audit.createdAt}</span>
            </div>
            <p className="muted">{audit.assetId ? assetById.get(audit.assetId) ?? audit.assetId : "Deleted asset"}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function VaultAssetDetailPanel({
  asset,
  disabled,
  onAccessSecret,
  onClose,
  onDeleteAsset,
  onSubmit,
  revealedSecret,
  statusMessage
}: {
  asset: VaultAsset;
  disabled: boolean;
  onAccessSecret: (assetId: string, actionType: "reveal" | "copy") => void;
  onClose: () => void;
  onDeleteAsset: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => void;
  revealedSecret: string | null;
  statusMessage?: string;
}) {
  const [assetType, setAssetType] = useState<VaultAssetType>(asset.assetType);
  const copy = getVaultFieldCopy(assetType);
  const metadata = useMemo(() => asset.metadata, [asset.metadata]);

  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Vault Detail</h2>
          <p className="microcopy">Sensitive actions require the vault password and are audited.</p>
        </div>
        <button className="secondary-button compact-button" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <form className="form editor-form" key={asset.id} onSubmit={(event) => onSubmit(event, asset.id)}>
        <EditorSection title="Asset" description={copy.sectionDescription}>
          <div className="form-pair">
            <label className="field">
              <span>Type</span>
              <select name="assetType" onChange={(event) => setAssetType(event.target.value as VaultAssetType)} value={assetType}>
                {vaultAssetTypes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select defaultValue={asset.status} name="status">
                {["Active", "Expired", "Revoked", "Archived"].map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
          <StructuredVaultFields assetType={assetType} metadata={metadata} />
          <Field defaultValue={asset.name} name="name" label="Name" placeholder={copy.namePlaceholder} required />
          <Field defaultValue={asset.provider} name="provider" label={copy.providerLabel} placeholder={copy.providerPlaceholder} />
          <Field name="secret" label={copy.secretLabel} placeholder={copy.secretPlaceholder} />
          <Field
            defaultValue={formatMetadataLines(asset.metadata)}
            name="metadata"
            label="Additional metadata"
            placeholder={copy.metadataPlaceholder}
            textarea
          />
          <p className="microcopy">{copy.metadataHint}</p>
          {asset.maskedPreview && <p className="secret-preview">{revealedSecret ?? asset.maskedPreview}</p>}
        </EditorSection>
        <div className="form-actions">
          {statusMessage && <FormStatusNote tone="success">{statusMessage}</FormStatusNote>}
          {asset.maskedPreview && (
            <>
              <button className="secondary-button compact-button" disabled={disabled} onClick={() => onAccessSecret(asset.id, "reveal")} type="button">
                Reveal
              </button>
              <button className="secondary-button compact-button" disabled={disabled} onClick={() => onAccessSecret(asset.id, "copy")} type="button">
                Copy
              </button>
            </>
          )}
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Updating..." : "Update asset"}
          </button>
          <ConfirmDeleteButton disabled={disabled} onConfirm={() => onDeleteAsset(asset.id)} />
        </div>
      </form>
    </div>
  );
}

function VaultSessionPanel({
  disabled,
  isUnlocked,
  onClear,
  onSubmit,
  statusLabel,
  statusMessage
}: {
  disabled: boolean;
  isUnlocked: boolean;
  onClear: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  statusLabel: string;
  statusMessage?: string;
}) {
  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Vault Session</h2>
          <p className="microcopy">Unlock once, then reveal or copy secrets for a short window without repeated prompts.</p>
        </div>
        <span className="pill">{statusLabel}</span>
      </div>
      <form className="form editor-form" onSubmit={onSubmit}>
        <EditorSection
          title={isUnlocked ? "Unlocked session" : "Unlock vault"}
          description={isUnlocked ? "The current vault session is active in this browser tab." : "Use your vault password to start a short-lived session."}
        >
          <Field name="vaultPassword" label="Vault password" placeholder={isUnlocked ? "Re-enter to refresh the session" : "Enter vault password"} required />
        </EditorSection>
        <div className="form-actions">
          {statusMessage && <FormStatusNote tone="success">{statusMessage}</FormStatusNote>}
          {isUnlocked && (
            <button className="secondary-button compact-button" disabled={disabled} onClick={onClear} type="button">
              Lock now
            </button>
          )}
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Unlocking..." : isUnlocked ? "Refresh session" : "Unlock vault"}
          </button>
        </div>
      </form>
    </div>
  );
}

function formatVaultSummary(asset: VaultAsset) {
  if (asset.assetType === "Token") {
    return [asset.provider, asset.metadata.baseUrl].filter(Boolean).join(" · ") || "LLM token";
  }

  if (asset.assetType === "Server") {
    const endpoint = [asset.metadata.username, asset.metadata.ipAddress ?? asset.metadata.host].filter(Boolean).join("@");
    const port = asset.metadata.port ? `:${asset.metadata.port}` : "";
    return `${endpoint || asset.provider || "Server"}${port}`;
  }

  if (asset.assetType === "Platform") {
    return [asset.provider, asset.metadata.workspace, asset.metadata.project].filter(Boolean).join(" · ") || "Platform asset";
  }

  return [asset.provider, asset.metadata.templateKind].filter(Boolean).join(" · ") || "Reusable template";
}

function getVaultMetadataEntries(asset: VaultAsset) {
  const preferredKeys =
    asset.assetType === "Token"
      ? ["tokenKind", "baseUrl", "organization", "modelScope"]
      : asset.assetType === "Server"
        ? ["username", "ipAddress", "port", "authMethod"]
        : asset.assetType === "Platform"
          ? ["workspace", "project"]
          : ["templateKind", "entrypoint"];

  const seen = new Set<string>();
  const entries: [string, string][] = [];

  for (const key of preferredKeys) {
    const value = asset.metadata[key];

    if (value) {
      entries.push([key, value]);
      seen.add(key);
    }
  }

  for (const [key, value] of Object.entries(asset.metadata)) {
    if (!seen.has(key)) {
      entries.push([key, value]);
    }
  }

  return entries;
}

function StructuredVaultFields({
  assetType,
  metadata
}: {
  assetType: VaultAssetType;
  metadata: Record<string, string>;
}) {
  if (assetType === "Token") {
    return (
      <>
        <div className="form-pair">
          <Field defaultValue={metadata.tokenKind ?? "LLM"} name="tokenKind" label="Token kind" placeholder="LLM" />
          <Field defaultValue={metadata.baseUrl} name="baseUrl" label="Base URL" placeholder="https://api.openai.com/v1" />
        </div>
        <div className="form-pair">
          <Field defaultValue={metadata.organization} name="organization" label="Organization" placeholder="Optional org or workspace" />
          <Field defaultValue={metadata.modelScope} name="modelScope" label="Model scope" placeholder="gpt-4.1 / research models" />
        </div>
      </>
    );
  }

  if (assetType === "Server") {
    return (
      <>
        <div className="form-pair">
          <Field defaultValue={metadata.username} name="username" label="Username" placeholder="research" />
          <Field defaultValue={metadata.ipAddress ?? metadata.host} name="ipAddress" label="IP / Host" placeholder="10.0.0.12" />
        </div>
        <div className="form-pair">
          <Field defaultValue={metadata.port ?? "22"} name="port" label="Port" placeholder="22" />
          <label className="field">
            <span>Auth method</span>
            <select defaultValue={metadata.authMethod ?? "Password"} name="authMethod">
              <option>Password</option>
              <option>Private key</option>
              <option>Token</option>
            </select>
          </label>
        </div>
      </>
    );
  }

  if (assetType === "Platform") {
    return (
      <div className="form-pair">
        <Field defaultValue={metadata.workspace} name="workspace" label="Workspace" placeholder="research-lab" />
        <Field defaultValue={metadata.project} name="project" label="Project" placeholder="graph-memory" />
      </div>
    );
  }

  if (assetType === "Template") {
    return (
      <div className="form-pair">
        <Field defaultValue={metadata.templateKind} name="templateKind" label="Template kind" placeholder="launch preset" />
        <Field defaultValue={metadata.entrypoint} name="entrypoint" label="Entrypoint" placeholder="python train.py" />
      </div>
    );
  }

  return null;
}

function getVaultFieldCopy(assetType: VaultAssetType) {
  if (assetType === "Server") {
    return {
      metadataHint: "Use additional metadata for region, queue, GPU class, or notes that help you pick the right box later.",
      metadataPlaceholder: "region=ap-southeast\nqueue=a100\ngpu=8xH100",
      namePlaceholder: "e.g. A100 training box",
      providerLabel: "Host or cluster",
      providerPlaceholder: "AWS, on-prem, Slurm cluster",
      secretLabel: "Password or private key",
      secretPlaceholder: "Encrypted at rest. Use for the server password or SSH private key.",
      sectionDescription: "Server assets represent actual compute resources, including connection coordinates and encrypted credentials."
    };
  }

  if (assetType === "Platform") {
    return {
      metadataHint: "Capture workspace, org, project, or rate-limit notes that help future runs.",
      metadataPlaceholder: "workspace=research-lab\nproject=graph-memory\nrate_limit=standard",
      namePlaceholder: "e.g. Weights & Biases workspace",
      providerLabel: "Platform",
      providerPlaceholder: "W&B, Hugging Face, OpenAI",
      secretLabel: "API token",
      secretPlaceholder: "Optional token for this platform",
      sectionDescription: "Store the platform context that experiments depend on."
    };
  }

  if (assetType === "Template") {
    return {
      metadataHint: "Use metadata for reusable commands, run presets, model families, or prompt packs.",
      metadataPlaceholder: "template_kind=launch\nentrypoint=python train.py\nowner=team",
      namePlaceholder: "e.g. Baseline run template",
      providerLabel: "Template family",
      providerPlaceholder: "training, eval, prompt, deployment",
      secretLabel: "Protected field",
      secretPlaceholder: "Optional secret referenced by the template",
      sectionDescription: "Templates work best when they describe reusable structure, not just one-off secrets."
    };
  }

  return {
    metadataHint: "Use additional metadata for scope, environment, rotation notes, or provider-specific details beyond the structured fields.",
    metadataPlaceholder: "usage_scope=graph analysis\nenvironment=local\nrotation=monthly",
    namePlaceholder: "e.g. OpenAI research key",
    providerLabel: "Provider",
    providerPlaceholder: "OpenAI, HF, GitHub, cluster",
    secretLabel: "API token",
    secretPlaceholder: "Encrypted at rest. Store the actual token here.",
    sectionDescription: "Token assets are best for LLM keys and other API credentials, with the base URL and scope stored alongside them."
  };
}

export { CreateVaultAssetPanel, VaultAssetDetailPanel, VaultAssetList, VaultAuditList, VaultSessionPanel };
