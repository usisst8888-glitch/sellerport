'use client'

import Image from 'next/image'
import { MySite, Product } from './types'

interface AddLinkModalProps {
  isOpen: boolean
  onClose: () => void
  addLinkMode: 'manual' | 'product'
  setAddLinkMode: (mode: 'manual' | 'product') => void

  // 직접 입력 모드
  newLinkTitle: string
  setNewLinkTitle: (value: string) => void
  newLinkUrl: string
  setNewLinkUrl: (value: string) => void
  handleAddLink: () => void
  addingLink: boolean

  // 상품 선택 모드
  mySites: MySite[]
  selectedSiteId: string
  setSelectedSiteId: (id: string) => void
  products: Product[]
  loadingProducts: boolean
  selectedProducts: Set<string>
  setSelectedProducts: (products: Set<string>) => void
  productSearchQuery: string
  setProductSearchQuery: (query: string) => void
  loadMySites: () => void
  loadProducts: (siteId: string) => void
  handleAddProductLinks: () => void
  onNavigateToMySites: () => void
}

const siteTypeMap: Record<string, { logo: string; label: string }> = {
  naver: { logo: '/site_logo/smartstore.png', label: '스마트스토어' },
  smartstore: { logo: '/site_logo/smartstore.png', label: '스마트스토어' },
  cafe24: { logo: '/site_logo/cafe24.png', label: '카페24' },
  imweb: { logo: '/site_logo/imweb.png', label: '아임웹' },
  godomall: { logo: '/site_logo/godomall.png', label: '고도몰' },
  makeshop: { logo: '/site_logo/makeshop.png', label: '메이크샵' },
  own_site: { logo: '/site_logo/own_site.png', label: '자체몰' },
}

export default function AddLinkModal({
  isOpen,
  onClose,
  addLinkMode,
  setAddLinkMode,
  newLinkTitle,
  setNewLinkTitle,
  newLinkUrl,
  setNewLinkUrl,
  handleAddLink,
  addingLink,
  mySites,
  selectedSiteId,
  setSelectedSiteId,
  products,
  loadingProducts,
  selectedProducts,
  setSelectedProducts,
  productSearchQuery,
  setProductSearchQuery,
  loadMySites,
  loadProducts,
  handleAddProductLinks,
  onNavigateToMySites,
}: AddLinkModalProps) {
  if (!isOpen) return null

  const handleClose = () => {
    setNewLinkTitle('')
    setNewLinkUrl('')
    setSelectedSiteId('')
    setSelectedProducts(new Set())
    setProductSearchQuery('')
    onClose()
  }

  return (
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
                onClick={handleClose}
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
            {/* 사이트 선택 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">사이트 선택</label>
              <div className="flex flex-wrap gap-2">
                {mySites.map((site) => {
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
                        onClick={handleClose}
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
                  onClick={handleClose}
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
                  onClick={onNavigateToMySites}
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
  )
}
