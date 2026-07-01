"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../features/auth/useAuth";
import { NAV_ITEMS, isNavActive } from "./navItems";
import {
  IconClose,
  IconUser,
  LogoRice,
} from "../ui/icons";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MenuDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      {/* drawer */}
      <nav
        ref={drawerRef}
        className={`fixed left-0 top-0 z-50 flex h-dvh w-72 flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* header */}
        <div className="flex h-14 items-center justify-between bg-green-800 px-4">
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95">
              <LogoRice className="h-5 w-5" />
            </span>
            <span className="text-base font-bold tracking-tight text-white">
              みらい稲作管理
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="メニューを閉じる"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        {/* nav links */}
        <div className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isNavActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  strokeWidth={active ? 2.1 : 1.8}
                />
                {label}
              </Link>
            );
          })}
        </div>

        {/* account */}
        <div className="border-t border-gray-100 px-3 py-3">
          {session ? (
            <>
              <div className="flex items-center gap-2.5 px-3 py-1">
                <IconUser className="h-5 w-5 shrink-0 text-gray-400" />
                <span className="truncate text-xs text-gray-500">
                  {session.user.email}
                </span>
              </div>
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-green-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
            >
              ログイン
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
