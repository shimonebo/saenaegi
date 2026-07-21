
import Link from "next/link";

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
  avoidedConstructionCount: 1,
  risks: [
    "트램 공사 구간 1곳",
    "임시 보행로 2곳",
    "조도가 낮은 구간 1곳",
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
    <main
      style={{
        minHeight: "100vh",
        padding: "28px",
        background: "#0e1012",
        color: "#ffffff",
        fontFamily:
          "Pretendard, Arial, sans-serif",
      }}
    >
      <header
        style={{
          maxWidth: "1344px",
          margin: "0 auto 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 800,
            textDecoration: "none",
            letterSpacing: "0.08em",
          }}
        >
          SAFE WAY
        </Link>

        <Link
          href="/#route-planner"
          style={{
            padding: "12px 22px",
            border: "1px solid #bbc2ce",
            borderRadius: "100px",
            color: "#ffffff",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          다시 검색
        </Link>
      </header>

      <section
        style={{
          maxWidth: "1344px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns:
            "minmax(280px, 360px) minmax(0, 1fr)",
          gap: "20px",
        }}
      >
        <aside
          style={{
            padding: "28px",
            border: "1px solid #23262d",
            borderRadius: "24px",
            background: "#15171b",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#566171",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.2em",
            }}
          >
            AI SAFE ROUTE
          </p>

          <h1
            style={{
              margin: "16px 0 28px",
              fontSize: "36px",
              lineHeight: 1.12,
              letterSpacing: "-0.04em",
            }}
          >
            안전 경로
            <br />
            분석 결과
          </h1>

          <div
            style={{
              padding: "18px",
              borderRadius: "12px",
              background: "#1c1f24",
            }}
          >
            <p
              style={{
                margin: "0 0 7px",
                color: "#8b96aa",
                fontSize: "12px",
              }}
            >
              출발지
            </p>

            <strong>{start}</strong>

            <div
              style={{
                height: "23px",
                margin: "5px 0 5px 5px",
                borderLeft: "1px dashed #566171",
              }}
            />

            <p
              style={{
                margin: "0 0 7px",
                color: "#8b96aa",
                fontSize: "12px",
              }}
            >
              도착지
            </p>

            <strong>{destination}</strong>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "21px",
              borderRadius: "12px",
              background: "#1c1f24",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#8b96aa",
                fontSize: "12px",
              }}
            >
              AI 안전도
            </p>

            <div
              style={{
                marginTop: "5px",
                display: "flex",
                alignItems: "baseline",
                gap: "5px",
              }}
            >
              <strong
                style={{
                  color: "#007afc",
                  fontSize: "48px",
                  letterSpacing: "-0.05em",
                }}
              >
                {mockResult.safetyScore}
              </strong>

              <span style={{ color: "#8b96aa" }}>
                / 100
              </span>
            </div>

            <div
              style={{
                height: "5px",
                overflow: "hidden",
                borderRadius: "100px",
                background: "#333943",
              }}
            >
              <div
                style={{
                  width: `${mockResult.safetyScore}%`,
                  height: "100%",
                  borderRadius: "100px",
                  background: "#007afc",
                }}
              />
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div
              style={{
                padding: "17px",
                borderRadius: "12px",
                background: "#1c1f24",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#8b96aa",
                  fontSize: "12px",
                }}
              >
                예상 시간
              </p>

              <strong
                style={{
                  display: "block",
                  marginTop: "8px",
                }}
              >
                {mockResult.duration}분
              </strong>
            </div>

            <div
              style={{
                padding: "17px",
                borderRadius: "12px",
                background: "#1c1f24",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#8b96aa",
                  fontSize: "12px",
                }}
              >
                이동 거리
              </p>

              <strong
                style={{
                  display: "block",
                  marginTop: "8px",
                }}
              >
                {mockResult.distance}km
              </strong>
            </div>
          </div>

          <div
            style={{
              marginTop: "16px",
              padding: "18px",
              borderRadius: "12px",
              background: "#1c1f24",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                fontWeight: 700,
              }}
            >
              회피한 위험 요소
            </p>

            {mockResult.risks.map((risk) => (
              <p
                key={risk}
                style={{
                  margin: "9px 0",
                  color: "#a0aaba",
                  fontSize: "14px",
                }}
              >
                · {risk}
              </p>
            ))}
          </div>
        </aside>

        <section
          style={{
            position: "relative",
            minHeight: "720px",
            overflow: "hidden",
            border: "1px solid #23262d",
            borderRadius: "24px",
            background: "#111419",
          }}
        >
          <svg
            viewBox="0 0 900 720"
            aria-label="추천 안전 경로 지도 예시"
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          >
            <rect
              width="900"
              height="720"
              fill="#111419"
            />

            <g
              fill="none"
              stroke="#252a31"
              strokeWidth="25"
              strokeLinecap="round"
            >
              <path d="M-30 160 C180 100 320 180 470 130 S720 40 950 80" />
              <path d="M-30 510 C180 450 320 540 500 470 S720 390 950 430" />
              <path d="M180 -30 C190 160 250 350 220 760" />
              <path d="M520 -30 C470 190 560 360 510 760" />
              <path d="M770 -30 C720 200 810 410 750 760" />
            </g>

            <g
              fill="none"
              stroke="#363d47"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M-30 160 C180 100 320 180 470 130 S720 40 950 80" />
              <path d="M-30 510 C180 450 320 540 500 470 S720 390 950 430" />
              <path d="M180 -30 C190 160 250 350 220 760" />
              <path d="M520 -30 C470 190 560 360 510 760" />
              <path d="M770 -30 C720 200 810 410 750 760" />
            </g>

            <path
              d="M160 590 C240 540 300 505 360 450 C430 385 450 310 540 275 C630 240 680 200 745 115"
              fill="none"
              stroke="#007afc"
              strokeWidth="12"
              strokeLinecap="round"
            />

            <path
              d="M365 450 C410 485 455 515 520 525"
              fill="none"
              stroke="#596473"
              strokeWidth="7"
              strokeDasharray="12 14"
              strokeLinecap="round"
            />

            <circle
              cx="160"
              cy="590"
              r="17"
              fill="#ffffff"
              stroke="#007afc"
              strokeWidth="8"
            />

            <circle
              cx="745"
              cy="115"
              r="19"
              fill="#007afc"
            />

            <circle
              cx="745"
              cy="115"
              r="6"
              fill="#ffffff"
            />

            <g transform="translate(430 492)">
              <rect
                width="150"
                height="42"
                rx="6"
                fill="#1c1f24"
              />

              <text
                x="75"
                y="26"
                textAnchor="middle"
                fill="#a0aaba"
                fontSize="13"
              >
                트램 공사 우회
              </text>
            </g>
          </svg>

          <div
            style={{
              position: "absolute",
              top: "24px",
              left: "24px",
              padding: "13px 20px",
              borderRadius: "100px",
              background: "#007afc",
              fontSize: "14px",
              fontWeight: 700,
            }}
          >
            추천 안전 경로
          </div>

          <div
            style={{
              position: "absolute",
              right: "24px",
              bottom: "24px",
              padding: "17px 21px",
              border: "1px solid #333943",
              borderRadius: "12px",
              background: "rgba(21, 23, 27, 0.94)",
              color: "#a0aaba",
              fontSize: "13px",
              lineHeight: 1.7,
            }}
          >
            파란색 실선: 추천 경로
            <br />
            회색 점선: 회피한 공사 구간
          </div>
        </section>
      </section>
    </main>
  );
}