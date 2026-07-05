"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { loadWeather, type WeatherData } from "../../lib/data/weather";
import { loadRecords } from "../../lib/data/records";
import { loadFieldAttention } from "../../lib/data/fieldAttention";
import { getSeasonPhase, getGreeting, formatDateLabel } from "../../lib/season";
import type { RecordItem } from "../../types";
import { PaddyPhoto, RecordThumb } from "../../components/ui/PaddyPhoto";
import StatusBadge from "../../components/ui/StatusBadge";
import { IconClose, IconChevronRight, IconPin, IconWarningFill, SEASON_ICONS } from "../../components/ui/icons";

/**
 * 「今日の田んぼ」オープニングストーリー（田んぼOS レイヤー1）
 *
 * 1日1回、マップの上にフルスクリーンのストーリーカードを流す。
 * Instagramストーリー式: 上部に進行バー・右タップで次へ・左タップで戻る・✕/スキップで即閉じ。
 * カード1は通信なしで組み立てられるため即表示し、天気・記録カードは取得でき次第差し込む。
 */

const STORAGE_KEY = "tanbo-story-shown";
const CARD_DURATION_MS = 6000;

type AttentionSummary = { count: number; names: string[] };
type CardKey = "greeting" | "attention" | "record" | "start";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function TodayStory() {
  const [visible, setVisible] = useState(false);
  // 数値indexではなくカードのキーで現在位置を持つ（非同期でカードが差し込まれても現在のカードが変わらない）
  const [currentKey, setCurrentKey] = useState<CardKey>("greeting");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [attention, setAttention] = useState<AttentionSummary | null>(null);
  const [latestRecord, setLatestRecord] = useState<RecordItem | null>(null);
  const [latestThumb, setLatestThumb] = useState<string | undefined>(undefined);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 表示判定（1日1回。?story=1 で強制表示）
  useEffect(() => {
    const force = new URLSearchParams(window.location.search).get("story") === "1";
    const shown = localStorage.getItem(STORAGE_KEY) === todayKey();
    if (!force && shown) return;
    setVisible(true);
    localStorage.setItem(STORAGE_KEY, todayKey());

    let cancelled = false;
    loadWeather().then((w) => {
      if (!cancelled) setWeather(w);
    }).catch(() => {});
    // ピン状態の異常/要確認 + ピン変更を伴わない「記録のみ」の異常の両方を数える（MapSummarySheetと同じ考え方）
    loadFieldAttention().then((summary) => {
      if (cancelled || summary.mode === "error") return;
      const count = summary.totalIssue + summary.totalNeedsCheck;
      if (count > 0) {
        const names = summary.attentionFields
          .map((f) => f.name)
          .filter(Boolean)
          .slice(0, 3);
        setAttention({ count, names });
      }
    }).catch(() => {});
    loadRecords({ limit: 1 }).then((data) => {
      if (cancelled || data.records.length === 0) return;
      setLatestRecord(data.records[0]);
      setLatestThumb(data.thumbUrls[data.records[0].id]);
    }).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const season = useMemo(() => getSeasonPhase(), []);

  // カード構成（データが届いた分だけ増える）
  const cards = useMemo(() => {
    const list: CardKey[] = ["greeting"];
    if (attention) list.push("attention");
    if (latestRecord) list.push("record");
    list.push("start");
    return list;
  }, [attention, latestRecord]);

  const index = Math.max(0, cards.indexOf(currentKey));

  const close = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    const i = cards.indexOf(currentKey);
    if (i + 1 >= cards.length) {
      close();
      return;
    }
    setCurrentKey(cards[i + 1]);
  }, [cards, currentKey, close]);

  const prev = useCallback(() => {
    const i = cards.indexOf(currentKey);
    if (i > 0) setCurrentKey(cards[i - 1]);
  }, [cards, currentKey]);

  // 自動送り
  useEffect(() => {
    if (!visible) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, CARD_DURATION_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, next]);

  if (!visible) return null;

  const card = currentKey;

  return (
    <div
      className="fixed inset-0 z-40 overflow-hidden bg-black"
      role="dialog"
      aria-label="今日の田んぼ"
    >
      {/* 背景（朝の田園SVG + ダークオーバーレイ） */}
      <PaddyPhoto
        variant={card === "attention" ? "grass" : card === "record" ? "sprout" : "field"}
        className="absolute inset-0 h-full w-full animate-story-card-in"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/80" />

      {/* 進行バー */}
      <div className="absolute inset-x-3 top-3 z-10 flex gap-1.5">
        {cards.map((c, i) => (
          <div key={c} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            {i < index && <div className="h-full w-full bg-white" />}
            {i === index && (
              <div
                key={`bar-${index}`}
                className="h-full bg-white animate-story-progress"
                style={{ animationDuration: `${CARD_DURATION_MS}ms` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 閉じる */}
      <button
        onClick={close}
        aria-label="ストーリーを閉じる"
        className="absolute right-3 top-7 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
      >
        <IconClose className="h-5.5 w-5.5" />
      </button>

      {/* タップ領域（左1/3=戻る・右2/3=次へ） */}
      <button aria-label="前のカードへ" onClick={prev} className="absolute inset-y-0 left-0 z-10 w-1/3" />
      <button aria-label="次のカードへ" onClick={next} className="absolute inset-y-0 right-0 z-10 w-2/3" />

      {/* カード本文 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={card}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="absolute inset-x-0 bottom-0 z-10 px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))]"
        >
          {card === "greeting" && (
            <div>
              <p className="text-lg font-semibold text-white/85">{getGreeting()}</p>
              <p className="mt-1 text-4xl font-bold leading-tight text-white">
                {formatDateLabel()}
              </p>
              {weather?.today && (
                <p className="mt-3 text-xl font-semibold text-white/90">
                  {weather.areaName}は{weather.today.weatherLabel}
                  {weather.today.tempMax && (
                    <span className="ml-2 text-white/75">
                      {weather.today.tempMax}°
                      {weather.today.tempMin ? ` / ${weather.today.tempMin}°` : ""}
                    </span>
                  )}
                </p>
              )}
              <div className="mt-6 rounded-2xl glass-dark p-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const SeasonIcon = SEASON_ICONS[season.iconKey];
                    return <SeasonIcon className="h-6 w-6 text-emerald-300" />;
                  })()}
                  <p className="text-lg font-bold text-white">いまは「{season.label}」の時期</p>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${Math.round(season.yearProgress * 100)}%` }}
                  />
                </div>
                <p className="mt-2.5 text-sm text-white/80">{season.hint}</p>
              </div>
            </div>
          )}

          {card === "attention" && attention && (
            <div>
              <div className="flex items-center gap-2 text-amber-300">
                <IconWarningFill className="h-6 w-6" />
                <p className="text-lg font-bold">気になる場所があります</p>
              </div>
              <p className="mt-2 text-white">
                <span className="text-6xl font-bold leading-none">{attention.count}</span>
                <span className="ml-2 text-xl font-semibold text-white/85">件</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {attention.names.map((n) => (
                  <StatusBadge key={n} status="needs_check" label={n} dark className="text-sm" />
                ))}
              </div>
              <p className="mt-4 text-sm text-white/75">
                マップの赤・黄色の場所をタップして確認しましょう
              </p>
            </div>
          )}

          {card === "record" && latestRecord && (
            <div>
              <p className="text-lg font-bold text-white/90">最近の家族の記録</p>
              <div className="mt-3 overflow-hidden rounded-2xl glass-dark">
                <RecordThumb
                  media={latestRecord.media}
                  variant={latestRecord.category === "作業" ? "grass" : latestRecord.category === "異常" ? "sprout" : "water"}
                  duration={latestRecord.audioDuration}
                  thumbUrl={latestThumb}
                  className="h-44 w-full"
                />
                <div className="p-4">
                  <p className="text-xl font-bold text-white">{latestRecord.title}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-white/75">
                    <IconPin className="h-4 w-4" />
                    {latestRecord.fieldName}
                    <span className="text-white/40">|</span>
                    {latestRecord.time}
                  </p>
                </div>
              </div>
            </div>
          )}

          {card === "start" && (
            <div className="text-center">
              <p className="text-3xl font-bold leading-snug text-white animate-story-rise">
                今日も、田んぼと
                <br />
                いい一日を 🌾
              </p>
              <button
                onClick={close}
                className="relative z-20 mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-500 py-4 text-lg font-bold text-white shadow-[0_4px_24px_rgba(16,185,129,0.5)] transition-transform active:scale-95"
              >
                マップを開く
                <IconChevronRight className="h-5.5 w-5.5" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
