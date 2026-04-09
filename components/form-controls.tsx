"use client";

import { useRef, useState } from "react";

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

function PopoutButton({ href, label = "Pop out" }: { href: string; label?: string }) {
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

function EditorSection({ children, description, title }: { children: React.ReactNode; description?: string; title: string }) {
  return (
    <section className="editor-section">
      <div className="editor-section-title">
        <span>{title}</span>
        {description && <p>{description}</p>}
      </div>
      {children}
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
      <h3>{title}</h3>
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

export { CheckboxGroup, ConfirmDeleteButton, EditorSection, EmptyState, Field, FormStatusNote, MarkdownPreview, PopoutButton, TextExcerpt };
