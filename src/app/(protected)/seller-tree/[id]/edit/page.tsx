'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HexColorPicker } from 'react-colorful'

interface SellerTree {
  id: string
  slug: string
  title?: string
  subtitle?: string
  profile_image_url?: string
  header_image_url?: string
  header_image_size?: 'small' | 'medium' | 'large'
  background_type: string
  background_color?: string
  background_gradient?: string
  background_image_url?: string
  title_color?: string
  subtitle_color?: string
  button_color?: string
  button_text_color?: string
  button_text?: string
  link_layout?: 'single' | 'double'
  is_active: boolean
  video_search_enabled?: boolean
  video_search_title?: string
  video_search_placeholder?: string
  video_search_button_text?: string
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

interface Product {
  id: string
  name: string
  image_url?: string
  price?: number
  product_url?: string
  my_site_id?: string
  my_sites?: {
    id: string
    site_type: string
    site_name: string
  }
}

interface MySite {
  id: string
  site_type: string
  site_name: string
  store_id?: string
}

interface Module {
  id: string
  type: 'divider' | 'text'
  content?: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  style?: 'solid' | 'dashed' | 'dotted' | 'circle' | 'diamond' // 구분선 스타일
  position: string // 'after-profile', 'after-subtitle', 'after-search', 'before-links', 'after-links'
}

export default function SellerTreeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sellerTree, setSellerTree] = useState<SellerTree | null>(null)
  const [links, setLinks] = useState<SellerTreeLink[]>([])
  const headerFileInputRef = useRef<HTMLInputElement>(null)
  const profileFileInputRef = useRef<HTMLInputElement>(null)

  // 편집 상태
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [profileImageUrl, setProfileImageUrl] = useState('')
  const [headerImageUrl, setHeaderImageUrl] = useState('')
  const [headerImageSize, setHeaderImageSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [showHeaderImage, setShowHeaderImage] = useState(true)
  const [backgroundType, setBackgroundType] = useState<'solid' | 'gradient'>('solid')
  const [backgroundColor, setBackgroundColor] = useState('#FECACA')
  const [gradientColor1, setGradientColor1] = useState('#FECACA')
  const [gradientColor2, setGradientColor2] = useState('#FDE68A')
  const [gradientAngle, setGradientAngle] = useState(180)
  const [titleColor, setTitleColor] = useState('#1E293B')
  const [subtitleColor, setSubtitleColor] = useState('#475569')
  const [buttonColor, setButtonColor] = useState('#3B82F6')
  const [buttonTextColor, setButtonTextColor] = useState('#FFFFFF')
  const [linkLayout, setLinkLayout] = useState<'single' | 'double'>('single')
  const [linkStyle, setLinkStyle] = useState<'list' | 'card'>('list')
  const [isActive, setIsActive] = useState(true)

  // 영상번호 검색 설정
  const [videoSearchEnabled, setVideoSearchEnabled] = useState(false)
  const [videoSearchTitle, setVideoSearchTitle] = useState('영상번호 검색')
  const [videoSearchPlaceholder, setVideoSearchPlaceholder] = useState('영상번호를 입력하세요')
  const [searchButtonColor, setSearchButtonColor] = useState('#2563EB')
  const [searchIconColor, setSearchIconColor] = useState('#FFFFFF')
  const [searchTitleColor, setSearchTitleColor] = useState('#FFFFFF')
  const [searchPlaceholderColor, setSearchPlaceholderColor] = useState('#94A3B8')

  // 모듈 (구분선, 텍스트) - 여러 개 추가 가능
  const [modules, setModules] = useState<Module[]>([])

  // 미리보기 요소 순서 (드래그 앤 드롭용)
  // header = 프로필 + 페이지 제목 + 설명 (하나로 묶음)
  // 모듈은 module-{id} 형태로 개별 관리
  const [elementOrder, setElementOrder] = useState<string[]>([
    'header', 'search', 'links'
  ])
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [dragOverElement, setDragOverElement] = useState<string | null>(null)

  // 모듈이 변경될 때 elementOrder 업데이트
  useEffect(() => {
    setElementOrder(prev => {
      // 기존 모듈 ID들 제거
      const withoutModules = prev.filter(id => !id.startsWith('module-'))
      // 새 모듈 ID들 추가 (links 바로 앞에)
      const linksIndex = withoutModules.indexOf('links')
      const moduleIds = modules.map(m => `module-${m.id}`)

      if (linksIndex === -1) {
        return [...withoutModules, ...moduleIds]
      }

      return [
        ...withoutModules.slice(0, linksIndex),
        ...moduleIds,
        ...withoutModules.slice(linksIndex)
      ]
    })
  }, [modules])

  // 링크 추가 모달
  const [showAddLinkModal, setShowAddLinkModal] = useState(false)
  const [addLinkMode, setAddLinkMode] = useState<'manual' | 'product'>('manual')
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [addingLink, setAddingLink] = useState(false)

  // 쇼핑몰 및 상품 목록
  const [mySites, setMySites] = useState<MySite[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [productSearchQuery, setProductSearchQuery] = useState('')

  // 링크 편집 모달
  const [editingLink, setEditingLink] = useState<SellerTreeLink | null>(null)

  // 탭 상태
  const [activeTab, setActiveTab] = useState<'basic' | 'video' | 'links' | 'modules'>('basic')

  // 색상 선택기 팝업 상태
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [id])

  // 색상 선택기 외부 클릭 시 닫기 (mouseup 사용으로 드래그 허용)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (openColorPicker && !target.closest('.color-picker-container')) {
        setOpenColorPicker(null)
      }
    }
    document.addEventListener('mouseup', handleClickOutside)
    return () => document.removeEventListener('mouseup', handleClickOutside)
  }, [openColorPicker])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/seller-trees/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSellerTree(data)
        setLinks(data.seller_tree_links || [])

        // 상태 초기화
        setTitle(data.title || '')
        setSubtitle(data.subtitle || '')
        setProfileImageUrl(data.profile_image_url || '')
        setHeaderImageUrl(data.header_image_url || '')
        setHeaderImageSize(data.header_image_size || 'medium')
        setBackgroundType(data.background_type || 'solid')
        setBackgroundColor(data.background_color || '#FECACA')
        // 그라데이션 파싱
        if (data.background_gradient) {
          const gradientMatch = data.background_gradient.match(/linear-gradient\((\d+)deg,\s*(#[A-Fa-f0-9]{6}),\s*(#[A-Fa-f0-9]{6})\)/)
          if (gradientMatch) {
            setGradientAngle(parseInt(gradientMatch[1]))
            setGradientColor1(gradientMatch[2])
            setGradientColor2(gradientMatch[3])
          }
        }
        setTitleColor(data.title_color || '#1E293B')
        setSubtitleColor(data.subtitle_color || '#475569')
        setButtonColor(data.button_color || '#3B82F6')
        setButtonTextColor(data.button_text_color || '#FFFFFF')
        setLinkLayout(data.link_layout || 'single')
        setLinkStyle(data.link_style || 'list')
        setIsActive(data.is_active)
        setVideoSearchEnabled(data.video_search_enabled || false)
        setVideoSearchTitle(data.video_search_title || '영상번호 검색')
        setVideoSearchPlaceholder(data.video_search_placeholder || '영상번호를 입력하세요')
        setSearchButtonColor(data.search_button_color || '#2563EB')
        setSearchIconColor(data.search_icon_color || '#FFFFFF')
        setSearchTitleColor(data.search_title_color || '#FFFFFF')
        setSearchPlaceholderColor(data.search_placeholder_color || '#94A3B8')
        // 모듈 설정
        setModules(data.modules || [])
      } else {
        router.push('/seller-tree')
      }
    } catch (error) {
      console.error('Failed to fetch:', error)
      router.push('/seller-tree')
    } finally {
      setLoading(false)
    }
  }

  // 쇼핑몰 목록 로드
  const loadMySites = async () => {
    try {
      const response = await fetch('/api/seller-trees/my-sites')
      if (response.ok) {
        const data = await response.json()
        setMySites(data.sites || [])
      }
    } catch (error) {
      console.error('Failed to load my sites:', error)
    }
  }

  // 상품 목록 로드 (선택된 쇼핑몰 기준)
  const loadProducts = async (siteId?: string) => {
    setLoadingProducts(true)
    setProducts([])
    try {
      const url = siteId ? `/api/products?siteId=${siteId}` : '/api/products'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.data || data.products || [])
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  // 이미지 리사이즈 함수
  const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        let { width, height } = img

        // 비율 유지하며 리사이즈
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        canvas.width = width
        canvas.height = height
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(resizedFile)
            } else {
              reject(new Error('이미지 변환 실패'))
            }
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => reject(new Error('이미지 로드 실패'))
      img.src = URL.createObjectURL(file)
    })
  }

  // 이미지 업로드 처리
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'profile') => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 타입별 리사이즈 설정
      let resizedFile: File
      if (type === 'header') {
        // 헤더 이미지: 최대 800x400, 품질 80%
        resizedFile = await resizeImage(file, 800, 400, 0.8)
      } else {
        // 프로필 이미지: 최대 200x200, 품질 85%
        resizedFile = await resizeImage(file, 200, 200, 0.85)
      }

      const formData = new FormData()
      formData.append('file', resizedFile)
      formData.append('folder', 'seller-tree')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.url) {
        if (type === 'header') {
          setHeaderImageUrl(result.url)
        } else if (type === 'profile') {
          setProfileImageUrl(result.url)
        }
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
      if (headerFileInputRef.current) headerFileInputRef.current.value = ''
      if (profileFileInputRef.current) profileFileInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/seller-trees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || null,
          subtitle: subtitle || null,
          profile_image_url: profileImageUrl || null,
          header_image_url: headerImageUrl || null,
          header_image_size: headerImageSize,
          background_type: backgroundType,
          background_color: backgroundType === 'solid' ? backgroundColor : null,
          background_gradient: backgroundType === 'gradient'
            ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
            : null,
          title_color: titleColor,
          subtitle_color: subtitleColor,
          button_color: buttonColor,
          button_text_color: buttonTextColor,
          link_layout: linkLayout,
          link_style: linkStyle,
          is_active: isActive,
          video_search_enabled: videoSearchEnabled,
          video_search_title: videoSearchTitle,
          video_search_placeholder: videoSearchPlaceholder,
          search_button_color: searchButtonColor,
          search_icon_color: searchIconColor,
          search_title_color: searchTitleColor,
          search_placeholder_color: searchPlaceholderColor,
          modules: modules,
        }),
      })

      if (response.ok) {
        alert('저장되었습니다!')
      } else {
        const errorData = await response.json()
        console.error('Save error:', errorData)
        alert(`저장에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`)
      }
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 구분선 스타일 렌더링
  const renderDivider = (module: Module) => {
    const color = module.color || '#000000'
    const style = module.style || 'solid'

    switch (style) {
      case 'dashed':
        return (
          <div className="w-full flex justify-center py-2">
            <div className="w-[90%] h-[2px] opacity-70" style={{ borderTop: `2px dashed ${color}` }} />
          </div>
        )
      case 'dotted':
        return (
          <div className="w-full flex justify-center py-2">
            <div className="w-[90%] h-[2px] opacity-70" style={{ borderTop: `2px dotted ${color}` }} />
          </div>
        )
      case 'circle':
        return (
          <div className="w-full flex items-center justify-center py-2 gap-0">
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
            <div className="w-2 h-2 rounded-full mx-2 opacity-80" style={{ backgroundColor: color }} />
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
      case 'diamond':
        return (
          <div className="w-full flex items-center justify-center py-2 gap-0">
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
            <div className="w-2 h-2 rotate-45 mx-2 opacity-80" style={{ backgroundColor: color }} />
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
      default: // solid
        return (
          <div className="w-full flex justify-center py-2">
            <div className="w-[90%] h-[1px] rounded-full opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
    }
  }

  // 모듈 순서 위로 이동
  const moveModuleUp = (moduleId: string) => {
    setModules(prev => {
      const index = prev.findIndex(m => m.id === moduleId)
      if (index <= 0) return prev
      const newModules = [...prev]
      ;[newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]]
      return newModules
    })
  }

  // 모듈 순서 아래로 이동
  const moveModuleDown = (moduleId: string) => {
    setModules(prev => {
      const index = prev.findIndex(m => m.id === moduleId)
      if (index < 0 || index >= prev.length - 1) return prev
      const newModules = [...prev]
      ;[newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]]
      return newModules
    })
  }

  // 요소 순서 변경 함수
  const moveElement = (fromId: string, toId: string) => {
    if (fromId === toId) return

    setElementOrder(prev => {
      const newOrder = [...prev]
      const fromIndex = newOrder.indexOf(fromId)
      const toIndex = newOrder.indexOf(toId)

      if (fromIndex === -1 || toIndex === -1) return prev

      newOrder.splice(fromIndex, 1)
      newOrder.splice(toIndex, 0, fromId)

      return newOrder
    })
  }

  // 드래그 가능한 요소 래퍼
  const DraggableElement = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const isDragging = draggedElement === id
    const isDragOver = dragOverElement === id

    // 드래그 방향 계산: 드래그 요소가 타겟보다 위에 있으면 아래로 이동 중
    const draggedIndex = draggedElement ? elementOrder.indexOf(draggedElement) : -1
    const currentIndex = elementOrder.indexOf(id)
    const isMovingDown = draggedIndex < currentIndex // 드래그 요소가 위에서 아래로 이동 중

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      setDraggedElement(id)
    }

    const handleMouseUp = () => {
      if (draggedElement && dragOverElement && draggedElement !== dragOverElement) {
        moveElement(draggedElement, dragOverElement)
      }
      setDraggedElement(null)
      setDragOverElement(null)
    }

    const handleMouseEnter = () => {
      if (draggedElement && draggedElement !== id) {
        setDragOverElement(id)
      }
    }

    const handleMouseLeave = () => {
      if (dragOverElement === id) {
        setDragOverElement(null)
      }
    }

    return (
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative group select-none"
        style={{
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? 'scale(1.02)' : isDragOver ? (isMovingDown ? 'translateY(-4px)' : 'translateY(4px)') : 'none',
          opacity: isDragging ? 0.7 : 1,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: isDragging ? 100 : 1,
        }}
      >
        {/* 드래그 핸들 표시 */}
        <div
          className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ zIndex: 10 }}
        >
          <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
          </svg>
        </div>

        {/* 드롭 위치 표시선 - 위에서 아래로 이동 시 아래쪽에, 아래에서 위로 이동 시 위쪽에 표시 */}
        {isDragOver && (
          <div
            className={`absolute left-2 right-2 h-1 bg-blue-500 rounded-full ${
              isMovingDown ? '-bottom-1.5' : '-top-1.5'
            }`}
            style={{
              boxShadow: '0 0 10px 2px rgba(59, 130, 246, 0.7)',
              zIndex: 50,
              animation: 'pulse 1s ease-in-out infinite'
            }}
          />
        )}

        {/* 콘텐츠 */}
        <div className={`relative rounded-xl transition-all duration-200 ${
          isDragging ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent bg-blue-500/10' : ''
        } ${isDragOver ? 'bg-blue-500/5' : ''}`}>
          {children}
        </div>
      </div>
    )
  }

  // 위치별 모듈 렌더링 (미리보기용)
  const renderModules = (position: string) => {
    const positionModules = modules.filter(m => m.position === position)

    if (positionModules.length === 0) {
      return null
    }

    return (
      <div>
        {positionModules.map((module) => (
          <div key={module.id}>
            {module.type === 'divider' ? renderDivider(module) : (
              <p className={`w-full text-center py-2 ${module.size === 'xs' ? 'text-xs' : module.size === 'sm' ? 'text-sm' : module.size === 'md' ? 'text-base' : 'text-lg'}`} style={{ color: module.color || '#FFFFFF' }}>
                {module.content}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  const handleAddLink = async () => {
    if (!newLinkTitle || !newLinkUrl) return

    setAddingLink(true)
    try {
      const response = await fetch(`/api/seller-trees/${id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLinkTitle,
          url: newLinkUrl,
        }),
      })

      if (response.ok) {
        const newLink = await response.json()
        setLinks(prev => [...prev, newLink])
        setShowAddLinkModal(false)
        setNewLinkTitle('')
        setNewLinkUrl('')
      } else {
        alert('링크 추가에 실패했습니다.')
      }
    } catch {
      alert('링크 추가 중 오류가 발생했습니다.')
    } finally {
      setAddingLink(false)
    }
  }

  const handleAddProductLinks = async () => {
    if (selectedProducts.size === 0) return

    setAddingLink(true)
    try {
      const selectedProductList = products.filter(p => selectedProducts.has(p.id))

      for (const product of selectedProductList) {
        // product_url이 없으면 건너뛰기
        if (!product.product_url) {
          console.warn(`Product ${product.name} has no product_url`)
          continue
        }

        const response = await fetch(`/api/seller-trees/${id}/links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: product.name,
            url: product.product_url,
            thumbnail_url: product.image_url,
          }),
        })

        if (response.ok) {
          const newLink = await response.json()
          setLinks(prev => [...prev, newLink])
        }
      }

      setShowAddLinkModal(false)
      setSelectedProducts(new Set())
      setSelectedSiteId('')
      setProductSearchQuery('')
    } catch {
      alert('상품 링크 추가 중 오류가 발생했습니다.')
    } finally {
      setAddingLink(false)
    }
  }

  const handleUpdateLink = async () => {
    if (!editingLink) return

    try {
      const response = await fetch(`/api/seller-trees/${id}/links/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingLink.title,
          url: editingLink.url,
          is_active: editingLink.is_active,
        }),
      })

      if (response.ok) {
        setLinks(prev => prev.map(l => l.id === editingLink.id ? editingLink : l))
        setEditingLink(null)
      } else {
        alert('수정에 실패했습니다.')
      }
    } catch {
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('정말 이 링크를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/seller-trees/${id}/links/${linkId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLinks(prev => prev.filter(l => l.id !== linkId))
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const getPreviewUrl = () => {
    return `https://sp-trk.link/s/${sellerTree?.slug}`
  }

  // 상단 이미지 높이 클래스
  const headerHeightClass = headerImageSize === 'small' ? 'h-28' : headerImageSize === 'large' ? 'h-48' : 'h-36'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!sellerTree) return null

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/seller-tree')}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{sellerTree.slug}</h1>
            <p className="text-slate-400 text-sm">셀러트리 편집</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={getPreviewUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            미리보기
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 설정 패널 */}
        <div className="space-y-6">
          {/* 탭 네비게이션 */}
          <div className="flex gap-1 bg-slate-800/50 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('basic')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'basic' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              기본 정보
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'video' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              영상번호 검색
            </button>
            <button
              onClick={() => setActiveTab('links')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'links' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              링크 관리
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'modules' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              모듈 추가
            </button>
          </div>

          {/* 기본 정보 탭 */}
          {activeTab === 'basic' && (
            <>
              {/* 페이지 정보 + 이미지 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <div className="flex gap-5">
                  {/* 프로필 이미지 */}
                  <div className="flex-shrink-0">
                    {profileImageUrl ? (
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-700">
                          <Image
                            src={profileImageUrl}
                            alt="Profile"
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                            loading="eager"
                            priority
                          />
                        </div>
                        <button
                          onClick={() => setProfileImageUrl('')}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-full border-2 border-dashed border-slate-600 hover:border-blue-500 cursor-pointer transition-all flex items-center justify-center bg-slate-700/30">
                        <input
                          ref={profileFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'profile')}
                          className="hidden"
                          disabled={uploading}
                        />
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        )}
                      </label>
                    )}
                    <p className="text-[10px] text-slate-500 text-center mt-1">프로필</p>
                  </div>

                  {/* 제목/설명 입력 */}
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="페이지 제목"
                        className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                      <div className="relative flex-shrink-0 color-picker-container">
                        <button
                          onClick={() => setOpenColorPicker(openColorPicker === 'title' ? null : 'title')}
                          className="w-9 h-9 rounded-lg transition-all hover:scale-105 border border-slate-600"
                          style={{ backgroundColor: titleColor }}
                        />
                        {openColorPicker === 'title' && (
                          <div className="absolute right-0 top-11 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                            <HexColorPicker color={titleColor} onChange={setTitleColor} />
                            <input
                              type="text"
                              value={titleColor}
                              onChange={(e) => setTitleColor(e.target.value)}
                              className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="설명"
                        className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                      <div className="relative flex-shrink-0 color-picker-container">
                        <button
                          onClick={() => setOpenColorPicker(openColorPicker === 'subtitle' ? null : 'subtitle')}
                          className="w-9 h-9 rounded-lg transition-all hover:scale-105 border border-slate-600"
                          style={{ backgroundColor: subtitleColor }}
                        />
                        {openColorPicker === 'subtitle' && (
                          <div className="absolute right-0 top-11 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                            <HexColorPicker color={subtitleColor} onChange={setSubtitleColor} />
                            <input
                              type="text"
                              value={subtitleColor}
                              onChange={(e) => setSubtitleColor(e.target.value)}
                              className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 상단 이미지 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-medium text-white">상단 이미지</h3>
                    <button
                      onClick={() => setShowHeaderImage(!showHeaderImage)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${showHeaderImage ? 'bg-blue-600' : 'bg-slate-600'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showHeaderImage ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  {showHeaderImage && headerImageUrl && (
                    <div className="flex items-center gap-1">
                      {(['small', 'medium', 'large'] as const).map(size => (
                        <button
                          key={size}
                          onClick={() => setHeaderImageSize(size)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            headerImageSize === size
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {showHeaderImage ? (
                  headerImageUrl ? (
                    <div className="relative w-full h-20 rounded-lg overflow-hidden bg-slate-700 group">
                      <Image
                        src={headerImageUrl}
                        alt="Header"
                        fill
                        className="object-cover"
                        loading="eager"
                        priority
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                      <button
                        onClick={() => setHeaderImageUrl('')}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/60 hover:bg-red-500 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label className="block w-full py-6 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 cursor-pointer transition-all">
                      <input
                        ref={headerFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'header')}
                        className="hidden"
                        disabled={uploading}
                      />
                      <div className="flex flex-col items-center gap-1">
                        {uploading ? (
                          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs text-slate-500">1200 x 400px 권장</span>
                          </>
                        )}
                      </div>
                    </label>
                  )
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">상단 이미지가 비활성화되었습니다</p>
                )}
              </div>

              {/* 배경 설정 */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white">배경</h3>
                    <div className="flex gap-1 bg-slate-700 rounded-lg p-0.5">
                      <button
                        onClick={() => setBackgroundType('solid')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          backgroundType === 'solid' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        단색
                      </button>
                      <button
                        onClick={() => setBackgroundType('gradient')}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          backgroundType === 'gradient' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        그라데이션
                      </button>
                    </div>
                  </div>

                  {backgroundType === 'solid' ? (
                    <div className="relative color-picker-container">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setOpenColorPicker(openColorPicker === 'background' ? null : 'background')}
                          className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600"
                          style={{ backgroundColor }}
                        />
                        <span className="text-xs text-slate-500 font-mono">{backgroundColor}</span>
                      </div>
                      {openColorPicker === 'background' && (
                        <div className="absolute left-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                          <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} />
                          <input
                            type="text"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* 그라데이션 미리보기 + 색상 선택 */}
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-10 rounded-lg border border-slate-600"
                          style={{ background: `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})` }}
                        />
                        <div className="relative color-picker-container">
                          <button
                            onClick={() => setOpenColorPicker(openColorPicker === 'gradient1' ? null : 'gradient1')}
                            className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600"
                            style={{ backgroundColor: gradientColor1 }}
                            title="시작 색상"
                          />
                          {openColorPicker === 'gradient1' && (
                            <div className="absolute right-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                              <HexColorPicker color={gradientColor1} onChange={setGradientColor1} />
                              <input
                                type="text"
                                value={gradientColor1}
                                onChange={(e) => setGradientColor1(e.target.value)}
                                className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                              />
                            </div>
                          )}
                        </div>
                        <div className="relative color-picker-container">
                          <button
                            onClick={() => setOpenColorPicker(openColorPicker === 'gradient2' ? null : 'gradient2')}
                            className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600"
                            style={{ backgroundColor: gradientColor2 }}
                            title="끝 색상"
                          />
                          {openColorPicker === 'gradient2' && (
                            <div className="absolute right-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                              <HexColorPicker color={gradientColor2} onChange={setGradientColor2} />
                              <input
                                type="text"
                                value={gradientColor2}
                                onChange={(e) => setGradientColor2(e.target.value)}
                                className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      {/* 각도 조절 */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-8">{gradientAngle}°</span>
                        <input
                          type="range"
                          min="0"
                          max="360"
                          value={gradientAngle}
                          onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}

          {/* 영상번호 검색 탭 */}
          {activeTab === 'video' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">영상번호 검색</h2>
                <button
                  onClick={() => setVideoSearchEnabled(!videoSearchEnabled)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${videoSearchEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${videoSearchEnabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-4">
                SNS 영상에서 안내한 영상번호를 입력하면 상품 페이지로 이동하는 검색 기능입니다.
              </p>

              {videoSearchEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">검색 섹션 제목</label>
                    <input
                      type="text"
                      value={videoSearchTitle}
                      onChange={(e) => setVideoSearchTitle(e.target.value)}
                      placeholder="영상번호 검색"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-2">입력창 안내 문구</label>
                    <input
                      type="text"
                      value={videoSearchPlaceholder}
                      onChange={(e) => setVideoSearchPlaceholder(e.target.value)}
                      placeholder="영상번호를 입력하세요"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  {/* 검색 스타일 */}
                  <div className="pt-2 border-t border-slate-700">
                    <label className="block text-xs text-slate-400 mb-3">검색 스타일</label>
                    <div className="grid grid-cols-4 gap-3">
                      {/* 제목 색상 */}
                      <div className="text-center">
                        <div className="relative color-picker-container flex justify-center">
                          <button
                            onClick={() => setOpenColorPicker(openColorPicker === 'searchTitle' ? null : 'searchTitle')}
                            className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600"
                            style={{ backgroundColor: searchTitleColor }}
                          />
                          {openColorPicker === 'searchTitle' && (
                            <div className="absolute left-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                              <HexColorPicker color={searchTitleColor} onChange={setSearchTitleColor} />
                              <input
                                type="text"
                                value={searchTitleColor}
                                onChange={(e) => setSearchTitleColor(e.target.value)}
                                className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">제목</p>
                      </div>
                      {/* 안내문구 색상 */}
                      <div className="text-center">
                        <div className="relative color-picker-container flex justify-center">
                          <button
                            onClick={() => setOpenColorPicker(openColorPicker === 'searchPlaceholder' ? null : 'searchPlaceholder')}
                            className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600"
                            style={{ backgroundColor: searchPlaceholderColor }}
                          />
                          {openColorPicker === 'searchPlaceholder' && (
                            <div className="absolute left-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                              <HexColorPicker color={searchPlaceholderColor} onChange={setSearchPlaceholderColor} />
                              <input
                                type="text"
                                value={searchPlaceholderColor}
                                onChange={(e) => setSearchPlaceholderColor(e.target.value)}
                                className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">안내문구</p>
                      </div>
                      {/* 버튼 색상 */}
                      <div className="text-center">
                        <div className="relative color-picker-container flex justify-center">
                          <button
                            onClick={() => setOpenColorPicker(openColorPicker === 'searchButton' ? null : 'searchButton')}
                            className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600"
                            style={{ backgroundColor: searchButtonColor }}
                          />
                          {openColorPicker === 'searchButton' && (
                            <div className="absolute right-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                              <HexColorPicker color={searchButtonColor} onChange={setSearchButtonColor} />
                              <input
                                type="text"
                                value={searchButtonColor}
                                onChange={(e) => setSearchButtonColor(e.target.value)}
                                className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">버튼</p>
                      </div>
                      {/* 아이콘 색상 */}
                      <div className="text-center">
                        <div className="relative color-picker-container flex justify-center">
                          <button
                            onClick={() => setOpenColorPicker(openColorPicker === 'searchIcon' ? null : 'searchIcon')}
                            className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600 flex items-center justify-center bg-slate-700"
                          >
                            <svg className="w-5 h-5" style={{ color: searchIconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                          </button>
                          {openColorPicker === 'searchIcon' && (
                            <div className="absolute right-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                              <HexColorPicker color={searchIconColor} onChange={setSearchIconColor} />
                              <input
                                type="text"
                                value={searchIconColor}
                                onChange={(e) => setSearchIconColor(e.target.value)}
                                className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                              />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">아이콘</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 링크 관리 탭 */}
          {activeTab === 'links' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">링크 관리</h2>
                <div className="flex items-center gap-2">
                  {/* 열 선택 */}
                  <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setLinkLayout('single')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        linkLayout === 'single' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      1열
                    </button>
                    <button
                      onClick={() => setLinkLayout('double')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        linkLayout === 'double' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      2열
                    </button>
                  </div>
                  {/* 스타일 선택 */}
                  <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
                    <button
                      onClick={() => setLinkStyle('list')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        linkStyle === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      리스트
                    </button>
                    <button
                      onClick={() => setLinkStyle('card')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        linkStyle === 'card' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      카드
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddLinkModal(true)
                      setAddLinkMode('manual')
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    링크 추가
                  </button>
                </div>
              </div>

              {/* 링크 스타일 설정 */}
              <div className="mb-4 p-4 bg-slate-700/30 rounded-lg">
                <label className="block text-sm font-medium text-slate-300 mb-3">링크 스타일</label>
                <div className="flex items-center gap-6">
                  {/* 배경색 */}
                  <div className="text-center">
                    <div className="relative color-picker-container flex justify-center">
                      <button
                        onClick={() => setOpenColorPicker(openColorPicker === 'buttonColor' ? null : 'buttonColor')}
                        className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600"
                        style={{ backgroundColor: buttonColor }}
                      />
                      {openColorPicker === 'buttonColor' && (
                        <div className="absolute left-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                          <HexColorPicker color={buttonColor} onChange={setButtonColor} />
                          <input
                            type="text"
                            value={buttonColor}
                            onChange={(e) => setButtonColor(e.target.value)}
                            className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">배경색</p>
                  </div>
                  {/* 텍스트 색상 */}
                  <div className="text-center">
                    <div className="relative color-picker-container flex justify-center">
                      <button
                        onClick={() => setOpenColorPicker(openColorPicker === 'buttonTextColor' ? null : 'buttonTextColor')}
                        className="w-10 h-10 rounded-lg transition-all hover:scale-105 border border-slate-600 flex items-center justify-center"
                        style={{ backgroundColor: buttonTextColor }}
                      >
                        <span className="text-xs font-bold" style={{ color: buttonColor }}>A</span>
                      </button>
                      {openColorPicker === 'buttonTextColor' && (
                        <div className="absolute left-0 top-12 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                          <HexColorPicker color={buttonTextColor} onChange={setButtonTextColor} />
                          <input
                            type="text"
                            value={buttonTextColor}
                            onChange={(e) => setButtonTextColor(e.target.value)}
                            className="w-full mt-2 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs text-center font-mono"
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">텍스트</p>
                  </div>
                </div>
              </div>

              {links.length > 0 ? (
                <div className="space-y-2">
                  {links.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg"
                    >
                      {link.thumbnail_url && (
                        <div className="relative w-10 h-10 flex-shrink-0">
                          <Image
                            src={link.thumbnail_url}
                            alt={link.title}
                            fill
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{link.title}</p>
                        <p className="text-xs text-slate-500 truncate">{link.url}</p>
                      </div>
                      <span className="text-xs text-slate-500">{link.click_count}회</span>
                      <button
                        onClick={() => setEditingLink(link)}
                        className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-1.5 hover:bg-red-600/20 rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">아직 링크가 없습니다</p>
              )}
            </div>
          )}

          {/* 모듈 추가 탭 */}
          {activeTab === 'modules' && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">모듈 추가</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newModule: Module = {
                        id: crypto.randomUUID(),
                        type: 'divider',
                        color: '#000000',
                        style: 'solid',
                        position: 'before-links'
                      }
                      setModules([...modules, newModule])
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 12 2"><line x1="0" y1="1" x2="12" y2="1" stroke="currentColor" strokeWidth="2"/></svg>
                    구분선 추가
                  </button>
                  <button
                    onClick={() => {
                      const newModule: Module = {
                        id: crypto.randomUUID(),
                        type: 'text',
                        content: '',
                        color: '#000000',
                        size: 'sm',
                        position: 'before-links'
                      }
                      setModules([...modules, newModule])
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
                  >
                    <span className="text-[10px] font-medium">Aa</span>
                    텍스트 추가
                  </button>
                </div>
              </div>

              {modules.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  모듈을 추가하여 페이지를 꾸며보세요
                </p>
              ) : (
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <div key={module.id} className="bg-slate-700/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {/* 순서 이동 버튼 */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveModuleUp(module.id)}
                              disabled={index === 0}
                              className="p-0.5 hover:bg-slate-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="위로 이동"
                            >
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveModuleDown(module.id)}
                              disabled={index === modules.length - 1}
                              className="p-0.5 hover:bg-slate-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="아래로 이동"
                            >
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          {module.type === 'divider' ? (
                            <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center">
                              <div className="w-3 h-[2px] bg-white rounded-full" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded bg-slate-600 flex items-center justify-center">
                              <span className="text-white text-[10px] font-medium">Aa</span>
                            </div>
                          )}
                          <span className="text-sm text-white">
                            {module.type === 'divider' ? '구분선' : '텍스트'}
                          </span>
                        </div>
                        <button
                          onClick={() => setModules(modules.filter(m => m.id !== module.id))}
                          className="p-1 hover:bg-slate-600 rounded transition-colors"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      {/* 구분선 설정 */}
                      {module.type === 'divider' && (
                        <div className="space-y-3">
                          {/* 스타일 선택 */}
                          <div>
                            <label className="block text-xs text-slate-400 mb-2">스타일</label>
                            <div className="grid grid-cols-5 gap-2">
                              {[
                                { value: 'solid', label: '실선', icon: <svg className="w-full h-2" viewBox="0 0 40 2"><line x1="0" y1="1" x2="40" y2="1" stroke="currentColor" strokeWidth="2"/></svg> },
                                { value: 'dashed', label: '점선', icon: <svg className="w-full h-2" viewBox="0 0 40 2"><line x1="0" y1="1" x2="40" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2"/></svg> },
                                { value: 'dotted', label: '도트', icon: <svg className="w-full h-2" viewBox="0 0 40 2"><line x1="0" y1="1" x2="40" y2="1" stroke="currentColor" strokeWidth="2" strokeDasharray="1 3" strokeLinecap="round"/></svg> },
                                { value: 'circle', label: '원형', icon: <svg className="w-full h-2" viewBox="0 0 40 6"><line x1="0" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1"/><circle cx="20" cy="3" r="3" fill="currentColor"/><line x1="26" y1="3" x2="40" y2="3" stroke="currentColor" strokeWidth="1"/></svg> },
                                { value: 'diamond', label: '마름모', icon: <svg className="w-full h-2" viewBox="0 0 40 6"><line x1="0" y1="3" x2="14" y2="3" stroke="currentColor" strokeWidth="1"/><rect x="17" y="0" width="6" height="6" fill="currentColor" transform="rotate(45 20 3)"/><line x1="26" y1="3" x2="40" y2="3" stroke="currentColor" strokeWidth="1"/></svg> },
                              ].map((style) => (
                                <button
                                  key={style.value}
                                  onClick={() => {
                                    const updated = modules.map(m =>
                                      m.id === module.id ? { ...m, style: style.value as Module['style'] } : m
                                    )
                                    setModules(updated)
                                  }}
                                  className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                                    (module.style || 'solid') === style.value
                                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                                  }`}
                                  title={style.label}
                                >
                                  {style.icon}
                                </button>
                              ))}
                            </div>
                          </div>
                          {/* 색상 + 위치 */}
                          <div className="flex gap-4">
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">색상</label>
                              <div className="relative color-picker-container">
                                <button
                                  onClick={() => setOpenColorPicker(openColorPicker === `module-${module.id}` ? null : `module-${module.id}`)}
                                  className="w-8 h-8 rounded-lg transition-all hover:scale-105 border border-slate-600"
                                  style={{ backgroundColor: module.color || '#FFFFFF' }}
                                />
                                {openColorPicker === `module-${module.id}` && (
                                  <div className="absolute left-0 top-10 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                                    <HexColorPicker
                                      color={module.color || '#FFFFFF'}
                                      onChange={(color) => {
                                        const updated = modules.map(m =>
                                          m.id === module.id ? { ...m, color } : m
                                        )
                                        setModules(updated)
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-slate-400 mb-1">위치</label>
                              <select
                                value={module.position}
                                onChange={(e) => {
                                  const updated = modules.map(m =>
                                    m.id === module.id ? { ...m, position: e.target.value } : m
                                  )
                                  setModules(updated)
                                }}
                                className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                              >
                                <option value="after-profile">프로필 아래</option>
                                <option value="after-subtitle">설명 아래</option>
                                <option value="after-search">검색 아래</option>
                                <option value="before-links">링크 위</option>
                                <option value="after-links">링크 아래</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 텍스트 설정 */}
                      {module.type === 'text' && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">내용</label>
                            <input
                              type="text"
                              value={module.content || ''}
                              onChange={(e) => {
                                const updated = modules.map(m =>
                                  m.id === module.id ? { ...m, content: e.target.value } : m
                                )
                                setModules(updated)
                              }}
                              placeholder="텍스트 입력"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-slate-400 mb-1">색상</label>
                              <div className="relative color-picker-container">
                                <button
                                  onClick={() => setOpenColorPicker(openColorPicker === `module-${module.id}` ? null : `module-${module.id}`)}
                                  className="w-8 h-8 rounded-lg transition-all hover:scale-105 border border-slate-600"
                                  style={{ backgroundColor: module.color || '#FFFFFF' }}
                                />
                                {openColorPicker === `module-${module.id}` && (
                                  <div className="absolute left-0 top-10 z-50 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl">
                                    <HexColorPicker
                                      color={module.color || '#FFFFFF'}
                                      onChange={(color) => {
                                        const updated = modules.map(m =>
                                          m.id === module.id ? { ...m, color } : m
                                        )
                                        setModules(updated)
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-slate-400 mb-1">크기</label>
                              <div className="flex gap-1">
                                {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
                                  <button
                                    key={size}
                                    onClick={() => {
                                      const updated = modules.map(m =>
                                        m.id === module.id ? { ...m, size } : m
                                      )
                                      setModules(updated)
                                    }}
                                    className={`flex-1 py-1 text-[10px] rounded transition-colors ${
                                      module.size === size ? 'bg-blue-600 text-white' : 'bg-slate-600 text-slate-400 hover:text-white'
                                    }`}
                                  >
                                    {size.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* 위치 */}
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">위치</label>
                            <select
                              value={module.position}
                              onChange={(e) => {
                                const updated = modules.map(m =>
                                  m.id === module.id ? { ...m, position: e.target.value } : m
                                )
                                setModules(updated)
                              }}
                              className="w-full px-2 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                            >
                              <option value="after-profile">프로필 아래</option>
                              <option value="after-subtitle">설명 아래</option>
                              <option value="after-search">검색 아래</option>
                              <option value="before-links">링크 위</option>
                              <option value="after-links">링크 아래</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 미리보기 */}
        <div className="lg:sticky lg:top-6 self-start">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 text-center">미리보기</h2>

            {/* 모바일 형태 프레임 */}
            <div className="flex justify-center">
              <div className="w-[360px] h-[700px] rounded-[2.5rem] border-4 border-slate-600 overflow-hidden bg-black p-2 shadow-none">
                <div
                  className="w-full h-full rounded-[2rem] overflow-hidden flex flex-col"
                  style={{
                    background: backgroundType === 'gradient'
                      ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
                      : backgroundColor
                  }}
                >
                  {/* 상단 이미지 */}
                  {showHeaderImage && (
                    headerImageUrl ? (
                      <div className={`w-full ${headerHeightClass} flex-shrink-0 overflow-hidden rounded-t-[2rem] bg-slate-700`}>
                        <Image
                          src={headerImageUrl}
                          alt="Header"
                          width={320}
                          height={160}
                          className="w-full h-full object-cover"
                          loading="eager"
                          priority
                        />
                      </div>
                    ) : (
                      <div className={`w-full ${headerHeightClass} flex-shrink-0 bg-white/20 border-b-2 border-dashed border-white/30 flex items-center justify-center rounded-t-[2rem]`}>
                        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )
                  )}

                  {/* 컨텐츠 영역 - 상단 라운드 겹침 */}
                  <div
                    className={`flex-1 ${showHeaderImage ? 'rounded-t-3xl -mt-4' : ''} relative p-4 overflow-y-scroll`}
                    style={{
                      background: backgroundType === 'gradient'
                        ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
                        : backgroundColor
                    }}
                  >
                  {/* 요소들을 elementOrder 순서대로 렌더링 */}
                  {elementOrder.map((elementId) => {
                    switch (elementId) {
                      case 'header':
                        // 프로필 + 페이지 제목 + 설명을 하나로 묶음
                        return (
                          <DraggableElement key={elementId} id={elementId}>
                            <div className="text-center mb-3">
                              {/* 프로필 이미지 */}
                              {profileImageUrl && (
                                <div className="mb-2">
                                  <div className="flex justify-center">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700">
                                      <Image
                                        src={profileImageUrl}
                                        alt="Profile"
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover"
                                        loading="eager"
                                        priority
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* 페이지 제목 */}
                              <h3
                                className="text-xl font-bold mb-1"
                                style={{ color: titleColor }}
                              >
                                {title || sellerTree.slug}
                              </h3>
                              {/* 설명 */}
                              <p
                                className="text-xs"
                                style={{ color: subtitleColor }}
                              >
                                {subtitle || '설명을 입력하세요'}
                              </p>
                            </div>
                          </DraggableElement>
                        )

                      case 'search':
                        return videoSearchEnabled ? (
                          <DraggableElement key={elementId} id={elementId}>
                            <div className="w-full mb-4 space-y-2">
                              <p
                                className="text-xs font-medium text-center"
                                style={{ color: searchTitleColor }}
                              >
                                {videoSearchTitle}
                              </p>
                              <div className="flex gap-2">
                                <div className="flex-1 relative">
                                  <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl bg-white text-slate-800 text-center font-mono text-sm transition-all"
                                    style={{
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                    disabled
                                  />
                                  <span
                                    className="absolute inset-0 flex items-center justify-center text-sm font-mono pointer-events-none"
                                    style={{ color: searchPlaceholderColor }}
                                  >
                                    {videoSearchPlaceholder}
                                  </span>
                                </div>
                                <button
                                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                                  style={{ backgroundColor: searchButtonColor }}
                                >
                                  <svg className="w-5 h-5" style={{ color: searchIconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </DraggableElement>
                        ) : null

                      default:
                        // 개별 모듈 처리 (module-{id} 형태)
                        if (elementId.startsWith('module-')) {
                          const moduleId = elementId.replace('module-', '')
                          const module = modules.find(m => m.id === moduleId)
                          if (!module) return null

                          return (
                            <DraggableElement key={elementId} id={elementId}>
                              <div className="py-1">
                                {module.type === 'divider' ? renderDivider(module) : (
                                  <p className={`w-full text-center py-2 ${module.size === 'xs' ? 'text-xs' : module.size === 'sm' ? 'text-sm' : module.size === 'md' ? 'text-base' : 'text-lg'}`} style={{ color: module.color || '#FFFFFF' }}>
                                    {module.content}
                                  </p>
                                )}
                              </div>
                            </DraggableElement>
                          )
                        }
                        return null

                      case 'links':
                        return (
                          <DraggableElement key={elementId} id={elementId}>
                            <div className={`w-full py-3 ${
                              linkLayout === 'double' ? 'grid grid-cols-2 gap-2' : 'space-y-2'
                            }`}>
                              {links.filter(l => l.is_active).map((link) => (
                                <div
                                  key={link.id}
                                  className={`rounded-xl overflow-hidden transition-all ${
                                    linkStyle === 'card' ? 'flex flex-col' : 'flex items-center gap-2.5 p-2.5'
                                  }`}
                                  style={{ backgroundColor: buttonColor, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                                >
                                  {link.thumbnail_url ? (
                                    <div className={`flex-shrink-0 ${
                                      linkStyle === 'card' ? 'w-full aspect-square' : 'w-10 h-10 rounded-lg overflow-hidden'
                                    }`}>
                                      <Image
                                        src={link.thumbnail_url}
                                        alt={link.title}
                                        width={linkStyle === 'card' ? 120 : 40}
                                        height={linkStyle === 'card' ? 120 : 40}
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className={`flex items-center justify-center flex-shrink-0 ${
                                        linkStyle === 'card' ? 'w-full aspect-square' : 'w-10 h-10 rounded-lg'
                                      }`}
                                      style={{ backgroundColor: `${buttonTextColor}15` }}
                                    >
                                      <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: buttonTextColor }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                      </svg>
                                    </div>
                                  )}
                                  <div className={`flex-1 min-w-0 overflow-hidden ${linkStyle === 'card' ? 'p-2' : ''}`}>
                                    <span
                                      className={`font-medium leading-snug overflow-hidden ${
                                        linkStyle === 'card'
                                          ? 'text-[10px] block text-center line-clamp-2'
                                          : 'text-xs block'
                                      }`}
                                      style={{
                                        color: buttonTextColor,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {link.title}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {links.length === 0 && !videoSearchEnabled && (
                                <div
                                  className="text-center py-6 text-xs opacity-60"
                                  style={{ color: subtitleColor }}
                                >
                                  링크를 추가해주세요
                                </div>
                              )}
                            </div>
                          </DraggableElement>
                        )
                    }
                  })}

                  {/* after-links 모듈 */}
                  {renderModules('after-links')}

                  {/* 푸터 */}
                  <div className="mt-4 text-center">
                    <span
                      className="text-[10px] opacity-40"
                      style={{ color: subtitleColor }}
                    >
                      Powered by 셀러포트
                    </span>
                  </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 드래그 앤 드롭 안내 */}
            <div className="mt-3 flex items-center justify-center gap-2 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              <span className="text-xs">각 요소를 드래그하여 순서를 변경할 수 있습니다</span>
            </div>
          </div>
        </div>
      </div>

      {/* 링크 추가 모달 */}
      {showAddLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">링크 추가</h3>

            {/* 모드 선택 탭 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAddLinkMode('manual')}
                className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                  addLinkMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                직접 입력
              </button>
              <button
                onClick={() => {
                  setAddLinkMode('product')
                  setSelectedSiteId('')
                  setProducts([])
                  setSelectedProducts(new Set())
                  loadMySites()
                }}
                className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                  addLinkMode === 'product' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}
              >
                상품에서 선택
              </button>
            </div>

            {addLinkMode === 'manual' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">링크 제목</label>
                  <input
                    type="text"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    placeholder="네이버 스마트스토어"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
                  <input
                    type="text"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://smartstore.naver.com/..."
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddLinkModal(false)
                      setNewLinkTitle('')
                      setNewLinkUrl('')
                    }}
                    className="flex-1 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAddLink}
                    disabled={addingLink || !newLinkTitle || !newLinkUrl}
                    className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {addingLink ? '추가 중...' : '추가'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 사이트 선택 - 버튼 형식 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">사이트 선택</label>
                  <div className="flex flex-wrap gap-2">
                    {mySites.map((site) => {
                      const siteTypeMap: Record<string, { logo: string; label: string }> = {
                        naver: { logo: '/site_logo/smartstore.png', label: '스마트스토어' },
                        smartstore: { logo: '/site_logo/smartstore.png', label: '스마트스토어' },
                        cafe24: { logo: '/site_logo/cafe24.png', label: '카페24' },
                        imweb: { logo: '/site_logo/imweb.png', label: '아임웹' },
                        godomall: { logo: '/site_logo/godomall.png', label: '고도몰' },
                        makeshop: { logo: '/site_logo/makeshop.png', label: '메이크샵' },
                        own_site: { logo: '/site_logo/own_site.png', label: '자체몰' },
                      }
                      const siteInfo = siteTypeMap[site.site_type] || { logo: '/site_logo/own_site.png', label: site.site_type }

                      return (
                        <button
                          key={site.id}
                          onClick={() => {
                            setSelectedSiteId(site.id)
                            setSelectedProducts(new Set())
                            setProductSearchQuery('')
                            loadProducts(site.id)
                          }}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                            selectedSiteId === site.id
                              ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <Image
                            src={siteInfo.logo}
                            alt={siteInfo.label}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                          <div className="text-left">
                            <p className="text-sm font-medium">{site.site_name || site.store_id}</p>
                            <p className={`text-[10px] ${selectedSiteId === site.id ? 'text-blue-200' : 'text-slate-500'}`}>
                              {siteInfo.label}
                            </p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 상품 목록 */}
                {selectedSiteId && (
                  <>
                    {loadingProducts ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : products.length > 0 ? (
                      <>
                        {/* 상품 검색 */}
                        <div className="relative">
                          <input
                            type="text"
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            placeholder="상품명 검색..."
                            className="w-full px-4 py-2 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm"
                          />
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>

                        <div className="space-y-2 max-h-[200px] overflow-y-auto">
                          {products
                            .filter(product =>
                              productSearchQuery === '' ||
                              product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
                            )
                            .map((product) => (
                            <div
                              key={product.id}
                              onClick={() => {
                                const newSet = new Set(selectedProducts)
                                if (newSet.has(product.id)) {
                                  newSet.delete(product.id)
                                } else {
                                  newSet.add(product.id)
                                }
                                setSelectedProducts(newSet)
                              }}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedProducts.has(product.id)
                                  ? 'bg-blue-600/20 border border-blue-500'
                                  : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                              }`}
                            >
                              {product.image_url && (
                                <div className="relative w-12 h-12 flex-shrink-0">
                                  <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    className="rounded-lg object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{product.name}</p>
                                {product.price && (
                                  <p className="text-xs text-slate-400">{product.price.toLocaleString()}원</p>
                                )}
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedProducts.has(product.id)
                                  ? 'bg-blue-600 border-blue-600'
                                  : 'border-slate-500'
                              }`}>
                                {selectedProducts.has(product.id) && (
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => {
                              setShowAddLinkModal(false)
                              setSelectedProducts(new Set())
                              setSelectedSiteId('')
                              setProductSearchQuery('')
                            }}
                            className="flex-1 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                          >
                            취소
                          </button>
                          <button
                            onClick={handleAddProductLinks}
                            disabled={addingLink || selectedProducts.size === 0}
                            className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {addingLink ? '추가 중...' : `${selectedProducts.size}개 추가`}
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        해당 쇼핑몰에 등록된 상품이 없습니다
                      </div>
                    )}
                  </>
                )}

                {/* 쇼핑몰 미선택 시 취소 버튼 */}
                {!selectedSiteId && mySites.length > 0 && (
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => {
                        setShowAddLinkModal(false)
                        setSelectedSiteId('')
                      }}
                      className="w-full py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      취소
                    </button>
                  </div>
                )}

                {/* 등록된 쇼핑몰이 없을 때 */}
                {mySites.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">등록된 쇼핑몰이 없습니다</p>
                    <button
                      onClick={() => router.push('/my-sites')}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    >
                      쇼핑몰 등록하기
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 링크 편집 모달 */}
      {editingLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">링크 수정</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">링크 제목</label>
                <input
                  type="text"
                  value={editingLink.title}
                  onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">URL</label>
                <input
                  type="text"
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-300">활성화</label>
                <button
                  onClick={() => setEditingLink({ ...editingLink, is_active: !editingLink.is_active })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${editingLink.is_active ? 'bg-blue-600' : 'bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${editingLink.is_active ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingLink(null)}
                className="flex-1 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateLink}
                className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
