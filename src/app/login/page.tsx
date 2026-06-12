import type { Metadata } from "next";
import LoginScreen from "../../features/auth/LoginScreen";

export const metadata: Metadata = { title: "ログイン | みらい稲作管理" };

export default function LoginPage() {
  return <LoginScreen />;
}
