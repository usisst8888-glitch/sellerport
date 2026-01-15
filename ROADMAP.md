# 셀러포트 (SellerPort) 개발 로드맵

> **마지막 업데이트:** 2025-12-29 (브릿지샵 제거, Instagram DM 가이드 추가)

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 셀러포트 (SellerPort) |
| 도메인 | sellerport.app |
| 사업자 | 어시스트 솔루션 (602-27-04681) |
| 서비스 설명 | 모든 온라인 비즈니스를 위한 광고 성과 분석 플랫폼 (광고 전환 추적 + 마진/세금 계산 + 썸네일 마켓플레이스) |
| 타겟 고객 | 이커머스 쇼핑몰, 서비스 사이트, 자체 제작 웹사이트 운영자 |

## 핵심 가치

```
광고 집행 → 전환 추적 → 주문 수집 → 수수료 계산 → 마진 계산 → 세금 계산 → 실제 순수익
```

| 광고플랫폼 | 스마트스토어 | 아임웹 | 카페24 |
|------------|:------------:|:------:|:------:|
| **메타** | 셀러포트 링크 | 메타 픽셀(자동) | 메타 픽셀(자동) |
| **브랜드 블로그** | 셀러포트 링크 | 셀러포트 링크 | 셀러포트 링크 |
| **브랜드 인스타그램** | 셀러포트 링크 | 셀러포트 링크 | 셀러포트 링크 |
| **브랜드 유튜브** | 셀러포트 링크 | 셀러포트 링크 | 셀러포트 링크 |
| **인플루언서/체험단 협찬** | 셀러포트 링크 | 셀러포트 링크 | 셀러포트 링크 |

## 범례

- **셀러포트 링크** = 셀러포트 추적 링크 사용 (`sp-trk.link/go/TL-xxx`)
- **(자동)** = 셀러포트가 API로 스크립트 자동 설치

> **향후 계획:** 셀러포트 자체 랜딩페이지 빌더 추가 예정
> → 회원가입/DB수집 전환도 셀러포트 안에서 모두 해결 가능!

---

## 🚀 핵심 기술 차별점: 클릭ID 기반 1:1 구매자 매칭

### 기존 솔루션의 한계 (킵그로우 등)

```
광고 클릭 → 픽셀샵 → 스마트스토어 → 구매 발생
                              ↓
                    "이 광고에서 전환 1건" (집계만)
                    → 누가 샀는지 알 수 없음
                    → 개별 클릭과 구매 연결 불가
```

**기존 솔루션이 제공하는 것:**
- 광고 소재별 전환 수 집계
- 메타로 전환 데이터 전송 (광고 최적화용)
- ROAS 계산

**기존 솔루션이 못하는 것:**
- ❌ 개별 클릭 → 개별 구매 1:1 매칭
- ❌ "누가 샀는지" 구매자 식별
- ❌ 동일 광고 여러 클릭 중 정확히 어떤 클릭이 구매로 이어졌는지 특정

### 셀러포트의 독보적 기술

```
광고 클릭 → 픽셀샵 도착
              ↓
         [1] 고유 click_id 생성 (clk_xyz789)
         [2] DB 저장: { click_id, slot_id, timestamp, _fbp, ip, user_agent }
         [3] 스마트스토어 이동 시 NT 파라미터에 click_id 포함
              ↓
스마트스토어 URL: smartstore.naver.com/store/products/123?nt=clk_xyz789
              ↓
구매 발생 → 크롬 확장이 주문 수집 (NT 파라미터 포함)
              ↓
NT에서 click_id 추출 → 픽셀샵 DB 조회
              ↓
         ✅ 정확히 그 클릭 세션 특정
         ✅ "이 사람이 이 광고 보고 샀다" (1:1 매칭)
```

### 기술 비교표

| 기능 | 킵그로우 | 셀러포트 |
|------|:--------:|:--------:|
| 광고별 전환 집계 | ✅ | ✅ |
| 메타 전환 데이터 전송 | ✅ | ✅ |
| ROAS 계산 | ✅ | ✅ |
| **개별 클릭 ID 생성** | ❌ | ✅ |
| **클릭 → 구매 1:1 매칭** | ❌ | ✅ |
| **구매자 식별** | ❌ | ✅ |
| **클릭 세션 정보 (IP, UA, 시간)** | ❌ | ✅ |

### 이 기술로 가능한 것

1. **정확한 어트리뷰션**: 같은 광고 100명 클릭 → 각각 다른 click_id → 누가 샀는지 정확히 특정
2. **고객 여정 추적**: 클릭 시간 → 구매 시간 → 전환까지 소요 시간 분석
3. **리마케팅 데이터**: 클릭했지만 구매 안 한 사람 식별 가능
4. **CRM 연동 가능성**: 구매자 정보 + 광고 소스 결합 → 고객 세그먼트 분석

> **결론:** 시장에서 유일하게 스마트스토어 + 메타 광고 조합에서 **개별 클릭-구매 1:1 매칭**이 가능한 솔루션

---

### 핵심 데이터 연동 구조

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           셀러포트 데이터 흐름                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [1] 캠페인 생성 (전환 추적)                                               │
│      └── 추적 링크 생성 (source, medium, campaign)                        │
│          └── 상품 연결 (product_id)                                      │
│              └── 광고비 입력/연동 (ad_spend)                              │
│                                                                         │
│  [2] 고객 유입                                                           │
│      └── 추적 링크 클릭 → 리다이렉트/자체사이트 → 전환 추적                   │
│          └── _fbp 쿠키 저장 (Meta 전환 추적용)                             │
│          └── 클릭 ID 저장 (Google/Naver 추적용)                           │
│                                                                         │
│  [3] 주문 발생                                                           │
│      └── A) 네이버/쿠팡: Commerce API로 주문 + 정산 데이터 수집              │
│      └── B) 자체 사이트: 추적 코드로 전환 이벤트 수신                        │
│          └── 어떤 캠페인에서 온 주문인지 매칭                               │
│              └── 캠페인별 매출 집계                                        │
│                                                                         │
│  [4] ROAS 계산 + 신호등                                                  │
│      └── ROAS = (캠페인 매출 / 캠페인 광고비) × 100                        │
│          └── 🟢 300%+ / 🟡 150-300% / 🔴 150% 미만                       │
│              └── 빨간불 시 카톡 알림 발송                                  │
│                                                                         │
│  [5] 대시보드 표시                                                        │
│      └── 캠페인별 ROAS + 신호등                                          │
│      └── 상품별 실제 순이익                                               │
│      └── 전체 통계 (매출, 마진율, ROAS)                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 추적 링크 시스템

#### 추적 링크 도메인

**전용 트래킹 도메인:** `sp-trk.link`

모든 추적 링크는 통일된 짧은 URL 형식을 사용합니다:
```
https://sp-trk.link/go/TL-XXXXXXXX
```

#### 추적 링크 흐름

```
1. 셀러포트에서 추적 링크 생성 (TL-XXXXXXXX)
2. 광고/SNS/인플루언서가 sp-trk.link/go/TL-xxx 링크 배포
3. 클릭 시 → 클릭 로그 저장 + 쿠키 설정
4. 목적지 URL(스마트스토어/자체몰)로 리다이렉트
5. 구매 발생 → 네이버 API로 주문 수집 → 클릭과 매칭
```

#### 왜 브릿지샵이 필요 없는가?

기존에는 스마트스토어에 픽셀 설치가 불가능해서 중간 페이지(브릿지샵)가 필요했지만,
네이버 Commerce API 연동으로 주문 데이터를 직접 수집할 수 있게 되어 브릿지샵이 불필요해졌습니다.

- **클릭 추적**: `/go/TL-xxx` 리다이렉트에서 처리
- **전환 추적**: 네이버 스마트스토어 API로 주문 데이터 직접 수집

#### 자체몰 연동

자체몰은 직접 픽셀 설치 가능 → 중간 페이지 필요 없음

**헤더에 삽입할 코드:**
```javascript
<script>
  // UTM에서 슬롯 ID 추출 → 쿠키 저장 (30일)
  const params = new URLSearchParams(window.location.search);
  const slotId = params.get('utm_campaign')?.replace('slot_', '');
  if(slotId) document.cookie = `sp_slot=${slotId};max-age=2592000;path=/`;
</script>
```

**구매완료 페이지에 삽입할 코드:**
```javascript
<script>
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }
  
  sellerport('track', 'Purchase', {
    slot_id: getCookie('sp_slot'),
    value: 50000, // 주문 금액
    order_id: 'ORDER_123' // 주문 번호
  });
</script>
```

**광고 URL 형식:**
```
myshop.com/product?utm_campaign=slot_abc123
→ 직접 랜딩 (중간 페이지 없음)
→ 메타 정책 완전 준수
```

#### 전환 추적 흐름 요약

**스마트스토어 + 메타 광고 (업계 유일 100% 전환 추적):**

