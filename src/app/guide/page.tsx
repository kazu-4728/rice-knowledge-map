import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import { IconChevronLeft } from "../../components/ui/icons";
import GuideContent from "../../features/guide/GuideContent";

export default function GuidePage() {
  return (
    <AppShell>
      <div className="relative">
        <Link
          href="/"
          className="absolute left-0 top-0 z-10 p-3 text-gray-600"
          aria-label="ホームに戻る"
        >
          <IconChevronLeft className="h-5 w-5" />
        </Link>
        <div className="pt-1">
          <GuideContent />
        </div>
      </div>
    </AppShell>
  );
}
