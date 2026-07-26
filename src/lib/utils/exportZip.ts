"use client";

import piexif from "piexifjs";
import JSZip from "jszip";
import type { ExportRecord, ExportPhoto } from "../data/exportData";

function bytesToBinaryString(bytes: Uint8Array): string {
  // spreadで一度に渡せる引数長には上限があるため、chunk単位でString.fromCharCodeへ渡す
  const CHUNK = 0x8000;
  let result = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    result += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return result;
}

function binaryStringToBlob(binary: string, type: string): Blob {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

function toDmsRational(decimalDegrees: number): [[number, number], [number, number], [number, number]] {
  const abs = Math.abs(decimalDegrees);
  const degrees = Math.floor(abs);
  const minutesFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const secondsFloat = (minutesFloat - minutes) * 60;
  return [
    [degrees, 1],
    [minutes, 1],
    [Math.round(secondsFloat * 100), 100],
  ];
}

function toExifDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}:${pad(d.getMonth() + 1)}:${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * 写真1枚にEXIF（撮影時刻・GPS）を書き戻す。
 * 元EXIF（photo.exifCapturedAt等）があればそれを、無ければ記録操作時の値
 * （photo.recordedAt等）を使う。後者の場合は「撮影時刻」ではなく「記録した時刻・場所」
 * であることを、ZIP付随のJSONメタデータ側で明示する（呼び出し側の責務。tasks/TASKS.md PR2 制約4）。
 */
async function writeExifToJpeg(blob: Blob, photo: ExportPhoto): Promise<Blob> {
  const capturedAt = photo.exifCapturedAt ?? photo.recordedAt;
  const latitude = photo.exifLatitude ?? photo.recordedLatitude;
  const longitude = photo.exifLongitude ?? photo.recordedLongitude;
  if (!capturedAt && latitude === null) return blob;

  try {
    const buf = await blob.arrayBuffer();
    const binary = bytesToBinaryString(new Uint8Array(buf));

    const exifDict: Record<string, Record<number, unknown>> = { "0th": {}, Exif: {}, GPS: {} };
    if (capturedAt) {
      const exifTime = toExifDateTime(capturedAt);
      exifDict["0th"][piexif.ImageIFD.DateTime] = exifTime;
      exifDict["Exif"][piexif.ExifIFD.DateTimeOriginal] = exifTime;
      exifDict["Exif"][piexif.ExifIFD.DateTimeDigitized] = exifTime;
    }
    if (latitude !== null && longitude !== null) {
      exifDict["GPS"][piexif.GPSIFD.GPSLatitudeRef] = latitude >= 0 ? "N" : "S";
      exifDict["GPS"][piexif.GPSIFD.GPSLatitude] = toDmsRational(latitude);
      exifDict["GPS"][piexif.GPSIFD.GPSLongitudeRef] = longitude >= 0 ? "E" : "W";
      exifDict["GPS"][piexif.GPSIFD.GPSLongitude] = toDmsRational(longitude);
    }

    const exifBytes = piexif.dump(exifDict);
    const inserted = piexif.insert(exifBytes, binary);
    return binaryStringToBlob(inserted, "image/jpeg");
  } catch (err) {
    // 破損JPEG等でEXIF書き込みに失敗しても、元画像はそのままZIPに含める
    console.warn("[exportZip] exif write failed", err);
    return blob;
  }
}

export type BuildZipResult = { blob: Blob; photoCount: number; failedCount: number };

/**
 * 画像ファイル＋JSON形式のメタデータ一覧をZIPにまとめる（他アプリ・自作パイプライン連携用）。
 * 画像ファイル自体にも位置情報・時刻をEXIFとして書き戻す（canvas圧縮でEXIFが失われている現状の補完）。
 */
export async function buildRecordsZip(
  records: ExportRecord[],
  onProgress?: (done: number, total: number) => void
): Promise<BuildZipResult> {
  const zip = new JSZip();
  const photosFolder = zip.folder("photos");
  if (!photosFolder) throw new Error("failed to create photos folder");

  const totalPhotos = records.reduce((n, r) => n + r.photos.length, 0);
  let done = 0;
  let failedCount = 0;

  const metadata = records.map((r) => ({
    id: r.id,
    title: r.title,
    fieldName: r.fieldName,
    category: r.category,
    pointType: r.pointTypeLabel || null,
    status: r.statusLabel,
    recordedAt: r.recordedAtISO,
    note: r.note || null,
    summary: r.summary || null,
    nextAction: r.nextAction || null,
    latitude: r.latitude,
    longitude: r.longitude,
    hasAudio: r.hasAudio,
    photos: r.photos.map((p, i) => {
      const usesOriginalExif = p.exifCapturedAt !== null || p.exifLatitude !== null;
      return {
        file: `photos/${r.id}_${i + 1}.jpg`,
        // 元写真のEXIFを検出できた場合は撮影情報として、できなかった場合は
        // 記録操作時の時刻・端末位置であることを明示する（撮影情報と誤認させない。制約4）
        source: usesOriginalExif ? "photo_exif" : "recorded_at_fallback",
        capturedAt: p.exifCapturedAt ?? p.recordedAt,
        latitude: p.exifLatitude ?? p.recordedLatitude,
        longitude: p.exifLongitude ?? p.recordedLongitude,
      };
    }),
  }));
  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  for (const r of records) {
    for (let i = 0; i < r.photos.length; i++) {
      const photo = r.photos[i];
      try {
        const res = await fetch(photo.url);
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const original = await res.blob();
        const withExif = await writeExifToJpeg(original, photo);
        photosFolder.file(`${r.id}_${i + 1}.jpg`, withExif);
      } catch (err) {
        console.warn("[exportZip] photo fetch/write failed", r.id, i, err);
        failedCount++;
      }
      done++;
      onProgress?.(done, totalPhotos);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, photoCount: totalPhotos - failedCount, failedCount };
}
