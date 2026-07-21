import { NextResponse } from "next/server";

type Coordinate = {
  lat: number;
  lng: number;
};

type OsrmResponse = {
  code: string;
  message?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
  }>;
};

const origin: Coordinate = {
  lat: 36.359376,
  lng: 127.395066,
};

const destination: Coordinate = {
  lat: 36.351386,
  lng: 127.400734,
};

/*
 * 이 좌표들은 직선을 그리기 위한 좌표가 아니다.
 * 라우팅 서버가 인접한 실제 보행 도로에 좌표를 붙여
 * 보행 경로를 계산하도록 유도하는 경유점이다.
 */
const safeWaypoints: Coordinate[] = [
  {
    lat: 36.3568,
    lng: 127.3945,
  },
  {
    lat: 36.3539,
    lng: 127.3975,
  },
];

const rerouteWaypoints: Coordinate[] = [
  {
    lat: 36.3543,
    lng: 127.394,
  },
  {
    lat: 36.3525,
    lng: 127.3982,
  },
];

function sleep(milliseconds: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getPointAtProgress(
  coordinates: Coordinate[],
  progress: number,
): Coordinate {
  if (coordinates.length === 0) {
    return origin;
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  const normalizedProgress = Math.max(
    0,
    Math.min(1, progress),
  );

  const lengths: number[] = [];
  let totalLength = 0;

  for (
    let index = 0;
    index < coordinates.length - 1;
    index += 1
  ) {
    const current = coordinates[index];
    const next = coordinates[index + 1];

    const latDifference =
      next.lat - current.lat;

    const lngDifference =
      next.lng - current.lng;

    const length = Math.sqrt(
      latDifference * latDifference +
        lngDifference * lngDifference,
    );

    lengths.push(length);
    totalLength += length;
  }

  const targetLength =
    totalLength * normalizedProgress;

  let accumulatedLength = 0;

  for (
    let index = 0;
    index < lengths.length;
    index += 1
  ) {
    const length = lengths[index];

    if (
      accumulatedLength + length >=
      targetLength
    ) {
      const current = coordinates[index];
      const next = coordinates[index + 1];

      const ratio =
        length === 0
          ? 0
          : (targetLength -
              accumulatedLength) /
            length;

      return {
        lat:
          current.lat +
          (next.lat - current.lat) *
            ratio,

        lng:
          current.lng +
          (next.lng - current.lng) *
            ratio,
      };
    }

    accumulatedLength += length;
  }

  return coordinates[
    coordinates.length - 1
  ];
}

async function requestFootRoute(
  points: Coordinate[],
) {
  const coordinates = points
    .map(
      (point) =>
        `${point.lng},${point.lat}`,
    )
    .join(";");

  /*
   * routed-foot 서버가 보행용 경로 그래프를 사용한다.
   * URL 안의 driving은 OSRM API 경로 형식이며
   * 실제 이동 프로필은 routed-foot에서 결정된다.
   */
  const url =
    "https://routing.openstreetmap.de" +
    `/routed-foot/route/v1/driving/${coordinates}` +
    "?overview=full&geometries=geojson&steps=false";

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent":
        "aiongil-hackathon/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `보행 경로 요청 실패: ${response.status}`,
    );
  }

  const data =
    (await response.json()) as OsrmResponse;

  const firstRoute = data.routes?.[0];

  if (
    data.code !== "Ok" ||
    !firstRoute ||
    firstRoute.geometry.coordinates.length <
      2
  ) {
    throw new Error(
      data.message ??
        "보행 가능한 경로를 찾지 못했습니다.",
    );
  }

  return {
    coordinates:
      firstRoute.geometry.coordinates.map(
        ([lng, lat]) => ({
          lat,
          lng,
        }),
      ),

    distanceKm: Number(
      (firstRoute.distance / 1000).toFixed(
        2,
      ),
    ),

    durationMin: Math.max(
      1,
      Math.round(
        firstRoute.duration / 60,
      ),
    ),
  };
}

export async function GET() {
  try {
    const shortest =
      await requestFootRoute([
        origin,
        destination,
      ]);

    await sleep(700);

    const safe = await requestFootRoute([
      origin,
      ...safeWaypoints,
      destination,
    ]);

    const dangerPoint =
      getPointAtProgress(
        safe.coordinates,
        0.55,
      );

    await sleep(700);

    const reroute =
      await requestFootRoute([
        dangerPoint,
        ...rerouteWaypoints,
        destination,
      ]);

    return NextResponse.json({
      shortest,
      safe,
      reroute,
      dangerPoint,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "경로를 불러오지 못했습니다.",
      },
      {
        status: 502,
      },
    );
  }
}