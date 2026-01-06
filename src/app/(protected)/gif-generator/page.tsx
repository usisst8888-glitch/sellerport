'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'

interface GifSettings {
  width: number
  height: number
  fps: number
  quality: number
  loop: boolean
}

type ConversionMode = 'images' | 'video'

export default function GifGeneratorPage() {
  const [mode, setMode] = useState<ConversionMode>('images')
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [video, setVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedGif, setGeneratedGif] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<GifSettings>({
    width: 500,
    height: 500,
    fps: 10,
    quality: 80,
    loop: true,
  })
  const [delay, setDelay] = useState(500) // 이미지 간 딜레이 (ms)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 이미지 파일 선택
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // 최대 20장
    const selectedFiles = files.slice(0, 20)
    setImages(selectedFiles)
    setError(null)
    setGeneratedGif(null)

    // 미리보기 생성
    const previews = selectedFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => {
      prev.forEach(url => URL.revokeObjectURL(url))
      return previews
    })
  }, [])

  // 비디오 파일 선택
  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setVideo(file)
    setError(null)
    setGeneratedGif(null)

    // 미리보기 생성
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoPreview(URL.createObjectURL(file))
  }, [videoPreview])

  // 이미지 순서 변경
  const moveImage = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return

    const newImages = [...images]
    const newPreviews = [...imagePreviews]

    const [movedImage] = newImages.splice(fromIndex, 1)
    const [movedPreview] = newPreviews.splice(fromIndex, 1)

    newImages.splice(toIndex, 0, movedImage)
    newPreviews.splice(toIndex, 0, movedPreview)

    setImages(newImages)
    setImagePreviews(newPreviews)
  }, [images, imagePreviews])

  // 이미지 삭제
  const removeImage = useCallback((index: number) => {
    const newImages = [...images]
    const newPreviews = [...imagePreviews]

    URL.revokeObjectURL(newPreviews[index])
    newImages.splice(index, 1)
    newPreviews.splice(index, 1)

    setImages(newImages)
    setImagePreviews(newPreviews)
  }, [images, imagePreviews])

  // 이미지를 GIF로 변환 (Canvas 기반)
  const generateGifFromImages = async () => {
    if (images.length < 2) {
      setError('최소 2장의 이미지가 필요합니다')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)

    try {
      // gif.js 동적 로드
      const GIF = (await import('gif.js')).default

      const gif = new GIF({
        workers: 2,
        quality: Math.round((100 - settings.quality) / 10) + 1,
        width: settings.width,
        height: settings.height,
        workerScript: '/gif.worker.js',
        repeat: settings.loop ? 0 : -1,
      })

      const canvas = document.createElement('canvas')
      canvas.width = settings.width
      canvas.height = settings.height
      const ctx = canvas.getContext('2d')!

      // 이미지 로드 및 프레임 추가
      for (let i = 0; i < images.length; i++) {
        const img = document.createElement('img')
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('이미지 로드 실패'))
          img.src = imagePreviews[i]
        })

        // 캔버스에 이미지 그리기 (비율 유지하며 중앙 배치)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, settings.width, settings.height)

        const scale = Math.min(
          settings.width / img.width,
          settings.height / img.height
        )
        const x = (settings.width - img.width * scale) / 2
        const y = (settings.height - img.height * scale) / 2

        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

        gif.addFrame(ctx, { copy: true, delay })
        setProgress(Math.round(((i + 1) / images.length) * 50))
      }

      // GIF 렌더링
      gif.on('progress', (p: number) => {
        setProgress(50 + Math.round(p * 50))
      })

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob)
        setGeneratedGif(url)
        setIsGenerating(false)
        setProgress(100)
      })

      gif.render()
    } catch (err) {
      console.error('GIF generation error:', err)
      setError('GIF 생성 중 오류가 발생했습니다')
      setIsGenerating(false)
    }
  }

  // 비디오를 GIF로 변환
  const generateGifFromVideo = async () => {
    if (!video) {
      setError('비디오 파일을 선택해주세요')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setError(null)

    try {
      const GIF = (await import('gif.js')).default

      const videoEl = document.createElement('video')
      videoEl.src = videoPreview!
      videoEl.muted = true

      await new Promise<void>((resolve) => {
        videoEl.onloadedmetadata = () => resolve()
      })

      const duration = Math.min(videoEl.duration, 10) // 최대 10초
      const frameCount = Math.round(duration * settings.fps)
      const frameInterval = duration / frameCount

      const gif = new GIF({
        workers: 2,
        quality: Math.round((100 - settings.quality) / 10) + 1,
        width: settings.width,
        height: settings.height,
        workerScript: '/gif.worker.js',
        repeat: settings.loop ? 0 : -1,
      })

      const canvas = document.createElement('canvas')
      canvas.width = settings.width
      canvas.height = settings.height
      const ctx = canvas.getContext('2d')!

      // 프레임 추출
      for (let i = 0; i < frameCount; i++) {
        videoEl.currentTime = i * frameInterval

        await new Promise<void>((resolve) => {
          videoEl.onseeked = () => resolve()
        })

        // 캔버스에 비디오 프레임 그리기
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, settings.width, settings.height)

        const scale = Math.min(
          settings.width / videoEl.videoWidth,
          settings.height / videoEl.videoHeight
        )
        const x = (settings.width - videoEl.videoWidth * scale) / 2
        const y = (settings.height - videoEl.videoHeight * scale) / 2

        ctx.drawImage(videoEl, x, y, videoEl.videoWidth * scale, videoEl.videoHeight * scale)

        gif.addFrame(ctx, { copy: true, delay: Math.round(1000 / settings.fps) })
        setProgress(Math.round(((i + 1) / frameCount) * 50))
      }

      gif.on('progress', (p: number) => {
        setProgress(50 + Math.round(p * 50))
      })

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob)
        setGeneratedGif(url)
        setIsGenerating(false)
        setProgress(100)
      })

      gif.render()
    } catch (err) {
      console.error('GIF generation error:', err)
      setError('GIF 생성 중 오류가 발생했습니다')
      setIsGenerating(false)
    }
  }

  // GIF 생성 시작
  const handleGenerate = () => {
    if (mode === 'images') {
      generateGifFromImages()
    } else {
      generateGifFromVideo()
    }
  }

  // GIF 다운로드
  const handleDownload = () => {
    if (!generatedGif) return

    const link = document.createElement('a')
    link.href = generatedGif
    link.download = `sellerport-gif-${Date.now()}.gif`
    link.click()
  }

  // 초기화
  const handleReset = () => {
    setImages([])
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImagePreviews([])
    setVideo(null)
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoPreview(null)
    if (generatedGif) URL.revokeObjectURL(generatedGif)
    setGeneratedGif(null)
    setProgress(0)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">
          GIF 생성기
        </h1>
        <p className="text-slate-400 text-sm">
          상품 상세 페이지용 GIF를 쉽게 만들어보세요
        </p>
      </div>

      {/* 모드 선택 */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
        <label className="block text-sm font-medium text-slate-300 mb-3">
          변환 방식
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => { setMode('images'); handleReset() }}
            className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              mode === 'images'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            이미지 → GIF
          </button>
          <button
            onClick={() => { setMode('video'); handleReset() }}
            className={`flex-1 px-4 py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              mode === 'video'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            영상 → GIF
          </button>
        </div>
      </div>

      {/* 파일 업로드 영역 */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
        {mode === 'images' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-300">
                이미지 업로드 (최대 20장)
              </label>
              {images.length > 0 && (
                <span className="text-xs text-slate-400">{images.length}장 선택됨</span>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            {images.length === 0 ? (
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-medium">클릭하여 이미지 선택</p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP 지원</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-700">
                      <Image
                        src={preview}
                        alt={`Image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <button
                          onClick={() => moveImage(index, index - 1)}
                          disabled={index === 0}
                          className="p-1.5 rounded bg-slate-800/80 text-white disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveImage(index, index + 1)}
                          disabled={index === images.length - 1}
                          className="p-1.5 rounded bg-slate-800/80 text-white disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeImage(index)}
                          className="p-1.5 rounded bg-red-600/80 text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
                        {index + 1}
                      </div>
                    </div>
                  ))}

                  {images.length < 20 && (
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="aspect-square rounded-lg border-2 border-dashed border-slate-600 hover:border-purple-500 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  이미지 순서대로 GIF가 생성됩니다. 좌우 화살표로 순서를 변경하세요.
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-slate-300 mb-4">
              영상 업로드 (최대 10초)
            </label>

            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />

            {!video ? (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-medium">클릭하여 영상 선택</p>
                  <p className="text-xs text-slate-500 mt-1">MP4, MOV, WEBM 지원</p>
                </div>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900">
                  <video
                    src={videoPreview!}
                    controls
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => { setVideo(null); setVideoPreview(null) }}
                    className="absolute top-2 right-2 p-2 rounded-lg bg-red-600/80 text-white hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  10초가 넘는 영상은 앞 10초만 변환됩니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* 설정 */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-medium text-slate-300 mb-4">GIF 설정</h3>

        <div className="space-y-4">
          {/* 크기 입력 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">너비 (px)</label>
              <input
                type="number"
                value={settings.width}
                onChange={(e) => setSettings(prev => ({ ...prev, width: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">높이 (px)</label>
              <input
                type="number"
                value={settings.height}
                onChange={(e) => setSettings(prev => ({ ...prev, height: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
          </div>

          {/* 이미지 모드 딜레이 */}
            {mode === 'images' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  이미지 전환 속도: {delay}ms ({(1000 / delay).toFixed(1)}fps)
                </label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={delay}
                  onChange={(e) => setDelay(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>빠름</span>
                  <span>느림</span>
                </div>
              </div>
            )}

            {/* 비디오 모드 FPS */}
            {mode === 'video' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  프레임 레이트: {settings.fps} fps
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={settings.fps}
                  onChange={(e) => setSettings(prev => ({ ...prev, fps: Number(e.target.value) }))}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>작은 용량</span>
                  <span>부드러움</span>
                </div>
              </div>
            )}

            {/* 품질 */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                품질: {settings.quality}%
              </label>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                value={settings.quality}
                onChange={(e) => setSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>작은 용량</span>
                <span>고품질</span>
              </div>
            </div>

            {/* 반복 */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-slate-400">무한 반복</label>
              <button
                onClick={() => setSettings(prev => ({ ...prev, loop: !prev.loop }))}
                className={`w-10 h-6 rounded-full transition-colors ${
                  settings.loop ? 'bg-purple-600' : 'bg-slate-600'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.loop ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* 생성 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || (mode === 'images' ? images.length < 2 : !video)}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25"
        >
          {isGenerating ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              생성 중... {progress}%
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              GIF 생성하기
            </>
          )}
        </button>

        {(images.length > 0 || video) && (
          <button
            onClick={handleReset}
            disabled={isGenerating}
            className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all"
          >
            초기화
          </button>
        )}
      </div>

      {/* 진행률 바 */}
      {isGenerating && (
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 생성된 GIF */}
      {generatedGif && (
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">
              GIF 생성 완료
            </h2>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative bg-slate-900 rounded-xl overflow-hidden p-4">
              <Image
                src={generatedGif}
                alt="Generated GIF"
                width={settings.width}
                height={settings.height}
                className="max-w-full h-auto rounded-lg"
                unoptimized
              />
            </div>

            <button
              onClick={handleDownload}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              GIF 다운로드
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-xs text-blue-300">
              <strong>TIP:</strong> 생성된 GIF를 상품 상세 페이지에 업로드하여 제품을 더 생동감있게 보여주세요.
            </p>
          </div>
        </div>
      )}

      {/* 히든 캔버스 */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
