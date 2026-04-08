import Link from "next/link";
import type { DecisionLog, Experiment, Idea, VaultAsset } from "@/lib/types";

function DetailShell({
  children,
  eyebrow,
  title
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <main className="detail-shell">
      <div className="detail-topbar">
        <Link className="secondary-button inline-link-button" href="/">
          Back to workspace
        </Link>
      </div>
      <header className="page-header detail-header">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
        </div>
      </header>
      {children}
    </main>
  );
}

function IdeaDetailPage({ experimentCount, idea }: { experimentCount: number; idea: Idea }) {
  return (
    <DetailShell eyebrow="Idea" title={idea.title}>
      <section className="grid workbench-grid">
        <article className="card detail-card">
          <div className="metadata-grid">
            <Metric label="Status" value={idea.status} />
            <Metric label="Priority" value={idea.priority} />
            <Metric label="Experiments" value={experimentCount} />
            <Metric label="Updated" value={idea.updatedAt} />
          </div>
          <MarkdownPreview title="Summary" value={idea.summary} />
          <MarkdownPreview title="Motivation" value={idea.motivation} />
          <MarkdownPreview title="Hypothesis" value={idea.hypothesis} />
          <MarkdownPreview title="Novelty" value={idea.novelty} />
        </article>
        <aside className="side-stack">
          <section className="card">
            <h2>Tags</h2>
            <TagList values={idea.tags} />
          </section>
          <section className="card">
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
    <DetailShell eyebrow="Experiment" title={experiment.title}>
      <section className="grid workbench-grid">
        <article className="card detail-card">
          <div className="metadata-grid">
            <Metric label="Idea" value={idea?.title ?? "Unlinked"} />
            <Metric label="Status" value={experiment.status} />
            <Metric label="Type" value={experiment.experimentType} />
            <Metric label="Dataset" value={experiment.datasetName} />
            <Metric label="Model" value={experiment.modelName || "Not set"} />
            <Metric label="Updated" value={experiment.updatedAt} />
          </div>
          <MarkdownPreview title="Objective" value={experiment.objective} />
          <MarkdownPreview title="Method" value={experiment.methodChanges} />
          <MarkdownPreview title="Result Summary" value={experiment.resultSummary} />
          <MarkdownPreview title="Analysis" value={experiment.analysis} />
          <MarkdownPreview title="Next Steps" value={experiment.nextSteps} />
        </article>
        <aside className="side-stack">
          <section className="card">
            <h2>Run Context</h2>
            <div className="metadata-grid">
              <Metric label="Branch" value={experiment.branchName || "Not set"} />
              <Metric label="Commit" value={experiment.commitId || "Not set"} />
              <Metric label="Runtime" value={experiment.runtimeEnv || "Not set"} />
              <Metric label="W&B" value={experiment.wandbUrl || "Not set"} />
              <Metric label="Log" value={experiment.logPath || "Not set"} />
              <Metric label="Checkpoint" value={experiment.ckptPath || "Not set"} />
            </div>
            <MarkdownPreview title="Run command" value={experiment.runCommand} />
          </section>
          <section className="card">
            <h2>Metrics & Config</h2>
            <MarkdownPreview title="Config JSON" value={experiment.configJson} />
            <MarkdownPreview title="Metrics JSON" value={experiment.resultMetricsJson} />
          </section>
          <section className="card">
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
    <DetailShell eyebrow="Decision" title={decision.title}>
      <section className="grid workbench-grid">
        <article className="card detail-card">
          <div className="metadata-grid">
            <Metric label="Type" value={decision.decisionType} />
            <Metric label="Idea" value={idea?.title ?? "Unlinked"} />
            <Metric label="Experiment" value={experiment?.title ?? "None"} />
            <Metric label="Created" value={decision.createdAt} />
          </div>
          <MarkdownPreview title="Reasoning" value={decision.content} />
        </article>
      </section>
    </DetailShell>
  );
}

function MarkdownPreview({ title, value }: { title: string; value: string }) {
  const blocks = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="markdown-preview detail-preview">
      <h2>{title}</h2>
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
        <p className="row" key={value}>
          {value}
        </p>
      ))}
    </div>
  ) : (
    <p className="empty-state">Nothing linked yet.</p>
  );
}

export { DecisionDetailPage, ExperimentDetailPage, IdeaDetailPage };
