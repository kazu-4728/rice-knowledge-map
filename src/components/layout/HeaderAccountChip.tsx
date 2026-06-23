"use client";

import Link from "next/link";
import { useAuth } from "../../features/auth/useAuth";
import { IconUserFill } from "../ui/icons";

export default function HeaderAccountChip() {
  const { configured, loading, session } = useAuth();

  if (loading || !configured) return null;

  if (!session) {
    return (
      <Link
        href="/login"
        className="absolute right-3 rounded-full bg-green-700 px-3.5 py-1.5 text-sm font-bold text-white transition-colors hover:bg-green-800"
      >
        ログイン
      </Link>
    );
  }

  return (
    <Link
      href="/menu"
      aria-label="アカウント"
      className="absolute right-2 flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700 transition-colors hover:bg-green-200 lg:hidden"
    >
      <IconUserFill className="h-5 w-5" />
    </Link>
  );
}
