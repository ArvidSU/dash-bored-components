import "./component.css";
// src/renderer/builtins/list/index.tsx
import { useMemo as useMemo2 } from "react";

// src/renderer/lib/state-visual.tsx
import { jsxDEV, Fragment } from "react/jsx-dev-runtime";
var CLOSED_STATES = new Set(["done", "completed", "closed"]);
var POSITIVE_STATES = new Set(["ok", "online", "healthy", "success", "passed", "ready", ...CLOSED_STATES]);
var WARNING_STATES = new Set(["warn", "warning", "pending", "starting", "running", "stopping", "blocked", "degraded", "stale"]);
var NEGATIVE_STATES = new Set(["error", "failed", "failing", "offline", "down", "bug", "broken"]);
function stateTone(state, done = false) {
  const normalized = state?.trim().toLowerCase() ?? "";
  if (done || POSITIVE_STATES.has(normalized))
    return "positive";
  if (WARNING_STATES.has(normalized))
    return "warning";
  if (NEGATIVE_STATES.has(normalized))
    return "negative";
  return "neutral";
}
function isClosedState(state, done = false) {
  return done || CLOSED_STATES.has(state?.trim().toLowerCase() ?? "");
}
function StateGlyph({ tone }) {
  return /* @__PURE__ */ jsxDEV("svg", {
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    children: tone === "positive" ? /* @__PURE__ */ jsxDEV(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV("circle", {
          cx: "10",
          cy: "10",
          r: "7"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("path", {
          d: "m6.5 10 2.3 2.3 4.7-4.6"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : tone === "warning" ? /* @__PURE__ */ jsxDEV(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV("path", {
          d: "M10 2.5 18 17H2Z"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("path", {
          d: "M10 7.5v4M10 14h.01"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : tone === "negative" ? /* @__PURE__ */ jsxDEV(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV("circle", {
          cx: "10",
          cy: "10",
          r: "7"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("path", {
          d: "m7.5 7.5 5 5m0-5-5 5"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV(Fragment, {
      children: [
        /* @__PURE__ */ jsxDEV("circle", {
          cx: "10",
          cy: "10",
          r: "7"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV("path", {
          d: "M7.5 10h5"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}

// src/renderer/lib/observation-changes.ts
import { useEffect, useRef, useState } from "react";
var CHANGE_FLASH_MS = 1200;
function useFlash(at) {
  const [flashing, setFlashing] = useState(false);
  useEffect(() => {
    if (!at)
      return;
    setFlashing(true);
    const timer = window.setTimeout(() => setFlashing(false), CHANGE_FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [at]);
  return flashing;
}
function diffObservedItems(previous, next, fingerprint = (item) => JSON.stringify(item)) {
  const before = new Map(previous.map((item) => [item.id, fingerprint(item)]));
  const changes = new Map;
  for (const item of next) {
    const prior = before.get(item.id);
    if (prior === undefined)
      changes.set(item.id, "new");
    else if (prior !== fingerprint(item))
      changes.set(item.id, "changed");
  }
  return changes;
}
function useChangedItems(items, enabled) {
  const previous = useRef(undefined);
  const [state, setState] = useState({ changes: new Map });
  useEffect(() => {
    if (!enabled || items === undefined)
      return;
    const before = previous.current;
    previous.current = items;
    if (before === undefined)
      return;
    const changes = diffObservedItems(before, items);
    const removed = before.some((item) => !items.some((candidate) => candidate.id === item.id));
    if (changes.size === 0 && !removed)
      return;
    setState({ changes, at: new Date });
  }, [enabled, items]);
  const flashing = useFlash(state.changes.size ? state.at : undefined);
  return { ...enabled ? state : { changes: new Map }, flashing: enabled && flashing };
}

// src/renderer/builtins/shared.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
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
  return /* @__PURE__ */ jsxDEV2("div", {
    className: "component-state component-state--locked",
    children: [
      /* @__PURE__ */ jsxDEV2("span", {
        className: "component-state__icon",
        "aria-hidden": "true",
        children: "◇"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV2("strong", {
        children: title
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV2("span", {
        children
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/renderer/builtins/list/index.tsx
import { useComponentVisibility as useComponentVisibility2 } from "@dash-bored/component";

// src/renderer/lib/list-data.ts
var ITEM_TEMPLATE = /^\$\{item\.([A-Za-z][A-Za-z0-9_-]*)\}$/;
function parseListItemActions(value) {
  if (value === undefined)
    return { actions: [], diagnostics: [] };
  if (!Array.isArray(value))
    return { actions: [], diagnostics: ["itemActions must be an array."] };
  const actions = [];
  const diagnostics = [];
  const names = new Set;
  value.forEach((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      diagnostics.push(`Action ${index + 1} must be an object.`);
      return;
    }
    const action = candidate;
    const name = typeof action.name === "string" ? action.name.trim() : "";
    const invocation = action.action;
    const normalized = typeof invocation === "string" ? { run: invocation, with: {} } : invocation && typeof invocation === "object" && !Array.isArray(invocation) && typeof invocation.run === "string" && (invocation.with === undefined || invocation.with !== null && typeof invocation.with === "object" && !Array.isArray(invocation.with)) ? {
      run: invocation.run,
      with: invocation.with ?? {}
    } : undefined;
    if (!name)
      diagnostics.push(`Action ${index + 1} needs a non-empty name.`);
    if (!normalized || normalized.run.trim() === "")
      diagnostics.push(`Action ${index + 1} needs a valid action reference.`);
    if (name && names.has(name))
      diagnostics.push(`Action name ${JSON.stringify(name)} is duplicated.`);
    if (name)
      names.add(name);
    if (name && normalized && normalized.run.trim() !== "")
      actions.push({ name, action: normalized });
  });
  return { actions, diagnostics };
}
function resolveListItemAction(action, item) {
  try {
    const withArgs = resolveItemValue(action.action.with, item);
    if (!withArgs || typeof withArgs !== "object" || Array.isArray(withArgs)) {
      throw new Error("action arguments must resolve to an object.");
    }
    return { invocation: { run: action.action.run, with: withArgs } };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
function resolveItemValue(value, item) {
  if (typeof value === "string") {
    const match = ITEM_TEMPLATE.exec(value);
    if (match) {
      const field = match[1];
      if (!Object.prototype.hasOwnProperty.call(item, field) || item[field] === undefined) {
        throw new Error(`item.${field} is missing from this source item.`);
      }
      return copyJsonValue(item[field], `item.${field}`);
    }
    if (value.includes("${item."))
      throw new Error("Item templates must be the full value of an action argument.");
    return value;
  }
  if (Array.isArray(value))
    return value.map((entry) => resolveItemValue(entry, item));
  if (value !== null && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null)
      throw new Error("Action arguments must contain JSON values.");
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveItemValue(entry, item)]));
  }
  if (value === null || typeof value === "boolean" || typeof value === "number")
    return value;
  throw new Error("Action arguments must contain JSON values or item field templates.");
}
function copyJsonValue(value, field) {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number")
    return value;
  if (Array.isArray(value))
    return value.map((entry) => copyJsonValue(entry, field));
  if (value !== null && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null)
      throw new Error(`${field} has an unsupported value type.`);
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, copyJsonValue(entry, field)]));
  }
  throw new Error(`${field} has an unsupported value type.`);
}
function parseDashboardList(value) {
  if (!Array.isArray(value)) {
    return { items: [], diagnostics: [{ message: "Expected a JSON array of list items." }] };
  }
  const diagnostics = [];
  const items = [];
  const ids = new Set;
  value.forEach((candidate, index) => {
    const diagnose = (message) => {
      diagnostics.push({ index, message });
    };
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      diagnose("Expected an object with string id and title fields.");
      return;
    }
    const item = candidate;
    if (typeof item.id !== "string" || item.id.trim() === "") {
      diagnose("id must be a non-empty string owned by the source.");
      return;
    }
    if (ids.has(item.id)) {
      diagnose(`id ${JSON.stringify(item.id)} is duplicated; IDs must be unique.`);
      return;
    }
    ids.add(item.id);
    if (typeof item.title !== "string" || item.title.trim() === "") {
      diagnose("title must be a non-empty string.");
      return;
    }
    let valid = true;
    if (item.detail !== undefined && typeof item.detail !== "string") {
      diagnose("detail must be a string when provided.");
      valid = false;
    }
    if (item.tags !== undefined && (!Array.isArray(item.tags) || item.tags.some((tag) => typeof tag !== "string"))) {
      diagnose("tags must be an array of strings when provided.");
      valid = false;
    }
    if (item.state !== undefined && typeof item.state !== "string") {
      diagnose("state must be a string when provided.");
      valid = false;
    }
    if (item.done !== undefined && typeof item.done !== "boolean") {
      diagnose("done must be a boolean when provided.");
      valid = false;
    }
    if (valid)
      items.push(item);
  });
  return { items, diagnostics };
}
function filterListItems(items, tag) {
  return tag === "" ? [...items] : items.filter((item) => item.tags?.includes(tag));
}
function sortListItems(items, mode) {
  return items.map((item, index) => ({ item, index })).sort((left, right) => {
    if (mode === "open-first") {
      const leftClosed = left.item.done === true || ["done", "completed", "closed"].includes(left.item.state?.toLowerCase() ?? "");
      const rightClosed = right.item.done === true || ["done", "completed", "closed"].includes(right.item.state?.toLowerCase() ?? "");
      if (leftClosed !== rightClosed)
        return Number(leftClosed) - Number(rightClosed);
    }
    return left.index - right.index;
  }).map(({ item }) => item);
}
function listTags(items) {
  return [...new Set(items.flatMap((item) => item.tags ?? []))].sort((left, right) => left.localeCompare(right));
}

// src/renderer/lib/use-dashboard-source.ts
import { useCallback, useEffect as useEffect2, useState as useState2 } from "react";
import { useComponentVisibility } from "@dash-bored/component";

// src/renderer/lib/source.ts
import { trackActivity } from "@dash-bored/component";
function decodeSourceText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
function readDashboardSource(source, host) {
  return trackActivity(readSource(source, host));
}
async function readSource(source, host) {
  const kinds = ["shell", "file", "http", "process", "inline"].filter((kind) => (kind in source));
  if (kinds.length !== 1)
    throw new Error("Source must define exactly one of shell, file, http, process, or inline.");
  switch (kinds[0]) {
    case "inline":
      return source.inline;
    case "shell": {
      if (!host.shell)
        throw new Error("Source requires process:execute permission.");
      const result = await host.shell.run({ command: source.shell, cwd: source.cwd, env: source.env, timeoutMs: source.timeoutMs });
      if (result.timedOut || result.exitCode !== 0)
        throw new Error(`Command failed (${result.timedOut ? "timed out" : `exit ${result.exitCode}`}): ${result.stderr.slice(-500)}`);
      return decodeSourceText(result.stdout);
    }
    case "file": {
      if (!host.filesystem)
        throw new Error("Source requires filesystem:read permission.");
      return decodeSourceText(await host.filesystem.readText(source.file));
    }
    case "http": {
      if (!host.http)
        throw new Error("Source requires network:http permission.");
      const response = await host.http.request({ url: source.http, timeoutMs: source.timeoutMs });
      if (response.status < 200 || response.status >= 300)
        throw new Error(`HTTP ${response.status}: ${response.body.slice(-500)}`);
      return decodeSourceText(response.body);
    }
    case "process": {
      if (!host.processes)
        throw new Error("Source requires process:observe permission.");
      const snapshot = host.processes.get(source.process);
      if (snapshot === undefined)
        throw new Error(`No supervised process exists with id ${source.process}.`);
      return snapshot;
    }
  }
}

// src/renderer/lib/use-dashboard-source.ts
function missingSourcePermission(source, host) {
  if (!source)
    return;
  if (source.shell && !host.shell)
    return "process:execute";
  if (source.file && !host.filesystem)
    return "filesystem:read";
  if (source.http && !host.http)
    return "network:http";
  if (source.process && !host.processes)
    return "process:observe";
  return;
}
function useSourceComponent(source, host, { label, withoutSource, unavailableReason, confirmation }) {
  const [refreshes, setRefreshes] = useState2(0);
  const refresh = useCallback(() => setRefreshes((count) => count + 1), []);
  const unavailable = missingSourcePermission(source, host);
  const state = useLoadedSource(unavailable ? null : source, host, refreshes);
  const reason = unavailable ? unavailableReason?.(unavailable) ?? `Trust this project to grant ${unavailable}.` : source === null ? withoutSource ?? undefined : undefined;
  useEffect2(() => host.actions.register({
    id: "refresh",
    label,
    enabled: reason === undefined,
    disabledReason: reason,
    confirmation,
    run: refresh
  }), [host.actions, label, reason, refresh, confirmation?.title, confirmation?.message, confirmation?.confirmLabel]);
  return { state, unavailable, refresh, refreshes };
}
function useLoadedSource(source, host, refresh) {
  const visible = useComponentVisibility();
  const [state, setState] = useState2({ loading: true });
  const processSnapshot = source?.process ? host.processes?.get(source.process) : undefined;
  const sourceKey = JSON.stringify(source);
  const every = typeof source?.every === "number" ? Math.max(1000, Math.min(300000, source.every)) : undefined;
  useEffect2(() => {
    if (!visible || !source)
      return;
    const activeSource = source;
    let cancelled = false;
    let timer;
    async function load() {
      setState((previous) => ({ ...previous, loading: true, error: undefined }));
      try {
        const value = await readDashboardSource(activeSource, host);
        if (!cancelled)
          setState({ value, loading: false, updatedAt: new Date });
      } catch (cause) {
        if (!cancelled)
          setState((previous) => ({
            ...previous,
            loading: false,
            error: cause instanceof Error ? cause.message : String(cause)
          }));
      } finally {
        if (!cancelled && every !== undefined)
          timer = window.setTimeout(() => void load(), every);
      }
    }
    load();
    return () => {
      cancelled = true;
      if (timer !== undefined)
        window.clearTimeout(timer);
    };
  }, [every, host, refresh, sourceKey, visible]);
  useEffect2(() => {
    if (source?.process && processSnapshot !== undefined) {
      setState({ value: processSnapshot, loading: false, updatedAt: new Date });
    }
  }, [processSnapshot, source?.process]);
  return state;
}

// src/renderer/builtins/todo-list/index.tsx
import {
  useCallback as useCallback2,
  useEffect as useEffect4,
  useMemo,
  useRef as useRef2,
  useState as useState4
} from "react";

// src/shared/todo.ts
function createTodoId() {
  return `todo-${crypto.randomUUID()}`;
}

// src/migrations/todo-ids.ts
function migrateTodoItems(value, createId = createTodoId) {
  let changed = false;
  const ids = new Set;
  if (!Array.isArray(value))
    return { items: [], changed: false };
  const items = value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object")
      return [];
    const item = candidate;
    if (typeof item.description !== "string" || item.description.trim() === "")
      return [];
    if (typeof item.done !== "boolean" || !Array.isArray(item.tags))
      return [];
    if (item.tags.some((tag) => typeof tag !== "string" || tag.trim() === ""))
      return [];
    let id = typeof item.id === "string" && item.id.trim() !== "" ? item.id : "";
    if (id === "" || ids.has(id)) {
      id = createId();
      changed = true;
    }
    ids.add(id);
    return [{
      id,
      description: item.description,
      done: item.done,
      tags: [...new Set(item.tags)]
    }];
  });
  return { items, changed };
}

// src/renderer/lib/todo.ts
function sortTodos(items) {
  return items.map((item, index) => ({ item, index })).sort((left, right) => Number(left.item.done) - Number(right.item.done) || left.index - right.index).map(({ item }) => item);
}
function filterTodos(items, tag) {
  if (tag === "")
    return [...items];
  return items.filter((item) => item.tags.includes(tag));
}
function todoTags(items) {
  return [...new Set(items.flatMap((item) => item.tags))].sort((left, right) => left.localeCompare(right));
}

// src/renderer/builtins/tag-filter.tsx
import { useEffect as useEffect3, useState as useState3 } from "react";
function TagFilter({ host, tags, enabled = true, children }) {
  const [filterTag, setFilterTag] = useState3("");
  if (filterTag !== "" && (!enabled || !tags.includes(filterTag)))
    setFilterTag("");
  useEffect3(() => {
    const unregister = [
      host.actions.register({
        id: "clear-filter",
        label: "Clear list tag filter",
        enabled: filterTag !== "",
        disabledReason: "No tag filter is selected.",
        run: () => setFilterTag("")
      }),
      host.actions.register({
        id: "filter",
        label: "Filter list by tag",
        enabled: enabled && (tags.length > 0 || filterTag !== ""),
        disabledReason: enabled ? "This list has no tags." : "Tag filtering is disabled.",
        choices: [{ id: "tag", label: "Choose a tag", options: () => tags.map((tag) => ({ value: tag, label: tag })) }],
        run: (selections, args) => {
          const tag = args?.tag ?? selections?.tag ?? "";
          if (typeof tag !== "string" || tag !== "" && !tags.includes(tag))
            throw new Error("Choose a current list tag.");
          setFilterTag(tag);
        }
      })
    ];
    return () => unregister.forEach((remove) => remove());
  }, [host.actions, enabled, tags, filterTag]);
  return children(filterTag, setFilterTag);
}

// src/renderer/builtins/todo-list/index.tsx
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function tagsFromInput(value) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}
function TodoList({ props, host, refreshAction = false }) {
  const configuredItemsKey = JSON.stringify(props.todos);
  const configuredItems = useMemo(() => migrateTodoItems(props.todos).items, [configuredItemsKey]);
  const [items, setItems] = useState4(configuredItems);
  const [description, setDescription] = useState4("");
  const [newTags, setNewTags] = useState4("");
  const [formError, setFormError] = useState4(null);
  const [error, setError] = useState4(null);
  const [saving, setSaving] = useState4(false);
  const [editTarget, setEditTarget] = useState4(null);
  const [editValue, setEditValue] = useState4("");
  const configuredActions = useMemo(() => parseListItemActions(props.itemActions), [props.itemActions]);
  const editActionRef = useRef2("idle");
  useEffect4(() => {
    if (!refreshAction)
      return;
    return host.actions.register({
      id: "refresh",
      label: "Refresh list",
      enabled: false,
      disabledReason: "Editable YAML items are already current.",
      run: () => {
        return;
      }
    });
  }, [host.actions, refreshAction]);
  useEffect4(() => {
    if (!saving)
      setItems(configuredItems);
  }, [configuredItemsKey, saving]);
  const persist = useCallback2(async (nextItems) => {
    setSaving(true);
    setError(null);
    setItems(nextItems);
    try {
      await host.dashboard.updateProps({ ...props, todos: nextItems });
      return true;
    } catch (cause) {
      setError(errorMessage(cause));
      return false;
    } finally {
      setSaving(false);
    }
  }, [host.dashboard, props]);
  const addTodo = async () => {
    const nextDescription = description.trim();
    if (nextDescription === "") {
      setFormError("Add a description first.");
      return;
    }
    setFormError(null);
    const added = {
      id: createTodoId(),
      description: nextDescription,
      done: false,
      tags: tagsFromInput(newTags)
    };
    if (await persist([...items, added])) {
      setDescription("");
      setNewTags("");
    }
  };
  const toggleTodo = (item) => {
    const nextItems = items.map((candidate) => candidate.id === item.id ? { ...candidate, done: !candidate.done } : candidate);
    persist(nextItems);
  };
  const removeTodo = (item) => {
    persist(items.filter((candidate) => candidate.id !== item.id));
  };
  const canWrite = !saving;
  const beginEdit = (id, field) => {
    if (!canWrite)
      return;
    const item = items.find((candidate) => candidate.id === id);
    if (!item)
      return;
    editActionRef.current = "idle";
    setFormError(null);
    setEditTarget({ id, field });
    setEditValue(field === "description" ? item.description : item.tags.join(", "));
  };
  const cancelEdit = () => {
    if (editActionRef.current === "committing")
      return;
    editActionRef.current = "cancelled";
    setEditTarget(null);
    setEditValue("");
  };
  const commitEdit = () => {
    if (editActionRef.current !== "idle" || editTarget === null || saving)
      return;
    const item = items.find((candidate) => candidate.id === editTarget.id);
    if (!item) {
      cancelEdit();
      return;
    }
    const value = editValue.trim();
    if (editTarget.field === "description" && value === "") {
      setFormError("A todo description cannot be empty.");
      return;
    }
    const nextItems = items.map((candidate) => {
      if (candidate.id !== editTarget.id)
        return candidate;
      return editTarget.field === "description" ? { ...candidate, description: value } : { ...candidate, tags: tagsFromInput(value) };
    });
    editActionRef.current = "committing";
    setFormError(null);
    persist(nextItems).then((success) => {
      if (success) {
        setEditTarget(null);
        setEditValue("");
      }
      editActionRef.current = "idle";
    });
  };
  const tags = useMemo(() => todoTags(items), [items]);
  useEffect4(() => {
    const itemChoice = { id: "id", label: "Choose a todo", options: () => items.map((item) => ({ value: item.id, label: item.description })) };
    const targetItem = (selections, args) => {
      const item = items.find((candidate) => candidate.id === (args?.id ?? selections?.id));
      if (!item)
        throw new Error("This todo no longer exists.");
      return item;
    };
    const unregister = [
      host.actions.register({
        id: "toggle",
        label: "Toggle todo completion",
        enabled: !saving && items.length > 0,
        disabledReason: saving ? "Todo edits are being saved." : "There are no todos.",
        choices: [itemChoice],
        run: async (selections, args) => {
          const item = targetItem(selections, args);
          if (!await persist(items.map((candidate) => candidate.id === item.id ? { ...candidate, done: !candidate.done } : candidate)))
            throw new Error("Could not update the todo draft.");
        }
      }),
      host.actions.register({
        id: "remove",
        label: "Remove todo",
        enabled: !saving && items.length > 0,
        disabledReason: saving ? "Todo edits are being saved." : "There are no todos.",
        choices: [itemChoice],
        confirmation: { title: "Remove selected todo from the dashboard draft?" },
        run: async (selections, args) => {
          const item = targetItem(selections, args);
          if (!await persist(items.filter((candidate) => candidate.id !== item.id)))
            throw new Error("Could not update the todo draft.");
        }
      })
    ];
    return () => unregister.forEach((remove) => remove());
  }, [host.actions, items, saving, persist]);
  const openCount = items.filter((item) => !item.done).length;
  const filterByTags = props.filterByTags !== false;
  return /* @__PURE__ */ jsxDEV3(TagFilter, {
    host,
    tags,
    enabled: filterByTags,
    children: (filterTag, setFilterTag) => {
      const visibleItems = sortTodos(filterTodos(items, filterTag));
      return /* @__PURE__ */ jsxDEV3("section", {
        className: "todo",
        "aria-label": "todo list",
        children: [
          /* @__PURE__ */ jsxDEV3("header", {
            className: "todo__header",
            children: [
              /* @__PURE__ */ jsxDEV3("div", {
                children: [
                  /* @__PURE__ */ jsxDEV3("strong", {
                    children: typeof props.title === "string" ? props.title : "Todo list"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV3("span", {
                    children: [
                      openCount,
                      " open · ",
                      items.length,
                      " total"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              filterByTags && tags.length > 0 ? /* @__PURE__ */ jsxDEV3("label", {
                className: "todo__filter",
                children: [
                  /* @__PURE__ */ jsxDEV3("span", {
                    children: "Tag"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV3("select", {
                    value: filterTag,
                    onChange: (event) => setFilterTag(event.target.value),
                    children: [
                      /* @__PURE__ */ jsxDEV3("option", {
                        value: "",
                        children: "All tags"
                      }, undefined, false, undefined, this),
                      tags.map((tag) => /* @__PURE__ */ jsxDEV3("option", {
                        value: tag,
                        children: tag
                      }, tag, false, undefined, this))
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this) : null
            ]
          }, undefined, true, undefined, this),
          error ? /* @__PURE__ */ jsxDEV3("div", {
            className: "todo__error",
            role: "alert",
            children: /* @__PURE__ */ jsxDEV3("p", {
              children: error
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this) : null,
          configuredActions.diagnostics.length ? /* @__PURE__ */ jsxDEV3("ul", {
            role: "alert",
            "aria-label": "Todo action configuration errors",
            children: configuredActions.diagnostics.map((message, index) => /* @__PURE__ */ jsxDEV3("li", {
              children: message
            }, index, false, undefined, this))
          }, undefined, false, undefined, this) : null,
          !error ? visibleItems.length ? /* @__PURE__ */ jsxDEV3("div", {
            className: "todo__list",
            role: "list",
            "aria-label": "Todos",
            children: visibleItems.map((item) => {
              const editingDescription = editTarget?.id === item.id && editTarget.field === "description";
              const editingTags = editTarget?.id === item.id && editTarget.field === "tags";
              return /* @__PURE__ */ jsxDEV3("article", {
                className: `todo__item${item.done ? " todo__item--done" : ""}`,
                role: "listitem",
                "data-item-id": item.id,
                children: [
                  /* @__PURE__ */ jsxDEV3("div", {
                    className: "todo__item-main",
                    children: [
                      /* @__PURE__ */ jsxDEV3("input", {
                        type: "checkbox",
                        checked: item.done,
                        disabled: !canWrite,
                        "aria-label": `${item.done ? "Mark incomplete" : "Mark complete"}: ${item.description}`,
                        onChange: () => toggleTodo(item)
                      }, undefined, false, undefined, this),
                      editingDescription ? /* @__PURE__ */ jsxDEV3("input", {
                        className: "todo__edit-input todo__edit-input--description",
                        autoFocus: true,
                        value: editValue,
                        disabled: saving,
                        "aria-label": "Edit todo description",
                        onChange: (event) => setEditValue(event.target.value),
                        onBlur: commitEdit,
                        onKeyDown: (event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            event.currentTarget.blur();
                          } else if (event.key === "Escape") {
                            event.preventDefault();
                            cancelEdit();
                          }
                        }
                      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV3("button", {
                        className: "todo__description-edit",
                        type: "button",
                        disabled: !canWrite,
                        "aria-label": `Edit description: ${item.description}`,
                        onClick: () => beginEdit(item.id, "description"),
                        children: /* @__PURE__ */ jsxDEV3("span", {
                          className: "todo__description",
                          children: item.description
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV3("div", {
                    className: "todo__item-side",
                    children: [
                      configuredActions.actions.map((configuredAction) => {
                        const resolved = resolveListItemAction(configuredAction, {
                          ...item,
                          title: item.description,
                          state: item.done ? "done" : "open"
                        });
                        const invocationKey = `${item.id}:${configuredAction.name}`;
                        const action = resolved.invocation ? host.actions.resolve(resolved.invocation.run, invocationKey) : undefined;
                        const disabledReason = resolved.error ?? (action && !action.enabled ? action.disabledReason ?? "This action is unavailable." : undefined);
                        return /* @__PURE__ */ jsxDEV3("div", {
                          className: "todo__item-action",
                          children: [
                            /* @__PURE__ */ jsxDEV3("button", {
                              type: "button",
                              disabled: !resolved.invocation || Boolean(disabledReason) || Boolean(action?.running),
                              title: disabledReason,
                              onClick: () => {
                                if (resolved.invocation)
                                  host.actions.invoke(resolved.invocation.run, resolved.invocation.with, undefined, invocationKey);
                              },
                              children: [
                                configuredAction.name,
                                action?.running ? " · Running" : ""
                              ]
                            }, undefined, true, undefined, this),
                            action?.invocation?.status === "failed" ? /* @__PURE__ */ jsxDEV3("small", {
                              role: "alert",
                              children: action.invocation.message ?? "Action failed."
                            }, undefined, false, undefined, this) : null,
                            action?.invocation?.outcome === "started" ? /* @__PURE__ */ jsxDEV3("small", {
                              role: "status",
                              children: "Started"
                            }, undefined, false, undefined, this) : null,
                            resolved.error ? /* @__PURE__ */ jsxDEV3("small", {
                              role: "alert",
                              children: resolved.error
                            }, undefined, false, undefined, this) : null
                          ]
                        }, configuredAction.name, true, undefined, this);
                      }),
                      editingTags ? /* @__PURE__ */ jsxDEV3("input", {
                        className: "todo__edit-input todo__edit-input--tags",
                        autoFocus: true,
                        value: editValue,
                        disabled: saving,
                        "aria-label": "Edit todo tags",
                        placeholder: "docs, release",
                        onChange: (event) => setEditValue(event.target.value),
                        onBlur: commitEdit,
                        onKeyDown: (event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            event.currentTarget.blur();
                          } else if (event.key === "Escape") {
                            event.preventDefault();
                            cancelEdit();
                          }
                        }
                      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV3("button", {
                        className: "todo__tags-edit",
                        type: "button",
                        disabled: !canWrite,
                        "aria-label": `Edit tags: ${item.description}`,
                        onClick: () => beginEdit(item.id, "tags"),
                        children: item.tags.length ? /* @__PURE__ */ jsxDEV3("span", {
                          className: "todo__tags",
                          "aria-label": "Tags",
                          children: item.tags.map((tag) => /* @__PURE__ */ jsxDEV3("span", {
                            children: tag
                          }, tag, false, undefined, this))
                        }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV3("span", {
                          className: "todo__tags-empty",
                          children: "Add tags"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV3("button", {
                        className: "todo__remove",
                        type: "button",
                        disabled: !canWrite,
                        "aria-label": `Remove todo: ${item.description}`,
                        onClick: () => removeTodo(item),
                        children: "Remove"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, item.id, true, undefined, this);
            })
          }, undefined, false, undefined, this) : items.length ? /* @__PURE__ */ jsxDEV3("p", {
            className: "todo__message",
            children: [
              "No todos match the “",
              filterTag,
              "” tag."
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV3("p", {
            className: "todo__message",
            children: "No todos yet. Add one below."
          }, undefined, false, undefined, this) : null,
          /* @__PURE__ */ jsxDEV3("form", {
            className: "todo__form",
            onSubmit: (event) => {
              event.preventDefault();
              addTodo();
            },
            children: [
              /* @__PURE__ */ jsxDEV3("label", {
                children: [
                  /* @__PURE__ */ jsxDEV3("span", {
                    children: "Description"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV3("input", {
                    value: description,
                    disabled: !canWrite,
                    placeholder: "What needs doing?",
                    onChange: (event) => setDescription(event.target.value)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV3("label", {
                children: [
                  /* @__PURE__ */ jsxDEV3("span", {
                    children: "Tags"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV3("input", {
                    value: newTags,
                    disabled: !canWrite,
                    placeholder: "docs, release",
                    onChange: (event) => setNewTags(event.target.value)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV3("button", {
                type: "submit",
                disabled: !canWrite,
                children: "Add item"
              }, undefined, false, undefined, this),
              formError ? /* @__PURE__ */ jsxDEV3("span", {
                className: "todo__form-error",
                role: "alert",
                children: formError
              }, undefined, false, undefined, this) : null
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this);
    }
  }, "editable-todos", false, undefined, this);
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
function processRunOutcome(run) {
  if (run.phase === "running")
    return "running";
  if (run.phase === "stopping")
    return "stopping";
  if (run.signal !== null)
    return run.signal;
  if (run.exitCode !== null)
    return `exit ${run.exitCode}`;
  return run.phase === "failed" ? "failed to start" : "exited";
}
function processRunFailed(run) {
  return (run.phase === "exited" || run.phase === "failed") && !(run.exitCode === 0 && run.signal === null);
}

// src/renderer/builtins/list/index.tsx
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
function invocationProcessRun(action) {
  const { invocation } = action;
  const run = processRun(action.process);
  if (!invocation?.finishedAt || !run?.startedAt)
    return;
  const runStartedAt = Date.parse(run.startedAt);
  return Date.parse(invocation.startedAt) <= runStartedAt && runStartedAt <= Date.parse(invocation.finishedAt) ? run : undefined;
}
function List(input) {
  if (Object.prototype.hasOwnProperty.call(input.props, "todos")) {
    return /* @__PURE__ */ jsxDEV4(TodoList, {
      props: input.props,
      host: input.host,
      refreshAction: true
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV4(SourceList, {
    ...input
  }, undefined, false, undefined, this);
}
function SourceList({ props, host }) {
  const source = props.source && typeof props.source === "object" ? props.source : undefined;
  const env = source?.env ? Object.fromEntries(Object.entries(source.env).sort(([left], [right]) => left.localeCompare(right))) : undefined;
  const provider = source ? source.shell !== undefined ? { kind: "shell", value: source.shell, cwd: source.cwd, env } : source.file !== undefined ? { kind: "file", value: source.file } : source.http !== undefined ? { kind: "http", value: source.http } : source.process !== undefined ? { kind: "process", value: source.process } : { kind: "inline" } : null;
  return /* @__PURE__ */ jsxDEV4(SourceListInstance, {
    props,
    host,
    source,
    filterKey: JSON.stringify(provider)
  }, undefined, false, undefined, this);
}
function SourceListInstance({ props, host, source, filterKey }) {
  const visible = useComponentVisibility2();
  const title = stringProp(props, ["title"], "List");
  const filterByTags = props.filterByTags !== false;
  const sortMode = props.sort === "source-order" ? "source-order" : "open-first";
  const { state, unavailable, refresh } = useSourceComponent(source ?? null, host, {
    label: `Refresh ${title}`,
    withoutSource: "Configure a source before refreshing.",
    unavailableReason: (missing) => `Trust this project and grant ${missing} to read this source.`
  });
  const parsed = useMemo2(() => state.value === undefined ? { items: [], diagnostics: [] } : parseDashboardList(state.value), [state.value]);
  const configuredActions = useMemo2(() => parseListItemActions(props.itemActions), [props.itemActions]);
  const observed = useChangedItems(state.value === undefined ? undefined : parsed.items, props.highlightChanges !== false);
  const changedAt = observed.at?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const tags = useMemo2(() => listTags(parsed.items), [parsed.items]);
  if (!source)
    return /* @__PURE__ */ jsxDEV4("p", {
      className: "component-state component-state--error",
      role: "alert",
      children: "List needs a source."
    }, undefined, false, undefined, this);
  if (unavailable)
    return /* @__PURE__ */ jsxDEV4(CapabilityGate, {
      title,
      children: [
        "Trust this project and grant ",
        unavailable,
        " to read this source."
      ]
    }, undefined, true, undefined, this);
  return /* @__PURE__ */ jsxDEV4(TagFilter, {
    host,
    tags,
    enabled: filterByTags,
    children: (filterTag, setFilterTag) => {
      const displayed = sortListItems(filterListItems(parsed.items, filterTag), sortMode);
      return /* @__PURE__ */ jsxDEV4("section", {
        className: "source-list",
        "data-refreshing": state.loading && state.value !== undefined || undefined,
        "aria-label": title,
        children: [
          /* @__PURE__ */ jsxDEV4("header", {
            className: "source-list__header",
            children: [
              /* @__PURE__ */ jsxDEV4("div", {
                children: [
                  /* @__PURE__ */ jsxDEV4("strong", {
                    children: title
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV4("span", {
                    children: [
                      parsed.items.length,
                      " items",
                      observed.changes.size ? ` · ${observed.changes.size} changed at ${changedAt}` : ""
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV4("div", {
                className: "source-list__controls",
                children: [
                  filterByTags && tags.length > 0 ? /* @__PURE__ */ jsxDEV4("label", {
                    children: [
                      /* @__PURE__ */ jsxDEV4("span", {
                        children: "Tag"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV4("select", {
                        value: filterTag,
                        onChange: (event) => setFilterTag(event.target.value),
                        children: [
                          /* @__PURE__ */ jsxDEV4("option", {
                            value: "",
                            children: "All tags"
                          }, undefined, false, undefined, this),
                          tags.map((tag) => /* @__PURE__ */ jsxDEV4("option", {
                            value: tag,
                            children: tag
                          }, tag, false, undefined, this))
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this) : null,
                  /* @__PURE__ */ jsxDEV4("button", {
                    className: "button button--quiet",
                    type: "button",
                    onClick: refresh,
                    disabled: state.loading,
                    children: "Refresh"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this),
          state.loading && state.value === undefined ? /* @__PURE__ */ jsxDEV4("p", {
            className: "component-state",
            role: "status",
            children: "Loading…"
          }, undefined, false, undefined, this) : null,
          state.loading && state.value !== undefined ? /* @__PURE__ */ jsxDEV4("small", {
            className: "visually-hidden",
            role: "status",
            children: "Updating…"
          }, undefined, false, undefined, this) : null,
          state.error ? /* @__PURE__ */ jsxDEV4("p", {
            className: "component-state component-state--error",
            role: "alert",
            children: [
              state.value === undefined ? "Source error" : "Showing stale data",
              ": ",
              state.error
            ]
          }, undefined, true, undefined, this) : null,
          parsed.diagnostics.length ? /* @__PURE__ */ jsxDEV4("ul", {
            className: "source-list__diagnostics",
            role: "alert",
            "aria-label": "List source shape errors",
            children: parsed.diagnostics.map((diagnostic, index) => /* @__PURE__ */ jsxDEV4("li", {
              children: [
                diagnostic.index === undefined ? "Source" : `Item ${diagnostic.index + 1}`,
                ": ",
                diagnostic.message
              ]
            }, `${diagnostic.index ?? "root"}-${index}`, true, undefined, this))
          }, undefined, false, undefined, this) : null,
          configuredActions.diagnostics.length ? /* @__PURE__ */ jsxDEV4("ul", {
            className: "source-list__diagnostics",
            role: "alert",
            "aria-label": "List action configuration errors",
            children: configuredActions.diagnostics.map((message, index) => /* @__PURE__ */ jsxDEV4("li", {
              children: message
            }, index, false, undefined, this))
          }, undefined, false, undefined, this) : null,
          displayed.length ? /* @__PURE__ */ jsxDEV4("ul", {
            className: "source-list__items",
            "aria-label": "Items",
            children: displayed.map((item) => {
              const change = observed.changes.get(item.id);
              return /* @__PURE__ */ jsxDEV4("li", {
                "data-item-id": item.id,
                "data-tone": stateTone(item.state, item.done),
                "data-change": change,
                "data-flash": change && observed.flashing || undefined,
                className: isClosedState(item.state, item.done) ? "source-list__item source-list__item--closed" : "source-list__item",
                children: [
                  /* @__PURE__ */ jsxDEV4("div", {
                    className: "source-list__item-leading",
                    children: [
                      /* @__PURE__ */ jsxDEV4("span", {
                        className: "source-list__glyph",
                        children: /* @__PURE__ */ jsxDEV4(StateGlyph, {
                          tone: stateTone(item.state, item.done)
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV4("div", {
                        className: "source-list__item-text",
                        children: [
                          /* @__PURE__ */ jsxDEV4("strong", {
                            children: item.title
                          }, undefined, false, undefined, this),
                          typeof item.detail === "string" ? /* @__PURE__ */ jsxDEV4("span", {
                            children: item.detail
                          }, undefined, false, undefined, this) : null
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV4("div", {
                    className: "source-list__item-trailing",
                    children: [
                      /* @__PURE__ */ jsxDEV4("div", {
                        className: "source-list__item-meta",
                        children: [
                          change ? /* @__PURE__ */ jsxDEV4("span", {
                            className: "source-list__change",
                            title: `${change === "new" ? "New" : "Changed"} in the update at ${changedAt}`,
                            children: change === "new" ? "New" : "Changed"
                          }, undefined, false, undefined, this) : null,
                          typeof item.state === "string" ? /* @__PURE__ */ jsxDEV4("span", {
                            className: "source-list__state",
                            children: item.state
                          }, undefined, false, undefined, this) : null,
                          item.tags?.map((tag, index) => /* @__PURE__ */ jsxDEV4("span", {
                            className: "source-list__tag",
                            children: tag
                          }, `${tag}-${index}`, false, undefined, this))
                        ]
                      }, undefined, true, undefined, this),
                      configuredActions.actions.length ? /* @__PURE__ */ jsxDEV4("div", {
                        className: "source-list__item-actions",
                        "aria-label": `Actions for ${item.title}`,
                        children: configuredActions.actions.map((configuredAction) => {
                          const resolved = resolveListItemAction(configuredAction, item);
                          const invocationKey = `${item.id}:${configuredAction.name}`;
                          const action = resolved.invocation ? host.actions.resolve(resolved.invocation.run, invocationKey) : undefined;
                          const ownedRun = action ? invocationProcessRun(action) : undefined;
                          const disabledReason = resolved.error ?? (action && !action.enabled ? action.disabledReason ?? "This action is unavailable." : undefined);
                          return /* @__PURE__ */ jsxDEV4("div", {
                            className: "source-list__item-action",
                            children: [
                              /* @__PURE__ */ jsxDEV4("button", {
                                className: "button button--quiet",
                                type: "button",
                                disabled: !resolved.invocation || Boolean(disabledReason) || Boolean(action?.running),
                                title: disabledReason,
                                onClick: () => {
                                  if (resolved.invocation)
                                    host.actions.invoke(resolved.invocation.run, resolved.invocation.with, undefined, invocationKey);
                                },
                                children: [
                                  configuredAction.name,
                                  action?.running ? " · Running" : ""
                                ]
                              }, undefined, true, undefined, this),
                              action?.invocation?.status === "failed" ? /* @__PURE__ */ jsxDEV4("small", {
                                role: "alert",
                                children: action.invocation.message ?? "Action failed."
                              }, undefined, false, undefined, this) : null,
                              ownedRun && (ownedRun.phase === "running" || ownedRun.phase === "stopping") ? /* @__PURE__ */ jsxDEV4("small", {
                                role: "status",
                                children: "Running"
                              }, undefined, false, undefined, this) : ownedRun ? /* @__PURE__ */ jsxDEV4("small", {
                                role: "status",
                                children: processRunFailed(ownedRun) ? `Failed: ${processRunOutcome(ownedRun)}` : "Finished"
                              }, undefined, false, undefined, this) : null,
                              resolved.error ? /* @__PURE__ */ jsxDEV4("small", {
                                role: "alert",
                                children: resolved.error
                              }, undefined, false, undefined, this) : null
                            ]
                          }, configuredAction.name, true, undefined, this);
                        })
                      }, undefined, false, undefined, this) : null
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, item.id, true, undefined, this);
            })
          }, undefined, false, undefined, this) : state.value !== undefined && parsed.diagnostics.length === 0 ? /* @__PURE__ */ jsxDEV4("p", {
            className: "source-list__empty",
            children: "No matching items."
          }, undefined, false, undefined, this) : null,
          !visible ? /* @__PURE__ */ jsxDEV4("small", {
            children: "Paused while hidden"
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this);
    }
  }, filterKey, false, undefined, this);
}
export {
  List as default
};
