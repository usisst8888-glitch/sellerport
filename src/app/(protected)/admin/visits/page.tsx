'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface SiteVisit {
  id: string
  page_path: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  utm_content: string | null
  utm_term: string | null
  referer: string | null
  referer_domain: string | null
  user_agent: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  ip_address: string | null
  country: string | null
  city: string | null
  session_id: string | null
  visitor_id: string | null
  user_id: string | null
  created_at: string
}

interface VisitStats {
  todayVisits: number
  totalVisits: number
  utmSources: string[]
  deviceStats: {
    mobile: number
    desktop: number
    tablet: number
  }
}

export default function AdminVisitsPage() {
  const [visits, setVisits] = useState<SiteVisit[]>([])
  const [stats, setStats] = useState<VisitStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // 필터
  const [filterUtmSource, setFilterUtmSource] = useState('')
  const [filterReferer, setFilterReferer] = useState('')
  const [filterDevice, setFilterDevice] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null)

  useEffect(() => {
    fetchVisits()
  }, [page])

  const fetchVisits = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (filterUtmSource) params.append('utm_source', filterUtmSource)
      if (filterReferer) params.append('referer_domain', filterReferer)
      if (filterDevice) params.append('device_type', filterDevice)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)

      const response = await fetch(`/api/admin/visits?${params.toString()}`)
      const data = await response.json()

      if (response.status === 403) {
        setHasPermission(false)
        return
      }

      if (data.success) {
        setHasPermission(true)
        setVisits(data.data)
        setStats(data.stats)
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.totalCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch visits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchVisits()
  }

  const handleReset = () => {
    setFilterUtmSource('')
    setFilterReferer('')
    setFilterDevice('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
    fetchVisits()
  }

  const getDeviceIcon = (deviceType: string | null) => {
    switch (deviceType) {
      case 'mobile':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'tablet':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
    }
  }

  if (loading && visits.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">접근 권한이 없습니다</h2>
          <p className="text-slate-400">관리자 또는 매니저만 접근할 수 있습니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">사이트 방문 로그</h1>
          <p className="text-slate-400 mt-1">랜딩페이지 방문자를 추적합니다 (비회원 포함)</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchVisits()}
          disabled={loading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">오늘 방문</p>
            <p className="text-2xl font-bold text-white">{stats.todayVisits.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">전체 방문</p>
            <p className="text-2xl font-bold text-white">{stats.totalVisits.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">모바일</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.deviceStats.mobile.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
            <p className="text-sm text-slate-400 mb-1">데스크톱</p>
            <p className="text-2xl font-bold text-blue-400">{stats.deviceStats.desktop.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* 검색 필터 */}
      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">UTM Source</label>
            <input
              type="text"
              value={filterUtmSource}
              onChange={(e) => setFilterUtmSource(e.target.value)}
              placeholder="예: google"
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">레퍼럴 도메인</label>
            <input
              type="text"
              value={filterReferer}
              onChange={(e) => setFilterReferer(e.target.value)}
              placeholder="예: instagram.com"
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">기기 유형</label>
            <select
              value={filterDevice}
              onChange={(e) => setFilterDevice(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="">전체</option>
              <option value="mobile">모바일</option>
              <option value="desktop">데스크톱</option>
              <option value="tablet">태블릿</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">시작일</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">종료일</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              검색
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              초기화
            </Button>
          </div>
        </div>
      </div>

      {/* UTM 소스 태그 */}
      {stats && stats.utmSources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-slate-400">UTM 소스:</span>
          {stats.utmSources.map((source) => (
            <button
              key={source}
              onClick={() => {
                setFilterUtmSource(source)
                setPage(1)
                fetchVisits()
              }}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filterUtmSource === source
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
              }`}
            >
              {source}
            </button>
          ))}
        </div>
      )}

      {/* 방문 로그 테이블 */}
      <div className="bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-sm text-slate-400">
            총 <span className="text-white font-medium">{totalCount.toLocaleString()}</span>개의 방문 기록
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">시간</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">페이지</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">UTM Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">레퍼럴</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">기기</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">브라우저</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">IP</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {visits.map((visit) => (
                <tr key={visit.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{new Date(visit.created_at).toLocaleDateString('ko-KR')}</p>
                    <p className="text-xs text-slate-500">{new Date(visit.created_at).toLocaleTimeString('ko-KR')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-mono">{visit.page_path}</p>
                  </td>
                  <td className="px-4 py-3">
                    {visit.utm_source ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">
                        {visit.utm_source}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-400">{visit.referer_domain || '직접 접속'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      {getDeviceIcon(visit.device_type)}
                      <span className="text-sm capitalize">{visit.device_type || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-400">{visit.browser || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-mono">{visit.ip_address || '-'}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedVisit(visit)}
                      className="text-slate-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))}
              {visits.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    방문 기록이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
            <p className="text-sm text-slate-400">
              페이지 {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="border-slate-600 text-slate-300"
              >
                이전
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="border-slate-600 text-slate-300"
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedVisit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">방문 상세 정보</h3>
                <button
                  onClick={() => setSelectedVisit(null)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">방문 ID</p>
                  <p className="text-sm text-white font-mono break-all">{selectedVisit.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">방문 시간</p>
                  <p className="text-sm text-white">{new Date(selectedVisit.created_at).toLocaleString('ko-KR')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">페이지 경로</p>
                  <p className="text-sm text-white font-mono">{selectedVisit.page_path}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">기기 유형</p>
                  <p className="text-sm text-white capitalize">{selectedVisit.device_type || '-'}</p>
                </div>
              </div>

              {/* UTM 파라미터 */}
              {(selectedVisit.utm_source || selectedVisit.utm_medium || selectedVisit.utm_campaign) && (
                <div className="border-t border-white/5 pt-4">
                  <p className="text-xs text-slate-500 mb-3">UTM 파라미터</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                      <p className="text-xs text-slate-500">Source</p>
                      <p className="text-sm text-white">{selectedVisit.utm_source || '-'}</p>
                    </div>
                    <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                      <p className="text-xs text-slate-500">Medium</p>
                      <p className="text-sm text-white">{selectedVisit.utm_medium || '-'}</p>
                    </div>
                    <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                      <p className="text-xs text-slate-500">Campaign</p>
                      <p className="text-sm text-white">{selectedVisit.utm_campaign || '-'}</p>
                    </div>
                    <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                      <p className="text-xs text-slate-500">Content</p>
                      <p className="text-sm text-white">{selectedVisit.utm_content || '-'}</p>
                    </div>
                    {selectedVisit.utm_term && (
                      <div className="bg-slate-900/50 px-3 py-2 rounded-lg col-span-2">
                        <p className="text-xs text-slate-500">Term</p>
                        <p className="text-sm text-white">{selectedVisit.utm_term}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 레퍼럴 정보 */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-slate-500 mb-2">레퍼럴 (Referer)</p>
                <p className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded-lg break-all">
                  {selectedVisit.referer || '직접 접속'}
                </p>
              </div>

              {/* 기기 정보 */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-slate-500 mb-3">기기 정보</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-slate-500">브라우저</p>
                    <p className="text-sm text-white">{selectedVisit.browser || '-'}</p>
                  </div>
                  <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-slate-500">OS</p>
                    <p className="text-sm text-white">{selectedVisit.os || '-'}</p>
                  </div>
                  <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-slate-500">IP 주소</p>
                    <p className="text-sm text-white font-mono">{selectedVisit.ip_address || '-'}</p>
                  </div>
                </div>
              </div>

              {/* User Agent */}
              <div>
                <p className="text-xs text-slate-500 mb-2">User Agent</p>
                <p className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded-lg break-all">
                  {selectedVisit.user_agent || '-'}
                </p>
              </div>

              {/* 세션 정보 */}
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-slate-500 mb-3">세션 정보</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-slate-500">Visitor ID</p>
                    <p className="text-sm text-white font-mono break-all">{selectedVisit.visitor_id || '-'}</p>
                  </div>
                  <div className="bg-slate-900/50 px-3 py-2 rounded-lg">
                    <p className="text-xs text-slate-500">Session ID</p>
                    <p className="text-sm text-white font-mono break-all">{selectedVisit.session_id || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
