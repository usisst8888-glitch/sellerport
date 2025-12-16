# 셀러포트 (SellerPort) 개발 로드맵

> **마지막 업데이트:** 2025-12-17

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

### 광고 채널 (유입) 구조

| 채널 | 뱃지 | 연동 방식 |
|------|------|----------|
| 인스타그램 피드/스토리/릴스 | 자체 채널 | 수동 / API |
| 유튜브 본편/쇼츠 | 자체 채널 | 수동 / API |
| 네이버 블로그 | 자체 채널 | 수동 |
| Meta Ads | 유료 광고 | API |
| Google Ads | 유료 광고 | API |
| 네이버 광고 | 유료 광고 | API |
| 기타 (인플루언서, 체험단 등) | 기타 | 수동 |

### 내 사이트 (전환) 구조

| 전환 목표 | 지원 플랫폼 |
|----------|------------|
| 쇼핑 추적 | 스마트스토어, 카페24, 아임웹, 고도몰, 메이크샵 |
| 회원가입 추적 | 아임웹 |
| DB 추적 | 아임웹 |

> **향후 계획:** 셀러포트 자체 랜딩페이지 빌더 추가 예정
> → 회원가입/DB수집 전환도 셀러포트 안에서 모두 해결 가능!

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
│      └── 추적 링크 클릭 → 픽셀샵/자체사이트 → 전환 추적                      │
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
│  [5] 마진 자동 계산 (주문별)                                               │
│      └── A) 연동 플랫폼: 정산 API에서 실제 정산 금액 조회 (수수료 자동 반영)   │
│      └── B) 자체 사이트: 원가, 수수료 직접 입력 or PG 수수료 자동 계산        │
│      └── 광고비 (캠페인에 연결된 광고비 ÷ 전환 수)                          │
│      └── 순이익 = 정산금액 - 원가 - 배송비 - 광고비                         │
│                                                                         │
│  [6] 대시보드 표시                                                        │
│      └── 캠페인별 ROAS + 신호등                                          │
│      └── 상품별 실제 순이익                                               │
│      └── 전체 통계 (매출, 마진율, ROAS)                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 픽셀샵 시스템 상세

#### 왜 픽셀샵이 필요한가?

```
스마트스토어 = 네이버 소유 → 메타/구글 픽셀 설치 불가
→ 전환 추적 불가능
→ 해결책: 중간 페이지(픽셀샵)에서 쿠키 심기
```

#### 킵그로우 방식 (검증된 우회)

**도메인:** `uc-kg.net`
**핵심:** 스마트스토어 디자인 완전 복제 + 메타 픽셀

```javascript
// 클릭 이벤트 - 어디 클릭해도 이동
onclick="showLoading.toStoreWithFbq(
  '//smartstore.naver.com/store/products/123',
  'detail', '123', '상품명', '가격'
)"
```

**특징:**
- cursor: pointer 없음 (전체 페이지가 클릭 영역)
- 사용자는 스마트스토어인 줄 착각
- 이질감 없음 → 이탈률 최소화
- 2년+ 운영, 메타 정책 위반 없음

#### 메타 광고 정책

| 차단됨 ❌ | 허용됨 ✅ |
|-----------|-----------|
| 빈 페이지 + 자동 redirect | 실제 콘텐츠 + 사용자 클릭 |
| 트래킹 코드만 있는 중간 페이지 | 상품 정보 표시하는 픽셀샵 |

#### 채널별 링크 타입

**스마트스토어 (픽셀 설치 불가) - 모든 채널 픽셀샵 필수**

| 채널 | 링크 타입 | 자동 redirect | 도메인 |
|------|----------|---------------|--------|
| 메타/구글 유료 광고 | 픽셀샵 (콘텐츠 표시) | ❌ 사용자 클릭 필요 | `pixel.sellerport.app/{store}/{product}?slot=xxx` |
| 블로그/SNS/인플루언서 | 빠른 리다이렉트 | ✅ 0.5초 자동 이동 | `go.sellerport.app/{slotId}` |

**광고용 픽셀샵 흐름:**
```
pixel.sellerport.app/{store}/{product}?slot=abc123
→ 상품 정보 표시 (이미지, 가격, 리뷰)
→ 메타 픽셀 설치 + 쿠키 저장
→ 사용자 클릭 → 스마트스토어 이동
```

**유기적 채널용 흐름:**
```
go.sellerport.app/abc123
→ 쿠키 심기 (sp_slot)
→ 즉시 자동 redirect
→ 스마트스토어 도착
```

#### 자체몰 연동 (픽셀샵 불필요)

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

