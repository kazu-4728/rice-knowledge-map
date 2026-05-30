import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import "../styles/tokens.css";
import "../styles/app-shell.css";
import "../styles/map.css";
import "../styles/content.css";

export const metadata: Metadata = {
  title: "みらい稲作管理",
  description: "実画像マップ型の稲作ナレッジ記録PWA",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
