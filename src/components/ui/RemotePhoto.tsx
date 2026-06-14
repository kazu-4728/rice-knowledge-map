"use client";

import { useEffect, useRef, useState } from "react";
import { PaddyPhoto } from "./PaddyPhoto";

type Variant = "field" | "water" | "grass" | "sprout";

type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackVariant?: Variant;
};

/** 外部/署名URLの画像を表示し、読み込み失敗時はPaddyPhoto SVGにフォールバックする */
export function RemotePhoto({ src, alt = "", className = "", fallbackVariant = "field" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // srcが変わるたびにフェードをやり直す。キャッシュ済みで onLoad が発火しない場合は
  // complete を見て即表示する（透明のまま固まるのを防ぐ）
  useEffect(() => {
    setLoaded(false);
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, [src]);

  if (!src || failedSrc === src) {
    return <PaddyPhoto variant={fallbackVariant} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.4s ease" }}
      onLoad={() => setLoaded(true)}
      onError={() => setFailedSrc(src)}
    />
  );
}
