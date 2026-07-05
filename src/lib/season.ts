/**
 * 農事暦シーズンエンジン（田んぼOS レイヤー4）
 *
 * 日付から稲作の年間フェーズを推定する。地域差・品種差は将来
 * localStorage の補正値（田植え日など）で調整する前提の近似値。
 * DBには依存しない純粋関数のみを置く。
 */

export type SeasonPhaseKey =
  | "offseason"      // 農閑期・乾土
  | "soil_prep"      // 田起こし・育苗
  | "puddling"       // 代掻き
  | "planting"       // 田植え
  | "tillering"      // 分げつ・水管理
  | "midseason_drain" // 中干し
  | "heading"        // 出穂・開花
  | "ripening"       // 登熟
  | "harvest";       // 収穫

export type SeasonPhase = {
  key: SeasonPhaseKey;
  /** フェーズ名（画面表示用） */
  label: string;
  /** フェーズの絵文字（ストーリー・シーズンバー用） */
  emoji: string;
  /** 「今なにをする時期か」の一言ヒント */
  hint: string;
  /** 記録を促すアクション文（ネクストアクションカード用） */
  action: string;
  /** フェーズ内の進行度 0..1 */
  progress: number;
  /** 年間の進行度 0..1（シーズンバー用。田起こし開始を0とする） */
  yearProgress: number;
};

type PhaseDef = {
  key: SeasonPhaseKey;
  label: string;
  emoji: string;
  hint: string;
  action: string;
  /** 開始日（月, 日）。次のフェーズ開始日の前日まで続く */
  start: [number, number];
};

/** 日本の一般的な水稲作の年間フェーズ（開始日順） */
const PHASES: PhaseDef[] = [
  { key: "soil_prep", label: "田起こし・育苗", emoji: "🚜", start: [3, 1],
    hint: "土づくりと苗の準備がはじまる時期です", action: "田起こしや育苗の様子を記録する" },
  { key: "puddling", label: "代掻き", emoji: "💧", start: [4, 20],
    hint: "田んぼに水を入れて土をならす時期です", action: "代掻きの進み具合を記録する" },
  { key: "planting", label: "田植え", emoji: "🌱", start: [5, 10],
    hint: "田植えの最盛期です", action: "田植えの完了を写真で記録する" },
  { key: "tillering", label: "分げつ・水管理", emoji: "🌿", start: [6, 1],
    hint: "水位の管理が大切な時期です", action: "水位や生育の様子を記録する" },
  { key: "midseason_drain", label: "中干し", emoji: "☀️", start: [6, 25],
    hint: "田んぼの水を抜いて根を強くする時期です", action: "中干しの状態を記録する" },
  { key: "heading", label: "出穂・開花", emoji: "🌾", start: [7, 25],
    hint: "穂が出る大事な時期。水を切らさないように", action: "出穂の様子を写真で記録する" },
  { key: "ripening", label: "登熟", emoji: "🌕", start: [8, 20],
    hint: "実りが進む時期。落水のタイミングを見極めて", action: "稲穂の色づきを記録する" },
  { key: "harvest", label: "収穫", emoji: "🌾", start: [9, 20],
    hint: "いよいよ収穫の時期です", action: "収穫の記録を残す" },
  { key: "offseason", label: "農閑期", emoji: "❄️", start: [11, 1],
    hint: "来シーズンへ向けた準備と振り返りの時期です", action: "今年の振り返りを記録する" },
];

function dayOfYear(d: Date): number {
  // ローカルの年月日をUTCに写して差分を取る（DSTのある地域でも日付境界がズレない）
  const day = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const start = Date.UTC(d.getFullYear(), 0, 1);
  return Math.floor((day - start) / 86400000);
}

function daysInYear(year: number): number {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;
}

function phaseStartDay(year: number, def: PhaseDef): number {
  return dayOfYear(new Date(year, def.start[0] - 1, def.start[1]));
}

/**
 * 「農事暦の年」を解決する。田起こし(3/1)開始を年の起点とし、それ以前の日付は
 * 前年を起点とした農閑期（年またぎ）として扱う。sinceStart は起点からの経過日数。
 */
