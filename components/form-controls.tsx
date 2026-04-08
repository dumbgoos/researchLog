"use client";

import { useState } from "react";

function Field({
  name,
  label,
  placeholder,
  defaultValue,
  markdown,
  textarea,
  required
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  markdown?: boolean;
  textarea?: boolean;
  required?: boolean;
}) {
  if (textarea && markdown) {
    return (
      <MarkdownTextarea
        defaultValue={defaultValue}
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
  label,
  name,
  placeholder,
  required
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const insertSnippet = (snippet: string) => {
    setValue((current) => [current.trimEnd(), snippet].filter(Boolean).join("\n"));
  };

  return (
    <label className="field markdown-editor">
      <span>{label}</span>
      <div className="markdown-toolbar" aria-label={`${label} formatting`}>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("### Heading")} type="button">
          Heading
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("- Observation")} type="button">
          Bullet
        </button>
        <button className="secondary-button compact-button" onClick={() => insertSnippet("```bash\ncommand\n```")} type="button">
          Code
        </button>
      </div>
      <textarea
        name={name}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
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

function EditorSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="editor-section">
      <div className="editor-section-title">{title}</div>
      {children}
    </section>
  );
}


function MarkdownPreview({ title, value }: { title: string; value: string }) {
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

export { CheckboxGroup, EditorSection, Field, MarkdownPreview };
