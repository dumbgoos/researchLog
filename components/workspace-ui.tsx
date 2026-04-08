"use client";

import type { TimelineEvent } from "@/lib/types";
function StatCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <article className="card">
      <div className="muted">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="muted">{detail}</div>
    </article>
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
  StatCard,
  TimelineList
};
