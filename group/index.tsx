import type { ReactNode } from "react";
import type { ComponentRendererProps } from "../shared/types";
import { childSurface, stringProp } from "../shared/shared";
import "./group.css";

/** A titled group is a section heading over its children, not another box. */
export default function Group({ props, children }: ComponentRendererProps): ReactNode {
  const title = stringProp(props, ["title"]);
  const description = stringProp(props, ["description"]);
  if (!title && !description) return childSurface(children);
  return <section className="group">
    <header className="group__header">
      {title ? <h2>{title}</h2> : null}
      {description ? <p>{description}</p> : null}
    </header>
    <div className="group__body">{childSurface(children)}</div>
  </section>;
}
