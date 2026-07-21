"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const WALK_SPEED_M_PER_MIN = 50; // 어린이 도보 속도 가정 (백엔드 스케줄과 동일)

type Coord = { lat: number; lng: number };
type RouteBlock = {
  coords: Coord[];
  distance_m: number;
  passes_danger: boolean;
  min_dist_to_danger_m: number | null;
};
type DangerZone = { lat: number; lng: number; risk_level?: string; location_name?: string };
type PlanResponse = {
  engine: string;
  start: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
  danger_zones: DangerZone[];
  shortest_route: RouteBlock;
  safe_route: RouteBlock;
  ai: { risk_level: string; ai_comment: string; mode: string };
  safety_score: number;
};

type Props = { start: string; destination: string };

// 위/경도 좌표들을 SVG 화면 좌표로 변환하는 함수 (자동 축척 + y축 뒤집기)
function makeProjector(points: Coord[], w: number, h: number, pad = 40) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 0.001;
  const spanLng = maxLng - minLng || 0.001;
  return (p: Coord) => {
    const x = pad + ((p.lng - minLng) / spanLng) * (w - pad * 2);
    const y = pad + (1 - (p.lat - minLat) / spanLat) * (h - pad * 2); // 위도 클수록 위로
    return { x, y };
  };
}

