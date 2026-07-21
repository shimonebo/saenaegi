export type Coordinate = {
  lat: number;
  lng: number;
};

export type DemoLocation = Coordinate & {
  name: string;
  address: string;
};

export type DemoRiskLevel = "low" | "medium" | "high";

export type DemoRiskType =
  | "construction"
  | "sidewalk_closed"
  | "traffic"
  | "school_zone"
  | "cctv";

export type DemoRisk = Coordinate & {
  id: string;
  type: DemoRiskType;
  title: string;
  description: string;
  level: DemoRiskLevel;
};

export type DemoRoute = {
  id: string;
  name: string;
  coordinates: Coordinate[];
  distanceKm: number;
  durationMin: number;
  safetyScore: number;
  avoidedRisks: string[];
  safetyFacilities: string[];
};

export type GuardianNotification = {
  title: string;
  message: string;
  previousArrivalTime: string;
  changedArrivalTime: string;
};

export const demoOrigin: DemoLocation = {
  name: "대전서원초등학교",
  address: "대전광역시 서구 문정로 279",
  lat: 36.359376,
  lng: 127.395066,
};

export const demoDestination: DemoLocation = {
  name: "보라아파트",
  address: "대전광역시 서구 둔산로 241",
  lat: 36.351386,
  lng: 127.400734,
};

export const demoShortestRoute: DemoRoute = {
  id: "shortest-route",
  name: "일반 최단 경로",
  distanceKm: 0.92,
  durationMin: 12,
  safetyScore: 61,

  coordinates: [
    { lat: 36.359376, lng: 127.395066 },
    { lat: 36.35893, lng: 127.39524 },
    { lat: 36.35847, lng: 127.39543 },
    { lat: 36.35803, lng: 127.39567 },
    { lat: 36.35758, lng: 127.39593 },
    { lat: 36.35713, lng: 127.39621 },
    { lat: 36.35671, lng: 127.39653 },
    { lat: 36.35629, lng: 127.39685 },
    { lat: 36.35588, lng: 127.39718 },
    { lat: 36.35547, lng: 127.39753 },
    { lat: 36.35505, lng: 127.39788 },
    { lat: 36.35462, lng: 127.39824 },
    { lat: 36.35419, lng: 127.39861 },
    { lat: 36.35375, lng: 127.39899 },
    { lat: 36.35329, lng: 127.39938 },
    { lat: 36.35283, lng: 127.39976 },
    { lat: 36.35236, lng: 127.40012 },
    { lat: 36.35189, lng: 127.40045 },
    { lat: 36.351386, lng: 127.400734 },
  ],

  avoidedRisks: [],

  safetyFacilities: [
    "횡단보도 1곳",
    "CCTV 1곳",
  ],
};

export const demoSafeRoute: DemoRoute = {
  id: "safe-route",
  name: "AI 추천 안전 경로",
  distanceKm: 1.08,
  durationMin: 14,
  safetyScore: 92,

  coordinates: [
    { lat: 36.359376, lng: 127.395066 },
    { lat: 36.35902, lng: 127.39493 },
    { lat: 36.35862, lng: 127.39484 },
    { lat: 36.35818, lng: 127.39483 },
    { lat: 36.35775, lng: 127.39485 },
    { lat: 36.35734, lng: 127.39491 },
    { lat: 36.35693, lng: 127.39502 },
    { lat: 36.35652, lng: 127.39518 },
    { lat: 36.35615, lng: 127.39546 },
    { lat: 36.35579, lng: 127.39582 },
    { lat: 36.35543, lng: 127.39623 },
    { lat: 36.35508, lng: 127.39666 },
    { lat: 36.35472, lng: 127.39712 },
    { lat: 36.35435, lng: 127.39759 },
    { lat: 36.35397, lng: 127.39805 },
    { lat: 36.35359, lng: 127.39852 },
    { lat: 36.35321, lng: 127.39898 },
    { lat: 36.35283, lng: 127.39943 },
    { lat: 36.35246, lng: 127.39986 },
    { lat: 36.35208, lng: 127.40024 },
    { lat: 36.35173, lng: 127.40051 },
    { lat: 36.351386, lng: 127.400734 },
  ],

  avoidedRisks: [
    "트램 공사 구간 1곳",
    "보도 통제 구간 1곳",
    "차도 인접 구간 1곳",
  ],

  safetyFacilities: [
    "어린이보호구역 2곳",
    "횡단보도 3곳",
    "CCTV 4곳",
    "경찰서 인근 1곳",
  ],
};

