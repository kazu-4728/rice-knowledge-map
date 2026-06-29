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
      <body className="bg-background text-foreground antialiased">
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
