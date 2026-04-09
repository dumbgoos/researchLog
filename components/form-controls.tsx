"use client";

import { useRef, useState, type ChangeEvent } from "react";
import type { ExperimentResultArtifact } from "@/lib/types";

function ConfirmDeleteButton({
  disabled,
  label = "Delete",
  onConfirm
}: {
  disabled?: boolean;
  label?: string;
  onConfirm: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <span className="confirm-action" role="group" aria-label="Confirm delete">
        <span>Delete?</span>
        <button className="danger-button compact-button" disabled={disabled} onClick={onConfirm} type="button">
          Confirm
        </button>
        <button className="secondary-button compact-button" disabled={disabled} onClick={() => setIsConfirming(false)} type="button">
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button className="danger-button" disabled={disabled} onClick={() => setIsConfirming(true)} type="button">
      {label}
    </button>
  );
}

function FormStatusNote({
  tone = "neutral",
  children
}: {
  tone?: "neutral" | "success";
  children: React.ReactNode;
}) {
  return <span className={`form-status-note ${tone === "success" ? "is-success" : ""}`}>{children}</span>;
}

function PopoutButton({ href, label = "Pop" }: { href: string; label?: string }) {
  return (
    <button
      className="secondary-button compact-button"
      onClick={() => {
        const popup = window.open(
          href,
          "_blank",
          "popup=yes,width=640,height=860,left=120,top=120,resizable=yes,scrollbars=yes"
        );
        popup?.focus();
      }}
      type="button"
    >
      {label}
    </button>
  );
}

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  hint,
  markdown,
  textarea,
  required
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  hint?: string;
  markdown?: boolean;
  textarea?: boolean;
  required?: boolean;
}) {
  if (textarea && markdown) {
    return (
      <MarkdownTextarea
        defaultValue={defaultValue}
        hint={hint}
        label={label}
        name={name}
        placeholder={placeholder}
        required={required}
      />
    );
  }

  return (
    <label className="field">
      <span>{label}</span>
      {hint && <small>{hint}</small>}
      {textarea ? (
        <textarea defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} />
      ) : (
        <input defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} />
      )}
    </label>
  );
}

