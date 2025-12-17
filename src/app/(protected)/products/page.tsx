'use client'

import { useState, useEffect } from 'react'

interface Product {
  id: string
  name: string
  site_type: string
  category: string | null
  price: number
  cost: number
  stock: number
  image_url: string | null
  margin?: number | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCreateProductModal, setShowCreateProductModal] = useState(false)
  const [showCostModal, setShowCostModal] = useState(false)
  const [costForm, setCostForm] = useState({ cost: 0 })
  const [savingCost, setSavingCost] = useState(false)

  // 데이터 로딩
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success) {
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('상품 로딩 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  // 원가 수정 핸들러
  const handleOpenCostModal = (product: Product) => {
    setSelectedProduct(product)
    setCostForm({ cost: product.cost || 0 })
    setShowCostModal(true)
  }

  const handleSaveCost = async () => {
    if (!selectedProduct) return

    setSavingCost(true)
    try {
      const res = await fetch(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cost: costForm.cost })
      })

      if (res.ok) {
        setShowCostModal(false)
        setSelectedProduct(null)
        fetchProducts()
      }
    } catch (error) {
      console.error('원가 수정 에러:', error)
    } finally {
      setSavingCost(false)
    }
  }

  const filteredProducts = products.filter(product => {
    return product.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">상품 관리</h1>
          <p className="text-slate-400 mt-1">등록된 상품의 원가와 재고를 관리하세요</p>
        </div>
        <button
          onClick={() => setShowCreateProductModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          상품 추가
        </button>
      </div>

      {/* 검색 */}
      <div className="flex-1 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="상품명으로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
        />
      </div>

      {/* 상품 목록 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-400">상품 {filteredProducts.length}개</h2>
        </div>

        <div className="divide-y divide-white/5">
          {filteredProducts.map((product) => (
            <div key={product.id} className="p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start gap-4">
                {/* 상품 정보 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{product.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center flex-wrap gap-2">
                    <span>{product.site_type || '사이트 미연결'} · {product.category || '카테고리 없음'}</span>
                    {product.cost > 0 ? (
                      <>
                        <span className="text-slate-400">원가 {product.cost.toLocaleString()}원</span>
                        <span className="text-emerald-400">마진 {product.margin}%</span>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenCostModal(product)}
                        className="text-amber-400 hover:text-amber-300 underline"
                      >
                        원가 등록 필요
                      </button>
                    )}
                  </p>
                </div>

                {/* 통계 */}
                <div className="hidden md:flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm text-white">{product.price?.toLocaleString()}원</p>
                    <p className="text-xs text-slate-500">판매가</p>
                  </div>
                  <div
                    onClick={() => handleOpenCostModal(product)}
                    className="cursor-pointer hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
                    title="클릭하여 원가 수정"
                  >
                    <p className={`text-sm ${product.cost > 0 ? 'text-white' : 'text-amber-400'}`}>
                      {product.cost > 0 ? `${product.cost.toLocaleString()}원` : '미등록'}
                    </p>
                    <p className="text-xs text-slate-500">원가</p>
                  </div>
                  <div>
                    <p className="text-sm text-white">{product.stock}개</p>
                    <p className="text-xs text-slate-500">재고</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">
              {products.length === 0 ? '등록된 상품이 없습니다' : '검색 결과가 없습니다'}
            </p>
            <p className="text-sm text-slate-500">
              {products.length === 0 ? '사이트를 연동하거나 상품을 직접 추가하세요' : '다른 검색어를 시도해보세요'}
            </p>
          </div>
        )}
      </div>

      {/* 상품 추가 안내 모달 */}
      {showCreateProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">상품 추가</h3>
            <p className="text-slate-400 mb-6">
              상품은 사이트 연동 시 자동으로 동기화됩니다.<br />
              내 사이트를 먼저 연동해주세요.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateProductModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <a
                href="/my-sites"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                사이트 연동하기
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 원가 수정 모달 */}
      {showCostModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">원가 설정</h3>
              <p className="text-sm text-slate-400 mt-1">{selectedProduct.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
                <span className="text-slate-400">판매가</span>
                <span className="text-white font-medium">{selectedProduct.price?.toLocaleString()}원</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">원가 (상품원가 + 배송비 + 수수료 등)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={costForm.cost}
                    onChange={(e) => setCostForm({ cost: Number(e.target.value) })}
                    placeholder="원가를 입력하세요"
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-slate-900/50 border border-white/10 text-white text-lg focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">원</span>
                </div>
              </div>

              {costForm.cost > 0 && selectedProduct.price > 0 && (
                <div className="p-4 rounded-xl bg-slate-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">예상 순이익</span>
                    <span className={`font-semibold ${selectedProduct.price - costForm.cost > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(selectedProduct.price - costForm.cost).toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">마진율</span>
                    <span className={`font-semibold ${((selectedProduct.price - costForm.cost) / selectedProduct.price * 100) > 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {Math.round((selectedProduct.price - costForm.cost) / selectedProduct.price * 100)}%
                    </span>
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">
                정확한 순이익 계산을 위해 상품 원가, 배송비, 플랫폼 수수료, 포장비 등을 모두 포함한 총 비용을 입력하세요.
              </p>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCostModal(false)
                  setSelectedProduct(null)
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveCost}
                disabled={savingCost}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
              >
                {savingCost && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
