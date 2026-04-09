"use client";

import { useState, type FormEvent } from "react";
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
          <Field name="name" label="Name" placeholder={copy.namePlaceholder} required />
          <Field name="secret" label={copy.secretLabel} placeholder={copy.secretPlaceholder} />
          <Field name="metadata" label="Metadata" placeholder={copy.metadataPlaceholder} textarea />
          <p className="microcopy">
            {copy.metadataHint}
          </p>
          <p className="microcopy">
            Do not store SSH private keys or root passwords. Server entries should use host metadata and aliases only.
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
                <p className="muted">{asset.provider || "No provider set"}</p>
                {asset.maskedPreview && <p className="secret-preview">{asset.maskedPreview}</p>}
                <div className="metadata-grid">
                  {Object.entries(asset.metadata).map(([key, value]) => (
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
          <Field defaultValue={asset.name} name="name" label="Name" placeholder={copy.namePlaceholder} required />
          <Field defaultValue={asset.provider} name="provider" label={copy.providerLabel} placeholder={copy.providerPlaceholder} />
          <Field name="secret" label={copy.secretLabel} placeholder={copy.secretPlaceholder} />
          <Field
            defaultValue={formatMetadataLines(asset.metadata)}
            name="metadata"
            label="Metadata"
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

function getVaultFieldCopy(assetType: VaultAssetType) {
  if (assetType === "Server") {
    return {
      metadataHint: "Record alias, region, ssh host, queue name, and any safe runtime notes.",
      metadataPlaceholder: "host=compute-01\nregion=ap-southeast\nqueue=a100",
      namePlaceholder: "e.g. A100 training box",
      providerLabel: "Host or cluster",
      providerPlaceholder: "AWS, on-prem, Slurm cluster",
      secretLabel: "Access note",
      secretPlaceholder: "Optional token or note for audited reveal",
      sectionDescription: "Keep infrastructure references easy to reuse without storing raw root credentials."
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
    metadataHint: "Use metadata for scope, environment, and rotation notes.",
    metadataPlaceholder: "usage_scope=graph analysis\nenvironment=local\nrotation=monthly",
    namePlaceholder: "e.g. OpenAI research key",
    providerLabel: "Provider",
    providerPlaceholder: "OpenAI, HF, GitHub, cluster",
    secretLabel: "Secret value",
    secretPlaceholder: "Encrypted at rest. Leave blank only if there is no secret yet.",
    sectionDescription: "Token assets are best for keys and short-lived credentials used by experiments or map analysis."
  };
}

export { CreateVaultAssetPanel, VaultAssetDetailPanel, VaultAssetList, VaultAuditList };
