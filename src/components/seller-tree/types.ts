export interface SellerTree {
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
  link_style?: 'list' | 'card'
  is_active: boolean
  video_search_enabled?: boolean
  video_search_title?: string
  video_search_placeholder?: string
  video_search_button_text?: string
}

export interface SellerTreeLink {
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

export interface Product {
  id: string
  name: string
  image_url?: string
  price?: number
  product_url?: string
  my_shoppingmall_id?: string
  my_shoppingmall?: {
    id: string
    site_type: string
    site_name: string
  }
}

export interface MySite {
  id: string
  site_type: string
  site_name: string
  store_id?: string
}

export interface Module {
  id: string
  type: 'divider' | 'text'
  content?: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  style?: 'solid' | 'dashed' | 'dotted' | 'circle' | 'diamond'
  position: string
}

export interface EditPageState {
  // 기본 정보
  sellerTree: SellerTree | null
  title: string
  subtitle: string
  profileImageUrl: string
  headerImageUrl: string
  showHeaderImage: boolean
  headerImageSize: 'small' | 'medium' | 'large'

  // 배경 설정
  backgroundType: 'solid' | 'gradient'
  backgroundColor: string
  gradientColor1: string
  gradientColor2: string
  gradientAngle: number

  // 색상 설정
  titleColor: string
  subtitleColor: string
  buttonColor: string
  buttonTextColor: string

  // 레이아웃 설정
  linkLayout: 'single' | 'double'
  linkStyle: 'list' | 'card'
  isActive: boolean

  // 검색 설정
  videoSearchEnabled: boolean
  videoSearchTitle: string
  videoSearchPlaceholder: string
  searchButtonColor: string
  searchIconColor: string
  searchTitleColor: string
  searchPlaceholderColor: string

  // 링크
  links: SellerTreeLink[]

  // 모듈
  modules: Module[]

  // 요소 순서
  elementOrder: string[]
}

export type ColorPickerType = string | null