**스마트스토어:**
```
광고 클릭 → 픽셀샵 (쿠키 저장: sp_slot=abc123)
→ 사용자 클릭 → 스마트스토어 → 주문 발생
→ Commerce API 폴링으로 주문 감지
→ 쿠키(sp_slot)로 어떤 슬롯에서 온 주문인지 매칭
→ 슬롯별 매출/ROAS 집계
```

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

campaigns (광고 캠페인 - Meta/네이버 광고 캠페인 관리)
├── id, user_id
├── tracking_link_id → tracking_links.id
├── spent (광고비)
├── clicks, conversions, revenue
└── roas (ROAS %)

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
| **엔터프라이즈** | 별도 협의 | 프로 전체 + API 제공, 전담 매니저, 맞춤 리포트, 온보딩 지원, SLA 보장 | 협의 |

> 알림톡 초과 시: 15원/건 (모든 티어 동일)
> 디자인 서비스 수수료: 15% (디자이너 부담, 정산 시 차감)
> VAT 별도

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
| 픽셀샵 | 서브도메인 (Cloudflare) | 전환 추적용 중간 페이지 |

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
| 내 사이트 연동 (`/my-sites`) | ✅ 완료 | 네이버 API 키 입력 방식 + 자체 사이트 추적 코드 |
| 광고 채널 연동 (`/ad-channels`) | ✅ 완료 | Meta, 네이버 검색광고 연동 완료 (Google, 카카오 등 추가 예정) |
| 디자이너 연결 (`/designers`) | ✅ 완료 | 디자이너 목록, 문의 모달 |
| 결제 관리 (`/billing`) | ✅ 완료 | 구독 관리, 알림 충전 (15원/건) |
| 설정 (`/settings`) | ✅ 완료 | 프로필 설정 (알리고 API 설정 제거됨) |
| 사용 가이드 (`/guide`) | ✅ 완료 | 추적 링크 사용법, 대시보드 이해하기, FAQ |

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
| 픽셀샵/Go URL | ✅ 완료 | `pixel.sellerport.app`, `go.sellerport.app` |
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
| 네이버 검색광고 API 연동 | ✅ 완료 | `/lib/naver/search-ads-api.ts`, `/api/auth/naver-search-ads`, `/api/ad-channels/naver-search/sync` |

---

## 최근 변경 사항 (2025-12-16)

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

### 내 사이트 연동 페이지 UI 개선

"자체몰 사이트"와 "자체 제작 사이트/일반 웹사이트" 섹션을 "내 웹사이트"로 통합하여 브릿지샵 사용 여부로만 구분하도록 개선했습니다.

#### 변경 사항

| 이전 | 이후 |
|------|------|
| 외부 마켓플레이스 (브릿지샵 필요) | 외부 마켓플레이스 (브릿지샵 필요) - 유지 |
| 자체몰 사이트 (직접 추적) | 내 웹사이트 (직접 추적)로 통합 |
| 자체 제작 사이트 / 일반 웹사이트 (별도 섹션) | 내 웹사이트에 통합 |

#### 내 웹사이트 섹션 구성

| 사이트 | 설명 |
|--------|------|
| 카페24 | 쇼핑몰 솔루션 |
| 아임웹 | 쇼핑몰 솔루션 |
| 고도몰 | 쇼핑몰 솔루션 |
| 메이크샵 | 쇼핑몰 솔루션 |
| 일반 웹사이트 | 워드프레스, Wix 등 |

- 5개 카드를 한 줄에 표시 (lg:grid-cols-5)
- 추적 코드 보기 버튼은 우측 상단으로 이동
- 사용자 혼란 방지를 위해 브릿지샵 사용 여부로만 구분

---

### 광고 채널 연동 모달 설명 추가

모든 광고 채널 연동 모달에 각 채널에서 어떤 기능을 제공하는지 설명을 추가했습니다.

#### 수정된 파일

