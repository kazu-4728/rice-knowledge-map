import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New } from "next/font/google";
import PwaRegister from "../components/pwa/PwaRegister";
import { DrawerProvider } from "../components/layout/DrawerContext";
import { ToastProvider } from "../components/ui/Toast";
import "../styles/globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-sans",
  display: "swap",
});

const zenKakuGothicNew = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-heading",
  display: "swap",
});

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
    <html lang="ja" className={`${notoSansJp.variable} ${zenKakuGothicNew.variable}`}>
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
