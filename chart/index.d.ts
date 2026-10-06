import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type ChartProps = ({
  title?: string;
  type?: "line" | "bar";
  maxPoints?: number;
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
  labels?: (string)[];
  series?: ({
  label: string;
  values: (number | null)[];
  color?: string;
})[];
}) & ({
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
  labels?: never;
  series?: never;
} | {
  labels: (string)[];
  series: ({
  label: string;
  values: (number | null)[];
  color?: string;
})[];
  source?: never;
});
declare function Chart(input: LocalComponentRenderProps<ChartProps>): ReactNode;
export default Chart;
