import "./component.css";
// src/renderer/builtins/todo-list/index.tsx
import {
  useCallback,
  useEffect as useEffect2,
  useMemo,
  useRef,
  useState as useState2
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

// src/renderer/builtins/tag-filter.tsx
import { useEffect, useState } from "react";
function TagFilter({ host, tags, enabled = true, children }) {
  const [filterTag, setFilterTag] = useState("");
  if (filterTag !== "" && (!enabled || !tags.includes(filterTag)))
    setFilterTag("");
  useEffect(() => {
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
import { jsxDEV } from "react/jsx-dev-runtime";
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function tagsFromInput(value) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}
function TodoList({ props, host, refreshAction = false }) {
  const configuredItemsKey = JSON.stringify(props.todos);
  const configuredItems = useMemo(() => migrateTodoItems(props.todos).items, [configuredItemsKey]);
  const [items, setItems] = useState2(configuredItems);
  const [description, setDescription] = useState2("");
  const [newTags, setNewTags] = useState2("");
  const [formError, setFormError] = useState2(null);
  const [error, setError] = useState2(null);
  const [saving, setSaving] = useState2(false);
  const [editTarget, setEditTarget] = useState2(null);
  const [editValue, setEditValue] = useState2("");
  const configuredActions = useMemo(() => parseListItemActions(props.itemActions), [props.itemActions]);
  const editActionRef = useRef("idle");
  useEffect2(() => {
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
  useEffect2(() => {
    if (!saving)
      setItems(configuredItems);
  }, [configuredItemsKey, saving]);
  const persist = useCallback(async (nextItems) => {
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
  useEffect2(() => {
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
  return /* @__PURE__ */ jsxDEV(TagFilter, {
    host,
    tags,
    enabled: filterByTags,
    children: (filterTag, setFilterTag) => {
      const visibleItems = sortTodos(filterTodos(items, filterTag));
      return /* @__PURE__ */ jsxDEV("section", {
        className: "todo",
        "aria-label": "todo list",
        children: [
          /* @__PURE__ */ jsxDEV("header", {
            className: "todo__header",
            children: [
              /* @__PURE__ */ jsxDEV("div", {
                children: [
                  /* @__PURE__ */ jsxDEV("strong", {
                    children: typeof props.title === "string" ? props.title : "Todo list"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("span", {
                    children: [
                      openCount,
                      " open · ",
                      items.length,
                      " total"
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this),
              filterByTags && tags.length > 0 ? /* @__PURE__ */ jsxDEV("label", {
                className: "todo__filter",
                children: [
                  /* @__PURE__ */ jsxDEV("span", {
                    children: "Tag"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("select", {
                    value: filterTag,
                    onChange: (event) => setFilterTag(event.target.value),
                    children: [
                      /* @__PURE__ */ jsxDEV("option", {
                        value: "",
                        children: "All tags"
                      }, undefined, false, undefined, this),
                      tags.map((tag) => /* @__PURE__ */ jsxDEV("option", {
                        value: tag,
                        children: tag
                      }, tag, false, undefined, this))
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this) : null
            ]
          }, undefined, true, undefined, this),
          error ? /* @__PURE__ */ jsxDEV("div", {
            className: "todo__error",
            role: "alert",
            children: /* @__PURE__ */ jsxDEV("p", {
              children: error
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this) : null,
          configuredActions.diagnostics.length ? /* @__PURE__ */ jsxDEV("ul", {
            role: "alert",
            "aria-label": "Todo action configuration errors",
            children: configuredActions.diagnostics.map((message, index) => /* @__PURE__ */ jsxDEV("li", {
              children: message
            }, index, false, undefined, this))
          }, undefined, false, undefined, this) : null,
          !error ? visibleItems.length ? /* @__PURE__ */ jsxDEV("div", {
            className: "todo__list",
            role: "list",
            "aria-label": "Todos",
            children: visibleItems.map((item) => {
              const editingDescription = editTarget?.id === item.id && editTarget.field === "description";
              const editingTags = editTarget?.id === item.id && editTarget.field === "tags";
              return /* @__PURE__ */ jsxDEV("article", {
                className: `todo__item${item.done ? " todo__item--done" : ""}`,
                role: "listitem",
                "data-item-id": item.id,
                children: [
                  /* @__PURE__ */ jsxDEV("div", {
                    className: "todo__item-main",
                    children: [
                      /* @__PURE__ */ jsxDEV("input", {
                        type: "checkbox",
                        checked: item.done,
                        disabled: !canWrite,
                        "aria-label": `${item.done ? "Mark incomplete" : "Mark complete"}: ${item.description}`,
                        onChange: () => toggleTodo(item)
                      }, undefined, false, undefined, this),
                      editingDescription ? /* @__PURE__ */ jsxDEV("input", {
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
                      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV("button", {
                        className: "todo__description-edit",
                        type: "button",
                        disabled: !canWrite,
                        "aria-label": `Edit description: ${item.description}`,
                        onClick: () => beginEdit(item.id, "description"),
                        children: /* @__PURE__ */ jsxDEV("span", {
                          className: "todo__description",
                          children: item.description
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsxDEV("div", {
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
                        return /* @__PURE__ */ jsxDEV("div", {
                          className: "todo__item-action",
                          children: [
                            /* @__PURE__ */ jsxDEV("button", {
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
                            action?.invocation?.status === "failed" ? /* @__PURE__ */ jsxDEV("small", {
                              role: "alert",
                              children: action.invocation.message ?? "Action failed."
                            }, undefined, false, undefined, this) : null,
                            action?.invocation?.outcome === "started" ? /* @__PURE__ */ jsxDEV("small", {
                              role: "status",
                              children: "Started"
                            }, undefined, false, undefined, this) : null,
                            resolved.error ? /* @__PURE__ */ jsxDEV("small", {
                              role: "alert",
                              children: resolved.error
                            }, undefined, false, undefined, this) : null
                          ]
                        }, configuredAction.name, true, undefined, this);
                      }),
                      editingTags ? /* @__PURE__ */ jsxDEV("input", {
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
                      }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV("button", {
                        className: "todo__tags-edit",
                        type: "button",
                        disabled: !canWrite,
                        "aria-label": `Edit tags: ${item.description}`,
                        onClick: () => beginEdit(item.id, "tags"),
                        children: item.tags.length ? /* @__PURE__ */ jsxDEV("span", {
                          className: "todo__tags",
                          "aria-label": "Tags",
                          children: item.tags.map((tag) => /* @__PURE__ */ jsxDEV("span", {
                            children: tag
                          }, tag, false, undefined, this))
                        }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV("span", {
                          className: "todo__tags-empty",
                          children: "Add tags"
                        }, undefined, false, undefined, this)
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsxDEV("button", {
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
          }, undefined, false, undefined, this) : items.length ? /* @__PURE__ */ jsxDEV("p", {
            className: "todo__message",
            children: [
              "No todos match the “",
              filterTag,
              "” tag."
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV("p", {
            className: "todo__message",
            children: "No todos yet. Add one below."
          }, undefined, false, undefined, this) : null,
          /* @__PURE__ */ jsxDEV("form", {
            className: "todo__form",
            onSubmit: (event) => {
              event.preventDefault();
              addTodo();
            },
            children: [
              /* @__PURE__ */ jsxDEV("label", {
                children: [
                  /* @__PURE__ */ jsxDEV("span", {
                    children: "Description"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("input", {
                    value: description,
                    disabled: !canWrite,
                    placeholder: "What needs doing?",
                    onChange: (event) => setDescription(event.target.value)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV("label", {
                children: [
                  /* @__PURE__ */ jsxDEV("span", {
                    children: "Tags"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsxDEV("input", {
                    value: newTags,
                    disabled: !canWrite,
                    placeholder: "docs, release",
                    onChange: (event) => setNewTags(event.target.value)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV("button", {
                type: "submit",
                disabled: !canWrite,
                children: "Add item"
              }, undefined, false, undefined, this),
              formError ? /* @__PURE__ */ jsxDEV("span", {
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
export {
  TodoList
};
