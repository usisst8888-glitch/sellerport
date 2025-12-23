'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface InstagramMedia {
  id: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  timestamp: string
}

interface InstagramDmModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  channelId: string | null
  isConnected: boolean
}

export function InstagramDmModal({ isOpen, onClose, onSuccess, channelId, isConnected }: InstagramDmModalProps) {
  const [form, setForm] = useState({
    triggerKeywords: '',
    dmMessage: '',
    followMessage: '',
    targetUrl: ''
  })
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 게시물 선택
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [loadingMedia, setLoadingMedia] = useState(false)

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setForm({ triggerKeywords: '', dmMessage: '', followMessage: '', targetUrl: '' })
      setSelectedMediaId(null)
      setMessage(null)
    }
  }, [isOpen])

  // 게시물 목록 불러오기
  const fetchMedia = async () => {
    if (!channelId) return
    setLoadingMedia(true)
    try {
      const response = await fetch(`/api/instagram/media?channelId=${channelId}`)
      const result = await response.json()
      if (result.success) {
        setMedia(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setLoadingMedia(false)
    }
  }

  const openMediaModal = () => {
    setShowMediaModal(true)
    fetchMedia()
  }

  // DM 설정 생성
  const handleCreate = async () => {
    if (!form.triggerKeywords || !form.dmMessage || !form.targetUrl || !form.followMessage) {
      setMessage({ type: 'error', text: '모든 필드를 입력해주세요' })
      return
    }

    setCreating(true)
    try {
      const selectedMedia = media.find(m => m.id === selectedMediaId)

      const response = await fetch('/api/tracking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelType: 'instagram',
          postName: selectedMedia?.caption?.slice(0, 50) || 'Instagram DM',
          targetUrl: form.targetUrl,
          enableDmAutoSend: true,
          dmTriggerKeywords: form.triggerKeywords,
          dmMessage: form.dmMessage,
          requireFollow: true,
          followMessage: form.followMessage,
          instagramMediaId: selectedMediaId,
          instagramMediaUrl: selectedMedia?.permalink,
          instagramMediaType: selectedMedia?.media_type,
          instagramCaption: selectedMedia?.caption
        })
      })

      const result = await response.json()
      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setMessage({ type: 'error', text: result.error || '설정에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '오류가 발생했습니다' })
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Instagram DM 자동발송</h3>
                  <p className="text-sm text-slate-400">댓글 트리거로 자동 DM 발송</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* 에러 메시지 */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {message.text}
              </div>
            )}

            {/* Instagram 미연결 */}
            {!isConnected ? (
              <div className="p-6 rounded-xl bg-slate-700/50 border border-slate-600 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-pink-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-medium mb-2">Instagram 연결이 필요합니다</h4>
                <p className="text-sm text-slate-400 mb-4">DM 자동발송을 사용하려면 먼저 Instagram 비즈니스 계정을 연결해주세요</p>
                <Link href="/quick-start" className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-sm font-medium">
                  빠른 시작에서 연결하기
                </Link>
              </div>
            ) : (
              <>
                {/* 1. 게시물 선택 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 text-white text-xs mr-2">1</span>
                    게시물 선택
                  </label>
                  {selectedMediaId ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700 border border-slate-600">
                      {media.find(m => m.id === selectedMediaId) && (
                        <>
                          <img
                            src={media.find(m => m.id === selectedMediaId)?.thumbnail_url || media.find(m => m.id === selectedMediaId)?.media_url}
                            alt="선택된 게시물"
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {media.find(m => m.id === selectedMediaId)?.caption?.slice(0, 50) || '캡션 없음'}
                            </p>
                          </div>
                          <button onClick={() => setSelectedMediaId(null)} className="p-2 text-slate-400 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={openMediaModal}
                      className="w-full p-4 rounded-xl bg-slate-700/50 border-2 border-dashed border-slate-600 text-slate-400 hover:border-pink-500 hover:text-pink-400 transition-colors flex flex-col items-center gap-2"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">게시물 선택하기</span>
                    </button>
                  )}
                </div>

                {/* 2. 트리거 키워드 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 text-white text-xs mr-2">2</span>
                    댓글 트리거 키워드
                  </label>
                  <input
                    type="text"
                    placeholder="예: 링크, 구매, 정보 (쉼표로 구분)"
                    value={form.triggerKeywords}
                    onChange={(e) => setForm({ ...form, triggerKeywords: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-pink-500"
                  />
                </div>

                {/* 3. 팔로우 요청 메시지 (첫 번째 DM) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 text-white text-xs mr-2">3</span>
                    팔로우 요청 메시지
                    <span className="ml-2 text-xs text-pink-400">(첫 번째 DM)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="안녕하세요! 댓글 감사합니다 🙏&#10;&#10;링크를 받으시려면 팔로우 후 아래 버튼을 눌러주세요!"
                    value={form.followMessage}
                    onChange={(e) => setForm({ ...form, followMessage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-pink-500 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">댓글 작성자에게 먼저 발송됩니다. &quot;팔로우 했어요&quot; 버튼이 자동 포함됩니다.</p>
                </div>

                {/* 4. 팔로워용 DM 메시지 (두 번째 DM) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 text-white text-xs mr-2">4</span>
                    팔로워용 메시지
                    <span className="ml-2 text-xs text-green-400">(두 번째 DM + 링크)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="감사합니다! 요청하신 링크 보내드립니다 👇"
                    value={form.dmMessage}
                    onChange={(e) => setForm({ ...form, dmMessage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-pink-500 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">팔로우 확인 후 발송됩니다. 메시지 끝에 추적 링크가 자동 추가됩니다.</p>
                </div>

                {/* 5. 목적지 URL */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pink-500 text-white text-xs mr-2">5</span>
                    목적지 URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://smartstore.naver.com/..."
                    value={form.targetUrl}
                    onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-pink-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* 버튼 */}
          {isConnected && (
            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium">
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !form.targetUrl || !form.dmMessage || !form.triggerKeywords || !form.followMessage}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium disabled:opacity-50"
              >
                {creating ? '설정 중...' : 'DM 자동발송 설정'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 게시물 선택 모달 */}
      {showMediaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-slate-700">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white">게시물 선택</h3>
              <button onClick={() => setShowMediaModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loadingMedia ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
                </div>
              ) : media.length === 0 ? (
                <p className="text-center text-slate-400 py-8">게시물이 없습니다</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedMediaId(item.id); setShowMediaModal(false) }}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedMediaId === item.id ? 'border-pink-500' : 'border-transparent hover:border-slate-500'}`}
                    >
                      <img src={item.thumbnail_url || item.media_url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
