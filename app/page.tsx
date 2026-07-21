"use client";

import { FormEvent, useState } from "react";

const features = [
  {
    number: "01",
    title: "공사 구간 실시간 반영",
    description:
      "트램 공사로 폐쇄되거나 변경된 보행로를 경로 추천에 반영합니다.",
  },
  {
    number: "02",
    title: "AI 안전 경로 분석",
    description:
      "통행량, 횡단보도, 조도와 공사 위험도를 종합해 안전 점수를 계산합니다.",
  },
  {
    number: "03",
    title: "보호자 귀가 공유",
    description:
      "아동의 이동 상태와 예상 도착 시간을 보호자가 확인할 수 있습니다.",
  },
];

const stats = [
  { value: "12", label: "반영된 공사 구간" },
  { value: "94%", label: "추천 경로 안전도" },
  { value: "3분", label: "평균 우회 시간" },
];

export default function Home() {
  const [start, setStart] = useState("");
  const [destination, setDestination] = useState("");
  const [result, setResult] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!start.trim() || !destination.trim()) {
      setResult("출발지와 도착지를 모두 입력해주세요.");
      return;
    }

    setResult(
      `${start}에서 ${destination}까지 공사 구간을 피해 안전 경로를 분석했습니다.`,
    );
  }

  function scrollToPlanner() {
    document
      .getElementById("route-planner")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main className="site">
      <nav className="navigation">
        <a href="#" className="brand" aria-label="Safe Way 홈">
          <span className="brand-symbol">
            <span />
          </span>

          <span>SAFE WAY</span>
        </a>

        <div className="nav-links">
          <a href="#service">서비스</a>
          <a href="#technology">AI 기술</a>
          <a href="#route-planner">경로 찾기</a>
        </div>

        <div className="nav-actions">
  <button
    className="primary-button small-button"
    type="button"
    onClick={scrollToPlanner}
  >
    경로 찾기
  </button>
</div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="live-dot" />
            DAEJEON SAFE ROUTE SYSTEM
          </div>

          <h1>
            공사로 달라진 길,
            <br />
            아이에게는
            <br />
            <span>더 안전하게.</span>
          </h1>

          <p className="hero-description">
            대전 트램 공사로 계속 변하는 통학로를 AI가 분석해 어린이에게
            더 안전한 귀가 경로를 안내합니다.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={scrollToPlanner}
            >
              안전 경로 찾기
              <span aria-hidden="true">↗</span>
            </button>

            <a className="outline-button" href="#service">
              서비스 알아보기
            </a>
          </div>

          <div className="hero-note">
            <span>AI ROUTE ENGINE</span>
            <span>·</span>
            <span>DAEJEON TRAM DATA</span>
            <span>·</span>
            <span>LIVE SAFETY SCORE</span>
          </div>
        </div>

        <div className="map-card">
          <div className="map-toolbar">
            <div>
              <span className="map-label">LIVE SAFETY MAP</span>
              <strong>대전 둔산권역</strong>
            </div>

            <div className="map-status">
              <span />
              데이터 연결됨
            </div>
          </div>

          <div className="map-visual">
            <svg
              viewBox="0 0 760 460"
              role="img"
              aria-label="안전 경로가 표시된 지도 예시"
            >
              <rect width="760" height="460" fill="#111419" />

              <g
                fill="none"
                stroke="#252a31"
                strokeWidth="18"
                strokeLinecap="round"
              >
                <path d="M-20 94 C130 70 205 108 342 89 S590 22 790 47" />
                <path d="M-30 308 C121 276 236 313 355 280 S576 222 790 257" />
                <path d="M106 -20 C122 102 178 197 162 480" />
                <path d="M424 -20 C386 95 449 181 422 480" />
                <path d="M645 -20 C601 117 675 230 620 480" />
              </g>

              <g
                fill="none"
                stroke="#343b45"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M-20 94 C130 70 205 108 342 89 S590 22 790 47" />
                <path d="M-30 308 C121 276 236 313 355 280 S576 222 790 257" />
                <path d="M106 -20 C122 102 178 197 162 480" />
                <path d="M424 -20 C386 95 449 181 422 480" />
                <path d="M645 -20 C601 117 675 230 620 480" />
              </g>

              <g fill="#181c21" stroke="#242a31" strokeWidth="1">
                <rect x="202" y="130" width="132" height="84" rx="10" />
                <rect x="468" y="94" width="108" height="102" rx="10" />
                <rect x="205" y="340" width="142" height="72" rx="10" />
                <rect x="486" y="316" width="94" height="74" rx="10" />
                <rect x="35" y="174" width="74" height="84" rx="10" />
              </g>

              <path
                d="M116 361 C180 334 225 322 276 290 C338 251 344 216 403 194 C456 175 510 206 566 164 C601 137 617 104 648 79"
                fill="none"
                stroke="#007afc"
                strokeWidth="9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M281 289 C322 311 359 332 401 336"
                fill="none"
                stroke="#596473"
                strokeWidth="5"
                strokeDasharray="8 11"
                strokeLinecap="round"
              />

              <g>
                <circle
                  cx="116"
                  cy="361"
                  r="13"
                  fill="#ffffff"
                  stroke="#007afc"
                  strokeWidth="7"
                />
                <circle cx="648" cy="79" r="15" fill="#007afc" />
                <circle cx="648" cy="79" r="5" fill="#ffffff" />
              </g>

              <g transform="translate(366 318)">
                <rect width="104" height="36" rx="6" fill="#1c2128" />
                <text
                  x="52"
                  y="23"
                  textAnchor="middle"
                  fill="#a0aaba"
                  fontSize="12"
                  fontWeight="600"
                >
                  공사 우회 구간
                </text>
              </g>

              <g transform="translate(508 145)">
                <rect width="118" height="40" rx="20" fill="#007afc" />
                <text
                  x="59"
                  y="25"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="700"
                >
                  안전 경로 94
                </text>
              </g>

              <g fill="#687485" fontSize="12" fontWeight="500">
                <text x="184" y="74">
                  둔산대로
                </text>
                <text x="446" y="274">
                  한밭대로
                </text>
                <text x="45" y="290">
                  서원초등학교
                </text>
                <text x="610" y="51">
                  보라아파트
                </text>
              </g>
            </svg>

            <div className="map-gradient" />

            <div className="map-floating-card safety-card">
              <span className="floating-label">SAFETY SCORE</span>

              <div className="score-row">
                <strong>94</strong>
                <span>/ 100</span>
              </div>

              <div className="score-bar">
                <span />
              </div>
            </div>

            <div className="map-floating-card route-card">
              <div>
                <span className="route-dot start-dot" />
                <p>대전서원초등학교</p>
              </div>

              <span className="route-line" />

              <div>
                <span className="route-dot end-dot" />
                <p>둔산동 보라아파트</p>
              </div>

              <div className="route-summary">
                <span>도보 14분</span>
                <span>·</span>
                <span>1.1km</span>
                <span>·</span>
                <strong>안전</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section" aria-label="서비스 주요 지표">
        {stats.map((stat) => (
          <div className="stat-item" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="feature-section" id="service">
        <div className="section-heading">
          <div>
            <span className="section-label">HOW IT WORKS</span>
            <h2>
              가장 빠른 길보다
              <br />
              가장 안심되는 길
            </h2>
          </div>

          <p>
            Safe Way는 공사 정보와 생활 안전 데이터를 함께 분석합니다.
            어린이가 실제로 걷게 될 길을 기준으로 위험 요소를 비교합니다.
          </p>
        </div>

        <div className="feature-grid" id="technology">
          {features.map((feature) => (
            <article className="feature-card" key={feature.number}>
              <span className="feature-number">{feature.number}</span>

              <div className="feature-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>

              <a href="#route-planner">
                자세히 보기
                <span>↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="planner-section" id="route-planner">
        <div className="planner-copy">
          <span className="section-label">ROUTE PLANNER</span>

          <h2>
            지금,
            <br />
            안전한 귀가 경로를
            <br />
            확인하세요.
          </h2>

          <p>
            출발지와 도착지를 입력하면 트램 공사 구간을 고려한 안전 경로를
            추천합니다.
          </p>
        </div>

        <form className="planner-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <div>
              <span className="form-status-dot" />
              경로 분석 준비됨
            </div>

            <span>DAEJEON · KR</span>
          </div>

          <label htmlFor="start">출발지</label>

          <div className="input-wrap">
            <span className="input-marker start-marker" />

            <input
              id="start"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              placeholder="출발지를 입력하세요"
            />
          </div>

          <div className="input-connector" />

          <label htmlFor="destination">도착지</label>

          <div className="input-wrap">
            <span className="input-marker destination-marker" />

            <input
              id="destination"
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="도착지를 입력하세요"
            />
          </div>

          <div className="filter-row">
            <button type="button" className="filter-chip active">
              어린이 우선
            </button>

            <button type="button" className="filter-chip">
              공사 구간 회피
            </button>

            <button type="button" className="filter-chip">
              밝은 길 우선
            </button>
          </div>

          <button className="search-button" type="submit">
            안전 경로 분석하기
            <span>→</span>
          </button>

          {result && <div className="search-result">{result}</div>}
        </form>
      </section>

      <footer>
        <a href="#" className="brand footer-brand">
          <span className="brand-symbol">
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