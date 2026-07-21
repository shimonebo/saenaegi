"use client";

import { useEffect, useMemo, useState } from "react";

import { DemoMap } from "@/components/demo/DemoMap";
import {
  demoAnalysisSteps,
  demoChild,
  demoDestination,
  demoGuardianNotification,
  demoNewDangerAlert,
  demoOrigin,
  demoReroutedSafeRoute,
  demoSafeRoute,
  demoShortestRoute,
} from "@/lib/demo-data";

const demoSteps = [
  "시작 화면",
  "장소 입력",
  "AI 분석",
  "경로 비교",
  "귀가 시작",
  "위험 경보",
  "경로 재탐색",
  "보호자 알림",
  "SOS 신고",
  "기능 요약",
];

const autoStepDurations = [
  3000,
  5000,
  4000,
  7000,
  11000,
  6000,
  7000,
  7000,
  8000,
  6000,
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function playAlertSound() {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime,
    );

    oscillator.frequency.setValueAtTime(
      660,
      audioContext.currentTime + 0.25,
    );

    gainNode.gain.setValueAtTime(
      0.12,
      audioContext.currentTime,
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.55,
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.55);
  } catch {
    // 브라우저에서 소리를 차단해도 시연은 계속 진행한다.
  }
}

function StatusBadge({
  color,
  children,
}: {
  color: "green" | "yellow" | "red" | "blue";
  children: React.ReactNode;
}) {
  const styleByColor = {
    green:
      "border-green-200 bg-green-50 text-green-700",
    yellow:
      "border-amber-200 bg-amber-50 text-amber-700",
    red:
      "border-red-200 bg-red-50 text-red-700",
    blue:
      "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-extrabold ${styleByColor[color]}`}
    >
      {children}
    </span>
  );
}

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const [typedOrigin, setTypedOrigin] = useState("");
  const [typedDestination, setTypedDestination] =
    useState("");

  const [analysisIndex, setAnalysisIndex] =
    useState(-1);

  const [progress, setProgress] = useState(0);

  const [sosConfirmed, setSosConfirmed] =
    useState(false);

  const [screenMode, setScreenMode] = useState<
    "child" | "guardian"
  >("child");

  const currentStepName = demoSteps[step];

  const remainingDistance = useMemo(() => {
    const distance =
      step >= 6
        ? demoReroutedSafeRoute.distanceKm
        : demoSafeRoute.distanceKm;

    return Math.max(
      0,
      Number((distance * (1 - progress)).toFixed(2)),
    );
  }, [progress, step]);

  const remainingMinutes = useMemo(() => {
    const minutes =
      step >= 6
        ? demoReroutedSafeRoute.durationMin
        : demoSafeRoute.durationMin;

    return Math.max(
      0,
      Math.ceil(minutes * (1 - progress)),
    );
  }, [progress, step]);

  function goToStep(nextStep: number) {
    setStep(
      clamp(nextStep, 0, demoSteps.length - 1),
    );
  }

  function restartDemo() {
    setAutoPlay(false);
    setStep(0);
    setTypedOrigin("");
    setTypedDestination("");
    setAnalysisIndex(-1);
    setProgress(0);
    setSosConfirmed(false);
    setScreenMode("child");
  }

  function startAutomaticDemo() {
    setStep(1);
    setAutoPlay(true);
    setTypedOrigin("");
    setTypedDestination("");
    setAnalysisIndex(-1);
    setProgress(0);
    setSosConfirmed(false);
    setScreenMode("child");
  }

  useEffect(() => {
    if (!autoPlay) {
      return;
    }

    if (step >= demoSteps.length - 1) {
      setAutoPlay(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setStep((currentStep) =>
        Math.min(
          currentStep + 1,
          demoSteps.length - 1,
        ),
      );
    }, autoStepDurations[step]);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [autoPlay, step]);

  useEffect(() => {
    if (step !== 1) {
      return;
    }

    setTypedOrigin("");
    setTypedDestination("");

    const originText = demoOrigin.name;
    const destinationText = demoDestination.name;

    let originIndex = 0;
    let destinationIndex = 0;

    const interval = window.setInterval(() => {
      if (originIndex < originText.length) {
        originIndex += 1;

        setTypedOrigin(
          originText.slice(0, originIndex),
        );

        return;
      }

      if (
        destinationIndex <
        destinationText.length
      ) {
        destinationIndex += 1;

        setTypedDestination(
          destinationText.slice(
            0,
            destinationIndex,
          ),
        );

        return;
      }

      window.clearInterval(interval);
    }, 90);

    return () => {
      window.clearInterval(interval);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 2) {
      return;
    }

    setAnalysisIndex(-1);

    let index = -1;

    const interval = window.setInterval(() => {
      index += 1;
      setAnalysisIndex(index);

      if (
        index >=
        demoAnalysisSteps.length - 1
      ) {
        window.clearInterval(interval);
      }
    }, 480);

    return () => {
      window.clearInterval(interval);
    };
  }, [step]);

  useEffect(() => {
    if (step !== 4) {
      return;
    }

    setProgress(0);

    const interval = window.setInterval(() => {
      setProgress((currentProgress) => {
        const nextProgress =
          currentProgress + 0.006;

        if (nextProgress >= 0.55) {
          window.clearInterval(interval);
          return 0.55;
        }

        return nextProgress;
      });
    }, 100);

    return () => {
      window.clearInterval(interval);
    };
  }, [step]);

  useEffect(() => {
    if (step === 5) {
      setProgress(0.55);
      playAlertSound();
    }

    if (step === 6) {
      setProgress(0.56);

      const interval = window.setInterval(() => {
        setProgress((currentProgress) => {
          const nextProgress =
            currentProgress + 0.006;

          if (nextProgress >= 0.78) {
            window.clearInterval(interval);
            return 0.78;
          }

          return nextProgress;
        });
      }, 100);

      return () => {
        window.clearInterval(interval);
      };
    }

    if (step === 7) {
      setProgress(0.78);
      setScreenMode("guardian");
    }

    if (step === 8) {
      setScreenMode("child");
      setSosConfirmed(false);
    }

    return undefined;
  }, [step]);

  useEffect(() => {
    if (step === 8 && autoPlay) {
      const timeout = window.setTimeout(() => {
        setSosConfirmed(true);
        playAlertSound();
      }, 2500);

      return () => {
        window.clearTimeout(timeout);
      };
    }

    return undefined;
  }, [autoPlay, step]);

  const showShortestRoute =
    step >= 2 && step <= 4;

  const showSafeRoute =
    step >= 2 && step <= 5;

  const showReroutedRoute =
    step >= 6 && step <= 8;

  const showNewDanger =
    step >= 5 && step <= 8;

  const showCurrentLocation =
    step >= 4 && step <= 8;

  return (
    <main className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 text-xl font-black shadow-lg shadow-blue-500/20">
              길
            </div>

            <div>
              <h1 className="text-xl font-black">
                아이온길
              </h1>

              <p className="text-xs font-semibold text-slate-400">
                AI 아동 안심 귀가 웹 서비스
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-extrabold text-blue-300">
              MVP DEMO
            </span>

            <span className="text-sm font-bold text-slate-400">
              {step + 1}/{demoSteps.length}
              {" · "}
              {currentStepName}
            </span>
          </div>
        </div>
      </header>

      {step === 0 ? (
        <section className="mx-auto flex min-h-[calc(100vh-78px)] max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[36px] bg-gradient-to-br from-blue-400 to-blue-700 text-5xl font-black shadow-2xl shadow-blue-500/30">
            ✓
          </div>

          <p className="mb-4 text-sm font-extrabold tracking-[0.3em] text-blue-300">
            AI SAFE ROUTE WEB
          </p>

          <h2 className="max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
            빠른 길보다
            <br />
            아이에게 더 안전한 길
          </h2>

          <p className="mt-7 max-w-3xl text-lg font-medium leading-8 text-slate-300 sm:text-xl">
            대전 트램 공사와 보행 위험을
            분석해 안전한 귀갓길을 추천하고,
            이동 중 위험이 발생하면 새로운
            우회 경로를 안내합니다.
          </p>

          <button
            type="button"
            onClick={startAutomaticDemo}
            className="mt-10 rounded-2xl bg-blue-500 px-10 py-5 text-xl font-black text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-1 hover:bg-blue-400"
          >
            자동 시연 시작
          </button>

          <button
            type="button"
            onClick={() => goToStep(1)}
            className="mt-4 text-sm font-bold text-slate-400 underline underline-offset-4"
          >
            수동으로 살펴보기
          </button>
        </section>
      ) : (
        <section className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              {demoSteps.slice(1).map(
                (name, index) => {
                  const realIndex = index + 1;
                  const isCurrent =
                    realIndex === step;
                  const isCompleted =
                    realIndex < step;

                  return (
                    <div
                      key={name}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold ${
                        isCurrent
                          ? "bg-blue-500 text-white"
                          : isCompleted
                            ? "bg-green-500/15 text-green-300"
                            : "bg-white/5 text-slate-500"
                      }`}
                    >
                      {realIndex}. {name}
                    </div>
                  );
                },
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setScreenMode("child")
                }
                className={`rounded-xl px-4 py-2 text-sm font-extrabold ${
                  screenMode === "child"
                    ? "bg-blue-500 text-white"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                아이 화면
              </button>

              <button
                type="button"
                onClick={() =>
                  setScreenMode("guardian")
                }
                className={`rounded-xl px-4 py-2 text-sm font-extrabold ${
                  screenMode === "guardian"
                    ? "bg-violet-500 text-white"
                    : "bg-white/5 text-slate-400"
                }`}
              >
                보호자 화면
              </button>
            </div>
          </div>

          <div className="grid min-h-[680px] gap-5 lg:grid-cols-[370px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-white/10 bg-[#101a29] p-6 shadow-2xl">
              {step === 1 ? (
                <div>
                  <p className="text-sm font-extrabold text-blue-300">
                    STEP 1
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    안전한 귀갓길 찾기
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    학교와 집을 입력하면 AI가
                    경로 후보를 비교합니다.
                  </p>

                  <label className="mt-8 block text-sm font-extrabold text-slate-300">
                    출발지
                  </label>

                  <div className="mt-2 min-h-16 rounded-2xl border-2 border-blue-500 bg-[#172235] px-4 py-4 text-lg font-bold">
                    {typedOrigin || (
                      <span className="text-slate-600">
                        학교 또는 주소 입력
                      </span>
                    )}

                    <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-blue-400 align-middle" />
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {demoOrigin.address}
                  </p>

                  <label className="mt-7 block text-sm font-extrabold text-slate-300">
                    도착지
                  </label>

                  <div className="mt-2 min-h-16 rounded-2xl border-2 border-blue-500 bg-[#172235] px-4 py-4 text-lg font-bold">
                    {typedDestination || (
                      <span className="text-slate-600">
                        아파트 또는 주소 입력
                      </span>
                    )}

                    {typedOrigin.length ===
                    demoOrigin.name.length ? (
                      <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-blue-400 align-middle" />
                    ) : null}
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {demoDestination.address}
                  </p>

                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    disabled={
                      typedOrigin.length !==
                        demoOrigin.name.length ||
                      typedDestination.length !==
                        demoDestination.name.length
                    }
                    className="mt-8 w-full rounded-2xl bg-blue-500 px-5 py-4 text-lg font-black disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                  >
                    AI 안전 경로 분석
                  </button>
                </div>
              ) : null}

              {step === 2 ? (
                <div>
                  <p className="text-sm font-extrabold text-blue-300">
                    STEP 2
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    AI 분석 중
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    공사 정보와 보행 안전 데이터를
                    분석하고 있습니다.
                  </p>

                  <div className="mt-8 space-y-3">
                    {demoAnalysisSteps.map(
                      (analysisStep, index) => {
                        const completed =
                          index <= analysisIndex;

                        return (
                          <div
                            key={analysisStep}
                            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                              completed
                                ? "border-green-500/30 bg-green-500/10"
                                : "border-white/5 bg-white/[0.03]"
                            }`}
                          >
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                                completed
                                  ? "bg-green-500 text-white"
                                  : "bg-slate-800 text-slate-500"
                              }`}
                            >
                              {completed
                                ? "✓"
                                : index + 1}
                            </span>

                            <span
                              className={`text-sm font-bold ${
                                completed
                                  ? "text-green-200"
                                  : "text-slate-500"
                              }`}
                            >
                              {analysisStep}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div>
                  <p className="text-sm font-extrabold text-blue-300">
                    STEP 3
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    경로 비교 결과
                  </h2>

                  <div className="mt-7 rounded-2xl border border-slate-600 bg-slate-800/70 p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black">
                        일반 최단 경로
                      </h3>

                      <StatusBadge color="red">
                        안전도{" "}
                        {
                          demoShortestRoute.safetyScore
                        }
                        점
                      </StatusBadge>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          거리
                        </p>
                        <p className="mt-1 text-2xl font-black">
                          {
                            demoShortestRoute.distanceKm
                          }
                          km
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          시간
                        </p>
                        <p className="mt-1 text-2xl font-black">
                          {
                            demoShortestRoute.durationMin
                          }
                          분
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-6 text-red-300">
                      공사 구간과 차도 인접 임시
                      보행로를 통과합니다.
                    </p>
                  </div>

                  <div className="mt-4 rounded-2xl border-2 border-blue-500 bg-blue-500/10 p-5 shadow-lg shadow-blue-500/10">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-black text-blue-200">
                        AI 추천 안전 경로
                      </h3>

                      <StatusBadge color="green">
                        안전도{" "}
                        {demoSafeRoute.safetyScore}점
                      </StatusBadge>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          거리
                        </p>
                        <p className="mt-1 text-2xl font-black">
                          {demoSafeRoute.distanceKm}
                          km
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          시간
                        </p>
                        <p className="mt-1 text-2xl font-black">
                          {demoSafeRoute.durationMin}
                          분
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-6 text-blue-100">
                      2분 더 걸리지만 공사와 보도
                      통제 구간을 피하고 CCTV가 있는
                      길을 이용합니다.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="mt-6 w-full rounded-2xl bg-blue-500 px-5 py-4 text-lg font-black"
                  >
                    이 경로로 귀가 시작
                  </button>
                </div>
              ) : null}

              {step === 4 ? (
                <div>
                  <p className="text-sm font-extrabold text-blue-300">
                    STEP 4
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    실시간 귀가 안내
                  </h2>

                  <div className="mt-5">
                    <StatusBadge color="green">
                      정상 이동
                    </StatusBadge>
                  </div>

                  <div className="mt-7 rounded-2xl bg-[#172235] p-5">
                    <p className="text-sm font-bold text-slate-400">
                      자녀
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      {demoChild.name}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          이동 속도
                        </p>
                        <p className="mt-1 text-xl font-black">
                          {demoChild.speedKmh}
                          km/h
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          남은 거리
                        </p>
                        <p className="mt-1 text-xl font-black">
                          {remainingDistance}km
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          남은 시간
                        </p>
                        <p className="mt-1 text-xl font-black">
                          {remainingMinutes}분
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          위치 공유
                        </p>
                        <p className="mt-1 text-sm font-black text-green-300">
                          공유 중
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
                    <p className="text-xs font-extrabold text-blue-300">
                      다음 안내
                    </p>

                    <p className="mt-2 text-lg font-black leading-7">
                      150m 직진 후 횡단보도에서
                      좌회전하세요.
                    </p>
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div>
                  <p className="text-sm font-extrabold text-red-300">
                    STEP 5
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-red-100">
                    위험 경보
                  </h2>

                  <div className="mt-5">
                    <StatusBadge color="red">
                      위험 감지
                    </StatusBadge>
                  </div>

                  <div className="mt-7 animate-pulse rounded-2xl border-2 border-red-500 bg-red-500/15 p-5">
                    <p className="text-sm font-extrabold text-red-300">
                      전방 80m
                    </p>

                    <h3 className="mt-2 text-xl font-black">
                      {demoNewDangerAlert.title}
                    </h3>

                    <p className="mt-4 text-sm font-semibold leading-6 text-red-100">
                      {
                        demoNewDangerAlert.description
                      }
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#172235] p-5">
                    <p className="text-sm font-black">
                      AI가 안전한 우회 경로를
                      재탐색합니다.
                    </p>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
                      <div className="h-full w-3/4 animate-pulse rounded-full bg-blue-500" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => goToStep(6)}
                    className="mt-6 w-full rounded-2xl bg-red-500 px-5 py-4 text-lg font-black"
                  >
                    안전 경로 재탐색
                  </button>
                </div>
              ) : null}

              {step === 6 ? (
                <div>
                  <p className="text-sm font-extrabold text-blue-300">
                    STEP 6
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    안전 우회 경로
                  </h2>

                  <div className="mt-5">
                    <StatusBadge color="green">
                      재탐색 완료
                    </StatusBadge>
                  </div>

                  <div className="mt-7 rounded-2xl border-2 border-blue-500 bg-blue-500/10 p-5">
                    <p className="text-sm font-extrabold text-blue-300">
                      새로운 AI 안전도
                    </p>

                    <p className="mt-2 text-5xl font-black">
                      {
                        demoReroutedSafeRoute.safetyScore
                      }
                      <span className="text-xl text-slate-400">
                        점
                      </span>
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          추가 거리
                        </p>
                        <p className="mt-1 text-xl font-black">
                          120m
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-500">
                          추가 시간
                        </p>
                        <p className="mt-1 text-xl font-black">
                          2분
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="rounded-xl bg-green-500/10 px-4 py-3 text-sm font-bold text-green-200">
                      ✓ 신규 공사 구간 회피
                    </div>

                    <div className="rounded-xl bg-green-500/10 px-4 py-3 text-sm font-bold text-green-200">
                      ✓ 어린이보호구역 추가 경유
                    </div>

                    <div className="rounded-xl bg-green-500/10 px-4 py-3 text-sm font-bold text-green-200">
                      ✓ CCTV 2곳 추가 경유
                    </div>
                  </div>

                  <p className="mt-5 text-sm font-semibold leading-6 text-slate-300">
                    보호자에게 변경된 경로와 도착
                    예정 시간을 전달했습니다.
                  </p>
                </div>
              ) : null}

              {step === 7 ||
              screenMode === "guardian" ? (
                <div>
                  <p className="text-sm font-extrabold text-violet-300">
                    보호자 화면
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    자녀 귀가 현황
                  </h2>

                  <div className="mt-5">
                    <StatusBadge color="yellow">
                      주의 → 안전 우회 중
                    </StatusBadge>
                  </div>

                  <div className="mt-7 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-5">
                    <p className="text-sm font-extrabold text-violet-200">
                      {
                        demoGuardianNotification.title
                      }
                    </p>

                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-200">
                      {
                        demoGuardianNotification.message
                      }
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-[#172235] p-4">
                      <p className="text-xs font-bold text-slate-500">
                        기존 도착 예정
                      </p>

                      <p className="mt-2 text-lg font-black line-through decoration-red-400">
                        {
                          demoGuardianNotification.previousArrivalTime
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
                      <p className="text-xs font-bold text-green-300">
                        변경 도착 예정
                      </p>

                      <p className="mt-2 text-lg font-black text-green-100">
                        {
                          demoGuardianNotification.changedArrivalTime
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className="rounded-xl bg-violet-500 px-4 py-3 text-sm font-black"
                    >
                      현재 위치 확인
                    </button>

                    <button
                      type="button"
                      className="rounded-xl bg-white/10 px-4 py-3 text-sm font-black"
                    >
                      자녀에게 전화
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 8 &&
              screenMode === "child" ? (
                <div>
                  <p className="text-sm font-extrabold text-red-300">
                    STEP 8
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    긴급 도움 요청
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    길을 잃었거나 위험한 상황에서
                    보호자에게 현재 위치를 전송합니다.
                  </p>

                  {!sosConfirmed ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSosConfirmed(true);
                        playAlertSound();
                      }}
                      className="mx-auto mt-14 flex h-52 w-52 animate-pulse flex-col items-center justify-center rounded-full border-8 border-red-400/30 bg-red-500 text-white shadow-2xl shadow-red-500/30"
                    >
                      <span className="text-5xl font-black">
                        SOS
                      </span>

                      <span className="mt-3 text-sm font-extrabold">
                        긴급 도움 요청
                      </span>
                    </button>
                  ) : (
                    <div className="mt-8 rounded-3xl border-2 border-red-500 bg-red-500/15 p-6">
                      <p className="text-sm font-extrabold text-red-300">
                        긴급 알림 전송 완료
                      </p>

                      <h3 className="mt-2 text-2xl font-black">
                        B양이 긴급 도움을 요청했습니다.
                      </h3>

                      <div className="mt-5 space-y-3 text-sm font-bold text-red-100">
                        <p>
                          • 추천 경로에서 80m 이탈
                        </p>

                        <p>
                          • 같은 위치에서 2분 정지
                        </p>

                        <p>
                          • 이동 속도 0km/h
                        </p>

                        <p>
                          • 공사 위험 구간 인접
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setScreenMode("guardian")
                        }
                        className="mt-6 w-full rounded-xl bg-red-500 px-4 py-3 font-black"
                      >
                        보호자 화면 확인
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {step === 9 ? (
                <div>
                  <p className="text-sm font-extrabold text-blue-300">
                    시연 완료
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    아이온길 핵심 기능
                  </h2>

                  <div className="mt-8 space-y-4">
                    {[
                      {
                        number: "01",
                        title: "AI 안전 경로 추천",
                        description:
                          "공사와 보행 위험을 분석해 안전한 귀갓길을 추천합니다.",
                      },
                      {
                        number: "02",
                        title:
                          "위험 감지 및 경로 재탐색",
                        description:
                          "이동 중 새로운 위험이 발생하면 즉시 우회 경로를 계산합니다.",
                      },
                      {
                        number: "03",
                        title:
                          "보호자 모니터링 및 SOS",
                        description:
                          "위험 단계, 현재 위치, AI 상황 요약을 보호자에게 전달합니다.",
                      },
                    ].map((feature) => (
                      <div
                        key={feature.number}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                      >
                        <p className="text-sm font-black text-blue-300">
                          {feature.number}
                        </p>

                        <h3 className="mt-1 text-lg font-black">
                          {feature.title}
                        </h3>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={restartDemo}
                    className="mt-7 w-full rounded-2xl bg-blue-500 px-5 py-4 text-lg font-black"
                  >
                    처음부터 다시 보기
                  </button>
                </div>
              ) : null}
            </aside>

            <div className="relative min-h-[680px] overflow-hidden rounded-3xl border border-white/10 bg-slate-200 shadow-2xl">
              <DemoMap
                showShortestRoute={
                  showShortestRoute
                }
                showSafeRoute={showSafeRoute}
                showReroutedRoute={
                  showReroutedRoute
                }
                showInitialRisks
                showNewDanger={showNewDanger}
                showCurrentLocation={
                  showCurrentLocation
                }
                progress={progress}
                mode={screenMode}
              />

              {step === 5 ? (
                <div className="pointer-events-none absolute left-1/2 top-7 z-[700] w-[calc(100%-40px)] max-w-2xl -translate-x-1/2 animate-pulse rounded-2xl border-2 border-red-300 bg-red-600 px-6 py-4 text-white shadow-2xl">
                  <p className="text-xs font-extrabold text-red-100">
                    위험 경보
                  </p>

                  <p className="mt-1 text-xl font-black">
                    전방 80m 트램 공사로 보도가
                    통제되었습니다.
                  </p>

                  <p className="mt-1 text-sm font-semibold text-red-100">
                    AI가 안전한 우회 경로를
                    재탐색합니다.
                  </p>
                </div>
              ) : null}

              {step === 8 &&
              sosConfirmed ? (
                <div className="absolute inset-x-5 top-6 z-[700] rounded-2xl border-2 border-red-300 bg-red-600 px-6 py-4 text-white shadow-2xl">
                  <p className="text-xs font-extrabold text-red-100">
                    보호자 긴급 알림
                  </p>

                  <p className="mt-1 text-xl font-black">
                    B양이 긴급 도움을
                    요청했습니다.
                  </p>

                  <p className="mt-1 text-sm font-semibold text-red-100">
                    현재 위치와 이동 상황을
                    확인해주세요.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101a29] p-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  goToStep(step - 1)
                }
                disabled={step <= 1}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black disabled:opacity-30"
              >
                이전 단계
              </button>

              <button
                type="button"
                onClick={() =>
                  goToStep(step + 1)
                }
                disabled={
                  step >= demoSteps.length - 1
                }
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-black disabled:opacity-30"
              >
                다음 단계
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setAutoPlay(
                    (current) => !current,
                  )
                }
                className={`rounded-xl px-4 py-2 text-sm font-black ${
                  autoPlay
                    ? "bg-amber-500 text-slate-950"
                    : "bg-green-500 text-white"
                }`}
              >
                {autoPlay
                  ? "자동 시연 일시정지"
                  : "자동 시연 계속"}
              </button>

              <button
                type="button"
                onClick={restartDemo}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-black"
              >
                처음부터 다시
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}