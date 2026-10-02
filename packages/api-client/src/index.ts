export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: QueryParams;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  idempotencyKey?: string;
  cache?: RequestCache;
  requestId?: string;
  maxRetries?: number;
};

export type ApiClientOptions = {
  baseUrl: string;
  fetchImpl?: typeof fetch;
  credentials?: RequestCredentials;
  defaultHeaders?: HeadersInit;
  getAccessToken?: () => string | undefined | Promise<string | undefined>;
  onUnauthorized?: (context: { path: string; status: number }) => void | Promise<void>;
  maxGetRetries?: number;
  retryBaseDelayMs?: number;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(input: {
    message: string;
    status: number;
    code?: string;
    details?: unknown;
    requestId?: string;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.details = input.details;
    this.requestId = input.requestId;
  }
}

function joinUrl(baseUrl: string, path: string, query?: QueryParams) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${normalizedBase}${normalizedPath}`);

  if (query) {
    for (const [key, raw] of Object.entries(query)) {
      const values = Array.isArray(raw) ? raw : [raw];
      for (const value of values) {
        if (value === undefined || value === null) continue;
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url.toString();
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) return response.json().catch(() => undefined);
  return response.text().catch(() => undefined);
}

export class ApiClient {
  private readonly options: ApiClientOptions;
  private readonly fetchImpl: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.options = options;
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const headers = new Headers(this.options.defaultHeaders);
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));

    const token = await this.options.getAccessToken?.();
    if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
    if (options.idempotencyKey) headers.set("idempotency-key", options.idempotencyKey);

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      if (
        typeof options.body === "string" ||
        options.body instanceof FormData ||
        options.body instanceof URLSearchParams ||
        options.body instanceof Blob ||
        options.body instanceof ArrayBuffer
      ) {
        body = options.body as BodyInit;
      } else {
        headers.set("content-type", headers.get("content-type") ?? "application/json");
        body = JSON.stringify(options.body);
      }
    }

    const method = options.method ?? (body ? "POST" : "GET");
    const requestId = options.requestId ?? `bz-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    if (!headers.has("x-request-id")) headers.set("x-request-id", requestId);

    // Retries are deliberately limited to safe GET requests. Financial/order mutations
    // must rely on their explicit idempotency keys instead of transparent replay.
    const maxRetries = method === "GET" ? Math.max(0, Math.min(3, options.maxRetries ?? this.options.maxGetRetries ?? 1)) : 0;
    const retryBaseDelayMs = Math.max(50, this.options.retryBaseDelayMs ?? 250);
    let response: Response | undefined;
    let lastNetworkError: unknown;
    const url = joinUrl(this.options.baseUrl, path, options.query);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (options.signal?.aborted) throw new DOMException("The request was cancelled", "AbortError");
      try {
        response = await this.fetchImpl(url, {
          method,
          headers,
          body,
          signal: options.signal,
          credentials: options.credentials ?? this.options.credentials ?? "include",
          cache: options.cache,
        });
        const retryableStatus = [429, 502, 503, 504].includes(response.status);
        if (!retryableStatus || attempt >= maxRetries) break;
      } catch (cause) {
        lastNetworkError = cause;
        if (attempt >= maxRetries || options.signal?.aborted) throw cause;
      }
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const signal = options.signal;
        const cleanup = () => signal?.removeEventListener("abort", abort);
        const finish = () => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        };
        const abort = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          cleanup();
          reject(new DOMException("The request was cancelled", "AbortError"));
        };
        const timer = setTimeout(finish, retryBaseDelayMs * 2 ** attempt);
        signal?.addEventListener("abort", abort, { once: true });
      });
    }

    if (!response) throw lastNetworkError instanceof Error ? lastNetworkError : new Error("Bazaara API request failed before receiving a response");
    const payload = await readResponseBody(response);
    if (!response.ok) {
      if (response.status === 401) await this.options.onUnauthorized?.({ path, status: response.status });
      // BAZAARA_API_ERROR_NORMALIZATION_V1
      // Bazaara APIs normally return { error: { code, message, details } }.
      // Fastify/Next may also surface { statusCode, error, message } or text.
      // Normalize all of them so the UI never hides a useful 409 reason behind
      // a generic "Bazaara API returned 409" message.
      const candidate = payload as
        | {
            error?: { message?: string; code?: string; details?: unknown } | string;
            message?: string;
            code?: string;
            details?: unknown;
          }
        | undefined;
      const nestedError =
        candidate?.error && typeof candidate.error === "object"
          ? candidate.error
          : undefined;
      const topLevelError =
        typeof candidate?.error === "string" ? candidate.error : undefined;
      const textPayload = typeof payload === "string" ? payload.trim() : undefined;

      throw new ApiError({
        message:
          nestedError?.message ??
          candidate?.message ??
          topLevelError ??
          textPayload ??
          `Bazaara API returned ${response.status}`,
        status: response.status,
        code: nestedError?.code ?? candidate?.code,
        details: nestedError?.details ?? candidate?.details,
        requestId: response.headers.get("x-request-id") ?? undefined,
      });
    }

    return payload as T;
  }

  get<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T>(path: string, body?: unknown, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T>(path: string, options: Omit<ApiRequestOptions, "method" | "body"> = {}) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export function createApiClient(options: ApiClientOptions) {
  return new ApiClient(options);
}
