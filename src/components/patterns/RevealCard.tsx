"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

/**
 * スクロールで現れるカード（ランディングの reveal パターン）。
 * lib/motion/variants.ts の fadeRise はマウント時1回の演出用、
 * こちらは whileInView によるスクロール連動の演出用として役割を分ける。
 */
export function RevealCard({
  children,
  delay = 0,
  as = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section" | "li";
  className?: string;
}) {
  const MotionTag = motion.create(as);
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      {children}
    </MotionTag>
  );
}
