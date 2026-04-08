"use client";

import type { Experiment, Idea } from "@/lib/types";

function TodayPanel({
  activeIdeas,
  experiments,
  onOpenExperiment
}: {
  activeIdeas: Idea[];
  experiments: Experiment[];
  onOpenExperiment: (id: string) => void;
}) {
  const nextStepExperiments = experiments
    .filter((experiment) => experiment.nextSteps.trim() && !["Completed", "Failed"].includes(experiment.status))
    .slice(0, 4);

  return (
    <div className="card">
      <div className="card-title">
        <div>
          <h2>Today</h2>
          <p className="microcopy">Pick up the most actionable research threads.</p>
        </div>
        <span className="pill">{nextStepExperiments.length} next steps</span>
      </div>
      <div className="list">
        {nextStepExperiments.length === 0 && (
          <p className="empty-state">No explicit next steps yet. Add one to an active experiment.</p>
        )}
        {nextStepExperiments.map((experiment) => (
          <article className="row" key={experiment.id}>
            <div className="row-heading">
              <h3>{experiment.title}</h3>
              <span className="pill">{experiment.status}</span>
            </div>
            <p>{experiment.nextSteps}</p>
            <div className="row-actions">
              <button className="secondary-button compact-button" onClick={() => onOpenExperiment(experiment.id)} type="button">
                Open experiment
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="metadata-grid dashboard-meta">
        <Metric label="Active ideas" value={activeIdeas.length} />
        <Metric label="Running" value={experiments.filter((experiment) => experiment.status === "Running").length} />
      </div>
    </div>
  );
}

function ActiveThreadsPanel({
  experimentCounts,
  ideas,
  onOpenIdea
}: {
  experimentCounts: Record<string, number>;
  ideas: Idea[];
  onOpenIdea: (id: string) => void;
}) {
  const threads = [...ideas]
    .sort((a, b) => (experimentCounts[b.id] ?? 0) - (experimentCounts[a.id] ?? 0))
    .slice(0, 4);

  return (
    <div className="card">
      <div className="card-title">
        <h2>Active Threads</h2>
        <span className="pill">research memory</span>
      </div>
      <div className="list">
        {threads.map((idea) => (
          <article className="row" key={idea.id}>
            <div className="row-heading">
              <h3>{idea.title}</h3>
              <span className="pill">{experimentCounts[idea.id] ?? 0} experiments</span>
            </div>
            <p className="muted">{idea.summary}</p>
            <div className="tag-row">
              {idea.tags.slice(0, 4).map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="row-actions">
              <button className="secondary-button compact-button" onClick={() => onOpenIdea(idea.id)} type="button">
                Open idea
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function StaleExperimentsPanel({
  experiments,
  onOpenExperiment
}: {
  experiments: Experiment[];
  onOpenExperiment: (id: string) => void;
}) {
  const staleExperiments = [...experiments]
    .filter((experiment) => ["Planned", "Running"].includes(experiment.status))
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    .slice(0, 4);

  return (
    <div className="card">
      <div className="card-title">
        <h2>Stale Experiments</h2>
        <span className="pill">{staleExperiments.length} review</span>
      </div>
      <div className="list">
        {staleExperiments.length === 0 && <p className="empty-state">No stale active experiments right now.</p>}
        {staleExperiments.map((experiment) => (
          <article className="row" key={experiment.id}>
            <div className="row-heading">
              <h3>{experiment.title}</h3>
              <span className="pill">{experiment.updatedAt}</span>
            </div>
            <p className="muted">{experiment.resultSummary || experiment.objective}</p>
            <div className="row-actions">
              <button className="secondary-button compact-button" onClick={() => onOpenExperiment(experiment.id)} type="button">
                Review
              </button>
            </div>
          </article>
        ))}
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

export { ActiveThreadsPanel, StaleExperimentsPanel, TodayPanel };
