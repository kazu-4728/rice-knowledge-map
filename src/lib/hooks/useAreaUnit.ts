"use client";

import { useCallback, useEffect, useState } from "react";
import { nextAreaUnit, type AreaUnit } from "../utils/geo";

const STORAGE_KEY = "areaUnit";
const EVENT_NAME = "areaunitchange";
const DEFAULT_UNIT: AreaUnit = "ha";

function readStoredUnit(): AreaUnit {
  if (typeof window === "undefined") return DEFAULT_UNIT;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === "ha" || v === "tan" || v === "sqm") return v;
  return DEFAULT_UNIT;
}

/** 面積表示単位（ha/反/㎡）。localStorageで永続化し、全画面で同期する */
export function useAreaUnit(): [AreaUnit, () => void] {
  const [unit, setUnit] = useState<AreaUnit>(DEFAULT_UNIT);

  useEffect(() => {
    setUnit(readStoredUnit());
    const onChange = () => setUnit(readStoredUnit());
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const cycleUnit = useCallback(() => {
    const next = nextAreaUnit(readStoredUnit());
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return [unit, cycleUnit];
}
