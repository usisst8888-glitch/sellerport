'use client'

import { useState, useEffect, useCallback } from 'react'
import { Select } from '@/components/ui/select'

interface Designer {
  id: string
  name: string
  specialty: string
  bio: string | null
  profileImageUrl: string | null
  rating: number
  reviewCount: number
  completedProjects: number
  priceRange: string
  priceMin: number | null
  priceMax: number | null
  responseTime: string
  isOnline: boolean
  isVerified: boolean
  serviceTypes: string[]
  tags: string[]
  portfolioCategories: string[]
  portfolios: {
    id: string
    title: string
    category: string
    serviceType: string
    imageUrls: string[]
    isFeatured: boolean
  }[]
}

const serviceTypes = [
  { id: 'detail', label: '상세페이지', icon: '📄' },
  { id: 'thumbnail', label: '썸네일', icon: '🖼️' },
  { id: 'banner', label: '배너', icon: '🎯' },
  { id: 'photo', label: '촬영', icon: '📸' },
  { id: 'branding', label: '브랜딩', icon: '✨' },
]

const budgetOptions = [
  '10만원 미만',
  '10만원 ~ 30만원',
  '30만원 ~ 50만원',
  '50만원 이상',
  '협의',
]

export default function DesignersPage() {
  const [designers, setDesigners] = useState<Designer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedDesigner, setSelectedDesigner] = useState<Designer | null>(null)
  const [sending, setSending] = useState(false)

  // 의뢰 폼 상태
  const [requestForm, setRequestForm] = useState({
    serviceType: 'detail',
    productName: '',
    productUrl: '',
    requirements: '',
    budgetRange: '협의',
  })

  const fetchDesigners = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedService) {
        params.append('service_type', selectedService)
      }

      const res = await fetch(`/api/designers?${params.toString()}`)
      const data = await res.json()

      if (data.success) {
        setDesigners(data.data)
      }
    } catch (error) {
      console.error('디자이너 목록 조회 에러:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedService])

  useEffect(() => {
    fetchDesigners()
  }, [fetchDesigners])

  const handleOpenRequestModal = (designer: Designer) => {
    setSelectedDesigner(designer)
    setRequestForm({
      serviceType: designer.serviceTypes[0] || 'detail',
      productName: '',
      productUrl: '',
      requirements: '',
      budgetRange: '협의',
    })
    setShowRequestModal(true)
  }

  const handleSendRequest = async () => {
    if (!selectedDesigner) return

    setSending(true)
    try {
      const res = await fetch('/api/design-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designerId: selectedDesigner.id,
          serviceType: requestForm.serviceType,
          productName: requestForm.productName,
          productUrl: requestForm.productUrl,
          requirements: requestForm.requirements,
          budgetRange: requestForm.budgetRange,
        }),
      })

      const data = await res.json()

      if (data.success) {
        alert('문의가 성공적으로 전송되었습니다!')
        setShowRequestModal(false)
        setSelectedDesigner(null)
      } else {
        alert(data.error || '문의 전송에 실패했습니다')
      }
    } catch (error) {
      console.error('문의 전송 에러:', error)
      alert('문의 전송에 실패했습니다')
    } finally {
      setSending(false)
    }
  }

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/30 to-slate-800/40 border border-blue-500/20 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-6">
          <div className="text-5xl">🎨</div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white mb-1">빨간불 상품, 디자인 개선으로 해결하세요</h2>
            <p className="text-sm text-slate-400">
              광고 효율이 낮은 상품은 상세페이지나 썸네일 개선으로 전환율을 높일 수 있습니다.
              셀러포트 인증 디자이너가 도와드립니다.
            </p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors whitespace-nowrap">
            무료 상담 신청
          </button>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : designers.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🎨</div>
          <p className="text-slate-400">등록된 디자이너가 없습니다</p>
          <p className="text-sm text-slate-500 mt-2">곧 검증된 디자이너들이 등록될 예정입니다</p>
        </div>
      ) : (
        /* 디자이너 목록 */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {designers.map((designer) => (
            <div
              key={designer.id}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-5 hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                {/* 프로필 */}
                <div className="relative">
                  {designer.profileImageUrl ? (
                    <img
                      src={designer.profileImageUrl}
                      alt={designer.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                      {designer.name.charAt(0)}
                    </div>
                  )}
                  {designer.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-800" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-medium text-white">{designer.name}</h3>
                    {designer.isVerified && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">인증</span>
                    )}
                    {designer.isOnline && (
                      <span className="text-xs text-emerald-400">온라인</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{designer.specialty}</p>

                  {/* 평점 및 통계 */}
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-amber-400">★</span>
                      <span className="text-white font-medium">{designer.rating.toFixed(1)}</span>
                      <span className="text-slate-500">({designer.reviewCount})</span>
                    </div>
                    <span className="text-slate-500">작업 {designer.completedProjects}건</span>
                  </div>

                  {/* 태그 */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {designer.tags.slice(0, 4).map((tag) => (
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
                      onClick={() => handleOpenRequestModal(designer)}
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
      )}

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
                <Select
                  value={requestForm.serviceType}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, serviceType: e.target.value }))}
                >
                  {serviceTypes.map((s) => (
                    <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                  ))}
                  <option value="other">기타</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">상품명 또는 링크</label>
                <input
                  type="text"
                  value={requestForm.productName}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="예: 프리미엄 유기농 단백질 쉐이크"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">상품 URL (선택)</label>
                <input
                  type="text"
                  value={requestForm.productUrl}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, productUrl: e.target.value }))}
                  placeholder="https://smartstore.naver.com/..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">요청 사항</label>
                <textarea
                  rows={4}
                  value={requestForm.requirements}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, requirements: e.target.value }))}
                  placeholder="원하시는 스타일, 참고 이미지, 일정 등을 자유롭게 작성해주세요"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">예산</label>
                <Select
                  value={requestForm.budgetRange}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, budgetRange: e.target.value }))}
                >
                  {budgetOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
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
                onClick={handleSendRequest}
                disabled={sending || !requestForm.productName}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '전송 중...' : '문의 보내기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
