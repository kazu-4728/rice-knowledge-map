import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { IconChevronRight } from "../ui/icons";
import { SectionEyebrow } from "./SectionEyebrow";

const TONE_GRADIENT: Record<"emerald" | "amber" | "sky", string> = {
  emerald: "from-emerald-800 via-emerald-700 to-green-900",
  amber: "from-amber-700 via-amber-600 to-orange-800",
  sky: "from-sky-800 via-sky-700 to-blue-900",
};

const TONE_GLOW_A: Record<"emerald" | "amber" | "sky", string> = {
  emerald: "bg-emerald-400/30",
  amber: "bg-amber-300/30",
  sky: "bg-sky-300/30",
};

const TONE_GLOW_B: Record<"emerald" | "amber" | "sky", string> = {
  emerald: "bg-lime-300/20",
  amber: "bg-orange-200/20",
  sky: "bg-cyan-200/20",
};

/**
 * ランディング最終CTAの「bg-gradient-to-br + 2つのblur-3xl円」グローカードを部品化。
 * /home の農事暦ヒーロー・/fields/[id] の統計ヒーロー等で使う。
 */
export function GlowCTACard({
  tone = "emerald",
  icon,
  eyebrow,
  title,
  description,
  action,
  children,
  className,
}: {
  tone?: "emerald" | "amber" | "sky";
  icon?: ReactNode;
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: { label: string; href: string };
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-gradient-to-br p-4 text-white shadow-[0_16px_40px_-16px_rgba(6,78,59,0.6)]",
        TONE_GRADIENT[tone],
        className
      )}
    >
      <span className={cn("pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full blur-3xl", TONE_GLOW_A[tone])} />
      <span className={cn("pointer-events-none absolute -bottom-10 -left-6 h-32 w-32 rounded-full blur-3xl", TONE_GLOW_B[tone])} />
      <div className="relative">
        {eyebrow && <SectionEyebrow tone="dark" className="mb-2">{eyebrow}</SectionEyebrow>}
        <div className="flex items-start gap-3">
          {icon && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-bold">{title}</p>
            {description && <p className="mt-0.5 text-sm text-white/85">{description}</p>}
          </div>
        </div>
        {children && <div className="mt-3">{children}</div>}
        {action && (
          <Button asChild variant="primary" className="mt-3 w-full">
            <Link href={action.href}>
              {action.label}
              <IconChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
}
