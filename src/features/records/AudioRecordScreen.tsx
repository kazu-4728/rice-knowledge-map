"use client";

import { useState, useRef, useEffect } from "react";

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
    <div className="px-4 pt-4 space-y-6">
      <h1 className="text-lg font-bold text-gray-800">音声で記録</h1>

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
          {state === "idle" && "🎤"}
          {state === "recording" && "⏹"}
          {state === "done" && "🔄"}
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
                className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white text-lg"
              >
                ▶
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
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <p className="text-xs text-gray-500 mb-1">候補: A田（現在地から推定）</p>
            <p className="text-xs text-green-600 font-medium">新潟県長岡市 ○○町地内</p>
          </div>

          {/* 次へ */}
          <button
            type="button"
            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-4 rounded-xl transition-colors"
          >
            次へ（AI整理へ）
          </button>
        </>
      )}
    </div>
  );
}
