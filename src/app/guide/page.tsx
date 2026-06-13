import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import { IconChevronLeft } from "../../components/ui/icons";
import GuideContent from "../../features/guide/GuideContent";

export default function GuidePage() {
  return (
    <AppShell backDynamic backLabel="戻る">
      <GuideContent />
    </AppShell>
  );
}
