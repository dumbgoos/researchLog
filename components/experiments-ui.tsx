"use client";

import type { FormEvent } from "react";
import { experimentStatuses } from "@/lib/constants";
import type { Experiment, ExperimentStatus, Idea, VaultAsset } from "@/lib/types";
import {
  CheckboxGroup,
  ConfirmDeleteButton,
  EditorSection,
  EmptyState,
  ExperimentResultArtifactsPreview,
  Field,
  FormStatusNote,
  MarkdownPreview,
  PopoutButton,
  ResultArtifactsField,
  TextExcerpt
} from "@/components/form-controls";

function CreateExperimentPanel({
  disabled,
  ideas,
  onSubmit,
  statusMessage
}: {
  disabled: boolean;
  ideas: Idea[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  statusMessage?: string;
}) {
  return (
    <div className="card editor-card" data-kind="experiment">
      <div className="card-title">
        <div>
          <h2>Add Experiment</h2>
          <p className="microcopy">Plan the question, then capture enough run context to make the result reproducible.</p>
        </div>
      </div>
      <form className="form editor-form" onSubmit={onSubmit}>
        <EditorSection collapsible defaultOpen title="Intent" description="Connect the run to a research question.">
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
        </EditorSection>
        <EditorSection collapsible defaultOpen={false} title="Method" description="What changed, and what data/model context matters?">
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
        </EditorSection>
        <EditorSection collapsible defaultOpen={false} title="Run" description="Enough detail to reproduce or find the run later.">
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
        </EditorSection>
        <EditorSection collapsible defaultOpen={false} title="Results" description="Record what happened before interpretation drifts.">
          <Field name="resultMetricsJson" label="Metrics JSON" placeholder="{ }" defaultValue="{}" textarea />
          <Field name="resultSummary" label="Result summary" placeholder="What happened?" textarea />
          <ResultArtifactsField />
          <Field name="analysis" label="Analysis (Markdown)" placeholder="Why did it happen?" markdown textarea />
          <Field name="nextSteps" label="Next steps (Markdown)" placeholder="What should happen next?" markdown textarea />
        </EditorSection>
        <div className="form-actions">
          {statusMessage && <FormStatusNote tone="success">{statusMessage}</FormStatusNote>}
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Saving..." : "Save experiment"}
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
  onSubmit,
  statusMessage
}: {
  disabled: boolean;
  experiment: Experiment;
  ideaTitle: string;
  vaultAssets: VaultAsset[];
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => void;
  statusMessage?: string;
}) {
  return (
    <div className="card detail-card editor-card" data-kind="experiment">
      <div className="card-title">
        <div>
          <h2>Experiment Detail</h2>
          <p className="microcopy">{ideaTitle}</p>
        </div>
        <button className="secondary-button compact-button" onClick={onClose} type="button">
          Close
        </button>
        <PopoutButton href={`/experiments/${encodeURIComponent(experiment.id)}?mode=edit&popout=1`} />
      </div>
      <form className="form editor-form" key={experiment.id} onSubmit={(event) => onSubmit(event, experiment.id)}>
        <EditorSection collapsible defaultOpen title="Context" description="The research question and run state.">
          <Field defaultValue={experiment.title} name="title" label="Title" placeholder="Experiment title" required />
          <Field defaultValue={experiment.objective} name="objective" label="Objective" placeholder="Research question" textarea />
          <div className="form-pair">
            <Field defaultValue={experiment.experimentType} name="experimentType" label="Type" placeholder="Ablation" />
            <label className="field">
              <span>Status</span>
              <select name="status" defaultValue={experiment.status}>
                {experimentStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>
        </EditorSection>
        <EditorSection collapsible defaultOpen={false} title="Method" description="Model, data, and methodological delta.">
          <div className="form-pair">
            <Field defaultValue={experiment.modelName} name="modelName" label="Model" placeholder="model name" />
            <Field defaultValue={experiment.datasetName} name="datasetName" label="Dataset" placeholder="Dataset name" />
          </div>
          <div className="form-pair">
            <Field defaultValue={experiment.datasetVersion} name="datasetVersion" label="Dataset version" placeholder="v1" />
            <Field defaultValue={experiment.runtimeEnv} name="runtimeEnv" label="Runtime env" placeholder="server/env" />
          </div>
          <Field defaultValue={experiment.methodChanges} name="methodChanges" label="Method changes (Markdown)" placeholder="Changes from previous runs" markdown textarea />
          <Field defaultValue={experiment.configJson} name="configJson" label="Config JSON" placeholder="{ }" textarea />
        </EditorSection>
        <EditorSection collapsible defaultOpen={false} title="Run" description="Asset and execution context.">
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
        </EditorSection>
        <EditorSection collapsible defaultOpen={false} title="Results" description="Outcome, interpretation, and follow-up.">
          <Field defaultValue={experiment.resultMetricsJson} name="resultMetricsJson" label="Metrics JSON" placeholder="{ }" textarea />
          <Field defaultValue={experiment.resultSummary} name="resultSummary" label="Result summary" placeholder="What happened?" textarea />
          <ResultArtifactsField defaultValue={experiment.resultArtifacts} />
          <Field defaultValue={experiment.analysis} name="analysis" label="Analysis (Markdown)" placeholder="Why did it happen?" markdown textarea />
          <Field defaultValue={experiment.nextSteps} name="nextSteps" label="Next steps (Markdown)" placeholder="What should happen next?" markdown textarea />
        </EditorSection>
        <div className="form-actions">
          {statusMessage && <FormStatusNote tone="success">{statusMessage}</FormStatusNote>}
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Updating..." : "Update experiment"}
          </button>
        </div>
      </form>
      <div className="preview-stack">
        <ExperimentResultArtifactsPreview artifacts={experiment.resultArtifacts} />
        <MarkdownPreview title="Method preview" value={experiment.methodChanges} />
        <MarkdownPreview title="Analysis preview" value={experiment.analysis} />
        <MarkdownPreview title="Next steps preview" value={experiment.nextSteps} />
      </div>
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
      {experiments.length === 0 && (
        <EmptyState
          description="No experiment matches the current filters. Adjust the query, or plan a new run from the editor panel."
          title="No experiments in this view"
          tone="experiment"
        />
      )}
      {experiments.map((experiment) => (
        <article className={`row ${selectedExperimentId === experiment.id ? "selected-row" : ""}`} data-kind="experiment" key={experiment.id}>
          <div className="row-heading">
            <h3>{experiment.title}</h3>
            <span className="pill">{experiment.status}</span>
          </div>
          <p className="muted row-kicker">{ideaById.get(experiment.ideaId) ?? "Unlinked idea"}</p>
          <TextExcerpt text={experiment.objective} />
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
                <ConfirmDeleteButton disabled={disabled} onConfirm={() => onDeleteExperiment(experiment.id)} />
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}


export { CreateExperimentPanel, ExperimentComparisonPanel, ExperimentDetailPanel, ExperimentList };
