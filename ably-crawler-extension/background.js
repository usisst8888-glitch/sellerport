// 에이블리 셀러 정보 수집기 - Background Service Worker

const API_BASE_URL = 'https://sellerport.app/api';

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveSellerInfo') {
    handleSaveSellerInfo(request.data)
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getSellerList') {
    getSellerList()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'downloadExcel') {
    downloadExcel()
      .then(response => sendResponse(response))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'clearAllData') {
    clearAllData()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getAuthToken') {
    chrome.storage.local.get(['authToken'], (result) => {
      sendResponse({ authToken: result.authToken || null });
    });
    return true;
  }
});

// 셀러 정보 저장 (Supabase API 호출)
async function handleSaveSellerInfo(sellerInfo) {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);

    if (!authToken) {
      throw new Error('로그인이 필요합니다. 셀러포트에 먼저 로그인해주세요.');
    }

    console.log('[에이블리 수집기] API 전송:', sellerInfo);
    console.log('[에이블리 수집기] authToken:', authToken.substring(0, 20) + '...');

    const response = await fetch(`${API_BASE_URL}/ably/sellers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(sellerInfo)
    });

    console.log('[에이블리 수집기] API 응답 상태:', response.status);

    // 응답 텍스트 먼저 가져오기
    const responseText = await response.text();
    console.log('[에이블리 수집기] API 응답 텍스트:', responseText.substring(0, 200));

    // JSON 파싱 시도
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      // HTML 응답인 경우 (토큰 만료 등)
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        // 토큰 삭제 후 재로그인 유도
        await chrome.storage.local.remove(['authToken', 'userInfo']);
        throw new Error('세션이 만료되었습니다. 다시 로그인해주세요.');
      }
      throw new Error('서버 응답 오류: ' + responseText.substring(0, 100));
    }

    console.log('[에이블리 수집기] API 응답:', result);

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('[에이블리 수집기] 저장 오류:', error);
    throw error;
  }
}

// 셀러 목록 가져오기 (Supabase API 호출)
async function getSellerList() {
  const { authToken } = await chrome.storage.local.get(['authToken']);

  if (!authToken) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ably/sellers`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    // 응답 텍스트 먼저 가져오기
    const responseText = await response.text();

    // JSON 파싱 시도
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      // HTML 응답인 경우 (토큰 만료 등)
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        await chrome.storage.local.remove(['authToken', 'userInfo']);
        console.error('[에이블리 수집기] 세션 만료됨');
        return [];
      }
      console.error('[에이블리 수집기] 목록 조회 파싱 오류:', responseText.substring(0, 100));
      return [];
    }

    if (!response.ok || !result.success) {
      console.error('[에이블리 수집기] 목록 조회 실패:', result.error);
      return [];
    }

    // API 데이터를 기존 형식으로 변환
    return (result.data || []).map((seller, index) => ({
      순번: index + 1,
      상호: seller.company_name,
      대표자: seller.representative,
      주소: seller.address,
      사업자등록번호: seller.business_number,
      통신판매업신고번호: seller.ecommerce_number,
      이메일: seller.email,
      전화번호: seller.phone,
      url: seller.source_url,
      collectedAt: seller.collected_at
    }));
  } catch (error) {
    console.error('[에이블리 수집기] 목록 조회 오류:', error);
    return [];
  }
}

// 모든 데이터 삭제
async function clearAllData() {
  const { authToken } = await chrome.storage.local.get(['authToken']);

  if (!authToken) {
    throw new Error('로그인이 필요합니다.');
  }

  const response = await fetch(`${API_BASE_URL}/ably/sellers`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '삭제 실패');
  }

  console.log('[에이블리 수집기] 모든 데이터 삭제됨');
}

// 엑셀 다운로드 (API에서 CSV 받아서 다운로드)
async function downloadExcel() {
  try {
    const { authToken } = await chrome.storage.local.get(['authToken']);

    if (!authToken) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    const response = await fetch(`${API_BASE_URL}/ably/sellers?format=csv`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: errorText || '다운로드 실패' };
    }

    // CSV 데이터를 Blob으로 변환
    const csvContent = await response.text();

    if (!csvContent || csvContent.length < 50) {
      return { success: false, error: '저장된 셀러 정보가 없습니다.' };
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    const filename = `셀러정보_${date}.csv`;

    await chrome.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });

    // 행 수 계산 (헤더 제외)
    const rowCount = csvContent.split('\n').length - 1;

    console.log('[에이블리 수집기] 다운로드 시작:', filename);

    return {
      success: true,
      filename,
      count: rowCount
    };
  } catch (error) {
    console.error('[에이블리 수집기] 다운로드 오류:', error);
    return { success: false, error: error.message };
  }
}

// 확장 프로그램 설치 시
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[에이블리 수집기] 확장 프로그램이 설치되었습니다.');
  }
});

// 셀러포트 웹사이트에서 로그인 완료 시 토큰 수신
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (sender.origin !== 'https://sellerport.app') {
    sendResponse({ success: false, error: 'Unauthorized origin' });
    return;
  }

  if (request.action === 'setAuthToken') {
    chrome.storage.local.set({
      authToken: request.authToken,
      userInfo: request.userInfo
    }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
