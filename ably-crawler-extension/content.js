// 에이블리 셀러 정보 수집기 - Content Script

(function() {
  'use strict';

  // 저장 버튼 추가
  function addSaveButton() {
    // 이미 버튼이 있으면 추가하지 않음
    if (document.getElementById('ably-seller-save-btn')) return;

    // 상품 페이지인지 확인
    if (!window.location.href.includes('/goods/')) return;

    const button = document.createElement('button');
    button.id = 'ably-seller-save-btn';
    button.className = 'ably-seller-btn';
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      셀러 정보 저장
    `;

    button.addEventListener('click', handleSaveClick);

    // 고정 위치에 버튼 추가
    document.body.appendChild(button);
  }

  // 저장 버튼 클릭 핸들러
  async function handleSaveClick() {
    const button = document.getElementById('ably-seller-save-btn');
    if (!button) return;

    button.disabled = true;
    button.innerHTML = `
      <svg class="spinning" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
      정보 수집 중...
    `;

    try {
      console.log('[에이블리 수집기] 저장 버튼 클릭됨');

      // 먼저 현재 페이지에서 판매자 정보 추출 시도
      let sellerInfo = extractSellerInfo();

      // 못 찾았으면 스크롤/펼치기 시도 후 다시 추출
      if (!sellerInfo || !sellerInfo.사업자등록번호) {
        console.log('[에이블리 수집기] 판매자 정보 없음, 스크롤 시도');
        await expandProductInfo();
        await new Promise(resolve => setTimeout(resolve, 1000));
        sellerInfo = extractSellerInfo();
      }

      console.log('[에이블리 수집기] 추출된 정보:', sellerInfo);

      if (!sellerInfo) {
        showNotification('판매자 정보를 찾을 수 없습니다. 상품 정보를 먼저 펼쳐주세요.', 'error');
        resetButton(button);
        return;
      }

      // 현재 페이지 URL 추가
      sellerInfo.url = window.location.href;
      sellerInfo.collectedAt = new Date().toISOString();

      console.log('[에이블리 수집기] 수집된 정보:', sellerInfo);

      // background script로 전송
      chrome.runtime.sendMessage({
        action: 'saveSellerInfo',
        data: sellerInfo
      }, response => {
        if (response && response.success) {
          if (response.duplicate) {
            showNotification('이미 저장된 판매자 정보입니다. (중복)', 'warning');
          } else {
            showNotification(`저장 완료! (${response.totalCount}번째 셀러)`, 'success');
          }
        } else {
          showNotification(response?.error || '저장 실패', 'error');
        }
        resetButton(button);
      });

    } catch (error) {
      console.error('[에이블리 수집기] 오류:', error);
      showNotification('오류: ' + error.message, 'error');
      resetButton(button);
    }
  }

  // 판매자 정보 탭 클릭 및 정보 로드
  async function expandProductInfo() {
    console.log('[에이블리 수집기] 판매자 정보 탭 찾기 시작');

    // 1. 탭 버튼들 찾기 - "상품정보", "리뷰", "판매자 정보" 등
    const allButtons = document.querySelectorAll('button');
    let sellerTabFound = false;

    for (const btn of allButtons) {
      const text = btn.innerText.trim();
      if (text === '판매자 정보' || text.includes('판매자정보') || text.includes('판매자 정보')) {
        console.log('[에이블리 수집기] 판매자 정보 탭 발견, 클릭');
        btn.click();
        sellerTabFound = true;
        await new Promise(resolve => setTimeout(resolve, 1500));
        break;
      }
    }

    // 2. 탭이 없으면 탭 역할을 하는 다른 요소들 찾기
    if (!sellerTabFound) {
      const allDivs = document.querySelectorAll('div, span, p');
      for (const el of allDivs) {
        const text = el.innerText.trim();
        if (text === '판매자 정보' && el.onclick !== null) {
          console.log('[에이블리 수집기] 판매자 정보 요소 클릭');
          el.click();
          sellerTabFound = true;
          await new Promise(resolve => setTimeout(resolve, 1500));
          break;
        }
      }
    }

    // 3. role="tab" 속성을 가진 요소 찾기
    if (!sellerTabFound) {
      const tabs = document.querySelectorAll('[role="tab"]');
      for (const tab of tabs) {
        if (tab.innerText.includes('판매자')) {
          console.log('[에이블리 수집기] role=tab 판매자 정보 탭 클릭');
          tab.click();
          sellerTabFound = true;
          await new Promise(resolve => setTimeout(resolve, 1500));
          break;
        }
      }
    }

    // 4. 스크롤하여 lazy load 트리거
    if (!sellerTabFound) {
      console.log('[에이블리 수집기] 탭 못 찾음, 스크롤 시도');
      for (let i = 0; i < 3; i++) {
        window.scrollTo(0, document.body.scrollHeight * (i + 1) / 3);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 5. "상품 정보 펼쳐보기" 버튼 찾기
    const expandButtons = document.querySelectorAll('button');
    for (const btn of expandButtons) {
      if (btn.innerText.includes('상품 정보 펼쳐보기') ||
          btn.innerText.includes('펼쳐보기') ||
          btn.innerText.includes('더보기')) {
        console.log('[에이블리 수집기] 펼쳐보기 버튼 클릭');
        btn.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return sellerTabFound;
  }

  // 판매자 정보 추출
  function extractSellerInfo() {
    const info = {
      상호: '',
      대표자: '',
      주소: '',
      사업자등록번호: '',
      통신판매업신고번호: '',
      이메일: '',
      전화번호: ''
    };

    console.log('[에이블리 수집기] 판매자 정보 추출 시작');

    // Shadow DOM 및 iframe 내부 document 가져오기
    let targetDoc = document;

    // 1. Shadow DOM 내부의 iframe 찾기 (모든 Shadow DOM 순회)
    const divsWithShadow = Array.from(document.querySelectorAll('div')).filter(d => d.shadowRoot);
    console.log(`[에이블리 수집기] Shadow DOM 개수: ${divsWithShadow.length}`);

    for (let i = 0; i < divsWithShadow.length; i++) {
      const div = divsWithShadow[i];
      // Shadow DOM 내부의 모든 iframe 찾기
      const shadowIframe = div.shadowRoot.querySelector('iframe');
      if (shadowIframe) {
        console.log(`[에이블리 수집기] Shadow DOM #${i}에서 iframe 발견, src: ${shadowIframe.src}`);
        try {
          const iframeDoc = shadowIframe.contentDocument || shadowIframe.contentWindow?.document;
          if (iframeDoc && iframeDoc.body) {
            // 판매자 정보가 있는지 확인 (사업자등록번호 패턴)
            const hasSellerInfo = iframeDoc.body.innerHTML.includes('사업자등록번호') ||
                                  iframeDoc.body.innerHTML.includes('상호') ||
                                  iframeDoc.body.innerHTML.includes('대표자');
            if (hasSellerInfo) {
              targetDoc = iframeDoc;
              console.log('[에이블리 수집기] Shadow DOM iframe에서 판매자 정보 발견!');
              break;
            }
          }
        } catch (e) {
          console.log(`[에이블리 수집기] Shadow DOM #${i} iframe 접근 실패:`, e.message);
        }
      }
    }

    // 2. 일반 iframe 찾기 (Shadow DOM에서 못 찾은 경우)
    if (targetDoc === document) {
      const iframes = document.querySelectorAll('iframe');
      console.log(`[에이블리 수집기] 일반 iframe 개수: ${iframes.length}`);

      for (const iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc && iframeDoc.body) {
            const hasSellerInfo = iframeDoc.body.innerHTML.includes('사업자등록번호') ||
                                  iframeDoc.body.innerHTML.includes('상호') ||
                                  iframeDoc.body.innerHTML.includes('대표자');
            if (hasSellerInfo) {
              targetDoc = iframeDoc;
              console.log('[에이블리 수집기] 일반 iframe에서 판매자 정보 발견!');
              break;
            }
          }
        } catch (e) {
          console.log('[에이블리 수집기] iframe 접근 실패 (CORS):', e.message);
        }
      }
    }

    console.log('[에이블리 수집기] targetDoc:', targetDoc === document ? 'main document' : 'iframe document');

    // 방법 1: enTTVq 클래스를 가진 div 직접 찾기 (에이블리 판매자 정보 구조)
    const sellerInfoDivs = targetDoc.querySelectorAll('div[class*="enTTVq"]');
    console.log(`[에이블리 수집기] enTTVq div 개수: ${sellerInfoDivs.length}`);

    if (sellerInfoDivs.length > 0) {
      sellerInfoDivs.forEach(div => {
        const ps = div.querySelectorAll('p');
        if (ps.length >= 2) {
          const label = ps[0].innerText.trim();
          const value = ps[1].innerText.trim();
          if (info.hasOwnProperty(label) && value) {
            info[label] = value;
            console.log(`[에이블리 수집기] enTTVq ${label}: ${value}`);
          }
        }
      });
    }

    // 방법 2: coSaWk 클래스를 가진 판매자 정보 컨테이너 찾기
    if (!info.상호) {
      const container = targetDoc.querySelector('div[class*="coSaWk"]');
      if (container) {
        console.log('[에이블리 수집기] coSaWk 컨테이너 발견');
        const innerDivs = container.querySelectorAll('div');
        innerDivs.forEach(div => {
          const ps = div.querySelectorAll('p');
          if (ps.length >= 2) {
            const label = ps[0].innerText.trim();
            const value = ps[1].innerText.trim();
            if (info.hasOwnProperty(label) && value) {
              info[label] = value;
              console.log(`[에이블리 수집기] coSaWk ${label}: ${value}`);
            }
          }
        });
      }
    }

    // 방법 3: "판매자 정보" 텍스트를 포함한 p 태그의 부모에서 찾기
    if (!info.상호) {
      const allPs = targetDoc.querySelectorAll('p');
      for (const p of allPs) {
        if (p.innerText.trim() === '판매자 정보') {
          console.log('[에이블리 수집기] "판매자 정보" p 태그 발견');
          const parent = p.parentElement;
          if (parent) {
            // 부모 안의 모든 div에서 p 쌍 찾기
            const siblingDivs = parent.querySelectorAll('div');
            siblingDivs.forEach(div => {
              const childPs = div.querySelectorAll('p');
              if (childPs.length >= 2) {
                const label = childPs[0].innerText.trim();
                const value = childPs[1].innerText.trim();
                if (info.hasOwnProperty(label) && value) {
                  info[label] = value;
                  console.log(`[에이블리 수집기] parent ${label}: ${value}`);
                }
              }
            });
          }
          break;
        }
      }
    }

    // 방법 4: 연속된 p 태그에서 라벨-값 쌍 찾기
    if (!info.상호) {
      console.log('[에이블리 수집기] 방법4: 연속 p 태그 순회');
      const allPs = Array.from(targetDoc.querySelectorAll('p'));

      for (let i = 0; i < allPs.length - 1; i++) {
        const label = allPs[i].innerText.trim();
        if (info.hasOwnProperty(label)) {
          // 다음 p 요소가 같은 부모를 가지는지 확인
          const currentParent = allPs[i].parentElement;
          const nextP = allPs[i + 1];

          if (nextP.parentElement === currentParent) {
            const value = nextP.innerText.trim();
            if (value && !info.hasOwnProperty(value) && value !== '판매자 정보') {
              info[label] = value;
              console.log(`[에이블리 수집기] 연속p ${label}: ${value}`);
            }
          }
        }
      }
    }

    // 방법 5: innerHTML에서 직접 파싱
    if (!info.상호) {
      console.log('[에이블리 수집기] 방법5: innerHTML 파싱');
      const html = targetDoc.body ? targetDoc.body.innerHTML : document.body.innerHTML;

      // <p>상호</p><p>값</p> 패턴 찾기
      const labelPatterns = ['상호', '대표자', '주소', '사업자등록번호', '통신판매업신고번호', '이메일', '전화번호'];

      for (const label of labelPatterns) {
        // <p>라벨</p><p>값</p> 또는 <p>라벨</p>\s*<p>값</p> 패턴
        const regex = new RegExp(`<p[^>]*>${label}</p>\\s*<p[^>]*>([^<]+)</p>`, 'i');
        const match = html.match(regex);
        if (match && match[1]) {
          const value = match[1].trim();
          if (value && info.hasOwnProperty(label)) {
            info[label] = value;
            console.log(`[에이블리 수집기] HTML파싱 ${label}: ${value}`);
          }
        }
      }
    }

    // 방법 6: innerText에서 정규식으로 추출
    if (!info.상호) {
      console.log('[에이블리 수집기] 방법6: 정규식 추출');

      const pageText = targetDoc.body ? targetDoc.body.innerText : document.body.innerText;

      const patterns = [
        { key: '상호', regex: /상호\n([^\n]+)/m },
        { key: '대표자', regex: /대표자\n([^\n]+)/m },
        { key: '주소', regex: /주소\n([^\n]+)/m },
        { key: '사업자등록번호', regex: /사업자등록번호\n([\d\-]+)/m },
        { key: '통신판매업신고번호', regex: /통신판매업신고번호\n([^\n]+)/m },
        { key: '이메일', regex: /이메일\n([^\s\n]+@[^\s\n]+)/m },
        { key: '전화번호', regex: /전화번호\n([\d\-]+)/m }
      ];

      for (const p of patterns) {
        const match = pageText.match(p.regex);
        if (match && match[1]) {
          info[p.key] = match[1].trim();
          console.log(`[에이블리 수집기] 정규식 ${p.key}: ${info[p.key]}`);
        }
      }
    }

    // 방법 7: 마켓 이름 폴백
    if (!info.상호) {
      console.log('[에이블리 수집기] 방법7: 마켓 이름 폴백');

      const marketNameEl = document.querySelector('[class*="8652a18a"] p[class*="subtitle2"]');
      if (marketNameEl) {
        info.상호 = marketNameEl.innerText.trim();
        console.log('[에이블리 수집기] 마켓 이름:', info.상호);
      }
    }

    console.log('[에이블리 수집기] 최종 결과:', info);

    if (!info.상호) {
      return null;
    }

    return info;
  }

  // 버튼 초기화
  function resetButton(button) {
    button.disabled = false;
    button.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
        <polyline points="17 21 17 13 7 13 7 21"></polyline>
        <polyline points="7 3 7 8 15 8"></polyline>
      </svg>
      셀러 정보 저장
    `;
  }

  // 알림 표시
  function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existing = document.getElementById('ably-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'ably-notification';
    notification.className = `ably-notification ably-notification-${type}`;
    notification.innerText = message;

    document.body.appendChild(notification);

    // 3초 후 자동 제거
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // 페이지 로드 완료 시 버튼 추가
  if (document.readyState === 'complete') {
    addSaveButton();
  } else {
    window.addEventListener('load', addSaveButton);
  }

  // SPA 페이지 변경 감지
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(addSaveButton, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();