| 파일 | 추가된 설명 |
|------|------------|
| `/components/ad-channels/google-ads-connect-dialog.tsx` | Google Ads 광고비 자동 수집, YouTube 광고 데이터, 전환/ROAS 추적, 캠페인 제어 |
| `/components/ad-channels/naver-gfa-connect-dialog.tsx` | GFA 광고비 자동 수집, 타겟팅별 성과 데이터, 전환/ROAS 추적 |
| `/components/ad-channels/kakao-moment-connect-dialog.tsx` | 카카오모먼트 광고비 자동 수집, 카카오톡/다음 포털 데이터, 전환/ROAS 추적 |
| `/components/ad-channels/tiktok-ads-connect-dialog.tsx` | TikTok 광고비 자동 수집, 전환/ROAS 추적, 캠페인 제어 |
| `/components/ad-channels/youtube-connect-dialog.tsx` | 채널 조회수/구독자 추적, 영상별 성과, 자연 유입 분석 |
| `/components/ad-channels/instagram-connect-dialog.tsx` | 팔로워/도달 추적, 게시물별 인게이지먼트, 자연 유입 분석 |
| `/components/ad-channels/tiktok-connect-dialog.tsx` | 팔로워/조회수 추적, 영상별 인게이지먼트, 자연 유입 분석 |
| `/components/ad-channels/threads-connect-dialog.tsx` | 팔로워/좋아요 추적, 게시물별 인게이지먼트, 자연 유입 분석 |
| `/components/ad-channels/naver-blog-connect-dialog.tsx` | 방문자 수 추적, 포스트별 조회수/댓글, 자연 유입 분석 |
| `/app/(protected)/ad-channels/page.tsx` | 네이버 검색광고 모달에 광고비/클릭/노출 수집 설명 추가 |

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
| 사이트 선택 라벨 | "판매 사이트 선택" | "내 사이트 선택" |
| 트래픽 출처 선택 | 고정 목록 (네이버, 구글, 메타 등) | 광고 채널 선택으로 대체 |
| 광고 유형 선택 | "paid" / "direct" 선택 | 제거됨 |
| 채널 선택 방식 | - | "API 연동 채널" / "수동 채널" 버튼 선택 후 드롭다운에서 등록된 채널 선택 |

#### 채널 분리 구현

- `apiChannels`: is_manual=false인 채널 (Meta, Google, 네이버 검색광고 등 API 연동 채널)
- `manualChannels`: is_manual=true인 채널 (인플루언서, 체험단, 블로그 등 수동 채널)
- 각각 별도 드롭다운으로 사용자가 등록한 채널 목록 표시

---

### 광고 채널 연동 다이얼로그 컴포넌트 추가

광고 채널 연동 페이지(`/ad-channels`)에서 사용할 연동 다이얼로그 컴포넌트들을 추가했습니다.

#### 생성된 파일

| 파일 | 설명 |
|------|------|
| `/components/ad-channels/google-ads-connect-dialog.tsx` | Google Ads 연동 다이얼로그 |
| `/components/ad-channels/instagram-connect-dialog.tsx` | Instagram 연동 다이얼로그 |
| `/components/ad-channels/kakao-moment-connect-dialog.tsx` | 카카오모먼트 연동 다이얼로그 |
| `/components/ad-channels/naver-blog-connect-dialog.tsx` | 네이버 블로그 연동 다이얼로그 |
| `/components/ad-channels/naver-gfa-connect-dialog.tsx` | 네이버 GFA 연동 다이얼로그 |
| `/components/ad-channels/threads-connect-dialog.tsx` | Threads 연동 다이얼로그 |
| `/components/ad-channels/tiktok-ads-connect-dialog.tsx` | TikTok Ads 연동 다이얼로그 |
| `/components/ad-channels/tiktok-connect-dialog.tsx` | TikTok 계정 연동 다이얼로그 |
| `/components/ad-channels/youtube-connect-dialog.tsx` | YouTube 연동 다이얼로그 |

---

### 내 사이트 연동 다이얼로그 컴포넌트 추가

내 사이트 연동 페이지(`/my-sites`)에서 사용할 연동 다이얼로그 컴포넌트들을 추가했습니다.

#### 생성된 파일

| 파일 | 설명 |
|------|------|
| `/components/my-sites/coupang-connect-dialog.tsx` | 쿠팡 Wing API 연동 다이얼로그 |
| `/components/my-sites/custom-site-connect-dialog.tsx` | 자체 사이트 추적 코드 설치 다이얼로그 |
| `/components/my-sites/naver-connect-dialog.tsx` | 네이버 스마트스토어 연동 다이얼로그 (기존 파일 이동) |

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

### platforms → my_sites 리네이밍

#### DB 마이그레이션

| 파일 | 설명 |
|------|------|
| `027_rename_platforms_to_my_sites.sql` | platforms → my_sites 테이블 리네이밍 |

#### 변경된 파일

- `/app/(protected)/platforms/page.tsx` → `/app/(protected)/my-sites/page.tsx`
- `/components/platforms/naver-connect-dialog.tsx` → `/components/my-sites/naver-connect-dialog.tsx`
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
| `/app/api/naver/*` | 네이버 API 전체 수정 (my_sites 테이블 참조) |
| `/app/api/orders/sync/route.ts` | 주문 동기화 API 수정 |
| `/app/api/products/*` | 상품 API 수정 |
| `/app/api/profit/stats/route.ts` | 수익 통계 API 수정 |
| `/lib/ai/optimization-tips.ts` | AI 최적화 팁 수정 |
| `/lib/supabase/middleware.ts` | 미들웨어 수정 |

