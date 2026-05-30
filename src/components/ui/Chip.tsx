import type { ReactNode } from "react";

type ChipProps = {
  children: ReactNode;
  tone?: "green" | "blue" | "orange" | "gray" | "white";
  selected?: boolean;
};

export function Chip({ children, tone = "green", selected = false }: ChipProps) {
  return (
    <span className={`chip chip-${tone} ${selected ? "chip-selected" : ""}`.trim()}>
      {children}
    </span>
  );
}
