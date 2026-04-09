"use client";

import { useState } from "react";
import type { Experiment, Idea, TimelineEvent } from "@/lib/types";
import { EmptyState, TextExcerpt } from "@/components/form-controls";

type ActivityHeatmapCell = {
  date: string;
  count: number;
  label: string;
};

type WeeklyDigestGroup = {
  key: string;
  label: string;
  summary: string;
  items: Experiment[];
};

function StatCard({
  detail,
  label,
  tone,
  value
}: {
  detail: string;
  label: string;
  tone?: "good" | "warn" | "neutral";
  value: number | string;
}) {
  return (
    <article className={`card stat-card ${tone ? `stat-card-${tone}` : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="muted">{detail}</div>
    </article>
  );
}

function TimelineList({ timeline }: { timeline: TimelineEvent[] }) {
  return (
    <div className="timeline">
      {timeline.length === 0 && (
        <EmptyState
          description="Create or update ideas, experiments, decisions, Vault assets, or graph relations. ResearchLog will build the timeline as you work."
          title="No activity yet"
        />
      )}
      {timeline.map((event) => (
        <article className="timeline-item" key={event.id}>
          <span className="timeline-dot" aria-hidden="true" />
          <div className="timeline-content">
            <div className="row-heading">
              <h3>{event.label}</h3>
              <span className="tag">{event.createdAt}</span>
            </div>
            <TextExcerpt text={event.detail} tone="muted" />
          </div>
        </article>
      ))}
    </div>
  );
}

function WeeklyExperimentDigest({
  experiments,
  ideas,
  onOpenExperiment,
  onSelectWeek,
  selectedWeekKey
}: {
  experiments: Experiment[];
  ideas: Idea[];
  onOpenExperiment?: (id: string) => void;
  onSelectWeek?: (weekKey: string | null) => void;
  selectedWeekKey?: string | null;
}) {
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea.title]));
  const grouped = groupExperimentsByWeek(experiments, ideaById);

  return (
    <div className="weekly-digest">
      {grouped.length === 0 && (
        <EmptyState
          description="Experiments you create or finish will roll up into weekly snapshots here."
          title="No weekly experiment recap yet"
          tone="experiment"
        />
      )}
      {grouped.map((week) => (
        <section className={`card weekly-card ${selectedWeekKey === week.key ? "is-selected" : ""}`} key={week.key}>
          <div className="card-title">
            <div>
              <h2>{week.label}</h2>
              <p className="microcopy">{week.summary}</p>
            </div>
            <div className="title-actions">
              <span className="pill">{week.items.length} experiments</span>
              {onSelectWeek && (
                <button
                  className="secondary-button compact-button"
                  onClick={() => onSelectWeek(selectedWeekKey === week.key ? null : week.key)}
                  type="button"
                >
                  {selectedWeekKey === week.key ? "Hide" : "Open week"}
                </button>
              )}
            </div>
          </div>
          <div className="list">
            {week.items.map((experiment) => (
              <article className="row" data-kind="experiment" key={experiment.id}>
                <div className="row-heading">
                  <h3>{experiment.title}</h3>
                  <span className="pill">{experiment.status}</span>
                </div>
                <p className="muted row-kicker">{ideaById.get(experiment.ideaId) ?? "Unlinked idea"}</p>
                <TextExcerpt text={experiment.resultSummary || experiment.objective} tone="muted" />
                {onOpenExperiment && (
                  <div className="row-actions">
                    <button className="secondary-button compact-button" onClick={() => onOpenExperiment(experiment.id)} type="button">
                      Open experiment
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ActivityHeatmap({
  experiments,
  ideas,
  onSelectDate,
  selectedDate
}: {
  experiments: Experiment[];
  ideas: Idea[];
  onSelectDate?: (date: string | null) => void;
  selectedDate?: string | null;
}) {
  const cells = buildHeatmapCells(ideas, experiments);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const activeCell = cells.find((cell) => cell.date === (hoveredDate ?? selectedDate)) ?? null;

  return (
    <div className="card heatmap-card">
      <div className="card-title">
        <div>
          <h2>Daily Momentum</h2>
          <p className="microcopy">How often ideas and experiments landed in the workspace over the last 12 weeks.</p>
        </div>
        <span className="pill">{cells.reduce((sum, cell) => sum + cell.count, 0)} entries</span>
      </div>
      <div className="heatmap-grid" role="img" aria-label="Daily idea and experiment activity heatmap">
        {cells.map((cell) => (
          <div className="heatmap-cell-wrap" key={cell.date}>
            <button
              className={`heatmap-cell level-${Math.min(cell.count, 4)} ${selectedDate === cell.date ? "is-selected" : ""}`}
              onBlur={() => setHoveredDate((current) => (current === cell.date ? null : current))}
              onClick={() => onSelectDate?.(selectedDate === cell.date ? null : cell.date)}
              onFocus={() => setHoveredDate(cell.date)}
              onMouseEnter={() => setHoveredDate(cell.date)}
              onMouseLeave={() => setHoveredDate((current) => (current === cell.date ? null : current))}
              title={cell.label}
              type="button"
            />
            <span>{cell.label}</span>
          </div>
        ))}
      </div>
      <div className="heatmap-hoverline" aria-live="polite">
        {activeCell ? activeCell.label : "Hover or click a day to inspect that moment in the research timeline."}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div className={`heatmap-cell level-${level}`} key={level} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function ActivityDayDetail({
  date,
  experiments,
  ideas,
  onOpenExperiment,
  onOpenIdea
}: {
  date: string | null;
  experiments: Experiment[];
  ideas: Idea[];
  onOpenExperiment?: (id: string) => void;
  onOpenIdea?: (id: string) => void;
}) {
  if (!date) {
    return null;
  }

  const ideaItems = ideas.filter((idea) => idea.createdAt === date);
  const experimentItems = experiments.filter((experiment) => experiment.createdAt === date);

  return (
    <div className="card activity-detail-card">
      <div className="card-title">
        <div>
          <h2>{date}</h2>
          <p className="microcopy">What landed in the workspace on this day.</p>
        </div>
        <span className="pill">{ideaItems.length + experimentItems.length} entries</span>
      </div>
      <div className="list">
        {ideaItems.map((idea) => (
          <article className="row" data-kind="idea" key={idea.id}>
            <div className="row-heading">
              <h3>{idea.title}</h3>
              <span className="pill">Idea</span>
            </div>
            <TextExcerpt text={idea.summary} tone="muted" />
            {onOpenIdea && (
              <div className="row-actions">
                <button className="secondary-button compact-button" onClick={() => onOpenIdea(idea.id)} type="button">
                  Open idea
                </button>
              </div>
            )}
          </article>
        ))}
        {experimentItems.map((experiment) => (
          <article className="row" data-kind="experiment" key={experiment.id}>
            <div className="row-heading">
              <h3>{experiment.title}</h3>
              <span className="pill">{experiment.status}</span>
            </div>
            <TextExcerpt text={experiment.resultSummary || experiment.objective} tone="muted" />
            {onOpenExperiment && (
              <div className="row-actions">
                <button className="secondary-button compact-button" onClick={() => onOpenExperiment(experiment.id)} type="button">
                  Open experiment
                </button>
              </div>
            )}
          </article>
        ))}
        {ideaItems.length + experimentItems.length === 0 && (
          <EmptyState
            description="Nothing new was created on this date in the current workspace snapshot."
            title="No entries for this day"
          />
        )}
      </div>
    </div>
  );
}

function ActivityWeekDetail({
  experiments,
  ideas,
  onOpenExperiment,
  weekKey
}: {
  experiments: Experiment[];
  ideas: Idea[];
  onOpenExperiment?: (id: string) => void;
  weekKey: string | null;
}) {
  if (!weekKey) {
    return null;
  }

  const ideaById = new Map(ideas.map((idea) => [idea.id, idea.title]));
  const match = groupExperimentsByWeek(experiments, ideaById).find((week) => week.key === weekKey);

  if (!match) {
    return null;
  }

  return (
    <div className="card activity-detail-card">
      <div className="card-title">
        <div>
          <h2>{match.label}</h2>
          <p className="microcopy">{match.summary}</p>
        </div>
        <span className="pill">{match.items.length} experiments</span>
      </div>
      <div className="list">
        {match.items.map((experiment) => (
          <article className="row" data-kind="experiment" key={experiment.id}>
            <div className="row-heading">
              <h3>{experiment.title}</h3>
              <span className="pill">{experiment.status}</span>
            </div>
            <p className="muted row-kicker">{ideaById.get(experiment.ideaId) ?? "Unlinked idea"}</p>
            <TextExcerpt text={experiment.resultSummary || experiment.objective} tone="muted" />
            {onOpenExperiment && (
              <div className="row-actions">
                <button className="secondary-button compact-button" onClick={() => onOpenExperiment(experiment.id)} type="button">
                  Open experiment
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function buildHeatmapCells(ideas: Idea[], experiments: Experiment[]): ActivityHeatmapCell[] {
  const counts = new Map<string, number>();

  for (const date of [...ideas.map((idea) => idea.createdAt), ...experiments.map((experiment) => experiment.createdAt)]) {
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const today = new Date();
  const cells: ActivityHeatmapCell[] = [];

  for (let offset = 83; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    cells.push({
      date: key,
      count: counts.get(key) ?? 0,
      label: `${key}: ${counts.get(key) ?? 0} ideas/experiments`
    });
  }

  return cells;
}

function groupExperimentsByWeek(experiments: Experiment[], ideaById: Map<string, string>): WeeklyDigestGroup[] {
  const grouped = new Map<string, Experiment[]>();

  for (const experiment of experiments) {
    const date = new Date(`${experiment.updatedAt}T00:00:00`);
    const monday = new Date(date);
    const day = (date.getDay() + 6) % 7;
    monday.setDate(date.getDate() - day);
    const key = monday.toISOString().slice(0, 10);
    const week = grouped.get(key) ?? [];
    week.push(experiment);
    grouped.set(key, week);
  }

  return Array.from(grouped.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .map(([weekStart, weekExperiments]) => {
      const doneCount = weekExperiments.filter((experiment) => experiment.status === "Done").length;
      const runningCount = weekExperiments.filter((experiment) => experiment.status === "Running").length;
      const topIdeas = Array.from(
        new Set(weekExperiments.map((experiment) => ideaById.get(experiment.ideaId)).filter(Boolean))
      ).slice(0, 2);

      return {
        key: weekStart,
        label: `Week of ${weekStart}`,
        summary: `${doneCount} done · ${runningCount} running${topIdeas.length ? ` · ${topIdeas.join(" · ")}` : ""}`,
        items: weekExperiments.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      };
    });
}

export { ActivityDayDetail, ActivityHeatmap, ActivityWeekDetail, StatCard, TimelineList, WeeklyExperimentDigest };
