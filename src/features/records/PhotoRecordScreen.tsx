"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadFarmData } from "../../lib/data/farm";
import { getRecordDraft, setRecordDraft } from "./recordDraft";
import type { FieldPointType } from "../../types";
import {
  IconCamera,
  IconChevronRight,
  IconDropFill,
  IconPinFill,
  IconSprout,
  IconWarningFill,
  IconWaves,
} from "../../components/ui/icons";

const pointTypes: { type: FieldPointType; icon: React.ReactNode; label: string }[] = [
  { type: "inlet", icon: <IconDropFill className="h-6 w-6 text-sky-500" />, label: "入水口" },
  { type: "outlet", icon: <IconWaves className="h-6 w-6 text-blue-500" />, label: "出水口" },
  { type: "weed", icon: <IconSprout className="h-6 w-6 text-green-600" />, label: "雑草" },
  { type: "caution", icon: <IconWarningFill className="h-6 w-6 text-amber-500" />, label: "異常" },
];

type FieldOption = { id: string; name: string; center: [number, number] | null };

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

/** 写真をアップロード向けに縮小する（長辺1600px・JPEG品質0.8） */
async function compressImage(file: File): Promise<{ blob: Blob; previewUrl: string }> {
  const bitmap = await createImageBitmap(file);
  const longSide = Math.max(bitmap.width, bitmap.height);
  const scale = longSide > 1600 ? 1600 / longSide : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/jpeg", 0.8);
  });
  return { blob, previewUrl: URL.createObjectURL(blob) };
}

export default function PhotoRecordScreen() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photo, setPhoto] = useState<{ blob: Blob; previewUrl: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [pointType, setPointType] = useState<FieldPointType | null>(null);
  const [memo, setMemo] = useState("");
  const [location, setLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // 「修正する」で戻ってきたときは下書きを復元する
  useEffect(() => {
    const draft = getRecordDraft();
    if (draft?.kind === "photo") {
      if (draft.file && draft.previewUrl) setPhoto({ blob: draft.file, previewUrl: draft.previewUrl });
      setSelectedFieldId(draft.fieldId);
      setPointType(draft.pointType);
      setMemo(draft.memo);
      setLocation(draft.location);
    }
  }, []);

  // 自分の田んぼ一覧と現在地から、候補の田んぼを初期選択する
  useEffect(() => {
    let cancelled = false;
    loadFarmData().then((farm) => {
      if (cancelled) return;
      if (farm.mode === "demo" || farm.mode === "anon") {
        setNeedLogin(farm.mode === "anon");
        return;
      }
      const options: FieldOption[] = farm.fieldsGeoJSON.features.flatMap((f) => {
        if (f.geometry.type !== "Polygon") return [];
        const ring = f.geometry.coordinates[0];
        const pts = ring.slice(0, -1);
        const center: [number, number] = [
          pts.reduce((s, c) => s + c[0], 0) / pts.length,
          pts.reduce((s, c) => s + c[1], 0) / pts.length,
        ];
        return [{ id: String(f.id ?? f.properties?.id ?? ""), name: String(f.properties?.name ?? ""), center }];
      });
      setFields(options);

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            const here: [number, number] = [pos.coords.longitude, pos.coords.latitude];
            setLocation({ lng: here[0], lat: here[1] });
            // いま立っている田んぼがあれば自動選択、なければ一番近い田んぼ
            setSelectedFieldId((prev) => {
              if (prev) return prev;
              const inside = farm.fieldsGeoJSON.features.find(
                (f) => f.geometry.type === "Polygon" && pointInRing(here, f.geometry.coordinates[0])
              );
              if (inside) return String(inside.id ?? inside.properties?.id ?? "");
              let best: FieldOption | null = null;
              let bestDist = Infinity;
              for (const o of options) {
                if (!o.center) continue;
                const d = (o.center[0] - here[0]) ** 2 + (o.center[1] - here[1]) ** 2;
                if (d < bestDist) {
                  bestDist = d;
                  best = o;
                }
              }
              return best?.id ?? null;
            });
          },
          () => {
            // 位置情報なしでも記録は可能（田んぼは手動選択）
          },
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;
    setProcessing(true);
    setMessage(null);
    try {
      const compressed = await compressImage(file);
      if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
      setPhoto(compressed);
    } catch (err) {
      console.warn("[photo] compress failed", err);
      setMessage("写真を読み込めませんでした。別の写真でお試しください");
    } finally {
      setProcessing(false);
    }
  };

  const handleNext = () => {
    if (!photo) {
      setMessage("先に写真を撮影（または選択）してください");
      return;
    }
    const selected = fields.find((f) => f.id === selectedFieldId) ?? null;
    setRecordDraft({
      kind: "photo",
      file: photo.blob,
      previewUrl: photo.previewUrl,
      fieldId: selected?.id ?? null,
      fieldName: selected?.name ?? null,
      pointType,
      memo,
      location,
      recordedAt: new Date().toISOString(),
    });
    router.push("/records/new/confirm");
  };

  return (
    <div className="space-y-3 px-3 pb-6 pt-3">
      <h1 className="px-1 text-2xl font-bold text-gray-900">写真で記録</h1>

      {needLogin && (
        <Link href="/login?redirect=%2Frecords%2Fnew" className="block rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm font-bold text-gray-900">ログインすると記録を保存できます</p>
          <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
        </Link>
      )}

      {/* カメラエリア */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          handleFileSelected(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {photo ? (
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element -- ローカルBlobのプレビュー */}
          <img src={photo.previewUrl} alt="撮影した写真" className="max-h-80 w-full object-contain" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-3 right-3 rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-gray-800 shadow"
          >
            撮り直す
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processing}
          className="relative flex h-64 w-full flex-col items-center justify-center gap-3 rounded-2xl bg-gray-900 shadow-sm disabled:opacity-60"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white">
            <span className="h-12 w-12 rounded-full bg-white" />
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
            <IconCamera className="h-4.5 w-4.5" />
            {processing ? "読み込み中…" : "タップして撮影"}
          </span>
        </button>
      )}

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
                onClick={() => setSelectedFieldId(f.id === selectedFieldId ? null : f.id)}
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
        <p className="text-sm font-bold text-gray-900">メモ（任意）</p>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="例: 取水口にゴミが詰まりかけていた。次回確認する"
          rows={3}
          className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-green-600"
        />
      </div>

      {message && <p className="px-1 text-sm text-amber-700">{message}</p>}

      {/* 次へ */}
      <button
        onClick={handleNext}
        disabled={!photo || processing}
        className="flex w-full items-center justify-center gap-1 rounded-xl bg-green-700 py-4 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:bg-gray-300"
      >
        次へ（内容を確認）
        <IconChevronRight className="h-4.5 w-4.5" />
      </button>
    </div>
  );
}
