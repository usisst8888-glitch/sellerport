# 셀러포트 (SellerPort) 개발 로드맵

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 셀러포트 (SellerPort) |
| 도메인 | sellerport.app |
| 사업자 | 어시스트 솔루션 (602-27-04681) |
| 서비스 설명 | 이커머스 셀러를 위한 정기구독 통합 관리 SaaS |

## 개발 환경

| 구분 | 기술 | 용도 |
|------|------|------|
| Frontend | Next.js 14 (App Router) | 웹 애플리케이션 |
| Backend | Next.js API Routes | API 서버 |
| Database | Supabase (PostgreSQL) | 데이터 저장 |
| Auth | Supabase Auth | 회원 인증 |
| Hosting | Vercel | 배포 및 호스팅 |
| API Proxy | Google Cloud (GCP) | 고정 IP 프록시 (네이버 등 IP 제한 API용) |
| Storage | Supabase Storage | 파일 저장 |
| 버전관리 | GitHub | 소스코드 관리 |
| 결제 | 토스페이먼츠 | 플랜 구독 결제 |
| 알림톡 | 알리고 API | 카카오 알림톡 발송 |

## 플랜 구조

| 플랜 | 월 가격 | 구독자 수 | 플랫폼 연동 | 알림톡 단가 |
|------|---------|-----------|-------------|-------------|
| Free | 0원 | 10명 | 1개 | 22원 |
| Basic | 50,000원 | 100명 | 2개 | 20원 |
| Pro | 100,000원 | 500명 | 4개 | 18원 |
| Enterprise | 200,000원 | 무제한 | 무제한 | 15원 |

## 연동 플랫폼

| 플랫폼 | 우선순위 | 비고 |
|--------|----------|------|
| 네이버 스마트스토어 | P0 | 법인만 정기배송 기능 |
| 카페24 | P0 | 자사몰 솔루션 |
| 아임웹 | P0 | 자사몰 솔루션 |
| 고도몰 | P1 | 자사몰 솔루션 |
| 메이크샵 | P1 | 자사몰 솔루션 |
| 위사 | P1 | 자사몰 솔루션 |
| 쿠팡 | P1 | 정기배송 기능 없음 |
| 카카오톡스토어 | P1 | 오픈마켓 |

---

## 개발 로드맵

### Phase 1: MVP (10주)

#### Week 1-2: 프로젝트 셋업 ✅ 완료

| 작업 | 상세 | 상태 |
|------|------|------|
| GitHub 저장소 생성 | sellerport 레포 생성 | ✅ |
| Next.js 프로젝트 초기화 | App Router, TypeScript, Tailwind CSS | ✅ |
| Vercel 연동 | GitHub 연동, 자동 배포 설정 | ✅ |
| Supabase 프로젝트 생성 | 프로젝트 생성, API 키 발급 | ✅ |
| 도메인 연결 | sellerport.app → Vercel 연결 | ⏳ 나중에 |
| 기본 UI 라이브러리 설정 | shadcn/ui | ✅ |

#### Week 3-4: 인증 시스템 ✅ 완료

| 작업 | 상세 | 상태 |
|------|------|------|
| Supabase Auth 설정 | 이메일/비밀번호 인증 활성화 | ✅ |
| 회원가입 페이지 | /signup | ✅ |
| 로그인 페이지 | /login | ✅ |
| 프로필 테이블 생성 | profiles 테이블 | ✅ |
| 미들웨어 설정 | 인증 상태 체크, 리다이렉트 처리 | ✅ |
| 세션 관리 | Supabase 세션 + Next.js 미들웨어 | ✅ |

#### Week 5-7: 플랫폼 연동 (P0)

| 작업 | 상세 | 환경 |
|------|------|------|
| 플랫폼 테이블 생성 | platforms 테이블 (인증정보, 연동상태) | Supabase |
| 네이버 스마트스토어 연동 | OAuth 인증, 주문 API 연동 | Next.js API |
| 카페24 연동 | OAuth 인증, 주문 API 연동 | Next.js API |
| 아임웹 연동 | API 키 인증, 주문 API 연동 | Next.js API |
| 플랫폼 선택 UI | 플랜별 연동 개수 제한 UI | Next.js |
| 토큰 갱신 로직 | OAuth 토큰 자동 갱신 (Vercel Cron) | Vercel |