```
┌─────────────────────────────────────────────────────────────────────────┐
│            스마트스토어 메타 광고 전환 추적 플로우 (NT 파라미터)            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [1] 셀러포트에서 소재별 추적 링크 생성                                    │
│      └── NT 파라미터 자동 포함                                           │
│          예: nt_source=meta&nt_medium=ad&nt_detail=소재A                 │
│                                                                         │
│  [2] 메타 광고 클릭                                                      │
│      ↓                                                                  │
│  [3] 셀러포트 픽셀샵 (중간 페이지)                                        │
│      └── 메타 픽셀 발동 (PageView, ViewContent)                          │
│      └── _fbp, _fbc 쿠키 저장                                           │
│      └── 리타겟팅 모수 확보 ✅                                           │
│      ↓                                                                  │
│  [4] 스마트스토어로 리다이렉트 (NT 파라미터 포함)                          │
│      └── smartstore.naver.com/store/products/123                        │
│          ?nt_source=meta&nt_medium=ad&nt_detail=소재A                   │
│      ↓                                                                  │
│  [5] 고객 구매                                                           │
│      └── 네이버가 NT 파라미터별로 전환 데이터 자동 기록                     │
│      ↓                                                                  │
│  [6] 셀러가 판매자센터에서 크롬 확장 버튼 클릭                             │
│      └── 판매자센터 → 통계 → 마케팅분석 → 사용자정의채널                   │
│      └── 네이버 통계 데이터 수집                                          │
│      ↓                                                                  │
│  [7] 셀러포트 서버                                                       │
│      └── 소재별(nt_detail) 자동 매칭                                     │
│      └── Meta Conversion API로 전환 데이터 전송                          │
│      ↓                                                                  │
│  [8] 결과                                                                │
│      └── 메타 머신러닝 최적화 ✅                                          │
│      └── 셀러포트 대시보드에서 소재별 성과 확인 ✅                          │
│      └── ROAS 신호등 자동 계산 ✅                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**NT 파라미터란?**
- 네이버 스마트스토어 전용 추적 파라미터 (UTM과 동일 개념)
- `nt_source`: 유입 채널 (필수, 영문)
- `nt_medium`: 채널 종류 (필수, 영문)
- `nt_detail`: 세부 구분 (선택, 한/영) → **소재 ID 저장**
- `nt_keyword`: 키워드 (선택, 한/영)

**경쟁 우위:**
| 항목 | 경쟁사 | 셀러포트 |
|------|--------|----------|
| 스마트스토어 메타 픽셀 | ❌ 불가능 | ✅ 픽셀샵으로 해결 |
| 소재별 전환 추적 | ❌ 불가능 | ✅ NT 파라미터 활용 |
| 메타 Conversion API | ❌ 전환 데이터 없음 | ✅ 크롬 확장으로 수집 후 전송 |
| 메타 머신러닝 최적화 | ❌ 학습 불가 | ✅ 정확한 전환 신호 |

> **업계 유일:** 스마트스토어에서 메타 광고 소재별 전환 추적 가능

**자체몰:**
```
광고 클릭 → 자체몰 (UTM → 쿠키: sp_slot=abc123)
→ 구매 → 구매완료 페이지의 픽셀 코드가 전환 전송
→ 셀러포트 서버 수신
→ 슬롯별 매출/ROAS 집계
```

### 핵심 테이블 관계

```
tracking_links (추적 링크 - 광고 전환 추적을 위한 UTM 링크)
├── id, user_id
├── product_id → products.id
├── utm_source, utm_medium, utm_campaign
├── ad_spend (광고비)
├── clicks (클릭 수)
├── conversions (전환 수)
└── revenue (매출)

tracking_link_clicks (추적 링크 클릭 로그)
├── id, tracking_link_id
├── click_id, fbp, fbc
├── user_agent, referer, ip_address
├── is_converted, converted_at
└── created_at

ad_channels (광고 채널 - 독립 관리)
├── id, user_id
├── channel_type (meta, naver_blog, youtube, tiktok, instagram, influencer 등)
├── channel_name (사용자 지정 이름)
├── access_token, refresh_token, token_expires_at
├── account_id, account_name
├── status, last_sync_at
├── is_manual (수동 채널 여부)
└── created_at, updated_at

ad_spend_daily (일별 광고비 - 캠페인/키워드/광고소재 레벨)
├── id, ad_channel_id, user_id
├── campaign_id, campaign_name
├── adset_id, adgroup_id, keyword_id, ad_id
├── date, spend, impressions, clicks, conversions, conversion_value
└── raw_data

products (상품 목록 - 연동된 플랫폼의 상품 정보)
├── id, user_id
├── platform_type (naver, coupang, cafe24, custom...)
├── price (판매가)
├── cost (원가)
└── shipping_cost (배송비)

orders (주문 내역 - 네이버/쿠팡 등 플랫폼 주문 동기화)
├── id, user_id
├── tracking_link_id → tracking_links.id (어떤 추적 링크에서 온 주문인지)
├── campaign_id → campaigns.id
├── product_id → products.id
├── order_amount (주문금액)
├── settlement_amount (정산금액 - API 연동 플랫폼용)
├── platform_fee (플랫폼 수수료 - 정산 API에서 자동 계산)
├── shipping_cost (배송비)
└── profit (순이익 - 자동 계산)

conversions (전환 기록 - 추적 링크를 통한 구매 전환 내역)
├── id, tracking_link_id
├── click_id, fbp, fbc
├── order_id → orders.id
└── converted_at

influencer_stats (인플루언서 효율 DB)
├── id
├── channel_url (인플루언서 채널 URL)
├── channel_name (채널명)
├── platform (youtube, instagram, blog, tiktok...)
├── category (뷰티, 패션, 식품, 육아...)
├── total_campaigns (총 캠페인 수)
├── total_revenue (총 매출)
├── total_conversions (총 전환 수)
├── avg_roas (평균 ROAS)
├── avg_conversion_rate (평균 전환율)
└── last_updated_at

instagram_accounts (Instagram 계정 - 독립 관리)
├── id, user_id
├── instagram_user_id (Instagram 사용자 ID)
├── instagram_username (Instagram 사용자명 @username)
├── instagram_name (Instagram 표시 이름)
├── profile_picture_url (프로필 사진 URL)
├── facebook_page_id, facebook_page_name (FB 페이지 연결 정보)
├── access_token (Instagram Graph API 토큰)
├── token_expires_at (토큰 만료일, 장기 토큰 60일)
├── status (connected, disconnected, token_expired, error)
├── followers_count, media_count (계정 통계)
└── created_at, updated_at

instagram_dm_settings (Instagram DM 자동발송 설정)
├── id, user_id
├── instagram_account_id → instagram_accounts.id (Instagram 계정)
├── tracking_link_id → tracking_links.id (추적 링크)
├── instagram_media_id (게시물 ID)
├── instagram_media_url, instagram_media_type, instagram_caption
├── trigger_keywords (DM 발송 트리거 키워드 배열)
├── dm_message (DM 메시지 템플릿, {{link}} 플레이스홀더)
├── include_follow_cta, follow_cta_message (팔로우 유도 메시지)
├── is_active (활성화 상태)
├── total_dms_sent, last_dm_sent_at (통계)
└── created_at, updated_at

