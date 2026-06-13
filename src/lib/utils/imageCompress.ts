export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const longSide = Math.max(bitmap.width, bitmap.height);
  const scale = longSide > 1600 ? 1600 / longSide : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise<Blob>((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), "image/jpeg", 0.8)
  );
}