function resolveSeasonYear(date: Date): { seasonYear: number; sinceStart: number } {
  const year = date.getFullYear();
  const today = dayOfYear(date);
  const seasonStartThisYear = phaseStartDay(year, PHASES[0]);
  if (today >= seasonStartThisYear) {
    return { seasonYear: year, sinceStart: today - seasonStartThisYear };
  }
  const seasonYear = year - 1;
  return {
    seasonYear,
    sinceStart: today + daysInYear(seasonYear) - phaseStartDay(seasonYear, PHASES[0]),
  };
}

/** 指定日（省略時は今日）の稲作フェーズを返す */
export function getSeasonPhase(date: Date = new Date()): SeasonPhase {
  const year = date.getFullYear();
  const today = dayOfYear(date);

  // フェーズ境界（day of year）を求める。年初〜田起こし前は前年の農閑期扱い
  let current = PHASES[PHASES.length - 1]; // offseason
  let currentStart =
    phaseStartDay(year - 1, PHASES[PHASES.length - 1]) - daysInYear(year - 1); // 前年11月開始（当年day-of-year座標）
  let nextStart = phaseStartDay(year, PHASES[0]);

  for (let i = 0; i < PHASES.length; i++) {
    const start = phaseStartDay(year, PHASES[i]);
    const end = i + 1 < PHASES.length ? phaseStartDay(year, PHASES[i + 1]) : start + 120; // offseasonは翌年3月まで
    if (today >= start && today < end) {
      current = PHASES[i];
      currentStart = start;
      nextStart = end;
      break;
    }
  }

  const span = Math.max(1, nextStart - currentStart);
  const progress = Math.min(1, Math.max(0, (today - currentStart) / span));

  // 年間進行度: 田起こし(3/1)開始を0、翌年2月末を1とする。
  // シーズン年の長さはうるう日を含む翌年2月をまたぐため、seasonYear自身ではなく
  // seasonYear+1の年日数で判定する（例: 2023/3/1〜2024/2/29〜2024/3/1 は366日）
  const { seasonYear, sinceStart } = resolveSeasonYear(date);
  const yearProgress = Math.min(1, Math.max(0, sinceStart / daysInYear(seasonYear + 1)));

  return {
    key: current.key,
    label: current.label,
    emoji: current.emoji,
    hint: current.hint,
    action: current.action,
    progress,
    yearProgress,
  };
}

export type SeasonTimelineEntry = {
  key: SeasonPhaseKey;
  label: string;
  emoji: string;
  hint: string;
  /** 年間（田起こし開始〜翌年2月末）に占める開始位置 0..1 */
  startFraction: number;
  /** 年間に占める終了位置 0..1 */
  endFraction: number;
  isCurrent: boolean;
};

/**
 * 農事暦の年間タイムライン（田んぼOS レイヤー4: 農事暦シーズンエンジンの通年表示用）
 * 9フェーズすべてを年間に占める割合つきで返す。管理画面のシーズンバー描画に使う。
 */
export function getSeasonTimeline(date: Date = new Date()): SeasonTimelineEntry[] {
  const current = getSeasonPhase(date);
  const { seasonYear } = resolveSeasonYear(date);
  // シーズン年の長さはseasonYear+1の年日数で判定する（getSeasonPhaseのyearProgressと同じ理由）
  const total = daysInYear(seasonYear + 1);
  const base = phaseStartDay(seasonYear, PHASES[0]);

  return PHASES.map((def, i) => {
    const start = phaseStartDay(seasonYear, def) - base;
    const end = i + 1 < PHASES.length ? phaseStartDay(seasonYear, PHASES[i + 1]) - base : total;
    return {
      key: def.key,
      label: def.label,
      emoji: def.emoji,
      hint: def.hint,
      startFraction: Math.max(0, Math.min(1, start / total)),
      endFraction: Math.max(0, Math.min(1, end / total)),
      isCurrent: def.key === current.key,
    };
  });
}

/** 時間帯に応じた挨拶（ストーリーの導入用） */
export function getGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 4) return "おつかれさまです";
  if (h < 11) return "おはようございます";
  if (h < 18) return "こんにちは";
  return "おつかれさまです";
}

/** 「7月2日(火)」形式の日付ラベル */
export function formatDateLabel(date: Date = new Date()): string {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${date.getMonth() + 1}月${date.getDate()}日(${weekdays[date.getDay()]})`;
}