instagram_dm_logs (Instagram DM 발송 로그)
├── id, dm_setting_id
├── tracking_link_id
├── recipient_ig_user_id, recipient_username (수신자 정보)
├── comment_id, comment_text (트리거 댓글)
├── dm_message, dm_message_id
├── status (sent, failed, blocked)
├── sent_at
└── is_converted, converted_at, order_id (전환 추적)
```

### 광고 효율 신호등 시스템
| 신호 | 조건 | 알림 |
|------|------|------|
| 🟢 초록불 | ROAS 300% 이상 | "이 광고 효율 좋아요! 예산 늘려보세요" |
| 🟡 노란불 | ROAS 150-300% | "보통이에요. 소재나 타겟 점검 필요" |
| 🔴 빨간불 | ROAS 150% 미만 | "효율 낮아요! 중단 또는 수정 권장" |

**킵그로우와의 차별점:**
- 킵그로우: 메타 전환 추적만 (유료 29,900원 + 네이버 수수료 할인)
- 셀러포트: 모든 광고 채널 전환 추적 + 마진/세금 계산 + 인플루언서 DB (월 30,000원~)

## 수익 모델

### 1. 전환 추적 플랫폼 (구독 티어)

| 티어 | 가격 | 내용 | 알림톡 기본 제공 |
|------|------|------|-----------------|
| **무료** | 0원 | 추적 링크 5개, 기본 전환 추적, 마진/세금 계산기, 디자이너 연결 | 0건 |
| **베이직** | 월 55,000원 | 무제한 캠페인, 모든 채널 전환 추적, 신호등 시스템, 마진/세금 자동 계산, AI 최적화 추천 | 300건 |
| **프로** | 월 110,000원 | 베이직 전체 + 인플루언서 자동 매칭, 채널 URL 전체 공개, 우선 고객 지원, 상세 리포트 | 1,000건 |

> 알림톡 초과 시: 15원/건 (모든 티어 동일)
> 디자인 서비스 수수료: 15% (디자이너 부담, 정산 시 차감)
> VAT 별도

### 리셀러 파트너 프로그램

화이트라벨 방식으로 셀러포트 플랫폼을 자체 브랜드로 운영할 수 있는 파트너십 프로그램

| 항목 | 내용 |
|------|------|
| **계약금** | 3,000만원 |
| **구독료** | 정가의 20% (도매가) |
| **제공 내용** | 동일 플랫폼 화이트라벨, 자체 브랜드 운영, 파트너 전용 대시보드, 수익 정산 시스템, 기술 지원 |
| **대상** | 마케팅 에이전시, 이커머스 컨설팅, 교육 플랫폼 등 |

> 리셀러 파트너는 자체 고객에게 무료/베이직/프로 플랜을 직접 판매하고, 셀러포트에는 도매가(20%)만 정산

## 기본 기능

```
✅ 전환 추적 (슬롯 = 추적링크 1개)
✅ 대시보드 (전환율, ROAS)
✅ 🟢🟡🔴 광고 효율 신호등 (실시간)
✅ 마진 자동 계산 (원가, 수수료, 광고비 → 순이익)
✅ 세금 계산 (부가세, 종소세)
✅ 카톡 주문 알림
✅ 🔴 빨간불 알림 (저효율 광고 즉시 알림)
✅ AI 최적화 추천 (타겟/소재/예산 조정 제안)
✅ 추적 링크 생성
✅ 채널별 성과 리포트
✅ 멀티 스토어 통합 관리
```

## 개발 환경

| 구분 | 기술 | 용도 |
|------|------|------|
| Frontend | Next.js 20 (App Router) | 웹 애플리케이션 |
| Backend | Next.js API Routes | API 서버 |
| Database | Supabase (PostgreSQL) | 데이터 저장 |
| Auth | Supabase Auth | 회원 인증 |
| Hosting | Vercel | 배포 및 호스팅 |
| Storage | Supabase Storage | 파일 저장 |
| 버전관리 | GitHub | 소스코드 관리 |
| 결제 | 토스페이먼츠 | 채널 추가 결제 |
| 알림톡 | 알리고 API | 카카오 알림톡 발송 |
| 추적 링크 | `sp-trk.link` (Cloudflare) | 짧은 추적 링크 도메인 |

---

## 현재 개발 현황

### 완료된 UI/프론트엔드

| 페이지 | 상태 | 설명 |
|--------|------|------|
| 랜딩페이지 (`/`) | ✅ 완료 | 다크 테마, 서비스 소개, 플랫폼 로고 |
| 로그인/회원가입 | ✅ 완료 | Supabase Auth 연동 |
| 대시보드 (`/dashboard`) | ✅ 완료 | 캠페인별 신호등 시스템, 전체 통계 |
| 상품 관리 (`/products`) | ✅ 완료 | 캠페인별 ROAS/신호등, 광고 생성/수정/일시중지/중단 |
| 전환 추적 (`/conversions`) | ✅ 완료 | 추적 링크 생성, 슬롯 관리 UI |
| 수익 계산 (`/profit`) | ✅ 완료 | 마진 계산기 UI |
| 알림 관리 (`/alerts`) | ✅ 완료 | 빨간불/노란불 알림 내역, 알림 설정 |
| 내 쇼핑몰 (`/my-shoppingmall`) | ✅ 완료 | 쇼핑몰 등록 (스마트스토어, 카페24, 아임웹) |
| 광고 채널 (`/ad-channels`) | ✅ 완료 | 광고 채널 등록 (Meta, 네이버블로그, TikTok, YouTube 등) |
| 디자이너 연결 (`/designers`) | ✅ 완료 | 디자이너 목록, 문의 모달 |
| 결제 관리 (`/billing`) | ✅ 완료 | 구독 관리, 알림 충전 (15원/건) |
| 설정 (`/settings`) | ✅ 완료 | 프로필 설정 (알리고 API 설정 제거됨) |
| 사용 가이드 (`/guide`) | ✅ 완료 | 추적 링크 사용법, 대시보드 이해하기, FAQ |
| 인스타그램 DM (`/instagram-dm`) | ✅ 완료 | Instagram 계정 연결, DM 자동발송 설정, 게시물 선택 |
| 셀러트리 (`/seller-tree`) | ✅ 완료 | 검색 랜딩페이지 커스터마이징, YouTube/TikTok 스토어 관리 |

### 사이드바/네비게이션

| 항목 | 상태 |
|------|------|
| 데스크톱 사이드바 | ✅ 완료 |
| 모바일 사이드바 | ✅ 완료 |
| 신규 메뉴 구조 적용 | ✅ 완료 |

### 핵심 기능 구현 현황

| 기능 | UI | 백엔드 |
|------|-----|--------|
| 캠페인별 신호등 시스템 | ✅ | ✅ 완료 |
| 광고 캠페인 생성/수정/일시중지/중단 | ✅ | ✅ 완료 |
| 상품별 광고 캠페인 목록 | ✅ | ✅ 완료 |
| 추적 링크 생성 | ✅ | ✅ 완료 |
| 마진 계산기 | ✅ | ✅ 완료 |
| 구독 결제 (월 30,000원~) | ✅ | ✅ 완료 |
| 알림 결제 (15원/건) | ✅ | ✅ 완료 |
| 네이버 API 연동 | ✅ | ✅ 완료 |
| 빨간불/노란불 알림 | ✅ | ✅ 완료 |
| 디자이너 마켓플레이스 | ✅ | ✅ 완료 |

### 백엔드 연동 현황

| 항목 | 상태 | 경로/설명 |
|------|------|-----------|
| Supabase 마이그레이션 | ✅ 완료 | `supabase/migrations/001~020_*.sql` |
| 네이버 Commerce API | ✅ 완료 | `/api/naver/verify`, `/api/naver/sync`, `/api/naver/stats` (정산 API 포함, bcrypt 인증 방식) |
| 추적 링크 API | ✅ 완료 | `/api/tracking-links`, `/api/tracking-links/[id]`, `/t/[slotId]`, `/go/[slotId]` |
| 추적 링크 (Go URL) | ✅ 완료 | `sp-trk.link/go/TL-xxx` (전용 도메인) |
| Meta CAPI 연동 | ✅ 완료 | `/api/meta/track`, `/api/conversions/purchase`, `lib/meta/conversions-api.ts` |
| 알리고 알림톡 | ✅ 완료 | `/api/alerts/send`, `/api/cron/daily-report`, `lib/aligo/alimtalk-api.ts` (시스템 환경변수 사용) |
| 자체 사이트 추적 코드 | ✅ 완료 | `/platforms` 페이지에서 추적 코드 제공, `/tracking.js` |
| 토스페이먼츠 결제 | ✅ 완료 | `/api/payments/confirm`, `/api/payments/cancel`, `lib/tosspayments/client.ts` |
| 잔액 조회 | ✅ 완료 | `/api/balance` |
| 대시보드 통계 API | ✅ 완료 | `/api/dashboard/stats` |
| 수익 통계 API (정산 기반) | ✅ 완료 | `/api/profit/stats` (정산금액 우선, 없으면 예상 수수료 사용) |
| 상품 원가 등록 | ✅ 완료 | `/api/products/[id]` PATCH |
| ROAS 계산 크론잡 | ✅ 완료 | `/api/cron/calculate-roas` |
| AI 최적화 분석 | ✅ 완료 | `/api/cron/ai-analysis`, `/api/campaigns/[id]/analyze`, `lib/ai/optimization-tips.ts` |
| 디자이너 마켓플레이스 API | ✅ 완료 | `/api/designers`, `/api/designers/[id]`, `/api/design-requests` |
| Meta 광고 OAuth 연동 | ✅ 완료 | `/api/auth/meta`, `/api/auth/meta/callback`, `/api/ad-channels/meta/sync` (보안 검토 대기) |
| Instagram DM 자동발송 | ✅ 완료 | `/api/auth/instagram`, `/api/webhooks/instagram`, `/api/instagram/dm-settings`, `/api/instagram/media` |

---

## 최근 변경 사항 (2025-12-29)

### 브릿지샵 제거 및 추적 링크 단순화

모든 추적 링크가 통일된 `go_url` 형식만 사용하도록 단순화했습니다.

#### 변경 사항

| 이전 | 이후 |
|------|------|
| 자체몰/브릿지샵/go_url 3가지 분기 | **go_url만 사용** |
| `bridge_shop_url` 필드 저장 | 제거 |
| 복잡한 사이트 타입 체크 로직 | 제거 |

#### 이유

- 네이버 Commerce API 연동으로 주문 데이터 직접 수집 가능
- 클릭 추적은 `/go/TL-xxx` 리다이렉트에서 처리
- 브릿지샵(중간 페이지)이 불필요해짐

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/api/tracking-links/route.ts` | 브릿지샵 로직 제거, 모든 경우 go_url 사용 |

---

### Instagram DM 가이드 추가 및 UI 개선

#### 사용 가이드 탭 추가

| 파일 | 변경 내용 |
|------|----------|
| `/app/(protected)/guide/page.tsx` | `instagram-dm` 탭 추가, InstagramDmContent 컴포넌트 |
| `/app/(protected)/instagram-dm/page.tsx` | 서비스 이용 가이드 카드 추가 (`/guide?tab=instagram-dm` 링크) |

#### Instagram DM 페이지 UI 개선

- 카드 기반 드롭다운으로 계정 선택 UI 변경
- 연결 상태 표시 (초록색 점 + "연결됨" 텍스트)
- 썸네일 이미지 크기 조정 (정방형에 가깝게)
- "처음 이용하시나요?" 서비스 가이드 카드 추가

---

## 이전 변경 사항 (2025-12-28)

### 테이블 구조 독립화 및 페이지 분리

#### 메뉴 구조 변경

| 이전 | 이후 |
|------|------|
| 빠른시작 (사이트+광고채널 통합) | **내 쇼핑몰** + **광고 채널** 분리 |
| 광고 성과 관리 (연결 상태 카드 포함) | 광고 성과 관리 (성과만 표시) |

**현재 사이드바 메뉴 순서:**
1. 내 쇼핑몰 (`/my-shoppingmall`) - 쇼핑몰 등록
2. 광고 채널 (`/ad-channels`) - 광고 채널 등록
3. 셀러트리 (`/seller-tree`) - 영상번호 검색 랜딩
4. 인스타그램 자동 DM (`/instagram-dm`) - DM 자동발송
5. 광고 성과 관리 (`/conversions`) - 추적 링크 + 성과 분석

#### 불필요한 FK 컬럼 삭제 (마이그레이션 069)

각 테이블이 독립적으로 관리되도록 불필요한 연동 필드를 삭제했습니다.

| 테이블 | 삭제된 컬럼 | 이유 |
|--------|------------|------|
| `instagram_dm_settings` | `ad_channel_id` | `instagram_account_id`로 대체됨 |
| `ad_channels` | `my_site_id` | 광고채널은 내사이트와 독립 관리 |
| `store_customization` | `my_site_id` | 셀러트리는 내사이트와 독립 관리 |
| `instagram_accounts` | `my_site_id` | 인스타계정은 내사이트와 독립 관리 |

#### 페이지 변경

| 변경 | 파일 |
|------|------|
| 삭제 | `/app/(protected)/quick-start/page.tsx` |
| 신규 | `/app/(protected)/my-shoppingmall/page.tsx` |
| 신규 | `/app/(protected)/ad-channels/page.tsx` |
| 수정 | `/app/(protected)/conversions/page.tsx` - 연결 상태 카드 섹션 제거 |
| 수정 | `/components/layout/sidebar.tsx` - 메뉴 순서/뱃지 스타일 변경 |

---

## 이전 변경 사항 (2025-12-27)

### Instagram 계정 테이블 분리 및 셀러트리 기능 추가

#### Instagram 계정 독립 테이블 생성

Instagram 계정 정보를 `ad_channels` 테이블에서 분리하여 독립적인 `instagram_accounts` 테이블로 관리합니다.

| 기능 | 파일 | 설명 |
|------|------|------|
| DB 마이그레이션 | `065_instagram_accounts.sql` | instagram_accounts 테이블 생성, instagram_dm_settings FK 변경 |
| Instagram OAuth 수정 | `/api/auth/instagram/callback/route.ts` | instagram_accounts 테이블에 계정 정보 저장 (Instagram Login 방식) |
| DM 설정 API 수정 | `/api/instagram/dm-settings/route.ts` | instagram_accounts 테이블 조인으로 변경 |
| 미디어 API 수정 | `/api/instagram/media/route.ts` | instagramAccountId 파라미터로 계정 조회 |
| DM 모달 수정 | `/components/modals/instagram-dm-modal.tsx` | instagramAccountId 기반 미디어 조회 |
| Instagram DM 페이지 | `/app/(protected)/instagram-dm/page.tsx` | instagram_accounts 테이블에서 계정 조회, OAuth 버튼 직접 연결 |

