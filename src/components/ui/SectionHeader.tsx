import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  icon?: ReactNode;
  action?: string;
};

export function SectionHeader({ title, icon, action }: SectionHeaderProps) {
  return (
    <div className="sectionHeader">
      <h2>
        {icon}
        <span>{title}</span>
      </h2>
      {action ? <button type="button">{action}</button> : null}
    </div>
  );
}
