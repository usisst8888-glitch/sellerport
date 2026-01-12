import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sellerport.app'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "셀러포트 - 인스타그램 DM 자동화 & 링크트리",
    template: "%s | 셀러포트",
  },
  description: "인스타그램 DM 자동화, 맞춤형 링크트리, 광고 성과 추적까지. 셀러를 위한 올인원 마케팅 솔루션",
  keywords: ["인스타그램 DM 자동화", "링크트리", "인플루언서 마케팅", "광고비 추적", "ROAS", "셀러포트", "인스타그램 광고", "협찬 관리"],
  authors: [{ name: "셀러포트" }],
  creator: "셀러포트",
  publisher: "셀러포트",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: baseUrl,
    siteName: "셀러포트",
    title: "셀러포트 - 인스타그램 DM 자동화 & 링크트리",
    description: "인스타그램 DM 자동화, 맞춤형 링크트리, 광고 성과 추적까지. 셀러를 위한 올인원 마케팅 솔루션",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "셀러포트 - 인스타그램 DM 자동화 & 링크트리",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "셀러포트 - 인스타그램 DM 자동화 & 링크트리",
    description: "인스타그램 DM 자동화, 맞춤형 링크트리, 광고 성과 추적까지. 셀러를 위한 올인원 마케팅 솔루션",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <meta name="naver-site-verification" content="fdd77017108ec555aba9a8b082dd3dda62bc0528" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "셀러포트",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "description": "인스타그램, 유튜브, 블로그 등 다양한 광고 채널의 효과를 실시간으로 추적하고 수익을 자동으로 계산하는 온라인 광고 성과 관리 플랫폼",
              "url": "https://sellerport.app",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW"
              },
              "publisher": {
                "@type": "Organization",
                "name": "어시스트솔루션",
                "url": "https://sellerport.app"
              },
              "featureList": [
                "광고 성과 실시간 추적",
                "ROAS 자동 계산",
                "인플루언서 협찬 관리",
                "Meta/Instagram 광고 연동",
                "유튜브 광고 분석",
                "광고 성과 추적 자동화"
              ]
            })
          }}
        />
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '2313945845720098');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=2313945845720098&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
