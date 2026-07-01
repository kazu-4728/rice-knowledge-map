"use client";

import Link from "next/link";
import { useAuth } from "../../features/auth/useAuth";
import { IconUserFill } from "../ui/icons";

export default function HeaderAccountChip({ hasBack }: { hasBack?: boolean }) {
  const { configured, loading, session } = useAuth();

  if (loading || !configured) return null;

  if (!session) {
    if (hasBack) return null;
    return (
      <Link
        href="/login"
        className="absolute right-3 rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-green-800 transition-colors hover:bg-green-50"
      >
        ログイン
      </Link>
    );
  }

  return (
    <Link
      href="/menu"
      aria-label="アカウント"
      className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 lg:hidden"
    >
      <IconUserFill className="h-5 w-5" />
    </Link>
  );
}
