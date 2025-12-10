'use client'

import { useState } from 'react'

const mockAlerts = [
  {
    id: 1,
    type: 'red_light',
    title: '빨간불 알림',
    message: '"무선 블루투스 이어폰 3세대" 상품의 ROAS가 95%로 떨어졌습니다.',
    product: '무선 블루투스 이어폰 3세대',
    createdAt: '10분 전',
    isRead: false,
  },
  {
    id: 2,
    type: 'yellow_light',
    title: '노란불 전환',
    message: '"홈트레이닝 요가매트 세트" 상품이 초록불에서 노란불로 변경되었습니다.',
    product: '홈트레이닝 요가매트 세트',
    createdAt: '2시간 전',
    isRead: false,
  },
  {
    id: 3,
    type: 'stock',
    title: '재고 부족',
    message: '"무선 블루투스 이어폰 3세대" 재고가 42개 남았습니다.',
    product: '무선 블루투스 이어폰 3세대',
    createdAt: '5시간 전',
    isRead: true,
  },
  {
    id: 4,
    type: 'green_light',
    title: '초록불 달성',
    message: '"프리미엄 유기농 단백질 쉐이크" 상품이 ROAS 420%를 달성했습니다!',
    product: '프리미엄 유기농 단백질 쉐이크',
    createdAt: '1일 전',
    isRead: true,
  },
]

const alertSettings = [
  {
    id: 'red_light',
    title: '빨간불 알림',
    description: 'ROAS가 150% 미만으로 떨어지면 즉시 알림',
    enabled: true,
  },
  {
    id: 'yellow_light',
    title: '노란불 전환 알림',
    description: '상품이 노란불로 변경되면 알림',
    enabled: true,
  },
  {
    id: 'green_light',
    title: '초록불 달성 알림',
    description: '상품이 초록불을 달성하면 축하 알림',
    enabled: false,
  },
  {
    id: 'stock',
    title: '재고 부족 알림',
    description: '재고가 설정 수량 이하로 떨어지면 알림',
    enabled: true,
  },
  {
    id: 'daily_report',
    title: '일일 리포트',
    description: '매일 아침 전일 성과 요약 알림',
    enabled: false,
  },
]

function getAlertIcon(type: string) {
  switch (type) {
    case 'red_light':
      return { icon: '🔴', bg: 'bg-red-500/20', border: 'border-red-500/30' }
    case 'yellow_light':
      return { icon: '🟡', bg: 'bg-amber-500/20', border: 'border-amber-500/30' }
    case 'green_light':
      return { icon: '🟢', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
    case 'stock':
      return { icon: '📦', bg: 'bg-blue-500/20', border: 'border-blue-500/30' }
    default:
      return { icon: '🔔', bg: 'bg-slate-500/20', border: 'border-slate-500/30' }
  }
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(mockAlerts)
  const [settings, setSettings] = useState(alertSettings)
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings'>('alerts')

  const unreadCount = alerts.filter(a => !a.isRead).length

  const markAsRead = (id: number) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a))
  }

  const markAllAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, isRead: true })))
  }

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            알림 관리
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-1">광고 효율 변화와 중요 알림을 확인하세요</p>
        </div>
        {activeTab === 'alerts' && unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            모두 읽음 처리
          </button>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-white/5 pb-4">
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'alerts' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          알림 내역
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'settings' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          알림 설정
        </button>
      </div>

      {activeTab === 'alerts' ? (
        /* 알림 목록 */
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const style = getAlertIcon(alert.type)
              return (
                <div
                  key={alert.id}
                  onClick={() => markAsRead(alert.id)}
                  className={`relative overflow-hidden rounded-xl ${style.bg} border ${style.border} p-4 cursor-pointer hover:bg-opacity-30 transition-all ${
                    !alert.isRead ? 'ring-1 ring-white/10' : 'opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{style.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">{alert.title}</p>
                        {!alert.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{alert.message}</p>
                      <p className="text-xs text-slate-500">{alert.createdAt}</p>
                    </div>
                    <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors whitespace-nowrap">
                      상세 보기
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
                <span className="text-3xl">🔔</span>
              </div>
              <p className="text-slate-400 mb-2">알림이 없습니다</p>
              <p className="text-sm text-slate-500">새로운 알림이 오면 여기에 표시됩니다</p>
            </div>
          )}
        </div>
      ) : (
        /* 알림 설정 */
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-semibold text-white">알림 설정</h2>
            <p className="text-sm text-slate-400 mt-0.5">어떤 알림을 받을지 설정하세요</p>
          </div>

          <div className="divide-y divide-white/5">
            {settings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{setting.title}</p>
                  <p className="text-sm text-slate-500">{setting.description}</p>
                </div>
                <button
                  onClick={() => toggleSetting(setting.id)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    setting.enabled ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      setting.enabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>

          {/* 알림 채널 설정 */}
          <div className="p-6 border-t border-white/5">
            <h3 className="text-sm font-medium text-white mb-4">알림 채널</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📧</span>
                  <div>
                    <p className="text-sm text-white">이메일</p>
                    <p className="text-xs text-slate-500">가입 이메일로 알림 발송</p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg">활성</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">💬</span>
                  <div>
                    <p className="text-sm text-white">카카오톡</p>
                    <p className="text-xs text-slate-500">알림톡으로 빠른 알림</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-xs bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors">
                  연동하기
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔔</span>
                  <div>
                    <p className="text-sm text-white">슬랙</p>
                    <p className="text-xs text-slate-500">팀 슬랙 채널로 알림</p>
                  </div>
                </div>
                <button className="px-3 py-1 text-xs bg-slate-500/20 text-slate-400 rounded-lg hover:bg-slate-500/30 transition-colors">
                  연동하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
