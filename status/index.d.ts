import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type StatusProps = ({
  label?: string;
  state?: "unknown" | "healthy" | "warning" | "error";
  detail?: string;
  density?: "comfortable" | "compact";
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
  label: string;
  state: "unknown" | "healthy" | "warning" | "error";
  source?: never;
} | {
  label: string;
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
  state?: never;
});
declare function Status(input: LocalComponentRenderProps<StatusProps>): ReactNode;
export default Status;