#### Week 8-9: 구독자 관리

| 작업 | 상세 | 환경 |
|------|------|------|
| 구독자 테이블 생성 | subscribers, subscription_history 테이블 | Supabase |
| 구독자 동기화 | 플랫폼 → Supabase 데이터 동기화 | Next.js API |
| 통합 대시보드 | /dashboard - 전체 현황, 플랫폼별 통계 | Next.js |
| 구독자 목록 | /subscribers - 필터, 검색, 정렬 | Next.js |
| 구독자 상세 | /subscribers/[id] - 이력, 메모, 상태 | Next.js |
| 발송 체크리스트 | /shipments - 오늘 발송 목록, 체크 기능 | Next.js |

#### Week 10: 알림톡 기본

| 작업 | 상세 | 환경 |
|------|------|------|
| 알리고 계정 설정 | API 키 발급, 발신번호 등록 | 알리고 |
| 알림톡 API 연동 | 발송 API 구현 | Next.js API |
| 템플릿 관리 | /alimtalk/templates - 템플릿 CRUD | Next.js |
| 발송 내역 | /alimtalk/history - 발송 로그 | Next.js |
| 잔액 관리 | 알림톡 잔액 표시, 충전 안내 | Supabase |

---

### Phase 2: 핵심 차별화 (6주)

#### Week 11-13: 플랫폼 연동 (P1)

| 작업 | 상세 | 환경 |
|------|------|------|
| 고도몰 연동 | API 인증, 주문 연동 | Next.js API |
| 메이크샵 연동 | API 인증, 주문 연동 | Next.js API |
| 위사 연동 | API 인증, 주문 연동 | Next.js API |
| 쿠팡 연동 | API 인증, 주문 연동 | Next.js API |
| 카카오톡스토어 연동 | API 인증, 주문 연동 | Next.js API |

#### Week 14-15: 결제 실패 관리

| 작업 | 상세 | 환경 |
|------|------|------|
| 결제 실패 감지 | 플랫폼별 결제 실패 상태 동기화 | Vercel Cron |
| 실패 알림 | 셀러에게 알림 (이메일/대시보드) | Next.js |
| 재결제 유도 알림톡 | 고객에게 자동 알림톡 발송 | Next.js API |
| 실패 대시보드 | 결제 실패 현황 모아보기 | Next.js |

#### Week 16: 이탈 예측

| 작업 | 상세 | 환경 |
|------|------|------|
| 위험 고객 플래그 | 이탈 징후 고객 자동 표시 | Supabase |
| 관리 필요 알림 | 대시보드 알림, 이메일 알림 | Next.js |
| 회차별 유지율 | 회차별 이탈률 차트 | Next.js |

---

### Phase 3: CRM 고도화 (6주)

#### Week 17-19: 자동화

| 작업 | 상세 | 환경 |
|------|------|------|
| 자동 알림톡 설정 | 조건별 자동 발송 규칙 설정 | Next.js |
| 스케줄러 구현 | Vercel Cron으로 예약 발송 | Vercel Cron |
| 재구독 유도 캠페인 | 이탈 고객 대상 자동 발송 | Next.js API |
| 회차별 특전 알림 | N회차 도달 시 자동 알림 | Next.js API |

#### Week 20-21: 고객 관리

| 작업 | 상세 | 환경 |
|------|------|------|
| 세그먼트 기능 | VIP, 이탈위험, 신규 등 자동 분류 | Supabase |
| 태그 시스템 | 커스텀 태그 추가/관리 | Supabase |
| 메모 기능 | 고객별 메모 저장 | Supabase |
| 세그먼트별 발송 | 세그먼트 선택하여 일괄 발송 | Next.js |

#### Week 22: 리포트

| 작업 | 상세 | 환경 |
|------|------|------|
| 월간 리포트 | 월별 통계 자동 생성 | Vercel Cron |
| PDF 다운로드 | 리포트 PDF 생성 | Next.js API |
| 매출 예측 | 예상 매출 차트 | Next.js |

---

### Phase 4: 확장 기능 (8주)

#### Week 23-26: 배송 연동

| 작업 | 상세 | 환경 |
|------|------|------|
| 택배사 API 연동 | CJ, 한진, 롯데 등 주요 택배사 | Next.js API |
| 송장 일괄 등록 | 엑셀 업로드 → 플랫폼 자동 등록 | Next.js |
| 배송 추적 | 배송 상태 자동 업데이트 | Vercel Cron |

