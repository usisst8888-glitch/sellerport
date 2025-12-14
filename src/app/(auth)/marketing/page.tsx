'use client'

import Link from 'next/link'

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link
            href="/signup"
            className="text-slate-400 hover:text-white text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            회원가입으로 돌아가기
          </Link>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-2">마케팅 정보 수신 동의</h1>
          <p className="text-slate-400 text-sm mb-8">최종 수정일: 2025년 12월 15일</p>

          <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300">
            <p className="text-sm leading-relaxed">
              어시스트솔루션(이하 &quot;회사&quot;)은 &quot;셀러포트&quot; 서비스 관련 마케팅 정보 발송을 위해 아래와 같이 개인정보를 수집·이용하고자 합니다. 본 동의는 선택 사항으로, 동의하지 않으셔도 서비스 이용이 가능합니다.
            </p>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">1. 마케팅 정보 수신 목적</h2>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>신규 서비스 및 기능 안내</li>
                <li>프로모션, 이벤트, 할인 정보 제공</li>
                <li>맞춤형 광고 및 서비스 추천</li>
                <li>서비스 이용 팁 및 활용 가이드 제공</li>
                <li>설문조사 및 의견 수렴</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">2. 수집·이용 항목</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">수집 항목</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">이용 목적</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4">이메일 주소</td>
                      <td className="py-3 px-4">이메일을 통한 마케팅 정보 발송</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4">전화번호</td>
                      <td className="py-3 px-4">SMS, 알림톡을 통한 마케팅 정보 발송</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4">서비스 이용 기록</td>
                      <td className="py-3 px-4">맞춤형 광고 및 서비스 추천</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">3. 수신 채널</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-700/50 rounded-xl text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white">이메일</p>
                  <p className="text-xs text-slate-400 mt-1">뉴스레터, 프로모션</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-xl text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white">SMS</p>
                  <p className="text-xs text-slate-400 mt-1">문자 메시지</p>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-xl text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white">알림톡</p>
                  <p className="text-xs text-slate-400 mt-1">카카오톡 알림</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">4. 보유 및 이용 기간</h2>
              <p className="text-sm">
                마케팅 정보 수신 동의일로부터 <strong className="text-white">동의 철회 시 또는 회원 탈퇴 시까지</strong> 보유·이용됩니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">5. 동의 철회 방법</h2>
              <p className="text-sm mb-4">
                마케팅 정보 수신 동의는 언제든지 철회할 수 있으며, 철회 방법은 다음과 같습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong className="text-white">서비스 내 설정:</strong> 셀러포트 로그인 → 설정 → 알림 설정에서 마케팅 수신 동의 해제</li>
                <li><strong className="text-white">고객센터 문의:</strong> 1666-5157 또는 leadproject.cp@gmail.com으로 수신 거부 요청</li>
                <li><strong className="text-white">수신 메시지 내 수신거부:</strong> 발송된 이메일 하단의 &quot;수신거부&quot; 링크 클릭</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">6. 동의 거부권 안내</h2>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm">
                  귀하는 마케팅 정보 수신에 대한 동의를 거부할 권리가 있습니다. <strong className="text-white">본 동의는 선택 사항</strong>으로, 동의하지 않으셔도 셀러포트 서비스의 기본 기능은 정상적으로 이용하실 수 있습니다. 다만, 동의를 거부하실 경우 신규 서비스, 이벤트, 프로모션 등의 유용한 정보를 받아보실 수 없습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">7. 광고성 정보 전송 관련 고지</h2>
              <p className="text-sm">
                「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제50조에 따라, 영리 목적의 광고성 정보는 수신자의 명시적인 사전 동의를 받아 전송됩니다. 광고성 정보에는 전송자의 명칭, 전화번호, 전자우편주소, 수신 거부 방법이 명시됩니다.
              </p>
            </section>

            <section className="mt-12 pt-8 border-t border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">부칙</h2>
              <p className="text-sm">본 마케팅 정보 수신 동의서는 2025년 12월 15일부터 시행됩니다.</p>
            </section>

            <section className="mt-8 p-4 bg-slate-700/50 rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-3">서비스 운영사 정보</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-slate-400">상호:</span> 어시스트솔루션</p>
                <p><span className="text-slate-400">대표자:</span> 배철응</p>
                <p><span className="text-slate-400">사업자등록번호:</span> 602-27-04681</p>
                <p><span className="text-slate-400">주소:</span> 서울시 광진구 화양동 15-51</p>
                <p><span className="text-slate-400">전화번호:</span> 070-8095-7325</p>
                <p><span className="text-slate-400">이메일:</span> usisst8888@gmail.com</p>
              </div>
            </section>

            <section className="mt-4 p-4 bg-slate-700/50 rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-3">결제 및 고객센터 정보</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-slate-400">상호:</span> (주)리프컴퍼니</p>
                <p><span className="text-slate-400">대표자:</span> 박상호</p>
                <p><span className="text-slate-400">사업자등록번호:</span> 413-87-02826</p>
                <p><span className="text-slate-400">주소:</span> 서울시 광진구 구의동 218-13 202호</p>
                <p><span className="text-slate-400">고객센터:</span> 1666-5157</p>
                <p><span className="text-slate-400">이메일:</span> leadproject.cp@gmail.com</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