export const demoReroutedSafeRoute: DemoRoute = {
  id: "rerouted-safe-route",
  name: "위험 발생 후 안전 우회 경로",
  distanceKm: 1.2,
  durationMin: 16,
  safetyScore: 94,

  coordinates: [
    { lat: 36.359376, lng: 127.395066 },
    { lat: 36.35902, lng: 127.39493 },
    { lat: 36.35862, lng: 127.39484 },
    { lat: 36.35818, lng: 127.39483 },
    { lat: 36.35775, lng: 127.39485 },
    { lat: 36.35734, lng: 127.39491 },
    { lat: 36.35693, lng: 127.39502 },
    { lat: 36.35652, lng: 127.39518 },
    { lat: 36.35617, lng: 127.39512 },
    { lat: 36.35582, lng: 127.39504 },
    { lat: 36.35546, lng: 127.39502 },
    { lat: 36.35513, lng: 127.39518 },
    { lat: 36.35481, lng: 127.39552 },
    { lat: 36.3545, lng: 127.39595 },
    { lat: 36.35418, lng: 127.39642 },
    { lat: 36.35386, lng: 127.39692 },
    { lat: 36.35355, lng: 127.39743 },
    { lat: 36.35324, lng: 127.39795 },
    { lat: 36.35293, lng: 127.39846 },
    { lat: 36.35262, lng: 127.39896 },
    { lat: 36.35231, lng: 127.39943 },
    { lat: 36.352, lng: 127.39986 },
    { lat: 36.35169, lng: 127.40027 },
    { lat: 36.351386, lng: 127.400734 },
  ],

  avoidedRisks: [
    "기존 트램 공사 구간 1곳",
    "신규 보도 통제 구간 1곳",
    "차도 인접 임시 통행로 1곳",
  ],

  safetyFacilities: [
    "어린이보호구역 3곳",
    "횡단보도 4곳",
    "CCTV 6곳",
    "경찰서 인근 1곳",
  ],
};

export const demoInitialRisks: DemoRisk[] = [
  {
    id: "tram-construction-1",
    type: "construction",
    title: "트램 공사 구간",
    description:
      "트램 공사로 인해 보행로 폭이 좁아진 구간입니다.",
    level: "high",
    lat: 36.35588,
    lng: 127.39718,
  },
  {
    id: "sidewalk-closed-1",
    type: "sidewalk_closed",
    title: "보도 통제 구간",
    description:
      "보도 통제로 차도 인접 임시 통행로를 이용해야 합니다.",
    level: "high",
    lat: 36.35462,
    lng: 127.39824,
  },
  {
    id: "school-zone-1",
    type: "school_zone",
    title: "어린이보호구역",
    description:
      "신호등과 횡단보도가 설치된 어린이보호구역입니다.",
    level: "low",
    lat: 36.35734,
    lng: 127.39491,
  },
  {
    id: "cctv-1",
    type: "cctv",
    title: "방범 CCTV",
    description:
      "보행로를 확인할 수 있는 방범 CCTV가 설치되어 있습니다.",
    level: "low",
    lat: 36.35321,
    lng: 127.39898,
  },
];

export const demoNewDangerAlert: DemoRisk = {
  id: "new-danger-alert",
  type: "sidewalk_closed",
  title: "트램 공사로 인한 보도 통제",
  description:
    "보도 통제로 인해 차도 인접 임시 통행로를 이용해야 합니다.",
  level: "high",
  lat: 36.35472,
  lng: 127.39712,
};

export const demoGuardianNotification: GuardianNotification = {
  title: "공사 위험 감지 및 경로 변경",
  message:
    "B양의 이동 경로 전방에서 트램 공사로 인한 보도 통제가 감지되었습니다. 아이온길이 공사 구간을 피해 어린이보호구역과 CCTV가 있는 안전 경로로 자동 변경했습니다.",
  previousArrivalTime: "오후 4시 40분",
  changedArrivalTime: "오후 4시 42분",
};

export const demoChild = {
  name: "B양",
  speedKmh: 3.8,
  initialRemainingKm: 1.08,
  initialArrivalMinutes: 14,
};

export const demoAnalysisSteps = [
  "출발지와 목적지 좌표 확인",
  "도보 경로 후보 3개 생성",
  "트램 공사 구간 확인",
  "어린이보호구역과 횡단보도 분석",
  "CCTV와 보행 위험 요소 확인",
  "각 경로의 위험 점수 계산",
  "최종 안전 경로 선택",
];