"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/layout/AppShell";
import Link from "next/link";
import { motion } from "motion/react";
import { staggerContainer, staggerItem } from "../../lib/motion/variants";
import { RemotePhoto } from "../../components/ui/RemotePhoto";
import StatusBadge from "../../components/ui/StatusBadge";
import { Skeleton } from "../../components/ui/skeleton";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { IconCamera, IconFieldGrid, IconPlus } from "../../components/ui/icons";
import { formatAreaSqm } from "../../lib/utils/geo";
import { useAreaUnit } from "../../lib/hooks/useAreaUnit";
import { PlotGlowMap, type PlotGlowField } from "../../components/patterns/PlotGlowMap";
import { FlowGuide } from "../../features/flow/FlowGuide";
import { useFieldsList, type FieldItem } from "../../features/fields/hooks/useFieldsList";

export default function FieldsPage() {
  const router = useRouter();
  const { mode, fields, fieldStatuses, photoUrls, handlePhotoSelect, defaultCoverUrl } = useFieldsList();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [areaUnit, cycleAreaUnit] = useAreaUnit();
  const formatArea = (sqm: number | null) => {
    if (sqm === null) return null;
    return formatAreaSqm(sqm, areaUnit);
  };

  const plotFields: PlotGlowField[] = fields.map((f) => {
    const fs = fieldStatuses[f.id];
    const status: PlotGlowField["status"] = fs?.issueCount ? "issue" : fs?.needsCheckCount ? "needs_check" : "normal";
    return { id: f.id, name: f.name || "名前のない田んぼ", status };
  });

  return (
    <AppShell>
      <div className="min-h-full space-y-3 bg-flow-cream px-3 pb-6 pt-3">
        <div className="px-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconFieldGrid className="h-6 w-6 text-flow-green" />
              <h1 className="font-heading text-2xl font-bold tracking-tight text-gray-900">各場所の記録</h1>
            </div>
            {mode !== "loading" && (
              <span className="text-sm text-gray-500">{fields.length}枚</span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-500">田んぼを選んで状態・記録・写真の変化を見る</p>
        </div>

        {/* 使い方の流れの現在地（ステップ4=ゴール）。この画面の役割を常設表示する */}
        <FlowGuide current="fields" />

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
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
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
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"
          >
            {fields.map((field: FieldItem) => {
              const fs = fieldStatuses[field.id];
              const hasAttention = fs && (fs.issueCount > 0 || fs.needsCheckCount > 0);
              return (
                <motion.div key={field.id} variants={staggerItem}>
                  <Card
                    accent={fs?.issueCount ? "issue" : fs?.needsCheckCount ? "needs_check" : undefined}
                    className="relative overflow-hidden transition-transform active:scale-[0.99]"
                  >
                    <Link href={`/fields/${encodeURIComponent(field.id)}`} className="block">
                      {/* 写真が主役のヒーロー部（Googleマップの場所カード風） */}
                      <div className="relative h-36">
                        <RemotePhoto
                          src={photoUrls[field.id] ?? defaultCoverUrl}
                          alt={field.name}
                          className="h-full w-full object-cover"
                          fallbackVariant="field"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />

                        {/* 状態バッジ（写真の上・信号色） */}
                        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                          {fs?.issueCount ? <StatusBadge status="issue" label={`異常${fs.issueCount}`} /> : null}
                          {fs?.needsCheckCount ? <StatusBadge status="needs_check" label={`要確認${fs.needsCheckCount}`} /> : null}
                          {!hasAttention && fs?.lastRecordDate ? <StatusBadge status="normal" label="順調" /> : null}
                        </div>

                        {/* 田んぼ名と面積（写真の上） */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="truncate text-lg font-bold text-white drop-shadow">
                            {field.name || "名前のない田んぼ"}
                          </p>
                        </div>
                      </div>

                      {/* 情報行 */}
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        {formatArea(field.areaSqm) && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycleAreaUnit(); }}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); cycleAreaUnit(); } }}
                            className="shrink-0 border-b border-dotted border-gray-300 text-sm font-bold text-gray-700 active:opacity-60"
                          >
                            {formatArea(field.areaSqm)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate text-right text-xs text-gray-400">
                          {fs?.lastRecordDate ? `最終記録 ${fs.lastRecordDate}` : "記録なし"}
                        </span>
                      </div>
                    </Link>
                    {field.groupId && (
                      <>
                        <button
                          onClick={() => fileInputRefs.current[field.id]?.click()}
                          className="absolute right-2 top-24 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                          aria-label="写真を変更"
                        >
                          <IconCamera className="h-3.5 w-3.5" />
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => { fileInputRefs.current[field.id] = el; }}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(field, f); e.currentTarget.value = ""; }}
                        />
                      </>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* 補助表示: 状態の俯瞰（信号色ポリゴン）。主役は上の実写カードグリッド */}
        {(mode === "live" || mode === "demo") && plotFields.length > 0 && (
          <motion.div initial="hidden" animate="show" variants={staggerItem} className="rounded-2xl bg-white p-3 shadow-sm">
            <p className="mb-2 text-xs font-bold text-gray-500">状態を地図で見る</p>
            <PlotGlowMap
              fields={plotFields}
              onSelect={(id) => router.push(`/fields/${encodeURIComponent(id)}`)}
              className="aspect-[3/1]"
            />
          </motion.div>
        )}

        <Button asChild variant="secondary" size="lg" className="w-full border-dashed">
          <Link href="/map?register=1">
            <IconPlus className="h-5 w-5" strokeWidth={2.2} />
            田んぼを追加（マップで描く）
          </Link>
        </Button>
      </div>
    </AppShell>
  );
}
