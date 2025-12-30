import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '회원가입',
  description: '셀러포트에 가입하고 온라인 광고 성과를 효율적으로 관리하세요. 무료로 시작할 수 있습니다.',
  openGraph: {
    title: '회원가입 | 셀러포트',
    description: '셀러포트에 가입하고 온라인 광고 성과를 효율적으로 관리하세요.',
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
