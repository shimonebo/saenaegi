import RouteResult from "./RouteResult";

type RoutePageProps = {
  searchParams: Promise<{
    start?: string | string[];
    destination?: string | string[];
  }>;
};

function getText(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function RoutePage({ searchParams }: RoutePageProps) {
  const params = await searchParams;
  const start = getText(params.start)?.trim() || "대전서원초등학교";
  const destination = getText(params.destination)?.trim() || "둔산동 보라아파트";

  return <RouteResult start={start} destination={destination} />;
}
