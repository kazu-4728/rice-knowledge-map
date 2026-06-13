"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCamera, IconMic, IconPlus } from "./icons";

type FABAction = {
  href: string;
  icon: React.ReactNode;
  label: string;
  color: string;
};

type Props = {
  actions: FABAction[];
};

export default function FAB({ actions }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* オーバーレイ */}
      {open && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="fixed bottom-20 right-4 z-40 flex flex-col-reverse items-end gap-3">
        {/* サブアクション */}
        {open && actions.map((action, i) => (
          <div
            key={action.href}
            className="flex items-center gap-2.5 animate-fab-pop"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-700 shadow-md backdrop-blur-sm">
              {action.label}
            </span>
            <Link
              href={action.href}
              onClick={() => setOpen(false)}
              className={`flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90 ${action.color}`}
            >
              {action.icon}
            </Link>
          </div>
        ))}

        {/* メインボタン */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all active:scale-90 ${
            open ? "bg-gray-700 rotate-45" : "bg-green-600"
          }`}
          aria-label="記録を追加"
        >
          <IconPlus className="h-7 w-7 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}
