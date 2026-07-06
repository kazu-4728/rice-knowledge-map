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

/** カードの階調（情報の優先度を影の強さで表現する） */
const ELEVATION: Record<"flat" | "raised" | "floating", string> = {
  flat: "shadow-[0_1px_4px_-1px_rgba(16,40,28,0.08)]",
  raised: "shadow-[0_8px_24px_-10px_rgba(16,40,28,0.18)]",
  floating: "shadow-[0_16px_40px_-12px_rgba(16,40,28,0.28)]",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 左端に信号色のアクセントバーを付ける（田んぼOS共通の優先度表現） */
  accent?: StatusKey;
  /** 影の階調（既定はraised。密度の高い一覧はflat、強調ブロックはfloating） */
  elevation?: "flat" | "raised" | "floating";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, accent, elevation = "raised", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground",
        ELEVATION[elevation],
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
