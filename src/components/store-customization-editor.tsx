'use client'

/**
 * 스토어 검색 페이지 커스터마이징 에디터
 * 유튜브/틱톡 영상번호 검색 페이지의 배경, 로고, 텍스트 등을 커스터마이징
 */

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

// 배경색 프리셋 (파스텔톤)
const BG_COLOR_PRESETS = [
  { id: 'lavender', name: '라벤더', color: '#E9D5FF' },
  { id: 'peach', name: '피치', color: '#FECACA' },
  { id: 'mint', name: '민트', color: '#A7F3D0' },
  { id: 'sky', name: '스카이', color: '#BAE6FD' },
  { id: 'rose', name: '로즈', color: '#FECDD3' },
  { id: 'lemon', name: '레몬', color: '#FEF08A' },
  { id: 'coral', name: '코랄', color: '#FED7AA' },
  { id: 'cream', name: '크림', color: '#FEF3C7' },
]

// 버튼색 프리셋
const BUTTON_COLOR_PRESETS = [
  { id: 'rose', name: '로즈', color: '#F43F5E' },
  { id: 'orange', name: '오렌지', color: '#F97316' },
  { id: 'teal', name: '틸', color: '#14B8A6' },
  { id: 'blue', name: '블루', color: '#3B82F6' },
  { id: 'purple', name: '퍼플', color: '#A855F7' },
  { id: 'lime', name: '라임', color: '#84CC16' },
  { id: 'red', name: '레드', color: '#EF4444' },
  { id: 'pink', name: '핑크', color: '#EC4899' },
]

// 텍스트색 프리셋
const TEXT_COLOR_PRESETS = [
  { id: 'dark', name: '진한 회색', color: '#1E293B' },
  { id: 'gray', name: '회색', color: '#475569' },
  { id: 'white', name: '흰색', color: '#FFFFFF' },
  { id: 'black', name: '검정', color: '#000000' },
  { id: 'rose', name: '로즈', color: '#E11D48' },
  { id: 'blue', name: '블루', color: '#2563EB' },
]

interface StoreCustomization {
  background_type: 'gradient' | 'solid' | 'image'
  background_gradient: string
  background_color?: string
  background_image_url?: string
  header_image_url?: string
  header_image_size: 'small' | 'medium' | 'large'
  title_text?: string
  subtitle_text?: string
  button_gradient: string
  button_text?: string
  // hex 색상 필드
  bg_color_hex?: string
  button_color_hex?: string
  title_color_hex?: string
  subtitle_color_hex?: string
  button_text_color_hex?: string
}

interface Props {
  channelType: 'youtube' | 'tiktok'
  storeSlug: string
  initialData?: Partial<StoreCustomization>
  onSave?: (data: StoreCustomization) => void
  onCancel?: () => void
}

