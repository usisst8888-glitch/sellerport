import type { Metadata } from "next";
import "./globals.css";
import ChannelTalk from "@/components/ChannelTalk";

export const metadata: Metadata = {
  title: "셀러포트 - 온라인 광고 성과 관리",
  description: "인스타그램, 유튜브, 블로그 등 다양한 광고 채널의 효과를 실시간으로 추적하고 수익을 자동으로 계산하세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        {children}
        <ChannelTalk />
      </body>
    </html>
  );
}
