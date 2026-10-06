import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type ButtonProps = ({
  name?: string;
  action?: string | {
  run: string;
  with?: Record<string, unknown>;
};
  label?: string;
  variant?: "buttons" | "segmented" | "tabs";
  items?: ({
  name: string;
  action: string | {
  run: string;
  with?: Record<string, unknown>;
};
})[];
}) & ({
  name: string;
  action: string | {
  run: string;
  with?: Record<string, unknown>;
};
  items?: never;
} | {
  items: ({
  name: string;
  action: string | {
  run: string;
  with?: Record<string, unknown>;
};
})[];
  name?: never;
  action?: never;
});
declare function Button(input: LocalComponentRenderProps<ButtonProps>): ReactNode;
export default Button;
