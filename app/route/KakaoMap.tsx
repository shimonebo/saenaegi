"use client";

import { useEffect, useRef, useState } from "react";

type Coord = { lat: number; lng: number };
type DangerZone = { lat: number; lng: number; risk_level?: string; location_name?: string };
type Props = {
  safeCoords: Coord[];
  shortestCoords: Coord[];
  dangerZones: DangerZone[];
};

export default function KakaoMap({ safeCoords, shortestCoords, dangerZones }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (safeCoords.length === 0) return;
    let cancelled = false;

    // SDK(layout.tsx에서 로드됨)가 준비될 때까지 기다렸다가 지도를 그린다.
    let tries = 0;
    const timer = setInterval(() => {
      const w = window as unknown as { kakao?: any };
      if (w.kakao && w.kakao.maps && typeof w.kakao.maps.load === "function") {
        clearInterval(timer);
        w.kakao.maps.load(() => {
          if (!cancelled) draw(w.kakao);
        });
      } else {
        tries += 1;
        if (tries > 100) {
          // 약 10초 기다려도 안 오면 실패 처리
          clearInterval(timer);
          if (!cancelled) setErr("카카오 지도를 불러오지 못했습니다. (키/도메인 등록 확인)");
        }
      }
    }, 100);

    function draw(kakao: any) {
      if (!ref.current) return;

      const map = new kakao.maps.Map(ref.current, {
        center: new kakao.maps.LatLng(safeCoords[0].lat, safeCoords[0].lng),
        level: 4,
      });
      const bounds = new kakao.maps.LatLngBounds();

      // 최단 경로 (회색 점선)
      new kakao.maps.Polyline({
        map,
        path: shortestCoords.map((c) => new kakao.maps.LatLng(c.lat, c.lng)),
        strokeWeight: 5,
        strokeColor: "#8b96aa",
        strokeOpacity: 0.8,
        strokeStyle: "shortdash",
      });

      // 안전 경로 (파란 실선)
      new kakao.maps.Polyline({
        map,
        path: safeCoords.map((c) => new kakao.maps.LatLng(c.lat, c.lng)),
        strokeWeight: 7,
        strokeColor: "#007afc",
        strokeOpacity: 0.95,
        strokeStyle: "solid",
      });

      // 출발/도착 마커
      const startPos = new kakao.maps.LatLng(safeCoords[0].lat, safeCoords[0].lng);
      const last = safeCoords[safeCoords.length - 1];
      const endPos = new kakao.maps.LatLng(last.lat, last.lng);
      new kakao.maps.Marker({ map, position: startPos });
      new kakao.maps.Marker({ map, position: endPos });

      // 위험구간 (빨간 원)
      dangerZones.forEach((z) => {
        const pos = new kakao.maps.LatLng(z.lat, z.lng);
        new kakao.maps.Circle({
          map,
          center: pos,
          radius: 120,
          strokeWeight: 2,
          strokeColor: "#ef4444",
          strokeOpacity: 0.8,
          fillColor: "#ef4444",
          fillOpacity: 0.25,
        });
        bounds.extend(pos);
      });

      [...safeCoords, ...shortestCoords].forEach((c) =>
        bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)),
      );
      map.setBounds(bounds);
    }

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [safeCoords, shortestCoords, dangerZones]);

  if (err) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[#8b96aa]">
        {err}
      </div>
    );
  }

  return <div ref={ref} className="absolute inset-0 h-full w-full" />;
}