#### 셀러트리 페이지 기능 추가

| 기능 | 파일 | 설명 |
|------|------|------|
| 새 셀러트리 만들기 모달 | `/app/(protected)/seller-tree/page.tsx` | 채널 타입 (YouTube/TikTok) 선택, 스토어 슬러그 입력, URL 미리보기 |

#### Instagram Login 방식으로 전환

기존 Facebook Login 방식에서 Instagram Login 방식으로 전환했습니다.

- **이전**: Facebook 페이지 → Instagram 비즈니스 계정 연결
- **이후**: Instagram 프로페셔널 계정으로 직접 인증 (Facebook 페이지 불필요)

```
Instagram Login 흐름:
1. Instagram OAuth 인증 (api.instagram.com)
2. Short-lived Token 발급
3. Long-lived Token으로 교환 (60일)
4. instagram_accounts 테이블에 저장
```

---

## 이전 변경 사항 (2025-12-20)

### Instagram DM 자동발송 기능 추가

Instagram 게시물에 특정 키워드가 포함된 댓글이 달리면, 해당 사용자에게 추적 링크가 포함된 DM을 자동 발송하는 기능을 구현했습니다.

#### 구현된 기능

| 기능 | 파일 | 설명 |
|------|------|------|
| Instagram OAuth | `/api/auth/instagram/route.ts` | Facebook Login을 통한 Instagram Graph API 접근 |
| OAuth 콜백 | `/api/auth/instagram/callback/route.ts` | Facebook 페이지 → Instagram 비즈니스 계정 연결, 페이지 액세스 토큰 저장 |
| Webhook 핸들러 | `/api/webhooks/instagram/route.ts` | Meta Webhook으로 댓글 이벤트 수신, 키워드 매칭 시 DM 자동 발송 |
| DM 설정 API | `/api/instagram/dm-settings/route.ts` | DM 설정 CRUD (게시물별 키워드, 메시지 템플릿) |
| 미디어 목록 API | `/api/instagram/media/route.ts` | 연결된 Instagram 계정의 게시물 목록 조회 |
| DB 마이그레이션 | `047_instagram_dm_settings.sql` | instagram_dm_settings, instagram_dm_logs 테이블 생성 |

#### 필요한 Meta 권한 (Facebook Login)

- `instagram_business_basic`: 비즈니스 프로필 정보
- `instagram_business_manage_messages`: DM 발송 (핵심!)
- `instagram_manage_comments`: 댓글 읽기/쓰기 (Webhook용)
- `instagram_content_publish`: 콘텐츠 게시
- `pages_show_list`: 연결된 Facebook 페이지 목록
- `pages_read_engagement`: 페이지 참여 데이터
- `business_management`: 비즈니스 관리

#### Meta Webhook 설정

```
콜백 URL: https://sellerport.app/api/webhooks/instagram
확인 토큰: INSTAGRAM_WEBHOOK_VERIFY_TOKEN 환경변수
구독 필드: comments, messages
```

#### DM 자동발송 흐름

```
1. 사용자가 Instagram 게시물에 키워드 댓글 작성
2. Meta Webhook → /api/webhooks/instagram으로 이벤트 전송
3. 해당 게시물의 DM 설정 조회 (instagram_dm_settings)
4. 키워드 매칭 확인 (trigger_keywords 배열)
5. 중복 발송 체크 (instagram_dm_logs)
6. Instagram Graph API로 DM 발송 (추적 링크 포함)
7. 발송 로그 저장, 통계 업데이트
```

#### 환경변수 추가

```
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=sellerport_webhook_2025
```

---

### 전환 추적 관리 페이지 개선

#### 연결 상태 카드 UI 개선

1. **3등분 레이아웃으로 변경**
   - 왼쪽: 사이트 로고 (smartstore, cafe24, imweb 등)
   - 가운데: 체인 링크 아이콘 (연결 상태 표시)
   - 오른쪽: 광고 채널 로고 (meta 등)

2. **실제 로고 이미지 사용**
   - `/public/site_logo/` - 사이트 로고
   - `/public/channel_logo/` - 광고 채널 로고

3. **동기화 버튼 위치 이동**
   - 광고 성과 섹션 헤더에서 연결 상태 카드 하단으로 이동
   - 버튼 텍스트: "동기화"로 단순화

#### 광고 성과 섹션 단순화

1. **키워드 관련 기능 제거**
   - 별도 키워드 테이블 (`ad_keyword_stats`) 삭제
   - 키워드 API (`/api/ad-channels/naver-search/keywords`) 삭제
   - 캠페인 확장 기능 제거 (키워드/광고소재 펼치기)

2. **`ad_spend_daily` 테이블 확장**
   - 키워드/광고소재 필드 추가: `adgroup_id`, `adgroup_name`, `keyword_id`, `keyword`, `ad_id`, `ad_name`, `avg_position`
   - 하나의 테이블에서 캠페인 → 키워드/광고소재 레벨까지 관리 가능

3. **광고 성과 UI 단순화**
   - 캠페인 테이블 단순화
   - Meta 광고 연동 중심

#### 연결 상태 카드 UI 단순화

광고 성과 관리 페이지에서 연결 상태 카드 UI 개선 (이후 2025-12-28에 별도 페이지로 분리됨)

---

## 이전 변경 사항 (2025-12-19)

### 빠른시작 5단계 온보딩 플로우 구현 중

FLOW.md 기반으로 5단계 온보딩 마법사를 구현 중입니다.

#### 완료된 부분

1. **STEP 1: 전환 목표 선택**
   - 쇼핑 전환, 회원가입 전환, 상담신청 전환, 전화연결 전환 4가지 선택

2. **STEP 2: 판매처/사이트 연동**
   - 연동된 사이트 목록 표시 및 선택 가능
   - 새 사이트 연동 옵션 (네이버, 카페24, 아임웹, 자체몰)
   - 회원가입/상담신청: 아임웹, 일반 웹사이트/블로그 옵션

3. **STEP 2.5: 사이트 연동 폼 (inline)**
   - 새 사이트 선택 시 페이지 내 inline으로 연동 폼 표시
   - 네이버 스마트스토어 API 키 입력 폼
   - 카페24 OAuth 연동
   - 아임웹 OAuth 연동
   - 자체몰 스크립트 설치 가이드

4. **STEP 3: 광고 채널 선택**
   - 추적 링크 생성 채널: META, 틱톡, 블로그, 인플루언서, 기타

5. **STEP 4: 추적 링크 생성**
   - 쇼핑 전환 시 상품 선택
   - 추적 링크 이름 입력 (utm_campaign으로 사용)

6. **STEP 5: 완료**
   - 생성된 추적 링크 표시 및 복사 기능
   - 대시보드 이동 / 추적 링크 더 만들기 옵션

#### 내일 작업 예정

- [ ] 빠른시작 페이지 테스트 및 버그 수정
- [ ] 전화 추적 연동 플로우 완성
- [ ] 사이트 연동 후 자동으로 다음 단계 이동 확인
- [ ] 쇼핑 전환 상품 선택 UI 개선

---

## 이전 변경 사항 (2025-12-18)

### 추적 링크 이름 필드 통합

추적 링크 생성 모달에서 중복되던 "추적 링크 이름" 필드를 하나로 통합했습니다.

#### 변경 사항

1. **DB 마이그레이션** (`042_remove_tracking_links_name.sql`)
   - `tracking_links` 테이블에서 `name` 컬럼 제거
   - `utm_campaign` 컬럼을 추적 링크 이름으로 사용

2. **API 수정**
   - `POST /api/tracking-links` - `name` 파라미터 제거
   - `PATCH /api/tracking-links/[id]` - `name` 대신 `utm_campaign` 업데이트

3. **프론트엔드 수정**
   - `TrackingLinkCreateModal` - 중복된 "추적 링크 이름" 입력 필드 하나로 통합
   - `conversions/page.tsx` - `link.name` → `link.utm_campaign`으로 변경
   - 인터페이스에서 `name` 속성 제거

---

## 이전 변경 사항 (2025-12-16)

### 광고 채널 관리 메뉴 제거

광고 채널 연동 페이지에서 연동된 채널을 확인할 수 있어 중복 기능인 광고 채널 관리 메뉴를 제거했습니다.

#### 삭제된 파일

| 파일 | 설명 |
|------|------|
| `/app/(protected)/ad-management/page.tsx` | 광고 채널 관리 페이지 (중복 기능으로 제거) |

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/components/layout/sidebar.tsx` | 광고 채널 관리 메뉴 항목 제거 |
| `/components/layout/mobile-sidebar.tsx` | 광고 채널 관리 메뉴 항목 제거 |

---

### 광고 채널 연동 모달 설명 추가

모든 광고 채널 연동 모달에 각 채널에서 어떤 기능을 제공하는지 설명을 추가했습니다.

#### 수정된 파일

| 파일 | 추가된 설명 |
|------|------------|
| `/components/ad-channels/tiktok-ads-connect-dialog.tsx` | TikTok 광고비 자동 수집, 전환/ROAS 추적, 캠페인 제어 |
| `/components/ad-channels/youtube-connect-dialog.tsx` | 채널 조회수/구독자 추적, 영상별 성과, 자연 유입 분석 |
| `/components/ad-channels/instagram-connect-dialog.tsx` | 팔로워/도달 추적, 게시물별 인게이지먼트, 자연 유입 분석 |
| `/components/ad-channels/tiktok-connect-dialog.tsx` | 팔로워/조회수 추적, 영상별 인게이지먼트, 자연 유입 분석 |
| `/components/ad-channels/threads-connect-dialog.tsx` | 팔로워/좋아요 추적, 게시물별 인게이지먼트, 자연 유입 분석 |
| `/components/ad-channels/naver-blog-connect-dialog.tsx` | 방문자 수 추적, 포스트별 조회수/댓글, 자연 유입 분석 |

---

### 회원가입 사용자 유형 추가

회원가입 시 선택할 수 있는 사용자 유형에 디자이너와 인플루언서를 추가했습니다.

#### 변경 사항

| 이전 | 이후 |
|------|------|
| 셀러/판매자, 광고 대행사 | 셀러/판매자, 광고 대행사, 디자이너, 인플루언서 |

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/(auth)/signup/page.tsx` | UserType에 'designer', 'influencer' 추가, 2x2 그리드로 4개 버튼 표시 |

