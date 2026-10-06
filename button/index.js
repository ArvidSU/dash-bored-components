import "./component.css";
// src/renderer/builtins/button/index.tsx
import { useId } from "react";

// src/shared/action-invocation.ts
function actionInvocation(value) {
  if (typeof value === "string")
    return { run: value, with: {} };
  if (!value || typeof value !== "object" || Array.isArray(value))
    return;
  const invocation = value;
  if (typeof invocation.run !== "string" || !invocation.run.trim())
    return;
  if (invocation.with !== undefined && (!invocation.with || typeof invocation.with !== "object" || Array.isArray(invocation.with)))
    return;
  return { run: invocation.run, with: invocation.with ?? {} };
}

// src/shared/process-state.ts
function processRun(snapshot) {
  if (snapshot === undefined)
    return;
  const run = normalizedRun(snapshot.run);
  if (run !== undefined)
    return run;
  if (snapshot.interactive === true)
    return;
  return normalizedRun(snapshot);
}
function normalizedRun(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return;
  const record = value;
  const phase = record.phase;
  if (phase !== "running" && phase !== "stopping" && phase !== "exited" && phase !== "failed")
    return;
  return {
    phase,
    exitCode: typeof record.exitCode === "number" ? record.exitCode : null,
    signal: typeof record.signal === "string" ? record.signal : null,
    startedAt: typeof record.startedAt === "string" ? record.startedAt : "",
    ...typeof record.durationMs === "number" ? { durationMs: record.durationMs } : {}
  };
}
function isProcessRunActive(snapshot) {
  const phase = processRun(snapshot)?.phase;
  return phase === "running" || phase === "stopping";
}

