"use client";

import { useEffect } from "react";

/** 本番ビルドでのみService Workerを登録する */
export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service Worker registration failed:", err);
    });
  }, []);

  return null;
}
