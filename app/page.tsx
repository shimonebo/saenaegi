"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const features = [
  {
    number: "01",
    title: "공사 구간 반영",
    description:
      "트램 공사로 폐쇄되거나 변경된 보행로를 분석해 위험 구간을 피합니다.",
  },
  {
    number: "02",
    title: "보행 안전 분석",
    description:
      "횡단보도, 보행로, 주변 밝기 등 어린이 보행에 필요한 요소를 비교합니다.",
  },
  {
    number: "03",
    title: "안전 경로 추천",
    description:
      "가장 짧은 길이 아니라 어린이가 더 안심하고 걸을 수 있는 길을 추천합니다.",
  },
];

const analysisStandards = [
  "어린이 보행 안전 우선",
  "트램 공사 구간 회피",
  "횡단보도와 밝은 길 우선",
];

export default function Home() {
  const router = useRouter();

  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [error, setError] = useState("");

  function scrollToPlanner() {
    document
      .getElementById("route-planner")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!start.trim() || !destination.trim()) {
      setError("출발지와 도착지를 모두 입력해주세요.");
      return;
    }

    setError("");

    router.push(
      `/route?start=${encodeURIComponent(start.trim())}&destination=${encodeURIComponent(
        destination.trim(),
      )}`,
    );
  }

  return (
    <main className="site">
      <nav className="navigation">
        <a href="#" className="brand" aria-label="Safe Way 홈">
          <span className="brand-symbol" aria-hidden="true">
            <span />
          </span>

          <span>SAFE WAY</span>
        </a>

        <div className="nav-links">
          <a href="#service">서비스 소개</a>
          <a href="#how-it-works">분석 방식</a>
          <a href="#route-planner">경로 찾기</a>
        </div>

        <button
          type="button"
          className="primary-button nav-button"
          onClick={scrollToPlanner}
        >
          경로 찾기
        </button>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            DAEJEON CHILD SAFE ROUTE
          </div>

          <h1>
            트램 공사 구간을 피해
            <br />
            아이에게 더 안전한
            <br />
            <span>귀가길을 찾아드려요.</span>
          </h1>

          <p className="hero-description">
            출발지와 도착지를 입력하면 AI가 공사 구간과 보행 위험 요소를
            분석해 어린이가 걷기 더 안전한 경로를 안내합니다.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={scrollToPlanner}
            >
              출발지·도착지 입력하기
              <span aria-hidden="true">↓</span>
            </button>

            <a href="#service" className="outline-button">
              서비스 알아보기
            </a>
          </div>

          <div className="hero-keywords">
            <span>공사 구간 회피</span>
            <span>어린이 보행 안전</span>
            <span>AI 경로 분석</span>
          </div>
        </div>

        <div className="map-card">
          <div className="map-toolbar">
            <div>
              <span className="map-label">ROUTE PREVIEW</span>
              <strong>안전 경로 예시</strong>
            </div>

            <span className="demo-badge">데모 화면</span>
          </div>

          <div className="map-visual">
            <svg
              viewBox="0 0 760 500"
              role="img"
              aria-label="트램 공사 구간을 우회하는 안전 경로 예시"
            >
              <rect width="760" height="500" fill="#111419" />

              <g
                fill="none"
                stroke="#252a31"
                strokeWidth="20"
                strokeLinecap="round"
              >
                <path d="M-30 92 C120 63 230 112 352 87 S590 22 800 54" />
                <path d="M-30 330 C115 290 230 342 370 298 S605 232 800 272" />
                <path d="M105 -30 C119 105 180 215 158 530" />
                <path d="M425 -30 C390 125 457 235 420 530" />
                <path d="M650 -30 C610 135 685 280 620 530" />
              </g>

              <g
                fill="none"
                stroke="#353c46"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M-30 92 C120 63 230 112 352 87 S590 22 800 54" />
                <path d="M-30 330 C115 290 230 342 370 298 S605 232 800 272" />
                <path d="M105 -30 C119 105 180 215 158 530" />
                <path d="M425 -30 C390 125 457 235 420 530" />
                <path d="M650 -30 C610 135 685 280 620 530" />
              </g>

              <g fill="#181c21" stroke="#262c34">
                <rect x="200" y="135" width="128" height="82" rx="10" />
                <rect x="475" y="100" width="105" height="105" rx="10" />
                <rect x="203" y="366" width="145" height="76" rx="10" />
                <rect x="487" y="342" width="96" height="78" rx="10" />
                <rect x="34" y="180" width="78" height="90" rx="10" />
              </g>

              <path
                d="M113 403 C180 374 222 346 280 308 C340 268 355 226 411 205 C470 183 521 213 574 170 C613 138 628 104 655 78"
                fill="none"
                stroke="#007afc"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M285 308 C326 334 366 354 410 359"
                fill="none"
                stroke="#596473"
                strokeWidth="6"
                strokeDasharray="9 12"
                strokeLinecap="round"
              />

              <circle
                cx="113"
                cy="403"
                r="14"
                fill="#ffffff"
                stroke="#007afc"
                strokeWidth="7"
              />

              <circle cx="655" cy="78" r="16" fill="#007afc" />
              <circle cx="655" cy="78" r="5" fill="#ffffff" />

              <g transform="translate(360 337)">
                <rect width="120" height="38" rx="6" fill="#1c2128" />

                <text
                  x="60"
                  y="24"
                  textAnchor="middle"
                  fill="#a0aaba"
                  fontSize="12"
                  fontWeight="600"
                >
                  공사 구간 회피
                </text>
              </g>

              <g transform="translate(512 147)">
                <rect width="120" height="42" rx="21" fill="#007afc" />

                <text
                  x="60"
                  y="26"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="700"
                >
                  안전도 예시 94
                </text>
              </g>

              <g fill="#687485" fontSize="12" fontWeight="500">
                <text x="180" y="72">
                  둔산대로
                </text>
                <text x="450" y="294">
                  한밭대로
                </text>
                <text x="34" y="310">
                  출발지
                </text>
                <text x="625" y="48">
                  도착지
                </text>
              </g>
            </svg>

            <div className="map-gradient" />

            <div className="map-summary">
              <div className="route-place">
                <span className="place-dot start-dot" />

                <div>
                  <small>출발지 예시</small>
                  <strong>대전서원초등학교</strong>
                </div>
              </div>

              <span className="route-connector" />

              <div className="route-place">
                <span className="place-dot destination-dot" />

                <div>
                  <small>도착지 예시</small>
                  <strong>둔산동 보라아파트</strong>
                </div>
              </div>

              <div className="route-meta">
                <span>도보 14분</span>
                <span>1.1km</span>
                <strong>안전도 94</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="process-rail" aria-label="서비스 이용 순서">
        <div className="process-item">
          <span>01</span>

          <div>
            <strong>장소 입력</strong>
            <p>출발지와 도착지를 입력합니다.</p>
          </div>
        </div>

        <div className="process-arrow" aria-hidden="true">
          →
        </div>

        <div className="process-item">
          <span>02</span>

          <div>
            <strong>위험 요소 분석</strong>
            <p>공사 구간과 보행 환경을 비교합니다.</p>
          </div>
        </div>

        <div className="process-arrow" aria-hidden="true">
          →
        </div>

        <div className="process-item">
          <span>03</span>

          <div>
            <strong>안전 경로 확인</strong>
            <p>추천 경로와 주의 구간을 확인합니다.</p>
          </div>
        </div>
      </section>

      <section className="service-section" id="service">
        <div className="section-heading">
          <div>
            <span className="section-label">WHY SAFE WAY</span>

            <h2>
              가장 빠른 길보다
              <br />
              가장 안심되는 길
            </h2>
          </div>

          <p>
            트램 공사로 길이 달라지면 기존 지도는 어린이의 실제 보행 위험을
            충분히 설명하지 못할 수 있습니다. Safe Way는 공사 정보와 보행
            안전 요소를 함께 비교합니다.
          </p>
        </div>

        <div className="feature-grid" id="how-it-works">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>

              <div className="feature-visual" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="feature-action">
          <button
            type="button"
            className="primary-button"
            onClick={scrollToPlanner}
          >
            직접 안전 경로 찾아보기
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </section>

      <section className="planner-section" id="route-planner">
        <div className="planner-copy">
          <span className="section-label">SAFE ROUTE SEARCH</span>

          <h2>
            출발지와 도착지만
            <br />
            입력하세요.
          </h2>

          <p>
            입력한 장소를 기준으로 공사 구간과 어린이 보행 위험 요소를
            분석한 뒤 경로 결과 화면으로 이동합니다.
          </p>

          <div className="planner-flow">
            <div>
              <span>1</span>
              장소 입력
            </div>

            <div>
              <span>2</span>
              AI 안전 분석
            </div>

            <div>
              <span>3</span>
              결과 확인
            </div>
          </div>
        </div>

        <form className="planner-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <div>
              <span className="form-status-dot" />
              경로 분석 준비
            </div>

            <span>DAEJEON · KR</span>
          </div>

          <label htmlFor="start">출발지</label>

          <div className="input-wrap">
            <span className="input-marker start-marker" />

            <input
              id="start"
              type="text"
              value={start}
              onChange={(event) => {
                setStart(event.target.value);
                setError("");
              }}
              placeholder="예: 대전서원초등학교"
              autoComplete="off"
            />
          </div>

          <div className="input-connector" />

          <label htmlFor="destination">도착지</label>

          <div className="input-wrap">
            <span className="input-marker destination-marker" />

            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(event) => {
                setDestination(event.target.value);
                setError("");
              }}
              placeholder="예: 둔산동 보라아파트"
              autoComplete="off"
            />
          </div>

          <div className="analysis-guide">
            <p>AI가 다음 항목을 기본으로 분석합니다.</p>

            <div className="analysis-items">
              {analysisStandards.map((standard) => (
                <div key={standard}>
                  <span aria-hidden="true">✓</span>
                  {standard}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="search-button">
            안전 경로 분석하기
            <span aria-hidden="true">→</span>
          </button>

          <p className="form-help">
            현재 경로 결과는 서비스 시연을 위한 예시 데이터로 표시됩니다.
          </p>
        </form>
      </section>

      <footer>
        <a href="#" className="brand footer-brand">
          <span className="brand-symbol" aria-hidden="true">
            <span />
          </span>

          <span>SAFE WAY</span>
        </a>

        <p>
          AI 기술을 활용한 대전 트램 공사 구간 어린이 안심 귀가 서비스
        </p>

        <span>© 2026 SAFE WAY TEAM</span>
      </footer>
    </main>
  );
}