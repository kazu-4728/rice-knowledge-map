import * as React from "react";

import { cn } from "@/lib/utils";
import type { StatusKey } from "./StatusBadge";

/** カード左端のアクセントバー色（StatusBadgeの信号色と統一） */
const CARD_ACCENT: Record<StatusKey, string> = {
  normal: "border-l-4 border-l-emerald-500",
  needs_check: "border-l-4 border-l-amber-500",
  issue: "border-l-4 border-l-red-500",
  open: "border-l-4 border-l-red-500",
  resolved: "border-l-4 border-l-blue-500",
  monitoring: "border-l-4 border-l-gray-400",
};

/** カードの型は1種類（田んぼOSデザイン原則）。影の強弱で階調を分けない */
const CARD_SHADOW = "shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 左端に信号色のアクセントバーを付ける（田んぼOS共通の優先度表現） */
  accent?: StatusKey;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        CARD_SHADOW,
        accent && CARD_ACCENT[accent],
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