#### Week 27-30: 고급 기능

| 작업 | 상세 | 환경 |
|------|------|------|
| 코호트 분석 | 가입 시기별 유지율 분석 | Next.js |
| 상품별 유지율 | 상품별 성과 분석 | Next.js |
| 다중 사용자 | 팀원 초대, 역할 관리 | Supabase |
| 권한 관리 | 관리자/매니저/뷰어 권한 | Supabase RLS |

---

### Phase 5: 결제 시스템 (10주) ⚠️ PG 계약 필요

#### Week 31-34: 플랜 구독 결제 (토스페이먼츠)

| 작업 | 상세 | 환경 |
|------|------|------|
| 토스페이먼츠 계약 | PG 계약 신청, 빌링키 발급 | 토스페이먼츠 |
| 플랜 선택 페이지 | /settings/plan - 4개 플랜 표시 | Next.js |
| 결제 API 연동 | 토스페이먼츠 빌링 API | Next.js API |
| 빌링키 저장 | 암호화하여 Supabase 저장 | Supabase |
| 웹훅 처리 | 결제 성공/실패 웹훅 | Next.js API |
| 플랜 상태 관리 | 플랜 변경, 만료일 관리 | Supabase |

#### Week 35-37: 고객 결제 페이지

| 작업 | 상세 | 환경 |
|------|------|------|
| 구독 마이페이지 | 고객용 구독 관리 페이지 | Next.js |
| 카드 등록/변경 | 토스페이먼츠 카드 등록 | Next.js |
| 구독 일시정지/해지 | 고객 직접 관리 | Next.js API |

#### Week 38-40: 자체 정기결제

| 작업 | 상세 | 환경 |
|------|------|------|
| 빌링 시스템 | 자체 정기결제 스케줄러 | Vercel Cron |
| 결제 실패 재시도 | 자동 재시도 로직 (3회) | Next.js API |
| 플랫폼 → 자체 전환 | 전환 유도 기능 | Next.js |
| 셀러 정산 | 정산 내역 관리 | Supabase |

---

## 전체 타임라인

| Phase | 기간 | 누적 | 핵심 목표 |
|-------|------|------|-----------|
| Phase 1 | 10주 | 10주 | MVP + P0 플랫폼 3개 연동 |
| Phase 2 | 6주 | 16주 | P1 플랫폼 5개 + 결제실패 관리 |
| Phase 3 | 6주 | 22주 | CRM 자동화 |
| Phase 4 | 8주 | 30주 | 배송 연동 + 고급 기능 |
| Phase 5 | 10주 | 40주 | 결제 시스템 (PG 계약 후) |

**총 개발 기간: 약 40주 (10개월)**

> ⚠️ **Note:** Phase 5 결제 시스템은 토스페이먼츠 PG 계약이 완료된 후 진행합니다.
> MVP 출시 시에는 Free 플랜만 제공하고, 유료 플랜은 결제 시스템 완료 후 오픈합니다.

---

## 환경별 설정 체크리스트

### Supabase 설정
- [x] 프로젝트 생성
- [x] profiles 테이블 생성
- [ ] platforms 테이블 생성
- [ ] subscribers 테이블 생성
- [ ] subscription_history 테이블 생성
- [ ] alimtalk_logs 테이블 생성
- [x] RLS (Row Level Security) 정책 설정
- [x] Auth 이메일 인증 설정
- [ ] Storage 버킷 생성 (리포트, 첨부파일)

### Vercel 설정
- [x] GitHub 연동
- [x] 환경변수 설정 (SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] 도메인 연결 (sellerport.app)
- [ ] Cron Jobs 설정

### GitHub 설정
- [x] 저장소 생성
- [ ] 브랜치 보호 규칙 (main)
- [ ] GitHub Actions (CI/CD)

### Google Cloud 프록시 서버 설정 ($300 크레딧 90일)
- [ ] Google Cloud 계정 생성 (cloud.google.com)
- [ ] Compute Engine VM 생성 (e2-micro - 무료 등급)
- [ ] 고정 외부 IP 할당 (Static External IP)
- [ ] 방화벽 규칙 설정 (인바운드: 22, 3000 / 아웃바운드: All)
- [ ] Node.js + Express 프록시 서버 배포
- [ ] PM2로 프로세스 관리
- [ ] 네이버 커머스 API에 고정 IP 등록

