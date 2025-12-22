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

    // 방법 1: 테이블 직접 파싱
    const tables = document.querySelectorAll('table');

    for (const table of tables) {
      const rows = table.querySelectorAll('tbody tr');

      for (const row of rows) {
        const cells = row.querySelectorAll('td');

        if (cells.length >= 4) {
          const channelData = parseRowData(cells);
          if (channelData) {
            channels.push(channelData);
          }
        }
      }
    }

    // 방법 2: 리스트 형태 파싱 (테이블이 아닌 경우)
    if (channels.length === 0) {
      const listItems = document.querySelectorAll('[class*="channel-item"], [class*="list-item"], [data-channel]');

      for (const item of listItems) {
        const channelData = parseListItem(item);
        if (channelData) {
          channels.push(channelData);
        }
      }
    }

    // 방법 3: 네이버 데이터 객체에서 직접 추출 (window.__NEXT_DATA__ 등)
    if (channels.length === 0) {
      const scriptData = extractFromScript();
      if (scriptData && scriptData.length > 0) {
        channels.push(...scriptData);
      }
    }

    return channels;
  }

  // 테이블 행 데이터 파싱
  function parseRowData(cells) {
    try {
      // NT 파라미터 정보 추출
      const sourceText = cells[0]?.innerText?.trim() || '';
      const mediumText = cells[1]?.innerText?.trim() || '';
      const detailText = cells[2]?.innerText?.trim() || '';

      // nt_source, nt_medium, nt_detail 형식인지 확인
      if (!sourceText) return null;

      // 숫자 데이터 추출 (방문수, 주문수, 매출 등)
      const numericValues = [];
      for (let i = 3; i < cells.length; i++) {
        const text = cells[i]?.innerText?.trim() || '0';
        const value = parseNumber(text);
        numericValues.push(value);
      }

      return {
        nt_source: sourceText,
        nt_medium: mediumText,
        nt_detail: detailText,
        visits: numericValues[0] || 0,
        orders: numericValues[1] || 0,
        revenue: numericValues[2] || 0,
        conversionRate: numericValues[3] || 0
      };
    } catch (error) {
      console.error('[셀러포트] 행 파싱 오류:', error);
      return null;
    }
  }

  // 리스트 아이템 파싱
  function parseListItem(item) {
    try {
      const text = item.innerText || '';
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);

      if (lines.length < 2) return null;

      // NT 파라미터와 숫자 데이터 분리
      const ntParams = {};
      const numericData = [];

      for (const line of lines) {
        if (line.includes('source') || line.includes('nt_source')) {
          ntParams.nt_source = line.split(':').pop()?.trim() || line;
        } else if (line.includes('medium') || line.includes('nt_medium')) {
          ntParams.nt_medium = line.split(':').pop()?.trim() || line;
        } else if (line.includes('detail') || line.includes('nt_detail')) {
          ntParams.nt_detail = line.split(':').pop()?.trim() || line;
        } else {
          const num = parseNumber(line);
          if (num > 0) numericData.push(num);
        }
      }

      if (!ntParams.nt_source) return null;

      return {
        ...ntParams,
        visits: numericData[0] || 0,
        orders: numericData[1] || 0,
        revenue: numericData[2] || 0,
        conversionRate: numericData[3] || 0
      };
    } catch (error) {
      return null;
    }
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