function MarkdownTextarea({
  defaultValue,
  hint,
  label,
  name,
  placeholder,
  required
}: {
  defaultValue?: string;
  hint?: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [viewMode, setViewMode] = useState<"write" | "preview" | "split">("write");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const insertSnippet = (before: string, after = "", fallback = "") => {
    const textarea = textareaRef.current;

    if (!textarea) {
      setValue((current) => [current.trimEnd(), [before, fallback, after].join("")].filter(Boolean).join("\n"));
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const insertion = `${before}${selected || fallback}${after}`;
    const nextValue = `${value.slice(0, start)}${insertion}${value.slice(end)}`;

    setValue(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = start + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    });
  };
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  const charCount = value.length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 180) || 1);
  const isPreviewVisible = viewMode === "preview" || viewMode === "split";
  const isWriteVisible = viewMode === "write" || viewMode === "split";

  return (
    <label className="field markdown-editor">
      <span>{label}</span>
      {hint && <small>{hint}</small>}
      <div className="markdown-toolbar" aria-label={`${label} formatting`}>
        <div className="markdown-view-toggle" role="tablist" aria-label={`${label} editor mode`}>
          <button
            className={`secondary-button compact-button ${viewMode === "write" ? "is-active" : ""}`}
            onClick={() => setViewMode("write")}
            role="tab"
            type="button"
          >
            Write
          </button>
          <button
            className={`secondary-button compact-button ${viewMode === "preview" ? "is-active" : ""}`}
            onClick={() => setViewMode("preview")}
            role="tab"
            type="button"
          >
            Preview
          </button>
          <button
            className={`secondary-button compact-button ${viewMode === "split" ? "is-active" : ""}`}
            onClick={() => setViewMode("split")}
            role="tab"
            type="button"
          >
            Split
          </button>
        </div>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("### ", "", "Heading")} type="button">
          Heading
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("- ", "", "Observation")} type="button">
          Bullet
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("**", "**", "Key point")} type="button">
          Bold
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("> ", "", "Interpretation")} type="button">
          Quote
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("- [ ] ", "", "Next step")} type="button">
          Checklist
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("[", "](https://example.com)", "Reference")} type="button">
          Link
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("```bash\n", "\n```", "command")} type="button">
          Code
        </button>
        <span className="markdown-counter">{wordCount} words</span>
        <span className="markdown-counter">{charCount} chars</span>
        <span className="markdown-counter">{readingMinutes} min read</span>
      </div>
      <div className={`markdown-workspace markdown-workspace-${viewMode}`}>
        {isWriteVisible && (
          <div className="markdown-pane markdown-pane-write">
            <div className="markdown-pane-header">
              <strong>Writing</strong>
              <span>Ctrl/Command + Enter saves</span>
            </div>
            <textarea
              aria-describedby={`${name}-shortcut`}
              name={name}
              onChange={(event) => setValue(event.target.value)}
              placeholder={placeholder}
              ref={textareaRef}
              required={required}
              value={value}
            />
          </div>
        )}
        {isPreviewVisible && (
          <div className="markdown-pane markdown-pane-preview">
            <div className="markdown-pane-header">
              <strong>Preview</strong>
              <span>Rendered from current draft</span>
            </div>
            <div className="markdown-live-preview">
              <MarkdownPreview title="Preview" value={value} />
              {!value.trim() && <p className="microcopy">Start writing to preview headings, bullets, quotes, and code blocks.</p>}
            </div>
          </div>
        )}
      </div>
      <small id={`${name}-shortcut`}>Ctrl/Command + Enter saves the active form.</small>
    </label>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  values
}: {
  label: string;
  name: string;
  options: { label: string; value: string }[];
  values: string[];
}) {
  return (
    <fieldset className="checkbox-group">
      <legend>{label}</legend>
      {options.length === 0 && <p className="microcopy">No vault assets available.</p>}
      {options.map((option) => (
        <label className="checkbox-option" key={option.value}>
          <input defaultChecked={values.includes(option.value)} name={name} type="checkbox" value={option.value} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function EmptyState({
  actionLabel,
  description,
  onAction,
  title,
  tone = "neutral"
}: {
  actionLabel?: string;
  description: string;
  onAction?: () => void;
  title: string;
  tone?: "neutral" | "idea" | "experiment" | "decision" | "vault" | "map";
}) {
  return (
    <div className="empty-state empty-state-panel" data-tone={tone}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {actionLabel && onAction && (
        <button className="secondary-button compact-button" onClick={onAction} type="button">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function TextExcerpt({ text, tone = "body" }: { text: string; tone?: "body" | "muted" }) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const excerpt = normalized.length > 190 ? `${normalized.slice(0, 187)}...` : normalized;

  if (!excerpt) {
    return null;
  }

  return <p className={`text-excerpt ${tone === "muted" ? "muted" : ""}`}>{excerpt}</p>;
}

function EditorSection({
  children,
  collapsible = false,
  defaultOpen = true,
  description,
  title
}: {
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  description?: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className={`editor-section ${collapsible ? "is-collapsible" : ""} ${isOpen ? "is-open" : "is-closed"}`}>
      <div className="editor-section-title">
        <div>
          <span>{title}</span>
          {description && <p>{description}</p>}
        </div>
        {collapsible && (
          <button
            aria-expanded={isOpen}
            className="secondary-button compact-button editor-section-toggle"
            onClick={() => setIsOpen((current) => !current)}
            type="button"
          >
            {isOpen ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
      {isOpen && <div className="editor-section-body">{children}</div>}
    </section>
  );
}

function ResultArtifactsField({
  defaultValue,
  name = "resultArtifactsJson"
}: {
  defaultValue?: ExperimentResultArtifact[];
  name?: string;
}) {
  const [artifacts, setArtifacts] = useState<ExperimentResultArtifact[]>(defaultValue ?? []);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const uploaded = await Promise.all(files.map(readArtifactFile));
    setArtifacts((current) => [...current, ...uploaded.filter((artifact): artifact is ExperimentResultArtifact => Boolean(artifact))]);
    event.target.value = "";
  }

  function updateArtifact(id: string, patch: Partial<ExperimentResultArtifact>) {
    setArtifacts((current) => current.map((artifact) => (artifact.id === id ? { ...artifact, ...patch } : artifact)));
  }

  return (
    <section className="result-artifacts-field">
      <input name={name} type="hidden" value={JSON.stringify(artifacts)} />
      <div className="editor-section-title">
        <div>
          <span>Result attachments</span>
          <p>Keep markdown notes, figures, and tables close to the experiment result.</p>
        </div>
        <button
          className="secondary-button compact-button"
          onClick={() =>
            setArtifacts((current) => [
              ...current,
              {
                id: `artifact-${crypto.randomUUID()}`,
                title: `Result note ${current.length + 1}`,
                kind: "markdown",
                content: "### Result note\n- what changed\n- what to keep"
              }
            ])
          }
          type="button"
        >
          Add note
        </button>
      </div>
      <label className="field">
        <span>Upload result files</span>
        <small>Supported: Markdown, text, CSV, TSV, and images.</small>
        <input accept=".md,.markdown,.txt,.csv,.tsv,image/*" multiple onChange={handleFileUpload} type="file" />
      </label>
      {artifacts.length === 0 ? (
        <p className="empty-state">No result attachments yet. Add a markdown note or upload an image/table.</p>
      ) : (
        <div className="result-artifact-list">
          {artifacts.map((artifact) => (
            <article className="result-artifact-card" key={artifact.id}>
              <div className="card-title compact-card-title">
                <div>
                  <h3>{artifact.title}</h3>
                  <p className="microcopy">{artifact.fileName ?? artifact.kind}</p>
                </div>
                <button
                  className="danger-button compact-button"
                  onClick={() => setArtifacts((current) => current.filter((item) => item.id !== artifact.id))}
                  type="button"
                >
                  Remove
                </button>
              </div>
              <div className="form-pair">
                <label className="field">
                  <span>Artifact title</span>
                  <input onChange={(event) => updateArtifact(artifact.id, { title: event.target.value })} value={artifact.title} />
                </label>
                <label className="field">
                  <span>Kind</span>
                  <select onChange={(event) => updateArtifact(artifact.id, { kind: event.target.value as ExperimentResultArtifact["kind"] })} value={artifact.kind}>
                    <option value="markdown">Markdown</option>
                    <option value="image">Image</option>
                    <option value="table">Table</option>
                  </select>
                </label>
              </div>
              {artifact.kind === "image" ? (
                <div className="result-image-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={artifact.title} src={artifact.content} />
                </div>
              ) : (
                <label className="field">
                  <span>{artifact.kind === "table" ? "Table content" : "Markdown content"}</span>
                  <textarea onChange={(event) => updateArtifact(artifact.id, { content: event.target.value })} value={artifact.content} />
                </label>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}


function MarkdownPreview({ title, value }: { title?: string; value: string }) {
  const blocks = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="markdown-preview">
      {title && <h3>{title}</h3>}
      {blocks.map((line, index) => {
        if (line.startsWith("### ")) {
          return <h4 key={index}>{line.slice(4)}</h4>;
        }

        if (line.startsWith("## ")) {
          return <h4 key={index}>{line.slice(3)}</h4>;
        }

        if (line.startsWith("# ")) {
          return <h4 key={index}>{line.slice(2)}</h4>;
        }

        if (line.startsWith("- ")) {
          return <p className="preview-bullet" key={index}>{line.slice(2)}</p>;
        }

        return <p key={index}>{line}</p>;
      })}
    </div>
  );
}

function ExperimentResultArtifactsPreview({ artifacts }: { artifacts: ExperimentResultArtifact[] }) {
  if (artifacts.length === 0) {
    return null;
  }

  return (
    <div className="result-artifact-preview-list">
      {artifacts.map((artifact) => (
        <section className="markdown-preview result-artifact-preview" key={artifact.id}>
          <h3>{artifact.title}</h3>
          {artifact.kind === "image" ? (
            <div className="result-image-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={artifact.title} src={artifact.content} />
            </div>
          ) : artifact.kind === "table" ? (
            <TableArtifactPreview content={artifact.content} />
          ) : (
            <MarkdownPreview value={artifact.content} />
          )}
        </section>
      ))}
    </div>
  );
}

function TableArtifactPreview({ content }: { content: string }) {
  const rows = content
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => row.split(row.includes("\t") ? "\t" : ","));

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="table-artifact-wrap">
      <table className="artifact-table">
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("|")}`}>
              {row.map((cell, cellIndex) =>
                rowIndex === 0 ? <th key={`${rowIndex}-${cellIndex}`}>{cell}</th> : <td key={`${rowIndex}-${cellIndex}`}>{cell}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function readArtifactFile(file: File): Promise<ExperimentResultArtifact | null> {
  const content = await readFileContent(file);

  if (!content) {
    return null;
  }

  const lowerName = file.name.toLowerCase();
  const kind: ExperimentResultArtifact["kind"] = file.type.startsWith("image/")
    ? "image"
    : lowerName.endsWith(".csv") || lowerName.endsWith(".tsv")
      ? "table"
      : "markdown";

  return {
    id: `artifact-${crypto.randomUUID()}`,
    title: file.name.replace(/\.[^.]+$/, ""),
    kind,
    content,
    fileName: file.name,
    mimeType: file.type || undefined
  };
}

function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result ?? ""));

    if (file.type.startsWith("image/")) {
      reader.readAsDataURL(file);
      return;
    }

    reader.readAsText(file);
  });
}

export {
  CheckboxGroup,
  ConfirmDeleteButton,
  EditorSection,
  EmptyState,
  ExperimentResultArtifactsPreview,
  Field,
  FormStatusNote,
  MarkdownPreview,
  PopoutButton,
  ResultArtifactsField,
  TextExcerpt
};
