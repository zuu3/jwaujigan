import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
import "@fontsource/pretendard/800.css";
import "@toss/tds-colors/colors.css";
import { AppProvider } from "@/components/providers/app-provider";
import { PointsToaster } from "@/components/PointsToaster";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "좌우지간",
  description: "우리 동네 정치인 정보와 이슈 분석, AI 토론을 한 흐름으로 확인하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={geistMono.variable}>
      <body>
        <AppProvider>
          {children}
          <PointsToaster />
        </AppProvider>
      </body>
    </html>
  );
}
