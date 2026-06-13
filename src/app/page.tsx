"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadSiteContent, type HeroSlide } from "../lib/data/siteContent";
import { RemotePhoto } from "../components/ui/RemotePhoto";
import { IconChevronRight, LogoRice } from "../components/ui/icons";

const SLIDE_INTERVAL_MS = 6000;

function SplashHero({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    let t: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setTransitioning(true);
      t = setTimeout(() => { setCurrent((c) => (c + 1) % total); setTransitioning(false); }, 600);
    }, SLIDE_INTERVAL_MS);
    return () => { clearInterval(timer); clearTimeout(t); };
  }, [total]);

  const slide = slides[current] ?? slides[0];
  if (!slide) return null;

  return (
    <div className={`absolute inset-0 transition-opacity duration-700 ${transitioning ? "opacity-0" : "opacity-100"}`} key={current}>
      <RemotePhoto
        src={slide.image_url}
        alt={slide.title}
        className="h-full w-full object-cover animate-hero-zoom"
        fallbackVariant={current % 2 === 0 ? "field" : "water"}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />
      <div className="absolute bottom-44 left-0 right-0 px-8 animate-rise" key={`text-${current}`}>
        <h2 className="text-xl font-bold leading-snug text-white drop-shadow text-center">
          {slide.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-white/85 drop-shadow text-center">
          {slide.body}
        </p>
      </div>
      {total > 1 && (
        <div className="absolute bottom-32 left-0 right-0 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
              aria-label={`スライド ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SplashPage() {
  const router = useRouter();
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("app_entered") === "1") {
      router.replace("/home");
      return;
    }
    loadSiteContent().then((r) => setSlides(r.slides));
  }, [router]);

  const enter = () => {
    sessionStorage.setItem("app_entered", "1");
    router.push("/home");
  };

  return (
    <div className="relative flex h-dvh max-w-md mx-auto flex-col items-center justify-end overflow-hidden bg-black">
      {slides && <SplashHero slides={slides} />}

      <div className="absolute top-14 left-0 right-0 flex flex-col items-center gap-2 z-10">
        <LogoRice className="w-12 h-12 text-white drop-shadow-lg" />
        <span className="text-white font-bold text-xl tracking-tight drop-shadow-lg">みらい稲作管理</span>
      </div>

      <div className="relative z-10 w-full px-8 pb-16">
        <button
          onClick={enter}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600/90 backdrop-blur-sm py-4 text-base font-bold text-white shadow-lg transition-colors hover:bg-green-600 active:scale-95"
        >
          アプリへ入る
          <IconChevronRight className="h-5 w-5" />
        </button>
        <p className="mt-3 text-center text-xs text-white/60">田んぼの記録と知恵を、次の世代へ</p>
      </div>
    </div>
  );
}
