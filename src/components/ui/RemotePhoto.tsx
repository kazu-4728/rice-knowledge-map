"use client";

import { useState } from "react";
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

  if (!src || failedSrc === src) {
    return <PaddyPhoto variant={fallbackVariant} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
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
