'use client'

import { useState } from 'react'

const mockDesigners = [
  {
    id: 1,
    name: '김디자인',
    specialty: '상세페이지 전문',
    rating: 4.9,
    reviewCount: 127,
    completedProjects: 342,
    priceRange: '15만원~',
    responseTime: '보통 2시간 내 응답',
    tags: ['상세페이지', '썸네일', '배너'],
    portfolio: ['건강식품', '뷰티', '패션'],
    isOnline: true,
  },
  {
    id: 2,
    name: '이크리에이터',
    specialty: '썸네일 & 광고 소재',
    rating: 4.8,
    reviewCount: 89,
    completedProjects: 256,
    priceRange: '8만원~',
    responseTime: '보통 30분 내 응답',
    tags: ['썸네일', '광고소재', 'SNS'],
    portfolio: ['전자기기', '리빙', '식품'],
    isOnline: true,
  },
  {
    id: 3,
    name: '박스튜디오',
    specialty: '브랜딩 & 상세페이지',
    rating: 4.7,
    reviewCount: 64,
    completedProjects: 178,
    priceRange: '25만원~',
    responseTime: '보통 4시간 내 응답',
    tags: ['브랜딩', '상세페이지', '로고'],
    portfolio: ['프리미엄', '뷰티', '패션'],
    isOnline: false,
  },
  {
    id: 4,
    name: '최아트',
    specialty: '촬영 & 편집 일체',
    rating: 4.9,
    reviewCount: 203,
    completedProjects: 512,
    priceRange: '30만원~',
    responseTime: '보통 1시간 내 응답',
    tags: ['촬영', '편집', '상세페이지'],
    portfolio: ['식품', '뷰티', '리빙'],
    isOnline: true,
  },
]

const serviceTypes = [
  { id: 'detail', label: '상세페이지', icon: '📄' },
  { id: 'thumbnail', label: '썸네일', icon: '🖼️' },
  { id: 'banner', label: '배너', icon: '🎯' },
  { id: 'photo', label: '촬영', icon: '📸' },
  { id: 'branding', label: '브랜딩', icon: '✨' },
]

export default function DesignersPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedDesigner, setSelectedDesigner] = useState<typeof mockDesigners[0] | null>(null)

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">디자이너 연결</h1>
          <p className="text-slate-400 mt-1">검증된 디자이너와 직접 연결하세요</p>
        </div>
      </div>

      {/* 서비스 타입 필터 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedService(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedService === null ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          전체
        </button>
        {serviceTypes.map((service) => (
          <button
            key={service.id}
            onClick={() => setSelectedService(service.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedService === service.id ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <span>{service.icon}</span>
            {service.label}
          </button>
        ))}
      </div>

      {/* 안내 배너 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900/30 to-slate-800/40 border border-violet-500/20 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-6">
          <div className="text-5xl">🎨</div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">빨간불 상품, 디자인 개선으로 해결하세요</h2>
            <p className="text-sm text-slate-400">
              광고 효율이 낮은 상품은 상세페이지나 썸네일 개선으로 전환율을 높일 수 있습니다.
              셀러포트 인증 디자이너가 도와드립니다.
            </p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors whitespace-nowrap">
            무료 상담 신청
          </button>
        </div>
      </div>

      {/* 디자이너 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockDesigners.map((designer) => (
          <div
            key={designer.id}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-5 hover:border-white/10 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              {/* 프로필 */}
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {designer.name.charAt(0)}
                </div>
                {designer.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-800" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-medium text-white">{designer.name}</h3>
                  {designer.isOnline && (
                    <span className="text-xs text-emerald-400">온라인</span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-2">{designer.specialty}</p>

                {/* 평점 및 통계 */}
                <div className="flex items-center gap-4 text-sm mb-3">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400">★</span>
                    <span className="text-white font-medium">{designer.rating}</span>
                    <span className="text-slate-500">({designer.reviewCount})</span>
                  </div>
                  <span className="text-slate-500">작업 {designer.completedProjects}건</span>
                </div>

                {/* 태그 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {designer.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 가격 및 응답 시간 */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-blue-400 font-medium">{designer.priceRange}</span>
                    <span className="text-xs text-slate-500 ml-2">{designer.responseTime}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDesigner(designer)
                      setShowRequestModal(true)
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
                  >
                    문의하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 문의 모달 */}
      {showRequestModal && selectedDesigner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">디자인 문의</h3>
              <p className="text-sm text-slate-400 mt-1">{selectedDesigner.name}님께 문의를 보냅니다</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">서비스 유형</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors">
                  <option>상세페이지 제작</option>
                  <option>썸네일 제작</option>
                  <option>배너 제작</option>
                  <option>촬영 의뢰</option>
                  <option>기타</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">상품명 또는 링크</label>
                <input
                  type="text"
                  placeholder="예: 프리미엄 유기농 단백질 쉐이크"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">요청 사항</label>
                <textarea
                  rows={4}
                  placeholder="원하시는 스타일, 참고 이미지, 일정 등을 자유롭게 작성해주세요"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">예산</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors">
                  <option>10만원 미만</option>
                  <option>10만원 ~ 30만원</option>
                  <option>30만원 ~ 50만원</option>
                  <option>50만원 이상</option>
                  <option>협의</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => setShowRequestModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                문의 보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
