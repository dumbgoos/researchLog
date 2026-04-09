"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { CheckboxGroup, EditorSection, Field, FormStatusNote, MarkdownPreview } from "@/components/form-controls";
import { decisionTypes, experimentStatuses, ideaStatuses } from "@/lib/constants";
import type { DecisionLog, Experiment, Idea, VaultAsset } from "@/lib/types";

function DetailShell({
  badges,
  children,
  description,
  eyebrow,
  popout,
  title,
  tone
}: {
  badges?: string[];
  children: ReactNode;
  description?: string;
  eyebrow: string;
  popout?: boolean;
  title: string;
  tone: "idea" | "experiment" | "decision";
}) {
  return (
    <main className={`detail-shell ${popout ? "popout-shell" : ""}`} data-kind={tone}>
      <div className="detail-topbar">
        {popout ? (
          <div className="detail-topbar-actions">
            <button className="secondary-button inline-link-button" onClick={() => window.close()} type="button">
              Close window
            </button>
            <Link className="secondary-button inline-link-button" href={`/${tone === "idea" ? "ideas" : tone === "experiment" ? "experiments" : "decisions"}`}>
              Workspace
            </Link>
          </div>
        ) : (
          <Link className="secondary-button inline-link-button" href="/">
            Back to workspace
          </Link>
        )}
      </div>
      <header className="detail-header">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {description && <p className="header-copy">{description}</p>}
        </div>
        {badges && badges.length > 0 && (
          <div className="detail-badges" aria-label={`${eyebrow} metadata`}>
            {badges.map((badge) => (
              <span className="pill" data-tone={tone} key={badge}>
                {badge}
              </span>
            ))}
          </div>
        )}
      </header>
      {children}
    </main>
  );
}

