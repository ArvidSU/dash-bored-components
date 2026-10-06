import type { LocalComponentRenderProps } from "@dash-bored/component";
import type { ReactNode } from "react";

export type CardProps = {
  title?: string;
  description?: string;
};
declare function Card(input: LocalComponentRenderProps<CardProps>): ReactNode;
export default Card;
