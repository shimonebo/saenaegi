"use client";

import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CsvUploader from "./components/CsvUploader";
import type { FarmData } from "./components/CsvUploader";

const FarmMap = dynamic(
  () => import("./components/FarmMap"),
  {
    ssr: false,

    loading: () => (
      <div className="flex h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
        지도를 불러오는 중입니다...
      </div>
    ),
  },
);

type FarmStatus =
  | "긴급"
  | "수거 필요"
  | "관찰"
  | "안정";

type DatabaseFarm = {
  id: number;
  name: string;
  region: string;
  animal_type: string;
  capacity: number;
  current_amount: number;
  daily_generation: number;
  latitude: number;
  longitude: number;
};

type FarmsApiResponse = {
  success?: boolean;
  count?: number;
  farms?: DatabaseFarm[];
  message?: string;
  error?: string;
};

const defaultFarms: FarmData[] = [
  {
    id: 1,
    name: "홍성 행복농장",
    region: "홍성군",
    animalType: "돼지",
    capacity: 100,
    currentAmount: 92,
    dailyGeneration: 4.5,
    latitude: 36.601,
    longitude: 126.66,
  },
  {
    id: 2,
    name: "예산 푸른농장",
    region: "예산군",
    animalType: "한우",
    capacity: 80,
    currentAmount: 61,
    dailyGeneration: 3,
    latitude: 36.682,
    longitude: 126.849,
  },
  {
    id: 3,
    name: "당진 새봄농장",
    region: "당진시",
    animalType: "돼지",
    capacity: 120,
    currentAmount: 77,
    dailyGeneration: 4,
    latitude: 36.889,
    longitude: 126.645,
  },
  {
    id: 4,
    name: "보령 대천농장",
    region: "보령시",
    animalType: "젖소",
    capacity: 90,
    currentAmount: 39,
    dailyGeneration: 2.8,
    latitude: 36.333,
    longitude: 126.612,
  },
  {
    id: 5,
    name: "서산 햇살농장",
    region: "서산시",
    animalType: "한우",
    capacity: 70,
    currentAmount: 24,
    dailyGeneration: 2,
    latitude: 36.784,
    longitude: 126.45,
  },
  {
    id: 6,
    name: "청양 청정농장",
    region: "청양군",
    animalType: "돼지",
    capacity: 110,
    currentAmount: 18,
    dailyGeneration: 3.5,
    latitude: 36.459,
    longitude: 126.802,
  },
];

const hydrogenYieldByAnimal: Record<string, number> = {
  돼지: 6.8,
  한우: 5.5,
  젖소: 6,
};

function convertDatabaseFarm(
  farm: DatabaseFarm,
): FarmData {
  return {
    id: farm.id,
    name: farm.name,
    region: farm.region,
    animalType: farm.animal_type,
    capacity: farm.capacity,
    currentAmount: farm.current_amount,
    dailyGeneration: farm.daily_generation,
    latitude: farm.latitude,
    longitude: farm.longitude,
  };
}

function analyzeFarm(farm: FarmData) {
  const storageRate = Math.min(
    100,
    Math.round(
      (farm.currentAmount / farm.capacity) * 100,
    ),
  );

  const remainingCapacity = Math.max(
    farm.capacity - farm.currentAmount,
    0,
  );

  const daysUntilFull =
    farm.dailyGeneration > 0
      ? Math.ceil(
          remainingCapacity /
            farm.dailyGeneration,
        )
      : 999;

  const urgencyPoint = Math.max(
    0,
    30 - daysUntilFull,
  );

  const riskScore = Math.min(
    100,
    Math.round(
      storageRate * 0.7 + urgencyPoint,
    ),
  );

  let status: FarmStatus = "안정";

  if (
    storageRate >= 90 ||
    daysUntilFull <= 2
  ) {
    status = "긴급";
  } else if (
    storageRate >= 75 ||
    daysUntilFull <= 7
  ) {
    status = "수거 필요";
  } else if (
    storageRate >= 50 ||
    daysUntilFull <= 14
  ) {
    status = "관찰";
  }

  return {
    ...farm,
    storageRate,
    daysUntilFull,
    riskScore,
    status,
  };
}

