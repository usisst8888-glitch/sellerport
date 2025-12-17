'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

interface User {
  id: string
  email: string
  displayName: string | null
  businessName: string | null
  businessNumber: string | null
  ownerName: string | null
  phone: string | null
  userType: 'seller' | 'agency' | 'designer' | 'influencer' | 'manager' | 'admin'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  businessLicenseUrl: string | null
  approvedAt: string | null
  rejectionReason: string | null
  createdAt: string
}

// 회원 유형 라벨
const USER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  seller: { label: '셀러', color: 'text-blue-400 bg-blue-500/20' },
  agency: { label: '대행사', color: 'text-purple-400 bg-purple-500/20' },
  designer: { label: '디자이너', color: 'text-pink-400 bg-pink-500/20' },
  influencer: { label: '인플루언서', color: 'text-cyan-400 bg-cyan-500/20' },
  manager: { label: '매니저', color: 'text-orange-400 bg-orange-500/20' },
  admin: { label: '관리자', color: 'text-red-400 bg-red-500/20' }
}

// 승인 상태 라벨
const APPROVAL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '승인 대기', color: 'text-amber-400 bg-amber-500/20' },
  approved: { label: '승인 완료', color: 'text-emerald-400 bg-emerald-500/20' },
  rejected: { label: '거절', color: 'text-red-400 bg-red-500/20' }
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'agency'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    checkPermissionAndFetchUsers()
  }, [filter])

  const checkPermissionAndFetchUsers = async () => {
    try {
      setLoading(true)

      // 회원 목록 조회 (권한 체크는 API에서)
      let url = '/api/admin/users'
      if (filter === 'pending') {
        url += '?status=pending'
      } else if (filter === 'agency') {
        url += '?userType=agency'
      }

      const response = await fetch(url)
      const data = await response.json()

      if (response.status === 403) {
        setHasPermission(false)
        return
      }

      if (data.success) {
        setHasPermission(true)
        setUsers(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      })

      const data = await response.json()
      if (data.success) {
        // 목록 새로고침
        checkPermissionAndFetchUsers()
        setSelectedUser(null)
      }
    } catch (error) {
      console.error('Failed to approve:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (userId: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason })
      })

      const data = await response.json()
      if (data.success) {
        checkPermissionAndFetchUsers()
        setSelectedUser(null)
        setShowRejectModal(false)
        setRejectionReason('')
      }
    } catch (error) {
      console.error('Failed to reject:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleChangeUserType = async (userId: string, newType: string) => {
    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType: newType })
      })

      const data = await response.json()
      if (data.success) {
        checkPermissionAndFetchUsers()
      }
    } catch (error) {
      console.error('Failed to change user type:', error)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
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

  const pendingCount = users.filter(u => u.approvalStatus === 'pending').length

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">회원 관리</h1>
          <p className="text-slate-400 mt-1">회원 승인 및 유형을 관리합니다</p>
        </div>
        {pendingCount > 0 && (
          <div className="px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
            <p className="text-amber-400 font-medium">{pendingCount}건의 승인 대기</p>
          </div>
        )}
      </div>

      {/* 필터 탭 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          승인 대기
          {pendingCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter('agency')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'agency'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          대행사
        </button>
      </div>

      {/* 회원 목록 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">회원 정보</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">회원 유형</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">승인 상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">사업자등록증</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">가입일</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-white">{user.displayName || user.businessName || user.ownerName || '미입력'}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                      {user.phone && <p className="text-xs text-slate-500">{user.phone}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${USER_TYPE_LABELS[user.userType]?.color}`}>
                      {USER_TYPE_LABELS[user.userType]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs rounded ${APPROVAL_STATUS_LABELS[user.approvalStatus]?.color}`}>
                      {APPROVAL_STATUS_LABELS[user.approvalStatus]?.label}
                    </span>
                    {user.rejectionReason && (
                      <p className="text-xs text-red-400 mt-1">{user.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {user.businessLicenseUrl ? (
                      <a
                        href={user.businessLicenseUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        파일 보기
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">미등록</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.approvalStatus === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user.id)}
                            disabled={processing}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                          >
                            승인
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(user)
                              setShowRejectModal(true)
                            }}
                            disabled={processing}
                            className="text-xs"
                          >
                            거절
                          </Button>
                        </>
                      )}
                      <Select
                        value={user.userType}
                        onChange={(e) => handleChangeUserType(user.id, e.target.value)}
                        disabled={processing}
                        className="px-2 py-1 text-xs rounded-lg"
                      >
                        <option value="seller">셀러</option>
                        <option value="agency">대행사</option>
                        <option value="designer">디자이너</option>
                        <option value="influencer">인플루언서</option>
                        <option value="manager">매니저</option>
                        <option value="admin">관리자</option>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    회원이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 거절 모달 */}
      {showRejectModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">승인 거절</h3>
            <p className="text-sm text-slate-400 mb-4">
              {selectedUser.businessName || selectedUser.email}의 대행사 신청을 거절하시겠습니까?
            </p>
            <div className="mb-4">
              <label className="text-sm text-slate-400 block mb-2">거절 사유</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="거절 사유를 입력하세요"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 text-sm"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectModal(false)
                  setSelectedUser(null)
                  setRejectionReason('')
                }}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(selectedUser.id)}
                disabled={processing}
              >
                {processing ? '처리 중...' : '거절'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
