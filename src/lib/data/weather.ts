/** 気象庁API（無料・CORS対応）を使った1週間天気予報 */

export type DayForecast = {
  date: string;       // "6/14（土）"
  weatherCode: string;
  weatherLabel: string;
  tempMax: string | null;
  tempMin: string | null;
  pop: string | null; // 降水確率 "40" など
};

export type WeatherData = {
  areaName: string;
  today: DayForecast;
  week: DayForecast[];
};

/** 気象庁エリアコード（都道府県レベル） - 代表座標で最近傍選択 */
const AREA_TABLE: { code: string; name: string; lat: number; lng: number }[] = [
  { code: "016000", name: "函館地方", lat: 41.77, lng: 140.73 },
  { code: "012000", name: "上川地方", lat: 43.76, lng: 142.36 },
  { code: "014100", name: "胆振地方", lat: 42.68, lng: 141.38 },
  { code: "020000", name: "青森県", lat: 40.82, lng: 140.74 },
  { code: "030000", name: "岩手県", lat: 39.70, lng: 141.15 },
  { code: "040000", name: "宮城県", lat: 38.27, lng: 140.87 },
  { code: "050000", name: "秋田県", lat: 39.72, lng: 140.10 },
  { code: "060000", name: "山形県", lat: 38.24, lng: 140.36 },
  { code: "070000", name: "福島県", lat: 37.75, lng: 140.47 },
  { code: "080000", name: "茨城県", lat: 36.34, lng: 140.45 },
  { code: "090000", name: "栃木県", lat: 36.57, lng: 139.88 },
  { code: "100000", name: "群馬県", lat: 36.39, lng: 139.06 },
  { code: "110000", name: "埼玉県", lat: 35.86, lng: 139.65 },
  { code: "120000", name: "千葉県", lat: 35.61, lng: 140.12 },
  { code: "130000", name: "東京都", lat: 35.69, lng: 139.69 },
  { code: "140000", name: "神奈川県", lat: 35.45, lng: 139.64 },
  { code: "150000", name: "新潟県", lat: 37.90, lng: 139.02 },
  { code: "160000", name: "富山県", lat: 36.70, lng: 137.21 },
  { code: "170000", name: "石川県", lat: 36.59, lng: 136.63 },
  { code: "180000", name: "福井県", lat: 36.07, lng: 136.22 },
  { code: "190000", name: "山梨県", lat: 35.66, lng: 138.57 },
  { code: "200000", name: "長野県", lat: 36.65, lng: 138.18 },
  { code: "210000", name: "岐阜県", lat: 35.39, lng: 136.72 },
  { code: "220000", name: "静岡県", lat: 34.98, lng: 138.38 },
  { code: "230000", name: "愛知県", lat: 35.18, lng: 136.91 },
  { code: "240000", name: "三重県", lat: 34.73, lng: 136.51 },
  { code: "250000", name: "滋賀県", lat: 35.00, lng: 135.87 },
  { code: "260000", name: "京都府", lat: 35.02, lng: 135.76 },
  { code: "270000", name: "大阪府", lat: 34.69, lng: 135.50 },
  { code: "280000", name: "兵庫県", lat: 34.69, lng: 135.18 },
  { code: "290000", name: "奈良県", lat: 34.69, lng: 135.83 },
  { code: "300000", name: "和歌山県", lat: 34.23, lng: 135.17 },
  { code: "310000", name: "鳥取県", lat: 35.50, lng: 134.24 },
  { code: "320000", name: "島根県", lat: 35.47, lng: 133.05 },
  { code: "330000", name: "岡山県", lat: 34.66, lng: 133.93 },
  { code: "340000", name: "広島県", lat: 34.40, lng: 132.46 },
  { code: "350000", name: "山口県", lat: 34.19, lng: 131.47 },
  { code: "360000", name: "徳島県", lat: 34.07, lng: 134.56 },
  { code: "370000", name: "香川県", lat: 34.34, lng: 134.04 },
  { code: "380000", name: "愛媛県", lat: 33.84, lng: 132.77 },
  { code: "390000", name: "高知県", lat: 33.56, lng: 133.53 },
  { code: "400000", name: "福岡県", lat: 33.61, lng: 130.42 },
  { code: "410000", name: "佐賀県", lat: 33.25, lng: 130.30 },
  { code: "420000", name: "長崎県", lat: 32.74, lng: 129.87 },
  { code: "430000", name: "熊本県", lat: 32.79, lng: 130.74 },
  { code: "440000", name: "大分県", lat: 33.24, lng: 131.61 },
  { code: "450000", name: "宮崎県", lat: 31.91, lng: 131.42 },
  { code: "460100", name: "鹿児島県", lat: 31.56, lng: 130.56 },
  { code: "471000", name: "沖縄本島地方", lat: 26.21, lng: 127.68 },
];

