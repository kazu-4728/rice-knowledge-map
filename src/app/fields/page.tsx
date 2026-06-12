"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import { loadFarmData } from "../../lib/data/farm";
import { PaddyPhoto } from "../../components/ui/PaddyPhoto";
import { IconChevronRight, IconFieldGrid, IconPlus } from "../../components/ui/icons";

type FieldItem = {
  id: string;
  name: string;
  color: string;
  areaSqm: number | null;
};

export default function FieldsPage() {
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [mode, setMode] = useState<"loading" | "live" | "demo" | "anon" | "error">("loading");

  useEffect(() => {
    loadFarmData().then((data) => {
      setMode(data.mode);
      const items: FieldItem[] = data.fieldsGeoJSON.features.map((f) => ({
        id: String(f.id ?? f.properties?.id ?? ""),
        name: String(f.properties?.name ?? ""),
        color: String(f.properties?.color ?? "#22C55E"),
        areaSqm: null,
      }));
      setFields(items);
    });
  }, []);

  const formatArea = (sqm: number | null) => {
    if (!sqm) return null;
    if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)}ha`;
    return `${sqm.toFixed(0)}㎡`;
  };

  return (
    <AppShell>
      <div className="space-y-3 px-3 pb-6 pt-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <IconFieldGrid className="h-6 w-6 text-green-700" />
            <h1 className="text-2xl font-bold text-gray-900">田んぼ一覧</h1>
          </div>
          {mode !== "loading" && (
            <span className="text-sm text-gray-500">{fields.length}枚</span>
          )}
        </div>

        {mode === "anon" && (
          <Link
            href="/login?redirect=%2Ffields"
            className="block rounded-2xl bg-white p-6 text-center shadow-sm"
          >
            <p className="text-sm font-bold text-gray-900">ログインすると田んぼ一覧が表示されます</p>
            <p className="mt-1 text-sm font-bold text-green-700">タップしてログイン</p>
          </Link>
        )}

        {mode === "error" && (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">田んぼを読み込めませんでした</p>
            <p className="mt-1 text-xs text-gray-500">通信環境を確認して開き直してください</p>
          </div>
        )}

        {mode === "loading" && (
          <div className="space-y-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        )}

        {(mode === "live" || mode === "demo") && fields.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-bold text-gray-900">まだ田んぼが登録されていません</p>
            <p className="mt-1 text-xs text-gray-500">マップで田んぼの輪郭をなぞって登録できます</p>
          </div>
        )}

        {(mode === "live" || mode === "demo") && fields.length > 0 && (
          <div className="space-y-2.5">
            {fields.map((field) => (
              <Link
                key={field.id}
                href="/map"
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                  <PaddyPhoto variant="field" className="h-full w-full" />
                  <span
                    className="absolute inset-0 opacity-45"
                    style={{ background: field.color }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold text-gray-900">
                    {field.name}
                    {formatArea(field.areaSqm) && (
                      <span className="ml-2 text-sm font-medium text-gray-500">{formatArea(field.areaSqm)}</span>
                    )}
                  </p>
                </div>
                <IconChevronRight className="h-4.5 w-4.5 shrink-0 text-gray-400" />
              </Link>
            ))}
          </div>
        )}

        <Link
          href="/map"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-green-600 bg-white py-4 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
        >
          <IconPlus className="h-5 w-5" strokeWidth={2.2} />
          田んぼを追加（マップで描く）
        </Link>
      </div>
    </AppShell>
  );
}
