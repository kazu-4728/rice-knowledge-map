import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // devモードの左下インジケーターが常設ボトムタブ（左端=ホーム）のクリックを
  // 横取りしE2Eが落ちるため無効化する（本番ビルドには元々存在しない）
  devIndicators: false,
};

export default nextConfig;
