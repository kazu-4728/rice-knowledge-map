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

/**
 * 外部/署名URLの画像をフェードインで表示する。
 * srcが差し替わったとき（オーナーがカバー写真を変更した直後など）は、
 * 直前まで表示していた画像を下敷きに残したままクロスフェードする。
 * 読み込み失敗時はPaddyPhoto SVGにフォールバックする。
 */
export function RemotePhoto({ src, alt = "", className = "", fallbackVariant = "field" }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  // 直前まで表示できていた画像。src差し替え時のクロスフェードの下敷きに使う
  const [underlaySrc, setUnderlaySrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const shownSrcRef = useRef<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markShown = (shown: string) => {
    shownSrcRef.current = shown;
    setLoaded(true);
    // フェード完了後に下敷きを外す（重ね続けるとメモリと合成コストが無駄になる）
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => setUnderlaySrc(null), 700);
  };

  // srcが変わるたびにフェードをやり直す。キャッシュ済みで onLoad が発火しない場合は
  // complete を見て即表示する（透明のまま固まるのを防ぐ）
  useEffect(() => {
    setLoaded(false);
    if (shownSrcRef.current && shownSrcRef.current !== src) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setUnderlaySrc(shownSrcRef.current);
    }
    if (src && imgRef.current?.complete && imgRef.current.naturalWidth > 0) markShown(src);
  }, [src]);

  useEffect(() => () => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
  }, []);

  if (!src || failedSrc === src) {
    return <PaddyPhoto variant={fallbackVariant} className={className} />;
  }

  // 呼び出し側が位置指定（absolute等）を渡す場合はそれを尊重し、
  // そうでなければクロスフェード用のレイヤー基準としてrelativeを与える
  const positioned = /(^|\s)(absolute|fixed|relative)(\s|$)/.test(className);
  return (
    <div className={`${positioned ? "" : "relative "}overflow-hidden ${className}`}>
      {underlaySrc && (
        // eslint-disable-next-line @next/next/no-img-element -- 署名URL（有効期限つき）のため next/image を使わない
        <img
          src={underlaySrc}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- 署名URL（有効期限つき）のため next/image を使わない */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.6s ease" }}
        onLoad={() => markShown(src)}
        onError={() => setFailedSrc(src)}
      />
    </div>
  );
}
