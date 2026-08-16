import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import PwaRegister from "../components/pwa/PwaRegister";
import { DrawerProvider } from "../components/layout/DrawerContext";
import { ToastProvider } from "../components/ui/Toast";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "みらい稲作管理",
  description: "家族で共有する実画像マップ型の稲作ナレッジ記録アプリ",
  applicationName: "みらい稲作管理",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "稲作管理",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap"
        />
      </head>
      <body className="bg-background text-foreground antialiased font-sans">
        <DrawerProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </DrawerProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
