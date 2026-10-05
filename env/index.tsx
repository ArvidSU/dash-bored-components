import "./component.css";
// src/renderer/builtins/env/index.tsx
import { useCallback, useEffect, useId, useState } from "react";

// src/renderer/builtins/shared.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
function stringProp(props, names, fallback = "") {
  for (const name of names) {
    if (typeof props[name] === "string")
      return props[name];
  }
  return fallback;
}
function CapabilityGate({
  title,
  children
}) {
  return /* @__PURE__ */ jsxDEV("div", {
    className: "component-state component-state--locked",
    children: [
      /* @__PURE__ */ jsxDEV("span", {
        className: "component-state__icon",
        "aria-hidden": "true",
        children: "◇"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("strong", {
        children: title
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV("span", {
        children
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/shared/env.ts
var KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
function decodeDoubleQuoted(value) {
  return value.replace(/\\([\\"nrt$])/g, (_match, escaped) => {
    if (escaped === "n")
      return `
`;
    if (escaped === "r")
      return "\r";
    if (escaped === "t")
      return "\t";
    return escaped;
  });
}
function findUnquotedComment(value) {
  for (let index = 0;index < value.length; index += 1) {
    if (value[index] === "#" && (index === 0 || /\s/.test(value[index - 1] ?? "")))
      return index;
  }
  return -1;
}
function closingQuote(source) {
  for (let index = 1;index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
      continue;
    }
    if (source[index] === source[0])
      return index;
  }
  return -1;
}
function parseValue(source) {
  const afterEquals = source.match(/^[ \t]*/)?.[0] ?? "";
  const valueSource = source.slice(afterEquals.length);
  if (valueSource.startsWith('"')) {
    const closing = closingQuote(valueSource);
    if (closing > 0) {
      const remainder = valueSource.slice(closing + 1).trim();
      if (remainder && !remainder.startsWith("#"))
        return null;
      return {
        value: decodeDoubleQuoted(valueSource.slice(1, closing)),
        quote: "double",
        comment: remainder.startsWith("#") ? remainder : ""
      };
    }
  }
  if (valueSource.startsWith("'")) {
    const closing = closingQuote(valueSource);
    if (closing > 0) {
      const remainder = valueSource.slice(closing + 1).trim();
      if (remainder && !remainder.startsWith("#"))
        return null;
      return {
        value: valueSource.slice(1, closing).replaceAll("\\'", "'"),
        quote: "single",
        comment: remainder.startsWith("#") ? remainder : ""
      };
    }
  }
  if (valueSource.startsWith('"') || valueSource.startsWith("'"))
    return null;
  const commentIndex = findUnquotedComment(valueSource);
  const value = commentIndex === -1 ? valueSource.trimEnd() : valueSource.slice(0, commentIndex).trimEnd();
  return {
    value,
    quote: "none",
    comment: commentIndex === -1 ? "" : valueSource.slice(commentIndex).trim()
  };
}
function parseLine(source) {
  const trimmed = source.trim();
  if (trimmed === "")
    return { kind: "other", source, type: "blank" };
  if (trimmed.startsWith("#"))
    return { kind: "other", source, type: "comment" };
  const match = source.match(/^([ \t]*)(export[ \t]+)?([A-Za-z_][A-Za-z0-9_]*)([ \t]*)=([\s\S]*)$/);
  if (!match)
    return { kind: "other", source, type: "raw" };
  const [, leading, exportPrefix, key, beforeEquals, valueSource] = match;
  const parsed = parseValue(valueSource ?? "");
  if (!parsed)
    return { kind: "other", source, type: "raw" };
  return {
    kind: "entry",
    entry: {
      key: key ?? "",
      value: parsed.value,
      quote: parsed.quote,
      leading: leading ?? "",
      exportPrefix: exportPrefix ?? "",
      beforeEquals: beforeEquals ?? "",
      afterEquals: (valueSource ?? "").match(/^[ \t]*/)?.[0] ?? "",
      comment: parsed.comment
    }
  };
}
function parseEnv(source) {
  const lineEnding = source.includes(`\r
`) ? `\r
` : `
`;
  const normalized = source.replaceAll(`\r
`, `
`);
  const trailingNewline = normalized.endsWith(`
`);
  const rawLines = normalized.split(`
`);
  if (trailingNewline)
    rawLines.pop();
  const lines = [];
  for (let index = 0;normalized !== "" && index < rawLines.length; index += 1) {
    let sourceLine = rawLines[index];
    const value = sourceLine.match(/^[ \t]*(?:export[ \t]+)?[A-Za-z_][A-Za-z0-9_]*[ \t]*=[ \t]*([\s\S]*)$/)?.[1];
    if (value?.startsWith('"') || value?.startsWith("'")) {
      let quotedValue = value;
      while (closingQuote(quotedValue) < 0 && index + 1 < rawLines.length) {
        const continuation = rawLines[++index];
        sourceLine += `
${continuation}`;
        quotedValue += `
${continuation}`;
      }
    }
    const line = parseLine(sourceLine);
    lines.push(line.kind === "entry" ? { ...line, source: sourceLine, originalEntry: { ...line.entry } } : line);
  }
  return {
    lines,
    lineEnding,
    trailingNewline
  };
}
function formatValue(entry) {
  if (entry.quote === "single")
    return `'${entry.value.replaceAll("'", "\\'")}'`;
  if (entry.quote === "double") {
    return `"${entry.value.replaceAll("\\", "\\\\").replaceAll('"', "\\\"").replaceAll(`
`, "\\n").replaceAll("\r", "\\r").replaceAll("\t", "\\t")}"`;
  }
  if (entry.value === "")
    return "";
  if (/\s|#/.test(entry.value)) {
    return `"${entry.value.replaceAll("\\", "\\\\").replaceAll('"', "\\\"")}"`;
  }
  return entry.value;
}
function formatEnvEntry(entry) {
  const comment = entry.comment ? ` ${entry.comment}` : "";
  return `${entry.leading}${entry.exportPrefix}${entry.key}${entry.beforeEquals}=${entry.afterEquals}${formatValue(entry)}${comment}`;
}
function serializeEnv(document) {
  const source = document.lines.map((line) => line.kind === "entry" ? line.source !== undefined && JSON.stringify(line.entry) === JSON.stringify(line.originalEntry) ? line.source.replaceAll(`
`, document.lineEnding) : formatEnvEntry(line.entry) : line.source.replaceAll(`
`, document.lineEnding)).join(document.lineEnding);
  return document.trailingNewline && document.lines.length > 0 ? `${source}${document.lineEnding}` : source;
}
function envEntries(document) {
  return document.lines.flatMap((line, lineIndex) => line.kind === "entry" ? [{ lineIndex, entry: line.entry }] : []);
}
function invalidEnvLineCount(document) {
  return document.lines.filter((line) => line.kind === "other" && line.type === "raw").length;
}
function updateEnvEntry(document, lineIndex, patch) {
  const line = document.lines[lineIndex];
  if (!line || line.kind !== "entry")
    return document;
  const lines = [...document.lines];
  lines[lineIndex] = { ...line, entry: { ...line.entry, ...patch } };
  return { ...document, lines };
}
function appendEnvEntry(document) {
  return {
    ...document,
    lines: [
      ...document.lines,
      {
        kind: "entry",
        entry: {
          key: "DASH_BORED_AGENT",
          value: "",
          quote: "none",
          leading: "",
          exportPrefix: "",
          beforeEquals: "",
          afterEquals: "",
          comment: ""
        }
      }
    ],
    trailingNewline: document.lines.length > 0 ? document.trailingNewline : true
  };
}
function removeEnvEntry(document, lineIndex) {
  return { ...document, lines: document.lines.filter((_line, index) => index !== lineIndex) };
}
function isValidEnvKey(key) {
  return KEY_PATTERN.test(key);
}
// src/renderer/builtins/env/index.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function EnvEditor({ props, host: componentHost }) {
  const filesystem = componentHost.filesystem;
  const environment = componentHost.environment;
  const effectiveAgent = environment?.values.find((entry) => entry.key === "DASH_BORED_AGENT");
  const editorId = useId().replaceAll(":", "");
  const path = stringProp(props, ["path"]);
  const [document, setDocument] = useState(() => parseEnv(""));
  const [rawSource, setRawSource] = useState("");
  const [savedSource, setSavedSource] = useState("");
  const [mode, setMode] = useState("table");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (!filesystem || !path)
      return;
    setLoading(true);
    setError(null);
    filesystem.readText(path).then((source) => {
      if (cancelled)
        return;
      setDocument(parseEnv(source));
      setRawSource(source);
      setSavedSource(source);
      setMode("table");
    }).catch((cause) => {
      if (!cancelled)
        setError(cause instanceof Error ? cause.message : String(cause));
    }).finally(() => {
      if (!cancelled)
        setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [filesystem, path, refresh]);
  const tableSource = serializeEnv(document);
  const content = mode === "raw" ? rawSource : tableSource;
  const dirty = content !== savedSource;
  const rows = envEntries(document);
  const invalidKeys = rows.filter(({ entry }) => !isValidEnvKey(entry.key)).length;
  const invalidLines = invalidEnvLineCount(document);
  const switchMode = useCallback((nextMode) => {
    if (nextMode === mode)
      return;
    if (nextMode === "raw") {
      setRawSource(tableSource);
    } else {
      setDocument(parseEnv(rawSource));
    }
    setMode(nextMode);
    setError(null);
  }, [mode, tableSource, rawSource]);
  function updateEntry(lineIndex, field, value) {
    const nextDocument = updateEnvEntry(document, lineIndex, { [field]: value });
    setDocument(nextDocument);
    setRawSource(serializeEnv(nextDocument));
    setError(null);
  }
  function addEntry() {
    const nextDocument = appendEnvEntry(document);
    setDocument(nextDocument);
    setRawSource(serializeEnv(nextDocument));
    setError(null);
  }
  function deleteEntry(lineIndex) {
    const nextDocument = removeEnvEntry(document, lineIndex);
    setDocument(nextDocument);
    setRawSource(serializeEnv(nextDocument));
    setError(null);
  }
  const save = useCallback(async (reportFailure = false) => {
    if (!path || !dirty || invalidKeys > 0 || loading || saving)
      return;
    setSaving(true);
    setError(null);
    try {
      if (!filesystem?.writeText)
        throw new Error("This component does not have file-write access.");
      await filesystem.writeText(path, content);
      setSavedSource(content);
      if (mode === "table")
        setRawSource(content);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      if (reportFailure)
        throw cause;
    } finally {
      setSaving(false);
    }
  }, [path, dirty, invalidKeys, loading, saving, filesystem, content, mode]);
  useEffect(() => {
    const available = Boolean(filesystem?.writeText && path) && !loading && !saving;
    const reason = !filesystem?.writeText ? "Trust this project to read and write this file." : !path ? "Configure an environment file path." : "Environment editor is busy.";
    const unregister = [
      componentHost.actions.register({
        id: "refresh",
        label: "Reload environment file",
        enabled: available,
        disabledReason: reason,
        confirmation: dirty ? { title: "Discard environment edits and reload?" } : undefined,
        run: () => setRefresh((value) => value + 1)
      }),
      componentHost.actions.register({
        id: "save",
        label: "Save environment file",
        enabled: available && dirty && invalidKeys === 0,
        disabledReason: !available ? reason : invalidKeys > 0 ? "Fix invalid variable names first." : "No unsaved environment edits.",
        confirmation: { title: "Save environment file?", message: `Write edits to ${path}.` },
        run: () => save(true)
      }),
      ...["raw", "table"].map((nextMode) => componentHost.actions.register({
        id: nextMode,
        label: nextMode === "raw" ? "Show raw environment" : "Show environment variables",
        enabled: available && mode !== nextMode,
        disabledReason: !available ? reason : "This view is already selected.",
        run: () => switchMode(nextMode)
      }))
    ];
    return () => unregister.forEach((remove) => remove());
  }, [componentHost.actions, filesystem, path, loading, saving, dirty, invalidKeys, mode, content, tableSource, rawSource, save, switchMode]);
  if (!filesystem?.writeText) {
    return /* @__PURE__ */ jsxDEV2(CapabilityGate, {
      title: "Environment editor",
      children: "Trust this project to read and write the configured environment file."
    }, undefined, false, undefined, this);
  }
  if (!path) {
    return /* @__PURE__ */ jsxDEV2("div", {
      className: "component-state component-state--error",
      role: "alert",
      children: "Configure a relative environment file path first."
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV2("section", {
    className: "env-editor",
    "aria-label": `Environment editor for ${path}`,
    children: [
      /* @__PURE__ */ jsxDEV2("header", {
        className: "env-editor__header",
        children: [
          /* @__PURE__ */ jsxDEV2("div", {
            className: "env-editor__title",
            children: [
              /* @__PURE__ */ jsxDEV2("span", {
                className: "env-editor__glyph",
                "aria-hidden": "true",
                children: `{ }`
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("div", {
                children: [
                  /* @__PURE__ */ jsxDEV2("strong", {
                    children: "Environment variables"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV2("code", {
                    title: path,
                    children: path
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("div", {
            className: "env-editor__actions",
            children: [
              /* @__PURE__ */ jsxDEV2("div", {
                className: "env-editor__mode",
                role: "group",
                "aria-label": "Editor mode",
                children: [
                  /* @__PURE__ */ jsxDEV2("button", {
                    className: mode === "table" ? "env-editor__mode-button env-editor__mode-button--active" : "env-editor__mode-button",
                    type: "button",
                    "aria-pressed": mode === "table",
                    onClick: () => switchMode("table"),
                    children: "Key-value"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV2("button", {
                    className: mode === "raw" ? "env-editor__mode-button env-editor__mode-button--active" : "env-editor__mode-button",
                    type: "button",
                    "aria-pressed": mode === "raw",
                    onClick: () => switchMode("raw"),
                    children: "Bulk / raw"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV2("button", {
                className: "button button--quiet",
                type: "button",
                disabled: loading || saving,
                onClick: () => setRefresh((value) => value + 1),
                children: loading ? "Reading…" : "Reload"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("button", {
                className: "button button--primary",
                type: "button",
                disabled: loading || saving || !dirty || invalidKeys > 0,
                onClick: () => void save(),
                children: saving ? "Saving…" : dirty ? "Save changes" : "Saved"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      effectiveAgent ? /* @__PURE__ */ jsxDEV2("div", {
        className: "env-editor__effective",
        "aria-label": "Effective command environment",
        children: [
          /* @__PURE__ */ jsxDEV2("strong", {
            children: "Agent command"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("code", {
            children: effectiveAgent.value.trim() || "Not configured"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("span", {
            children: [
              "Source: ",
              { app: "Settings", process: "App process environment", bundle: "Bundle .env", component: "Component environment", unset: "None" }[effectiveAgent.source]
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2("p", {
            children: effectiveAgent.source === "app" ? "Change the app-wide command in Settings → General, or leave it empty and save to use this bundle's .env value. While set, it overrides this bundle's .env value." : effectiveAgent.value.trim() ? effectiveAgent.source === "bundle" ? "The app-wide setting is clear, so this bundle's .env value is active." : "Settings → General can set an app-wide agent command." : "Set an app-wide command in Settings → General or declare DASH_BORED_AGENT in this bundle's .env."
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("p", {
            children: "Saved values apply to new commands. Restart an open terminal to use them."
          }, undefined, false, undefined, this),
          environment?.error ? /* @__PURE__ */ jsxDEV2("p", {
            role: "alert",
            children: environment.error
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this) : null,
      error ? /* @__PURE__ */ jsxDEV2("div", {
        className: "component-state component-state--error",
        role: "alert",
        children: error
      }, undefined, false, undefined, this) : null,
      mode === "raw" ? /* @__PURE__ */ jsxDEV2("div", {
        className: "env-editor__raw-wrap",
        children: [
          /* @__PURE__ */ jsxDEV2("label", {
            className: "visually-hidden",
            htmlFor: `${editorId}-env-raw`,
            children: "Raw environment file"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("textarea", {
            id: `${editorId}-env-raw`,
            className: "env-editor__raw",
            value: rawSource,
            onChange: (event) => {
              setRawSource(event.target.value);
              setError(null);
            },
            spellCheck: false
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2("p", {
            className: "env-editor__hint",
            children: "Paste or edit the complete file, then save when ready."
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV2("div", {
        className: "env-editor__table-wrap",
        children: [
          invalidLines > 0 ? /* @__PURE__ */ jsxDEV2("p", {
            className: "env-editor__notice",
            children: [
              invalidLines,
              " unrecognized ",
              invalidLines === 1 ? "line is" : "lines are",
              " preserved below in the raw file."
            ]
          }, undefined, true, undefined, this) : null,
          invalidKeys > 0 ? /* @__PURE__ */ jsxDEV2("p", {
            className: "env-editor__error",
            role: "alert",
            children: "Use letters, numbers, and underscores for variable names; names must not start with a number."
          }, undefined, false, undefined, this) : null,
          rows.length > 0 ? /* @__PURE__ */ jsxDEV2("table", {
            className: "env-editor__table",
            children: [
              /* @__PURE__ */ jsxDEV2("thead", {
                children: /* @__PURE__ */ jsxDEV2("tr", {
                  children: [
                    /* @__PURE__ */ jsxDEV2("th", {
                      scope: "col",
                      children: "Key"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV2("th", {
                      scope: "col",
                      children: "Value"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsxDEV2("th", {
                      scope: "col",
                      children: /* @__PURE__ */ jsxDEV2("span", {
                        className: "visually-hidden",
                        children: "Actions"
                      }, undefined, false, undefined, this)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("tbody", {
                children: rows.map(({ lineIndex, entry }) => {
                  const validKey = isValidEnvKey(entry.key);
                  return /* @__PURE__ */ jsxDEV2("tr", {
                    children: [
                      /* @__PURE__ */ jsxDEV2("td", {
                        children: /* @__PURE__ */ jsxDEV2("input", {
                          className: validKey ? "env-editor__input env-editor__key" : "env-editor__input env-editor__key env-editor__input--invalid",
                          "aria-label": `Variable name ${lineIndex + 1}`,
                          "aria-invalid": !validKey,
                          value: entry.key,
                          onChange: (event) => updateEntry(lineIndex, "key", event.target.value),
                          spellCheck: false
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("td", {
                        children: /* @__PURE__ */ jsxDEV2("input", {
                          className: "env-editor__input",
                          "aria-label": `Variable value for ${entry.key || "unnamed variable"}`,
                          value: entry.value,
                          onChange: (event) => updateEntry(lineIndex, "value", event.target.value),
                          spellCheck: false
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV2("td", {
                        children: /* @__PURE__ */ jsxDEV2("button", {
                          className: "env-editor__delete",
                          type: "button",
                          onClick: () => deleteEntry(lineIndex),
                          "aria-label": `Remove ${entry.key || "unnamed variable"}`,
                          children: "Remove"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, lineIndex, true, undefined, this);
                })
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV2("div", {
            className: "env-editor__empty",
            children: [
              /* @__PURE__ */ jsxDEV2("strong", {
                children: "No variables yet"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("span", {
                children: "Add the first key-value pair or switch to raw mode to paste a complete file."
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("button", {
                className: "button button--primary",
                type: "button",
                onClick: addEntry,
                children: "+ Add first variable"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          rows.length > 0 ? /* @__PURE__ */ jsxDEV2("button", {
            className: "button button--quiet env-editor__add",
            type: "button",
            onClick: addEntry,
            children: "+ Add variable"
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
export {
  EnvEditor as default
};