---

### 대시보드 개선

#### 오늘 실시간 섹션에서 금액 표시 제거

오늘 실시간 섹션에서 "0건 0원" 형식의 금액 표시를 제거하고 건수만 표시하도록 변경했습니다.

#### 금액 표시 형식 변경

K/M 표기법(예: 60K)을 사용하지 않고 전체 숫자로 표시하도록 변경했습니다.

| 이전 | 이후 |
|------|------|
| 60K원 | 60,000원 |
| 1.2M원 | 1,200,000원 |

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/(protected)/dashboard/page.tsx` | formatCurrency 함수를 toLocaleString() 방식으로 변경, 오늘 실시간에서 금액 제거 |

---

## 변경 사항 (2025-12-15)

### 비밀번호 찾기/재설정 기능 추가

비밀번호를 잊어버린 사용자를 위한 비밀번호 재설정 기능을 추가했습니다.

#### 생성된 파일

| 파일 | 설명 |
|------|------|
| `/app/(auth)/forgot-password/page.tsx` | 비밀번호 찾기 페이지 - 이메일 입력 후 재설정 링크 발송 |
| `/app/(auth)/reset-password/page.tsx` | 비밀번호 재설정 페이지 - 이메일 링크 클릭 후 새 비밀번호 설정 |
| `/app/(protected)/change-password/page.tsx` | 비밀번호 변경 페이지 - 로그인 상태에서 비밀번호 변경 |
| `/app/auth/callback/route.ts` | Supabase 인증 콜백 라우트 |

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/(auth)/login/page.tsx` | 비밀번호 찾기 링크 추가 |
| `/app/(protected)/settings/page.tsx` | 계정 정보 섹션에 비밀번호 변경 링크 추가 (다른 항목과 통일된 디자인) |
| `/app/page.tsx` | 홈페이지에서 code 파라미터 감지 시 reset-password로 리다이렉트 |

#### 기능 상세

- **비밀번호 찾기**: 이메일 입력 → Supabase에서 재설정 링크 발송 → 이메일 링크 클릭 → 새 비밀번호 설정
- **비밀번호 변경**: 로그인 상태에서 현재 비밀번호 확인 후 새 비밀번호로 변경
- **PKCE 보안**: 비밀번호 재설정 링크는 같은 브라우저에서만 유효 (보안상 의도된 동작)
- **에러 메시지 한글화**: "New password should be different from the old password" → "새 비밀번호는 기존 비밀번호와 달라야 합니다"
- **비밀번호 보기/숨기기**: 새 비밀번호 입력 시 눈 아이콘으로 비밀번호 표시/숨기기 가능

#### Supabase 설정 필요

- **Redirect URLs 추가**: `https://sellerport.app/reset-password`, `http://localhost:3002/reset-password`
- **SMTP 설정**: Google Workspace SMTP 사용 (`admin@sellerport.app`)

---

### 회원가입 전화번호 중복 체크 추가

회원가입 시 이미 가입된 전화번호로 중복 가입을 방지하는 기능을 추가했습니다.

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/api/auth/send-code/route.ts` | 인증번호 발송 전 전화번호 중복 체크 추가 (테스트 번호 제외) |

---

### 추적 링크별 ROAS 기준 커스텀 기능

추적 링크별로 ROAS 신호등 기준을 개별 설정할 수 있는 기능을 추가했습니다.

#### DB 마이그레이션

| 파일 | 설명 |
|------|------|
| `028_tracking_links_roas_threshold.sql` | tracking_links 테이블에 target_roas_green, target_roas_yellow 컬럼 추가 |

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/(protected)/conversions/page.tsx` | 추적 링크 생성 시 ROAS 기준 설정 UI 추가, 수정 모달에 ROAS 기준 설정 추가, 광고 채널 선택 UI 개편 (API 연동 채널 / 수동 채널 분리) |
| `/app/api/tracking-links/route.ts` | targetRoasGreen, targetRoasYellow 파라미터 추가 |
| `/app/api/tracking-links/[id]/route.ts` | PATCH에서 ROAS 기준 업데이트 지원 |
| `/app/api/dashboard/stats/route.ts` | 추적 링크별 개별 ROAS 기준 적용하여 신호등 판정 |

#### 기능 상세

- **생성 시 설정**: 추적 링크 생성 모달에서 초록불/노란불 ROAS 기준(%) 직접 입력 가능
- **수정 가능**: 기존 추적 링크의 ROAS 기준도 수정 모달에서 변경 가능
- **개별 적용**: 대시보드 신호등이 각 추적 링크의 개별 기준으로 판정됨
- **기본값**: 설정하지 않으면 기존 기준 적용 (초록: 300%, 노란: 150%)
- **유효성 검사**: 초록불 기준이 노란불 기준보다 높아야 함

---

### 광고 채널 선택 UI 개편

추적 링크 생성 시 광고 채널 선택 방식을 개선했습니다.

#### 변경 내용

| 항목 | 이전 | 이후 |
|------|------|------|
| 사이트 선택 라벨 | "판매 사이트 선택" | "내 쇼핑몰 선택" |
| 트래픽 출처 선택 | 고정 목록 (메타 등) | 광고 채널 선택으로 대체 |
| 광고 유형 선택 | "paid" / "direct" 선택 | 제거됨 |
| 채널 선택 방식 | - | "API 연동 채널" / "수동 채널" 버튼 선택 후 드롭다운에서 등록된 채널 선택 |

#### 채널 분리 구현

- `apiChannels`: is_manual=false인 채널 (Meta 등 API 연동 채널)
- `manualChannels`: is_manual=true인 채널 (인플루언서, 체험단, 블로그 등 수동 채널)
- 각각 별도 드롭다운으로 사용자가 등록한 채널 목록 표시

---

### 광고 채널 연동 다이얼로그 컴포넌트 추가

광고 채널 연동 페이지(`/ad-channels`)에서 사용할 연동 다이얼로그 컴포넌트들을 추가했습니다.

#### 생성된 파일

| 파일 | 설명 |
|------|------|
| `/components/ad-channels/instagram-connect-dialog.tsx` | Instagram 연동 다이얼로그 |
| `/components/ad-channels/naver-blog-connect-dialog.tsx` | 네이버 블로그 연동 다이얼로그 |
| `/components/ad-channels/threads-connect-dialog.tsx` | Threads 연동 다이얼로그 |
| `/components/ad-channels/tiktok-ads-connect-dialog.tsx` | TikTok Ads 연동 다이얼로그 |
| `/components/ad-channels/tiktok-connect-dialog.tsx` | TikTok 계정 연동 다이얼로그 |
| `/components/ad-channels/youtube-connect-dialog.tsx` | YouTube 연동 다이얼로그 |

---

### 법적 페이지 추가

서비스 이용에 필요한 법적 문서 페이지들을 추가했습니다.

#### 생성된 파일

| 파일 | 설명 |
|------|------|
| `/app/(auth)/terms/page.tsx` | 이용약관 페이지 |
| `/app/(auth)/privacy/page.tsx` | 개인정보처리방침 페이지 |
| `/app/(auth)/marketing/page.tsx` | 마케팅 정보 수신 동의 페이지 |
| `/components/legal/legal-contents.tsx` | 법적 문서 내용 컴포넌트 (약관, 개인정보처리방침, 마케팅 동의 내용) |

---

### 회원가입 페이지 개선

회원가입 시 필수 약관 동의 및 마케팅 수신 동의 체크박스를 추가했습니다.

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/(auth)/signup/page.tsx` | 이용약관, 개인정보처리방침 동의 체크박스 추가, 마케팅 수신 동의 체크박스 추가 |
| `/app/(auth)/login/page.tsx` | 회원가입 링크 스타일 개선 |

---

### 랜딩페이지 개선

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/page.tsx` | UI 개선 및 레이아웃 조정 |

---

### 광고 채널 연동 페이지 대폭 개선

광고 채널 연동 페이지(`/ad-channels`)의 UI/UX를 대폭 개선했습니다.

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/(protected)/ad-channels/page.tsx` | 수동 채널 추가 기능, 탭 UI 개선, 채널 목록 표시 개선 (+1054줄 대규모 개선) |

---

### 사이드바 메뉴명 변경

| 이전 | 이후 |
|------|------|
| 광고채널별 관리 | 광고 채널 관리 |

#### 수정된 파일

- `/components/layout/sidebar.tsx`
- `/components/layout/mobile-sidebar.tsx`
- `/app/(protected)/ad-management/page.tsx`

---

### 파비콘 추가

사이드바 로고와 동일한 스타일의 파비콘을 추가했습니다.

#### 생성된 파일

| 파일 | 설명 |
|------|------|
| `/app/icon.tsx` | 32x32 파비콘 (브라우저 탭용) - 파란색 그라데이션 배경 + 흰색 "S" |
| `/app/apple-icon.tsx` | 180x180 Apple Touch Icon (모바일 홈 화면용) |

---

### platforms → my_shoppingmall 리네이밍

#### DB 마이그레이션

| 파일 | 설명 |
|------|------|
| `027_rename_platforms_to_my_shoppingmall.sql` | platforms → my_shoppingmall 테이블 리네이밍 |

#### 변경된 파일

- `/app/(protected)/platforms/page.tsx` → `/app/(protected)/my-shoppingmall/page.tsx`
- `/components/platforms/naver-connect-dialog.tsx` → `/components/my-shoppingmall/naver-connect-dialog.tsx`
- 다수 API 파일에서 테이블 참조 변경

---

### 기타 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/(protected)/dashboard/page.tsx` | 대시보드 UI 개선 |
| `/app/(protected)/guide/page.tsx` | 가이드 페이지 수정 |
| `/app/(protected)/payment/page.tsx` | 결제 페이지 수정 |
| `/app/(protected)/products/page.tsx` | 상품 페이지 수정 |
| `/app/(protected)/profit/page.tsx` | 수익 페이지 수정 |
| `/app/(protected)/settings/page.tsx` | 설정 페이지 수정 |
| `/app/bridge/shop/page.tsx` | 브릿지샵 페이지 수정 |
| `/app/api/bridge/tracking-link/route.ts` | API 수정 |
| `/app/api/conversions/track/route.ts` | API 수정 |
| `/app/api/cron/sync-orders/route.ts` | 크론잡 수정 |
| `/app/api/naver/*` | 네이버 API 전체 수정 (my_shoppingmall 테이블 참조) |
| `/app/api/orders/sync/route.ts` | 주문 동기화 API 수정 |
| `/app/api/products/*` | 상품 API 수정 |
| `/app/api/profit/stats/route.ts` | 수익 통계 API 수정 |
| `/lib/ai/optimization-tips.ts` | AI 최적화 팁 수정 |
| `/lib/supabase/middleware.ts` | 미들웨어 수정 |

