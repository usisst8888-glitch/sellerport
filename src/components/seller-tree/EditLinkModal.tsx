'use client'

import { SellerTreeLink } from './types'

interface EditLinkModalProps {
  editingLink: SellerTreeLink | null
  setEditingLink: (link: SellerTreeLink | null) => void
  handleUpdateLink: () => void
}

export default function EditLinkModal({
  editingLink,
  setEditingLink,
  handleUpdateLink,
}: EditLinkModalProps) {
  if (!editingLink) return null

  return (
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
  )
}
