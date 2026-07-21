"use client";

import { useEffect, useRef } from "react";

type Coordinate = {
  lat: number;
  lng: number;
};

type RouteMapProps = {
  safePath: Coordinate[];
  shortestPath: Coordinate[];
};

export function RouteMap({
  safePath,
  shortestPath,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    async function createMap() {
      const L = await import("leaflet");

      if (cancelled || !mapContainerRef.current) {
        return;
      }

      mapContainerRef.current.innerHTML = "";

      map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        },
      ).addTo(map);

      const safePoints = safePath.map(
        (point) =>
          [point.lat, point.lng] as [number, number],
      );

      const shortestPoints = shortestPath.map(
        (point) =>
          [point.lat, point.lng] as [number, number],
      );

      if (shortestPoints.length >= 2) {
        L.polyline(shortestPoints, {
          color: "#596473",
          weight: 5,
          opacity: 0.9,
          dashArray: "10 10",
        }).addTo(map);
      }

      if (safePoints.length >= 2) {
        L.polyline(safePoints, {
          color: "#007afc",
          weight: 8,
          opacity: 1,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }

      const startPoint =
        safePoints[0] ?? shortestPoints[0];

      const endPoint =
        safePoints[safePoints.length - 1] ??
        shortestPoints[shortestPoints.length - 1];

      if (startPoint) {
        L.circleMarker(startPoint, {
          radius: 10,
          color: "#ffffff",
          weight: 4,
          fillColor: "#16a34a",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup("출발지");
      }

      if (endPoint) {
        L.circleMarker(endPoint, {
          radius: 10,
          color: "#ffffff",
          weight: 4,
          fillColor: "#007afc",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindPopup("도착지");
      }

      const allPoints = [
        ...safePoints,
        ...shortestPoints,
      ];

      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), {
          padding: [50, 50],
        });
      } else {
        map.setView([36.3504, 127.3848], 15);
      }

      window.setTimeout(() => {
        map?.invalidateSize();
      }, 100);
    }

    void createMap();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [safePath, shortestPath]);

  return (
    <div
      ref={mapContainerRef}
      className="h-full min-h-[720px] w-full"
    />
  );
}