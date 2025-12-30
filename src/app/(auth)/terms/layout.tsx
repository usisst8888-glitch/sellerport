import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '이용약관',
  description: '셀러포트 서비스 이용약관입니다. 서비스 이용 조건 및 회사와 이용자의 권리, 의무, 책임 사항을 확인하세요.',
  openGraph: {
    title: '이용약관 | 셀러포트',
    description: '셀러포트 서비스 이용약관',
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
