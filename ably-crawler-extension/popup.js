// 에이블리 셀러 정보 수집기 - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  checkLoginStatus();
  loadSellerList();

  // 로그인 버튼
  document.getElementById('loginBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://sellerport.app/login?extension=true' });
  });

  // 다운로드 버튼
  document.getElementById('downloadBtn').addEventListener('click', async () => {
    const btn = document.getElementById('downloadBtn');
    btn.disabled = true;
    btn.innerHTML = '다운로드 중...';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'downloadExcel' });

      if (response.success) {
        btn.innerHTML = `✓ ${response.count}개 다운로드 완료`;
        showToast(`${response.count}개 셀러 정보 다운로드 완료!`, 'success');
        setTimeout(() => {
          btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            엑셀 다운로드
          `;
          btn.disabled = false;
        }, 2000);
      } else {
        showToast(response.error || '다운로드 실패', 'error');
        btn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          엑셀 다운로드
        `;
        btn.disabled = false;
      }
    } catch (error) {
      showToast('오류: ' + error.message, 'error');
      btn.disabled = false;
    }
  });

  // 에이블리 열기 버튼
  document.getElementById('goToAbly').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://m.a-bly.com' });
  });

  // 전체 삭제 버튼
  document.getElementById('clearBtn').addEventListener('click', async () => {
    if (!confirm('정말 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({ action: 'clearAllData' });
      showToast('모든 데이터가 삭제되었습니다.', 'success');
      loadSellerList();
    } catch (error) {
      showToast('삭제 실패: ' + error.message, 'error');
    }
  });
});

// 토스트 메시지 표시
function showToast(message, type = 'info') {
  const existing = document.getElementById('popup-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'popup-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    right: 10px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    text-align: center;
    z-index: 9999;
    animation: slideUp 0.3s ease;
    ${type === 'success' ? 'background: #10b981; color: white;' : ''}
    ${type === 'error' ? 'background: #ef4444; color: white;' : ''}
    ${type === 'info' ? 'background: #3b82f6; color: white;' : ''}
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// 셀러 목록 로드
async function loadSellerList() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSellerList' });

    if (!response.success) {
      console.error('목록 로드 실패:', response.error);
      return;
    }

    const sellerList = response.data || [];
    const listContainer = document.getElementById('sellerList');
    const emptyState = document.getElementById('emptyState');
    const totalCount = document.getElementById('totalCount');

    // 총 개수 업데이트
    totalCount.textContent = sellerList.length;

    if (sellerList.length === 0) {
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    // 최신순으로 정렬 (역순)
    const sortedList = [...sellerList].reverse();

    // 목록 렌더링
    listContainer.innerHTML = sortedList.map(seller => `
      <div class="seller-item">
        <div class="seller-num">${seller.순번 || ''}</div>
        <div class="seller-info">
          <div class="seller-name">${seller.상호 || '이름 없음'}</div>
          <div class="seller-detail">${seller.대표자 || ''} · ${seller.전화번호 || ''}</div>
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('목록 로드 오류:', error);
  }
}

// 로그인 상태 확인
async function checkLoginStatus() {
  try {
    const { authToken, userInfo } = await chrome.storage.local.get(['authToken', 'userInfo']);

    const loginStatus = document.getElementById('loginStatus');
    const loginBtn = document.getElementById('loginBtn');

    if (authToken && userInfo) {
      // 로그인 상태
      loginStatus.classList.remove('logged-out');
      loginStatus.innerHTML = `
        <div class="login-info">
          <div class="login-avatar">${(userInfo.email || 'U').charAt(0).toUpperCase()}</div>
          <div class="login-text">
            <div class="email">${userInfo.email || '사용자'}</div>
            <div class="status" style="color: #10b981;">로그인됨</div>
          </div>
        </div>
        <button class="btn-logout" id="logoutBtn">로그아웃</button>
      `;

      // 로그아웃 버튼 이벤트
      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await chrome.storage.local.remove(['authToken', 'userInfo']);
        showToast('로그아웃되었습니다.', 'info');
        checkLoginStatus();
        loadSellerList();
      });
    } else {
      // 로그아웃 상태
      loginStatus.classList.add('logged-out');
      loginStatus.innerHTML = `
        <div class="login-info">
          <span class="warning-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </span>
          <div class="login-text">
            <div class="status">로그인이 필요합니다</div>
          </div>
        </div>
        <button class="btn-login" id="loginBtn">로그인</button>
      `;

      // 로그인 버튼 이벤트 재등록
      document.getElementById('loginBtn').addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://sellerport.app/login?extension=true' });
      });
    }
  } catch (error) {
    console.error('로그인 상태 확인 오류:', error);
  }
}
