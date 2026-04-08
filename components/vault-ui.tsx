"use client";

import type { FormEvent } from "react";
import { vaultAssetTypes } from "@/lib/constants";
import { formatMetadataLines } from "@/lib/form-utils";
import type { VaultAsset, VaultAuditLog } from "@/lib/types";

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
  onSubmit
}: {
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Add Vault Asset</h2>
          <p className="microcopy">Secrets are encrypted at rest and listed as masked previews only.</p>
        </div>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-pair">
          <label className="field">
            <span>Type</span>
            <select name="assetType" defaultValue="Token">
              {vaultAssetTypes.map((assetType) => (
                <option key={assetType}>{assetType}</option>
              ))}
            </select>
          </label>
          <Field name="provider" label="Provider" placeholder="OpenAI, HF, GitHub, cluster" />
        </div>
        <Field name="name" label="Name" placeholder="e.g. OpenAI research key" required />
        <Field name="secret" label="Secret value" placeholder="Only required for Token assets" />
        <Field name="metadata" label="Metadata" placeholder="usage_scope=graph analysis&#10;environment=local" textarea />
        <p className="microcopy">
          Do not store SSH private keys or root passwords. Server entries should use host metadata and aliases only.
        </p>
        <div className="form-actions">
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
      {assets.length === 0 && <p className="empty-state">No vault assets yet.</p>}
      {groupedAssets.map(({ assetType, assets: group }) => (
        <section className="vault-section" key={assetType}>
          <div className="section-heading">
            <h3>{assetType}</h3>
            <span className="tag">{group.length}</span>
          </div>
          <div className="list">
            {group.map((asset) => (
              <article className={`row ${selectedAssetId === asset.id ? "selected-row" : ""}`} key={asset.id}>
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
      {audits.length === 0 && <p className="empty-state">No vault audit events yet.</p>}
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
  revealedSecret
}: {
  asset: VaultAsset;
  disabled: boolean;
  onAccessSecret: (assetId: string, actionType: "reveal" | "copy") => void;
  onClose: () => void;
  onDeleteAsset: (id: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => void;
  revealedSecret: string | null;
}) {
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
      <form className="form" key={asset.id} onSubmit={(event) => onSubmit(event, asset.id)}>
        <div className="form-pair">
          <label className="field">
            <span>Type</span>
            <select name="assetType" defaultValue={asset.assetType}>
              {vaultAssetTypes.map((assetType) => (
                <option key={assetType}>{assetType}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={asset.status}>
              {["Active", "Expired", "Revoked", "Archived"].map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <Field defaultValue={asset.name} name="name" label="Name" placeholder="Asset name" required />
        <Field defaultValue={asset.provider} name="provider" label="Provider" placeholder="Provider or host" />
        <Field name="secret" label="Rotate secret" placeholder="Leave blank to keep the current encrypted secret" />
        <Field
          defaultValue={formatMetadataLines(asset.metadata)}
          name="metadata"
          label="Metadata"
          placeholder="key=value"
          textarea
        />
        {asset.maskedPreview && <p className="secret-preview">{revealedSecret ?? asset.maskedPreview}</p>}
        <div className="row-actions">
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
          <button className="danger-button" disabled={disabled} onClick={() => onDeleteAsset(asset.id)} type="button">
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

export { CreateVaultAssetPanel, VaultAssetDetailPanel, VaultAssetList, VaultAuditList };