---

## 변경 사항 (2025-12-17)

### 무료 요금제 조정

무료 요금제의 기능을 조정했습니다.

#### 변경 사항

| 항목 | 이전 | 이후 |
|------|------|------|
| 추적 링크 개수 | 5개 | 3개 |
| 디자이너 연결 | 포함 | 제외 |

#### 수정된 파일

- `/app/page.tsx` - 랜딩페이지 요금제 표 업데이트

---

### YouTube OAuth 연동 구현

YouTube 채널 자동 연동을 위한 Google OAuth 인증 흐름을 구현했습니다.

#### 구현된 기능

| 기능 | 파일 | 설명 |
|------|------|------|
| OAuth 시작 | `/api/auth/youtube/route.ts` | Google OAuth 인증 페이지로 리다이렉트 |
| OAuth 콜백 | `/api/auth/youtube/callback/route.ts` | 인증 코드 → 토큰 교환 → 채널 정보 조회 → DB 저장 |
| UI 연동 | `/components/ad-channels/youtube-connect-dialog.tsx` | OAuth 버튼 클릭 시 자동 연동 |

#### 수집되는 데이터

- 채널 ID, 채널명
- 구독자 수, 동영상 수, 조회수
- 채널 썸네일, 채널 URL
- Access Token, Refresh Token (자동 갱신용)

---

### 네이버 블로그 수동 등록 방식 변경

네이버 블로그는 API가 없어 채널 정보만 등록하는 수동 방식으로 변경했습니다.

#### 변경 사항

| 항목 | 이전 | 이후 |
|------|------|------|
| 연동 방식 | API 연동 시도 | 수동 등록 (채널 정보만) |
| 입력 필드 | 클라이언트 ID/Secret | 블로그 별칭, 블로그 ID |
| 기능 설명 | 방문자 추적, 조회수 분석 | "채널 등록 및 관리", "블로그 URL 연결" |
| 버튼 텍스트 | "연동하기" | "채널 추가" |

#### 수정된 파일

- `/components/ad-channels/naver-blog-connect-dialog.tsx` - 입력 필드 변경, 설명 텍스트 수정
- `/app/(protected)/ad-channels/page.tsx` - features 배열 업데이트

---

### 광고 채널 가이드 페이지 카테고리 재구성

광고 채널 연동 페이지와 동일한 카테고리 구조로 가이드 페이지를 재구성했습니다.

#### 변경 사항

| 이전 | 이후 |
|------|------|
| 유료 광고 채널 | 자체 채널 (인스타그램, 유튜브, 네이버 블로그) |
| 소셜/오가닉 채널 | 유료 광고 (Meta 등) |
| - | 기타 (인플루언서, 체험단) |

#### 수정된 파일

- `/app/(protected)/guide/page.tsx` - AdChannelsContent 섹션 전체 재구성

---

### 전환 추적 채널 선택 UI 단순화

새 추적 링크 발급 시 채널 선택을 하나의 드롭다운으로 통합했습니다.

#### 변경 사항

| 이전 | 이후 |
|------|------|
| "API 연동 채널" / "수동 채널" 버튼 선택 | 모든 채널 통합 드롭다운 |
| 선택에 따라 다른 드롭다운 표시 | 하나의 드롭다운에서 바로 선택 |
| apiChannels, manualChannels 분리 | allChannels 통합 |

#### 수정된 파일

- `/app/(protected)/conversions/page.tsx` - 채널 선택 UI 단순화, 채널 라벨 매핑 추가

---

### ModalFooter 컴포넌트 개선

모달 버튼 텍스트를 커스터마이징할 수 있도록 props를 추가했습니다.

#### 추가된 Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `submitText` | string | "연동하기" | 제출 버튼 텍스트 |
| `loadingText` | string | "연동 중..." | 로딩 중 텍스트 |

#### 수정된 파일

- `/components/ad-channels/common-modal.tsx` - ModalFooter props 추가

---

### 내 쇼핑몰 연동 페이지 라벨 수정

외부 마켓플레이스 뱃지 텍스트를 사용자 친화적으로 변경했습니다.

#### 변경 사항

| 이전 | 이후 |
|------|------|
| "브릿지샵 필요" | "브릿지샵 사용, 추적코드 설치 X" |

#### 수정된 파일

- `/app/(protected)/my-shoppingmall/page.tsx` - needsBridgeShop 뱃지 텍스트 변경

---

## 변경 사항 (2025-12-14)

### 용어 개선: "플랫폼 연동" → "내 쇼핑몰 연동"

사용자 친화적인 용어로 변경하여 쇼핑몰, 회원가입 사이트, DB 수집 사이트 등 다양한 유형을 포괄할 수 있도록 개선했습니다.

#### DB 마이그레이션

| 파일 | 설명 |
|------|------|
| `027_rename_platforms_to_my_shoppingmall.sql` | platforms → my_shoppingmall 테이블 리네이밍, 컬럼명 변경 (platform_type → site_type, platform_name → site_name) |

#### 변경된 파일/폴더

| 항목 | 이전 | 이후 |
|------|------|------|
| 페이지 경로 | `/platforms` | `/my-shoppingmall` |
| 컴포넌트 폴더 | `components/platforms/` | `components/my-shoppingmall/` |
| 사이드바 메뉴 | "플랫폼 연동" | "내 쇼핑몰" |
| DB 테이블 | `platforms` | `my_shoppingmall` |
| 컬럼명 | `platform_id`, `platform_type`, `platform_name` | `my_site_id`, `site_type`, `site_name` |

#### 수정된 API 파일

- `/api/naver/verify/route.ts` - platformId → siteId
- `/api/naver/sync/route.ts` - platforms → my_shoppingmall
- `/api/naver/stats/route.ts` - platformId → siteId
- `/api/naver/test/route.ts` - platforms → my_shoppingmall
- `/api/naver/orders/poll/route.ts` - platforms → sites
- `/api/dashboard/stats/route.ts` - platforms → my_shoppingmall
- `/api/products/route.ts` - platform_id → my_site_id
- `/api/orders/sync/route.ts` - platforms → sites
- `/api/cron/sync-orders/route.ts` - platforms → sites

---

## 변경 사항 (2025-12-13)

### 회원가입 개선 및 사전예약 시스템

#### 회원가입 변경 사항
- 이메일 인증 제거 (회원가입 후 바로 대시보드 이동)
- `display_name` 필드 추가 (사용자 표시 이름/닉네임)
- 전화번호 저장 문제 수정 (upsert 방식으로 변경)

#### 사전예약 팝업 시스템
- 정식 오픈일(2026-01-01) 전까지 비admin 사용자에게 사전예약 모달 표시
- 대시보드 접근 시 강제 팝업 → 확인 클릭 시 홈으로 이동
- admin 사용자는 모달 없이 대시보드 정상 이용 가능

#### 랜딩페이지 변경
- "847+ 셀러 이용중" → "사전예약" 텍스트 변경
- 로그인 상태에서 로그아웃 버튼 추가

#### 관리자 회원 관리 기능
- Admin 클라이언트 추가 (`createAdminClient`) - RLS 우회용 서비스 역할 키 사용
- 회원 관리 API에서 admin/manager가 전체 회원 조회 가능하도록 수정

#### DB 마이그레이션

| 파일 | 설명 |
|------|------|
| `022_add_display_name.sql` | profiles 테이블에 display_name 컬럼 추가 |
| `023_admin_view_all_profiles.sql` | Admin/Manager 프로필 조회 RLS 정책 (참고용, 실제로는 Admin Client로 우회) |

#### 수정된 파일

| 파일 | 변경 내용 |
|------|----------|
| `/app/(auth)/signup/page.tsx` | 이메일 인증 제거, display_name 입력 추가, upsert 방식으로 프로필 저장 |
| `/app/(protected)/dashboard/page.tsx` | 사전예약 모달 추가, 정식 오픈일 체크 로직 |
| `/app/page.tsx` | "사전예약" 텍스트, 로그아웃 버튼 추가 |
| `/lib/supabase/server.ts` | `createAdminClient()` 함수 추가 (서비스 역할 키 사용) |
| `/api/admin/users/route.ts` | Admin 클라이언트로 RLS 우회하여 전체 회원 조회 |

---

## 변경 사항 (2025-12-12)

### 용어 통일: "슬롯/캠페인" → "추적 링크"

모든 코드베이스와 DB에서 용어를 "추적 링크(tracking_links)"로 통일했습니다.

#### DB 마이그레이션 (019, 020)

| 파일 | 설명 |
|------|------|
| `019_rename_slots_to_tracking_links.sql` | slots → tracking_links, slot_clicks → tracking_link_clicks 테이블/컬럼명 변경 |
| `020_table_descriptions.sql` | 모든 테이블에 한글 설명(Description) 추가 |

#### 삭제된 파일

| 파일 | 설명 |
|------|------|
| `/api/slots/route.ts` | 삭제됨 → `/api/tracking-links/route.ts`로 대체 |
| `/api/slots/[id]/route.ts` | 삭제됨 → `/api/tracking-links/[id]/route.ts`로 대체 |

