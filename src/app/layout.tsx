import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@toss/tds-colors/colors.css";
import { AppProvider } from "@/components/providers/app-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable}`}
      data-scroll-behavior="smooth"
    >
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
