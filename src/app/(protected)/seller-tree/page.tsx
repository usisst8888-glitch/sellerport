'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface SellerTree {
  id: string
  slug: string
  title?: string
  subtitle?: string
  profile_image_url?: string
  background_type: string
  background_color?: string
  background_gradient?: string
  is_active: boolean
  view_count: number
  created_at: string
  updated_at: string
  seller_tree_links?: { count: number }[]
}

interface SellerTreeLink {
  id: string
  title: string
  url: string
  description?: string
  thumbnail_url?: string
  icon?: string
  display_order: number
  is_active: boolean
  click_count: number
}

export default function SellerTreePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sellerTrees, setSellerTrees] = useState<SellerTree[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 새 셀러트리 만들기 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSlug, setNewSlug] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [slugError, setSlugError] = useState('')
  const [slugChecking, setSlugChecking] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/seller-trees')
      if (response.ok) {
        const data = await response.json()
        setSellerTrees(data)
      }
    } catch (error) {
      console.error('Failed to fetch seller trees:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSlug = async (slug: string) => {
    if (slug.length < 3) {
      setSlugAvailable(null)
      return
    }

    setSlugChecking(true)
    try {
      const response = await fetch(`/api/seller-trees/check-slug?slug=${slug}`)
      const data = await response.json()
      setSlugAvailable(data.available)
      if (!data.available) {
        setSlugError(data.message)
      } else {
        setSlugError('')
      }
    } catch {
      setSlugError('확인 중 오류가 발생했습니다')
    } finally {
      setSlugChecking(false)
    }
  }

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setNewSlug(slug)
    setSlugError('')
    setSlugAvailable(null)

    // 디바운스 체크
    if (slug.length >= 3) {
      const timer = setTimeout(() => checkSlug(slug), 500)
      return () => clearTimeout(timer)
    }
  }

  const handleCreate = async () => {
    if (!newSlug || newSlug.length < 3) {
      setSlugError('최소 3자 이상 입력해주세요')
      return
    }

    if (slugAvailable === false) {
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/seller-trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: newSlug,
          title: newTitle || null,
        }),
      })

      if (response.ok) {
        const sellerTree = await response.json()
        router.push(`/seller-tree/${sellerTree.id}/edit`)
      } else {
        const error = await response.json()
        setSlugError(error.error || '생성에 실패했습니다')
      }
    } catch {
      setSlugError('생성 중 오류가 발생했습니다')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleteLoading(true)
    try {
      const response = await fetch(`/api/seller-trees/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSellerTrees(prev => prev.filter(st => st.id !== id))
        setDeletingId(null)
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const getPreviewUrl = (slug: string) => {
    return `https://sp-trk.link/s/${slug}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('클립보드에 복사되었습니다!')
    } catch {
      alert('복사에 실패했습니다')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">셀러트리</h1>
          <p className="text-slate-400 mt-1">나만의 미니홈페이지를 만들고 링크를 공유하세요</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 셀러트리 만들기
        </button>
      </div>

      {/* 안내 배너 */}
      <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">셀러트리란?</h3>
            <p className="text-xs text-slate-400 mt-1">
              인스타그램 프로필, 유튜브 설명란 등에 넣을 수 있는 미니홈페이지입니다.
              여러 링크를 한 페이지에 모아 고객에게 보여주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 셀러트리 목록 */}
      {sellerTrees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellerTrees.map((tree) => (
            <div
              key={tree.id}
              className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors"
            >
              {/* 미리보기 */}
              <div
                className="h-32 flex items-center justify-center relative"
                style={{
                  backgroundColor: tree.background_color || '#1e293b',
                  backgroundImage: tree.background_type === 'gradient' && tree.background_gradient
                    ? `linear-gradient(to bottom right, var(--tw-gradient-stops))`
                    : undefined
                }}
              >
                {tree.profile_image_url ? (
                  <Image
                    src={tree.profile_image_url}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-slate-600 flex items-center justify-center border-4 border-white/20">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                {!tree.is_active && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 text-slate-400 text-xs rounded">
                    비공개
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {tree.title || tree.slug}
                </h3>
                <p className="text-sm text-slate-400 mb-1">{tree.subtitle || '설명 없음'}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {tree.view_count}회 조회
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(tree.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                {/* URL 복사 */}
                <div className="flex items-center gap-2 mb-3 p-2 bg-slate-700/50 rounded-lg">
                  <span className="text-xs text-slate-400 truncate flex-1">
                    {getPreviewUrl(tree.slug)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(getPreviewUrl(tree.slug))}
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/seller-tree/${tree.id}/edit`}
                    className="flex-1 py-2 text-center text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    수정하기
                  </Link>
                  <a
                    href={getPreviewUrl(tree.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <button
                    onClick={() => setDeletingId(tree.id)}
                    className="px-3 py-2 text-sm font-medium bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">아직 셀러트리가 없어요</h3>
          <p className="text-slate-400 text-sm mb-4">
            새 셀러트리를 만들어 링크를 공유해보세요!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            셀러트리 만들기
          </button>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">셀러트리 삭제</h3>
            <p className="text-sm text-slate-400 mb-4">
              정말 이 셀러트리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleteLoading}
                className="flex-1 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteLoading}
                className="flex-1 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 셀러트리 만들기 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">새 셀러트리 만들기</h3>

            {/* 슬러그 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">주소 (URL)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">sp-trk.link/s/</span>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-store"
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                {slugChecking && (
                  <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                )}
                {!slugChecking && slugAvailable === true && (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {!slugChecking && slugAvailable === false && (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                영문 소문자, 숫자, 하이픈만 사용 가능 (최소 3자)
              </p>
              {slugError && (
                <p className="text-xs text-red-400 mt-1">{slugError}</p>
              )}
            </div>

            {/* 타이틀 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">페이지 제목 (선택)</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="내 쇼핑몰"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewSlug('')
                  setNewTitle('')
                  setSlugError('')
                  setSlugAvailable(null)
                }}
                disabled={creating}
                className="flex-1 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newSlug || slugAvailable === false}
                className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {creating ? '생성 중...' : '만들기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
