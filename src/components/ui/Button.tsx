import type { ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  onClick?: () => void;
};

export function Button({
  children,
  icon,
  variant = "primary",
  className = "",
  onClick,
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`button button-${variant} ${className}`.trim()}
      onClick={onClick}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
