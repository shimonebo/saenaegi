export default function Loading() {
  return (
    <main className="min-h-screen bg-[#0e1012] p-6 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <div className="w-full rounded-3xl border border-[#333943] bg-[#15171b] p-8 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#333943] border-t-[#007afc]" />

          <h1 className="mt-6 text-2xl font-extrabold">
            안전 경로를 계산하고 있습니다.
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#a0aaba]">
            첫 실행은 도보 도로망을 내려받아 시간이 조금 걸릴 수 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
