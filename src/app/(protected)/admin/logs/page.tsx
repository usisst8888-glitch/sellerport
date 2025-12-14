'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface ClickLog {
  id: string
  tracking_link_id: string
  tracking_link_name: string
  user_email: string
  ip_address: string | null
  user_agent: string | null
  referer: string | null
  fbp: string | null
  fbc: string | null
  click_id: string | null
  is_converted: boolean
  converted_at: string | null
  created_at: string
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ClickLog[]>([])
  const [loading, setLoading] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchIp, setSearchIp] = useState('')
  const [searchReferer, setSearchReferer] = useState('')
  const [filterConverted, setFilterConverted] = useState<'all' | 'converted' | 'not_converted'>('all')
  const [selectedLog, setSelectedLog] = useState<ClickLog | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [page, filterConverted])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })

      if (searchIp) params.append('ip', searchIp)
      if (searchReferer) params.append('referer', searchReferer)
      if (filterConverted !== 'all') params.append('converted', filterConverted === 'converted' ? 'true' : 'false')

      const response = await fetch(`/api/admin/logs?${params.toString()}`)
      const data = await response.json()

      if (response.status === 403) {
        setHasPermission(false)
        return
      }

      if (data.success) {
        setHasPermission(true)
        setLogs(data.data)
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchLogs()
  }

  const handleReset = () => {
    setSearchIp('')
    setSearchReferer('')
    setFilterConverted('all')
    setPage(1)
    fetchLogs()
  }

  const formatUserAgent = (ua: string | null) => {
    if (!ua) return '-'
    // 간단한 파싱
    if (ua.includes('iPhone')) return 'iPhone'
    if (ua.includes('Android')) return 'Android'
    if (ua.includes('Windows')) return 'Windows'
    if (ua.includes('Mac')) return 'Mac'
    if (ua.includes('Linux')) return 'Linux'
    return ua.substring(0, 30) + '...'
  }

  const formatReferer = (referer: string | null) => {
    if (!referer) return '직접 접속'
    try {
      const url = new URL(referer)
      return url.hostname
    } catch {
      return referer.substring(0, 30)
    }
  }

  if (loading && logs.length === 0) {
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
          <h1 className="text-2xl font-bold text-white">유입 로그</h1>
          <p className="text-slate-400 mt-1">추적 링크 클릭 로그를 확인합니다</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchLogs()}
          disabled={loading}
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          새로고침
        </Button>
      </div>

      {/* 검색 필터 */}
      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">IP 주소</label>
            <input
              type="text"
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              placeholder="예: 192.168.1.1"
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">레퍼럴</label>
            <input
              type="text"
              value={searchReferer}
              onChange={(e) => setSearchReferer(e.target.value)}
              placeholder="예: instagram.com"
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">전환 여부</label>
            <select
              value={filterConverted}
              onChange={(e) => setFilterConverted(e.target.value as 'all' | 'converted' | 'not_converted')}
              className="w-full px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="all">전체</option>
              <option value="converted">전환됨</option>
              <option value="not_converted">미전환</option>
            </select>
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

      {/* 로그 테이블 */}
      <div className="bg-slate-800/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">시간</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">추적 링크</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">사용자</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">레퍼럴</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">기기</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">전환</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{new Date(log.created_at).toLocaleDateString('ko-KR')}</p>
                    <p className="text-xs text-slate-500">{new Date(log.created_at).toLocaleTimeString('ko-KR')}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-mono">{log.tracking_link_id}</p>
                    <p className="text-xs text-slate-500">{log.tracking_link_name || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-400">{log.user_email || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-mono">{log.ip_address || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-400">{formatReferer(log.referer)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-slate-400">{formatUserAgent(log.user_agent)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {log.is_converted ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        전환
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-500/20 text-slate-400">
                        대기
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
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
              {logs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    로그가 없습니다
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
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">클릭 상세 정보</h3>
                <button
                  onClick={() => setSelectedLog(null)}
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
                  <p className="text-xs text-slate-500 mb-1">클릭 ID</p>
                  <p className="text-sm text-white font-mono break-all">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">추적 링크 ID</p>
                  <p className="text-sm text-white font-mono">{selectedLog.tracking_link_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">클릭 시간</p>
                  <p className="text-sm text-white">{new Date(selectedLog.created_at).toLocaleString('ko-KR')}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">전환 여부</p>
                  <p className="text-sm">
                    {selectedLog.is_converted ? (
                      <span className="text-emerald-400">전환됨 ({selectedLog.converted_at ? new Date(selectedLog.converted_at).toLocaleString('ko-KR') : ''})</span>
                    ) : (
                      <span className="text-slate-400">미전환</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <p className="text-xs text-slate-500 mb-2">IP 주소</p>
                <p className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded-lg">{selectedLog.ip_address || '-'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">레퍼럴 (Referer)</p>
                <p className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded-lg break-all">{selectedLog.referer || '직접 접속'}</p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-2">User Agent</p>
                <p className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded-lg break-all">{selectedLog.user_agent || '-'}</p>
              </div>

              {(selectedLog.fbp || selectedLog.fbc) && (
                <div className="border-t border-white/5 pt-4">
                  <p className="text-xs text-slate-500 mb-2">Meta Pixel 정보</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600">_fbp</p>
                      <p className="text-sm text-white font-mono break-all">{selectedLog.fbp || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600">_fbc</p>
                      <p className="text-sm text-white font-mono break-all">{selectedLog.fbc || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedLog.click_id && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Click ID (GCLID/FBCLID 등)</p>
                  <p className="text-sm text-white font-mono bg-slate-900/50 px-3 py-2 rounded-lg break-all">{selectedLog.click_id}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
