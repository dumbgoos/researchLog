"use client";

import { useMemo, useState, type FormEvent, type PointerEvent } from "react";
import type { AIAnalysisSettings, Idea, IdeaRelation, IdeaRelationStatus, ResearchMapSnapshot } from "@/lib/types";
import { ConfirmDeleteButton, EmptyState, FormStatusNote } from "@/components/form-controls";

function ResearchMapCanvas({
  ideas,
  relations,
  selectedIdeaId,
  selectedRelationId,
  viewMode,
  onSelectIdea,
  onSelectRelation
}: {
  ideas: Idea[];
  relations: IdeaRelation[];
  selectedIdeaId: string | null;
  selectedRelationId: string | null;
  viewMode: "Network" | "Evolution" | "Clusters";
  onSelectIdea: (id: string | null) => void;
  onSelectRelation: (id: string) => void;
}) {
  const positions = buildGraphPositions(ideas, relations, viewMode);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [dragStart, setDragStart] = useState<{ pointerId: number; x: number; y: number; originX: number; originY: number } | null>(null);
  const selectedIdeaRelationIds = useMemo(() => {
    if (!selectedIdeaId) {
      return new Set<string>();
    }

    return new Set(
      relations
        .filter((relation) => relation.sourceIdeaId === selectedIdeaId || relation.targetIdeaId === selectedIdeaId)
        .map((relation) => relation.id)
    );
  }, [relations, selectedIdeaId]);
  const zoomLabel = `${Math.round(viewport.zoom * 100)}%`;

  const updateZoom = (nextZoom: number) => {
    setViewport((current) => ({ ...current, zoom: Math.min(1.8, Math.max(0.7, nextZoom)) }));
  };
  const resetViewport = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
    onSelectIdea(null);
  };
  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      originX: viewport.x,
      originY: viewport.y
    });
  };
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!dragStart) {
      return;
    }

    setViewport((current) => ({
      ...current,
      x: dragStart.originX + event.clientX - dragStart.x,
      y: dragStart.originY + event.clientY - dragStart.y
    }));
  };
  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    if (dragStart?.pointerId === event.pointerId) {
      setDragStart(null);
    }
  };

  return (
    <div className="graph research-graph" aria-label="Research map">
      <div className="graph-toolbar" aria-label="Research map controls">
        <button className="secondary-button compact-button" onClick={() => updateZoom(viewport.zoom - 0.1)} type="button">
          Zoom out
        </button>
        <span className="tag">{zoomLabel}</span>
        <button className="secondary-button compact-button" onClick={() => updateZoom(viewport.zoom + 0.1)} type="button">
          Zoom in
        </button>
        <button className="secondary-button compact-button" onClick={resetViewport} type="button">
          Reset
        </button>
      </div>
      {ideas.length === 0 && (
        <EmptyState
          description="Create a few ideas first. Research Map needs idea profiles before it can explain relationships."
          title="No ideas to map"
          tone="map"
        />
      )}
      {ideas.length > 0 && relations.length === 0 && (
        <EmptyState
          description="Try regenerating the map, lowering the confidence filter, or accepting that the current ideas are still independent."
          title="No visible relations"
          tone="map"
        />
      )}
      {ideas.length > 0 && relations.length > 0 && (
        <svg
          className={dragStart ? "is-panning" : ""}
          onPointerDown={handlePointerDown}
          onPointerLeave={handlePointerUp}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="img"
          viewBox="0 0 720 420"
        >
          <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.zoom})`}>
            {relations.map((relation) => {
              const source = positions.get(relation.sourceIdeaId);
              const target = positions.get(relation.targetIdeaId);

              if (!source || !target) {
                return null;
              }

              return (
                <g key={relation.id}>
                  <line
                    className={
                      selectedRelationId === relation.id || selectedIdeaRelationIds.has(relation.id)
                        ? "graph-edge selected-edge"
                        : "graph-edge"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectRelation(relation.id);
                    }}
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
                  isSelected={selectedIdeaId === idea.id}
                  key={idea.id}
                  onSelect={() => onSelectIdea(selectedIdeaId === idea.id ? null : idea.id)}
                  x={position.x}
                  y={position.y}
                  label={idea.title.slice(0, 18)}
                  tone={viewMode === "Clusters" ? idea.tags[0] : undefined}
                />
              );
            })}
          </g>
        </svg>
      )}
    </div>
  );
}

function ResearchMapRelationTable({
  ideaById,
  onSelectRelation,
  relations,
  selectedRelationId
}: {
  ideaById: Map<string, Idea>;
  onSelectRelation: (id: string) => void;
  relations: IdeaRelation[];
  selectedRelationId: string | null;
}) {
  return (
    <div className="relation-table" aria-label="Research map relation table">
      <div className="relation-table-head">
        <span>Relation</span>
        <span>Confidence</span>
        <span>Status</span>
      </div>
      {relations.length === 0 && (
        <div className="relation-table-empty">No visible relation rows.</div>
      )}
      {relations.slice(0, 12).map((relation) => (
        <button
          className={selectedRelationId === relation.id ? "relation-table-row active" : "relation-table-row"}
          key={relation.id}
          onClick={() => onSelectRelation(relation.id)}
          type="button"
        >
          <span>
            <strong>{ideaById.get(relation.sourceIdeaId)?.title ?? "Source"}</strong>
            <small>{relation.relationType} {"->"} {ideaById.get(relation.targetIdeaId)?.title ?? "Target"}</small>
          </span>
          <span>{Math.round(relation.confidence * 100)}%</span>
          <span>{relation.status}</span>
        </button>
      ))}
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
  const statusCounts = map.relations.reduce<Record<IdeaRelationStatus, number>>(
    (counts, relation) => {
      counts[relation.status] += 1;
      return counts;
    },
    { Suggested: 0, Accepted: 0, Hidden: 0, Rejected: 0 }
  );

  return (
    <div className="card graph-status-card">
      <div className="card-title">
        <div>
          <h2>Graph Status</h2>
          <p className="microcopy">Review queue, model health, and relation coverage.</p>
        </div>
        <span className="pill">{latestJob?.status ?? "not generated"}</span>
      </div>
      <div className="review-progress" aria-label="Research map review progress">
        <ReviewStatusItem label="Suggested" tone="suggested" value={statusCounts.Suggested} />
        <ReviewStatusItem label="Accepted" tone="accepted" value={statusCounts.Accepted} />
        <ReviewStatusItem label="Hidden" tone="hidden" value={statusCounts.Hidden} />
        <ReviewStatusItem label="Rejected" tone="rejected" value={statusCounts.Rejected} />
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
  settings,
  statusMessage
}: {
  disabled?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  settings: AIAnalysisSettings;
  statusMessage?: string;
}) {
  return (
    <div className="card detail-card settings-card">
      <div className="card-title">
        <div>
          <h2>AI Settings</h2>
          <p className="microcopy">Tune candidate selection before the graph is regenerated.</p>
        </div>
        <span className="pill">{settings.modelProvider}</span>
      </div>
      <div className="settings-summary" aria-label="Current AI analysis settings">
        <span>{settings.analysisMode}</span>
        <span>{settings.analysisFocus}</span>
        <span>{settings.graphGranularity}</span>
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
          <label className="field">
            <span>Model</span>
            <input defaultValue={settings.modelName} name="modelName" placeholder="local-rules-v1" />
          </label>
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
        <div className="form-actions">
          {statusMessage && <FormStatusNote tone="success">{statusMessage}</FormStatusNote>}
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
    </div>
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
  const sourceIdea = ideaById.get(relation.sourceIdeaId);
  const targetIdea = ideaById.get(relation.targetIdeaId);
  const confidencePercent = Math.min(100, Math.max(0, Math.round(relation.confidence * 100)));

  return (
    <div className="card detail-card review-card">
      <div className="card-title">
        <div>
          <h2>Review Relation</h2>
          <p className="microcopy">Decide whether this connection belongs in long-term research memory.</p>
        </div>
        <span className="pill" data-status={relation.status.toLowerCase()}>
          {relation.status}
        </span>
      </div>
      <div className="relation-ideas">
        <div className="relation-idea-card">
          <span>Source idea</span>
          <strong>{sourceIdea?.title ?? "Source"}</strong>
          {sourceIdea?.summary && <p>{sourceIdea.summary}</p>}
        </div>
        <div className="relation-connector" aria-hidden="true">
          {"->"}
        </div>
        <div className="relation-idea-card">
          <span>Target idea</span>
          <strong>{targetIdea?.title ?? "Target"}</strong>
          {targetIdea?.summary && <p>{targetIdea.summary}</p>}
        </div>
      </div>
      <div className="review-confidence">
        <div>
          <span>Confidence</span>
          <strong>{confidencePercent}%</strong>
        </div>
        <div className="confidence-meter" aria-label={`Confidence ${confidencePercent}%`}>
          <span style={{ width: `${confidencePercent}%` }} />
        </div>
      </div>
      <div className="metadata-grid compact-metadata">
        <Metric label="Type" value={relation.relationType} />
        <Metric label="Model" value={relation.modelName} />
      </div>
      <div className="rationale-block">
        <span>Rationale</span>
        <p>{relation.rationale}</p>
      </div>
      <div className="evidence-list" aria-label="Relation evidence">
        {relation.evidence.map((item) => (
          <p className="evidence-item" key={item}>
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
      <div className="review-actions">
        <button className="button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Accepted", reviewNote)} type="button">
          Accept
        </button>
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Hidden", reviewNote)} type="button">
          Hide
        </button>
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Rejected", reviewNote)} type="button">
          Reject
        </button>
        <ConfirmDeleteButton disabled={disabled} onConfirm={() => onDeleteRelation(relation.id)} />
      </div>
    </div>
  );
}

function ReviewStatusItem({
  label,
  tone,
  value
}: {
  label: IdeaRelationStatus;
  tone: "suggested" | "accepted" | "hidden" | "rejected";
  value: number;
}) {
  return (
    <div className="review-progress-item" data-tone={tone}>
      <span>{label}</span>
      <strong>{value}</strong>
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

function GraphNode({
  isSelected,
  label,
  onSelect,
  tone,
  x,
  y
}: {
  isSelected?: boolean;
  label: string;
  onSelect: () => void;
  tone?: string;
  x: number;
  y: number;
}) {
  const fill = tone ? clusterColor(tone) : "#0f6b6e";

  return (
    <g className={isSelected ? "graph-node selected-node" : "graph-node"} onClick={(event) => {
      event.stopPropagation();
      onSelect();
    }}>
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

export { AISettingsPanel, RelationDetailPanel, ResearchMapCanvas, ResearchMapRelationTable, ResearchMapSummary };
