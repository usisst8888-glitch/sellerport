// 셀러포트 크롬 확장 - Content Script
// 네이버 스마트스토어 판매자센터에서 사용자정의채널 데이터 수집

(function() {
  'use strict';

  // 메시지 리스너
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'collectData') {
      collectChannelData()
        .then(data => sendResponse({ success: true, data }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // 비동기 응답을 위해 true 반환
    }
  });

  // 사용자정의채널 데이터 수집
  async function collectChannelData() {
    try {
      // 현재 페이지가 사용자정의채널 페이지인지 확인
      if (!isValidPage()) {
        throw new Error('사용자정의채널 페이지가 아닙니다.');
      }

      // 테이블 데이터 수집
      const tableData = extractTableData();

      if (!tableData || tableData.length === 0) {
        // 테이블이 "현재 조건에 해당되는 데이터가 없습니다" 메시지가 있는지 확인
        const noDataMessage = document.body.innerText.includes('현재 조건에 해당되는 데이터가 없습니다') ||
                              document.body.innerText.includes('데이터가 없습니다') ||
                              document.body.innerText.includes('검색 결과가 없습니다');

        if (noDataMessage) {
          throw new Error('해당 기간에 NT 파라미터로 유입된 데이터가 없습니다. 메타 광고에 NT 파라미터를 설정하고 유입이 발생한 후 다시 시도해주세요.');
        } else {
          throw new Error('테이블에서 데이터를 찾을 수 없습니다. 사용자정의채널 페이지의 테이블에 데이터가 표시되어 있는지 확인해주세요.');
        }
      }

      // 날짜 범위 추출
      const dateRange = extractDateRange();

      return {
        channels: tableData,
        dateRange: dateRange,
        pageUrl: window.location.href
      };
    } catch (error) {
      console.error('[셀러포트] 데이터 수집 오류:', error);
      throw error;
    }
  }

  // 유효한 페이지인지 확인
  function isValidPage() {
    const url = window.location.href;
    return url.includes('sell.smartstore.naver.com') &&
           (url.includes('marketing') ||
            url.includes('user-defined-channel') ||
            document.querySelector('[class*="channel"]') !== null ||
            document.body.innerText.includes('사용자정의채널'));
  }

  // 테이블 데이터 추출
  function extractTableData() {
    const channels = [];

    console.log('[셀러포트] ========== 데이터 수집 시작 ==========');

    // 먼저 iframe 내부에서 데이터 찾기 (네이버 스마트스토어는 iframe 사용)
    const iframeData = extractFromIframe();
    if (iframeData && iframeData.length > 0) {
      console.log('[셀러포트] iframe에서 데이터 발견:', iframeData.length, '개');
      channels.push(...iframeData);
      return channels;
    }

    // 메인 document에서 테이블 파싱
    const tableData = extractFromTables(document);
    if (tableData.length > 0) {
      channels.push(...tableData);
      return channels;
    }

    // 스크립트 데이터에서 추출
    const scriptData = extractFromScript();
    if (scriptData && scriptData.length > 0) {
      channels.push(...scriptData);
    }

    console.log('[셀러포트] 수집된 채널 수:', channels.length);
    return channels;
  }

  // iframe 내부에서 데이터 추출
  function extractFromIframe() {
    const channels = [];
    const iframes = document.querySelectorAll('iframe');

    for (const iframe of iframes) {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) continue;

        console.log('[셀러포트] iframe 접근 성공:', iframe.id || iframe.src?.substring(0, 50));

        // iframe 내부 테이블에서 데이터 추출
        const tableData = extractFromTables(iframeDoc);
        if (tableData.length > 0) {
          channels.push(...tableData);
        }
      } catch (e) {
        console.log('[셀러포트] iframe 접근 실패 (CORS):', e.message);
      }
    }

    return channels;
  }

  // 테이블에서 데이터 추출 (document 또는 iframe document)
  function extractFromTables(doc) {
    const channels = [];
    const tables = doc.querySelectorAll('table');

    console.log('[셀러포트] 테이블 수:', tables.length);

    for (const table of tables) {
      // 헤더 분석하여 올바른 테이블인지 확인
      const headers = Array.from(table.querySelectorAll('thead th, thead td')).map(h => h.innerText.trim());
      console.log('[셀러포트] 테이블 헤더:', headers);

      // 사용자정의채널 테이블 식별 (채널명, 유입수, 결제수 등의 헤더)
      const isChannelTable = headers.some(h =>
        h.includes('채널') || h.includes('유입') || h.includes('결제') ||
        h.includes('source') || h.includes('medium')
      );

      if (!isChannelTable && headers.length > 0) {
        console.log('[셀러포트] 채널 테이블 아님, 건너뜀');
        continue;
      }

      const rows = table.querySelectorAll('tbody tr');
      console.log('[셀러포트] 테이블 행 수:', rows.length);

      for (const row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) continue;

        // 셀 내용 추출
        const cellTexts = Array.from(cells).map(c => c.innerText.trim());
        console.log('[셀러포트] 행 데이터:', cellTexts);

        const channelData = parseChannelRow(cellTexts, headers);
        if (channelData) {
          channels.push(channelData);
        }
      }
    }

    return channels;
  }

  // 채널 행 데이터 파싱 (헤더 기반)
  // 테이블 구조: [채널속성, nt_source, nt_medium, 고객수, 유입수, 결제수, 유입당결제율, 결제금액, ...]
  function parseChannelRow(cellTexts, headers) {
    if (!cellTexts || cellTexts.length < 3) return null;

    // 헤더에서 각 컬럼의 인덱스 찾기
    const sourceIdx = headers.findIndex(h => h === 'nt_source' || h.includes('source'));
    const mediumIdx = headers.findIndex(h => h === 'nt_medium' || h.includes('medium'));

    let nt_source = '';
    let nt_medium = '';
    let nt_detail = '';
    let deviceType = '';

    // 헤더 기반으로 source/medium 추출
    if (sourceIdx !== -1 && mediumIdx !== -1) {
      // 채널속성(PC/모바일)은 첫 번째 컬럼
      deviceType = cellTexts[0] || '';
      nt_source = cellTexts[sourceIdx] || '';
      nt_medium = cellTexts[mediumIdx] || '';
    } else {
      // 헤더가 없거나 다른 형식일 경우 기존 로직
      const channelName = cellTexts[0];
      if (channelName && channelName.includes('/')) {
        const parts = channelName.split('/');
        nt_source = parts[0] || '';
        nt_medium = parts[1] || '';
        nt_detail = parts[2] || '';
      } else {
        nt_source = channelName || '';
      }
    }

    // "전체" 행은 건너뜀
    if (nt_source === '전체' || nt_source === '' || nt_source === 'PC' || nt_source === '모바일') {
      // 채널속성만 있고 source가 없는 경우
      if (sourceIdx !== -1 && cellTexts[sourceIdx]) {
        nt_source = cellTexts[sourceIdx];
      } else {
        return null;
      }
    }

    // 숫자 데이터 매핑 (헤더 기반)
    let visitors = 0, visits = 0, orders = 0, revenue = 0, conversionRate = 0;
    let ordersEstimated = 0, revenueEstimated = 0;

    headers.forEach((header, idx) => {
      if (idx >= cellTexts.length) return;
      const value = parseNumber(cellTexts[idx]);

      // 마지막클릭 기준 vs 기여도추정 구분
      if (header.includes('고객수')) {
        visitors = value;
      } else if (header.includes('유입수') || header === '유입수') {
        visits = value;
      } else if (header.includes('결제수') && !header.includes('유입당')) {
        // 마지막클릭 기준인지 기여도추정인지 확인
        const parentHeader = headers.slice(0, idx).reverse().find(h =>
          h.includes('마지막클릭') || h.includes('기여도')
        );
        if (parentHeader && parentHeader.includes('기여도')) {
          ordersEstimated = value;
        } else {
          orders = value;
        }
      } else if (header.includes('결제금액') && !header.includes('유입당')) {
        const parentHeader = headers.slice(0, idx).reverse().find(h =>
          h.includes('마지막클릭') || h.includes('기여도')
        );
        if (parentHeader && parentHeader.includes('기여도')) {
          revenueEstimated = value;
        } else {
          revenue = value;
        }
      } else if (header.includes('유입당') && header.includes('결제율')) {
        conversionRate = value;
      }
    });

    console.log('[셀러포트] 파싱 결과:', {
      deviceType, nt_source, nt_medium, visitors, visits, orders, revenue, ordersEstimated, revenueEstimated
    });

    return {
      deviceType,
      nt_source,
      nt_medium,
      nt_detail,
      visitors,
      visits,
      orders,
      revenue,
      ordersEstimated,
      revenueEstimated,
      conversionRate
    };
  }

  // 스크립트에서 데이터 추출 (Next.js 등)
  function extractFromScript() {
    try {
      // __NEXT_DATA__ 확인
      const nextDataScript = document.getElementById('__NEXT_DATA__');
      if (nextDataScript) {
        const data = JSON.parse(nextDataScript.textContent);
        const pageProps = data?.props?.pageProps;

        if (pageProps?.channelData || pageProps?.channels) {
          return formatScriptData(pageProps.channelData || pageProps.channels);
        }
      }

      // window 객체에서 데이터 검색
      if (window.__INITIAL_STATE__ || window.__DATA__) {
        const stateData = window.__INITIAL_STATE__ || window.__DATA__;
        if (stateData.channels || stateData.channelList) {
          return formatScriptData(stateData.channels || stateData.channelList);
        }
      }

      return [];
    } catch (error) {
      console.error('[셀러포트] 스크립트 데이터 추출 오류:', error);
      return [];
    }
  }

  // 스크립트 데이터 포맷팅
  function formatScriptData(data) {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      nt_source: item.source || item.nt_source || item.ntSource || '',
      nt_medium: item.medium || item.nt_medium || item.ntMedium || '',
      nt_detail: item.detail || item.nt_detail || item.ntDetail || '',
      visits: item.visits || item.visitCount || 0,
      orders: item.orders || item.orderCount || item.purchaseCount || 0,
      revenue: item.revenue || item.salesAmount || item.totalSales || 0,
      conversionRate: item.conversionRate || item.cvr || 0
    })).filter(item => item.nt_source);
  }

  // 날짜 범위 추출
  function extractDateRange() {
    try {
      // 날짜 선택기에서 추출
      const dateInputs = document.querySelectorAll('input[type="date"], [class*="date-picker"], [class*="datepicker"]');

      if (dateInputs.length >= 2) {
        return {
          startDate: dateInputs[0].value || null,
          endDate: dateInputs[1].value || null
        };
      }

      // 텍스트에서 날짜 추출
      const dateText = document.body.innerText.match(/\d{4}[.-]\d{2}[.-]\d{2}/g);

      if (dateText && dateText.length >= 2) {
        return {
          startDate: dateText[0],
          endDate: dateText[1]
        };
      }

      // 기본값: 오늘 기준 최근 7일
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      return {
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    } catch (error) {
      return null;
    }
  }

  // 숫자 파싱 (콤마, 원, % 등 제거)
  function parseNumber(text) {
    if (!text) return 0;

    // 숫자와 소수점만 추출
    const cleaned = text.replace(/[^\d.]/g, '');
    const number = parseFloat(cleaned);

    return isNaN(number) ? 0 : number;
  }

  // 페이지 로드 시 셀러포트 버튼 추가 (선택적)
  function addSellerportButton() {
    if (!isValidPage()) return;

    // 이미 버튼이 있으면 추가하지 않음
    if (document.getElementById('sellerport-collect-btn')) return;

    const button = document.createElement('button');
    button.id = 'sellerport-collect-btn';
    button.className = 'sellerport-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      셀러포트 수집
    `;

    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = '수집 중...';

      try {
        const data = await collectChannelData();

        // background script로 전송
        chrome.runtime.sendMessage({
          action: 'sendToAPI',
          data: data
        }, response => {
          if (response.success) {
            button.textContent = '전송 완료!';
            button.style.background = '#22c55e';
          } else {
            button.textContent = '전송 실패';
            button.style.background = '#ef4444';
          }

          setTimeout(() => {
            button.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              셀러포트 수집
            `;
            button.style.background = '';
            button.disabled = false;
          }, 2000);
        });
      } catch (error) {
        button.textContent = '오류: ' + error.message;
        button.style.background = '#ef4444';
        button.disabled = false;
      }
    });

    // 페이지에 버튼 삽입 (툴바 영역 찾기)
    const toolbar = document.querySelector('[class*="toolbar"], [class*="action"], header, .header');
    if (toolbar) {
      toolbar.appendChild(button);
    } else {
      // 고정 위치에 버튼 추가
      button.style.position = 'fixed';
      button.style.bottom = '20px';
      button.style.right = '20px';
      button.style.zIndex = '9999';
      document.body.appendChild(button);
    }
  }

  // 페이지 로드 완료 시 버튼 추가
  if (document.readyState === 'complete') {
    addSellerportButton();
  } else {
    window.addEventListener('load', addSellerportButton);
  }

  // SPA 페이지 변경 감지
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(addSellerportButton, 1000);
    }
  }).observe(document, { subtree: true, childList: true });

})();
