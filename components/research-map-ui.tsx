"use client";

import { useState, type FormEvent } from "react";
import type { AIAnalysisSettings, Idea, IdeaRelation, IdeaRelationStatus, ResearchMapSnapshot } from "@/lib/types";

function ResearchMapCanvas({
  ideas,
  relations,
  selectedRelationId,
  viewMode,
  onSelectRelation
}: {
  ideas: Idea[];
  relations: IdeaRelation[];
  selectedRelationId: string | null;
  viewMode: "Network" | "Evolution" | "Clusters";
  onSelectRelation: (id: string) => void;
}) {
  const positions = buildGraphPositions(ideas, relations, viewMode);

  return (
    <div className="graph research-graph" aria-label="Research map">
      {ideas.length === 0 && <p className="empty-state">Create ideas before generating a research map.</p>}
      {ideas.length > 0 && (
        <svg role="img" viewBox="0 0 720 420">
          {relations.map((relation) => {
            const source = positions.get(relation.sourceIdeaId);
            const target = positions.get(relation.targetIdeaId);

            if (!source || !target) {
              return null;
            }

            return (
              <g key={relation.id}>
                <line
                  className={selectedRelationId === relation.id ? "graph-edge selected-edge" : "graph-edge"}
                  onClick={() => onSelectRelation(relation.id)}
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
                key={idea.id}
                x={position.x}
                y={position.y}
                label={idea.title.slice(0, 18)}
                tone={viewMode === "Clusters" ? idea.tags[0] : undefined}
              />
            );
          })}
        </svg>
      )}
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

  return (
    <div className="card">
      <div className="card-title">
        <h2>Graph Status</h2>
        <span className="pill">{latestJob?.status ?? "not generated"}</span>
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
  settings
}: {
  disabled?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  settings: AIAnalysisSettings;
}) {
  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>AI Settings</h2>
          <p className="microcopy">Tune candidate selection before the graph is regenerated.</p>
        </div>
        <span className="pill">{settings.modelProvider}</span>
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
        <button className="button" disabled={disabled} type="submit">
          {disabled ? "Saving..." : "Save settings"}
        </button>
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

  return (
    <div className="card detail-card">
      <div className="card-title">
        <div>
          <h2>Relation Detail</h2>
          <p className="microcopy">
            {ideaById.get(relation.sourceIdeaId)?.title ?? "Source"} {"->"}{" "}
            {ideaById.get(relation.targetIdeaId)?.title ?? "Target"}
          </p>
        </div>
        <span className="pill">{relation.status}</span>
      </div>
      <div className="metadata-grid">
        <Metric label="Type" value={relation.relationType} />
        <Metric label="Confidence" value={`${Math.round(relation.confidence * 100)}%`} />
        <Metric label="Model" value={relation.modelName} />
      </div>
      <p>{relation.rationale}</p>
      <div className="list">
        {relation.evidence.map((item) => (
          <p className="row" key={item}>
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
      <div className="row-actions">
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Accepted", reviewNote)} type="button">
          Accept
        </button>
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Hidden", reviewNote)} type="button">
          Hide
        </button>
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => onUpdateStatus(relation.id, "Rejected", reviewNote)} type="button">
          Reject
        </button>
        <button className="danger-button" disabled={disabled} onClick={() => onDeleteRelation(relation.id)} type="button">
          Delete
        </button>
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

function GraphNode({ x, y, label, tone }: { x: number; y: number; label: string; tone?: string }) {
  const fill = tone ? clusterColor(tone) : "#0f6b6e";

  return (
    <g>
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

export { AISettingsPanel, RelationDetailPanel, ResearchMapCanvas, ResearchMapSummary };
