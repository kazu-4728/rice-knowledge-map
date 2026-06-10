"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { IconMic, IconPinFill, IconPlayFill } from "../../components/ui/icons";

type RecordState = "idle" | "recording" | "done";

export default function AudioRecordScreen() {
  const [state, setState] = useState<RecordState>("idle");
  const [elapsed, setElapsed] = useState(0);
  // interval ID を ref で保持し、停止・unmount 時に確実に clearInterval する
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // unmount 時に残存 interval を確実にクリア
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, []);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleRecord = () => {
    if (state === "idle") {
      setState("recording");
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          if (s >= 59) {
            stopTimer();
            setState("done");
            return s;
          }
          return s + 1;
        });
      }, 1000);
    } else if (state === "recording") {
      stopTimer();
      setState("done");
    } else {
      // やり直し
      stopTimer();
      setState("idle");
      setElapsed(0);
    }
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      <h1 className="px-1 text-2xl font-bold text-gray-900">音声で記録</h1>

      {/* 録音エリア */}
      <div className="bg-gray-900 rounded-2xl py-12 flex flex-col items-center gap-6">
        {/* 波形ビジュアル（ダミー） */}
        <div className="flex items-end gap-1 h-12">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                state === "recording" ? "bg-green-400" : "bg-gray-600"
              }`}
              style={{ height: state === "recording" ? `${12 + ((i * 7 + elapsed) % 24)}px` : "8px" }}
            />
          ))}
        </div>

        {/* タイマー */}
        <p className="text-white text-3xl font-mono tracking-widest">
          {formatTime(elapsed)}
        </p>

        {/* 録音ボタン */}
        <button
          type="button"
          onClick={handleRecord}
          aria-label={state === "idle" ? "録音開始" : state === "recording" ? "録音停止" : "録音やり直し"}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg transition-all ${
            state === "recording"
              ? "bg-red-500 hover:bg-red-600 animate-pulse"
              : state === "done"
              ? "bg-gray-600 hover:bg-gray-500"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {state === "idle" && <IconMic className="h-8 w-8 text-white" />}
          {state === "recording" && <span className="h-6 w-6 rounded bg-white" />}
          {state === "done" && <span className="text-white">↺</span>}
        </button>

        <p className="text-gray-400 text-xs">
          {state === "idle" && "タップして録音開始"}
          {state === "recording" && "タップして停止"}
          {state === "done" && "タップしてやり直し"}
        </p>
      </div>

      {/* 録音完了時: 再生・候補地 */}
      {state === "done" && (
        <>
          {/* 再生バー */}
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="再生"
                className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center"
              >
                <IconPlayFill className="h-4 w-4 translate-x-[1px] text-white" />
              </button>
              <div className="flex-1">
                <div className="h-1.5 bg-gray-200 rounded-full">
                  <div className="h-1.5 bg-green-500 rounded-full w-0" />
                </div>
              </div>
              <span className="text-xs text-gray-500">{formatTime(elapsed)}</span>
            </div>
          </div>

          {/* 候補地 */}
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm">
            <IconPinFill className="h-6 w-6 shrink-0 text-green-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-gray-900">候補: A田（現在地から推定）</p>
              <p className="mt-0.5 text-xs text-gray-500">新潟県長岡市 ○○町地内</p>
            </div>
          </div>

          {/* 次へ */}
          <Link
            href="/records/new/confirm"
            className="block w-full rounded-xl bg-green-700 py-4 text-center text-sm font-bold text-white transition-colors hover:bg-green-800"
          >
            次へ（AI整理へ）
          </Link>
        </>
      )}
    </div>
  );
}
