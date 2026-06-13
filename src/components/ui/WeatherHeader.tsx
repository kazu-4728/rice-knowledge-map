"use client";

import { useEffect, useState } from "react";
import { loadWeather, weatherIconType, type WeatherData, type WeatherIcon } from "../../lib/data/weather";

function WeatherIconSvg({ type, className }: { type: WeatherIcon; className?: string }) {
  if (type === "sunny") return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" fill="#FBBF24" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line key={i} x1={12 + 8 * Math.cos(deg * Math.PI / 180)} y1={12 + 8 * Math.sin(deg * Math.PI / 180)}
          x2={12 + 10.5 * Math.cos(deg * Math.PI / 180)} y2={12 + 10.5 * Math.sin(deg * Math.PI / 180)}
          stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      ))}
    </svg>
  );
  if (type === "partly-cloudy") return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="10" r="4" fill="#FBBF24" />
      <ellipse cx="14" cy="14" rx="5" ry="3.5" fill="#94A3B8" />
      <ellipse cx="10" cy="15" rx="4" ry="3" fill="#CBD5E1" />
    </svg>
  );
  if (type === "cloudy") return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <ellipse cx="14" cy="11" rx="6" ry="4" fill="#94A3B8" />
      <ellipse cx="9" cy="13" rx="5" ry="3.5" fill="#CBD5E1" />
      <ellipse cx="15" cy="14" rx="4" ry="3" fill="#CBD5E1" />
    </svg>
  );
  if (type === "rainy") return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="9" rx="6" ry="4" fill="#94A3B8" />
      <ellipse cx="8" cy="11" rx="4" ry="3" fill="#CBD5E1" />
      <line x1="9" y1="15" x2="8" y2="18" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="15" x2="11" y2="18" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="15" x2="14" y2="18" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
  if (type === "snowy") return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="9" rx="6" ry="4" fill="#CBD5E1" />
      <circle cx="9" cy="16" r="1.5" fill="#BAE6FD" />
      <circle cx="12" cy="17.5" r="1.5" fill="#BAE6FD" />
      <circle cx="15" cy="16" r="1.5" fill="#BAE6FD" />
    </svg>
  );
  // thundery
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="9" rx="6" ry="4" fill="#94A3B8" />
      <path d="M12 13 L10 17 L13 16 L11 21" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const WEEKDAYS_SHORT = ["日", "月", "火", "水", "木", "金", "土"];

function useClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const d = `${now.getMonth() + 1}/${now.getDate()}（${WEEKDAYS_SHORT[now.getDay()]}）`;
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      setTime(`${d} ${h}:${m}`);
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);
  return time;
}

export default function WeatherHeader() {
  const time = useClock();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeather().then((w) => { setWeather(w); setLoading(false); });
  }, []);

  if (!time) return null;

  const today = weather?.today;
  const iconType = today ? weatherIconType(today.weatherCode) : null;

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* メイン行 */}
      <button
        onClick={() => weather && setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-2"
        disabled={!weather}
      >
        <span className="text-xs text-gray-500 tabular-nums">{time}</span>
        <div className="flex items-center gap-1.5">
          {loading && <span className="text-xs text-gray-400">天気取得中…</span>}
          {!loading && !weather && <span className="text-xs text-gray-400">天気不明</span>}
          {today && iconType && (
            <>
              <WeatherIconSvg type={iconType} className="h-5 w-5" />
              <span className="text-xs font-semibold text-gray-700">
                {today.tempMax ? `${today.tempMax}°` : ""}
                {today.tempMin ? `/${today.tempMin}°` : ""}
              </span>
              {today.pop && (
                <span className="text-xs text-blue-500">{today.pop}%</span>
              )}
              <span className="text-xs text-gray-400">{weather?.areaName}</span>
            </>
          )}
        </div>
      </button>

      {/* 週間予報ドロワー */}
      {open && weather && (
        <div className="overflow-x-auto border-t border-gray-100 bg-sky-50 pb-2 pt-2">
          <div className="flex gap-1 px-3" style={{ minWidth: "max-content" }}>
            {weather.week.map((day, i) => (
              <div key={i} className="flex w-14 flex-col items-center gap-1 rounded-xl px-1 py-2 text-center">
                <span className={`text-xs font-bold ${i === 0 ? "text-green-700" : "text-gray-600"}`}>
                  {i === 0 ? "今日" : day.date.replace(/\d+\/\d+/, "").replace(/[（）]/g, "")}
                </span>
                <span className="text-xs text-gray-500">{i !== 0 ? day.date.match(/\d+\/\d+/)?.[0] : ""}</span>
                <WeatherIconSvg type={weatherIconType(day.weatherCode)} className="h-7 w-7" />
                {day.pop && (
                  <span className="text-xs text-blue-500">{day.pop}%</span>
                )}
                <div className="text-xs leading-tight text-gray-700">
                  {day.tempMax && <div className="text-red-500 font-semibold">{day.tempMax}°</div>}
                  {day.tempMin && <div className="text-blue-500">{day.tempMin}°</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
