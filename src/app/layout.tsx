import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css"; // KaTeX CSS 추가

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "J-Math: AI Math Solver",
  description: "AI 튜터와 함께하는 개인화된 수학 학습 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-900 text-gray-100`}>
        {children}
      </body>
    </html>
  );
}