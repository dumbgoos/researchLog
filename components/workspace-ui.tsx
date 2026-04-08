"use client";

import type { TimelineEvent } from "@/lib/types";
import { EmptyState, TextExcerpt } from "@/components/form-controls";
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
      <div className="muted">{label}</div>
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

export {
  StatCard,
  TimelineList
};
