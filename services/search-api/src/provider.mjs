import { SearchError, normalizeResults } from './search.mjs';

const ENDPOINTS = Object.freeze({
  web: 'https://api.search.brave.com/res/v1/web/search',
  images: 'https://api.search.brave.com/res/v1/images/search',
  news: 'https://api.search.brave.com/res/v1/news/search',
});

/**
 * Brave Search API adapter. Never sends the caller's IP, cookies or user agent to Brave.
 * No fallbacks to scraping or fabricated results when a provider is unavailable.
 */
export async function searchBrave(params, {
  apiKey = process.env.BRAVE_SEARCH_API_KEY,
  fetchImpl = globalThis.fetch,
  timeoutMs = 6500,
} = {}) {
  if (!apiKey?.trim()) {
    throw new SearchError('PROVIDER_NOT_CONFIGURED', 'The search provider has not been configured.', 503);
  }
  const query = new URLSearchParams({
    q: params.q,
    count: '10',
    safesearch: params.category === 'images' ? (params.safe === 'off' ? 'off' : 'strict') : params.safe,
    search_lang: 'en',
  });
  if (params.category !== 'images') query.set('offset', String(params.page - 1));
  if (params.country !== 'ALL') query.set('country', params.country);
  else query.set('country', 'ALL');

  const url = `${ENDPOINTS[params.category]}?${query}`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey.trim(),
      },
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'error',
    });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new SearchError('PROVIDER_TIMEOUT', 'The search provider took too long to respond.', 504);
    }
    throw new SearchError('PROVIDER_UNAVAILABLE', 'The search provider is temporarily unavailable.', 502);
  }
  if ([401, 403].includes(response.status)) {
    throw new SearchError('PROVIDER_AUTH', 'Search provider authorization failed; check the server-side API key.', 502);
  }
  if (response.status === 429) {
    throw new SearchError('PROVIDER_RATE_LIMIT', 'The search provider has reached its request limit.', 429);
  }
  if (!response.ok) {
    throw new SearchError('PROVIDER_ERROR', 'The search provider could not complete this request.', 502);
  }
  let payload;
  try { payload = await response.json(); } catch {
    throw new SearchError('PROVIDER_INVALID_RESPONSE', 'Invalid response from the search provider.', 502);
  }
  const normalized = normalizeResults(payload, params.category);
  return {
    query: params.q,
    category: params.category,
    page: params.page,
    safe: params.safe,
    country: params.country,
    provider: 'Brave Search API',
    ...normalized,
    privacy: {
      proxy: true,
      queryStoredByBazaara: false,
      providerReceivesQuery: true,
      notice: 'Your query is sent server-to-server to Brave Search. Brave has its own privacy and retention policies.',
    },
  };
}
