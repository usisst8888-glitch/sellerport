// 에이블리 셀러 정보 수집기 - Background Service Worker

const API_BASE_URL = 'https://sellerport.app/api';
const SUPABASE_URL = 'https://fvlgtpeueruofjlgvuup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bGd0cGV1ZXJ1b2ZqbGd2dXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2MjAxMzQsImV4cCI6MjA0ODE5NjEzNH0.e89lfBrNqLWUxfOOjBPU0GH7k9U_bUvPl0qJYOF_nqk';

// Uint8Array를 Base64 문자열로 변환 (Service Worker에서 사용)
function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}

// 토큰 갱신 함수
async function refreshAuthToken() {
  try {
    const { refreshToken } = await chrome.storage.local.get(['refreshToken']);

    if (!refreshToken) {
      console.log('[에이블리 수집기] refresh token 없음');
      return null;
    }

    console.log('[에이블리 수집기] 토큰 갱신 시도...');

    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      console.error('[에이블리 수집기] 토큰 갱신 실패:', response.status);
      // refresh token도 만료된 경우 로그아웃 처리
      await chrome.storage.local.remove(['authToken', 'refreshToken', 'userInfo']);
      return null;
    }

    const data = await response.json();

    // 새 토큰 저장
    await chrome.storage.local.set({
      authToken: data.access_token,
      refreshToken: data.refresh_token
    });

    console.log('[에이블리 수집기] 토큰 갱신 성공!');
    return data.access_token;
  } catch (error) {
    console.error('[에이블리 수집기] 토큰 갱신 오류:', error);
    return null;
  }
}

// 유효한 토큰 가져오기 (만료 시 자동 갱신)
async function getValidAuthToken() {
  const { authToken } = await chrome.storage.local.get(['authToken']);

  if (!authToken) {
    return null;
  }

  // JWT 토큰 만료 확인
  try {
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    const expiresAt = payload.exp * 1000; // 초 -> 밀리초
    const now = Date.now();

    // 만료 5분 전이면 갱신
    if (expiresAt - now < 5 * 60 * 1000) {
      console.log('[에이블리 수집기] 토큰 만료 임박, 갱신 중...');
      const newToken = await refreshAuthToken();
      return newToken || authToken; // 갱신 실패 시 기존 토큰 반환
    }

    return authToken;
  } catch (e) {
    console.error('[에이블리 수집기] 토큰 파싱 오류:', e);
    return authToken;
  }
}

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
    const authToken = await getValidAuthToken();

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
  const authToken = await getValidAuthToken();

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
  const authToken = await getValidAuthToken();

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
    const authToken = await getValidAuthToken();

    if (!authToken) {
      return { success: false, error: '로그인이 필요합니다.' };
    }

    console.log('[에이블리 수집기] CSV 다운로드 요청');

    const response = await fetch(`${API_BASE_URL}/ably/sellers?format=csv`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('[에이블리 수집기] CSV 응답 상태:', response.status);
    console.log('[에이블리 수집기] Content-Type:', response.headers.get('Content-Type'));

    // 응답 텍스트 가져오기
    const responseText = await response.text();
    console.log('[에이블리 수집기] 응답 길이:', responseText.length);
    console.log('[에이블리 수집기] 응답 미리보기:', responseText.substring(0, 100));

    // JSON 에러 응답인지 확인
    if (responseText.startsWith('{')) {
      try {
        const jsonError = JSON.parse(responseText);
        return { success: false, error: jsonError.error || '다운로드 실패' };
      } catch (e) {
        // JSON 파싱 실패하면 그냥 진행
      }
    }

    if (!response.ok) {
      return { success: false, error: responseText || '다운로드 실패' };
    }

    if (!responseText || responseText.length < 50) {
      return { success: false, error: '저장된 셀러 정보가 없습니다.' };
    }

    // Service Worker에서는 URL.createObjectURL 사용 불가
    // UTF-8 BOM + CSV 내용을 Base64로 인코딩
    // BOM이 없으면 엑셀에서 한글이 깨짐
    const BOM = '\uFEFF';
    const csvWithBom = responseText.startsWith(BOM) ? responseText : BOM + responseText;

    // UTF-8 문자열을 바이트 배열로 변환 후 Base64 인코딩
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(csvWithBom);
    const base64 = uint8ArrayToBase64(uint8Array);
    const dataUrl = `data:text/csv;base64,${base64}`;

    const date = new Date().toISOString().split('T')[0];
    const filename = `셀러정보_${date}.csv`;

    await chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: true
    });

    // 행 수 계산 (헤더 제외)
    const rowCount = responseText.split('\n').length - 1;

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