#### 새로 생성된 파일

| 파일 | 설명 |
|------|------|
| `/api/tracking-links/route.ts` | 추적 링크 목록 조회/생성 API |
| `/api/tracking-links/[id]/route.ts` | 추적 링크 상세 조회/수정/삭제 API |
| `supabase/migrations/019_rename_slots_to_tracking_links.sql` | DB 테이블명 변경 마이그레이션 |
| `supabase/migrations/020_table_descriptions.sql` | 테이블 설명 추가 마이그레이션 |

#### 수정된 파일 (DB 테이블 참조 변경)

| 파일 | 변경 내용 |
|------|----------|
| `/api/dashboard/stats/route.ts` | slots → tracking_links, 응답 키 변경 |
| `/api/profit/stats/route.ts` | SlotStats → TrackingLinkStats 인터페이스 변경 |
| `/api/conversions/purchase/route.ts` | slotId → trackingLinkId |
| `/api/conversions/track/route.ts` | sp_slot → sp_tracking_link 쿠키명 변경 |
| `/api/naver/orders/poll/route.ts` | trySlotMatching → tryTrackingLinkMatching |
| `/api/pixel/click/route.ts` | slots → tracking_links |
| `/api/pixel/product/route.ts` | slot → trackingLink 쿼리 파라미터 변경 |
| `/api/cron/sync-orders/route.ts` | slots → tracking_links |
| `/api/cron/daily-report/route.ts` | slot_clicks → tracking_link_clicks |
| `/api/cron/ai-analysis/route.ts` | slot_clicks → tracking_link_clicks |
| `/api/orders/sync/route.ts` | slots → tracking_links |
| `/api/meta/track/route.ts` | slotId → trackingLinkId |
| `/api/campaigns/[id]/analyze/route.ts` | slot_clicks → tracking_link_clicks |
| `/app/go/[slotId]/route.ts` | 내부 변수 slot → trackingLink, 쿠키명 변경 |
| `/app/t/[slotId]/route.ts` | 내부 변수 slot → trackingLink, 쿠키명 변경 |

#### 수정된 파일 (프론트엔드)

| 파일 | 변경 내용 |
|------|----------|
| `/app/(protected)/dashboard/page.tsx` | Slot → TrackingLink 인터페이스, slots → trackingLinks 상태 변수 |
| `/app/(protected)/profit/page.tsx` | slots → trackingLinks, UI 텍스트 "슬롯" → "추적 링크" |
| `/app/(protected)/conversions/page.tsx` | UI 텍스트 "슬롯" → "추적 링크" |

### 요금제 변경

| 변경 사항 | 이전 | 이후 |
|----------|------|------|
| 무료 플랜 추적 링크 제한 | 5개 | 3개 |

---

## 개발 로드맵

### Phase 1: MVP - 전환 추적 핵심 ✅ 완료

#### 1-1. 픽셀샵 시스템

| 작업 | 상세 | 상태 |
|------|------|------|
| 서브도메인 시스템 | pixel.sellerport.app, go.sellerport.app | ✅ 완료 |
| 정산 API 연동 | 네이버 정산 API로 실제 수수료/정산금액 자동 수집 | ✅ 완료 |
| 와일드카드 SSL | Cloudflare 무료 SSL | ✅ 완료 |
| 상품 미러링 페이지 | Commerce API → 픽셀샵 표시 | ✅ 완료 |
| Meta Pixel 삽입 | 모든 픽셀샵 페이지에 자동 삽입 | ✅ 완료 |
| 스마트스토어 리다이렉트 | 픽셀샵 → 스마트스토어 자동 이동 | ✅ 완료 |

#### 1-2. 스마트스토어 Commerce API 연동

| 작업 | 상세 | 상태 |
|------|------|------|
| 솔루션 애플리케이션 등록 | Commerce API Center | ✅ 완료 |
| OAuth 인증 | 셀러 스토어 연결 (API 키 + bcrypt 서명 방식) | ✅ 완료 (2024-12-11 검증 완료) |
| 주문 데이터 수집 | 주문 감지 폴링 시스템 | ✅ 완료 |
| 상품 데이터 동기화 | 상품 정보 실시간 동기화 | ✅ 완료 |

#### 1-3. Meta CAPI 연동

| 작업 | 상세 | 상태 |
|------|------|------|
| Meta Business 연동 | 사용자별 Pixel ID/Access Token 입력 | ✅ 완료 |
| CAPI 구매 이벤트 전송 | 주문 감지 → Purchase 이벤트 | ✅ 완료 |
| _fbp 쿠키 매칭 | 30일 어트리뷰션 윈도우 | ✅ 완료 |
| 이벤트 중복제거 | event_id 기반 deduplication | ✅ 완료 |

#### 1-4. 기본 대시보드 + 광고 효율 신호등

| 작업 | 상세 | 상태 |
|------|------|------|
| 전환율 차트 | 클릭 → 구매 전환율 | ✅ 완료 |
| ROAS 계산 | 광고비 대비 매출 | ✅ 완료 |
| 채널별 성과 | 유입 경로별 분석 | ✅ 완료 |
| 실시간 현황 | 오늘 주문/매출/전환 | ✅ 완료 |
| 🟢🟡🔴 신호등 시스템 | ROAS 기반 광고 효율 표시 | ✅ 완료 |
| 신호등 기준 | 🟢 300%+ / 🟡 150-300% / 🔴 150% 미만 | ✅ 완료 |
| 캠페인별 신호등 | 상품별이 아닌 캠페인별 ROAS 표시 | ✅ 완료 |

#### 1-5. 추적 링크 생성

| 작업 | 상세 | 상태 |
|------|------|------|
| 추적 링크 생성기 | 트래픽 출처, 매체, 캠페인별 | ✅ 완료 |
| 인플루언서별 링크 | 개별 추적 링크 발급 | ✅ 완료 |
| 링크 관리 페이지 | 생성된 링크 목록/복사 | ✅ 완료 |
| 링크별 성과 추적 | 추적 링크별 전환 집계 | ✅ 완료 |

---

### Phase 2: 수익 기능 ✅ 완료

#### 2-1. 마진/세금 계산

| 작업 | 상세 | 상태 |
|------|------|------|
| 원가 등록 | 상품별 원가 입력 | ✅ 완료 |
| 플랫폼 수수료 자동 계산 (예상치) | 스마트스토어 카테고리별 등 | ✅ 완료 |
| 정산 API 연동 (실제 금액) | 네이버/쿠팡 정산 API에서 실제 정산 금액 조회 | ✅ 완료 |
| 광고비 연동/수기입력 | API or 수동 입력 | ✅ 완료 |
| 순이익 자동 계산 | 정산금액 - 원가 - 배송비 - 광고비 | ✅ 완료 |
| 부가세 계산 | 분기별 예상 부가세 | ✅ 완료 |
| 종소세 계산 | 연간 예상 종합소득세 | ✅ 완료 |

#### 2-2. 카톡 알림 연동

| 작업 | 상세 | 상태 |
|------|------|------|
| 알리고 API 연동 | 알림톡 발송 | ✅ 완료 |
| 주문 알림 템플릿 | 유입경로, 상품, 금액, 마진 포함 | ✅ 완료 |
| 실시간 발송 | 주문 감지 즉시 알림 | ✅ 완료 |
| 일일 요약 알림 | 매일 밤 당일 성과 요약 | ✅ 완료 |
| 🔴 빨간불 알림 | 광고 효율 150% 미만 시 즉시 알림 | ✅ 완료 |
| 알림 관리 페이지 | 알림 내역, 알림 설정 토글 | ✅ 완료 |
| AI 최적화 추천 알림 | 타겟/소재/예산 조정 제안 포함 | ✅ 완료 |

#### 2-3. 결제 시스템

| 작업 | 상세 | 상태 |
|------|------|------|
| 토스페이먼츠 연동 | 구독 결제 | ✅ 완료 |
| 구독 결제 | 월 30,000원~ | ✅ 완료 |
| 알림 결제 | 15원/건 | ✅ 완료 |
| 결제 관리 페이지 | 충전 현황, 결제 내역 | ✅ 완료 |
| 구독 관리 | 티어별 구독 관리 | ✅ 완료 |
| 결제 모달 | 티어 선택, 결제 진행 | ✅ 완료 |

---

### Phase 3: 광고 채널 확장 + 인플루언서 DB

#### 3-0. 광고 채널 연동 페이지 (`/ad-channels`)

판매 플랫폼 연동(`/platforms`)과 별도로, 광고 채널 연동을 위한 전용 페이지가 필요합니다.

**연동할 광고 채널:**

| 채널 | 연동 방식 | 가져오는 데이터 | 상태 |
|------|----------|----------------|------|
| **Meta (Facebook/Instagram)** | Marketing API (OAuth) | 광고비, 캠페인 성과, 광고 on/off | ✅ 완료 (보안 검토 대기) |

**핵심 기능:**

1. **광고비 자동 수집** - 각 채널에서 일별/캠페인별 광고비 자동 동기화
2. **ROAS 자동 계산** - (매출 / 광고비) × 100 실시간 계산
3. **광고 자동 on/off** - ROAS 기준 미달 시 광고 일시중지 (사용자 설정 가능)
4. **통합 대시보드** - 모든 광고 채널 성과를 한 화면에서 확인

**DB 테이블 추가:**

```
ad_channels (광고 채널 연동 정보)
├── id, user_id
├── channel_type (meta)
├── channel_name (사용자 지정 이름)
├── access_token, refresh_token (OAuth 토큰)
├── account_id (광고 계정 ID)
├── status (connected, disconnected, error)
├── last_sync_at
└── metadata (추가 설정 정보)

ad_spend_daily (일별 광고비)
├── id, ad_channel_id
├── campaign_id, campaign_name
├── date
├── spend (광고비)
├── impressions, clicks, conversions
└── synced_at
```

#### 3-1. 판매 채널 확장

| 작업 | 상세 | 상태 |
|------|------|------|
| 카페24 API | 주문 데이터 수집 (OAuth 연동) | ✅ 완료 |
| 자체 제작 사이트 | 추적 코드 설치 방식 (워드프레스, Wix, Shopify 등) | ✅ 완료 |
| 쿠팡 Wing API | 주문 데이터 수집 | ⬜ |
| 아임웹 API | 주문 데이터 수집 | ⬜ |

