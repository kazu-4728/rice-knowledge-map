import { Suspense } from "react";
import AppShell from "../../components/layout/AppShell";
import TalkScreen from "../../features/talk/TalkScreen";

export const metadata = { title: "トーク | みらい稲作管理" };

export default function TalkPage() {
  return (
    <AppShell fullBleed>
      <Suspense fallback={null}>
        <TalkScreen />
      </Suspense>
    </AppShell>
  );
}
