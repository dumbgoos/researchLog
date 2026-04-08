"use client";

import type { FormEvent } from "react";
import { decisionTypes } from "@/lib/constants";
import type { DecisionLog, Experiment, Idea } from "@/lib/types";
import { EditorSection, EmptyState, Field, MarkdownPreview } from "@/components/form-controls";

function CreateDecisionPanel({
  disabled,
  experiments,
  ideas,
  onSubmit
}: {
  disabled: boolean;
  experiments: Experiment[];
  ideas: Idea[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="card editor-card" data-kind="decision">
      <div className="card-title">
        <div>
          <h2>Add Decision</h2>
          <p className="microcopy">Write down the choice while the evidence is still fresh.</p>
        </div>
      </div>
      <form className="form editor-form" onSubmit={onSubmit}>
        <EditorSection title="Scope" description="Connect the decision to the work it changes.">
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
          <label className="field">
            <span>Experiment</span>
            <select name="experimentId" defaultValue="">
              <option value="">No specific experiment</option>
              {experiments.map((experiment) => (
                <option key={experiment.id} value={experiment.id}>
                  {experiment.title}
                </option>
              ))}
            </select>
          </label>
        </EditorSection>
        <EditorSection title="Decision record" description="The choice and the reason it should survive memory drift.">
          <Field name="title" label="Title" placeholder="e.g. Pause this direction" required />
          <label className="field">
            <span>Decision type</span>
            <select name="decisionType" defaultValue="continue">
              {decisionTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <Field name="content" label="Reasoning (Markdown)" placeholder="Why are we making this move?" markdown textarea required />
        </EditorSection>
        <div className="form-actions">
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Saving..." : "Save decision"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DecisionDetailPanel({
  decision,
  disabled,
  experiments,
  ideaTitle,
  onClose,
  onSubmit
}: {
  decision: DecisionLog;
  disabled: boolean;
  experiments: Experiment[];
  ideaTitle: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => void;
}) {
  return (
    <div className="card detail-card editor-card" data-kind="decision">
      <div className="card-title">
        <div>
          <h2>Decision Detail</h2>
          <p className="microcopy">{ideaTitle}</p>
        </div>
        <button className="secondary-button compact-button" onClick={onClose} type="button">
          Close
        </button>
      </div>
      <form className="form editor-form" key={decision.id} onSubmit={(event) => onSubmit(event, decision.id)}>
        <EditorSection title="Decision record" description="Update the choice and its reasoning.">
          <Field defaultValue={decision.title} name="title" label="Title" placeholder="Decision title" required />
          <label className="field">
            <span>Decision type</span>
            <select name="decisionType" defaultValue={decision.decisionType}>
              {decisionTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Experiment</span>
            <select name="experimentId" defaultValue={decision.experimentId ?? ""}>
              <option value="">No specific experiment</option>
              {experiments.map((experiment) => (
                <option key={experiment.id} value={experiment.id}>
                  {experiment.title}
                </option>
              ))}
            </select>
          </label>
          <Field defaultValue={decision.content} name="content" label="Reasoning (Markdown)" placeholder="Why this decision?" markdown textarea required />
        </EditorSection>
        <div className="form-actions">
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Updating..." : "Update decision"}
          </button>
        </div>
      </form>
      <MarkdownPreview title="Reasoning preview" value={decision.content} />
    </div>
  );
}

function DecisionList({
  decisions,
  ideas,
  disabled,
  onDeleteDecision,
  onOpenDecision,
  onTypeChange,
  selectedDecisionId
}: {
  decisions: DecisionLog[];
  ideas: Idea[];
  disabled?: boolean;
  onDeleteDecision?: (id: string) => void;
  onOpenDecision?: (id: string) => void;
  onTypeChange?: (id: string, decisionType: DecisionLog["decisionType"]) => void;
  selectedDecisionId?: string | null;
}) {
  const ideaById = new Map(ideas.map((idea) => [idea.id, idea.title]));

  return (
    <div className="list">
      {decisions.length === 0 && (
        <EmptyState
          description="No decision matches the current search. Try a broader query, or record the next research choice in the editor panel."
          title="No decisions in this view"
          tone="decision"
        />
      )}
      {decisions.map((decision) => (
        <article className={`row ${selectedDecisionId === decision.id ? "selected-row" : ""}`} data-kind="decision" key={decision.id}>
          <div className="row-heading">
            <h3>{decision.title}</h3>
            <span className="pill">{decision.decisionType}</span>
          </div>
          <p className="muted">{ideaById.get(decision.ideaId) ?? "Unlinked idea"}</p>
          <p>{decision.content}</p>
          <div className="tag-row">
            <span className="tag">{decision.createdAt}</span>
          </div>
          {(onTypeChange || onDeleteDecision) && (
            <div className="row-actions">
              {onTypeChange && (
                <label className="inline-control">
                  <span>Type</span>
                  <select
                    disabled={disabled}
                    onChange={(event) => onTypeChange(decision.id, event.target.value as DecisionLog["decisionType"])}
                    value={decision.decisionType}
                  >
                    {decisionTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                </label>
              )}
              {onOpenDecision && (
                <button className="secondary-button compact-button" onClick={() => onOpenDecision(decision.id)} type="button">
                  Open
                </button>
              )}
              <a className="secondary-button compact-button inline-link-button" href={`/decisions/${encodeURIComponent(decision.id)}`}>
                Page
              </a>
              {onDeleteDecision && (
                <button
                  className="danger-button"
                  disabled={disabled}
                  onClick={() => onDeleteDecision(decision.id)}
                  type="button"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}



export { CreateDecisionPanel, DecisionDetailPanel, DecisionList };
