import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type SelectionProps = {
  defaultChild?: string;
  label?: string;
};
declare function Selection(input: LocalComponentRenderProps<SelectionProps>): ReactNode;
export default Selection;
