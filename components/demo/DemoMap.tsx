"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  LayerGroup,
  Map as LeafletMap,
} from "leaflet";

import {
  demoDestination,
  demoOrigin,
  type Coordinate,
} from "@/lib/demo-data";

type LeafletNamespace =
  typeof import("leaflet");

export type DemoRouteLine = {
  coordinates: Coordinate[];
  distanceKm: number;
  durationMin: number;
};

export type DemoRoutesPayload = {
  shortest: DemoRouteLine;
  safe: DemoRouteLine;
  reroute: DemoRouteLine;
  dangerPoint: Coordinate;
};

export type DemoMapProps = {
  routes: DemoRoutesPayload | null;
  showShortestRoute?: boolean;
  showSafeRoute?: boolean;
  showReroutedRoute?: boolean;
  showNewDanger?: boolean;
  showCurrentLocation?: boolean;
  progress?: number;
  mode?: "child" | "guardian";
};

function clampProgress(progress: number) {
  return Math.max(0, Math.min(1, progress));
}

function getPointAtProgress(
  coordinates: Coordinate[],
  progress: number,
): Coordinate {
  if (coordinates.length === 0) {
    return demoOrigin;
  }

  if (coordinates.length === 1) {
    return coordinates[0];
  }

  const normalizedProgress =
    clampProgress(progress);

  const segmentLengths: number[] = [];
  let totalLength = 0;

  for (
    let index = 0;
    index < coordinates.length - 1;
    index += 1
  ) {
    const start = coordinates[index];
    const end = coordinates[index + 1];

    const latDifference =
      end.lat - start.lat;

    const lngDifference =
      end.lng - start.lng;

    const segmentLength = Math.sqrt(
      latDifference * latDifference +
        lngDifference * lngDifference,
    );

    segmentLengths.push(segmentLength);
    totalLength += segmentLength;
  }

  const targetLength =
    totalLength * normalizedProgress;

  let accumulatedLength = 0;

  for (
    let index = 0;
    index < segmentLengths.length;
    index += 1
  ) {
    const segmentLength =
      segmentLengths[index];

    if (
      accumulatedLength + segmentLength >=
      targetLength
    ) {
      const start = coordinates[index];
      const end = coordinates[index + 1];

      const ratio =
        segmentLength === 0
          ? 0
          : (targetLength -
              accumulatedLength) /
            segmentLength;

      return {
        lat:
          start.lat +
          (end.lat - start.lat) * ratio,
        lng:
          start.lng +
          (end.lng - start.lng) * ratio,
      };
    }

    accumulatedLength += segmentLength;
  }

  return coordinates[
    coordinates.length - 1
  ];
}

function toLatLngArray(
  coordinates: Coordinate[],
): [number, number][] {
  return coordinates.map((coordinate) => [
    coordinate.lat,
    coordinate.lng,
  ]);
}