---

## 변경 사항 (2025-12-17)

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
| 소셜/오가닉 채널 | 유료 광고 (Google Ads, Meta, 네이버 검색광고 등) |
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

### 내 사이트 연동 페이지 라벨 수정

외부 마켓플레이스 뱃지 텍스트를 사용자 친화적으로 변경했습니다.

#### 변경 사항

| 이전 | 이후 |
|------|------|
| "브릿지샵 필요" | "브릿지샵 사용, 추적코드 설치 X" |

#### 수정된 파일

- `/app/(protected)/my-sites/page.tsx` - needsBridgeShop 뱃지 텍스트 변경

---

## 변경 사항 (2025-12-14)

### 용어 개선: "플랫폼 연동" → "내 사이트 연동"

사용자 친화적인 용어로 변경하여 쇼핑몰, 회원가입 사이트, DB 수집 사이트 등 다양한 유형을 포괄할 수 있도록 개선했습니다.

#### DB 마이그레이션

| 파일 | 설명 |
|------|------|
| `027_rename_platforms_to_my_sites.sql` | platforms → my_sites 테이블 리네이밍, 컬럼명 변경 (platform_type → site_type, platform_name → site_name) |

#### 변경된 파일/폴더

| 항목 | 이전 | 이후 |
|------|------|------|
| 페이지 경로 | `/platforms` | `/my-sites` |
| 컴포넌트 폴더 | `components/platforms/` | `components/my-sites/` |
| 사이드바 메뉴 | "플랫폼 연동" | "내 사이트" |
| DB 테이블 | `platforms` | `my_sites` |
| 컬럼명 | `platform_id`, `platform_type`, `platform_name` | `my_site_id`, `site_type`, `site_name` |

#### 수정된 API 파일

- `/api/naver/verify/route.ts` - platformId → siteId
- `/api/naver/sync/route.ts` - platforms → my_sites
- `/api/naver/stats/route.ts` - platformId → siteId
- `/api/naver/test/route.ts` - platforms → my_sites
- `/api/naver/orders/poll/route.ts` - platforms → sites
- `/api/dashboard/stats/route.ts` - platforms → my_sites
- `/api/products/route.ts` - platform_id → my_site_id
- `/api/orders/sync/route.ts` - platforms → sites
- `/api/cron/sync-orders/route.ts` - platforms → sites

---

### 네이버 검색광고 API 연동 구현

#### 구현된 기능

| 기능 | 파일 | 설명 |
|------|------|------|
| NaverSearchAdsAPI 클라이언트 | `/lib/naver/search-ads-api.ts` | HMAC-SHA256 서명 기반 인증, 캠페인/통계 조회 |
| API 키 검증 엔드포인트 | `/api/auth/naver-search-ads/route.ts` | 고객 ID, API Key, Secret Key 검증 후 저장 |
| 광고비 동기화 엔드포인트 | `/api/ad-channels/naver-search/sync/route.ts` | 캠페인별 일별 광고비/클릭/노출 동기화 |
| UI 연동 모달 | `/app/(protected)/ad-channels/page.tsx` | API 키 입력 폼, 연동 성공/실패 처리 |

#### NaverSearchAdsAPI 클라이언트 주요 메서드

```typescript
// 캠페인 목록 조회
getCampaigns(): Promise<NaverCampaign[]>

// 캠페인별 일별 통계 조회
getCampaignStats(campaignIds, dateStart, dateEnd): Promise<NaverStatRecord[]>

// API 키 검증
validateCredentials(): Promise<{ valid: boolean; message?: string }>

// 계정 잔액 조회
getBizMoney(): Promise<NaverBizMoney>
```

#### 데이터 저장 구조

```json
// ad_channels 테이블
{
  "channel_type": "naver_search",
  "access_token": "apiKey",
  "metadata": { "secretKey": "...", "customerId": "..." }
}

// ad_spend_daily 테이블
{
  "campaign_id": "cmp-xxx",
  "date": "2024-12-14",
  "spend": 50000,
  "impressions": 10000,
  "clicks": 500
}
```

#### ⚠️ 제한사항

