// 셀러포트 API URL (개발: localhost:3002, 배포: sellerport.app)
const IS_DEV = true; // 배포 시 false로 변경
const API_BASE_URL = IS_DEV ? 'http://localhost:3002/api' : 'https://sellerport.app/api';

// DOM 요소
const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userEmail = document.getElementById('user-email');
const statusCard = document.getElementById('status-card');
const statusIcon = document.getElementById('status-icon');
const statusTitle = document.getElementById('status-title');
const statusDesc = document.getElementById('status-desc');
const collectBtn = document.getElementById('collect-btn');
const resultSection = document.getElementById('result-section');
const lastSyncTime = document.getElementById('last-sync-time');

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
  await checkCurrentPage();
  await loadLastSync();
});

// 로그인 상태 확인
async function checkAuthStatus() {
  const { authToken, userInfo } = await chrome.storage.local.get(['authToken', 'userInfo']);

  if (authToken && userInfo) {
    showMainSection(userInfo);
  } else {
    showLoginSection();
  }
}

// 로그인 섹션 표시
function showLoginSection() {
  loginSection.classList.remove('hidden');
  mainSection.classList.add('hidden');
}

// 메인 섹션 표시
function showMainSection(userInfo) {
  loginSection.classList.add('hidden');
  mainSection.classList.remove('hidden');
  userEmail.textContent = userInfo.email || '사용자';
}

// 로그인 버튼 클릭
loginBtn.addEventListener('click', () => {
  // 셀러포트 로그인 페이지를 새 탭에서 열기
  chrome.tabs.create({
    url: `${API_BASE_URL.replace('/api', '')}/login?extension=true`
  });
});

// 로그아웃 버튼 클릭
logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['authToken', 'userInfo']);
  showLoginSection();
});

// 현재 페이지 확인
async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url) return;

    // 판매자센터 사용자정의채널 페이지인지 확인
    const isValidPage = tab.url.includes('sell.smartstore.naver.com') &&
                        (tab.url.includes('마케팅분석') ||
                         tab.url.includes('marketing') ||
                         tab.url.includes('user-defined-channel') ||
                         tab.url.includes('사용자정의채널'));

    if (isValidPage) {
      updateStatus('ready', '데이터 수집 준비 완료', '아래 버튼을 클릭하여 전환 데이터를 수집하세요.');
      collectBtn.disabled = false;
    } else if (tab.url.includes('sell.smartstore.naver.com')) {
      updateStatus('default', '페이지 이동 필요', '통계 > 마케팅분석 > 사용자정의채널 페이지로 이동하세요.');
      collectBtn.disabled = true;
    } else {
      updateStatus('default', '판매자센터 접속 필요', '네이버 스마트스토어 판매자센터에 접속하세요.');
      collectBtn.disabled = true;
    }
  } catch (error) {
    console.error('페이지 확인 오류:', error);
  }
}

// 상태 업데이트
function updateStatus(type, title, desc) {
  statusCard.className = `status-card ${type}`;
  statusTitle.textContent = title;
  statusDesc.textContent = desc;

  // 아이콘 업데이트
  const icons = {
    default: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>`,
    ready: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>`,
    collecting: `<div class="spinner"></div>`,
    success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>`,
    error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="15" y1="9" x2="9" y2="15"></line>
      <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>`
  };

  statusIcon.innerHTML = icons[type] || icons.default;
}

// 데이터 수집 버튼 클릭
collectBtn.addEventListener('click', async () => {
  const { authToken } = await chrome.storage.local.get(['authToken']);

  if (!authToken) {
    alert('로그인이 필요합니다.');
    return;
  }

  try {
    collectBtn.disabled = true;
    updateStatus('collecting', '데이터 수집 중...', '잠시만 기다려주세요.');

    // content script에 데이터 수집 요청
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await chrome.tabs.sendMessage(tab.id, { action: 'collectData' });

    if (response.success) {
      // 셀러포트 API로 데이터 전송
      const apiResponse = await sendToSellerport(response.data, authToken);

      if (apiResponse.success) {
        updateStatus('success', '전송 완료!', 'Meta Conversion API로 전환 데이터가 전송되었습니다.');
        showResult(response.data);
        await saveLastSync();
      } else {
        throw new Error(apiResponse.error || 'API 전송 실패');
      }
    } else {
      throw new Error(response.error || '데이터 수집 실패');
    }
  } catch (error) {
    console.error('수집 오류:', error);
    updateStatus('error', '오류 발생', error.message);
  } finally {
    collectBtn.disabled = false;
  }
});

// 셀러포트 API로 데이터 전송
async function sendToSellerport(data, authToken) {
  try {
    const response = await fetch(`${API_BASE_URL}/smartstore/conversions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        channels: data.channels,
        dateRange: data.dateRange,
        collectedAt: new Date().toISOString()
      })
    });

    return await response.json();
  } catch (error) {
    console.error('API 전송 오류:', error);
    return { success: false, error: error.message };
  }
}

// 결과 표시
function showResult(data) {
  resultSection.classList.remove('hidden');

  const totalOrders = data.channels.reduce((sum, ch) => sum + (ch.orders || 0), 0);
  const totalRevenue = data.channels.reduce((sum, ch) => sum + (ch.revenue || 0), 0);

  document.getElementById('stat-channels').textContent = data.channels.length;
  document.getElementById('stat-orders').textContent = totalOrders.toLocaleString();
  document.getElementById('stat-revenue').textContent = formatCurrency(totalRevenue);
  document.getElementById('result-message').textContent = 'Meta Conversion API 전송 완료!';
}

// 통화 포맷
function formatCurrency(amount) {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toLocaleString();
}

// 마지막 동기화 시간 저장
async function saveLastSync() {
  const now = new Date().toISOString();
  await chrome.storage.local.set({ lastSync: now });
  lastSyncTime.textContent = formatDate(now);
}

// 마지막 동기화 시간 로드
async function loadLastSync() {
  const { lastSync } = await chrome.storage.local.get(['lastSync']);
  if (lastSync) {
    lastSyncTime.textContent = formatDate(lastSync);
  }
}

// 날짜 포맷
function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 메시지 리스너 (셀러포트에서 로그인 완료 시)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'authComplete') {
    chrome.storage.local.set({
      authToken: message.authToken,
      userInfo: message.userInfo
    }).then(() => {
      showMainSection(message.userInfo);
    });
  }
});
