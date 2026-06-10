"use client";

// 인스타 영상 분석 결과 표시 컴포넌트 (모달 안 / 별도 페이지 둘 다에서 재사용)

export type Analysis = {
  shortcode: string;
  source_url: string;
  video_url: string | null;
  title: string | null;
  transcript: string | null;
  video_summary: string | null;
  story_premise: string | null;
  script_scenes:
    | { index: number; text: string; emotion: string; durationSec: number }[]
    | null;
  product_keywords:
    | { keyword: string; translation?: string; note?: string }[]
    | null;
  model: string | null;
  analyzed_at: string;
};

function xhsSearchUrl(keyword: string): string {
  return `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(
    keyword,
  )}&source=web_explore_feed`;
}

function douyinSearchUrl(keyword: string): string {
  return `https://www.douyin.com/search/${encodeURIComponent(keyword)}?type=video`;
}

export function AnalysisView({ a }: { a: Analysis }) {
  const scenes = a.script_scenes || [];
  const keywords = a.product_keywords || [];

  return (
    <div className="space-y-5">
      {/* 어그로 제목 */}
      {a.title && (
        <section>
          <h3 className="text-xs font-semibold text-slate-400 mb-1.5">
            🔥 어그로 제목
          </h3>
          <p className="text-lg font-bold text-white leading-snug">
            {a.title}
          </p>
        </section>
      )}

      {/* 한 줄 요약 */}
      {a.video_summary && (
        <section>
          <h3 className="text-xs font-semibold text-slate-400 mb-1.5">
            📝 한 줄 요약
          </h3>
          <p className="text-sm text-slate-200">
            {a.video_summary}
          </p>
        </section>
      )}

      {/* 샤오홍슈/도우인 검색 키워드 — 중국어로 검색, 한국어 번역 병기 */}
      {keywords.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-400 mb-2">
            🔍 샤오홍슈/도우인 검색 키워드 — 中文로 검색돼요
          </h3>
          <div className="space-y-1.5">
            {keywords.map((k, i) => (
              <div
                key={`${k.keyword}-${i}`}
                className="flex items-center gap-2 bg-slate-900 text-white border border-white/5 rounded-lg px-3 py-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {k.keyword}
                    {k.translation && (
                      <span className="ml-2 text-xs font-normal text-slate-400">
                        ({k.translation})
                      </span>
                    )}
                  </div>
                  {k.note && (
                    <div
                      className="text-[11px] text-slate-500 truncate"
                      title={k.note}
                    >
                      {k.note}
                    </div>
                  )}
                </div>
                <a
                  href={xhsSearchUrl(k.keyword)}
                  target="_blank"
                  rel="noopener"
                  className="text-[11px] px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 shrink-0"
                >
                  📕 샤오홍슈
                </a>
                <a
                  href={douyinSearchUrl(k.keyword)}
                  target="_blank"
                  rel="noopener"
                  className="text-[11px] px-2 py-1 rounded bg-slate-700 text-white hover:bg-slate-600 shrink-0"
                >
                  🎵 도우인
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 원본 전사 */}
      {a.transcript && (
        <section>
          <h3 className="text-xs font-semibold text-slate-400 mb-1.5">
            🎙 원본 전사 (영상에서 들리는 말 그대로)
          </h3>
          <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed bg-slate-900 text-white border border-white/5 rounded-lg p-3">
            {a.transcript}
          </p>
        </section>
      )}

      {/* 재창작 쇼츠 대본 */}
      {scenes.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-slate-400 mb-1.5">
            ✂️ 재창작 쇼츠 대본 (4씬, 32초)
          </h3>
          {a.story_premise && (
            <p className="text-xs text-slate-400 italic mb-2">
              💡 {a.story_premise}
            </p>
          )}
          <div className="space-y-2">
            {scenes.map((sc) => (
              <div
                key={sc.index}
                className="flex gap-3 bg-slate-900 text-white border border-white/5 rounded-lg p-3"
              >
                <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                  <span className="text-xs font-bold text-slate-500">
                    {sc.index + 1}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 text-slate-300">
                    {sc.emotion}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {sc.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 메타 */}
      <div className="text-[10px] text-slate-500 pt-2 border-t border-white/5 flex items-center justify-between">
        <span>
          분석: {new Date(a.analyzed_at).toLocaleString("ko-KR")}
          {a.model && ` · ${a.model}`}
        </span>
        <a
          href={a.source_url}
          target="_blank"
          rel="noopener"
          className="hover:text-red-500"
        >
          원본 ↗
        </a>
      </div>
    </div>
  );
}
