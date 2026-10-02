import { SearchResultsClient } from "./search-results-client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SearchResultsPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const input = searchParams ? await searchParams : {};
  const initialParams = Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  );
  return <SearchResultsClient initialParams={initialParams} />;
}