- **스마트스토어 랜딩 시 키워드별 전환 추적 불가** (네이버 정책)
- 광고비, 클릭수, 노출수만 수집 가능
- 키워드별 전환 추적은 자체 사이트(브랜드스토어) 랜딩 시에만 가능

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
| **Google Ads** | Google Ads API (OAuth) | 광고비, 전환 데이터, 광고 on/off | ⬜ |
| **네이버 검색광고** | 네이버 광고 API (HMAC 서명) | 광고비, 클릭수, 노출수 | ✅ 완료 |
| **네이버 GFA** | 네이버 GFA API | 광고비, 노출/클릭수, 타겟팅 성과 | ⬜ |
| **카카오모먼트** | 카카오 광고 API | 광고비, 성과 데이터 | ⬜ |
| **당근 비즈니스** | 당근 광고 API | 광고비, 노출/클릭수, 지역 타겟팅 성과 | ⬜ |
| **토스** | 토스 광고 API | 광고비, 성과 데이터, 전환 추적 | ⬜ |
| **TikTok Ads** | TikTok Marketing API | 광고비, 쇼트폼 광고 성과, MZ 타겟팅 | ⬜ |
| **데이블** | 데이블 API | 광고비, 네이티브 광고 성과, 콘텐츠 추천 | ⬜ |

**핵심 기능:**

1. **광고비 자동 수집** - 각 채널에서 일별/캠페인별 광고비 자동 동기화
2. **ROAS 자동 계산** - (매출 / 광고비) × 100 실시간 계산
3. **광고 자동 on/off** - ROAS 기준 미달 시 광고 일시중지 (사용자 설정 가능)
4. **통합 대시보드** - 모든 광고 채널 성과를 한 화면에서 확인

**DB 테이블 추가:**

```
ad_channels (광고 채널 연동 정보)
├── id, user_id
├── channel_type (meta, google, naver_search, naver_gfa, kakao, karrot, toss, tiktok, dable)
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

#### 3-1. 구글 광고 전환 추적

| 작업 | 상세 | 상태 |
|------|------|------|
| Google 태그 (gtag.js) | 픽셀샵에 삽입 | ⬜ |
| GCLID 추적 | Google 클릭 ID 저장 | ⬜ |
| Google Ads API 연동 | 광고비 자동 수집 | ⬜ |

#### 3-2. 네이버 검색광고 연동 ✅ 완료

| 작업 | 상세 | 상태 |
|------|------|------|
| 네이버 검색광고 API 클라이언트 | HMAC-SHA256 서명 기반 인증 | ✅ 완료 |
| API 키 검증 엔드포인트 | 고객 ID, API Key, Secret Key 검증 | ✅ 완료 |
| 광고비/클릭/노출 동기화 | 캠페인별 일별 통계 수집 | ✅ 완료 |
| UI 연동 모달 | API 키 입력 폼 | ✅ 완료 |
| ⚠️ 제한사항 | 스마트스토어 랜딩 시 키워드별 전환 추적 불가 (네이버 정책) | -

#### 3-3. 네이버 GFA (성과형 디스플레이 광고) 연동

| 작업 | 상세 | 상태 |
|------|------|------|
| 네이버 GFA API 연동 | 광고비, 노출수, 클릭수 수집 | ⬜ |
| GFA 전환 추적 | 배너 클릭 → 전환 매칭 | ⬜ |
| 타겟팅 성과 분석 | 연령/성별/관심사별 ROAS 분석 | ⬜ |

#### 3-4. 카카오모먼트 + 판매 채널 확장

| 작업 | 상세 | 상태 |
|------|------|------|
| 카카오 픽셀 | 픽셀샵에 삽입 | ⬜ |
| 카카오 광고 API | 광고비 자동 수집 | ⬜ |
| 쿠팡 Wing API | 주문 데이터 수집 | ⬜ |
| 카페24 API | 주문 데이터 수집 | ⬜ |
| 아임웹 API | 주문 데이터 수집 | ⬜ |
| 고도몰 API | 주문 데이터 수집 | ⬜ |
| 메이크샵 API | 주문 데이터 수집 | ⬜ |
| 자체 제작 사이트 | 추적 코드 설치 방식 (워드프레스, Wix, Shopify 등) | ✅ 완료 |
| 멀티 스토어 통합 | 여러 스토어 한 대시보드에서 관리 | ⬜ |

#### 3-5. 정산 API 연동 (수수료 자동 반영) ✅ 완료

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
- [x] profiles 테이블 (사용자 프로필 - 회원 정보 및 요금제)
- [x] my_sites 테이블 (내 사이트 - 네이버 스마트스토어, 자체몰, 서비스 사이트 등 연동)
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
- [ ] Google Ads API 등록
- [x] 네이버 검색광고 API 연동 (HMAC-SHA256 서명 방식)
- [ ] 네이버 GFA API 발급 (성과형 디스플레이 광고)
- [ ] 카카오 광고 API 등록
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