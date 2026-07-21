import { Suspense } from "react";
import HomeGate from "../features/home/HomeGate";

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-flow-cream" />}>
      <HomeGate />
    </Suspense>
  );
}
