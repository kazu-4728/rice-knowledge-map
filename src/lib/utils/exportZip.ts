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

type LocationSource = "photo_exif" | "recorded_at_fallback" | "none";
type PhotoLocation = { latitude: number | null; longitude: number | null; source: LocationSource };

/**
 * 緯度・経度は片方だけ元EXIF由来という混在を避けるため、必ずペアで同一ソースから選ぶ。
 * 元EXIFの緯度経度が両方揃っていればそれを、無ければ記録時の緯度経度が両方揃っている場合のみ
 * それを使う（metadata.json向け。JPEG本体へのEXIF書き込みには使わない＝下のwriteExifToJpeg参照）。
 */
function resolvePhotoLocation(photo: ExportPhoto): PhotoLocation {
  if (photo.exifLatitude !== null && photo.exifLongitude !== null) {
    return { latitude: photo.exifLatitude, longitude: photo.exifLongitude, source: "photo_exif" };
  }
  if (photo.recordedLatitude !== null && photo.recordedLongitude !== null) {
    return { latitude: photo.recordedLatitude, longitude: photo.recordedLongitude, source: "recorded_at_fallback" };
  }
  return { latitude: null, longitude: null, source: "none" };
}

/**
 * 写真1枚にEXIF（撮影時刻・GPS）を書き戻す。
 * 写真ファイル自体から抽出できた元EXIF（photo.exifCapturedAt等）がある場合のみ書き込む。
 * 記録操作時の時刻・位置（photo.recordedAt等）へフォールバックしてDateTimeOriginal/GPSタグに
 * 書くと、画像だけを読む外部ツール・AIには本物の撮影情報に見えてしまい、PCで既存写真を選んだ
 * ケース等で誤った撮影日時・場所を渡すことになる（migration 0011の意図と矛盾するためレビュー
 * 指摘で修正）。フォールバック値はmetadata.json側にのみ、由来を明示して記載する。
 */
async function writeExifToJpeg(blob: Blob, photo: ExportPhoto): Promise<Blob> {
  const capturedAt = photo.exifCapturedAt;
  const latitude = photo.exifLatitude;
  const longitude = photo.exifLongitude;
  if (!capturedAt && (latitude === null || longitude === null)) return blob;

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

type PhotoMetadata = {
  file: string;
  capturedAt: string | null;
  capturedAtSource: "photo_exif" | "recorded_at_fallback" | "none";
  latitude: number | null;
  longitude: number | null;
  locationSource: LocationSource;
};

/**
 * 画像ファイル＋JSON形式のメタデータ一覧をZIPにまとめる（他アプリ・自作パイプライン連携用）。
 * 画像ファイル自体にも元EXIFの位置情報・時刻を書き戻す（canvas圧縮でEXIFが失われている現状の補完）。
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
  const metadata: Record<string, unknown>[] = [];

  for (const r of records) {
    // 取得・書き込みに成功した写真だけをmetadata.jsonへ載せる。失敗分まで載せると、
    // 自作パイプラインが存在しないphotos/*.jpgを参照して停止しうるため（レビュー指摘対応）
    const photoEntries: PhotoMetadata[] = [];

    for (let i = 0; i < r.photos.length; i++) {
      const photo = r.photos[i];
      try {
        const res = await fetch(photo.url);
        if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
        const original = await res.blob();
        const withExif = await writeExifToJpeg(original, photo);
        const file = `photos/${r.id}_${i + 1}.jpg`;
        photosFolder.file(file, withExif);

        // 撮影時刻とGPSは元EXIFの有無が別々に決まる（例: 日時だけEXIFにあり位置情報はオフだった写真）。
        // 1つの source フラグにまとめると、一方だけ元EXIF由来のときに他方まで「撮影情報」と
        // 誤認させてしまうため、capturedAtSource/locationSourceを独立に判定する
        const location = resolvePhotoLocation(photo);
        photoEntries.push({
          file,
          capturedAt: photo.exifCapturedAt ?? photo.recordedAt,
          capturedAtSource:
            photo.exifCapturedAt !== null ? "photo_exif" : photo.recordedAt !== null ? "recorded_at_fallback" : "none",
          latitude: location.latitude,
          longitude: location.longitude,
          locationSource: location.source,
        });
      } catch (err) {
        console.warn("[exportZip] photo fetch/write failed", r.id, i, err);
        failedCount++;
      }
      done++;
      onProgress?.(done, totalPhotos);
    }

    metadata.push({
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
      photos: photoEntries,
    });
  }

  zip.file("metadata.json", JSON.stringify(metadata, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, photoCount: totalPhotos - failedCount, failedCount };
}