#### 3-2. 정산 API 연동 (수수료 자동 반영) ✅ 완료

| 작업 | 상세 | 상태 |
|------|------|------|
| 네이버 정산 API 연동 | `/external/v1/settlements/product-orders` 정산 내역 조회 | ✅ 완료 |
| 쿠팡 정산 API 연동 | 정산 내역 조회 | ⬜ |
| 정산금액 기반 마진 계산 | 실제 정산 금액으로 순이익 계산 (수수료 수동 입력 불필요) | ✅ 완료 |
| 자체 사이트 수수료 설정 | PG 수수료 직접 입력 or 기본값 사용 | ✅ 완료 |

#### 3-6. 인플루언서 효율 DB (핵심 해자)

| 작업 | 상세 | 상태 |
|------|------|------|
| UTM source에서 채널 URL 추출 | `utm_source=@influencer_id` → 채널 URL 자동 저장 | ⬜ |
| influencer_stats 테이블 | channel_url, category, avg_roas, avg_conversion_rate, total_revenue | ⬜ |
| 인플루언서별 성과 집계 | 캠페인 데이터 → 인플루언서별 평균 ROAS/전환율 계산 | ⬜ |
| 카테고리 자동 분류 | 연결된 상품 카테고리 기반 인플루언서 카테고리 태깅 | ⬜ |
| 프로 티어 DB 접근 UI | 인플루언서 랭킹, 검색, 카테고리 필터 | ⬜ |
| 채널 URL 공개 설정 | 프로 티어만 채널 URL 노출, 베이직은 성과만 열람 | ⬜ |

---

### Phase 4: 디자인 마켓플레이스 + 마무리

#### 4-1. 디자이너 시스템

| 작업 | 상세 | 상태 |
|------|------|------|
| 디자이너 회원가입 | 셀러/디자이너 구분 | ✅ 완료 |
| 포트폴리오 등록 | 이미지 업로드, 카테고리 | ✅ 완료 |
| 가격 설정 | 디자이너별 가격 책정 | ✅ 완료 |
| 디자이너 프로필 | 소개, 작업 스타일, 리뷰 | ✅ 완료 |
| 디자이너 목록 페이지 | 디자이너 카드, 평점, 태그 필터 | ✅ 완료 |
| 디자이너 문의 모달 | 서비스 유형, 예산 선택 | ✅ 완료 |

#### 4-2. 셀러 의뢰 시스템

| 작업 | 상세 | 상태 |
|------|------|------|
| 디자이너 검색/필터 | 카테고리, 가격, 평점 | ✅ 완료 |
| 의뢰 요청 | 상품 정보, 요구사항 전달 | ✅ 완료 |
| 채팅 시스템 | 셀러-디자이너 소통 | ✅ 완료 |
| 결제 (에스크로) | 토스페이먼츠 에스크로 | ⬜ |

#### 4-3. 정산 시스템

| 작업 | 상세 | 상태 |
|------|------|------|
| 수수료 자동 계산 | 15% 플랫폼 수수료 | ⬜ |
| 디자이너 정산 | 주간/월간 정산 | ⬜ |
| 정산 내역 | 디자이너용 정산 대시보드 | ⬜ |

#### 4-4. QA + 런칭

| 작업 | 상세 | 상태 |
|------|------|------|
| 전체 기능 테스트 | 버그 수정 | ⬜ |
| 랜딩 페이지 | 서비스 소개 페이지 | ✅ 완료 |
| 런칭 | 셀러 카페 홍보 시작 | ⬜ |

---

## 전체 타임라인

| Phase | 핵심 목표 | 상태 |
|-------|-----------|------|
| Phase 1 | MVP (메타 전환 추적 + 대시보드 + 신호등 시스템) | ✅ 완료 |
| Phase 2 | 수익 기능 (마진/세금 계산 + 결제 + 빨간불 알림) | ✅ 완료 |
| Phase 3 | 광고 채널 확장 + 인플루언서 효율 DB | ⬜ 진행중 |
| Phase 4 | 디자인 마켓플레이스 + 런칭 | ⬜ 진행중 |

---

## 수익 시뮬레이션

### 구독 수익

| 베이직 (55,000원) | 프로 (110,000원) | 월 수익 |
|-------------------|------------------|---------|
| 500명 | 100명 | 3,850만원 |
| 1,000명 | 200명 | 7,700만원 |
| 2,000명 | 400명 | **1.54억원** |

### 디자인 마켓플레이스 수익

| 월 거래액 | 수수료 (15%) | 월 수익 |
|----------|-------------|---------|
| 500만원 | 15% | 75만원 |
| 1,000만원 | 15% | 150만원 |
| 2,000만원 | 15% | 300만원 |

---

## 마케팅 전략 (비용 0원)

| 채널 | 방법 |
|------|------|
| 네이버 카페 | 셀러 커뮤니티 (셀러킹덤, 셀러노트) 글 작성 |
| 오픈카톡 | 스마트스토어 셀러 오픈채팅방 진입 |
| 블로그 | "킵그로우 vs 셀러포트", "메타 전환 추적 무료" 등 |
| 유튜브 | 사용법 튜토리얼, 비교 영상 |
| 입소문 | 초기 유저 후기 요청 |

---

## 환경별 설정 체크리스트

### Supabase 설정
- [x] 프로젝트 생성
- [x] profiles 테이블 (사용자 프로필 - 회원 정보, 요금제, 약관/개인정보 동의)
- [x] my_shoppingmall 테이블 (내 쇼핑몰 - 네이버 스마트스토어, 자체몰, 서비스 사이트 등 연동)
- [x] orders 테이블 (주문 내역 - 네이버/쿠팡 등 플랫폼 주문 동기화)
- [x] products 테이블 (상품 목록 - 연동된 플랫폼의 상품 정보)
- [x] tracking_links 테이블 (추적 링크 - 광고 전환 추적을 위한 UTM 링크)
- [x] tracking_link_clicks 테이블 (추적 링크 클릭 로그 - 클릭 시점의 상세 정보 기록)
- [x] conversions 테이블 (전환 기록 - 추적 링크를 통한 구매 전환 내역)
- [x] campaigns 테이블 (광고 캠페인 - Meta/네이버 광고 캠페인 관리)
- [x] campaign_daily_stats 테이블 (캠페인 일별 통계 - 클릭, 전환, ROAS 등 일별 기록)
- [x] alerts 테이블 (사용자 알림 내역 - AI 분석, 주문 알림, 일일 리포트 등)
- [x] alert_settings 테이블 (사용자별 알림 설정 - 카카오 알림톡, 일일 리포트 등)
- [x] user_settings 테이블 (사용자 설정 - Meta 픽셀, API 키 등 연동 설정)
- [x] user_balance 테이블 (사용자 잔액 - 충전금 및 포인트 관리)
- [x] payments 테이블 (결제 내역 - 셀러포트 서비스 결제 기록)
- [x] phone_verifications 테이블 (전화번호 SMS 인증 - 회원가입 시 본인 인증)
- [x] designers 테이블 (디자이너 프로필 - 상세페이지 제작 디자이너 정보)
- [x] designer_portfolios 테이블 (디자이너 포트폴리오 - 작업 샘플 및 이미지)
- [x] designer_reviews 테이블 (디자이너 리뷰 - 고객 평점 및 후기)
- [x] design_requests 테이블 (디자인 의뢰 - 상세페이지 제작 요청 내역)
- [x] design_messages 테이블 (디자인 의뢰 메시지 - 의뢰자와 디자이너 간 채팅)
- [x] instagram_accounts 테이블 (Instagram 계정 연동 - DM 자동화용, ad_channels에서 분리)
- [x] instagram_dm_settings 테이블 (Instagram DM 자동발송 설정)
- [x] instagram_dm_logs 테이블 (Instagram DM 발송 로그)
- [x] store_customization 테이블 (셀러트리 커스터마이징 설정)
- [ ] influencer_stats 테이블 (인플루언서 효율 DB)
- [x] RLS 정책 설정
- [x] Auth 이메일 인증 설정

### Vercel 설정
- [x] GitHub 연동
- [x] 환경변수 설정
- [x] 도메인 연결 (sellerport.app)
- [x] 서브도메인 설정 (pixel.sellerport.app, go.sellerport.app)
- [x] Cron Jobs 설정 (주문 폴링, 알림 발송, ROAS 계산)

### Cloudflare 설정
- [ ] DNS 설정
- [ ] 와일드카드 SSL 인증서
- [ ] 서브도메인 라우팅

### 외부 서비스 설정
- [x] 네이버 Commerce API Center 등록 (솔루션 애플리케이션)
- [x] Meta CAPI 연동 (사용자별 Pixel ID/Token 입력)
- [x] Meta Marketing API 연동 (OAuth, 보안 검토 대기)
- [x] 알리고 API 키 발급 (사용자별 설정)
- [x] 토스페이먼츠 PG 계약

---

## 핵심 성공 지표

| 지표 | 목표 (3개월) | 목표 (6개월) | 목표 (1년) |
|------|-------------|--------------|------------|
| 가입자 수 | 500명 | 2,000명 | 5,000명 |
| 유료 구독자 | 100명 | 500명 | 2,000명 |
| 월 구독 수익 | 500만원 | 2,500만원 | 6,000만원 |
| 썸네일 월 거래액 | 200만원 | 1,000만원 | 3,000만원 |

---

## 향후 확장 (런칭 후)

- [ ] **셀러포트 랜딩페이지 빌더** - 회원가입/DB수집 전환을 셀러포트 내에서 완결
  - 드래그앤드롭 랜딩페이지 빌더
  - 폼 빌더 (회원가입, 상담신청, DB수집)
  - 셀러포트 전환 추적 자동 연동
  - 커스텀 도메인 연결 지원
- [ ] AI 인플루언서 매칭 추천 (효율 DB 기반 자동 추천)
- [ ] 네이버 솔루션 마켓 등록 → 마케팅링크 수수료 할인 협상
- [ ] 인플루언서 직접 연락 기능 (프로 티어)