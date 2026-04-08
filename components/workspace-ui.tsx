"use client";

import { useState, type FormEvent } from "react";
import { decisionTypes, experimentStatuses, ideaStatuses } from "@/lib/constants";
import type {
  DecisionLog,
  Experiment,
  ExperimentStatus,
  Idea,
  IdeaStatus,
  TimelineEvent,
  VaultAsset
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

export {
  CreateDecisionPanel,
  CreateExperimentPanel,
  CreateIdeaPanel,
  DecisionDetailPanel,
  DecisionList,
  ExperimentComparisonPanel,
  ExperimentDetailPanel,
  ExperimentList,
  Field,
  IdeaDetailPanel,
  IdeaList,
  StatCard,
  TimelineList
};
