import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "@fontsource/pretendard/400.css";
import "@fontsource/pretendard/500.css";
import "@fontsource/pretendard/600.css";
import "@fontsource/pretendard/700.css";
import "@fontsource/pretendard/800.css";
import "@toss/tds-colors/colors.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProvider } from "@/components/providers/app-provider";
import { PointsToaster } from "@/components/PointsToaster";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://jwj.zuu3.kr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "좌우지간",
    template: "%s | 좌우지간",
  },
  description: "선동 없는 정치 정보. 국회 법안을 진보·보수 두 시각으로 정리해드려요.",
  keywords: ["정치", "국회", "법안", "진보", "보수", "MZ세대", "정치 리터러시"],
  authors: [{ name: "좌우지간" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "좌우지간",
    title: "좌우지간 — 선동 없는 정치 정보",
    description: "국회 법안을 진보·보수 두 시각으로 정리해드려요.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "좌우지간",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "좌우지간 — 선동 없는 정치 정보",
    description: "국회 법안을 진보·보수 두 시각으로 정리해드려요.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
