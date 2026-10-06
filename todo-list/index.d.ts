import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type TodoListProps = {
  todos?: ({
  id?: string;
  description: string;
  done: boolean;
  tags: (string)[];
})[];
  itemActions?: ({
  name: string;
  action: string | {
  run: string;
  with?: Record<string, unknown>;
};
})[];
};
declare function TodoList(input: LocalComponentRenderProps<TodoListProps>): ReactNode;
export default TodoList;
