import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '셀러포트의 개인정보 수집 및 이용에 관한 안내입니다. 수집 항목, 이용 목적, 보유 기간 등을 확인하세요.',
  openGraph: {
    title: '개인정보처리방침 | 셀러포트',
    description: '셀러포트의 개인정보 처리방침',
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
