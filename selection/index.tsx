// src/renderer/builtins/selection/index.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
function Selection({ children }) {
  if (children?.type !== "managed")
    return null;
  return /* @__PURE__ */ jsxDEV("div", {
    className: "selection-container",
    children: children.items.map((child) => child.render())
  }, undefined, false, undefined, this);
}
export {
  Selection as default
};
