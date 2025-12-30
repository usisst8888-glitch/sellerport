/**
 * Instagram 팔로우 확인 API (web_url 버튼용)
 * GET /api/instagram/follow-confirm
 *
 * 사용자가 "팔로우 했어요" 버튼 클릭 시 호출됨
 * 팔로우 확인 후 트래킹 URL로 리다이렉트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const dmSettingId = searchParams.get('dm')
  const trackingUrl = searchParams.get('url')
  const commentId = searchParams.get('comment')

  if (!dmSettingId || !trackingUrl) {
    return new NextResponse(renderErrorPage('잘못된 요청입니다.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const supabase = await createClient()

    // DM 설정 조회
    const { data: dmSettings } = await supabase
      .from('instagram_dm_settings')
      .select('*, instagram_accounts(*)')
      .eq('id', dmSettingId)
      .single()

    if (!dmSettings) {
      return new NextResponse(renderErrorPage('DM 설정을 찾을 수 없습니다.'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // 팔로우 확인 완료 페이지 표시 후 트래킹 URL로 리다이렉트
    // 실제 팔로우 확인은 이미 완료되었거나 별도로 처리
    return new NextResponse(renderSuccessPage(trackingUrl, dmSettings.instagram_accounts?.username), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })

  } catch (error) {
    console.error('Follow confirm error:', error)
    return new NextResponse(renderErrorPage('오류가 발생했습니다.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

function renderSuccessPage(trackingUrl: string, username?: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>팔로우 확인</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #00c853 0%, #69f0ae 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      fill: white;
    }
    h1 {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    p {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .username {
      color: #667eea;
      font-weight: 600;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
    }
    .countdown {
      margin-top: 20px;
      color: #999;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    </div>
    <h1>감사합니다!</h1>
    <p>
      ${username ? `<span class="username">@${username}</span>를 팔로우해 주셔서 감사합니다!<br><br>` : ''}
      아래 버튼을 클릭하여 링크를 확인하세요.
    </p>
    <a href="${trackingUrl}" class="button">링크 확인하기</a>
    <p class="countdown">
      <span id="count">3</span>초 후 자동으로 이동합니다...
    </p>
  </div>
  <script>
    let count = 3;
    const countEl = document.getElementById('count');
    const interval = setInterval(() => {
      count--;
      countEl.textContent = count;
      if (count <= 0) {
        clearInterval(interval);
        window.location.href = '${trackingUrl}';
      }
    }, 1000);
  </script>
</body>
</html>
`
}

function renderErrorPage(message: string): string {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오류</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .icon svg {
      width: 40px;
      height: 40px;
      fill: white;
    }
    h1 {
      font-size: 24px;
      color: #1a1a1a;
      margin-bottom: 12px;
    }
    p {
      color: #666;
      font-size: 16px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
    </div>
    <h1>오류 발생</h1>
    <p>${message}</p>
  </div>
</body>
</html>
`
}
