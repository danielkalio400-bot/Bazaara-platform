/** Public input validation and provider-neutral result mapping. No network dependencies. */
export class SearchError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'SearchError';
    this.code = code;
    this.status = status;
  }
}

const validCategories = new Set(['web', 'images', 'news']);
const validSafety = new Set(['off', 'moderate', 'strict']);
const validCountries = new Set(['ALL', 'NG', 'US', 'GB', 'CA', 'GH', 'ZA', 'IN', 'KE']);

export function parseSearch(url) {
  const params = url.searchParams;
  for (const name of ['q', 'category', 'page', 'safe', 'country']) {
    if (params.getAll(name).length > 1) throw new SearchError('INVALID_QUERY', `Duplicate ${name} parameter.`);
  }
  const q = (params.get('q') ?? '').trim().replace(/\s+/gu, ' ');
  if (!q) throw new SearchError('INVALID_QUERY', 'Enter a search term.');
  if ([...q].length > 200 || /[\u0000-\u001f\u007f]/u.test(q)) {
    throw new SearchError('INVALID_QUERY', 'Search terms must be 1–200 characters without control characters.');
  }
  const category = params.get('category') ?? 'web';
  if (!validCategories.has(category)) throw new SearchError('INVALID_CATEGORY', 'Choose Web, Images or News.');
  const rawPage = params.get('page') ?? '1';
  if (!/^(?:[1-9]|10)$/u.test(rawPage)) throw new SearchError('INVALID_PAGE', 'Page must be between 1 and 10.');
  const page = Number(rawPage);
  if (category === 'images' && page !== 1) {
    throw new SearchError('UNSUPPORTED_PAGE', 'Image search does not support pagination.');
  }
  const safe = params.get('safe') ?? 'moderate';
  if (!validSafety.has(safe)) throw new SearchError('INVALID_SAFESEARCH', 'Invalid SafeSearch setting.');
  const country = (params.get('country') ?? 'ALL').toUpperCase();
  if (!validCountries.has(country)) throw new SearchError('INVALID_COUNTRY', 'Unsupported search region.');
  return { q, category, page, safe, country };
}

export function cleanText(value, max = 800) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/gu, ' ').replace(/\s+/gu, ' ').trim().slice(0, max);
}

export function safeExternalUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const target = new URL(value);
    if (!['https:', 'http:'].includes(target.protocol) || target.username || target.password) return null;
    return target.href;
  } catch {
    return null;
  }
}

/** @param {unknown} raw @param {'web'|'images'|'news'} category */
export function normalizeResults(raw, category) {
  const response = raw && typeof raw === 'object' ? raw : {};
  const container = response[category];
  const entries = Array.isArray(container?.results) ? container.results : [];
  const normalized = entries.map((item) => {
    if (!item || typeof item !== 'object') return null;
    const url = safeExternalUrl(item.url);
    if (!url) return null;
    const headline = cleanText(item.title, 240) || new URL(url).hostname;
    const description = cleanText(item.description ?? item.snippet ?? '', 650);
    const thumbnail = category === 'images' ? safeExternalUrl(item.thumbnail?.src) : null;
    return {
      title: headline,
      url,
      displayUrl: new URL(url).hostname.replace(/^www\./u, ''),
      description,
      ...(category === 'images' ? { thumbnail } : {}),
      ...(category === 'news' ? { age: cleanText(item.age ?? '', 50) } : {}),
    };
  }).filter(Boolean);
  return { results: normalized, hasMore: category !== 'images' && normalized.length >= 10 };
}
