'use client'

import Link from 'next/link'

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold text-white mb-2">개인정보 수집·이용 동의</h1>
          <p className="text-slate-400 text-sm mb-8">최종 수정일: 2025년 12월 22일</p>

          <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300">
            <p className="text-sm leading-relaxed">
              어시스트솔루션(이하 &quot;회사&quot;)은 &quot;셀러포트&quot; 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용하고자 합니다. 내용을 자세히 읽으신 후 동의 여부를 결정해 주시기 바랍니다.
            </p>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">1. 수집하는 개인정보 항목</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">구분</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">수집 항목</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">필수 항목</td>
                      <td className="py-3 px-4">이메일 주소, 비밀번호, 이름(닉네임), 전화번호, 사용자 유형(셀러/대행사)</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">선택 항목</td>
                      <td className="py-3 px-4">프로필 이미지, 회사명, 사업자등록번호</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">서비스 이용 과정에서 자동 생성·수집되는 정보</td>
                      <td className="py-3 px-4">접속 IP, 접속 로그, 쿠키, 서비스 이용 기록, 기기 정보</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">결제 시 수집 항목 (유료 서비스 이용 시)</td>
                      <td className="py-3 px-4">결제 정보(카드번호, 은행계좌정보 등), 결제 기록</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">2. 개인정보의 수집·이용 목적</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">목적</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">세부 내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">회원 관리</td>
                      <td className="py-3 px-4">회원 가입 의사 확인, 본인 식별·인증, 회원 자격 유지·관리, 서비스 부정 이용 방지, 각종 고지·통지, 분쟁 조정을 위한 기록 보존</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">서비스 제공</td>
                      <td className="py-3 px-4">광고 채널 연동 및 성과 분석, 전환 추적 기능, 수익 계산 및 리포트 제공, 맞춤형 서비스 제공</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">결제 처리</td>
                      <td className="py-3 px-4">유료 서비스 결제 처리, 환불 처리, 세금계산서 발행</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">서비스 개선</td>
                      <td className="py-3 px-4">신규 서비스 개발, 서비스 개선을 위한 통계 분석</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">3. 개인정보의 보유 및 이용 기간</h2>
              <p className="text-sm mb-4">
                회원의 개인정보는 <strong className="text-white">회원 탈퇴 시까지</strong> 보유·이용됩니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">보존 근거</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">보존 항목</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">보존 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">전자상거래 등에서의 소비자 보호에 관한 법률</td>
                      <td className="py-3 px-4">계약 또는 청약철회 등에 관한 기록</td>
                      <td className="py-3 px-4">5년</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">전자상거래 등에서의 소비자 보호에 관한 법률</td>
                      <td className="py-3 px-4">대금결제 및 재화 등의 공급에 관한 기록</td>
                      <td className="py-3 px-4">5년</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">전자상거래 등에서의 소비자 보호에 관한 법률</td>
                      <td className="py-3 px-4">소비자의 불만 또는 분쟁처리에 관한 기록</td>
                      <td className="py-3 px-4">3년</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4 text-slate-400">통신비밀보호법</td>
                      <td className="py-3 px-4">서비스 이용 관련 기록(로그인 기록 등)</td>
                      <td className="py-3 px-4">3개월</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">4. 동의 거부권 및 불이익</h2>
              <p className="text-sm">
                귀하는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 다만, 필수 항목에 대한 동의를 거부할 경우 회원 가입 및 서비스 이용이 제한될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">5. 크롬 확장 프로그램 관련 개인정보 처리</h2>
              <p className="text-sm mb-4">
                회사는 &quot;셀러포트 - 스마트스토어 전환 추적&quot; 크롬 확장 프로그램을 통해 다음과 같이 개인정보를 수집·처리합니다.
              </p>
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">수집 항목</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">수집 목적</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">보유 기간</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4">로그인 토큰</td>
                      <td className="py-3 px-4">사용자 인증 및 API 접근 권한 확인</td>
                      <td className="py-3 px-4">로그아웃 시 삭제</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4">스마트스토어 판매자센터 통계 데이터 (NT 파라미터별 방문수, 주문수, 매출)</td>
                      <td className="py-3 px-4">메타 광고 전환 추적 및 성과 분석</td>
                      <td className="py-3 px-4">서비스 이용 기간</td>
                    </tr>
                    <tr className="border-b border-slate-700">
                      <td className="py-3 px-4">마지막 동기화 시간</td>
                      <td className="py-3 px-4">사용자 편의 제공</td>
                      <td className="py-3 px-4">로그아웃 시 삭제</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm mb-2"><strong className="text-white">확장 프로그램 권한 사용 목적:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                <li><strong className="text-white">activeTab:</strong> 사용자가 확장 프로그램 아이콘을 클릭했을 때 현재 탭이 스마트스토어 판매자센터인지 확인하기 위해 사용</li>
                <li><strong className="text-white">storage:</strong> 로그인 토큰과 마지막 동기화 시간을 로컬에 저장하기 위해 사용 (기기 외부로 전송되지 않음)</li>
                <li><strong className="text-white">호스트 권한 (sell.smartstore.naver.com):</strong> 판매자센터의 사용자정의채널 통계 데이터를 읽기 위해 사용</li>
                <li><strong className="text-white">호스트 권한 (sellerport.app):</strong> 수집된 데이터를 셀러포트 서버로 전송하기 위해 사용</li>
              </ul>
              <p className="text-sm">
                <strong className="text-white">원격 코드:</strong> 본 확장 프로그램은 원격 코드를 사용하지 않습니다. 모든 코드는 확장 프로그램 패키지 내에 포함되어 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">6. 개인정보의 제3자 제공</h2>
              <p className="text-sm mb-4">
                회사는 이용자의 개인정보를 &quot;2. 개인정보의 수집·이용 목적&quot;에서 명시한 범위 내에서만 처리하며, 이용자의 동의 없이는 제3자에게 개인정보를 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>이용자가 사전에 제3자 제공에 동의한 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">7. 이용자의 권리 및 행사 방법</h2>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보의 수집 및 이용에 대한 동의를 철회할 수 있습니다.</li>
                <li>개인정보 조회·수정은 서비스 내 &quot;설정&quot; 메뉴에서, 회원 탈퇴는 설정 메뉴 또는 고객센터(1666-5157)를 통해 가능합니다.</li>
                <li>이용자가 개인정보의 오류에 대한 정정을 요청한 경우, 정정을 완료하기 전까지 해당 개인정보를 이용하거나 제공하지 않습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">8. 개인정보의 파기</h2>
              <p className="text-sm mb-4">
                회사는 원칙적으로 개인정보 처리목적이 달성된 경우에는 지체 없이 해당 개인정보를 파기합니다. 파기의 절차, 기한 및 방법은 다음과 같습니다.
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong className="text-white">파기 절차:</strong> 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정 기간 저장된 후 또는 즉시 파기됩니다.</li>
                <li><strong className="text-white">파기 기한:</strong> 이용자의 개인정보는 개인정보의 보유 기간이 경과된 경우에는 보유 기간의 종료일로부터 5일 이내에, 개인정보의 처리 목적 달성, 해당 서비스의 폐지, 사업의 종료 등 그 개인정보가 불필요하게 되었을 때에는 개인정보의 처리가 불필요한 것으로 인정되는 날로부터 5일 이내에 그 개인정보를 파기합니다.</li>
                <li><strong className="text-white">파기 방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다. 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">9. 개인정보 보호책임자</h2>
              <div className="p-4 bg-slate-700/50 rounded-xl">
                <div className="text-sm space-y-1">
                  <p><span className="text-slate-400">성명:</span> 배철응</p>
                  <p><span className="text-slate-400">직책:</span> 대표</p>
                  <p><span className="text-slate-400">연락처:</span> 070-8095-7325</p>
                  <p><span className="text-slate-400">이메일:</span> usisst8888@gmail.com</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-4">10. 개인정보 처리방침 변경</h2>
              <p className="text-sm">
                이 개인정보 처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>

            <section className="mt-12 pt-8 border-t border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">부칙</h2>
              <p className="text-sm">본 개인정보 수집·이용 동의서는 2025년 12월 22일부터 시행됩니다.</p>
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

          </div>
        </div>
      </div>
    </div>
  )
}
