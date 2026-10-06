import "./component.css";
// src/renderer/builtins/tabs/index.tsx
import { useEffect, useId, useMemo, useState } from "react";

// src/renderer/builtins/shared.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
function stringProp(props, names, fallback = "") {
  for (const name of names) {
    if (typeof props[name] === "string")
      return props[name];
  }
  return fallback;
}

// src/renderer/builtins/tabs/index.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
function Tabs({ props, children, host }) {
  const panels = children?.type === "managed" ? children.items : [];
  const requestedDefault = props.defaultTab;
  const defaultIndex = typeof requestedDefault === "number" && Number.isInteger(requestedDefault) && requestedDefault >= 0 && requestedDefault < panels.length ? requestedDefault : 0;
  const [active, setActive] = useState(defaultIndex);
  const id = useId().replaceAll(":", "");
  useEffect(() => {
    if (active >= panels.length)
      setActive(defaultIndex);
  }, [active, defaultIndex, panels.length]);
  const tabOptionsKey = JSON.stringify(panels.map((panel) => ({ value: panel.id, label: typeof panel.metadata.label === "string" ? panel.metadata.label : panel.displayName })));
  const tabOptions = useMemo(() => JSON.parse(tabOptionsKey), [tabOptionsKey]);
  useEffect(() => host.actions.register({
    id: "select",
    label: "Select tab",
    enabled: tabOptions.length > 0,
    disabledReason: "This tab group has no tabs.",
    choices: [{ id: "child", label: "Choose a tab", options: () => tabOptions }],
    run: (selections, args) => {
      const target = args?.child ?? selections?.child;
      const index = tabOptions.findIndex((option) => option.value === target);
      if (index < 0)
        throw new Error("Choose a direct child of this tab group.");
      setActive(index);
    }
  }), [host.actions, tabOptions]);
  function selectFromKeyboard(event, index) {
    let nextIndex = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      nextIndex = (index + 1) % panels.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      nextIndex = (index - 1 + panels.length) % panels.length;
    else if (event.key === "Home")
      nextIndex = 0;
    else if (event.key === "End")
      nextIndex = panels.length - 1;
    if (nextIndex === null)
      return;
    event.preventDefault();
    setActive(nextIndex);
    document.getElementById(`${id}-tab-${nextIndex}`)?.focus();
  }
  if (panels.length === 0)
    return /* @__PURE__ */ jsxDEV2("div", {
      className: "component-state",
      children: "This tab group has no tabs."
    }, undefined, false, undefined, this);
  return /* @__PURE__ */ jsxDEV2("section", {
    className: "tabs",
    children: [
      /* @__PURE__ */ jsxDEV2("div", {
        className: "tabs__list",
        role: "tablist",
        "aria-label": stringProp(props, ["label"], "Dashboard sections"),
        children: panels.map((panel, index) => {
          const selected = index === active;
          return /* @__PURE__ */ jsxDEV2("button", {
            className: "tabs__tab",
            id: `${id}-tab-${index}`,
            type: "button",
            role: "tab",
            "aria-selected": selected,
            "aria-controls": `${id}-panel-${index}`,
            tabIndex: selected ? 0 : -1,
            onClick: () => setActive(index),
            onKeyDown: (event) => selectFromKeyboard(event, index),
            children: typeof panel.metadata.label === "string" && panel.metadata.label.trim() ? panel.metadata.label : panel.displayName
          }, panel.id, false, undefined, this);
        })
      }, undefined, false, undefined, this),
      panels.map((panel, index) => /* @__PURE__ */ jsxDEV2("div", {
        className: "tabs__panel",
        id: `${id}-panel-${index}`,
        role: "tabpanel",
        "aria-labelledby": `${id}-tab-${index}`,
        hidden: index !== active,
        children: panel.render({ visible: index === active })
      }, panel.id, false, undefined, this))
    ]
  }, undefined, true, undefined, this);
}
export {
  Tabs as default
};