export default function StoreCustomizationEditor({
  channelType,
  storeSlug,
  initialData,
  onSave,
  onCancel
}: Props) {
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 기본값 설정 (파스텔톤)
  const defaultBgColor = channelType === 'tiktok' ? '#FECDD3' : '#FECACA'
  const defaultButtonColor = channelType === 'tiktok' ? '#F43F5E' : '#F97316'

  const [customization, setCustomization] = useState<StoreCustomization>({
    background_type: 'solid',
    background_gradient: '',
    header_image_size: 'medium',
    button_gradient: '',
    bg_color_hex: defaultBgColor,
    button_color_hex: defaultButtonColor,
    ...initialData
  })

  // initialData가 변경되면 상태 업데이트
  useEffect(() => {
    if (initialData) {
      setCustomization(prev => ({
        ...prev,
        ...initialData
      }))
    }
  }, [initialData])

  // 이미지 업로드 처리
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'background') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'store-customization')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.url) {
        if (type === 'header') {
          setCustomization(prev => ({
            ...prev,
            header_image_url: result.url
          }))
        } else {
          setCustomization(prev => ({
            ...prev,
            background_type: 'image',
            background_image_url: result.url
          }))
        }
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 저장 처리
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/store-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_type: channelType,
          store_slug: storeSlug,
          ...customization
        })
      })

      const result = await response.json()

      if (result.success) {
        onSave?.(customization)
      } else {
        alert(result.error || '저장에 실패했습니다.')
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 채널 아이콘
  const ChannelIcon = () => channelType === 'tiktok' ? (
    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ) : (
    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
    </svg>
  )

  // 현재 색상값
  const bgColor = customization.bg_color_hex || defaultBgColor
  const buttonColor = customization.button_color_hex || defaultButtonColor
  const titleColor = customization.title_color_hex || '#1E293B'
  const subtitleColor = customization.subtitle_color_hex || '#475569'
  const buttonTextColor = customization.button_text_color_hex || '#FFFFFF'

  return (
    <div className="space-y-6">
      {/* 미리보기 */}
      <div className="relative flex justify-center">
        <div className="w-full max-w-[320px]">
          <p className="text-sm text-slate-400 mb-2 text-center">미리보기</p>
          <div
            className="rounded-2xl overflow-hidden aspect-[9/16] flex flex-col"
            style={{ backgroundColor: bgColor }}
          >
            {/* 상단 이미지 (배경 형태, 가로 전체, 높이 고정) */}
            {customization.header_image_url ? (
              <div className={`w-full flex-shrink-0 ${
                customization.header_image_size === 'small' ? 'h-28' :
                customization.header_image_size === 'large' ? 'h-48' :
                'h-36'
              } overflow-hidden`}>
                <Image
                  src={customization.header_image_url}
                  alt="Header"
                  width={320}
                  height={160}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className={`w-full flex-shrink-0 ${
                customization.header_image_size === 'small' ? 'h-28' :
                customization.header_image_size === 'large' ? 'h-48' :
                'h-36'
              } bg-white/20 backdrop-blur-sm border-b-2 border-dashed border-white/30 flex items-center justify-center`}>
                <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* 컨텐츠 영역 */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              {/* 타이틀 */}
              <h2
                className="text-xl font-bold mb-2 text-center"
                style={{ color: titleColor }}
              >
                {customization.title_text || '영상번호 검색'}
              </h2>
              <p
                className="text-sm mb-6 text-center"
                style={{ color: subtitleColor }}
              >
                {customization.subtitle_text || `${channelType === 'tiktok' ? '틱톡' : '유튜브'}에서 안내받은 영상번호를 입력하세요`}
              </p>

              {/* 입력 필드 (미리보기) */}
              <div className="w-full max-w-[200px]">
                <div className="h-12 px-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/60 shadow-sm flex items-center justify-center">
                  <span className="font-mono text-xl text-slate-400">A001</span>
                </div>
                <button
                  className="w-full h-10 mt-3 rounded-xl font-medium text-sm shadow-md"
                  style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                >
                  {customization.button_text || '상품 보러가기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 배경색 설정 */}
      <div>
        <p className="text-sm font-medium text-white mb-3">배경색</p>
        <div className="flex items-center gap-3">
          {/* 프리셋 색상들 */}
          <div className="flex gap-1.5 flex-wrap flex-1">
            {BG_COLOR_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => setCustomization(prev => ({
                  ...prev,
                  bg_color_hex: preset.color
                }))}
                className={`w-9 h-9 rounded-lg border-2 transition-all ${
                  bgColor === preset.color
                    ? 'border-white scale-110'
                    : 'border-transparent hover:border-white/50'
                }`}
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              />
            ))}
          </div>
          {/* 색상 피커 */}
          <div className="flex items-center gap-2">
            <label className="relative cursor-pointer group">
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setCustomization(prev => ({
                  ...prev,
                  bg_color_hex: e.target.value
                }))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div
                className="w-9 h-9 rounded-lg transition-all group-hover:scale-110"
                style={{ background: 'linear-gradient(135deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0080)' }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 상단 이미지 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white">상단 이미지</p>
          <span className="text-xs text-slate-500">권장: 1200 x 400px</span>
        </div>

        {customization.header_image_url ? (
          <div className="space-y-3">
            {/* 업로드된 이미지 미리보기 */}
            <div className="relative w-full h-24 rounded-xl overflow-hidden bg-slate-700">
              <Image
                src={customization.header_image_url}
                alt="Header"
                fill
                className="object-cover"
              />
              <button
                onClick={() => setCustomization(prev => ({ ...prev, header_image_url: undefined }))}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            {/* 크기 선택 */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">높이:</span>
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => setCustomization(prev => ({ ...prev, header_image_size: size }))}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    customization.header_image_size === size
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {size === 'small' ? '작게' : size === 'medium' ? '보통' : '크게'}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <label className="block w-full p-4 rounded-xl border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-slate-800/50 cursor-pointer transition-all">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'header')}
              className="hidden"
              disabled={uploading}
            />
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-400">업로드 중...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-300">이미지 업로드</p>
                    <p className="text-xs text-slate-500 mt-0.5">JPG, PNG, GIF, WebP (최대 5MB)</p>
                  </div>
                </>
              )}
            </div>
          </label>
        )}
      </div>

      {/* 텍스트 설정 */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-white">텍스트 설정</p>
        <div>
          <label className="block text-xs text-slate-400 mb-1">타이틀</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customization.title_text || ''}
              onChange={(e) => setCustomization(prev => ({ ...prev, title_text: e.target.value || undefined }))}
              placeholder="영상번호 검색"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            />
            <label className="relative cursor-pointer group flex-shrink-0">
              <input
                type="color"
                value={titleColor}
                onChange={(e) => setCustomization(prev => ({ ...prev, title_color_hex: e.target.value }))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div
                className="w-10 h-10 rounded-lg transition-all group-hover:scale-105 border border-slate-600"
                style={{ backgroundColor: titleColor }}
              />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">서브타이틀</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customization.subtitle_text || ''}
              onChange={(e) => setCustomization(prev => ({ ...prev, subtitle_text: e.target.value || undefined }))}
              placeholder={`${channelType === 'tiktok' ? '틱톡' : '유튜브'}에서 안내받은 영상번호를 입력하세요`}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            />
            <label className="relative cursor-pointer group flex-shrink-0">
              <input
                type="color"
                value={subtitleColor}
                onChange={(e) => setCustomization(prev => ({ ...prev, subtitle_color_hex: e.target.value }))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div
                className="w-10 h-10 rounded-lg transition-all group-hover:scale-105 border border-slate-600"
                style={{ backgroundColor: subtitleColor }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 버튼 스타일 설정 */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-white">버튼 설정</p>
        <div>
          <label className="block text-xs text-slate-400 mb-1">버튼 텍스트</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customization.button_text || ''}
              onChange={(e) => setCustomization(prev => ({ ...prev, button_text: e.target.value || undefined }))}
              placeholder="상품 보러가기"
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
            />
            <label className="relative cursor-pointer group flex-shrink-0">
              <input
                type="color"
                value={buttonTextColor}
                onChange={(e) => setCustomization(prev => ({ ...prev, button_text_color_hex: e.target.value }))}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div
                className="w-10 h-10 rounded-lg transition-all group-hover:scale-105 border border-slate-600"
                style={{ backgroundColor: buttonTextColor }}
              />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-2">버튼 배경색</label>
          <div className="flex items-center gap-3">
            {/* 프리셋 색상들 */}
            <div className="flex gap-1.5 flex-wrap flex-1">
              {BUTTON_COLOR_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setCustomization(prev => ({
                    ...prev,
                    button_color_hex: preset.color
                  }))}
                  className={`w-9 h-9 rounded-lg border-2 transition-all ${
                    buttonColor === preset.color
                      ? 'border-white scale-110'
                      : 'border-transparent hover:border-white/50'
                  }`}
                  style={{ backgroundColor: preset.color }}
                  title={preset.name}
                />
              ))}
            </div>
            {/* 색상 피커 */}
            <div className="flex items-center gap-2">
              <label className="relative cursor-pointer group">
                <input
                  type="color"
                  value={buttonColor}
                  onChange={(e) => setCustomization(prev => ({
                    ...prev,
                    button_color_hex: e.target.value
                  }))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div
                  className="w-9 h-9 rounded-lg transition-all group-hover:scale-110"
                  style={{ background: 'linear-gradient(135deg, #ff0000, #ff8000, #ffff00, #00ff00, #0080ff, #8000ff, #ff0080)' }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 저장/취소 버튼 */}
      <div className="flex gap-3 pt-4 border-t border-slate-700">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
          >
            취소
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex-1 py-2.5 bg-gradient-to-r ${
            channelType === 'tiktok' ? 'from-pink-500 to-cyan-400' : 'from-red-500 to-orange-400'
          } text-white rounded-xl transition-opacity disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              저장 중...
            </>
          ) : (
            '저장하기'
          )}
        </button>
      </div>
    </div>
  )
}
