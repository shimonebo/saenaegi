import Link from "next/link";

import {
  fetchTeamSafeRoute,
  type Coordinate,
  type FrontRouteRisk,
} from "@/lib/team-backend";

export const dynamic = "force-dynamic";

type RoutePageProps = {
  searchParams: Promise<{
    start?: string | string[];
    destination?: string | string[];
  }>;
};

type ProjectedRoute = {
  d: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
};

function getText(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getRiskLabel(level: FrontRouteRisk["level"]) {
  if (level === "DANGER") return "위험";
  if (level === "CAUTION") return "주의";
  return "낮음";
}

function projectRoute(
  coordinates: Coordinate[],
): ProjectedRoute {
  const fallback: ProjectedRoute = {
    d: "M120 610 C210 560 300 505 365 440 C445 360 505 295 610 245 C690 205 735 145 785 90",
    start: { x: 120, y: 610 },
    end: { x: 785, y: 90 },
  };

  if (coordinates.length < 2) {
    return fallback;
  }

  const latitudes = coordinates.map((point) => point.lat);
  const longitudes = coordinates.map((point) => point.lng);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latRange = Math.max(maxLat - minLat, 0.000001);
  const lngRange = Math.max(maxLng - minLng, 0.000001);

  const points = coordinates.map((point) => ({
    x: 95 + ((point.lng - minLng) / lngRange) * 710,
    y: 640 - ((point.lat - minLat) / latRange) * 560,
  }));

  return {
    d: points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
      )
      .join(" "),
    start: points[0],
    end: points[points.length - 1],
  };
}

function ErrorPage({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[#0e1012] p-6 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl border border-[#333943] bg-[#15171b] p-8 text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-[#566171]">
            SAFE ROUTE ERROR
          </p>

          <h1 className="mt-5 text-3xl font-extrabold">
            경로를 불러오지 못했습니다.
          </h1>

          <p className="mt-4 break-words leading-7 text-[#a0aaba]">
            {message}
          </p>

          <Link
            href="/#route-planner"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-[#007afc] px-6 font-bold"
          >
            다시 검색하기
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function RoutePage({
  searchParams,
}: RoutePageProps) {
  const params = await searchParams;
  const start = getText(params.start)?.trim() ?? "";
  const destination =
    getText(params.destination)?.trim() ?? "";

  if (!start || !destination) {
    return (
      <ErrorPage message="출발지와 도착지를 모두 입력해주세요." />
    );
  }

  let result;

  try {
    result = await fetchTeamSafeRoute(
      start,
      destination,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";

    return <ErrorPage message={message} />;
  }

  const safeRoute = projectRoute(result.path);
  const shortestRoute = projectRoute(result.shortestPath);

  return (
    <main className="min-h-screen bg-[#0e1012] p-4 text-white md:p-8">
      <header className="mx-auto mb-7 flex max-w-7xl items-center justify-between">
        <Link href="/" className="font-bold tracking-[0.12em]">
          SAFE WAY
        </Link>

        <Link
          href="/#route-planner"
          className="rounded-full border border-[#444d5a] px-5 py-3 text-sm font-bold transition hover:border-white"
        >
          다시 검색
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[370px_1fr]">
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
            <strong className="mt-2 block">
              {result.start}
            </strong>

            <div className="ml-1.5 h-6 border-l border-dashed border-[#566171]" />

            <p className="text-xs text-[#8b96aa]">도착지</p>
            <strong className="mt-2 block">
              {result.destination}
            </strong>
          </div>

          <div className="mt-4 rounded-xl bg-[#1c1f24] p-5">
            <p className="text-xs text-[#8b96aa]">
              AI 안전도
            </p>

            <div className="mt-2 flex items-baseline gap-2">
              <strong className="text-5xl text-[#007afc]">
                {result.safetyScore}
              </strong>
              <span className="text-[#8b96aa]">/ 100</span>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#333943]">
              <div
                className="h-full rounded-full bg-[#007afc]"
                style={{
                  width: `${result.safetyScore}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#1c1f24] p-4">
              <p className="text-xs text-[#8b96aa]">
                예상 시간
              </p>
              <strong className="mt-2 block">
                {result.duration}분
              </strong>
            </div>

            <div className="rounded-xl bg-[#1c1f24] p-4">
              <p className="text-xs text-[#8b96aa]">
                이동 거리
              </p>
              <strong className="mt-2 block">
                {result.distance}km
              </strong>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[#1c1f24] p-5">
            <p className="font-bold">추천 이유</p>
            <p className="mt-3 text-sm leading-6 text-[#a0aaba]">
              {result.summary}
            </p>
          </div>

          <div className="mt-4 rounded-xl bg-[#1c1f24] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold">위험 요소 분석</p>
              <span className="text-xs text-[#8b96aa]">
                회피 {result.avoidedConstructionCount}곳
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {result.risks.map((risk, index) => (
                <article
                  key={`${risk.title}-${index}`}
                  className="rounded-lg border border-[#333943] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-sm">
                      {risk.title}
                    </strong>
                    <span className="rounded-full bg-[#23262d] px-3 py-1 text-[10px] font-bold text-[#a0aaba]">
                      {getRiskLabel(risk.level)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs leading-5 text-[#8b96aa]">
                    {risk.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </aside>

        <section className="relative min-h-[690px] overflow-hidden rounded-3xl border border-[#23262d] bg-[#111419]">
          <svg
            viewBox="0 0 900 720"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="팀 백엔드가 계산한 추천 안전 경로"
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

            <path
              d={shortestRoute.d}
              fill="none"
              stroke="#596473"
              strokeWidth="8"
              strokeDasharray="12 15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d={safeRoute.d}
              fill="none"
              stroke="#007afc"
              strokeWidth="13"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <circle
              cx={safeRoute.start.x}
              cy={safeRoute.start.y}
              r="18"
              fill="#ffffff"
              stroke="#007afc"
              strokeWidth="8"
            />

            <circle
              cx={safeRoute.end.x}
              cy={safeRoute.end.y}
              r="20"
              fill="#007afc"
            />
            <circle
              cx={safeRoute.end.x}
              cy={safeRoute.end.y}
              r="6"
              fill="#ffffff"
            />
          </svg>

          <div className="absolute top-5 left-5 rounded-full bg-[#007afc] px-5 py-3 text-sm font-bold">
            추천 안전 경로
          </div>

          <div className="absolute right-5 bottom-5 rounded-xl border border-[#333943] bg-[#15171b]/95 p-5 text-sm leading-7 text-[#a0aaba] backdrop-blur">
            <p>
              <span className="text-[#007afc]">━</span>{" "}
              파란색 실선: 안전 경로
            </p>
            <p>
              <span className="text-[#596473]">┅</span>{" "}
              회색 점선: 최단 경로
            </p>
            <p className="mt-2 text-xs text-[#566171]">
              Route ID: {result.routeId}
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
