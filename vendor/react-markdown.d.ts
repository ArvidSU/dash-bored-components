import type { ComponentType, ComponentProps, ReactNode } from "react";

/** Browser dependency prepared by the public component authoring tool.
 * This package uses the synchronous Markdown renderer and these options.
 */
export interface MarkdownOptions {
  children?: string;
  skipHtml?: boolean;
  urlTransform?: (url: string) => string;
  components?: {
    a?: ComponentType<ComponentProps<"a">>;
    img?: ComponentType<ComponentProps<"img">>;
  };
}
export default function Markdown(options: MarkdownOptions): ReactNode;
