/**
 * PWAアイコン生成スクリプト（開発時に一度だけ実行）
 * 使い方: npm i --no-save sharp && node scripts/generate-icons.mjs
 */
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const logo = (bg) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  ${bg ? `<rect width="512" height="512" rx="116" fill="#15803D"/>` : `<rect width="512" height="512" fill="#15803D"/>`}
  <g transform="translate(96,84) scale(10)">
    <path d="M15 28C7.5 26.5 4 20.5 4.5 13.5 11 15 14.6 19.5 15.4 25" fill="#A7E08F"/>
    <path d="M16.5 27.5c-1-6.5 1.5-12 8-15 .8 7-1.5 12.5-7 15" fill="#D3F0C2"/>
    <path d="M16 26C16 16 18 9 22.5 4" stroke="#F3C75B" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <ellipse cx="22.8" cy="5.2" rx="1.7" ry="2.6" transform="rotate(38 22.8 5.2)" fill="#F6D27A"/>
    <ellipse cx="19.6" cy="7.6" rx="1.6" ry="2.5" transform="rotate(58 19.6 7.6)" fill="#F6D27A"/>
    <ellipse cx="25.4" cy="8.4" rx="1.6" ry="2.5" transform="rotate(20 25.4 8.4)" fill="#F6D27A"/>
    <ellipse cx="18.6" cy="11.2" rx="1.5" ry="2.4" transform="rotate(64 18.6 11.2)" fill="#F0C766"/>
    <ellipse cx="24.2" cy="12" rx="1.5" ry="2.4" transform="rotate(24 24.2 12)" fill="#F0C766"/>
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });

await sharp(Buffer.from(logo(true))).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(Buffer.from(logo(true))).resize(512, 512).png().toFile("public/icons/icon-512.png");
// maskable: セーフゾーン確保のため全面塗り
await sharp(Buffer.from(logo(false))).resize(512, 512).png().toFile("public/icons/maskable-512.png");

console.log("icons generated in public/icons/");
