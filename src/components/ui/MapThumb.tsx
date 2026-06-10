"use client";

import { useState } from "react";
import { IconExpand, IconPinFill } from "./icons";
import { PaddyPhoto } from "./PaddyPhoto";

/** 記録地点の位置サムネイル。航空写真タイルが取得できない場合は風景プレースホルダーに切り替える */
export default function MapThumb({ src, className = "" }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-gray-200 ${className}`}>
      {failed ? (
        <PaddyPhoto variant="field" className="h-full w-full" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="記録地点周辺の航空写真"
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
      <IconPinFill className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-full text-green-700 drop-shadow" />
      <span className="absolute bottom-1.5 right-1.5 rounded bg-black/35 p-1 text-white">
        <IconExpand className="h-3.5 w-3.5" />
      </span>
    </div>
  );
}
