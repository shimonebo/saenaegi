type RoutePageProps = {
  searchParams: Promise<{
    start?: string | string[];
    destination?: string | string[];
  }>;
};

const mockResult = {
  safetyScore: 94,
  duration: 14,
  distance: 1.1,
  risks: [
    "트램 공사 구간 1곳",
    "임시 보행로 2곳",
    "야간 조도가 낮은 구간 1곳",
  ],
};

function getText(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function RoutePage({
  searchParams,
}: RoutePageProps) {
  const params = await searchParams;

  const start =
    getText(params.start)?.trim() || "대전서원초등학교";

  const destination =
    getText(params.destination)?.trim() || "둔산동 보라아파트";

  return (
    <main className="min-h-screen bg-[#0e1012] p-4 text-white md:p-8">
      <header className="mx-auto mb-7 flex max-w-7xl items-center justify-between">
        <a href="/" className="font-bold tracking-[0.12em]">
          SAFE WAY
        </a>

        <a
          href="/#route-planner"
          className="rounded-full border border-[#444d5a] px-5 py-3 text-sm font-bold transition hover:border-white"
        >
          다시 검색
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-3xl border border-[#23262d] bg-[#15171b] p-6">
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#566171]">
            AI SAFE ROUTE
          </p>

          <h1 className="mt-4 text-4xl leading-tight font-extrabold">
            안전 경로
            <br />
            분석 결과
          </h1>

          <div className="mt-7 rounded-xl bg-[#1c1f24] p-5">
            <p className="text-xs text-[#8b96aa]">출발지</p>
            <strong className="mt-2 block">{start}</strong>

            <div className="ml-1.5 h-6 border-l border-dashed border-[#566171]" />

            <p className="text-xs text-[#8b96aa]">도착지</p>
            <strong className="mt-2 block">{destination}</strong>
          </div>

          <div className="mt-4 rounded-xl bg-[#1c1f24] p-5">
            <p className="text-xs text-[#8b96aa]">AI 안전도</p>

            <div className="mt-2 flex items-baseline gap-2">
              <strong className="text-5xl text-[#007afc]">
                {mockResult.safetyScore}
              </strong>

              <span className="text-[#8b96aa]">/ 100</span>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#333943]">
              <div
                className="h-full rounded-full bg-[#007afc]"
                style={{ width: `${mockResult.safetyScore}%` }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#1c1f24] p-4">
              <p className="text-xs text-[#8b96aa]">예상 시간</p>
              <strong className="mt-2 block">
                {mockResult.duration}분
              </strong>
            </div>

            <div className="rounded-xl bg-[#1c1f24] p-4">
              <p className="text-xs text-[#8b96aa]">이동 거리</p>
              <strong className="mt-2 block">
                {mockResult.distance}km
              </strong>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#1c1f24] p-5">
            <p className="mb-4 font-bold">회피한 위험 요소</p>

            <div className="space-y-3">
              {mockResult.risks.map((risk) => (
                <p key={risk} className="text-sm text-[#a0aaba]">
                  · {risk}
                </p>
              ))}
            </div>
          </div>
        </aside>

        <section className="relative min-h-[650px] overflow-hidden rounded-3xl border border-[#23262d] bg-[#111419]">
          <svg
            viewBox="0 0 900 720"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="추천 안전 경로 지도 예시"
          >
            <rect width="900" height="720" fill="#111419" />

            <g
              fill="none"
              stroke="#252a31"
              strokeWidth="26"
              strokeLinecap="round"
            >
              <path d="M-30 160 C180 100 320 180 470 130 S720 40 950 80" />
              <path d="M-30 510 C180 450 320 540 500 470 S720 390 950 430" />
              <path d="M180 -30 C190 160 250 350 220 760" />
              <path d="M520 -30 C470 190 560 360 510 760" />
              <path d="M770 -30 C720 200 810 410 750 760" />
            </g>

            <g fill="#181c21" stroke="#303640">
              <rect x="270" y="180" width="130" height="90" rx="12" />
              <rect x="570" y="120" width="120" height="110" rx="12" />
              <rect x="300" y="500" width="150" height="90" rx="12" />
              <rect x="610" y="470" width="120" height="100" rx="12" />
            </g>

            <path
              d="M160 590 C240 540 300 505 360 450 C430 385 450 310 540 275 C630 240 680 200 745 115"
              fill="none"
              stroke="#007afc"
              strokeWidth="13"
              strokeLinecap="round"
            />

            <path
              d="M365 450 C410 485 455 515 520 525"
              fill="none"
              stroke="#596473"
              strokeWidth="8"
              strokeDasharray="13 15"
              strokeLinecap="round"
            />

            <circle
              cx="160"
              cy="590"
              r="18"
              fill="#ffffff"
              stroke="#007afc"
              strokeWidth="8"
            />

            <circle cx="745" cy="115" r="20" fill="#007afc" />
            <circle cx="745" cy="115" r="6" fill="#ffffff" />

            <g transform="translate(430 500)">
              <rect width="160" height="44" rx="8" fill="#1c1f24" />

              <text
                x="80"
                y="28"
                textAnchor="middle"
                fill="#a0aaba"
                fontSize="13"
              >
                트램 공사 구간 회피
              </text>
            </g>
          </svg>

          <div className="absolute top-5 left-5 rounded-full bg-[#007afc] px-5 py-3 text-sm font-bold">
            추천 안전 경로
          </div>

          <div className="absolute right-5 bottom-5 rounded-xl border border-[#333943] bg-[#15171b]/95 p-5 text-sm leading-7 text-[#a0aaba] backdrop-blur">
            <p>
              <span className="text-[#007afc]">━</span> 파란색 실선: 추천
              안전 경로
            </p>

            <p>
              <span className="text-[#596473]">┅</span> 회색 점선: 회피한
              공사 구간
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}