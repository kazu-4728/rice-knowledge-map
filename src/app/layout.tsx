import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "みらい稲作管理",
  description: "実画像マップ型の稲作ナレッジ記録PWA",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-[#F3F4F0] text-gray-900 antialiased">{children}</body>
    </html>
  );
}