export function DemoMap({
  routes,
  showShortestRoute = false,
  showSafeRoute = false,
  showReroutedRoute = false,
  showNewDanger = false,
  showCurrentLocation = false,
  progress = 0,
  mode = "child",
}: DemoMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement>(null);

  const mapRef =
    useRef<LeafletMap | null>(null);

  const layerGroupRef =
    useRef<LayerGroup | null>(null);

  const leafletRef =
    useRef<LeafletNamespace | null>(null);

  const fittedRef = useRef(false);

  const [mapReady, setMapReady] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      const L = await import("leaflet");

      if (
        cancelled ||
        !mapContainerRef.current ||
        mapRef.current
      ) {
        return;
      }

      leafletRef.current = L;

      const map = L.map(
        mapContainerRef.current,
        {
          zoomControl: true,
          attributionControl: true,
        },
      );

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            "&copy; OpenStreetMap contributors",
        },
      ).addTo(map);

      const layerGroup =
        L.layerGroup().addTo(map);

      map.setView(
        [
          demoOrigin.lat,
          demoOrigin.lng,
        ],
        15,
      );

      mapRef.current = map;
      layerGroupRef.current = layerGroup;

      window.setTimeout(() => {
        map.invalidateSize();
      }, 100);

      setMapReady(true);
    }

    void initializeMap();

    return () => {
      cancelled = true;

      mapRef.current?.remove();

      mapRef.current = null;
      layerGroupRef.current = null;
      leafletRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    const layerGroup =
      layerGroupRef.current;

    if (
      !mapReady ||
      !L ||
      !map ||
      !layerGroup
    ) {
      return;
    }

    layerGroup.clearLayers();

    function addLocationMarker(
      coordinate: Coordinate,
      title: string,
      color: string,
    ) {
      L.circleMarker(
        [
          coordinate.lat,
          coordinate.lng,
        ],
        {
          radius: 11,
          color: "#ffffff",
          weight: 4,
          fillColor: color,
          fillOpacity: 1,
        },
      )
        .addTo(layerGroup)
        .bindTooltip(title, {
          permanent: true,
          direction: "right",
          offset: [13, 0],
        });
    }

    addLocationMarker(
      demoOrigin,
      demoOrigin.name,
      "#16a34a",
    );

    addLocationMarker(
      demoDestination,
      demoDestination.name,
      "#2563eb",
    );

    if (!routes) {
      return;
    }

    if (
      !fittedRef.current &&
      routes.safe.coordinates.length > 0
    ) {
      map.fitBounds(
        L.latLngBounds(
          toLatLngArray(
            routes.safe.coordinates,
          ),
        ),
        {
          padding: [55, 55],
        },
      );

      fittedRef.current = true;
    }

    if (showShortestRoute) {
      L.polyline(
        toLatLngArray(
          routes.shortest.coordinates,
        ),
        {
          color: "#64748b",
          weight: 6,
          opacity: 0.85,
          dashArray: "9 9",
          lineCap: "round",
          lineJoin: "round",
        },
      )
        .addTo(layerGroup)
        .bindTooltip(
          `일반 경로 · ${routes.shortest.distanceKm}km · ${routes.shortest.durationMin}분`,
        );
    }

    if (
      showSafeRoute &&
      !showReroutedRoute
    ) {
      const safePoints = toLatLngArray(
        routes.safe.coordinates,
      );

      L.polyline(safePoints, {
        color: "#ffffff",
        weight: 13,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      L.polyline(safePoints, {
        color: "#087cff",
        weight: 8,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      })
        .addTo(layerGroup)
        .bindTooltip(
          `AI 안전 경로 · ${routes.safe.distanceKm}km · ${routes.safe.durationMin}분`,
        );
    }

    if (showReroutedRoute) {
      /*
       * 위험을 감지하기 전까지 이미 이동한 구간이다.
       */
      const travelledCount = Math.max(
        2,
        Math.floor(
          routes.safe.coordinates.length *
            0.55,
        ),
      );

      const travelledRoute =
        routes.safe.coordinates.slice(
          0,
          travelledCount,
        );

      L.polyline(
        toLatLngArray(travelledRoute),
        {
          color: "#94a3b8",
          weight: 6,
          opacity: 0.55,
          lineCap: "round",
          lineJoin: "round",
        },
      ).addTo(layerGroup);

      const reroutePoints = toLatLngArray(
        routes.reroute.coordinates,
      );

      L.polyline(reroutePoints, {
        color: "#ffffff",
        weight: 14,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(layerGroup);

      L.polyline(reroutePoints, {
        color: "#006cff",
        weight: 9,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round",
      })
        .addTo(layerGroup)
        .bindTooltip(
          `새 안전 경로 · ${routes.reroute.distanceKm}km · ${routes.reroute.durationMin}분`,
        );
    }

    if (
      showNewDanger ||
      showReroutedRoute
    ) {
      L.circle(
        [
          routes.dangerPoint.lat,
          routes.dangerPoint.lng,
        ],
        {
          radius: 65,
          color: "#ef4444",
          weight: 3,
          fillColor: "#ef4444",
          fillOpacity: 0.16,
        },
      ).addTo(layerGroup);

      L.circleMarker(
        [
          routes.dangerPoint.lat,
          routes.dangerPoint.lng,
        ],
        {
          radius: 13,
          color: "#ffffff",
          weight: 4,
          fillColor: "#ef4444",
          fillOpacity: 1,
        },
      )
        .addTo(layerGroup)
        .bindTooltip(
          "트램 공사 · 보도 통제",
          {
            direction: "top",
            offset: [0, -10],
          },
        );
    }

    if (showCurrentLocation) {
      const activeRoute =
        showReroutedRoute
          ? routes.reroute.coordinates
          : routes.safe.coordinates;

      const currentPosition =
        getPointAtProgress(
          activeRoute,
          progress,
        );

      L.circle(
        [
          currentPosition.lat,
          currentPosition.lng,
        ],
        {
          radius: 30,
          color: "#087cff",
          weight: 1,
          fillColor: "#087cff",
          fillOpacity: 0.15,
        },
      ).addTo(layerGroup);

      L.circleMarker(
        [
          currentPosition.lat,
          currentPosition.lng,
        ],
        {
          radius: 10,
          color: "#ffffff",
          weight: 4,
          fillColor:
            mode === "guardian"
              ? "#7c3aed"
              : "#087cff",
          fillOpacity: 1,
        },
      )
        .addTo(layerGroup)
        .bindTooltip("B양 현재 위치", {
          permanent: true,
          direction: "right",
          offset: [13, 0],
        });
    }
  }, [
    mapReady,
    mode,
    progress,
    routes,
    showCurrentLocation,
    showNewDanger,
    showReroutedRoute,
    showSafeRoute,
    showShortestRoute,
  ]);

  return (
    <div className="relative h-full min-h-[680px] w-full overflow-hidden rounded-3xl bg-slate-200">
      <div
        ref={mapContainerRef}
        className="h-full min-h-[680px] w-full"
      />

      {!routes ? (
        <div className="absolute left-1/2 top-6 z-[500] -translate-x-1/2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-xl">
          실제 보행 경로를 불러오는 중입니다.
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-4 left-4 z-[500] rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
        <div className="space-y-2 text-xs font-semibold text-slate-700">
          {showSafeRoute ||
          showReroutedRoute ? (
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-7 rounded-full bg-blue-500" />
              AI 추천 안전 경로
            </div>
          ) : null}

          {showShortestRoute ? (
            <div className="flex items-center gap-2">
              <span className="w-7 border-t-2 border-dashed border-slate-500" />
              일반 최단 경로
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-500 ring-2 ring-red-200" />
            공사·보도 통제
          </div>
        </div>

        <p className="mt-2 text-[10px] font-medium text-slate-400">
          지도·경로 데이터 © OpenStreetMap
          contributors
        </p>
      </div>
    </div>
  );
}