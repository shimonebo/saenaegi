"use client";

import "leaflet/dist/leaflet.css";

import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
} from "react-leaflet";

import type { FarmData } from "./CsvUploader";

type FarmMapProps = {
  farms: FarmData[];
};

const facility = {
  name: "충남 가축분뇨 처리시설",
  latitude: 36.57,
  longitude: 126.72,
};

const vehicle = {
  name: "수거차량 1호",
  latitude: 36.64,
  longitude: 126.76,
};

function getStorageRate(farm: FarmData) {
  if (farm.capacity <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (farm.currentAmount / farm.capacity) * 100,
    ),
  );
}

function getFarmColor(storageRate: number) {
  if (storageRate >= 90) {
    return "#dc2626";
  }

  if (storageRate >= 75) {
    return "#f97316";
  }

  if (storageRate >= 50) {
    return "#eab308";
  }

  return "#16a34a";
}

export default function FarmMap({
  farms,
}: FarmMapProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-bold text-slate-900">
          농장·처리시설 위치
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          현재 불러온 농장과 처리시설, 수거차량 위치입니다.
        </p>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-600" />
            <span className="text-slate-600">
              저장률 90% 이상
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-orange-500" />
            <span className="text-slate-600">
              저장률 75% 이상
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-slate-600">
              저장률 50% 이상
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-green-600" />
            <span className="text-slate-600">
              일반 농장
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-blue-600" />
            <span className="text-slate-600">
              처리시설
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-purple-600" />
            <span className="text-slate-600">
              수거차량
            </span>
          </div>
        </div>
      </div>

      <MapContainer
        center={[36.58, 126.7]}
        zoom={9}
        scrollWheelZoom
        style={{
          width: "100%",
          height: "520px",
        }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {farms.map((farm) => {
          const storageRate = getStorageRate(farm);
          const markerColor = getFarmColor(storageRate);

          return (
            <CircleMarker
              key={farm.id}
              center={[
                farm.latitude,
                farm.longitude,
              ]}
              radius={9}
              pathOptions={{
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.85,
                weight: 3,
              }}
            >
              <Popup>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    {farm.name}
                  </p>

                  <p style={{ margin: "6px 0 0" }}>
                    지역: {farm.region}
                  </p>

                  <p style={{ margin: "4px 0 0" }}>
                    축종: {farm.animalType}
                  </p>

                  <p style={{ margin: "4px 0 0" }}>
                    저장량: {farm.currentAmount}톤 /{" "}
                    {farm.capacity}톤
                  </p>

                  <p style={{ margin: "4px 0 0" }}>
                    저장률: {storageRate}%
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <CircleMarker
          center={[
            facility.latitude,
            facility.longitude,
          ]}
          radius={13}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.9,
            weight: 3,
          }}
        >
          <Popup>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                {facility.name}
              </p>

              <p style={{ margin: "6px 0 0" }}>
                분뇨 반입 및 수소 생산 처리시설
              </p>
            </div>
          </Popup>
        </CircleMarker>

        <CircleMarker
          center={[
            vehicle.latitude,
            vehicle.longitude,
          ]}
          radius={10}
          pathOptions={{
            color: "#7c3aed",
            fillColor: "#7c3aed",
            fillOpacity: 0.9,
            weight: 3,
          }}
        >
          <Popup>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                {vehicle.name}
              </p>

              <p style={{ margin: "6px 0 0" }}>
                현재 처리시설 인근에서 대기 중
              </p>
            </div>
          </Popup>
        </CircleMarker>
      </MapContainer>
    </section>
  );
}