import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type MarkdownProps = ({
  content?: string;
  path?: string;
  title?: string;
  source?: ({
  shell?: string;
  file?: string;
  http?: string;
  process?: string;
  inline?: unknown;
  every?: number;
  timeoutMs?: number;
  cwd?: string;
  env?: {
  [key: string]: string;
};
}) & ({
  shell: string;
  file?: never;
  http?: never;
  process?: never;
  inline?: never;
} | {
  file: string;
  shell?: never;
  http?: never;
  process?: never;
  inline?: never;
} | {
  http: string;
  shell?: never;
  file?: never;
  process?: never;
  inline?: never;
} | {
  process: string;
  shell?: never;
  file?: never;
  http?: never;
  inline?: never;
} | {
  inline: unknown;
  shell?: never;
  file?: never;
  http?: never;
  process?: never;
});
}) & ({
  content: string;
  path?: never;
  source?: never;
} | {
  path: string;
  content?: never;
  source?: never;
} | {
  source: ({
  shell?: string;
  file?: string;
  http?: string;
  process?: string;
  inline?: unknown;
  every?: number;
  timeoutMs?: number;
  cwd?: string;
  env?: {
  [key: string]: string;
};
}) & ({
  shell: string;
  file?: never;
  http?: never;
  process?: never;
  inline?: never;
} | {
  file: string;
  shell?: never;
  http?: never;
  process?: never;
  inline?: never;
} | {
  http: string;
  shell?: never;
  file?: never;
  process?: never;
  inline?: never;
} | {
  process: string;
  shell?: never;
  file?: never;
  http?: never;
  inline?: never;
} | {
  inline: unknown;
  shell?: never;
  file?: never;
  http?: never;
  process?: never;
});
  content?: never;
  path?: never;
});
declare function Markdown(input: LocalComponentRenderProps<MarkdownProps>): ReactNode;
export default Markdown;
