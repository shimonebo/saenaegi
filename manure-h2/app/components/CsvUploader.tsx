"use client";

import {
  ChangeEvent,
  useState,
} from "react";
import Papa from "papaparse";

export type FarmData = {
  id: number;
  name: string;
  region: string;
  animalType: string;
  capacity: number;
  currentAmount: number;
  dailyGeneration: number;
  latitude: number;
  longitude: number;
};

type CsvRow = {
  name?: string;
  region?: string;
  animalType?: string;
  capacity?: string;
  currentAmount?: string;
  dailyGeneration?: string;
  latitude?: string;
  longitude?: string;
};

type CsvUploaderProps = {
  onUpload: (farms: FarmData[]) => void;
};

type SaveResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  count?: number;
};

const requiredColumns = [
  "name",
  "region",
  "animalType",
  "capacity",
  "currentAmount",
  "dailyGeneration",
  "latitude",
  "longitude",
];

export default function CsvUploader({
  onUpload,
}: CsvUploaderProps) {
  const [previewFarms, setPreviewFarms] = useState<
    FarmData[]
  >([]);

  const [fileName, setFileName] = useState("");
  const [errorMessage, setErrorMessage] =
    useState("");

  const [saveMessage, setSaveMessage] =
    useState("");

  const [isSaving, setIsSaving] =
    useState(false);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    setErrorMessage("");
    setSaveMessage("");
    setPreviewFarms([]);

    if (!file) {
      return;
    }

    if (
      !file.name.toLowerCase().endsWith(".csv")
    ) {
      setFileName("");
      setErrorMessage(
        "CSV 파일만 업로드할 수 있습니다.",
      );

      event.target.value = "";
      return;
    }

    setFileName(file.name);

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,

      transformHeader: (header) =>
        header
          .replace(/^\uFEFF/, "")
          .trim(),

      complete: (result) => {
        const uploadedColumns =
          result.meta.fields ?? [];

        const missingColumns =
          requiredColumns.filter(
            (column) =>
              !uploadedColumns.includes(column),
          );

        if (missingColumns.length > 0) {
          setErrorMessage(
            `필수 열이 없습니다: ${missingColumns.join(
              ", ",
            )}`,
          );

          return;
        }

        const parsedFarms: FarmData[] = [];

        result.data.forEach(
          (row, index) => {
            const capacity = Number(
              row.capacity,
            );

            const currentAmount = Number(
              row.currentAmount,
            );

            const dailyGeneration = Number(
              row.dailyGeneration,
            );

            const latitude = Number(
              row.latitude,
            );

            const longitude = Number(
              row.longitude,
            );

            const hasEmptyText =
              !row.name?.trim() ||
              !row.region?.trim() ||
              !row.animalType?.trim();

            const numericValues = [
              capacity,
              currentAmount,
              dailyGeneration,
              latitude,
              longitude,
            ];

            const hasInvalidNumber =
              numericValues.some(
                (value) =>
                  !Number.isFinite(value),
              );

            const hasInvalidAmount =
              capacity <= 0 ||
              currentAmount < 0 ||
              dailyGeneration < 0;

            const hasInvalidCoordinate =
              latitude < -90 ||
              latitude > 90 ||
              longitude < -180 ||
              longitude > 180;

            if (
              hasEmptyText ||
              hasInvalidNumber ||
              hasInvalidAmount ||
              hasInvalidCoordinate
            ) {
              return;
            }

            parsedFarms.push({
              id: index + 1,
              name: row.name!.trim(),
              region: row.region!.trim(),
              animalType:
                row.animalType!.trim(),
              capacity,
              currentAmount,
              dailyGeneration,
              latitude,
              longitude,
            });
          },
        );

        if (parsedFarms.length === 0) {
          setErrorMessage(
            "사용할 수 있는 농장 데이터가 없습니다. CSV 내용을 확인해주세요.",
          );

          return;
        }

        setPreviewFarms(parsedFarms);

        // 대시보드에도 즉시 적용
        onUpload(parsedFarms);
      },

      error: () => {
        setPreviewFarms([]);

        setErrorMessage(
          "CSV 파일을 읽는 중 오류가 발생했습니다.",
        );
      },
    });
  }

  async function saveToDatabase() {
    if (previewFarms.length === 0) {
      setErrorMessage(
        "먼저 CSV 파일을 선택해주세요.",
      );

      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    setSaveMessage("");

    try {
      const response = await fetch(
        "/api/farms",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            farms: previewFarms,
          }),
        },
      );

      const result =
        (await response.json()) as SaveResponse;

      if (
        !response.ok ||
        result.success !== true
      ) {
        throw new Error(
          result.error ||
            result.message ||
            "데이터 저장에 실패했습니다.",
        );
      }

      setSaveMessage(
        result.message ||
          `${previewFarms.length}개 농장을 저장했습니다.`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "데이터베이스 저장 중 오류가 발생했습니다.";

      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-900">
          농장 CSV 데이터 업로드
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          CSV 데이터를 확인한 뒤
          Supabase 데이터베이스에 저장합니다.
        </p>
      </div>

      <div className="p-6">
        <label
          htmlFor="farm-csv"
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-500 hover:bg-blue-50"
        >
          <span className="text-lg font-bold text-slate-800">
            CSV 파일 선택
          </span>

          <span className="mt-2 text-sm text-slate-500">
            클릭하여 농장 데이터 파일을
            업로드하세요.
          </span>

          <span className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            파일 찾아보기
          </span>
        </label>

        <input
          id="farm-csv"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">
            CSV 필수 열
          </p>

          <p className="mt-2 break-all text-sm text-slate-500">
            name, region, animalType,
            capacity, currentAmount,
            dailyGeneration, latitude,
            longitude
          </p>
        </div>

        {fileName && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-sm font-semibold text-blue-800">
              선택한 파일: {fileName}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          </div>
        )}

        {saveMessage && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-semibold text-green-700">
              {saveMessage}
            </p>
          </div>
        )}

        {previewFarms.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  업로드 데이터 미리보기
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  정상적으로 읽은 농장{" "}
                  {previewFarms.length}곳
                </p>
              </div>

              <button
                type="button"
                onClick={saveToDatabase}
                disabled={isSaving}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSaving
                  ? "저장 중..."
                  : "Supabase에 저장"}
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      농장명
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      지역
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      축종
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      최대 용량
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      현재 저장량
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      하루 발생량
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      위도
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      경도
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {previewFarms.map(
                    (farm) => (
                      <tr
                        key={farm.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          {farm.name}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {farm.region}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {farm.animalType}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {farm.capacity}톤
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {farm.currentAmount}톤
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {farm.dailyGeneration}
                          톤
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {farm.latitude}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {farm.longitude}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}