### 외부 서비스 설정
- [ ] 토스페이먼츠 PG 계약 및 API 키 발급 (Phase 5)
- [ ] 알리고 API 키 발급
- [ ] 각 플랫폼 개발자 센터 가입 및 앱 등록

---

## 플랫폼별 API 연동 정보

| 플랫폼 | 인증 방식 | 개발자 센터 |
|--------|-----------|-------------|
| 네이버 스마트스토어 | OAuth 2.0 | commerce.naver.com |
| 카페24 | OAuth 2.0 | developers.cafe24.com |
| 아임웹 | API Key | developers.imweb.me |
| 고도몰 | API Key | developer.godo.co.kr |
| 메이크샵 | API Key | developer.makeshop.co.kr |
| 위사 | API Key | - |
| 쿠팡 | HMAC | developers.coupang.com |
| 카카오톡스토어 | OAuth 2.0 | - |

---

## Vercel Cron Jobs 목록

| 작업 | 주기 | 설명 |
|------|------|------|
| 토큰 갱신 | 매일 00:00 | OAuth 토큰 만료 전 갱신 |
| 구독자 동기화 | 매 시간 | 플랫폼 → DB 동기화 |
| 발송 예정 알림 | 매일 09:00 | 오늘 발송 건 알림 |
| 자동 알림톡 | 매 시간 | 조건 충족 시 자동 발송 |
| 결제 실패 체크 | 매 시간 | 결제 실패 건 감지 |
| 이탈 위험 체크 | 매일 00:00 | 이탈 위험 고객 플래그 |
| 월간 리포트 | 매월 1일 | 월간 리포트 생성 |

---

## Google Cloud 프록시 서버 아키텍처

### 왜 필요한가?

네이버 커머스 API는 **고정 IP 등록이 필수**입니다 (2024년 정책 변경).
Vercel은 서버리스 환경이라 고정 IP가 없으므로, Google Cloud 프록시를 통해 API 호출합니다.

### 왜 Google Cloud인가?

| 항목 | Google Cloud | Oracle Cloud | AWS EC2 |
|------|-------------|--------------|---------|
| 무료 크레딧 | **$300 (90일)** | 영구 무료 (가입 어려움) | 12개월 |
| 고정 IP | 무료 | 무료 | 무료 (사용 중) |
| 서울 리전 | O (asia-northeast3) | O | O |
| 가입 난이도 | **쉬움** | 어려움 | 보통 |
| 90일 후 비용 | ~$5-10/월 | $0 | ~$8-15/월 |

> **참고:** Oracle Cloud는 가입 자체가 어려워서 GCP로 변경. 90일 무료 사용 후 저렴한 서비스로 이전 가능.

### 아키텍처 구조

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │     │ Google Cloud │     │  네이버 API   │
│  (Next.js)   │ ──> │  (고정 IP)    │ ──> │              │
│              │     │  Express.js  │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                                         │
       │         ┌──────────────┐                │
       └───────> │   Supabase   │ <──────────────┘
                 │  (Database)  │    (데이터 저장)
                 └──────────────┘
```

### Google Cloud Compute Engine 사양

| 항목 | e2-micro (무료 등급) |
|------|---------------------|
| 인스턴스 타입 | e2-micro |
| 월 비용 | 무료 등급 포함 (1개) |
| vCPU | 0.25~2 (공유) |
| 메모리 | 1GB |
| 스토리지 | 30GB 표준 영구 디스크 |
| 아웃바운드 트래픽 | 1GB/월 무료 |
| 리전 | asia-northeast3 (서울) |

> **참고:** $300 크레딧 기간에는 더 높은 사양 사용 가능

### 프록시 서버 역할

1. **네이버 커머스 API** - OAuth 토큰 발급, 주문 조회, 정기구독 데이터
2. **쿠팡 API** (HMAC 인증) - 필요시 추가
3. **기타 IP 제한 API** - 필요시 추가

### 보안 고려사항

- Google Cloud ↔ Vercel 간 API Key 인증 필수
- HTTPS (Let's Encrypt SSL) 적용
- Rate Limiting 설정
- 환경변수로 민감정보 관리
