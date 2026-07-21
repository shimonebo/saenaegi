import { NextResponse } from "next/server";

import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";

type FarmRequest = {
  name?: unknown;
  region?: unknown;
  animalType?: unknown;
  animal_type?: unknown;
  capacity?: unknown;
  currentAmount?: unknown;
  current_amount?: unknown;
  dailyGeneration?: unknown;
  daily_generation?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

type DatabaseFarm = {
  name: string;
  region: string;
  animal_type: string;
  capacity: number;
  current_amount: number;
  daily_generation: number;
  latitude: number;
  longitude: number;
  updated_at: string;
};

type PostRequestBody = {
  farms?: unknown;
};

function convertFarm(
  farm: FarmRequest,
  index: number,
): DatabaseFarm {
  const name = String(farm.name ?? "").trim();
  const region = String(farm.region ?? "").trim();

  const animalType = String(
    farm.animalType ?? farm.animal_type ?? "",
  ).trim();

  const capacity = Number(farm.capacity);

  const currentAmount = Number(
    farm.currentAmount ?? farm.current_amount,
  );

  const dailyGeneration = Number(
    farm.dailyGeneration ?? farm.daily_generation,
  );

  const latitude = Number(farm.latitude);
  const longitude = Number(farm.longitude);

  if (!name || !region || !animalType) {
    throw new Error(
      `${index + 1}번째 농장의 이름, 지역 또는 축종이 비어 있습니다.`,
    );
  }

  const numbers = [
    capacity,
    currentAmount,
    dailyGeneration,
    latitude,
    longitude,
  ];

  if (
    numbers.some(
      (value: number) => !Number.isFinite(value),
    )
  ) {
    throw new Error(
      `${index + 1}번째 농장의 숫자 데이터가 올바르지 않습니다.`,
    );
  }

  if (capacity <= 0) {
    throw new Error(
      `${index + 1}번째 농장의 최대 용량은 0보다 커야 합니다.`,
    );
  }

  if (currentAmount < 0 || dailyGeneration < 0) {
    throw new Error(
      `${index + 1}번째 농장의 저장량과 발생량은 음수가 될 수 없습니다.`,
    );
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error(
      `${index + 1}번째 농장의 위도가 올바르지 않습니다.`,
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error(
      `${index + 1}번째 농장의 경도가 올바르지 않습니다.`,
    );
  }

  return {
    name,
    region,
    animal_type: animalType,
    capacity,
    current_amount: currentAmount,
    daily_generation: dailyGeneration,
    latitude,
    longitude,
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("farms")
      .select(
        `
          id,
          name,
          region,
          animal_type,
          capacity,
          current_amount,
          daily_generation,
          latitude,
          longitude
        `,
      )
      .order("id", {
        ascending: true,
      });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "농장 데이터를 불러오지 못했습니다.",
          error: error.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length ?? 0,
      farms: data ?? [],
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PostRequestBody;

    if (!Array.isArray(body.farms)) {
      return NextResponse.json(
        {
          success: false,
          message: "저장할 농장 데이터가 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (body.farms.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "농장 데이터가 한 건도 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const convertedFarms: DatabaseFarm[] =
      body.farms.map(
        (farm: unknown, index: number): DatabaseFarm => {
          if (
            typeof farm !== "object" ||
            farm === null
          ) {
            throw new Error(
              `${index + 1}번째 농장 데이터 형식이 올바르지 않습니다.`,
            );
          }

          return convertFarm(
            farm as FarmRequest,
            index,
          );
        },
      );

    // 농장명이 중복되면 마지막 데이터를 사용
    const farmMap = new Map<string, DatabaseFarm>();

    for (const farm of convertedFarms) {
      farmMap.set(farm.name, farm);
    }

    const uniqueFarms: DatabaseFarm[] = Array.from(
      farmMap.values(),
    );

    const { data, error } = await supabase
      .from("farms")
      .upsert(uniqueFarms, {
        onConflict: "name",
      })
      .select(
        `
          id,
          name,
          region,
          animal_type,
          capacity,
          current_amount,
          daily_generation,
          latitude,
          longitude
        `,
      );

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "농장 데이터를 저장하지 못했습니다.",
          error: error.message,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${data?.length ?? 0}개 농장 데이터를 저장했습니다.`,
      count: data?.length ?? 0,
      farms: data ?? [],
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "농장 데이터를 처리하는 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status: 400,
      },
    );
  }
}