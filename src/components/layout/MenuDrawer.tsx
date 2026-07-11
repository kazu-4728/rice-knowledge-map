"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../features/auth/useAuth";
import { NAV_ITEMS, SUB_NAV_ITEMS, isNavActive } from "./navItems";
import { Drawer, DrawerContent, DrawerClose, DrawerTitle } from "../ui/drawer";
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

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <Drawer open={open} onOpenChange={(next) => { if (!next) onClose(); }} direction="bottom" shouldScaleBackground={false}>
      <DrawerContent
        direction="bottom"
        className="max-h-[85dvh] rounded-t-3xl bg-white p-0 shadow-2xl"
        aria-describedby={undefined}
      >
        <DrawerTitle className="sr-only">メニュー</DrawerTitle>
        {/* header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-50">
              <LogoRice className="h-5 w-5" />
            </span>
            <span className="font-heading text-base font-bold tracking-tight text-gray-900">
              みらい稲作管理
            </span>
          </div>
          <DrawerClose
            aria-label="メニューを閉じる"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <IconClose className="h-5 w-5" />
          </DrawerClose>
        </div>

        {/* 主要4タブ（3空間+田んぼストーリー+管理レイヤー）: 大きいアイコンタイルのグリッド */}
        <div role="navigation" aria-label="メインメニュー" className="flex-1 overflow-y-auto px-4 pb-3">
          <div className="grid grid-cols-4 gap-2">
            {NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = isNavActive(href, pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl px-1.5 py-3.5 text-[11px] font-bold transition-all active:scale-95 ${
                    active
                      ? "bg-gradient-to-br from-emerald-500 to-green-700 text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.65)]"
                      : "bg-gray-50 text-gray-700"
                  }`}
                >
                  <Icon className="h-6 w-6 shrink-0" strokeWidth={active ? 2.1 : 1.8} />
                  {label}
                </Link>
              );
            })}
          </div>

          <p className="px-1 pb-1.5 pt-5 text-[11px] font-bold uppercase tracking-wider text-gray-400">その他</p>
          <div className="space-y-0.5">
            {SUB_NAV_ITEMS.map(({ href, label, Icon }) => {
              const active = isNavActive(href, pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-gray-600 hover:bg-gray-50"
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
        </div>

        {/* account */}
        <div className="border-t border-gray-100 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
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
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(16,185,129,0.6)] transition-colors"
            >
              ログイン
            </Link>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
