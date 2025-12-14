'use client'

import Link from 'next/link'

export default function TermsPage() {
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
          <h1 className="text-2xl font-bold text-white mb-2">셀러포트 이용약관</h1>
          <p className="text-slate-400 text-sm mb-8">최종 수정일: 2025년 12월 15일</p>

          <div className="prose prose-invert prose-slate max-w-none space-y-8 text-slate-300">
            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제1조 (목적)</h2>
              <p className="text-sm leading-relaxed">
                본 약관은 어시스트솔루션(이하 &quot;회사&quot;)이 운영하는 온라인 광고 성과 분석 서비스 &quot;셀러포트&quot;(이하 &quot;서비스&quot;)의 이용 조건 및 절차, 회사와 이용자의 권리, 의무, 책임 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제2조 (용어 정의)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>&quot;서비스&quot;란 회사가 제공하는 온라인 광고 성과 분석, 전환 추적, 수익 계산 등 관련 제반 서비스를 의미합니다.</li>
                <li>&quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
                <li>&quot;회원&quot;이란 서비스에 가입하여 아이디(ID)를 부여받은 자로서, 서비스 이용 계약을 체결한 자를 말합니다.</li>
                <li>&quot;아이디(ID)&quot;란 회원 식별과 서비스 이용을 위해 회원이 설정하고 회사가 승인하는 이메일 주소를 말합니다.</li>
                <li>&quot;비밀번호&quot;란 회원이 자신의 비밀 보호를 위해 설정한 문자와 숫자의 조합을 말합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제3조 (약관의 효력 및 변경)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
                <li>회사는 &quot;약관의 규제에 관한 법률&quot;, &quot;정보통신망 이용촉진 및 정보보호 등에 관한 법률&quot; 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
                <li>회사가 약관을 개정할 경우, 적용일자 및 개정 사유를 명시하여 현행 약관과 함께 서비스 초기 화면에 그 적용일자 7일 전부터 적용일자 전일까지 공지합니다. 다만, 회원에게 불리한 약관 개정의 경우에는 30일 전부터 공지하며, 이메일 등 전자적 수단을 통해 별도로 통지합니다.</li>
                <li>회원이 개정 약관의 적용에 동의하지 않는 경우, 회원은 이용 계약을 해지할 수 있습니다. 개정 약관 시행일까지 거부 의사를 표시하지 않으면 개정 약관에 동의한 것으로 봅니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제4조 (서비스 이용 계약의 체결)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>이용 계약은 회원이 되고자 하는 자(이하 &quot;가입 신청자&quot;)가 약관의 내용에 대하여 동의를 한 다음 회원 가입 신청을 하고, 회사가 이러한 신청에 대해 승낙함으로써 체결됩니다.</li>
                <li>회사는 가입 신청자의 신청에 대해 서비스 이용을 승낙함을 원칙으로 합니다. 다만, 회사는 다음 각 호에 해당하는 신청에 대해서는 승낙을 하지 않거나 사후에 이용 계약을 해지할 수 있습니다:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>가입 신청자가 본 약관에 의하여 이전에 회원 자격을 상실한 적이 있는 경우</li>
                    <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                    <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                    <li>이용자의 귀책 사유로 인하여 승인이 불가능하거나 기타 규정한 제반 사항을 위반하며 신청하는 경우</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제5조 (서비스의 제공 및 변경)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>회사는 다음과 같은 서비스를 제공합니다:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>온라인 광고 채널 연동 및 성과 분석</li>
                    <li>전환 추적 및 데이터 수집</li>
                    <li>수익 계산 및 리포트 생성</li>
                    <li>기타 회사가 추가 개발하거나 제휴를 통해 제공하는 서비스</li>
                  </ul>
                </li>
                <li>회사는 서비스의 내용을 변경할 경우, 변경 내용 및 제공 일자를 서비스 내 공지사항에 게시하거나 이메일 등으로 회원에게 통지합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제6조 (서비스의 중단)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                <li>회사는 제1항의 사유로 서비스 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대해 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
                <li>사업 종목의 전환, 사업의 포기, 업체 간의 통합 등의 이유로 서비스를 제공할 수 없게 되는 경우, 회사는 제8조에서 정한 방법으로 이용자에게 통지하고 당초 회사에서 제시한 조건에 따라 소비자에게 보상합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제7조 (회원의 의무)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>회원은 다음 행위를 하여서는 안 됩니다:
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>신청 또는 변경 시 허위 내용의 등록</li>
                    <li>타인의 정보 도용</li>
                    <li>회사가 게시한 정보의 변경</li>
                    <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                    <li>회사 및 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                    <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                    <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                  </ul>
                </li>
                <li>회원은 관계 법령, 본 약관의 규정, 이용 안내 및 서비스와 관련하여 공지한 주의 사항, 회사가 통지하는 사항 등을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 안 됩니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제8조 (회원에 대한 통지)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>회사가 회원에 대한 통지를 하는 경우, 회원이 서비스 가입 시 등록한 이메일 주소 또는 전화번호로 할 수 있습니다.</li>
                <li>회사는 불특정 다수 회원에 대한 통지의 경우 1주일 이상 서비스 내 공지사항에 게시함으로써 개별 통지에 갈음할 수 있습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제9조 (유료 서비스)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>회사가 제공하는 서비스 중 일부는 유료로 제공될 수 있으며, 이용 요금 및 결제 방법은 서비스 내 별도 안내에 따릅니다.</li>
                <li>유료 서비스 이용 요금의 결제는 (주)리프컴퍼니를 통해 처리됩니다.</li>
                <li>회원이 유료 서비스 이용 요금을 결제한 경우, 회사는 전자상거래 등에서의 소비자 보호에 관한 법률에 따라 환불 정책을 적용합니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제10조 (저작권의 귀속)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>서비스에 대한 저작권 및 지적재산권은 회사에 귀속됩니다.</li>
                <li>이용자는 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제11조 (이용 계약 해지)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>회원은 언제든지 서비스 내 설정 메뉴 또는 고객센터를 통해 이용 계약 해지를 신청할 수 있으며, 회사는 관련 법령 등이 정하는 바에 따라 이를 즉시 처리합니다.</li>
                <li>회원이 이용 계약을 해지하는 경우, 관련 법령 및 개인정보처리방침에 따라 회사가 회원 정보를 보유하는 경우를 제외하고는 해지 즉시 회원의 모든 데이터는 소멸됩니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제12조 (면책 조항)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>회사는 천재지변, 전쟁, 기타 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                <li>회사는 회원의 귀책 사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</li>
                <li>회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것이나 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
                <li>회사는 회원이 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등 내용에 관해서는 책임을 지지 않습니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제13조 (분쟁 해결)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상 처리하기 위해 고객센터를 운영합니다.</li>
                <li>회사와 이용자 간에 발생한 분쟁은 전자문서 및 전자거래 기본법에 따라 설치된 전자문서·전자거래분쟁조정위원회의 조정에 따를 수 있습니다.</li>
                <li>본 약관에 명시되지 않은 사항은 전자상거래 등에서의 소비자 보호에 관한 법률, 약관의 규제에 관한 법률 등 관계 법령에 따릅니다.</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">제14조 (재판권 및 준거법)</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>본 약관에 관한 분쟁에 대해 소송이 제기될 경우, 회사의 본사 소재지를 관할하는 법원을 전속 관할 법원으로 합니다.</li>
                <li>회사와 이용자 간에 제기된 소송에는 대한민국 법을 준거법으로 합니다.</li>
              </ol>
            </section>

            <section className="mt-12 pt-8 border-t border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">부칙</h2>
              <p className="text-sm">본 약관은 2025년 12월 15일부터 시행됩니다.</p>
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
