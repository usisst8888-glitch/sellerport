import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SellerTreePublicPage from './SellerTreePublicPage'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: sellerTree } = await supabase
    .from('seller_trees')
    .select('title, subtitle, profile_image_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!sellerTree) {
    return {
      title: '페이지를 찾을 수 없습니다',
    }
  }

  const title = sellerTree.title || '셀러트리'
  const description = sellerTree.subtitle || '나만의 링크 페이지'

  return {
    title: `${title} | 셀러포트`,
    description,
    openGraph: {
      title,
      description,
      images: sellerTree.profile_image_url ? [sellerTree.profile_image_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: sellerTree.profile_image_url ? [sellerTree.profile_image_url] : [],
    },
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // 셀러트리 조회 (활성화된 것만)
  const { data: sellerTree, error } = await supabase
    .from('seller_trees')
    .select(`
      *,
      seller_tree_links (
        id,
        title,
        url,
        description,
        thumbnail_url,
        icon,
        tracking_link_id,
        display_order,
        is_active
      )
    `)
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !sellerTree) {
    notFound()
  }

  // 조회수 증가 (비동기로 처리, 결과 대기 안함)
  supabase
    .from('seller_trees')
    .update({ view_count: (sellerTree.view_count || 0) + 1 })
    .eq('id', sellerTree.id)
    .then()

  // 활성화된 링크만 필터링하고 정렬
  const activeLinks = (sellerTree.seller_tree_links || [])
    .filter((link: { is_active: boolean }) => link.is_active)
    .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)

  return (
    <SellerTreePublicPage
      sellerTree={{
        ...sellerTree,
        seller_tree_links: activeLinks
      }}
    />
  )
}
