export type Coordinate = {
  lat: number;
  lng: number;
};

export type BackendRoute = {
  coords: Coordinate[];
  distance_m: number;
  passes_danger: boolean;
};

export type DangerZone = {
  lat: number;
  lng: number;
  risk_level?: string;
  name?: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
};

export type TeamBackendResponse = {
  success: boolean;
  app_mode: string;
  origin: Coordinate;
  destination: Coordinate;
  danger_zones: DangerZone[];
  shortest_route: BackendRoute;
  safe_route: BackendRoute;
  message: string;
};

export type FrontRouteRisk = {
  title: string;
  level: "LOW" | "CAUTION" | "DANGER";
  description: string;
};

export type FrontRouteResult = {
  start: string;
  destination: string;
  safetyScore: number;
  duration: number;
  distance: number;
  avoidedConstructionCount: number;
  summary: string;
  risks: FrontRouteRisk[];
  path: Coordinate[];
  shortestPath: Coordinate[];
  routeId: string;
};

const DEMO_LOCATIONS: Record<string, string> = {
  "대전서원초등학교": "127.3760,36.3500",
  "서원초등학교": "127.3760,36.3500",
  "대전서원초": "127.3760,36.3500",
  "둔산동 보라아파트": "127.3820,36.3560",
  "보라아파트": "127.3820,36.3560",
  "대전시청": "127.3848,36.3504",
  "시청역": "127.3848,36.3513",
};

function normalizePlaceName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isCoordinateText(value: string) {
  const parts = value.split(",").map((part) => part.trim());

  if (parts.length !== 2) {
    return false;
  }

  const longitude = Number(parts[0]);
  const latitude = Number(parts[1]);

  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function resolveCoordinate(placeName: string) {
  const normalized = normalizePlaceName(placeName);

  if (isCoordinateText(normalized)) {
    return normalized;
  }

  const exact = DEMO_LOCATIONS[normalized];

  if (exact) {
    return exact;
  }

  const partialMatch = Object.entries(DEMO_LOCATIONS).find(([name]) =>
    normalized.includes(name),
  );

  if (partialMatch) {
    return partialMatch[1];
  }

  throw new Error(
    `현재 데모에서 지원하지 않는 장소입니다: ${placeName}. ` +
      "대전서원초등학교와 둔산동 보라아파트를 입력하거나 " +
      "경도,위도 형식으로 입력해주세요.",
  );
}

function validateBackendResponse(data: unknown): TeamBackendResponse {
  if (!data || typeof data !== "object") {
    throw new Error("백엔드 응답이 JSON 객체가 아닙니다.");
  }

  const response = data as Partial<TeamBackendResponse>;

  if (
    response.success !== true ||
    !response.safe_route ||
    !response.shortest_route ||
    !Array.isArray(response.safe_route.coords) ||
    !Array.isArray(response.shortest_route.coords) ||
    typeof response.safe_route.distance_m !== "number" ||
    typeof response.shortest_route.distance_m !== "number"
  ) {
    throw new Error("백엔드 응답 형식이 프론트와 맞지 않습니다.");
  }

  return response as TeamBackendResponse;
}

function calculateSafetyScore(response: TeamBackendResponse) {
  const shortestDistance = Math.max(
    response.shortest_route.distance_m,
    1,
  );

  const detourRatio = Math.max(
    0,
    (response.safe_route.distance_m - shortestDistance) /
      shortestDistance,
  );

  const dangerBase = response.safe_route.passes_danger ? 72 : 96;
  const detourPenalty = Math.min(
    15,
    Math.round(detourRatio * 25),
  );

  return Math.max(
    0,
    Math.min(100, dangerBase - detourPenalty),
  );
}

function createRisks(
  response: TeamBackendResponse,
): FrontRouteRisk[] {
  const detourDistance = Math.max(
    0,
    response.safe_route.distance_m -
      response.shortest_route.distance_m,
  );

  return [
    {
      title: "트램 공사 위험 구간",
      level: response.safe_route.passes_danger
        ? "DANGER"
        : "LOW",
      description: response.safe_route.passes_danger
        ? "추천 경로가 위험 영향 구간을 일부 통과합니다."
        : "추천 경로가 확인된 위험 영향 구간을 피했습니다.",
    },
    {
      title: "위험 데이터 분석",
      level:
        response.danger_zones.length > 0
          ? "CAUTION"
          : "LOW",
      description:
        response.danger_zones.length > 0
          ? `주변 위험 데이터 ${response.danger_zones.length}곳을 경로 계산에 반영했습니다.`
          : "현재 경로 주변에서 별도의 위험 데이터를 찾지 못했습니다.",
    },
    {
      title: "안전 우회 거리",
      level: detourDistance > 250 ? "CAUTION" : "LOW",
      description:
        detourDistance > 0
          ? `최단 경로보다 약 ${Math.round(detourDistance)}m 우회해 위험 구간을 피했습니다.`
          : "최단 경로와 비슷한 거리로 안전 경로가 계산됐습니다.",
    },
  ];
}

export async function fetchTeamSafeRoute(
  startName: string,
  destinationName: string,
): Promise<FrontRouteResult> {
  const backendUrl = (
    process.env.BACKEND_API_URL ??
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  const origin = resolveCoordinate(startName);
  const destination = resolveCoordinate(destinationName);

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    180000,
  );

  try {
    const response = await fetch(
      `${backendUrl}/route/safe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origin,
          destination,
        }),
        cache: "no-store",
        signal: controller.signal,
      },
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const detail =
        data &&
        typeof data === "object" &&
        "detail" in data
          ? JSON.stringify(data.detail)
          : "알 수 없는 백엔드 오류";

      throw new Error(
        `백엔드 요청 실패 (${response.status}): ${detail}`,
      );
    }

    const backendResult = validateBackendResponse(data);
    const safeDistance = backendResult.safe_route.distance_m;
    const shortestDistance =
      backendResult.shortest_route.distance_m;

    return {
      start: startName,
      destination: destinationName,
      safetyScore: calculateSafetyScore(backendResult),
      duration: Math.max(1, Math.ceil(safeDistance / 70)),
      distance: Number((safeDistance / 1000).toFixed(2)),
      avoidedConstructionCount:
        backendResult.safe_route.passes_danger
          ? 0
          : backendResult.danger_zones.length,
      summary:
        "최단 경로와 위험 벌점을 적용한 안전 경로를 비교해 " +
        "공사·사고 위험 구간을 덜 통과하는 경로를 추천했습니다.",
      risks: createRisks(backendResult),
      path: backendResult.safe_route.coords,
      shortestPath: backendResult.shortest_route.coords,
      routeId: `${Math.round(shortestDistance)}-${Math.round(safeDistance)}`,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {
      throw new Error(
        "경로 계산 시간이 3분을 초과했습니다. 다시 시도해주세요.",
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
