'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type TabType = 'instagram' | 'meta'

interface AdChannel {
  id: string
  channel_type: string
  account_id: string
  account_name: string | null
  channel_name: string | null
  access_token: string
  status: string
  metadata?: {
    profile_picture_url?: string
    [key: string]: unknown
  }
}

// DM 설정 데이터 타입
interface DmSettings {
  triggerKeywords: string
  triggerAllComments: boolean
  requireFollow: boolean
  followMessage: string
  followButtonText: string
  dmMessage: string
}

export default function ContentPublishPage() {
  const [activeTab, setActiveTab] = useState<TabType>('instagram')
  const [adChannels, setAdChannels] = useState<AdChannel[]>([])
  const [loading, setLoading] = useState(true)

  // 연동된 채널 목록 가져오기
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('ad_channels')
          .select('*')
          .eq('user_id', user.id)
          .in('channel_type', ['instagram', 'meta'])
          .eq('status', 'connected')

        if (!error && data) {
          setAdChannels(data)
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchChannels()
  }, [])

  // 탭별 연동된 채널 필터링
  const getChannelsByType = (type: TabType) => {
    if (type === 'meta') {
      return adChannels.filter(c => c.channel_type === 'meta')
    }
    return adChannels.filter(c => c.channel_type === type)
  }

  const tabs = [
    {
      id: 'instagram' as TabType,
      label: '인스타그램',
      icon: '/channel_logo/insta.png',
      description: '피드, 릴스, 캐러셀 발행',
      color: 'from-pink-500/20 to-purple-500/20',
    },
    {
      id: 'meta' as TabType,
      label: 'Meta 광고',
      icon: '/channel_logo/meta.png',
      description: '광고 캠페인 생성',
      color: 'from-blue-500/20 to-indigo-500/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">컨텐츠 발행</h1>
          <p className="text-slate-400 mt-1">인스타그램, Meta 광고를 발행하고 전환을 추적하세요</p>
        </div>
      </div>

      {/* 탭 선택 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tabs.map((tab) => {
          const channels = getChannelsByType(tab.id)
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative overflow-hidden rounded-2xl p-5 text-left transition-colors ${
                isActive
                  ? `bg-gradient-to-br ${tab.color}`
                  : 'bg-slate-800/50 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <img src={tab.icon} alt={tab.label} className="w-14 h-14 rounded-xl" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{tab.label}</h3>
                  <p className="text-sm text-slate-400">{tab.description}</p>
                </div>
                {channels.length > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                    {channels.length}개 연동
                  </span>
                )}
              </div>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              )}
            </button>
          )
        })}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="rounded-2xl bg-slate-800/30 border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">로딩 중...</p>
          </div>
        ) : (
          <>
            {activeTab === 'instagram' && <InstagramTab channels={getChannelsByType('instagram')} />}
            {activeTab === 'meta' && <MetaTab channels={getChannelsByType('meta')} />}
          </>
        )}
      </div>
    </div>
  )
}

// 커스텀 드롭다운 컴포넌트
function CustomDropdown({
  options,
  value,
  onChange,
  placeholder = '선택하세요'
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find(opt => opt.id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-slate-700/50 rounded-lg text-white text-sm text-left flex items-center justify-between gap-2 hover:bg-slate-700 transition-colors"
      >
        <span>{selectedOption?.label || placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onChange(option.id)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-700 transition-colors ${
                  value === option.id ? 'text-pink-400 bg-slate-700/50' : 'text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// DM 설정 모달
function DmSettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (settings: DmSettings) => void
  initialSettings?: DmSettings | null
}) {
  // 버튼 텍스트 옵션들
  const buttonTextOptions = [
    '팔로우 했어요!',
    '팔로우 완료!',
    '팔로우 했어요 ✅',
    '팔로우했어요 💕',
    '팔로우 했어요 🙏',
    '팔로우 했어요 🙌',
    '팔로우 완료 👍',
    '팔로우했어요 😊',
    '팔로우 완료 ✨',
  ]

  const [triggerKeywords, setTriggerKeywords] = useState(initialSettings?.triggerKeywords || '')
  const [triggerAllComments, setTriggerAllComments] = useState(initialSettings?.triggerAllComments || false)
  const [requireFollow, setRequireFollow] = useState(initialSettings?.requireFollow ?? true)
  const [followMessage, setFollowMessage] = useState(initialSettings?.followMessage || '팔로우를 완료하셨다면 아래 버튼을 눌러 확인해주세요! 팔로워에게만 링크가 발송됩니다!')
  const [followButtonText, setFollowButtonText] = useState(initialSettings?.followButtonText || '팔로우 했어요!')
  const [dmMessage, setDmMessage] = useState(initialSettings?.dmMessage || '감사합니다! 요청하신 링크 보내드립니다 👇')

  // initialSettings가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialSettings) {
      setTriggerKeywords(initialSettings.triggerKeywords)
      setTriggerAllComments(initialSettings.triggerAllComments)
      setRequireFollow(initialSettings.requireFollow)
      setFollowMessage(initialSettings.followMessage)
      setFollowButtonText(initialSettings.followButtonText)
      setDmMessage(initialSettings.dmMessage)
    }
  }, [initialSettings])

  const handleSave = () => {
    onSave({
      triggerKeywords,
      triggerAllComments,
      requireFollow,
      followMessage,
      followButtonText,
      dmMessage,
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* 모달 */}
      <div className="relative w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/channel_logo/insta.png" alt="Instagram" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">자동 DM 설정</h2>
              <p className="text-sm text-slate-400">댓글 트리거로 자동 DM 발송</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 space-y-6">
          {/* 1. 댓글 트리거 키워드 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">1</span>
              댓글 트리거 키워드
            </label>

            {/* 모든 댓글 토글 스위치 */}
            <button
              type="button"
              onClick={() => {
                const newValue = !triggerAllComments
                setTriggerAllComments(newValue)
                if (newValue) {
                  setTriggerKeywords('*')
                } else {
                  setTriggerKeywords('')
                }
              }}
              className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all mb-3 ${
                triggerAllComments
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
              }`}
            >
              {/* 토글 스위치 */}
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                triggerAllComments ? 'bg-blue-500' : 'bg-slate-600'
              }`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                  triggerAllComments ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${triggerAllComments ? 'text-white' : 'text-slate-400'}`}>
                  모든 댓글에 반응하기
                </p>
                <p className="text-xs text-slate-500">
                  {triggerAllComments ? '아무 댓글이나 달면 DM이 발송됩니다' : '특정 키워드가 포함된 댓글에만 반응'}
                </p>
              </div>
              {triggerAllComments && (
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {!triggerAllComments && (
              <input
                type="text"
                placeholder="예: 링크, 구매, 정보 (쉼표로 구분)"
                value={triggerKeywords}
                onChange={(e) => setTriggerKeywords(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            )}
          </div>

          {/* 2. 발송 대상 설정 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">2</span>
              발송 대상 설정
            </label>

            <div className="space-y-2">
              {/* 옵션 1: 팔로워만 (기본값) */}
              <button
                type="button"
                onClick={() => setRequireFollow(true)}
                className={`flex items-start gap-3 w-full p-4 rounded-xl border transition-all ${
                  requireFollow
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  requireFollow ? 'border-blue-500' : 'border-slate-500'
                }`}>
                  {requireFollow && (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${requireFollow ? 'text-white' : 'text-slate-400'}`}>
                    팔로워에게만 링크 발송 (권장)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    먼저 팔로우 요청 메시지 발송 → 팔로우 확인 후 링크 발송
                  </p>
                </div>
                {requireFollow && (
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>

              {/* 옵션 2: 모두에게 */}
              <button
                type="button"
                onClick={() => setRequireFollow(false)}
                className={`flex items-start gap-3 w-full p-4 rounded-xl border transition-all ${
                  !requireFollow
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  !requireFollow ? 'border-amber-500' : 'border-slate-500'
                }`}>
                  {!requireFollow && (
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${!requireFollow ? 'text-white' : 'text-slate-400'}`}>
                    모든 댓글 작성자에게 바로 링크 발송
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    팔로워 여부와 관계없이 즉시 링크 발송 (팔로우 요청 메시지 사용 안 함)
                  </p>
                </div>
                {!requireFollow && (
                  <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 3. 팔로우 요청 메시지 (팔로워 체크 모드일 때만) */}
          {requireFollow && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">3</span>
                팔로우 요청 메시지
                <span className="ml-2 text-xs text-blue-400">(첫 번째 DM)</span>
              </label>
              <textarea
                rows={3}
                placeholder="팔로우를 완료하셨다면 아래 버튼을 눌러 확인해주세요! 팔로워에게만 본래의DM이 보내집니다!"
                value={followMessage}
                onChange={(e) => setFollowMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">댓글 작성자에게 먼저 발송됩니다. 선택한 버튼이 말풍선 안에 포함됩니다.</p>

              {/* 버튼 텍스트 선택 */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  버튼 텍스트 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {buttonTextOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setFollowButtonText(option)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        followButtonText === option
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600 border border-slate-600'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. 링크 발송 메시지 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">{requireFollow ? '4' : '3'}</span>
              {requireFollow ? '팔로워용 메시지' : '링크 발송 메시지'}
              {requireFollow && <span className="ml-2 text-xs text-green-400">(두 번째 DM)</span>}
            </label>
            <textarea
              rows={3}
              placeholder="감사합니다! 요청하신 링크 보내드립니다 👇"
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none resize-none"
            />
            <p className="text-xs text-slate-500 mt-2">
              {requireFollow
                ? '팔로우 확인 후 발송됩니다. 메시지 끝에 목적지 URL이 자동 추가됩니다.'
                : '댓글 작성자에게 즉시 발송됩니다. 메시지 끝에 목적지 URL이 자동 추가됩니다.'
              }
            </p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!triggerKeywords || !dmMessage || (requireFollow && !followMessage)}
            className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}

// 인스타그램 탭
function InstagramTab({ channels }: { channels: AdChannel[] }) {
  const [contentType, setContentType] = useState<'feed' | 'reels' | 'story'>('feed')
  const [selectedChannel, setSelectedChannel] = useState(channels[0]?.id || '')
  const [autoDmEnabled, setAutoDmEnabled] = useState(false)
  const [showDmModal, setShowDmModal] = useState(false)
  const [dmSettings, setDmSettings] = useState<DmSettings | null>(null)
  const [caption, setCaption] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [generatingCaption, setGeneratingCaption] = useState(false)

  // 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles: File[] = []
    const newPreviewUrls: string[] = []

    // 피드는 최대 10장, 릴스는 1개
    const maxFiles = contentType === 'feed' ? 10 : 1
    const allowedFiles = Array.from(files).slice(0, maxFiles)

    for (const file of allowedFiles) {
      // 릴스는 영상만, 피드는 이미지만, 스토리는 둘 다 가능
      if (contentType === 'reels') {
        if (!file.type.startsWith('video/')) {
          setMessage({ type: 'error', text: '릴스는 영상 파일만 업로드할 수 있습니다' })
          return
        }
      } else if (contentType === 'feed') {
        if (!file.type.startsWith('image/')) {
          setMessage({ type: 'error', text: '피드는 이미지 파일만 업로드할 수 있습니다' })
          return
        }
      } else if (contentType === 'story') {
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          setMessage({ type: 'error', text: '스토리는 이미지 또는 영상 파일만 업로드할 수 있습니다' })
          return
        }
      }

      newFiles.push(file)
      newPreviewUrls.push(URL.createObjectURL(file))
    }

    // 피드인 경우 기존 파일에 추가 (여러 장 = 캐러셀)
    if (contentType === 'feed') {
      const combinedFiles = [...uploadedFiles, ...newFiles].slice(0, 10)
      const combinedUrls = [...previewUrls, ...newPreviewUrls].slice(0, 10)
      setUploadedFiles(combinedFiles)
      setPreviewUrls(combinedUrls)
    } else {
      // 기존 preview URL 해제
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      setUploadedFiles(newFiles)
      setPreviewUrls(newPreviewUrls)
    }

    setMessage(null)
    // input 초기화
    e.target.value = ''
  }

  // 파일 삭제 핸들러
  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  // 컨텐츠 타입 변경 시 업로드된 파일 초기화
  const handleContentTypeChange = (type: typeof contentType) => {
    if (type !== contentType) {
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      setUploadedFiles([])
      setPreviewUrls([])
    }
    setContentType(type)
  }

  // DM 설정 저장 핸들러
  const handleDmSettingsSave = (settings: DmSettings) => {
    setDmSettings(settings)
    setAutoDmEnabled(true)
  }

  // AI 캡션 생성 핸들러
  const handleGenerateCaption = async () => {
    if (uploadedFiles.length === 0) {
      setMessage({ type: 'error', text: '먼저 이미지를 업로드해주세요' })
      return
    }

    // 이미지 파일 찾기 (동영상인 경우 첫 번째 프레임 사용 불가하므로 에러)
    const imageFile = uploadedFiles.find(f => f.type.startsWith('image/'))
    if (!imageFile) {
      setMessage({ type: 'error', text: '캡션 생성은 이미지 파일만 지원됩니다' })
      return
    }

    setGeneratingCaption(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      formData.append('contentType', contentType)

      const response = await fetch('/api/instagram/generate-caption', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.caption) {
        setCaption(result.caption)
      } else {
        throw new Error(result.error || '캡션 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('Caption generation error:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '캡션 생성 중 오류가 발생했습니다' })
    } finally {
      setGeneratingCaption(false)
    }
  }

  // 발행하기 핸들러
  const handlePublish = async () => {
    if (!selectedChannel) {
      setMessage({ type: 'error', text: '발행할 계정을 선택해주세요' })
      return
    }

    if (uploadedFiles.length === 0) {
      setMessage({ type: 'error', text: '업로드할 파일을 선택해주세요' })
      return
    }

    setPublishing(true)
    setMessage(null)

    try {
      // 1. Instagram에 미디어 발행 (FormData로 파일 전송)
      const formData = new FormData()
      formData.append('adChannelId', selectedChannel)
      formData.append('contentType', contentType)
      formData.append('caption', caption)

      // 파일들 추가
      for (const file of uploadedFiles) {
        formData.append('files', file)
      }

      const publishResponse = await fetch('/api/instagram/publish', {
        method: 'POST',
        body: formData
      })

      const publishResult = await publishResponse.json()

      if (!publishResult.success) {
        throw new Error(publishResult.error || '발행에 실패했습니다')
      }

      const mediaId = publishResult.mediaId
      const mediaPermalink = publishResult.permalink

      // 2. 자동 DM이 활성화되어 있으면 DM 설정 저장
      if (autoDmEnabled && dmSettings) {
        const dmResponse = await fetch('/api/tracking-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelType: 'instagram',
            postName: caption?.slice(0, 50) || 'Instagram Post',
            targetUrl: '', // TODO: 상품 URL 연동 필요
            enableDmAutoSend: true,
            dmTriggerKeywords: dmSettings.triggerKeywords,
            dmMessage: dmSettings.dmMessage,
            requireFollow: dmSettings.requireFollow,
            followMessage: dmSettings.followMessage,
            followButtonText: dmSettings.followButtonText,
            adChannelId: selectedChannel,
            instagramMediaId: mediaId,
            instagramMediaUrl: mediaPermalink,
            instagramMediaType: contentType.toUpperCase(),
            instagramCaption: caption,
          })
        })

        const dmResult = await dmResponse.json()

        if (!dmResult.success) {
          console.error('DM 설정 저장 실패:', dmResult.error)
          // DM 설정 실패해도 발행은 성공이므로 경고만 표시
          setMessage({ type: 'success', text: '발행 완료! (DM 설정은 실패했습니다)' })
          return
        }
      }

      setMessage({ type: 'success', text: '발행이 완료되었습니다!' })
      // 상태 초기화
      setCaption('')
      setDmSettings(null)
      setAutoDmEnabled(false)
      // 업로드된 파일 초기화
      previewUrls.forEach(url => URL.revokeObjectURL(url))
      setUploadedFiles([])
      setPreviewUrls([])

    } catch (error) {
      console.error('발행 오류:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '발행 중 오류가 발생했습니다' })
    } finally {
      setPublishing(false)
    }
  }

  if (channels.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
          <img src="/channel_logo/insta.png" alt="Instagram" className="w-12 h-12 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">인스타그램 계정을 연동해주세요</h3>
        <p className="text-slate-400 mb-6">컨텐츠를 발행하려면 먼저 인스타그램 계정을 연동해야 합니다</p>
        <Link
          href="/ad-channels"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          인스타그램 연동하기
        </Link>
      </div>
    )
  }

  const channelOptions = channels.map(ch => ({
    id: ch.id,
    label: ch.channel_name || ch.account_name || ch.account_id
  }))

  return (
    <div className="p-6">
      {/* 발행 유형 + 발행 계정 (같은 줄) */}
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        {/* 발행 유형 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">발행 유형</span>
          <div className="flex gap-2">
            {[
              { id: 'feed', label: '피드' },
              { id: 'reels', label: '릴스' },
              { id: 'story', label: '스토리' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => handleContentTypeChange(type.id as typeof contentType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  contentType === type.id
                    ? 'bg-pink-500 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 발행 계정 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">발행 계정</span>
          <div className="w-48">
            <CustomDropdown
              options={channelOptions}
              value={selectedChannel}
              onChange={setSelectedChannel}
              placeholder="계정 선택"
            />
          </div>
        </div>
      </div>

      {/* 인스타그램 스타일 레이아웃 */}
      <div className="border border-slate-700 rounded-2xl overflow-hidden bg-slate-800/50">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* 왼쪽: 미디어 프리뷰 (정사각형) */}
          <div className="bg-slate-900 aspect-square relative">
            {previewUrls.length === 0 ? (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                <input
                  type="file"
                  accept={contentType === 'reels' ? 'video/*' : contentType === 'story' ? 'image/*,video/*' : 'image/*'}
                  multiple={contentType === 'feed'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-20 h-20 rounded-full border-2 border-slate-600 flex items-center justify-center mb-4">
                  {contentType === 'reels' ? (
                    <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <p className="text-slate-400 font-medium mb-1">
                  {contentType === 'reels' ? '릴스 영상을 여기에 드래그하거나 클릭' :
                   contentType === 'story' ? '스토리에 올릴 이미지 또는 영상을 클릭' :
                   '이미지를 여기에 드래그하거나 클릭 (최대 10장)'}
                </p>
                <p className="text-sm text-slate-500">
                  {contentType === 'reels' ? 'MP4, MOV 지원' :
                   contentType === 'story' ? 'JPG, PNG, MP4, MOV 지원' : 'JPG, PNG 지원'}
                </p>
              </label>
            ) : contentType === 'feed' && previewUrls.length > 1 ? (
              <div className="absolute inset-0 p-4">
                <div className="grid grid-cols-3 gap-2 h-full content-start overflow-y-auto">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden">
                      <img src={url} alt={`${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <button
                        onClick={() => handleRemoveFile(index)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded-full text-xs text-white font-medium">{index + 1}</span>
                    </div>
                  ))}
                  {previewUrls.length < 10 && (
                    <label className="aspect-square rounded-lg border-2 border-dashed border-slate-600 hover:border-pink-500 flex items-center justify-center cursor-pointer transition-colors bg-slate-900/50">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="text-center">
                        <svg className="w-8 h-8 text-slate-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-xs text-slate-500">추가</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center group">
                {contentType === 'reels' || (contentType === 'story' && uploadedFiles[0]?.type.startsWith('video/')) ? (
                  <video src={previewUrls[0]} className="max-w-full max-h-full object-contain" controls />
                ) : (
                  <img src={previewUrls[0]} alt="미리보기" className="max-w-full max-h-full object-contain" />
                )}
                <button
                  onClick={() => handleRemoveFile(0)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* 오른쪽: 캡션 및 설정 */}
          <div className="border-l border-slate-700 flex flex-col">
            {/* 계정 정보 */}
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const channel = channels.find(c => c.id === selectedChannel)
                  const profileUrl = channel?.metadata?.profile_picture_url
                  return profileUrl ? (
                    <img
                      src={profileUrl}
                      alt={channel?.account_name || ''}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {channel?.account_name?.[0]?.toUpperCase() || 'I'}
                      </span>
                    </div>
                  )
                })()}
                <span className="text-white font-medium text-sm">
                  {channels.find(c => c.id === selectedChannel)?.channel_name ||
                   channels.find(c => c.id === selectedChannel)?.account_name || '계정 선택'}
                </span>
              </div>
              {/* 인스타그램으로 이동 버튼 */}
              {(() => {
                const channel = channels.find(c => c.id === selectedChannel)
                if (!channel?.account_name) return null
                return (
                  <button
                    onClick={() => window.open(`https://instagram.com/${channel.account_name}`, '_blank')}
                    className="p-2 text-slate-400 hover:text-pink-400 hover:bg-pink-500/10 rounded-lg transition-colors cursor-pointer"
                    title="인스타그램에서 보기"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                )
              })()}
            </div>

            {/* 캡션 입력 */}
            <div className="flex-1 p-4 flex flex-col">
              <textarea
                placeholder="문구를 입력하세요..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none resize-none text-sm leading-relaxed min-h-[120px]"
              />
            </div>

            {/* 글자수 + AI 문구 생성 */}
            <div className="px-4 pb-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">{caption.length.toLocaleString()}/2,200</p>
              <button
                onClick={handleGenerateCaption}
                disabled={generatingCaption || uploadedFiles.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-400 border border-purple-400/50 rounded-lg hover:bg-purple-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {generatingCaption ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    생성 중...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    AI 문구 생성
                  </>
                )}
              </button>
            </div>

            {/* 구분선 */}
            <div className="border-t border-slate-700" />

            {/* 자동 DM */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">자동 DM</span>
                  <span className="text-xs text-slate-500">(선택사항)</span>
                </div>
                {!autoDmEnabled ? (
                  <button
                    onClick={() => setShowDmModal(true)}
                    className="px-3 py-1.5 text-xs font-medium text-pink-400 border border-pink-400/50 rounded-lg hover:bg-pink-400/10 transition-colors"
                  >
                    추가
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowDmModal(true)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => {
                        setAutoDmEnabled(false)
                        setDmSettings(null)
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-400/50 rounded-lg hover:bg-red-400/10 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
              {autoDmEnabled && dmSettings && (
                <div className="mt-3 p-3 bg-slate-800 rounded-lg">
                  <p className="text-xs text-slate-400">
                    트리거: {dmSettings.triggerAllComments ? '모든 댓글' : `키워드 "${dmSettings.triggerKeywords}"`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DM 설정 모달 */}
      <DmSettingsModal
        isOpen={showDmModal}
        onClose={() => setShowDmModal(false)}
        onSave={handleDmSettingsSave}
        initialSettings={dmSettings}
      />

      {/* 메시지 표시 */}
      {message && (
        <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
            {message.text}
          </span>
        </div>
      )}

      {/* 발행 버튼 */}
      <div className="mt-6 flex justify-end gap-3">
        <button className="px-6 py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors">
          임시저장
        </button>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {publishing && (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {publishing ? '발행 중...' : '발행하기'}
        </button>
      </div>
    </div>
  )
}

// Meta 광고 탭
function MetaTab({ channels }: { channels: AdChannel[] }) {
  const [campaignObjective, setCampaignObjective] = useState<'conversions' | 'traffic' | 'awareness'>('conversions')
  const [selectedChannel, setSelectedChannel] = useState(channels[0]?.id || '')

  if (channels.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
          <img src="/channel_logo/meta.png" alt="Meta" className="w-12 h-12 opacity-50" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Meta 광고 계정을 연동해주세요</h3>
        <p className="text-slate-400 mb-6">광고를 집행하려면 먼저 Meta 광고 계정을 연동해야 합니다</p>
        <Link
          href="/ad-channels"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Meta 광고 연동하기
        </Link>
      </div>
    )
  }

  const channelOptions = channels.map(ch => ({
    id: ch.id,
    label: ch.channel_name || ch.account_name || ch.account_id
  }))

  return (
    <div className="p-6">
      {/* 캠페인 목표 + 광고 계정 (같은 줄) */}
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        {/* 캠페인 목표 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">캠페인 목표</span>
          <div className="flex gap-2">
            {[
              { id: 'conversions', label: '전환', icon: '🎯' },
              { id: 'traffic', label: '트래픽', icon: '🔗' },
              { id: 'awareness', label: '인지도', icon: '👁️' },
            ].map((objective) => (
              <button
                key={objective.id}
                onClick={() => setCampaignObjective(objective.id as typeof campaignObjective)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  campaignObjective === objective.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="mr-1.5">{objective.icon}</span>
                {objective.label}
              </button>
            ))}
          </div>
        </div>

        {/* 광고 계정 */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">광고 계정</span>
          <div className="w-48">
            <CustomDropdown
              options={channelOptions}
              value={selectedChannel}
              onChange={setSelectedChannel}
              placeholder="계정 선택"
            />
          </div>
        </div>
      </div>

      {/* 캠페인 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">캠페인 이름</label>
          <input
            type="text"
            placeholder="캠페인 이름 입력"
            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">일일 예산</label>
          <div className="relative">
            <input
              type="number"
              placeholder="10000"
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">원</span>
          </div>
        </div>
      </div>

      {/* 광고 소재 업로드 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">광고 소재</label>
        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white font-medium mb-1">광고 이미지 또는 영상을 업로드하세요</p>
          <p className="text-sm text-slate-400">이미지: 1080x1080 권장 / 영상: MP4</p>
        </div>
      </div>

      {/* 광고 문구 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">광고 문구</label>
        <textarea
          rows={3}
          placeholder="광고 문구를 입력하세요..."
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* 전환 추적 안내 */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-blue-300">Conversions API 자동 연동</p>
            <p className="text-xs text-blue-300/70 mt-1">
              셀러포트에서 생성한 캠페인은 Meta Conversions API가 자동으로 연동됩니다.
              iOS 14.5 이후에도 정확한 전환 추적이 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 발행 버튼 */}
      <div className="mt-6 flex justify-end gap-3">
        <button className="px-6 py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors">
          임시저장
        </button>
        <button className="px-6 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors">
          캠페인 생성
        </button>
      </div>
    </div>
  )
}
