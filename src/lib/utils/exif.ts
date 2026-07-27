"use client";

import { gps, parse } from "exifr";

export type PhotoExif = {
  /** 写真ファイル自体のEXIF DateTimeOriginal（ISO文字列。抽出できなければnull） */
  capturedAt: string | null;
  /** 写真ファイル自体のEXIF GPS（抽出できなければnull） */
  latitude: number | null;
  longitude: number | null;
};

const EMPTY_EXIF: PhotoExif = { capturedAt: null, latitude: null, longitude: null };

/**
 * 写真ファイル自体のEXIF（撮影時刻・GPS）を抽出する。
 * canvas圧縮（imageCompress.ts）はEXIFを保持しないため、圧縮前のオリジナルファイルに対して呼ぶこと。
 * EXIF自体が無い写真（スクリーンショット・EXIF除去済み等）やパース失敗時はnullを返す
 * （record_media.captured_at/latitude/longitude＝記録操作時の値へフォールバックする。tasks/TASKS.md PR2 制約4）。
 */
export async function extractPhotoExif(file: File): Promise<PhotoExif> {
  try {
    const [gpsResult, tags] = await Promise.allSettled([
      gps(file),
      parse(file, { pick: ["DateTimeOriginal"] }),
    ]);

    const location = gpsResult.status === "fulfilled" ? gpsResult.value : undefined;
    const dateTimeOriginal =
      tags.status === "fulfilled" && tags.value?.DateTimeOriginal instanceof Date
        ? (tags.value.DateTimeOriginal as Date)
        : null;

    return {
      capturedAt: dateTimeOriginal && !Number.isNaN(dateTimeOriginal.getTime()) ? dateTimeOriginal.toISOString() : null,
      latitude: typeof location?.latitude === "number" ? location.latitude : null,
      longitude: typeof location?.longitude === "number" ? location.longitude : null,
    };
  } catch (err) {
    console.warn("[exif] extract failed", err);
    return EMPTY_EXIF;
  }
}
