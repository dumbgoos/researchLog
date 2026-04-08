"use client";

import { useState, type FormEvent } from "react";
import { formatMetadataLines } from "@/lib/form-utils";
import { decisionTypes, experimentStatuses, ideaStatuses, vaultAssetTypes } from "@/lib/constants";
import type {
  DecisionLog,
  Experiment,
  ExperimentStatus,
  Idea,
  IdeaRelation,
  IdeaRelationStatus,
  IdeaStatus,
  AIAnalysisSettings,
  ResearchMapSnapshot,
  TimelineEvent,
  VaultAsset,
  VaultAuditLog
} from "@/lib/types";
function StatCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <article className="card">
      <div className="muted">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="muted">{detail}</div>
    </article>
  );
}

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  markdown,
  textarea,
  required
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  markdown?: boolean;
  textarea?: boolean;
  required?: boolean;
}) {
  if (textarea && markdown) {
    return (
      <MarkdownTextarea
        defaultValue={defaultValue}
        label={label}
        name={name}
        placeholder={placeholder}
        required={required}
      />
    );
  }

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

function MarkdownTextarea({
  defaultValue,
  label,
  name,
  placeholder,
  required
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const insertSnippet = (snippet: string) => {
    setValue((current) => [current.trimEnd(), snippet].filter(Boolean).join("\n"));
  };

  return (
    <label className="field markdown-editor">
      <span>{label}</span>
      <div className="markdown-toolbar" aria-label={`${label} formatting`}>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("### Heading")} type="button">
          Heading
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("- Observation")} type="button">
          Bullet
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("```bash\ncommand\n```")} type="button">
          Code
        </button>
      </div>
      <textarea
        name={name}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </label>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  values
}: {
  label: string;
  name: string;
  options: { label: string; value: string }[];
  values: string[];
}) {
  return (
    <fieldset className="checkbox-group">
      <legend>{label}</legend>
      {options.length === 0 && <p className="microcopy">No vault assets available.</p>}
      {options.map((option) => (
        <label className="checkbox-option" key={option.value}>
          <input defaultChecked={values.includes(option.value)} name={name} type="checkbox" value={option.value} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function CreateIdeaPanel({ disabled, onSubmit }: { disabled: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="card">
      <div className="card-title">
        <h2>Create Idea</h2>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <Field name="title" label="Title" placeholder="e.g. Graph-guided experiment recall" required />
        <Field name="summary" label="Summary" placeholder="What is the research direction?" textarea required />
        <Field name="motivation" label="Motivation" placeholder="Why is this worth pursuing?" textarea />
        <Field name="hypothesis" label="Hypothesis" placeholder="What do you believe might be true?" textarea />
        <Field name="novelty" label="Novelty" placeholder="What is new or different?" textarea />
        <label className="field">
          <span>Status</span>
          <select name="status" defaultValue="Inbox">
            {ideaStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <Field name="tags" label="Tags" placeholder="llm, graph, reproducibility" />
        <Field name="relatedPapers" label="Related papers" placeholder="One paper or URL per line" textarea />
        <div className="form-actions">
          <button className="button" disabled={disabled} type="submit">
            Save idea
          </button>
        </div>
      </form>
    </div>
  );
}

function IdeaDetailPanel({
  disabled,
  idea,
  onClose,
  onSubmit
}: {
  disabled: boolean;
  idea: Idea;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => void;
}) {
  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Idea Detail</h2>
          <p className="microcopy">Last updated {idea.updatedAt}</p>
        </div>
        <button className="secondary-button compact-button" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <form className="form" key={idea.id} onSubmit={(event) => onSubmit(event, idea.id)}>
        <Field defaultValue={idea.title} name="title" label="Title" placeholder="Idea title" required />
        <Field defaultValue={idea.summary} name="summary" label="Summary" placeholder="Short research summary" textarea required />
        <Field defaultValue={idea.motivation} name="motivation" label="Motivation" placeholder="Why this matters" textarea />
        <Field defaultValue={idea.hypothesis} name="hypothesis" label="Hypothesis" placeholder="Research hypothesis" textarea />
        <Field defaultValue={idea.novelty} name="novelty" label="Novelty" placeholder="Novelty points" textarea />
        <div className="form-pair">
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={idea.status}>
              {ideaStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select name="priority" defaultValue={idea.priority}>
              {["Low", "Medium", "High"].map((priority) => (
                <option key={priority}>{priority}</option>
              ))}
            </select>
          </label>
        </div>
        <Field defaultValue={idea.tags.join(", ")} name="tags" label="Tags" placeholder="llm, graph, reproducibility" />
        <Field
          defaultValue={idea.relatedPapers.join("\n")}
          name="relatedPapers"
          label="Related papers"
          placeholder="One paper or URL per line"
          textarea
        />
        <div className="form-actions">
          <button className="button" disabled={disabled} type="submit">
            Update idea
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateExperimentPanel({
  disabled,
  ideas,
  onSubmit
}: {
  disabled: boolean;
  ideas: Idea[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="card">
      <div className="card-title">
        <h2>Add Experiment</h2>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span>Idea</span>
          <select name="ideaId" disabled={ideas.length === 0}>
            {ideas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title}
              </option>
            ))}
          </select>
        </label>
        <Field name="title" label="Title" placeholder="e.g. Baseline reproduction" required />
        <Field name="objective" label="Objective" placeholder="What should this run answer?" textarea />
        <div className="form-pair">
          <Field name="experimentType" label="Type" placeholder="Ablation" />
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue="Planned">
              {experimentStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-pair">
          <Field name="modelName" label="Model" placeholder="model name" />
          <Field name="datasetName" label="Dataset" placeholder="dataset name" />
        </div>
        <Field name="methodChanges" label="Method changes (Markdown)" placeholder="What changed from the previous run?" markdown textarea />
        <div className="form-pair">
          <Field name="datasetVersion" label="Dataset version" placeholder="v1, split hash, date" />
          <Field name="runtimeEnv" label="Runtime env" placeholder="server, conda env, docker image" />
        </div>
        <Field name="configJson" label="Config JSON" placeholder="{ }" defaultValue="{}" textarea />
        <div className="form-pair">
          <Field name="branchName" label="Branch" placeholder="main" />
          <Field name="commitId" label="Commit" placeholder="git commit id" />
        </div>
        <Field name="runCommand" label="Run command" placeholder="python train.py ..." textarea />
        <div className="form-pair">
          <Field name="wandbUrl" label="W&B URL" placeholder="https://wandb.ai/..." />
          <Field name="logPath" label="Log path" placeholder="logs/run.log" />
        </div>
        <Field name="ckptPath" label="Checkpoint path" placeholder="checkpoints/run.pt" />
        <Field name="resultMetricsJson" label="Metrics JSON" placeholder="{ }" defaultValue="{}" textarea />
        <Field name="resultSummary" label="Result summary" placeholder="What happened?" textarea />
        <Field name="analysis" label="Analysis (Markdown)" placeholder="Why did it happen?" markdown textarea />
        <Field name="nextSteps" label="Next steps (Markdown)" placeholder="What should happen next?" markdown textarea />
        <div className="form-actions">
          <button className="button" disabled={disabled} type="submit">
            Save experiment
          </button>
        </div>
      </form>
    </div>
  );
}

function ExperimentDetailPanel({
  disabled,
  experiment,
  ideaTitle,
  vaultAssets,
  onClose,
  onSubmit
}: {
  disabled: boolean;
  experiment: Experiment;
  ideaTitle: string;
  vaultAssets: VaultAsset[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => void;
}) {
  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Experiment Detail</h2>
          <p className="microcopy">{ideaTitle}</p>
        </div>
        <button className="secondary-button compact-button" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <form className="form" key={experiment.id} onSubmit={(event) => onSubmit(event, experiment.id)}>
        <Field defaultValue={experiment.title} name="title" label="Title" placeholder="Experiment title" required />
        <Field defaultValue={experiment.objective} name="objective" label="Objective" placeholder="Research question" textarea />
        <div className="form-pair">
          <Field
            defaultValue={experiment.experimentType}
            name="experimentType"
            label="Type"
            placeholder="Ablation"
          />
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={experiment.status}>
              {experimentStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="form-pair">
          <Field defaultValue={experiment.modelName} name="modelName" label="Model" placeholder="model name" />
          <Field defaultValue={experiment.datasetName} name="datasetName" label="Dataset" placeholder="Dataset name" />
        </div>
        <Field
          defaultValue={experiment.methodChanges}
          name="methodChanges"
          label="Method changes (Markdown)"
          placeholder="Changes from previous runs"
          markdown
          textarea
        />
        <div className="form-pair">
          <Field defaultValue={experiment.datasetVersion} name="datasetVersion" label="Dataset version" placeholder="v1" />
          <Field defaultValue={experiment.runtimeEnv} name="runtimeEnv" label="Runtime env" placeholder="server/env" />
        </div>
        <Field defaultValue={experiment.configJson} name="configJson" label="Config JSON" placeholder="{ }" textarea />
        <CheckboxGroup
          label="Linked assets"
          name="linkedAssetIds"
          options={vaultAssets.map((asset) => ({ label: `${asset.name} (${asset.assetType})`, value: asset.id }))}
          values={experiment.linkedAssetIds}
        />
        <div className="form-pair">
          <Field defaultValue={experiment.branchName} name="branchName" label="Branch" placeholder="main" />
          <Field defaultValue={experiment.commitId} name="commitId" label="Commit" placeholder="git commit id" />
        </div>
        <Field defaultValue={experiment.runCommand} name="runCommand" label="Run command" placeholder="python train.py ..." textarea />
        <div className="form-pair">
          <Field defaultValue={experiment.wandbUrl} name="wandbUrl" label="W&B URL" placeholder="https://wandb.ai/..." />
          <Field defaultValue={experiment.logPath} name="logPath" label="Log path" placeholder="logs/run.log" />
        </div>
        <Field defaultValue={experiment.ckptPath} name="ckptPath" label="Checkpoint path" placeholder="checkpoints/run.pt" />
        <Field
          defaultValue={experiment.resultMetricsJson}
          name="resultMetricsJson"
          label="Metrics JSON"
          placeholder="{ }"
          textarea
        />
        <Field
          defaultValue={experiment.resultSummary}
          name="resultSummary"
          label="Result summary"
          placeholder="What happened?"
          textarea
        />
        <Field defaultValue={experiment.analysis} name="analysis" label="Analysis (Markdown)" placeholder="Why did it happen?" markdown textarea />
        <Field defaultValue={experiment.nextSteps} name="nextSteps" label="Next steps (Markdown)" placeholder="What should happen next?" markdown textarea />
        <div className="form-actions">
          <button className="button" disabled={disabled} type="submit">
            Update experiment
          </button>
        </div>
      </form>
      <div className="preview-stack">
        <MarkdownPreview title="Method preview" value={experiment.methodChanges} />
        <MarkdownPreview title="Analysis preview" value={experiment.analysis} />
        <MarkdownPreview title="Next steps preview" value={experiment.nextSteps} />
      </div>
    </div>
  );
}

function CreateDecisionPanel({
  disabled,
  experiments,
  ideas,
  onSubmit
}: {
  disabled: boolean;
  experiments: Experiment[];
  ideas: Idea[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="card">
      <div className="card-title">
        <h2>Add Decision</h2>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span>Idea</span>
          <select name="ideaId" disabled={ideas.length === 0}>
            {ideas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Experiment</span>
          <select name="experimentId" defaultValue="">
            <option value="">No specific experiment</option>
            {experiments.map((experiment) => (
              <option key={experiment.id} value={experiment.id}>
                {experiment.title}
              </option>
            ))}
          </select>
        </label>
        <Field name="title" label="Title" placeholder="e.g. Pause this direction" required />
        <label className="field">
          <span>Decision type</span>
          <select name="decisionType" defaultValue="continue">
            {decisionTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <Field name="content" label="Reasoning (Markdown)" placeholder="Why are we making this move?" markdown textarea required />
        <div className="form-actions">
          <button className="button" disabled={disabled} type="submit">
            Save decision
          </button>
        </div>
      </form>
    </div>
  );
}

function DecisionDetailPanel({
  decision,
  disabled,
  experiments,
  ideaTitle,
  onClose,
  onSubmit
}: {
  decision: DecisionLog;
  disabled: boolean;
  experiments: Experiment[];
  ideaTitle: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => void;
}) {
  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Decision Detail</h2>
          <p className="microcopy">{ideaTitle}</p>
        </div>
        <button className="secondary-button compact-button" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <form className="form" key={decision.id} onSubmit={(event) => onSubmit(event, decision.id)}>
        <Field defaultValue={decision.title} name="title" label="Title" placeholder="Decision title" required />
        <label className="field">
          <span>Decision type</span>
          <select name="decisionType" defaultValue={decision.decisionType}>
            {decisionTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Experiment</span>
          <select name="experimentId" defaultValue={decision.experimentId ?? ""}>
            <option value="">No specific experiment</option>
            {experiments.map((experiment) => (
              <option key={experiment.id} value={experiment.id}>
                {experiment.title}
              </option>
            ))}
          </select>
        </label>
        <Field defaultValue={decision.content} name="content" label="Reasoning (Markdown)" placeholder="Why this decision?" markdown textarea required />
        <div className="form-actions">
          <button className="button" disabled={disabled} type="submit">
            Update decision
          </button>
        </div>
      </form>
      <MarkdownPreview title="Reasoning preview" value={decision.content} />
    </div>
  );
}

function ExperimentComparisonPanel({
  experiments,
  ideaById,
  onClear
}: {
  experiments: Experiment[];
  ideaById: Map<string, string>;
  onClear: () => void;
}) {
  const rows: { label: string; getValue: (experiment: Experiment) => string }[] = [
    { label: "Idea", getValue: (experiment) => ideaById.get(experiment.ideaId) ?? "Unlinked idea" },
    { label: "Status", getValue: (experiment) => experiment.status },
    { label: "Type", getValue: (experiment) => experiment.experimentType },
    { label: "Model", getValue: (experiment) => experiment.modelName || "Not set" },
    { label: "Dataset", getValue: (experiment) => [experiment.datasetName, experiment.datasetVersion].filter(Boolean).join(" / ") },
    { label: "Config", getValue: (experiment) => experiment.configJson },
    { label: "Metrics", getValue: (experiment) => experiment.resultMetricsJson },
    { label: "Conclusion", getValue: (experiment) => experiment.resultSummary || "Pending" },
    { label: "Next", getValue: (experiment) => experiment.nextSteps || "Not set" }
  ];

  return (
    <div className="compare-panel">
      <div className="card-title">
        <h2>Experiment Compare</h2>
        <button className="secondary-button compact-button" onClick={onClear} type="button">
          Clear
        </button>
      </div>
      <div className="compare-table" style={{ gridTemplateColumns: `150px repeat(${experiments.length}, minmax(180px, 1fr))` }}>
        <div className="compare-cell compare-head">Field</div>
        {experiments.map((experiment) => (
          <div className="compare-cell compare-head" key={experiment.id}>
            {experiment.title}
          </div>
        ))}
        {rows.map((row) => (
          <FragmentRow experiments={experiments} getValue={row.getValue} key={row.label} label={row.label} />
        ))}
      </div>
    </div>
  );
}

function FragmentRow({
  experiments,
  getValue,
  label
}: {
  experiments: Experiment[];
  getValue: (experiment: Experiment) => string;
  label: string;
}) {
  return (
    <>
      <div className="compare-cell compare-label">{label}</div>
      {experiments.map((experiment) => (
        <div className="compare-cell" key={`${label}-${experiment.id}`}>
          {getValue(experiment)}
        </div>
      ))}
    </>
  );
}

function MarkdownPreview({ title, value }: { title: string; value: string }) {
  const blocks = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="markdown-preview">
      <h3>{title}</h3>
      {blocks.map((line, index) => {
        if (line.startsWith("### ")) {
          return <h4 key={index}>{line.slice(4)}</h4>;
        }

        if (line.startsWith("## ")) {
          return <h4 key={index}>{line.slice(3)}</h4>;
        }

        if (line.startsWith("# ")) {
          return <h4 key={index}>{line.slice(2)}</h4>;
        }

        if (line.startsWith("- ")) {
          return <p className="preview-bullet" key={index}>{line.slice(2)}</p>;
        }

        return <p key={index}>{line}</p>;
      })}
    </div>
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
            Save asset
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
            Update asset
          </button>
          <button className="danger-button" disabled={disabled} onClick={() => onDeleteAsset(asset.id)} type="button">
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}

function ResearchMapCanvas({
  ideas,
  relations,
  selectedRelationId,
  viewMode,
  onSelectRelation
}: {
  ideas: Idea[];
  relations: IdeaRelation[];
  selectedRelationId: string | null;
  viewMode: "Network" | "Evolution" | "Clusters";
  onSelectRelation: (id: string) => void;
}) {
  const positions = buildGraphPositions(ideas, relations, viewMode);

  return (
    <div className="graph research-graph" aria-label="Research map">
      {ideas.length === 0 && <p className="empty-state">Create ideas before generating a research map.</p>}
      {ideas.length > 0 && (
        <svg role="img" viewBox="0 0 720 420">
          {relations.map((relation) => {
            const source = positions.get(relation.sourceIdeaId);
            const target = positions.get(relation.targetIdeaId);

            if (!source || !target) {
              return null;
            }

            return (
              <g key={relation.id}>
                <line
                  className={selectedRelationId === relation.id ? "graph-edge selected-edge" : "graph-edge"}
                  onClick={() => onSelectRelation(relation.id)}
                  strokeWidth={Math.max(2, relation.confidence * 5)}
                  x1={source.x}
                  x2={target.x}
                  y1={source.y}
                  y2={target.y}
                />
                <text
                  className="graph-edge-label"
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 8}
                >
                  {relation.relationType}
                </text>
              </g>
            );
          })}
          {ideas.map((idea) => {
            const position = positions.get(idea.id) ?? { x: 360, y: 210 };
            return (
              <GraphNode
                key={idea.id}
                x={position.x}
                y={position.y}
                label={idea.title.slice(0, 18)}
                tone={viewMode === "Clusters" ? idea.tags[0] : undefined}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}

function ResearchMapSummary({
  ideas,
  map,
  visibleRelations
}: {
  ideas: Idea[];
  map: ResearchMapSnapshot;
  visibleRelations: number;
}) {
  const latestJob = map.jobs[0];

  return (
    <div className="card">
      <div className="card-title">
        <h2>Graph Status</h2>
        <span className="pill">{latestJob?.status ?? "not generated"}</span>
      </div>
      <div className="metadata-grid">
        <Metric label="Ideas" value={ideas.length} />
        <Metric label="Profiles" value={map.profiles.length} />
        <Metric label="Relations" value={map.relations.length} />
        <Metric label="Visible" value={visibleRelations} />
        <Metric label="Jobs" value={map.jobs.length} />
        <Metric label="Proposed" value={latestJob?.relationsProposed ?? 0} />
        <Metric label="Inserted" value={latestJob?.relationsInserted ?? 0} />
        <Metric label="Candidates" value={latestJob?.candidatePairs ?? 0} />
        <Metric label="Fallback" value={latestJob?.fallbackUsed ? "Yes" : "No"} />
      </div>
      {latestJob && (
        <p className="muted">
          {latestJob.provider} / {latestJob.modelName} started {latestJob.startedAt}
        </p>
      )}
      {latestJob?.errorMessage && <p className="microcopy">{latestJob.errorMessage}</p>}
      <div className="tag-row">
        {Array.from(new Set(map.relations.map((relation) => relation.relationType))).map((relationType) => (
          <span className="tag" key={relationType}>
            {relationType}
          </span>
        ))}
      </div>
    </div>
  );
}

function AISettingsPanel({
  disabled,
  onSubmit,
  settings
}: {
  disabled?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  settings: AIAnalysisSettings;
}) {
  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>AI Settings</h2>
          <p className="microcopy">Tune candidate selection before the graph is regenerated.</p>
        </div>
        <span className="pill">{settings.modelProvider}</span>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-pair">
          <SelectField
            defaultValue={settings.analysisMode}
            label="Mode"
            name="analysisMode"
            options={["Conservative", "Balanced", "Exploratory"]}
          />
          <SelectField
            defaultValue={settings.analysisFocus}
            label="Focus"
            name="analysisFocus"
            options={["Problem-oriented", "Method-oriented", "Evolution-oriented", "Experiment-oriented"]}
          />
        </div>
        <div className="form-pair">
          <SelectField
            defaultValue={settings.graphGranularity}
            label="Granularity"
            name="graphGranularity"
            options={["Coarse", "Medium", "Fine"]}
          />
          <SelectField
            defaultValue={settings.explanationVerbosity}
            label="Rationale"
            name="explanationVerbosity"
            options={["Concise", "Detailed"]}
          />
        </div>
          <SelectField
            defaultValue={settings.refreshBehavior}
            label="Refresh behavior"
          name="refreshBehavior"
          options={[
            "Manual refresh only",
            "Refresh on idea creation",
            "Refresh on idea update",
            "Scheduled batch refresh",
            "Incremental refresh only for changed nodes"
          ]}
        />
        <div className="form-pair">
          <SelectField
            defaultValue={settings.modelProvider}
            label="Provider"
            name="modelProvider"
            options={["rule-engine", "mock-llm", "openai-compatible"]}
          />
          <Field defaultValue={settings.modelName} name="modelName" label="Model" placeholder="local-rules-v1" />
        </div>
        <div className="form-pair">
          <NumberField
            defaultValue={settings.confidenceThreshold}
            label="Confidence"
            max="0.95"
            min="0.1"
            name="confidenceThreshold"
            step="0.05"
          />
          <NumberField
            defaultValue={settings.maxGraphDensity}
            label="Max density"
            max="1"
            min="0.05"
            name="maxGraphDensity"
            step="0.05"
          />
        </div>
        <div className="form-pair">
          <NumberField
            defaultValue={settings.maxCandidateNeighbors}
            label="Neighbors"
            max="50"
            min="1"
            name="maxCandidateNeighbors"
            step="1"
          />
          <NumberField
            defaultValue={settings.tokenBudget}
            label="Token budget"
            max="20000"
            min="1000"
            name="tokenBudget"
            step="500"
          />
        </div>
        <button className="button" disabled={disabled} type="submit">
          Save settings
        </button>
      </form>
    </div>
  );
}

function SelectField({
  defaultValue,
  label,
  name,
  options
}: {
  defaultValue: string;
  label: string;
  name: string;
  options: string[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select defaultValue={defaultValue} name={name}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  defaultValue,
  label,
  max,
  min,
  name,
  step
}: {
  defaultValue: number;
  label: string;
  max: string;
  min: string;
  name: string;
  step: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input defaultValue={defaultValue} max={max} min={min} name={name} step={step} type="number" />
    </label>
  );
}

function RelationDetailPanel({
  disabled,
  ideaById,
  onDeleteRelation,
  onUpdateStatus,
  relation
}: {
  disabled?: boolean;
  ideaById: Map<string, Idea>;
  onDeleteRelation: (id: string) => void;
  onUpdateStatus: (id: string, status: IdeaRelationStatus, reviewNote?: string) => void;
  relation: IdeaRelation;
}) {
  const [reviewNote, setReviewNote] = useState(relation.reviewNote);

  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Relation Detail</h2>
          <p className="microcopy">
            {ideaById.get(relation.sourceIdeaId)?.title ?? "Source"} {"->"}{" "}
            {ideaById.get(relation.targetIdeaId)?.title ?? "Target"}
          </p>
        </div>
        <span className="pill">{relation.status}</span>
      </div>
      <div className="metadata-grid">
        <Metric label="Type" value={relation.relationType} />
        <Metric label="Confidence" value={`${Math.round(relation.confidence * 100)}%`} />
        <Metric label="Model" value={relation.modelName} />
      </div>
      <p>{relation.rationale}</p>
      <div className="list">
        {relation.evidence.map((item) => (
          <p className="row" key={item}>
            {item}
          </p>
        ))}
      </div>
      <label className="field">
        <span>Review note</span>
        <textarea
          onChange={(event) => setReviewNote(event.target.value)}
          placeholder="Why should this relation be trusted, hidden, or rejected?"
          value={reviewNote}
        />
      </label>
      <div className="row-actions">
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Accepted", reviewNote)} type="button">
          Accept
        </button>
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Hidden", reviewNote)} type="button">
          Hide
        </button>
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Rejected", reviewNote)} type="button">
          Reject
        </button>
        <button className="danger-button" disabled={disabled} onClick={() => onDeleteRelation(relation.id)} type="button">
          Delete
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="metadata-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function IdeaList({
  ideas,
  experimentCounts,
  disabled,
  onDeleteIdea,
  onOpenIdea,
  onStatusChange,
  selectedIdeaId
}: {
  ideas: Idea[];
  experimentCounts: Record<string, number>;
  disabled?: boolean;
  onDeleteIdea?: (id: string) => void;
  onOpenIdea?: (id: string) => void;
  onStatusChange?: (id: string, status: IdeaStatus) => void;
  selectedIdeaId?: string | null;
}) {
  return (
    <div className="list">
      {ideas.length === 0 && <p className="empty-state">No ideas match this view.</p>}
      {ideas.map((idea) => (
        <article className={`row ${selectedIdeaId === idea.id ? "selected-row" : ""}`} key={idea.id}>
          <div className="row-heading">
            <h3>{idea.title}</h3>
            <span className="pill">{idea.status}</span>
          </div>
          <p className="muted">{idea.summary}</p>
          <p>{idea.hypothesis}</p>
          <div className="tag-row">
            <span className="tag">{experimentCounts[idea.id] ?? 0} experiments</span>
            <span className="tag">{idea.priority} priority</span>
            {idea.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          {(onStatusChange || onDeleteIdea) && (
            <div className="row-actions">
              {onStatusChange && (
                <label className="inline-control">
                  <span>Status</span>
                  <select
                    disabled={disabled}
                    onChange={(event) => onStatusChange(idea.id, event.target.value as IdeaStatus)}
                    value={idea.status}
                  >
                    {ideaStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              )}
              {onOpenIdea && (
                <button className="secondary-button compact-button" onClick={() => onOpenIdea(idea.id)} type="button">
                  Open
                </button>
              )}
              <a className="secondary-button compact-button inline-link-button" href={`/ideas/${encodeURIComponent(idea.id)}`}>
                Page
              </a>
              {onDeleteIdea && (
                <button className="danger-button" disabled={disabled} onClick={() => onDeleteIdea(idea.id)} type="button">
                  Delete
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function ExperimentList({
  comparedExperimentIds,
  experiments,
  ideas,
  disabled,
  onDeleteExperiment,
  onOpenExperiment,
  onStatusChange,
  onToggleCompare,
  selectedExperimentId
}: {
  comparedExperimentIds?: string[];
  experiments: Experiment[];
  ideas: Idea[];
  disabled?: boolean;
  onDeleteExperiment?: (id: string) => void;
  onOpenExperiment?: (id: string) => void;
  onStatusChange?: (id: string, status: ExperimentStatus) => void;
  onToggleCompare?: (id: string) => void;
  selectedExperimentId?: string | null;
}) {
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea.title]));

  return (
    <div className="list">
      {experiments.length === 0 && <p className="empty-state">No experiments match this view.</p>}
      {experiments.map((experiment) => (
        <article className={`row ${selectedExperimentId === experiment.id ? "selected-row" : ""}`} key={experiment.id}>
          <div className="row-heading">
            <h3>{experiment.title}</h3>
            <span className="pill">{experiment.status}</span>
          </div>
          <p className="muted">{ideaById.get(experiment.ideaId) ?? "Unlinked idea"}</p>
          <p>{experiment.objective}</p>
          <div className="tag-row">
            <span className="tag">{experiment.experimentType}</span>
            <span className="tag">{experiment.datasetName}</span>
            <span className="tag">{experiment.updatedAt}</span>
          </div>
          {(onStatusChange || onDeleteExperiment) && (
            <div className="row-actions">
              {onStatusChange && (
                <label className="inline-control">
                  <span>Status</span>
                  <select
                    disabled={disabled}
                    onChange={(event) => onStatusChange(experiment.id, event.target.value as ExperimentStatus)}
                    value={experiment.status}
                  >
                    {experimentStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              )}
              {onOpenExperiment && (
                <button className="secondary-button compact-button" onClick={() => onOpenExperiment(experiment.id)} type="button">
                  Open
                </button>
              )}
              <a className="secondary-button compact-button inline-link-button" href={`/experiments/${encodeURIComponent(experiment.id)}`}>
                Page
              </a>
              {onToggleCompare && (
                <button
                  className="secondary-button compact-button"
                  onClick={() => onToggleCompare(experiment.id)}
                  type="button"
                >
                  {comparedExperimentIds?.includes(experiment.id) ? "Uncompare" : "Compare"}
                </button>
              )}
              {onDeleteExperiment && (
                <button
                  className="danger-button"
                  disabled={disabled}
                  onClick={() => onDeleteExperiment(experiment.id)}
                  type="button"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function DecisionList({
  decisions,
  ideas,
  disabled,
  onDeleteDecision,
  onOpenDecision,
  onTypeChange,
  selectedDecisionId
}: {
  decisions: DecisionLog[];
  ideas: Idea[];
  disabled?: boolean;
  onDeleteDecision?: (id: string) => void;
  onOpenDecision?: (id: string) => void;
  onTypeChange?: (id: string, decisionType: DecisionLog["decisionType"]) => void;
  selectedDecisionId?: string | null;
}) {
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea.title]));

  return (
    <div className="list">
      {decisions.length === 0 && <p className="empty-state">No decisions match this view.</p>}
      {decisions.map((decision) => (
        <article className={`row ${selectedDecisionId === decision.id ? "selected-row" : ""}`} key={decision.id}>
          <div className="row-heading">
            <h3>{decision.title}</h3>
            <span className="pill">{decision.decisionType}</span>
          </div>
          <p className="muted">{ideaById.get(decision.ideaId) ?? "Unlinked idea"}</p>
          <p>{decision.content}</p>
          <div className="tag-row">
            <span className="tag">{decision.createdAt}</span>
          </div>
          {(onTypeChange || onDeleteDecision) && (
            <div className="row-actions">
              {onTypeChange && (
                <label className="inline-control">
                  <span>Type</span>
                  <select
                    disabled={disabled}
                    onChange={(event) => onTypeChange(decision.id, event.target.value as DecisionLog["decisionType"])}
                    value={decision.decisionType}
                  >
                    {decisionTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
              )}
              {onOpenDecision && (
                <button className="secondary-button compact-button" onClick={() => onOpenDecision(decision.id)} type="button">
                  Open
                </button>
              )}
              <a className="secondary-button compact-button inline-link-button" href={`/decisions/${encodeURIComponent(decision.id)}`}>
                Page
              </a>
              {onDeleteDecision && (
                <button
                  className="danger-button"
                  disabled={disabled}
                  onClick={() => onDeleteDecision(decision.id)}
                  type="button"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function TimelineList({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <div className="timeline">
      {timeline.map((event) => (
        <article className="timeline-item" key={event.id}>
          <span className="timeline-dot" aria-hidden="true" />
          <div>
            <div className="row-heading">
              <h3>{event.label}</h3>
              <span className="tag">{event.createdAt}</span>
            </div>
            <p className="muted">{event.detail}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function GraphNode({ x, y, label, tone }: { x: number; y: number; label: string; tone?: string }) {
  const fill = tone ? clusterColor(tone) : "#0f6b6e";

  return (
    <g>
      <circle cx={x} cy={y} r="46" fill={fill} />
      <text fill="white" fontSize="15" fontWeight="700" textAnchor="middle" x={x} y={y + 5}>
        {label}
      </text>
    </g>
  );
}

function buildGraphPositions(
  ideas: Idea[],
  relations: IdeaRelation[],
  viewMode: "Network" | "Evolution" | "Clusters"
): Map<string, { x: number; y: number }> {
  if (viewMode === "Evolution") {
    const sortedIdeas = [...ideas].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return new Map(
      sortedIdeas.map((idea, index) => [
        idea.id,
        {
          x: 90 + index * (540 / Math.max(sortedIdeas.length - 1, 1)),
          y: 210 + (index % 2 === 0 ? -70 : 70)
        }
      ])
    );
  }

  if (viewMode === "Clusters") {
    const clusters = Array.from(new Set(ideas.map((idea) => idea.tags[0] ?? "untagged")));
    return new Map(
      ideas.map((idea, index) => {
        const clusterIndex = clusters.indexOf(idea.tags[0] ?? "untagged");
        const clusterAngle = (clusterIndex / Math.max(clusters.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const localRadius = 32 + (index % 4) * 24;
        return [
          idea.id,
          {
            x: 360 + Math.cos(clusterAngle) * 145 + Math.cos(index) * localRadius,
            y: 210 + Math.sin(clusterAngle) * 105 + Math.sin(index) * localRadius
          }
        ] as const;
      })
    );
  }

  const connectedIdeaIds = new Set(relations.flatMap((relation) => [relation.sourceIdeaId, relation.targetIdeaId]));
  return new Map(
    ideas.map((idea, index) => {
      const angle = (index / Math.max(ideas.length, 1)) * Math.PI * 2 - Math.PI / 2;
      const radius = connectedIdeaIds.has(idea.id) ? 150 : 185;
      return [
        idea.id,
        {
          x: 360 + Math.cos(angle) * radius,
          y: 210 + Math.sin(angle) * radius
        }
      ] as const;
    })
  );
}

function clusterColor(value: string): string {
  const palette = ["#0f6b6e", "#1f5f3f", "#6b4f1d", "#384f77", "#6b3f3f"];
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return palette[hash % palette.length];
}

export {
  CreateDecisionPanel,
  CreateExperimentPanel,
  CreateIdeaPanel,
  CreateVaultAssetPanel,
  AISettingsPanel,
  DecisionDetailPanel,
  DecisionList,
  ExperimentComparisonPanel,
  ExperimentDetailPanel,
  ExperimentList,
  Field,
  IdeaDetailPanel,
  IdeaList,
  RelationDetailPanel,
  ResearchMapCanvas,
  ResearchMapSummary,
  StatCard,
  TimelineList,
  VaultAssetDetailPanel,
  VaultAssetList,
  VaultAuditList
};
