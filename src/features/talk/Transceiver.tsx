"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadFarmData } from "../../lib/data/farm";
import { saveRecord } from "../../lib/data/recordSave";
import { IconMic } from "../../components/ui/icons";

/**
 * 音声トランシーバー（田んぼOS レイヤー3）。
 * 「押して話す」: 長押しで即録音 → 指を離すと GPS で田んぼを自動判定して音声記録として送信。
 * 畑で手袋のまま・画面を見ずに使える導線。既存の MediaRecorder / saveRecord を組み替えて実現する。
 */

/** 録音が短すぎる場合は誤操作とみなして破棄する（ミリ秒） */
const MIN_DURATION_MS = 1000;
/** 録音の最大長（秒） */
const MAX_SECONDS = 120;

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

/** 点がリング（経度緯度の多角形）の内側にあるか（ray casting法） */
function pointInRing([x, y]: [number, number], ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** 現在地から田んぼを自動判定する（中にいればその田んぼ、いなければ最寄り） */
async function detectField(): Promise<{
  fieldId: string | null;
  fieldName: string | null;
  location: { lng: number; lat: number } | null;
}> {
  const pos = await new Promise<GeolocationPosition | null>((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  });
  if (!pos) return { fieldId: null, fieldName: null, location: null };
  const here: [number, number] = [pos.coords.longitude, pos.coords.latitude];
  const location = { lng: here[0], lat: here[1] };

  const farm = await loadFarmData();
  if (farm.mode === "error" || farm.mode === "anon") return { fieldId: null, fieldName: null, location };

  let bestId: string | null = null;
  let bestName: string | null = null;
  let bestDist = Infinity;
  for (const f of farm.fieldsGeoJSON.features) {
    if (f.geometry.type !== "Polygon") continue;
    const id = String(f.id ?? f.properties?.id ?? "");
    const name = String(f.properties?.name ?? "");
    const ring = f.geometry.coordinates[0];
    if (pointInRing(here, ring)) return { fieldId: id, fieldName: name, location };
    const pts = ring.slice(0, -1);
    const cx = pts.reduce((s, c) => s + c[0], 0) / pts.length;
    const cy = pts.reduce((s, c) => s + c[1], 0) / pts.length;
    const d = (cx - here[0]) ** 2 + (cy - here[1]) ** 2;
    if (d < bestDist) {
      bestDist = d;
      bestId = id;
      bestName = name;
    }
  }
  return { fieldId: bestId, fieldName: bestName, location };
}

export type TransceiverState = "idle" | "recording" | "saving";

export function useTransceiver(opts: {
  onSaved: (fieldName: string | null) => void;
  onError: (message: string) => void;
}) {
  const { onSaved, onError } = opts;
  const [state, setState] = useState<TransceiverState>("idle");
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startingRef = useRef(false);
  // 離すのが早すぎて getUserMedia 完了前に stop された場合に備える
  const stopRequestedRef = useRef<null | "send" | "cancel">(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    setElapsed(0);
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const finish = useCallback(
    async (blob: Blob | null) => {
      const duration = Date.now() - startedAtRef.current;
      cleanup();
      if (!blob || duration < MIN_DURATION_MS) {
        setState("idle");
        if (duration < MIN_DURATION_MS) onError("録音が短すぎたため送信しませんでした（長押しで話してください）");
        return;
      }
      setState("saving");
      const { fieldId, fieldName, location } = await detectField();
      const result = await saveRecord({
        kind: "audio",
        file: blob,
        previewUrl: null,
        fieldId,
        fieldName,
        pointId: null,
        pointType: null,
        memo: "",
        location,
        recordedAt: new Date().toISOString(),
      });
      setState("idle");
      if (result.status === "saved") {
        onSaved(fieldName);
      } else if (result.status === "demo") {
        onError("デモ環境のため送信されません（録音の流れは本番と同じです）");
      } else {
        onError("送信に失敗しました。通信環境を確認してください");
      }
    },
    [cleanup, onSaved, onError]
  );

  const start = useCallback(async () => {
    if (startingRef.current || state !== "idle") return;
    startingRef.current = true;
    stopRequestedRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 待っている間に指が離されていたら即終了
      if (stopRequestedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        startingRef.current = false;
        stopRequestedRef.current = null;
        return;
      }
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = pickMimeType();
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        void finish(stopRequestedRef.current === "cancel" ? null : blob);
        stopRequestedRef.current = null;
      };
      recorder.start();
      startedAtRef.current = Date.now();
      setElapsed(0);
      setState("recording");
      timerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startedAtRef.current) / 1000);
        setElapsed(sec);
        if (sec >= MAX_SECONDS && recorderRef.current?.state === "recording") {
          stopRequestedRef.current = "send";
          recorderRef.current.stop();
        }
      }, 250);
    } catch {
      onError("マイクを使用できません。ブラウザの許可設定を確認してください");
      setState("idle");
    } finally {
      startingRef.current = false;
    }
  }, [state, finish, onError]);

  const stopAndSend = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      stopRequestedRef.current = "send";
      recorderRef.current.stop();
    } else if (startingRef.current) {
      // getUserMedia 待ちの間に離された
      stopRequestedRef.current = "send";
    }
  }, []);

  const cancel = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      stopRequestedRef.current = "cancel";
      recorderRef.current.stop();
    } else if (startingRef.current) {
      stopRequestedRef.current = "cancel";
    } else {
      cleanup();
      setState("idle");
    }
  }, [cleanup]);

  // 実機のフェイルセーフ: マイク許可ダイアログや長押しジェスチャでボタン側の pointerup が
  // 失われると「離しても録音が止まらない」状態になる。録音中は window の pointerup を
  // バックアップとして拾い（＝画面のどこをタップしても送信）、ページが隠れたら破棄する
  useEffect(() => {
    if (state !== "recording") return;
    const onUp = () => stopAndSend();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") cancel();
    };
    window.addEventListener("pointerup", onUp);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state, stopAndSend, cancel]);

  return { state, elapsed, start, stopAndSend, cancel };
}

