'use client'

import Image from 'next/image'
import { HexColorPicker } from 'react-colorful'
import { SellerTreeLink, ColorPickerType } from './types'

interface LinkManagementProps {
  links: SellerTreeLink[]
  linkLayout: 'single' | 'double'
  setLinkLayout: (layout: 'single' | 'double') => void
  linkStyle: 'list' | 'card'
  setLinkStyle: (style: 'list' | 'card') => void
  buttonColor: string
  setButtonColor: (color: string) => void
  buttonTextColor: string
  setButtonTextColor: (color: string) => void
  openColorPicker: ColorPickerType
  setOpenColorPicker: (picker: ColorPickerType) => void
  setEditingLink: (link: SellerTreeLink | null) => void
  handleDeleteLink: (id: string) => void
  onAddLink: () => void
}

export default function LinkManagement({
  links,
  linkLayout,
  setLinkLayout,
  linkStyle,
  setLinkStyle,
  buttonColor,
  setButtonColor,
  buttonTextColor,
  setButtonTextColor,
  openColorPicker,
  setOpenColorPicker,
  setEditingLink,
  handleDeleteLink,
  onAddLink,
}: LinkManagementProps) {
  return (
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
            onClick={onAddLink}
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
  )
}
