"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft } from "../ui/icons";

type Props = {
  label?: string;
  href?: string;
};

export default function BackButton({ label = "戻る", href }: Props) {
  const router = useRouter();
  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute left-2 flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-50 active:bg-green-100"
    >
      <IconChevronLeft className="h-4.5 w-4.5" />
      {label}
    </button>
  );
}
