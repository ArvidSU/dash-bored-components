import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type ListProps = ({
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
  todos?: ({
  id: string;
  description: string;
  done: boolean;
  tags: (string)[];
})[];
  filterByTags?: boolean;
  sort?: "open-first" | "source-order";
  highlightChanges?: boolean;
  itemActions?: ({
  name: string;
  action: string | {
  run: string;
  with?: Record<string, unknown>;
};
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
  todos?: never;
} | {
  todos: ({
  id: string;
  description: string;
  done: boolean;
  tags: (string)[];
})[];
  source?: never;
});
declare function List(input: LocalComponentRenderProps<ListProps>): ReactNode;
export default List;
