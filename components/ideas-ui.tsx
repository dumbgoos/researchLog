"use client";

import type { FormEvent } from "react";
import { ideaStatuses } from "@/lib/constants";
import type { Idea, IdeaStatus } from "@/lib/types";
import { ConfirmDeleteButton, EditorSection, EmptyState, Field, FormStatusNote, PopoutButton, TextExcerpt } from "@/components/form-controls";

function CreateIdeaPanel({
  disabled,
  onSubmit,
  statusMessage
}: {
  disabled: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  statusMessage?: string;
}) {
  return (
    <div className="card editor-card" data-kind="idea">
      <div className="card-title">
        <div>
          <h2>Create Idea</h2>
          <p className="microcopy">Capture the claim first. Organization can stay light until the idea earns attention.</p>
        </div>
      </div>
      <form className="form editor-form" onSubmit={onSubmit}>
        <EditorSection title="Seed" description="The smallest useful version of the idea.">
          <Field name="title" label="Title" placeholder="e.g. Graph-guided experiment recall" required />
          <Field
            name="summary"
            label="Summary"
            placeholder="What is the research direction?"
            hint="One or two sentences is enough."
            textarea
            required
          />
        </EditorSection>
        <EditorSection title="Claim" description="Make the uncertainty explicit before experiments begin.">
          <Field name="motivation" label="Motivation" placeholder="Why is this worth pursuing?" textarea />
          <Field name="hypothesis" label="Hypothesis" placeholder="What do you believe might be true?" textarea />
          <Field name="novelty" label="Novelty" placeholder="What is new or different?" textarea />
        </EditorSection>
        <EditorSection title="Organize" description="Lightweight routing for future retrieval.">
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue="Inbox">
              {ideaStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <Field name="tags" label="Tags" placeholder="llm, graph, reproducibility" />
          <Field name="relatedPapers" label="Related papers" placeholder="One paper or URL per line" textarea />
        </EditorSection>
        <div className="form-actions">
          {statusMessage && <FormStatusNote tone="success">{statusMessage}</FormStatusNote>}
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Saving..." : "Save idea"}
          </button>
        </div>
      </form>
    </div>
  );
}

function IdeaDetailPanel({
  disabled,
  idea,
  onClose,
  onSubmit,
  statusMessage
}: {
  disabled: boolean;
  idea: Idea;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>, id: string) => void;
  statusMessage?: string;
}) {
  return (
    <div className="card detail-card editor-card" data-kind="idea">
      <div className="card-title">
        <div>
          <h2>Idea Detail</h2>
          <p className="microcopy">Last updated {idea.updatedAt}</p>
        </div>
        <button className="secondary-button compact-button" onClick={onClose} type="button">
          Close
        </button>
        <PopoutButton href={`/ideas/${encodeURIComponent(idea.id)}?mode=edit&popout=1`} />
      </div>
      <form className="form editor-form" key={idea.id} onSubmit={(event) => onSubmit(event, idea.id)}>
        <EditorSection title="Context" description="Keep the idea readable on its own.">
          <Field defaultValue={idea.title} name="title" label="Title" placeholder="Idea title" required />
          <Field defaultValue={idea.summary} name="summary" label="Summary" placeholder="Short research summary" textarea required />
          <Field defaultValue={idea.motivation} name="motivation" label="Motivation" placeholder="Why this matters" textarea />
        </EditorSection>
        <EditorSection title="Research claim" description="What should later experiments prove or disprove?">
          <Field defaultValue={idea.hypothesis} name="hypothesis" label="Hypothesis" placeholder="Research hypothesis" textarea />
          <Field defaultValue={idea.novelty} name="novelty" label="Novelty" placeholder="Novelty points" textarea />
        </EditorSection>
        <EditorSection title="Organization" description="Status, priority, and retrieval hooks.">
          <div className="form-pair">
            <label className="field">
              <span>Status</span>
              <select name="status" defaultValue={idea.status}>
                {ideaStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Priority</span>
              <select name="priority" defaultValue={idea.priority}>
                {["Low", "Medium", "High"].map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </label>
          </div>
          <Field defaultValue={idea.tags.join(", ")} name="tags" label="Tags" placeholder="llm, graph, reproducibility" />
          <Field
            defaultValue={idea.relatedPapers.join("\n")}
            name="relatedPapers"
            label="Related papers"
            placeholder="One paper or URL per line"
            textarea
          />
        </EditorSection>
        <div className="form-actions">
          {statusMessage && <FormStatusNote tone="success">{statusMessage}</FormStatusNote>}
          <button className="button" disabled={disabled} type="submit">
            {disabled ? "Updating..." : "Update idea"}
          </button>
        </div>
      </form>
    </div>
  );
}


function IdeaList({
  ideas,
  experimentCounts,
  disabled,
  onDeleteIdea,
  onOpenIdea,
  onStatusChange,
  selectedIdeaId
}: {
  ideas: Idea[];
  experimentCounts: Record<string, number>;
  disabled?: boolean;
  onDeleteIdea?: (id: string) => void;
  onOpenIdea?: (id: string) => void;
  onStatusChange?: (id: string, status: IdeaStatus) => void;
  selectedIdeaId?: string | null;
}) {
  return (
    <div className="list">
      {ideas.length === 0 && (
        <EmptyState
          description="No idea matches the current search or status filter. Broaden the view, or capture a fresh idea in the panel on the right."
          title="No ideas in this view"
          tone="idea"
        />
      )}
      {ideas.map((idea) => (
        <article className={`row ${selectedIdeaId === idea.id ? "selected-row" : ""}`} data-kind="idea" key={idea.id}>
          <div className="row-heading">
            <h3>{idea.title}</h3>
            <span className="pill">{idea.status}</span>
          </div>
          <TextExcerpt text={idea.summary} tone="muted" />
          <TextExcerpt text={idea.hypothesis} />
          <div className="tag-row">
            <span className="tag">{experimentCounts[idea.id] ?? 0} experiments</span>
            <span className="tag">{idea.priority} priority</span>
            {idea.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          {(onStatusChange || onDeleteIdea) && (
            <div className="row-actions">
              {onStatusChange && (
                <label className="inline-control">
                  <span>Status</span>
                  <select
                    disabled={disabled}
                    onChange={(event) => onStatusChange(idea.id, event.target.value as IdeaStatus)}
                    value={idea.status}
                  >
                    {ideaStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              )}
              {onOpenIdea && (
                <button className="secondary-button compact-button" onClick={() => onOpenIdea(idea.id)} type="button">
                  Open
                </button>
              )}
              <a className="secondary-button compact-button inline-link-button" href={`/ideas/${encodeURIComponent(idea.id)}`}>
                Page
              </a>
              {onDeleteIdea && (
                <ConfirmDeleteButton disabled={disabled} onConfirm={() => onDeleteIdea(idea.id)} />
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}


export { CreateIdeaPanel, IdeaDetailPanel, IdeaList };
