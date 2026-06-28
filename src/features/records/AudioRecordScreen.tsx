"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getRecordDraft, setRecordDraft } from "./recordDraft";
import { useRecordFields } from "./useRecordFields";
import { loadFarmData } from "../../lib/data/farm";
import type { FieldPointType } from "../../types";

const VALID_POINT_TYPES = new Set<string>(["inlet","outlet","canal","weed","caution","levee_damage","poor_drainage","other"]);
import {
  IconChevronRight,
  IconDropFill,
  IconMic,
  IconPinFill,
  IconSprout,
  IconWarningFill,
  IconWaves,
} from "../../components/ui/icons";
import { VoiceInputButton } from "../../components/ui/VoiceInputButton";

const pointTypes: { type: FieldPointType; icon: React.ReactNode; label: string }[] = [
  { type: "inlet", icon: <IconDropFill className="h-6 w-6 text-sky-500" />, label: "入水口" },
  { type: "outlet", icon: <IconWaves className="h-6 w-6 text-blue-500" />, label: "出水口" },
  { type: "weed", icon: <IconSprout className="h-6 w-6 text-green-600" />, label: "雑草" },
  { type: "caution", icon: <IconWarningFill className="h-6 w-6 text-amber-500" />, label: "異常" },
];

/** 録音の最大長（秒）。ファイルサイズと聞き直しやすさのため短めに区切る */
const MAX_SECONDS = 120;

/**
 * 端末が録音できるmimeTypeを選ぶ。
 * Chrome/Android: audio/webm(opus)、iOS Safari: audio/mp4(AAC)。
 */
function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

type RecState = "idle" | "recording" | "done";

