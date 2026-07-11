"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../features/auth/useAuth";
import { NAV_ITEMS, SUB_NAV_ITEMS, isNavActive } from "./navItems";
import {
  IconUser,
  LogoRice,
} from "../ui/icons";

export default function SideNav() {
  const pathname = usePathname();
  const { session, signOut } = useAuth();

  return (
    <nav className="hidden lg:flex print:hidden h-dvh w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* logo（ホームへの常設導線） */}
      <Link
        href="/home"
        className="flex h-14 items-center gap-1.5 border-b border-gray-100 px-4"
      >
        <LogoRice className="h-7 w-7" />
        <span className="text-base font-bold tracking-tight text-green-700">
          みらい稲作管理
        </span>
      </Link>

      {/* links */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-base font-bold transition-colors ${
                active
                  ? "bg-green-50 text-green-700"
                  : "text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Icon
                className="h-6 w-6 shrink-0"
                strokeWidth={active ? 2.1 : 1.8}
              />
              {label}
            </Link>
          );
        })}

        <p className="px-3 pb-1 pt-4 text-[11px] font-bold text-gray-400">その他</p>
        {SUB_NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isNavActive(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
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
              onClick={() => signOut()}
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
  );
}
