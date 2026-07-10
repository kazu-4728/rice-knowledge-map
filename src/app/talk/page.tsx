import { Suspense } from "react";
import AppShell from "../../components/layout/AppShell";
import TalkScreen from "../../features/talk/TalkScreen";

export const metadata = { title: "今日の流れ | みらい稲作管理" };

export default function TalkPage() {
  return (
    <AppShell fullBleed>
      <Suspense fallback={null}>
        <TalkScreen />
      </Suspense>
    </AppShell>
  );
}