function IdeaDetailPage({
  experimentCount,
  idea,
  popout = false,
  startEditing = false
}: {
  experimentCount: number;
  idea: Idea;
  popout?: boolean;
  startEditing?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(startEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setIsSaving(true);
    setError(null);
    const response = await fetch(`/api/ideas/${encodeURIComponent(idea.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") ?? "").trim(),
        summary: String(form.get("summary") ?? "").trim(),
        motivation: String(form.get("motivation") ?? "").trim(),
        hypothesis: String(form.get("hypothesis") ?? "").trim(),
        novelty: String(form.get("novelty") ?? "").trim(),
        status: String(form.get("status") ?? idea.status),
        priority: String(form.get("priority") ?? idea.priority),
        tags: String(form.get("tags") ?? "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        relatedPapers: String(form.get("relatedPapers") ?? "")
          .split("\n")
          .map((paper) => paper.trim())
          .filter(Boolean)
      })
    });

    if (!response.ok) {
      setError("Could not update this idea.");
      setIsSaving(false);
      return;
    }

    setSavedMessage("Saved. The idea page is up to date.");
    setIsEditing(false);
    router.refresh();
    setIsSaving(false);
  }

  return (
    <DetailShell
      badges={[idea.status, idea.priority, `${experimentCount} experiments`]}
      description={previewText(idea.summary)}
      eyebrow="Idea"
      popout={popout}
      title={idea.title}
      tone="idea"
    >
      <section className="grid workbench-grid">
        <article className="card document-card">
          <DetailHeaderActions
            canEdit
            isEditing={isEditing}
            onToggleEdit={() => {
              setIsEditing((current) => !current);
              setError(null);
            }}
            title={isEditing ? "Edit Idea" : "Idea Notes"}
          />
          {error && <div className="notice error-notice">{error}</div>}
          {savedMessage && !isEditing && <div className="detail-inline-note"><FormStatusNote tone="success">{savedMessage}</FormStatusNote></div>}
          {isEditing ? (
            <form className="form editor-form document-edit-form" onSubmit={handleSubmit}>
              <EditorSection title="Context" description="Keep the idea legible on its own.">
                <Field defaultValue={idea.title} name="title" label="Title" placeholder="Idea title" required />
                <Field defaultValue={idea.summary} name="summary" label="Summary" placeholder="Short research summary" textarea required />
                <Field defaultValue={idea.motivation} name="motivation" label="Motivation" placeholder="Why this matters" textarea markdown />
              </EditorSection>
              <EditorSection title="Research claim" description="What should later experiments prove or disprove?">
                <Field defaultValue={idea.hypothesis} name="hypothesis" label="Hypothesis" placeholder="Research hypothesis" textarea markdown />
                <Field defaultValue={idea.novelty} name="novelty" label="Novelty" placeholder="Novelty points" textarea markdown />
              </EditorSection>
              <EditorSection title="Organization" description="Status, priority, and retrieval hooks.">
                <div className="form-pair">
                  <label className="field">
                    <span>Status</span>
                    <select defaultValue={idea.status} name="status">
                      {ideaStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Priority</span>
                    <select defaultValue={idea.priority} name="priority">
                      {["Low", "Medium", "High"].map((priority) => (
                        <option key={priority}>{priority}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <Field defaultValue={idea.tags.join(", ")} name="tags" label="Tags" placeholder="llm, graph, reproducibility" />
                <Field defaultValue={idea.relatedPapers.join("\n")} name="relatedPapers" label="Related papers" placeholder="One paper or URL per line" textarea />
              </EditorSection>
              <DetailActionBar disabled={isSaving} submitLabel="Save idea" savedMessage={savedMessage} />
            </form>
          ) : (
            <>
              <DocumentSection label="Context" title="Why this matters">
                <MarkdownPreview value={idea.motivation || idea.summary} />
              </DocumentSection>
              <DocumentSection label="Research claim" title="Hypothesis">
                <MarkdownPreview value={idea.hypothesis} />
              </DocumentSection>
              <DocumentSection label="Differentiation" title="Novelty">
                <MarkdownPreview value={idea.novelty} />
              </DocumentSection>
            </>
          )}
        </article>
        <aside className="side-stack detail-rail">
          <section className="card rail-card">
            <h2>Snapshot</h2>
            <div className="metadata-grid">
              <Metric label="Status" value={idea.status} />
              <Metric label="Priority" value={idea.priority} />
              <Metric label="Experiments" value={experimentCount} />
              <Metric label="Updated" value={idea.updatedAt} />
            </div>
          </section>
          <section className="card rail-card">
            <h2>Tags</h2>
            <TagList values={idea.tags} />
          </section>
          <section className="card rail-card">
            <h2>Related Papers</h2>
            <TextList values={idea.relatedPapers} />
          </section>
        </aside>
      </section>
    </DetailShell>
  );
}

function ExperimentDetailPage({
  assets,
  experiment,
  idea,
  popout = false,
  startEditing = false
}: {
  assets: VaultAsset[];
  experiment: Experiment;
  idea?: Idea;
  popout?: boolean;
  startEditing?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(startEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const linkedAssets = assets.filter((asset) => experiment.linkedAssetIds.includes(asset.id));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setIsSaving(true);
    setError(null);
    const response = await fetch(`/api/experiments/${encodeURIComponent(experiment.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") ?? "").trim(),
        objective: String(form.get("objective") ?? "").trim(),
        experimentType: String(form.get("experimentType") ?? "").trim(),
        status: String(form.get("status") ?? experiment.status),
        modelName: String(form.get("modelName") ?? "").trim(),
        methodChanges: String(form.get("methodChanges") ?? "").trim(),
        datasetName: String(form.get("datasetName") ?? "").trim(),
        datasetVersion: String(form.get("datasetVersion") ?? "").trim(),
        configJson: String(form.get("configJson") ?? "").trim() || "{}",
        linkedAssetIds: form.getAll("linkedAssetIds").map(String),
        runtimeEnv: String(form.get("runtimeEnv") ?? "").trim(),
        branchName: String(form.get("branchName") ?? "").trim(),
        commitId: String(form.get("commitId") ?? "").trim(),
        runCommand: String(form.get("runCommand") ?? "").trim(),
        wandbUrl: String(form.get("wandbUrl") ?? "").trim(),
        logPath: String(form.get("logPath") ?? "").trim(),
        ckptPath: String(form.get("ckptPath") ?? "").trim(),
        resultMetricsJson: String(form.get("resultMetricsJson") ?? "").trim() || "{}",
        resultSummary: String(form.get("resultSummary") ?? "").trim(),
        analysis: String(form.get("analysis") ?? "").trim(),
        nextSteps: String(form.get("nextSteps") ?? "").trim()
      })
    });

    if (!response.ok) {
      setError("Could not update this experiment.");
      setIsSaving(false);
      return;
    }

    setSavedMessage("Saved. Experiment context and assets are synced.");
    setIsEditing(false);
    router.refresh();
    setIsSaving(false);
  }

  return (
    <DetailShell
      badges={[experiment.status, experiment.experimentType, experiment.datasetName || "No dataset"]}
      description={previewText(experiment.objective)}
      eyebrow="Experiment"
      popout={popout}
      title={experiment.title}
      tone="experiment"
    >
      <section className="grid workbench-grid">
        <article className="card document-card">
          <DetailHeaderActions
            canEdit
            isEditing={isEditing}
            onToggleEdit={() => {
              setIsEditing((current) => !current);
              setError(null);
            }}
            title={isEditing ? "Edit Experiment" : "Experiment Record"}
          />
          {error && <div className="notice error-notice">{error}</div>}
          {savedMessage && !isEditing && <div className="detail-inline-note"><FormStatusNote tone="success">{savedMessage}</FormStatusNote></div>}
          {isEditing ? (
            <form className="form editor-form document-edit-form" onSubmit={handleSubmit}>
              <EditorSection title="Context" description="The research question and run state.">
                <Field defaultValue={experiment.title} name="title" label="Title" placeholder="Experiment title" required />
                <Field defaultValue={experiment.objective} name="objective" label="Objective" placeholder="Research question" textarea markdown />
                <div className="form-pair">
                  <Field defaultValue={experiment.experimentType} name="experimentType" label="Type" placeholder="Ablation" />
                  <label className="field">
                    <span>Status</span>
                    <select defaultValue={experiment.status} name="status">
                      {experimentStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </EditorSection>
              <EditorSection title="Method" description="Model, data, and methodological delta.">
                <div className="form-pair">
                  <Field defaultValue={experiment.modelName} name="modelName" label="Model" placeholder="model name" />
                  <Field defaultValue={experiment.datasetName} name="datasetName" label="Dataset" placeholder="dataset name" />
                </div>
                <div className="form-pair">
                  <Field defaultValue={experiment.datasetVersion} name="datasetVersion" label="Dataset version" placeholder="v1" />
                  <Field defaultValue={experiment.runtimeEnv} name="runtimeEnv" label="Runtime env" placeholder="server/env" />
                </div>
                <Field defaultValue={experiment.methodChanges} name="methodChanges" label="Method changes (Markdown)" placeholder="Changes from previous runs" markdown textarea />
                <Field defaultValue={experiment.configJson} name="configJson" label="Config JSON" placeholder="{ }" textarea />
              </EditorSection>
              <EditorSection title="Run" description="Enough detail to reproduce or find the run later.">
                <CheckboxGroup
                  label="Linked assets"
                  name="linkedAssetIds"
                  options={assets.map((asset) => ({ label: `${asset.name} (${asset.assetType})`, value: asset.id }))}
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
              <EditorSection title="Results" description="Outcome, interpretation, and follow-up.">
                <Field defaultValue={experiment.resultMetricsJson} name="resultMetricsJson" label="Metrics JSON" placeholder="{ }" textarea />
                <Field defaultValue={experiment.resultSummary} name="resultSummary" label="Result summary" placeholder="What happened?" textarea markdown />
                <Field defaultValue={experiment.analysis} name="analysis" label="Analysis (Markdown)" placeholder="Why did it happen?" markdown textarea />
                <Field defaultValue={experiment.nextSteps} name="nextSteps" label="Next steps (Markdown)" placeholder="What should happen next?" markdown textarea />
              </EditorSection>
              <DetailActionBar disabled={isSaving} submitLabel="Save experiment" savedMessage={savedMessage} />
            </form>
          ) : (
            <>
              <DocumentSection label="Intent" title="Objective">
                <MarkdownPreview value={experiment.objective} />
              </DocumentSection>
              <DocumentSection label="Method" title="What changed">
                <MarkdownPreview value={experiment.methodChanges} />
              </DocumentSection>
              <DocumentSection label="Results" title="What happened">
                <MarkdownPreview value={experiment.resultSummary} />
              </DocumentSection>
              <DocumentSection label="Analysis" title="Interpretation">
                <MarkdownPreview value={experiment.analysis} />
              </DocumentSection>
              <DocumentSection label="Next" title="Follow-up">
                <MarkdownPreview value={experiment.nextSteps} />
              </DocumentSection>
            </>
          )}
        </article>
        <aside className="side-stack detail-rail">
          <section className="card rail-card">
            <h2>Snapshot</h2>
            <div className="metadata-grid">
              <Metric label="Idea" value={idea?.title ?? "Unlinked"} />
              <Metric label="Status" value={experiment.status} />
              <Metric label="Type" value={experiment.experimentType} />
              <Metric label="Dataset" value={experiment.datasetName || "Not set"} />
              <Metric label="Model" value={experiment.modelName || "Not set"} />
              <Metric label="Updated" value={experiment.updatedAt} />
            </div>
          </section>
          <section className="card rail-card">
            <h2>Run Context</h2>
            <div className="metadata-grid">
              <Metric label="Branch" value={experiment.branchName || "Not set"} />
              <Metric label="Commit" value={experiment.commitId || "Not set"} />
              <Metric label="Runtime" value={experiment.runtimeEnv || "Not set"} />
              <Metric label="W&B" value={experiment.wandbUrl || "Not set"} />
              <Metric label="Log" value={experiment.logPath || "Not set"} />
              <Metric label="Checkpoint" value={experiment.ckptPath || "Not set"} />
            </div>
            <div className="rail-note">
              <MarkdownPreview title="Run command" value={experiment.runCommand} />
            </div>
          </section>
          <section className="card rail-card">
            <h2>Metrics & Config</h2>
            <MarkdownPreview title="Config JSON" value={experiment.configJson} />
            <MarkdownPreview title="Metrics JSON" value={experiment.resultMetricsJson} />
          </section>
          <section className="card rail-card">
            <h2>Linked Assets</h2>
            <TextList values={linkedAssets.map((asset) => `${asset.name} (${asset.assetType})`)} />
          </section>
        </aside>
      </section>
    </DetailShell>
  );
}

function DecisionDetailPage({
  decision,
  experiment,
  experiments,
  idea,
  popout = false,
  startEditing = false
}: {
  decision: DecisionLog;
  experiment?: Experiment;
  experiments: Experiment[];
  idea?: Idea;
  popout?: boolean;
  startEditing?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(startEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setIsSaving(true);
    setError(null);
    const response = await fetch(`/api/decisions/${encodeURIComponent(decision.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(form.get("title") ?? "").trim(),
        decisionType: String(form.get("decisionType") ?? decision.decisionType),
        experimentId: String(form.get("experimentId") ?? ""),
        content: String(form.get("content") ?? "").trim()
      })
    });

    if (!response.ok) {
      setError("Could not update this decision.");
      setIsSaving(false);
      return;
    }

    setSavedMessage("Saved. Decision reasoning is current.");
    setIsEditing(false);
    router.refresh();
    setIsSaving(false);
  }

  return (
    <DetailShell
      badges={[decision.decisionType, idea?.title ?? "Unlinked idea", experiment?.title ?? "No experiment"]}
      description={previewText(decision.content)}
      eyebrow="Decision"
      popout={popout}
      title={decision.title}
      tone="decision"
    >
      <section className="grid workbench-grid">
        <article className="card document-card">
          <DetailHeaderActions
            canEdit
            isEditing={isEditing}
            onToggleEdit={() => {
              setIsEditing((current) => !current);
              setError(null);
            }}
            title={isEditing ? "Edit Decision" : "Decision Record"}
          />
          {error && <div className="notice error-notice">{error}</div>}
          {savedMessage && !isEditing && <div className="detail-inline-note"><FormStatusNote tone="success">{savedMessage}</FormStatusNote></div>}
          {isEditing ? (
            <form className="form editor-form document-edit-form" onSubmit={handleSubmit}>
              <EditorSection title="Decision record" description="Keep the choice and the why in one place.">
                <Field defaultValue={decision.title} name="title" label="Title" placeholder="Decision title" required />
                <div className="form-pair">
                  <label className="field">
                    <span>Decision type</span>
                    <select defaultValue={decision.decisionType} name="decisionType">
                      {decisionTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Experiment</span>
                    <select defaultValue={decision.experimentId ?? ""} name="experimentId">
                      <option value="">No specific experiment</option>
                      {experiments.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <Field defaultValue={decision.content} name="content" label="Reasoning (Markdown)" placeholder="Why this decision?" markdown textarea required />
              </EditorSection>
              <DetailActionBar disabled={isSaving} submitLabel="Save decision" savedMessage={savedMessage} />
            </form>
          ) : (
            <DocumentSection label="Decision record" title="Reasoning">
              <MarkdownPreview value={decision.content} />
            </DocumentSection>
          )}
        </article>
        <aside className="side-stack detail-rail">
          <section className="card rail-card">
            <h2>Snapshot</h2>
            <div className="metadata-grid">
              <Metric label="Type" value={decision.decisionType} />
              <Metric label="Idea" value={idea?.title ?? "Unlinked"} />
              <Metric label="Experiment" value={experiment?.title ?? "None"} />
              <Metric label="Created" value={decision.createdAt} />
            </div>
          </section>
        </aside>
      </section>
    </DetailShell>
  );
}

function DetailHeaderActions({
  canEdit,
  isEditing,
  onToggleEdit,
  title
}: {
  canEdit?: boolean;
  isEditing?: boolean;
  onToggleEdit?: () => void;
  title: string;
}) {
  return (
    <div className="detail-content-header">
      <h2>{title}</h2>
      {canEdit && onToggleEdit && (
        <button className="secondary-button compact-button" onClick={onToggleEdit} type="button">
          {isEditing ? "Back to reading" : "Edit on page"}
        </button>
      )}
    </div>
  );
}

function DetailActionBar({
  disabled,
  savedMessage,
  submitLabel
}: {
  disabled: boolean;
  savedMessage: string | null;
  submitLabel: string;
}) {
  return (
    <div className="form-actions">
      {savedMessage && <FormStatusNote tone="success">{savedMessage}</FormStatusNote>}
      <button className="button" disabled={disabled} type="submit">
        {disabled ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}

function DocumentSection({ children, label, title }: { children: ReactNode; label: string; title: string }) {
  return (
    <section className="document-section">
      <div className="document-section-heading">
        <span>{label}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
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

function TagList({ values }: { values: string[] }) {
  return values.length ? (
    <div className="tag-row">
      {values.map((value) => (
        <span className="tag" key={value}>
          {value}
        </span>
      ))}
    </div>
  ) : (
    <p className="empty-state">No tags yet.</p>
  );
}

function TextList({ values }: { values: string[] }) {
  return values.length ? (
    <div className="list">
      {values.map((value) => (
        <p className="rail-list-item" key={value}>
          {value}
        </p>
      ))}
    </div>
  ) : (
    <p className="empty-state">Nothing linked yet.</p>
  );
}

function previewText(value: string): string | undefined {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return undefined;
  }

  return normalized.length > 220 ? `${normalized.slice(0, 217)}...` : normalized;
}

export { DecisionDetailPage, ExperimentDetailPage, IdeaDetailPage };