// src/renderer/lib/state-visual.tsx
import { jsxDEV, Fragment } from "react/jsx-dev-runtime";
var CLOSED_STATES = new Set(["done", "completed", "closed"]);
var POSITIVE_STATES = new Set(["ok", "online", "healthy", "success", "passed", "ready", ...CLOSED_STATES]);
var WARNING_STATES = new Set(["warn", "warning", "pending", "starting", "running", "stopping", "blocked", "degraded", "stale"]);
var NEGATIVE_STATES = new Set(["error", "failed", "failing", "offline", "down", "bug", "broken"]);
function actionVerb(reference) {
  if (reference.startsWith("process:"))
    return "process";
  if (reference.startsWith("agent:"))
    return "agent";
  if (reference.startsWith("select:") || reference.startsWith("reveal:") || reference.startsWith("focus:"))
    return "navigate";
  if (reference.endsWith(":refresh"))
    return "refresh";
  return "action";
}
function ActionGlyph({ reference }) {
  const verb = actionVerb(reference);
  return /* @__PURE__ */ jsxDEV("svg", {
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: verb === "process" ? /* @__PURE__ */ jsxDEV("path", {
      d: "m7 4 9 6-9 6Z"
    }, undefined, false, undefined, this) : verb === "agent" ? /* @__PURE__ */ jsxDEV("path", {
      d: "m10 2 2.3 5.7L18 10l-5.7 2.3L10 18l-2.3-5.7L2 10l5.7-2.3Z"
    }, undefined, false, undefined, this) : verb === "navigate" ? /* @__PURE__ */ jsxDEV("path", {
      d: "M3 10h13m-5-5 5 5-5 5"
    }, undefined, false, undefined, this) : verb === "refresh" ? /* @__PURE__ */ jsxDEV(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV("path", {
          d: "M16 10a6 6 0 1 1-1.8-4.3"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("path", {
          d: "M16 3v4h-4"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV("circle", {
          cx: "10",
          cy: "10",
          r: "6.5"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("circle", {
          cx: "10",
          cy: "10",
          r: "1.8",
          fill: "currentColor"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}

// src/renderer/builtins/button/index.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function itemsFromProps(props) {
  if (Array.isArray(props.items)) {
    return props.items.filter((item) => Boolean(item && typeof item === "object" && typeof item.name === "string"));
  }
  if (typeof props.name === "string")
    return [{ name: props.name, action: props.action }];
  return [];
}
function selectionContainer(reference) {
  const match = /^select:([^/]+)\//.exec(reference);
  return match?.[1];
}
function ActionButton({ props, host }) {
  const items = itemsFromProps(props);
  const requestedVariant = props.variant;
  const variant = requestedVariant === "segmented" || requestedVariant === "tabs" ? requestedVariant : "buttons";
  const resolved = items.map((item) => {
    const invocation = actionInvocation(item.action);
    const reference = invocation?.run ?? "";
    const action = host.actions.resolve(reference, item.name);
    return { item, invocation, reference, action };
  });
  const selectedContainers = resolved.map(({ reference }) => selectionContainer(reference));
  const tablist = variant === "tabs" && resolved.length > 0 && selectedContainers[0] !== undefined && selectedContainers.every((container) => container === selectedContainers[0]);
  const id = useId().replaceAll(":", "");
  function selectWithKeyboard(event, index) {
    if (!tablist)
      return;
    let next;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (index + 1) % resolved.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + resolved.length) % resolved.length;
    else if (event.key === "Home")
      next = 0;
    else if (event.key === "End")
      next = resolved.length - 1;
    if (next === undefined)
      return;
    event.preventDefault();
    const item = resolved[next];
    if (!item)
      return;
    if (!item.action.active)
      host.actions.invoke(item.reference, item.invocation?.with, undefined, item.item.name);
    document.getElementById(`${id}-item-${next}`)?.focus();
  }
  if (resolved.length === 0)
    return /* @__PURE__ */ jsxDEV2("div", {
      className: "component-state",
      children: "This action bar has no actions."
    }, undefined, false, undefined, this);
  return /* @__PURE__ */ jsxDEV2("div", {
    className: `action-button${resolved.length > 1 ? " action-button--group" : ""}${variant !== "buttons" ? ` action-button--${variant}` : ""}`,
    role: tablist ? "tablist" : undefined,
    "aria-label": tablist && typeof props.label === "string" ? props.label : undefined,
    children: resolved.map(({ item, invocation, reference, action }, index) => {
      const running = action.running || isProcessRunActive(action.process);
      const disabledReason = running ? `${action.label} is already running.` : action.enabled ? undefined : action.disabledReason ?? "This action is unavailable.";
      const disabled = disabledReason !== undefined && !(tablist && action.active);
      const itemId = `${id}-item-${index}`;
      return /* @__PURE__ */ jsxDEV2("div", {
        className: "action-button__item",
        children: [
          /* @__PURE__ */ jsxDEV2("button", {
            id: itemId,
            className: "action-button__control",
            type: "button",
            disabled,
            role: tablist ? "tab" : undefined,
            "aria-selected": tablist ? action.active : undefined,
            "aria-current": !tablist && action.active ? "page" : undefined,
            "aria-pressed": !tablist ? action.active : undefined,
            tabIndex: tablist ? action.active || !resolved.some(({ action: candidate }) => candidate.active) && index === 0 ? 0 : -1 : undefined,
            "aria-describedby": disabledReason && disabled ? `${itemId}-reason` : undefined,
            title: disabledReason,
            "data-active": action.active || undefined,
            "data-running": running || undefined,
            onClick: () => {
              if (!action.active || !tablist) {
                host.actions.invoke(reference, invocation?.with, undefined, item.name);
              }
            },
            onKeyDown: (event) => selectWithKeyboard(event, index),
            children: [
              variant === "buttons" ? /* @__PURE__ */ jsxDEV2("span", {
                className: "action-button__icon",
                "aria-hidden": "true",
                children: running ? /* @__PURE__ */ jsxDEV2("span", {
                  className: "action-button__spinner"
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV2(ActionGlyph, {
                  reference
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this) : null,
              /* @__PURE__ */ jsxDEV2("span", {
                children: item.name
              }, undefined, false, undefined, this),
              variant !== "buttons" && running ? /* @__PURE__ */ jsxDEV2("span", {
                className: "action-button__spinner",
                "aria-hidden": "true"
              }, undefined, false, undefined, this) : null
            ]
          }, undefined, true, undefined, this),
          disabledReason && disabled ? /* @__PURE__ */ jsxDEV2("span", {
            className: "visually-hidden",
            id: `${itemId}-reason`,
            role: "status",
            children: disabledReason
          }, undefined, false, undefined, this) : null
        ]
      }, `${item.name}:${index}`, true, undefined, this);
    })
  }, undefined, false, undefined, this);
}
export {
  ActionButton as default
};
