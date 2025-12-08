import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "셀러포트 - 이커머스 정기구독 통합 관리",
  description: "스마트스토어, 카페24, 아임웹 등 이커머스 플랫폼의 정기구독을 한 곳에서 관리하세요",
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
      </body>
    </html>
  );
}