function toPath(coords: Coord[], project: (p: Coord) => { x: number; y: number }) {
  return coords
    .map((c, i) => {
      const { x, y } = project(c);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function RouteResult({ start, destination }: Props) {
  const [data, setData] = useState<PlanResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_URL}/route/plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ start, destination }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const supported = body?.detail?.supported_demo_places;
          throw new Error(
            (body?.detail?.message || `요청 실패 (${res.status})`) +
              (supported ? `\n지원 데모 지명: ${supported.join(", ")}` : ""),
          );
        }
        const json: PlanResponse = await res.json();
        if (alive) setData(json);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "알 수 없는 오류");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [start, destination]);

  const W = 900, H = 720;
  let mapSvg = null;
  if (data) {
    const allPts = [
      ...data.safe_route.coords,
      ...data.shortest_route.coords,
      ...data.danger_zones.map((z) => ({ lat: z.lat, lng: z.lng })),
    ];
    const project = makeProjector(allPts, W, H);
    const s = project(data.safe_route.coords[0]);
    const g = project(data.safe_route.coords[data.safe_route.coords.length - 1]);
    mapSvg = (
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="실제 추천 안전 경로">
        <rect width={W} height={H} fill="#111419" />
        {/* 최단 경로 (회색 점선) */}
        <path d={toPath(data.shortest_route.coords, project)} fill="none" stroke="#596473" strokeWidth={7} strokeDasharray="12 12" strokeLinecap="round" />
        {/* 안전 경로 (파란 실선) */}
        <path d={toPath(data.safe_route.coords, project)} fill="none" stroke="#007afc" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
        {/* 위험구간 (빨간 원 + 영향반경) */}
        {data.danger_zones.map((z, i) => {
          const p = project({ lat: z.lat, lng: z.lng });
          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={26} fill="#ef4444" opacity={0.18} />
              <circle cx={p.x} cy={p.y} r={9} fill="#ef4444" />
              <text x={p.x} y={p.y - 16} textAnchor="middle" fill="#fca5a5" fontSize={12} fontWeight={700}>
                위험 {z.risk_level ?? ""}
              </text>
            </g>
          );
        })}
        {/* 출발/도착 마커 */}
        <circle cx={s.x} cy={s.y} r={15} fill="#ffffff" stroke="#007afc" strokeWidth={7} />
        <circle cx={g.x} cy={g.y} r={17} fill="#007afc" />
        <circle cx={g.x} cy={g.y} r={5} fill="#ffffff" />
      </svg>
    );
  }

  const durationMin = data ? Math.round(data.safe_route.distance_m / WALK_SPEED_M_PER_MIN) : 0;
  const distanceKm = data ? (data.safe_route.distance_m / 1000).toFixed(1) : "0";

  return (
    <main className="min-h-screen bg-[#0e1012] p-4 text-white md:p-8">
      <header className="mx-auto mb-7 flex max-w-7xl items-center justify-between">
        <a href="/" className="font-bold tracking-[0.12em]">SAFE WAY</a>
        <a href="/#route-planner" className="rounded-full border border-[#444d5a] px-5 py-3 text-sm font-bold transition hover:border-white">
          다시 검색
        </a>
      </header>

      <section className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[360px_1fr]">
        <aside className="rounded-3xl border border-[#23262d] bg-[#15171b] p-6">
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#566171]">AI SAFE ROUTE</p>
          <h1 className="mt-4 text-4xl leading-tight font-extrabold">안전 경로<br />분석 결과</h1>

          <div className="mt-7 rounded-xl bg-[#1c1f24] p-5">
            <p className="text-xs text-[#8b96aa]">출발지</p>
            <strong className="mt-2 block">{data?.start.name ?? start}</strong>
            <div className="ml-1.5 h-6 border-l border-dashed border-[#566171]" />
            <p className="text-xs text-[#8b96aa]">도착지</p>
            <strong className="mt-2 block">{data?.destination.name ?? destination}</strong>
          </div>

          {loading && (
            <div className="mt-4 rounded-xl bg-[#1c1f24] p-5 text-sm text-[#a0aaba]">
              경로를 분석하는 중입니다…
            </div>
          )}

          {error && (
            <div className="mt-4 whitespace-pre-line rounded-xl border border-red-400/30 bg-red-400/10 p-5 text-sm text-red-200">
              {error}
            </div>
          )}

          {data && (
            <>
              <div className="mt-4 rounded-xl bg-[#1c1f24] p-5">
                <p className="text-xs text-[#8b96aa]">AI 안전도</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <strong className="text-5xl text-[#007afc]">{data.safety_score}</strong>
                  <span className="text-[#8b96aa]">/ 100</span>
                  <span className="ml-auto rounded-md bg-[#007afc]/15 px-2 py-1 text-xs font-bold text-[#4da3ff]">
                    {data.ai.risk_level}
                  </span>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#333943]">
                  <div className="h-full rounded-full bg-[#007afc]" style={{ width: `${data.safety_score}%` }} />
                </div>
                <p className="mt-4 text-sm leading-6 text-[#a0aaba]">{data.ai.ai_comment}</p>
                <p className="mt-2 text-[10px] text-[#566171]">
                  분석: {data.ai.mode === "ai" ? "Claude AI" : "규칙 기반(키 없음)"} · 경로엔진: {data.engine}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#1c1f24] p-4">
                  <p className="text-xs text-[#8b96aa]">예상 시간</p>
                  <strong className="mt-2 block">{durationMin}분</strong>
                </div>
                <div className="rounded-xl bg-[#1c1f24] p-4">
                  <p className="text-xs text-[#8b96aa]">이동 거리</p>
                  <strong className="mt-2 block">{distanceKm}km</strong>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-[#1c1f24] p-5">
                <p className="mb-4 font-bold">경로 안전 비교</p>
                <p className="text-sm text-[#a0aaba]">· 안전 경로 위험구간 통과: {data.safe_route.passes_danger ? "있음" : "없음"}</p>
                <p className="text-sm text-[#a0aaba]">· 최단 경로 위험구간 통과: {data.shortest_route.passes_danger ? "있음" : "없음"}</p>
                <p className="text-sm text-[#a0aaba]">· 위험구간 최소 접근거리: {data.safe_route.min_dist_to_danger_m ?? "-"}m</p>
                <p className="mt-3 text-xs text-[#566171]">주변 위험구간 {data.danger_zones.length}곳 반영</p>
              </div>
            </>
          )}
        </aside>

        <section className="relative min-h-[650px] overflow-hidden rounded-3xl border border-[#23262d] bg-[#111419]">
          {mapSvg}
          {!data && !loading && (
            <div className="flex h-full items-center justify-center text-[#566171]">지도를 표시할 수 없습니다</div>
          )}
          <div className="absolute top-5 left-5 rounded-full bg-[#007afc] px-5 py-3 text-sm font-bold">추천 안전 경로</div>
          <div className="absolute right-5 bottom-5 rounded-xl border border-[#333943] bg-[#15171b]/95 p-5 text-sm leading-7 text-[#a0aaba] backdrop-blur">
            <p><span className="text-[#007afc]">━</span> 파란 실선: 추천 안전 경로</p>
            <p><span className="text-[#596473]">┅</span> 회색 점선: 최단 경로</p>
            <p><span className="text-[#ef4444]">●</span> 빨간 점: 위험 구간</p>
          </div>
        </section>
      </section>
    </main>
  );
}
