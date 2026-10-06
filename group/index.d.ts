import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type GroupProps = {
  title?: string;
  description?: string;
};
declare function Group(input: LocalComponentRenderProps<GroupProps>): ReactNode;
export default Group;
