// 셀러포트 크롬 확장 - 인증 Content Script
// sellerport.app에서 로그인 토큰을 읽어 확장 프로그램에 저장

(function() {
  'use strict';

  // localStorage에서 인증 정보 확인
  function checkAuthToken() {
    try {
      const authData = localStorage.getItem('sellerport_extension_auth');

      if (authData) {
        const parsed = JSON.parse(authData);

        // 5분 이내의 토큰만 유효
        if (parsed.timestamp && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          // 확장 프로그램 스토리지에 저장
          chrome.storage.local.set({
            authToken: parsed.authToken,
            userInfo: parsed.userInfo
          }, () => {
            console.log('[셀러포트] 확장 프로그램 로그인 연동 완료');

            // localStorage에서 삭제 (보안)
            localStorage.removeItem('sellerport_extension_auth');

            // 팝업에 알림
            chrome.runtime.sendMessage({
              action: 'authComplete',
              authToken: parsed.authToken,
              userInfo: parsed.userInfo
            }).catch(() => {
              // 팝업이 열려있지 않으면 무시
            });
          });
        }
      }
    } catch (error) {
      console.error('[셀러포트] 인증 토큰 처리 오류:', error);
    }
  }

  // 페이지 로드 시 확인
  checkAuthToken();

  // URL 변경 감지 (SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(checkAuthToken, 500);
    }
  }).observe(document, { subtree: true, childList: true });

  // storage 이벤트 감지
  window.addEventListener('storage', (e) => {
    if (e.key === 'sellerport_extension_auth' && e.newValue) {
      checkAuthToken();
    }
  });

})();
