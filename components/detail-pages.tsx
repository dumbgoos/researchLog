import Link from "next/link";
import type { ReactNode } from "react";
import type { DecisionLog, Experiment, Idea, VaultAsset } from "@/lib/types";

function DetailShell({
  badges,
  children,
  description,
  eyebrow,
  tone,
  title
}: {
  badges?: string[];
  children: ReactNode;
  description?: string;
  eyebrow: string;
  tone: "idea" | "experiment" | "decision";
  title: string;
}) {
  return (
    <main className="detail-shell" data-kind={tone}>
      <div className="detail-topbar">
        <Link className="secondary-button inline-link-button" href="/">
          Back to workspace
        </Link>
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

function IdeaDetailPage({ experimentCount, idea }: { experimentCount: number; idea: Idea }) {
  return (
    <DetailShell
      badges={[idea.status, idea.priority, `${experimentCount} experiments`]}
      description={previewText(idea.summary)}
      eyebrow="Idea"
      title={idea.title}
      tone="idea"
    >
      <section className="grid workbench-grid">
        <article className="card document-card">
          <DocumentSection label="Context" title="Why this matters">
            <MarkdownPreview value={idea.motivation || idea.summary} />
          </DocumentSection>
          <DocumentSection label="Research claim" title="Hypothesis">
            <MarkdownPreview value={idea.hypothesis} />
          </DocumentSection>
          <DocumentSection label="Differentiation" title="Novelty">
            <MarkdownPreview value={idea.novelty} />
          </DocumentSection>
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
  idea
}: {
  assets: VaultAsset[];
  experiment: Experiment;
  idea?: Idea;
}) {
  const linkedAssets = assets.filter((asset) => experiment.linkedAssetIds.includes(asset.id));

  return (
    <DetailShell
      badges={[experiment.status, experiment.experimentType, experiment.datasetName || "No dataset"]}
      description={previewText(experiment.objective)}
      eyebrow="Experiment"
      title={experiment.title}
      tone="experiment"
    >
      <section className="grid workbench-grid">
        <article className="card document-card">
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
        </article>
        <aside className="side-stack detail-rail">
          <section className="card rail-card">
            <h2>Snapshot</h2>
            <div className="metadata-grid">
              <Metric label="Idea" value={idea?.title ?? "Unlinked"} />
              <Metric label="Status" value={experiment.status} />
              <Metric label="Type" value={experiment.experimentType} />
              <Metric label="Dataset" value={experiment.datasetName} />
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
  idea
}: {
  decision: DecisionLog;
  experiment?: Experiment;
  idea?: Idea;
}) {
  return (
    <DetailShell
      badges={[decision.decisionType, idea?.title ?? "Unlinked idea", experiment?.title ?? "No experiment"]}
      description={previewText(decision.content)}
      eyebrow="Decision"
      title={decision.title}
      tone="decision"
    >
      <section className="grid workbench-grid">
        <article className="card document-card">
          <DocumentSection label="Decision record" title="Reasoning">
            <MarkdownPreview value={decision.content} />
          </DocumentSection>
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

function MarkdownPreview({ title, value }: { title?: string; value: string }) {
  const blocks = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className={title ? "markdown-preview detail-preview" : "markdown-preview document-preview"}>
      {title && <h2>{title}</h2>}
      {blocks.length === 0 && <p className="muted">Nothing recorded yet.</p>}
      {blocks.map((line, index) => {
        if (line.startsWith("### ")) {
          return <h3 key={index}>{line.slice(4)}</h3>;
        }

        if (line.startsWith("## ")) {
          return <h3 key={index}>{line.slice(3)}</h3>;
        }

        if (line.startsWith("# ")) {
          return <h3 key={index}>{line.slice(2)}</h3>;
        }

        if (line.startsWith("- ")) {
          return <p className="preview-bullet" key={index}>{line.slice(2)}</p>;
        }

        return <p key={index}>{line}</p>;
      })}
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