function getStatusBadgeClass(
  status: FarmStatus,
) {
  switch (status) {
    case "긴급":
      return "bg-red-100 text-red-700";

    case "수거 필요":
      return "bg-orange-100 text-orange-700";

    case "관찰":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-green-100 text-green-700";
  }
}

function getStorageBarClass(
  status: FarmStatus,
) {
  switch (status) {
    case "긴급":
      return "bg-red-500";

    case "수거 필요":
      return "bg-orange-500";

    case "관찰":
      return "bg-yellow-500";

    default:
      return "bg-green-600";
  }
}

export default function Home() {
  const [farms, setFarms] =
    useState<FarmData[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [dataSource, setDataSource] =
    useState("Supabase 연결 중");

  const loadFarmsFromDatabase =
    useCallback(async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          "/api/farms",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as FarmsApiResponse;

        if (
          !response.ok ||
          result.success !== true
        ) {
          throw new Error(
            result.error ||
              result.message ||
              "데이터를 불러오지 못했습니다.",
          );
        }

        const databaseFarms =
          result.farms ?? [];

        if (databaseFarms.length === 0) {
          setFarms(defaultFarms);
          setDataSource("기본 시범 데이터");

          setLoadError(
            "데이터베이스에 저장된 농장이 없어 기본 데이터를 표시합니다.",
          );

          return;
        }

        const convertedFarms =
          databaseFarms.map(
            convertDatabaseFarm,
          );

        setFarms(convertedFarms);
        setDataSource("Supabase 데이터베이스");
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "데이터를 불러오는 중 오류가 발생했습니다.";

        setFarms(defaultFarms);
        setDataSource("기본 시범 데이터");

        setLoadError(
          `${message} 기본 데이터를 표시합니다.`,
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadFarmsFromDatabase();
  }, [loadFarmsFromDatabase]);

  const analyzedFarms = useMemo(() => {
    return farms
      .map(analyzeFarm)
      .sort(
        (a, b) =>
          b.riskScore - a.riskScore,
      );
  }, [farms]);

  const collectionTargets =
    useMemo(() => {
      return analyzedFarms
        .filter(
          (farm) =>
            farm.status === "긴급" ||
            farm.status === "수거 필요",
        )
        .map((farm) => {
          const estimatedCollectionAmount =
            Number(
              (
                farm.currentAmount * 0.35
              ).toFixed(1),
            );

          const hydrogenYield =
            hydrogenYieldByAnimal[
              farm.animalType
            ] ?? 6;

          const estimatedHydrogenAmount =
            Number(
              (
                estimatedCollectionAmount *
                hydrogenYield
              ).toFixed(1),
            );

          return {
            ...farm,
            estimatedCollectionAmount,
            estimatedHydrogenAmount,
          };
        });
    }, [analyzedFarms]);

  const totalEstimatedCollectionAmount =
    collectionTargets.reduce(
      (total, farm) =>
        total +
        farm.estimatedCollectionAmount,
      0,
    );

  const totalEstimatedHydrogenAmount =
    collectionTargets.reduce(
      (total, farm) =>
        total +
        farm.estimatedHydrogenAmount,
      0,
    );

  const summaryCards = [
    {
      title: "관리 농장",
      value: isLoading
        ? "불러오는 중"
        : `${farms.length}곳`,
      description: "현재 등록된 농장",
    },
    {
      title: "오늘 수거 대상",
      value: isLoading
        ? "-"
        : `${collectionTargets.length}곳`,
      description:
        "긴급 또는 수거 필요 농장",
    },
    {
      title: "예상 수거량",
      value: isLoading
        ? "-"
        : `${totalEstimatedCollectionAmount.toFixed(
            1,
          )}톤`,
      description:
        "현재 저장량의 35% 수거 기준",
    },
    {
      title: "예상 수소 생산량",
      value: isLoading
        ? "-"
        : `${totalEstimatedHydrogenAmount.toFixed(
            1,
          )}kg`,
      description:
        "시연용 축종별 환산계수",
    },
  ];

  function handleCsvUpload(
    uploadedFarms: FarmData[],
  ) {
    setFarms(uploadedFarms);
    setDataSource("업로드한 CSV 데이터");
    setLoadError("");
  }

  function showDefaultData() {
    setFarms(defaultFarms);
    setDataSource("기본 시범 데이터");
    setLoadError("");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 sm:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              분뇨H2 통합관리 시스템
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              가축분뇨 수거 및 수소 생산 관리
            </p>
          </div>

          <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            시스템 정상
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                오늘의 운영 현황
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                농장 저장량과 수거 예정 정보를
                확인합니다.
              </p>

              <p className="mt-2 text-sm font-semibold text-blue-700">
                현재 데이터: {dataSource}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  void loadFarmsFromDatabase()
                }
                disabled={isLoading}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading
                  ? "불러오는 중..."
                  : "DB 데이터 새로고침"}
              </button>

              <button
                type="button"
                onClick={showDefaultData}
                disabled={isLoading}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                기본 데이터 보기
              </button>
            </div>
          </div>

          {loadError && (
            <div className="mt-5 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
              <p className="text-sm font-semibold text-orange-700">
                {loadError}
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {card.value}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {card.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <CsvUploader
            onUpload={handleCsvUpload}
          />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">
              오늘의 수거·수소 생산 예측
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              긴급 또는 수거 필요 농장을
              기준으로 계산합니다.
            </p>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-slate-500">
              농장 데이터를 불러오는
              중입니다...
            </div>
          ) : collectionTargets.length ===
            0 ? (
            <div className="p-10 text-center text-slate-500">
              현재 긴급 또는 수거 필요
              농장이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      농장
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      축종
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      현재 저장량
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      예상 수거량
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      예상 수소량
                    </th>

                    <th className="px-6 py-4 font-semibold">
                      상태
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {collectionTargets.map(
                    (farm) => (
                      <tr
                        key={farm.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-900">
                            {farm.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {farm.region}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-slate-600">
                          {farm.animalType}
                        </td>

                        <td className="px-6 py-5 text-slate-600">
                          {farm.currentAmount}톤
                        </td>

                        <td className="px-6 py-5 font-semibold text-slate-900">
                          {
                            farm.estimatedCollectionAmount
                          }
                          톤
                        </td>

                        <td className="px-6 py-5 font-bold text-blue-700">
                          {
                            farm.estimatedHydrogenAmount
                          }
                          kg
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusBadgeClass(
                              farm.status,
                            )}`}
                          >
                            {farm.status}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8">
          <FarmMap farms={farms} />
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">
              농장 수거 우선순위
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              저장률과 포화 예상일을 이용해
              계산한 위험점수 순서입니다.
            </p>
          </div>

          {isLoading ? (
            <div className="p-10 text-center text-slate-500">
              우선순위를 계산하고 있습니다...
            </div>
          ) : analyzedFarms.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              표시할 농장 데이터가 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      순위
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      농장
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      축종
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      현재/최대 용량
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      하루 발생량
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      저장률
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      포화 예상
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      위험점수
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      상태
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {analyzedFarms.map(
                    (farm, index) => (
                      <tr
                        key={farm.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
                            {index + 1}
                          </div>
                        </td>

                        <td className="px-5 py-5">
                          <p className="font-semibold text-slate-900">
                            {farm.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {farm.region}
                          </p>
                        </td>

                        <td className="px-5 py-5 text-slate-600">
                          {farm.animalType}
                        </td>

                        <td className="px-5 py-5 text-slate-600">
                          {farm.currentAmount}톤 /{" "}
                          {farm.capacity}톤
                        </td>

                        <td className="px-5 py-5 text-slate-600">
                          {farm.dailyGeneration}톤
                        </td>

                        <td className="min-w-[200px] px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full ${getStorageBarClass(
                                  farm.status,
                                )}`}
                                style={{
                                  width: `${farm.storageRate}%`,
                                }}
                              />
                            </div>

                            <span className="w-12 text-right font-semibold text-slate-700">
                              {farm.storageRate}%
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-5 font-semibold text-slate-700">
                          {farm.daysUntilFull <=
                          0
                            ? "포화"
                            : farm.daysUntilFull ===
                                999
                              ? "계산 불가"
                              : `${farm.daysUntilFull}일 후`}
                        </td>

                        <td className="px-5 py-5">
                          <span className="text-lg font-bold text-slate-900">
                            {farm.riskScore}
                          </span>

                          <span className="text-sm text-slate-400">
                            {" "}
                            / 100
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusBadgeClass(
                              farm.status,
                            )}`}
                          >
                            {farm.status}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}