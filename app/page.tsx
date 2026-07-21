"use client";

import { useState, type FormEvent } from "react";

const features = [
  {
    number: "01",
    title: "공사 구간 반영",
    description:
      "대전 트램 공사로 폐쇄되거나 변경된 보행로를 확인해 위험 구간을 피합니다.",
  },
  {
    number: "02",
    title: "어린이 보행 안전 분석",
    description:
      "횡단보도, 보행로, 주변 밝기 등 어린이 보행에 필요한 요소를 분석합니다.",
  },
  {
    number: "03",
    title: "안전 경로 추천",
    description:
      "가장 짧은 길보다 어린이가 더 안심하고 걸을 수 있는 경로를 추천합니다.",
  },
];

const safetyStandards = [
  "어린이 보행 안전 우선",
  "트램 공사 구간 회피",
  "횡단보도와 밝은 길 우선",
];

export default function Home() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedStart = start.trim();
    const trimmedDestination = destination.trim();

    if (!trimmedStart || !trimmedDestination) {
      setError("출발지와 도착지를 모두 입력해주세요.");
      return;
    }

    setError("");

    window.location.href =
      `/route?start=${encodeURIComponent(trimmedStart)}` +
      `&destination=${encodeURIComponent(trimmedDestination)}`;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#0e1012] text-white">
      <header className="mx-auto flex h-20 w-[calc(100%-32px)] max-w-7xl items-center justify-between border-b border-[#1c1f24] md:w-[calc(100%-48px)]">
        <a
          href="#"
          className="flex items-center gap-3 font-bold tracking-[0.12em]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#333943]">
            <span className="h-2 w-2 rounded-full bg-[#007afc]" />
          </span>

          SAFE WAY
        </a>

        <nav className="hidden items-center gap-8 text-sm text-[#a0aaba] md:flex">
          <a href="#service" className="transition hover:text-white">
            서비스 소개
          </a>

          <a href="#how-it-works" className="transition hover:text-white">
            분석 방식
          </a>

          <a href="#route-planner" className="transition hover:text-white">
            경로 찾기
          </a>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-80px)] w-[calc(100%-32px)] max-w-7xl items-center gap-14 py-16 md:w-[calc(100%-48px)] lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div>
          <div className="mb-7 flex items-center gap-3 text-xs font-bold tracking-[0.18em] text-[#566171]">
            <span className="h-2 w-2 rounded-full bg-[#007afc]" />
            DAEJEON CHILD SAFE ROUTE
          </div>

          <h1 className="text-5xl leading-[1.05] font-extrabold tracking-[-0.05em] md:text-6xl xl:text-7xl">
            트램 공사 구간을 피해
            <br />
            아이에게 더 안전한
            <br />
            <span className="text-[#007afc]">귀가길을 찾아드려요.</span>
          </h1>

          <p className="mt-8 max-w-xl text-base leading-8 text-[#a0aaba] md:text-lg">
            출발지와 도착지를 입력하면 AI가 공사 구간과 보행 위험 요소를
            분석해 어린이가 걷기 더 안전한 경로를 안내합니다.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#route-planner"
              className="inline-flex min-h-13 items-center justify-center gap-3 rounded-full bg-[#007afc] px-7 font-bold transition hover:bg-[#1686ff]"
            >
              출발지·도착지 입력하기
              <span>↓</span>
            </a>

            <a
              href="#service"
              className="inline-flex min-h-13 items-center justify-center rounded-full border border-[#444d5a] px-7 font-bold transition hover:border-white"
            >
              서비스 알아보기
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {["공사 구간 회피", "어린이 보행 안전", "AI 경로 분석"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#23262d] px-4 py-2 text-xs text-[#8b96aa]"
                >
                  {item}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#252a31] bg-[#15171b] shadow-2xl">
          <div className="flex h-20 items-center justify-between px-6">
            <div>
              <p className="text-[10px] font-bold tracking-[0.18em] text-[#566171]">
                ROUTE PREVIEW
              </p>

              <strong className="mt-1 block text-sm">안전 경로 예시</strong>
            </div>

            <span className="rounded-md bg-[#1c1f24] px-3 py-2 text-[10px] font-bold text-[#8b96aa]">
              데모 화면
            </span>
          </div>

          <div className="relative h-[470px] bg-[#111419]">
            <svg
              viewBox="0 0 760 500"
              className="h-full w-full"
              role="img"
              aria-label="공사 구간을 우회하는 안전 경로 예시"
            >
              <rect width="760" height="500" fill="#111419" />

              <g
                fill="none"
                stroke="#252a31"
                strokeWidth="22"
                strokeLinecap="round"
              >
                <path d="M-30 92 C120 63 230 112 352 87 S590 22 800 54" />
                <path d="M-30 330 C115 290 230 342 370 298 S605 232 800 272" />
                <path d="M105 -30 C119 105 180 215 158 530" />
                <path d="M425 -30 C390 125 457 235 420 530" />
                <path d="M650 -30 C610 135 685 280 620 530" />
              </g>

              <g fill="#181c21" stroke="#303640">
                <rect x="200" y="135" width="128" height="82" rx="10" />
                <rect x="475" y="100" width="105" height="105" rx="10" />
                <rect x="203" y="366" width="145" height="76" rx="10" />
                <rect x="487" y="342" width="96" height="78" rx="10" />
              </g>

              <path
                d="M113 403 C180 374 222 346 280 308 C340 268 355 226 411 205 C470 183 521 213 574 170 C613 138 628 104 655 78"
                fill="none"
                stroke="#007afc"
                strokeWidth="11"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M285 308 C326 334 366 354 410 359"
                fill="none"
                stroke="#596473"
                strokeWidth="7"
                strokeDasharray="10 13"
                strokeLinecap="round"
              />

              <circle
                cx="113"
                cy="403"
                r="15"
                fill="#ffffff"
                stroke="#007afc"
                strokeWidth="7"
              />

              <circle cx="655" cy="78" r="17" fill="#007afc" />
              <circle cx="655" cy="78" r="5" fill="#ffffff" />

              <g transform="translate(355 338)">
                <rect width="130" height="40" rx="8" fill="#1c2128" />

                <text
                  x="65"
                  y="25"
                  textAnchor="middle"
                  fill="#a0aaba"
                  fontSize="12"
                  fontWeight="600"
                >
                  트램 공사 우회
                </text>
              </g>
            </svg>

            <div className="absolute right-5 bottom-5 left-5 rounded-2xl border border-[#333943] bg-[#15171b]/95 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full border-[3px] border-[#007afc] bg-white" />

                <div>
                  <p className="text-[10px] text-[#566171]">출발지 예시</p>
                  <strong className="text-sm">대전서원초등학교</strong>
                </div>
              </div>

              <div className="ml-[5px] h-5 border-l border-dashed border-[#444d5a]" />

              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-[#007afc]" />

                <div>
                  <p className="text-[10px] text-[#566171]">도착지 예시</p>
                  <strong className="text-sm">둔산동 보라아파트</strong>
                </div>
              </div>

              <div className="mt-4 flex gap-4 border-t border-[#23262d] pt-4 text-xs text-[#8b96aa]">
                <span>도보 14분</span>
                <span>1.1km</span>
                <strong className="ml-auto text-[#007afc]">안전도 94</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="service"
        className="mx-auto w-[calc(100%-32px)] max-w-7xl py-24 md:w-[calc(100%-48px)] md:py-32"
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.18em] text-[#566171]">
              WHY SAFE WAY
            </p>

            <h2 className="mt-5 text-4xl leading-tight font-extrabold tracking-[-0.04em] md:text-6xl">
              가장 빠른 길보다
              <br />
              가장 안심되는 길
            </h2>
          </div>

          <p className="max-w-xl text-base leading-8 text-[#a0aaba]">
            Safe Way는 트램 공사 정보와 어린이 보행 환경을 함께 분석합니다.
            공사로 달라진 길에서도 보호자가 이해하기 쉬운 안전 경로를
            제공합니다.
          </p>
        </div>

        <div
          id="how-it-works"
          className="mt-14 grid gap-4 md:grid-cols-3"
        >
          {features.map((feature) => (
            <article
              key={feature.number}
              className="min-h-80 rounded-3xl border border-transparent bg-[#15171b] p-7 transition hover:-translate-y-1 hover:border-[#333943]"
            >
              <span className="text-xs font-bold tracking-[0.15em] text-[#566171]">
                {feature.number}
              </span>

              <div className="mt-12 flex h-16 w-16 items-center justify-center rounded-full border border-[#333943]">
                <span className="h-4 w-4 rounded-full bg-[#007afc]" />
              </div>

              <h3 className="mt-8 text-2xl font-bold">{feature.title}</h3>

              <p className="mt-4 text-sm leading-7 text-[#a0aaba]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#route-planner"
            className="inline-flex min-h-13 items-center justify-center gap-4 rounded-full bg-[#007afc] px-8 font-bold transition hover:bg-[#1686ff]"
          >
            직접 안전 경로 찾아보기
            <span>→</span>
          </a>
        </div>
      </section>

      <section
        id="route-planner"
        className="mx-auto mb-24 grid w-[calc(100%-32px)] max-w-7xl gap-14 rounded-3xl bg-[#15171b] p-6 md:w-[calc(100%-48px)] md:p-12 lg:grid-cols-[0.85fr_1.15fr] lg:p-20"
      >
        <div>
          <p className="text-xs font-bold tracking-[0.18em] text-[#566171]">
            SAFE ROUTE SEARCH
          </p>

          <h2 className="mt-5 text-4xl leading-tight font-extrabold tracking-[-0.04em] md:text-6xl">
            출발지와 도착지만
            <br />
            입력하세요.
          </h2>

          <p className="mt-7 max-w-lg leading-8 text-[#a0aaba]">
            입력한 장소를 기준으로 공사 구간과 어린이 보행 위험 요소를
            분석한 뒤 결과 페이지로 이동합니다.
          </p>

          <div className="mt-9 space-y-4 text-sm text-[#a0aaba]">
            <p>
              <span className="mr-3 text-[#007afc]">01</span>
              출발지와 도착지 입력
            </p>

            <p>
              <span className="mr-3 text-[#007afc]">02</span>
              AI 안전 요소 분석
            </p>

            <p>
              <span className="mr-3 text-[#007afc]">03</span>
              추천 경로 결과 확인
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-[#333943] bg-[#0e1012] p-5 md:p-8"
        >
          <div className="mb-7 flex items-center justify-between border-b border-[#23262d] pb-5 text-[10px] font-bold tracking-[0.13em] text-[#566171]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#007afc]" />
              경로 분석 준비
            </span>

            <span>DAEJEON · KR</span>
          </div>

          <label
            htmlFor="start"
            className="mb-2 block text-xs font-bold text-[#8b96aa]"
          >
            출발지
          </label>

          <div className="flex h-15 items-center gap-4 rounded-lg border border-[#333943] bg-[#15171b] px-4 focus-within:border-[#007afc]">
            <span className="h-3 w-3 rounded-full border-[3px] border-[#007afc] bg-white" />

            <input
              id="start"
              type="text"
              value={start}
              onChange={(event) => {
                setStart(event.target.value);
                setError("");
              }}
              placeholder="예: 대전서원초등학교"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#566171]"
            />
          </div>

          <div className="ml-[21px] h-6 border-l border-dashed border-[#444d5a]" />

          <label
            htmlFor="destination"
            className="mb-2 block text-xs font-bold text-[#8b96aa]"
          >
            도착지
          </label>

          <div className="flex h-15 items-center gap-4 rounded-lg border border-[#333943] bg-[#15171b] px-4 focus-within:border-[#007afc]">
            <span className="h-3 w-3 rounded-full bg-[#007afc]" />

            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                setError("");
              }}
              placeholder="예: 둔산동 보라아파트"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#566171]"
            />
          </div>

          <div className="mt-6 rounded-xl border border-[#23262d] bg-[#15171b] p-5">
            <p className="mb-4 text-xs font-bold text-[#8b96aa]">
              AI가 다음 항목을 기본으로 분석합니다.
            </p>

            <div className="space-y-3">
              {safetyStandards.map((standard) => (
                <p
                  key={standard}
                  className="flex items-center gap-3 text-xs font-semibold text-[#a0aaba]"
                >
                  <span className="text-[#007afc]">✓</span>
                  {standard}
                </p>
              ))}
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="mt-6 flex min-h-14 w-full items-center justify-between rounded-full bg-[#007afc] px-6 font-bold transition hover:bg-[#1686ff]"
          >
            안전 경로 분석하기
            <span>→</span>
          </button>

          <p className="mt-4 text-center text-[10px] text-[#566171]">
            현재 결과는 서비스 시연을 위한 예시 데이터입니다.
          </p>
        </form>
      </section>

      <footer className="mx-auto flex min-h-48 w-[calc(100%-32px)] max-w-7xl flex-col justify-center gap-5 border-t border-[#1c1f24] text-xs text-[#566171] md:w-[calc(100%-48px)] md:flex-row md:items-center md:justify-between">
        <strong className="tracking-[0.12em] text-white">SAFE WAY</strong>

        <p>대전 트램 공사 구간 어린이 안심 귀가 서비스</p>

        <span>© 2026 SAFE WAY TEAM</span>
      </footer>
    </main>
  );
}