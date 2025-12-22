// 셀러포트 크롬 확장 - Background Service Worker

const API_BASE_URL = 'https://sellerport.app/api';

// 확장 프로그램 설치 시
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[셀러포트] 확장 프로그램이 설치되었습니다.');

    // 환영 페이지 열기 (선택사항)
    // chrome.tabs.create({ url: 'https://sellerport.app/welcome-extension' });
  } else if (details.reason === 'update') {
    console.log('[셀러포트] 확장 프로그램이 업데이트되었습니다.');
  }
});

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToAPI') {
    handleSendToAPI(request.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // 비동기 응답
  }

  if (request.action === 'getAuthToken') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ authToken: result.authToken || null });
    });
    return true;
  }
});

// API로 데이터 전송
async function handleSendToAPI(data) {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);

    if (!authToken) {
      throw new Error('로그인이 필요합니다.');
    }

    const response = await fetch(`${API_BASE_URL}/smartstore/conversions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        channels: data.channels,
        dateRange: data.dateRange,
        collectedAt: new Date().toISOString(),
        source: 'chrome-extension'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();

    // 성공 알림
    showNotification('전환 데이터 전송 완료', `${data.channels.length}개 채널 데이터가 전송되었습니다.`);

    // 마지막 동기화 시간 저장
    await chrome.storage.local.set({ lastSync: new Date().toISOString() });

    return { success: true, data: result };
  } catch (error) {
    console.error('[셀러포트] API 전송 오류:', error);

    // 실패 알림
    showNotification('전송 실패', error.message);

    return { success: false, error: error.message };
  }
}

// 알림 표시
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message
  });
}

// 셀러포트 웹사이트에서 로그인 완료 시 토큰 수신
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  // 셀러포트 도메인에서만 허용
  if (sender.origin !== 'https://sellerport.app') {
    sendResponse({ success: false, error: 'Unauthorized origin' });
    return;
  }

  if (request.action === 'setAuthToken') {
    chrome.storage.local.set({
      authToken: request.authToken,
      userInfo: request.userInfo
    }).then(() => {
      // 열려있는 팝업에 알림
      chrome.runtime.sendMessage({
        action: 'authComplete',
        authToken: request.authToken,
        userInfo: request.userInfo
      }).catch(() => {
        // 팝업이 닫혀있으면 무시
      });

      sendResponse({ success: true });
    });

    return true; // 비동기 응답
  }
});

// 주기적 동기화 알람 (선택적)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncReminder') {
    // 마지막 동기화 시간 확인
    chrome.storage.local.get(['lastSync'], (result) => {
      if (result.lastSync) {
        const lastSyncDate = new Date(result.lastSync);
        const hoursSinceSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);

        // 24시간 이상 동기화 안했으면 알림
        if (hoursSinceSync >= 24) {
          showNotification(
            '전환 데이터 동기화 필요',
            '스마트스토어 판매자센터에서 최신 전환 데이터를 동기화하세요.'
          );
        }
      }
    });
  }
});

// 동기화 알림 알람 설정 (12시간마다)
chrome.alarms.create('syncReminder', {
  periodInMinutes: 720 // 12시간
});

// 탭 업데이트 시 아이콘 상태 변경
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const isSmartStore = tab.url.includes('sell.smartstore.naver.com');
    const isChannelPage = tab.url.includes('marketing') ||
                          tab.url.includes('user-defined-channel') ||
                          tab.url.includes('사용자정의채널');

    if (isSmartStore && isChannelPage) {
      // 활성화된 아이콘 (색상 있는 아이콘)
      chrome.action.setIcon({
        tabId: tabId,
        path: {
          16: 'icons/icon16.png',
          48: 'icons/icon48.png',
          128: 'icons/icon128.png'
        }
      });
      chrome.action.setBadgeText({ tabId: tabId, text: '!' });
      chrome.action.setBadgeBackgroundColor({ tabId: tabId, color: '#22c55e' });
    } else {
      // 기본 아이콘
      chrome.action.setBadgeText({ tabId: tabId, text: '' });
    }
  }
});
