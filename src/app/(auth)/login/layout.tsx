import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '로그인',
  description: '셀러포트에 로그인하여 광고 성과를 관리하세요. 인스타그램, 유튜브, 블로그 광고 효과를 실시간으로 추적합니다.',
  openGraph: {
    title: '로그인 | 셀러포트',
    description: '셀러포트에 로그인하여 광고 성과를 관리하세요.',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