function nearestAreaCode(lat: number, lng: number): { code: string; name: string } {
  let best = AREA_TABLE[0];
  let bestDist = Infinity;
  for (const a of AREA_TABLE) {
    const d = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
    if (d < bestDist) { bestDist = d; best = a; }
  }
  return best;
}

/** 天気コードから日本語ラベルを返す */
export function weatherLabel(code: string): string {
  const n = Number(code);
  if (n >= 400) return "雪";
  if (n >= 300) return "雨";
  if (n >= 200) return "曇り";
  if (n >= 100) return "晴れ";
  return "—";
}

/** 天気コードからアイコン種別を返す */
export type WeatherIcon = "sunny" | "partly-cloudy" | "cloudy" | "rainy" | "snowy" | "thundery";
export function weatherIconType(code: string): WeatherIcon {
  const n = Number(code);
  if (n >= 400) return "snowy";
  if (n >= 300) return "rainy";
  if (n >= 230) return "thundery";
  if (n >= 200) return "cloudy";
  if (n >= 110) return "partly-cloudy";
  return "sunny";
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseForecast(json: any[], areaName: string): WeatherData {
  const series = json[0]?.timeSeries ?? [];

  // 天気コード・ラベル (timeSeries[0])
  const weatherSeries = series[0];
  const timeDefines: string[] = weatherSeries?.timeDefines ?? [];
  const area0 = weatherSeries?.areas?.[0];
  const weatherCodes: string[] = area0?.weatherCodes ?? [];
  const weathers: string[] = area0?.weathers ?? [];

  // 降水確率 (timeSeries[1]) — timeDefines が異なる場合あり
  const popSeries = series[1];
  const popArea = popSeries?.areas?.[0];
  const pops: string[] = popArea?.pops ?? [];
  const popDates: string[] = popSeries?.timeDefines ?? [];
  // 日付→最初の非"-"なpopを返すマップ
  const popByDate: Record<string, string> = {};
  popDates.forEach((td, i) => {
    const dateKey = td.slice(0, 10);
    if (!popByDate[dateKey] && pops[i] && pops[i] !== "--") {
      popByDate[dateKey] = pops[i];
    }
  });

  // 最低/最高気温 (timeSeries[2])
  const tempSeries = series[2];
  const tempArea = tempSeries?.areas?.[0];
  const temps: string[] = tempArea?.temps ?? [];
  const tempDates: string[] = tempSeries?.timeDefines ?? [];
  // 各日のmin/max
  const tempMinByDate: Record<string, string> = {};
  const tempMaxByDate: Record<string, string> = {};
  tempDates.forEach((td, i) => {
    const dateKey = td.slice(0, 10);
    const val = temps[i];
    if (!val || val === "--") return;
    if (!tempMinByDate[dateKey]) tempMinByDate[dateKey] = val;
    else tempMaxByDate[dateKey] = val;
  });

  // 週間予報 (json[1]) があれば追記
  const weekSeries = json[1]?.timeSeries ?? [];
  const wkWeather = weekSeries[0];
  const wkArea = wkWeather?.areas?.[0];
  if (wkArea) {
    const wkDates: string[] = wkWeather?.timeDefines ?? [];
    const wkCodes: string[] = wkArea?.weatherCodes ?? [];
    const wkTempseries = weekSeries[1];
    const wkTempArea = wkTempseries?.areas?.[0];
    const wkTempsMin: string[] = wkTempArea?.tempsMin ?? [];
    const wkTempsMax: string[] = wkTempArea?.tempsMax ?? [];
    const wkPops: string[] = wkArea?.pops ?? [];
    wkDates.forEach((td, i) => {
      const dateKey = td.slice(0, 10);
      if (!weatherCodes.find((_, ci) => timeDefines[ci]?.slice(0, 10) === dateKey)) {
        timeDefines.push(td);
        weatherCodes.push(wkCodes[i] ?? "");
        weathers.push("");
      }
      if (wkTempsMin[i] && wkTempsMin[i] !== "--") tempMinByDate[dateKey] = wkTempsMin[i];
      if (wkTempsMax[i] && wkTempsMax[i] !== "--") tempMaxByDate[dateKey] = wkTempsMax[i];
      if (wkPops[i] && wkPops[i] !== "--") popByDate[dateKey] = wkPops[i];
    });
  }

  const days: DayForecast[] = timeDefines.slice(0, 7).map((td, i) => {
    const dateKey = td.slice(0, 10);
    const code = weatherCodes[i] ?? "";
    return {
      date: formatDate(td),
      weatherCode: code,
      weatherLabel: weathers[i] || weatherLabel(code),
      tempMax: tempMaxByDate[dateKey] ?? null,
      tempMin: tempMinByDate[dateKey] ?? null,
      pop: popByDate[dateKey] ?? null,
    };
  });

  return {
    areaName,
    today: days[0] ?? { date: "", weatherCode: "", weatherLabel: "—", tempMax: null, tempMin: null, pop: null },
    week: days,
  };
}

let cachedPosition: { lat: number; lng: number } | null = null;
let cachedWeather: { data: WeatherData; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30分

/**
 * 天気の基準位置を決める。
 * 端末の位置情報は、権限ダイアログが放置されると getCurrentPosition がいつまでも
 * 解決しない（コールバックもエラーも呼ばれない）ため、外側のタイマーで必ず打ち切る。
 * 取得できない場合は登録済み田んぼの位置（=見たい場所の天気）へフォールバックする。
 */
async function resolvePosition(): Promise<{ lat: number; lng: number } | null> {
  const fromDevice = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) { resolve(null); return; }
    const cutoff = setTimeout(() => resolve(null), 6000);
    navigator.geolocation.getCurrentPosition(
      (p) => { clearTimeout(cutoff); resolve({ lat: p.coords.latitude, lng: p.coords.longitude }); },
      () => { clearTimeout(cutoff); resolve(null); },
      { timeout: 5000 }
    );
  });
  if (fromDevice) return fromDevice;

  try {
    const { loadFarmData } = await import("./farm");
    const farm = await loadFarmData();
    for (const f of farm.fieldsGeoJSON.features) {
      const ring = f.geometry?.type === "Polygon" ? f.geometry.coordinates?.[0] : undefined;
      const first = ring?.[0];
      if (first && typeof first[0] === "number" && typeof first[1] === "number") {
        return { lat: first[1], lng: first[0] };
      }
    }
  } catch {
    // 田んぼ位置も取れない場合は天気なし（「天気不明」表示）に落とす
  }
  return null;
}

export async function loadWeather(): Promise<WeatherData | null> {
  try {
    if (cachedWeather && Date.now() - cachedWeather.fetchedAt < CACHE_TTL_MS) {
      return cachedWeather.data;
    }

    if (!cachedPosition) cachedPosition = await resolvePosition();
    if (!cachedPosition) return null;

    const area = nearestAreaCode(cachedPosition.lat, cachedPosition.lng);
    const res = await fetch(`https://www.jma.go.jp/bosai/forecast/data/forecast/${area.code}.json`);
    if (!res.ok) return null;
    const json = await res.json();
    const data = parseForecast(json, area.name);
    cachedWeather = { data, fetchedAt: Date.now() };
    return data;
  } catch {
    return null;
  }
}