export default function AudioRecordScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [recState, setRecState] = useState<RecState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audio, setAudio] = useState<{ blob: Blob; previewUrl: string } | null>(null);
  const { fields, selectedFieldId, setSelectedFieldId, location, setLocation, needLogin, farmError } =
    useRecordFields();
  const [pointType, setPointType] = useState<FieldPointType | null>(null);
  const [pointId, setPointId] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 「修正する」で戻ってきたとき、録音日時を引き継ぐ（録り直したらリセット）
  const recordedAtRef = useRef<string | null>(null);
  // getUserMedia待ちの多重起動を防ぐフラグ
  const startingRef = useRef(false);
  // unmount済みフラグ（awaitの後の後処理を防ぐ）
  const unmountedRef = useRef(false);
  // 「次へ」でpreviewUrlをdraftに渡した後はunmount時にrevokeしない
  const urlHandedOffRef = useRef(false);

  // 「修正する」で戻ってきたときは下書きを復元する
  useEffect(() => {
    const draft = getRecordDraft();
    if (draft?.kind === "audio") {
      if (draft.file && draft.previewUrl) {
        setAudio({ blob: draft.file, previewUrl: draft.previewUrl });
        setRecState("done");
      }
      setSelectedFieldId(draft.fieldId);
      setPointType(draft.pointType);
      setPointId(draft.pointId ?? null);
      setMemo(draft.memo);
      setLocation(draft.location);
      recordedAtRef.current = draft.recordedAt;
    } else {
      const fieldParam = searchParams.get("field");
      const pointParam = searchParams.get("point");
      const rawPointType = searchParams.get("pointType");
      const pointTypeParam: FieldPointType | null = rawPointType && VALID_POINT_TYPES.has(rawPointType) ? rawPointType as FieldPointType : null;
      if (fieldParam) setSelectedFieldId(fieldParam);
      if (pointParam) {
        setPointId(pointParam);
        if (pointTypeParam) {
          setPointType(pointTypeParam);
        } else {
          loadFarmData().then((farm) => {
            const pt = farm.points.find((p) => p.id === pointParam);
            if (pt) setPointType(pt.type);
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- マウント時に1回だけ復元する
  }, []);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  // unmount時にタイマー・マイク・Object URLを確実に解放する
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
      stopTimer();
      if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
      stopStream();
      if (!urlHandedOffRef.current) {
        setAudio((prev) => {
          if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
          return prev;
        });
      }
    };
  }, []);

  const startRecording = async () => {
    if (startingRef.current || recState !== "idle") return;
    setMessage(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMessage("この端末・ブラウザでは録音に対応していません");
      return;
    }
    startingRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (unmountedRef.current || recState !== "idle") {
        stream.getTracks().forEach((t) => t.stop());
        startingRef.current = false;
        return;
      }
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        stopStream();
        if (blob.size === 0) {
          setMessage("録音できませんでした。もう一度お試しください");
          setRecState("idle");
          return;
        }
        setAudio((prev) => {
          if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
          return { blob, previewUrl: URL.createObjectURL(blob) };
        });
        recordedAtRef.current = null;
        setRecState("done");
      };
      recorder.start();
      startingRef.current = false;
      setElapsed(0);
      setRecState("recording");
      timerRef.current = setInterval(() => {
        setElapsed((s) => {
          if (s + 1 >= MAX_SECONDS) {
            stopTimer();
            if (recorderRef.current?.state === "recording") recorderRef.current.stop();
            return MAX_SECONDS;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn("[audio] getUserMedia failed", err);
      stopStream();
      startingRef.current = false;
      if (!unmountedRef.current) {
        setMessage("マイクを使用できませんでした。ブラウザのマイク許可を確認してください");
      }
    }
  };

  const stopRecording = () => {
    stopTimer();
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  };

  const retake = () => {
    setAudio((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    setRecState("idle");
    setElapsed(0);
    setMessage(null);
  };

  const handleMainButton = () => {
    if (recState === "idle") startRecording();
    else if (recState === "recording") stopRecording();
    else retake();
  };

  const handleNext = () => {
    if (!audio) {
      setMessage("先に音声を録音してください");
      return;
    }
    const selected = fields.find((f) => f.id === selectedFieldId) ?? null;
    // 田んぼ一覧の読み込みが終わる前に「修正する」から進み直した場合は、元の下書きの田んぼを引き継ぐ
    const prev = getRecordDraft();
    const restored = !selected && selectedFieldId && prev?.fieldId === selectedFieldId ? prev : null;
    urlHandedOffRef.current = true;
    setRecordDraft({
      kind: "audio",
      file: audio.blob,
      previewUrl: audio.previewUrl,
      fieldId: selected?.id ?? restored?.fieldId ?? null,
      fieldName: selected?.name ?? restored?.fieldName ?? null,
      pointId,
      pointType,
      memo,
      location,
      recordedAt: recordedAtRef.current ?? new Date().toISOString(),
    });
    const returnTo = searchParams.get("returnTo");
    const confirmUrl = returnTo ? `/records/new/confirm?returnTo=${encodeURIComponent(returnTo)}` : "/records/new/confirm";
    router.push(confirmUrl);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      <h1 className="px-1 text-2xl font-bold text-gray-900">音声で記録</h1>

      {needLogin && (() => {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.has("type")) params.set("type", "audio");
        const dest = `/records/new?${params.toString()}`;
        return (
          <Link
            href={`/login?redirect=${encodeURIComponent(dest)}`}
            className="block rounded-2xl bg-white p-4 shadow-sm"
          >
            <p className="text-sm font-bold text-gray-900">ログインすると記録を保存できます</p>
            <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
          </Link>
        );
      })()}

      {/* 録音エリア */}
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-gray-900 py-12">
        {/* 録音中ビジュアル */}
        <div className="flex h-12 items-end gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                recState === "recording" ? "bg-green-400" : "bg-gray-600"
              }`}
              style={{ height: recState === "recording" ? `${12 + ((i * 7 + elapsed) % 24)}px` : "8px" }}
            />
          ))}
        </div>

        {/* タイマー */}
        <p className="font-mono text-3xl tracking-widest text-white">{formatTime(elapsed)}</p>

        {/* 録音ボタン */}
        <button
          type="button"
          onClick={handleMainButton}
          aria-label={recState === "idle" ? "録音開始" : recState === "recording" ? "録音停止" : "録音やり直し"}
          className={`flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all ${
            recState === "recording"
              ? "animate-pulse bg-red-500 hover:bg-red-600"
              : recState === "done"
                ? "bg-gray-600 hover:bg-gray-500"
                : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {recState === "idle" && <IconMic className="h-8 w-8 text-white" />}
          {recState === "recording" && <span className="h-6 w-6 rounded bg-white" />}
          {recState === "done" && <IconMic className="h-8 w-8 text-white" />}
        </button>

        <p className="text-xs text-gray-400">
          {recState === "idle" && "タップして録音開始"}
          {recState === "recording" && `タップして停止（最長${MAX_SECONDS / 60}分）`}
          {recState === "done" && "タップして録り直し"}
        </p>
      </div>

      {/* 録音完了時: 再生・田んぼ・種別・メモ */}
      {recState === "done" && audio && (
        <>
          <div className="rounded-2xl bg-white p-3 shadow-sm">
            <audio controls src={audio.previewUrl} className="w-full" />
          </div>

          {/* 田んぼの選択 */}
          <div className="rounded-2xl bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-2">
              <IconPinFill className="h-5 w-5 shrink-0 text-green-700" />
              <p className="text-sm font-bold text-gray-900">どの田んぼの記録ですか？</p>
            </div>
            {fields.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-2">
                {fields.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setPointId(null);
                      setSelectedFieldId(f.id === selectedFieldId ? null : f.id);
                    }}
                    className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                      f.id === selectedFieldId
                        ? "bg-green-700 text-white"
                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {f.name || "名前のない田んぼ"}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                {needLogin
                  ? "ログインすると登録済みの田んぼから選べます"
                  : farmError
                    ? "田んぼ一覧を読み込めませんでした。通信環境を確認してください（選択しなくても記録は保存できます）"
                    : "登録済みの田んぼがありません（マップの＋ボタンから登録できます）。選択しなくても記録は保存できます"}
              </p>
            )}
          </div>

          {/* ポイント種別 */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-gray-900">何の記録ですか？（任意）</p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {pointTypes.map((pt) => (
                <button
                  key={pt.type}
                  onClick={() => setPointType(pointType === pt.type ? null : pt.type)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-3 transition-colors ${
                    pointType === pt.type
                      ? "border-green-600 bg-green-50"
                      : "border-gray-100 bg-white hover:border-green-300"
                  }`}
                >
                  {pt.icon}
                  <span className="text-xs font-semibold text-gray-700">{pt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-900">メモ（任意）</p>
              <VoiceInputButton
                onText={(t) => setMemo((prev) => prev ? prev + " " + t : t)}
              />
            </div>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: 水位が低い。明日の朝もう一度確認する"
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-600"
            />
          </div>
        </>
      )}

      {message && <p className="px-1 text-sm text-amber-700">{message}</p>}

      {/* 次へ */}
      {recState === "done" && audio && (
        <button
          onClick={handleNext}
          className="flex w-full items-center justify-center gap-1 rounded-xl bg-green-700 py-4 text-sm font-bold text-white transition-colors hover:bg-green-800"
        >
          次へ（内容を確認）
          <IconChevronRight className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}