/** 録音中／送信中のフルスクリーンオーバーレイ */
export function TransceiverOverlay({
  transceiver,
}: {
  transceiver: Pick<ReturnType<typeof useTransceiver>, "state" | "elapsed" | "stopAndSend" | "cancel">;
}) {
  const { state, elapsed, stopAndSend, cancel } = transceiver;
  if (state === "idle") return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
      {state === "recording" ? (
        <>
          <div className="relative flex h-28 w-28 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
            <span className="absolute inset-2 animate-pulse rounded-full bg-emerald-500/40" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.8)]">
              <IconMic className="h-9 w-9 text-white" />
            </span>
          </div>
          <p className="mt-6 text-2xl font-bold tabular-nums text-white">
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </p>
          <p className="mt-2 text-sm font-semibold text-white/80">録音中… 指を離すと送信します</p>
          {/* pointerupが届かなかった場合の脱出手段（許可ダイアログ・長押しジェスチャ対策） */}
          <div className="mt-8 flex gap-3">
            <button
              onPointerDownCapture={(e) => {
                // windowのpointerupバックアップ（=送信）より先にキャンセルを確定させる
                e.stopPropagation();
                cancel();
              }}
              onClick={cancel}
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-white/85"
            >
              キャンセル
            </button>
            <button
              onClick={stopAndSend}
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-bold text-white"
            >
              送信する
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-emerald-400" />
          <p className="mt-5 text-sm font-semibold text-white/85">田んぼを判定して送信中…</p>
        </>
      )}
    </div>
  );
}

/** 長押しで話すマイクボタン（トーク入力バー用） */
export function TalkMicButton({
  transceiver,
  className = "",
}: {
  transceiver: ReturnType<typeof useTransceiver>;
  className?: string;
}) {
  const { state, start, stopAndSend } = transceiver;
  return (
    <button
      type="button"
      aria-label="長押しで話して記録"
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        void start();
      }}
      onPointerUp={() => stopAndSend()}
      onPointerCancel={() => transceiver.cancel()}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full transition-colors ${
        state === "recording" ? "bg-emerald-500 text-white" : "bg-gray-100 text-green-700 active:bg-emerald-100"
      } ${className}`}
      style={{ touchAction: "none", WebkitUserSelect: "none" }}
    >
      <IconMic className="h-5.5 w-5.5" />
    </button>
  );
}
