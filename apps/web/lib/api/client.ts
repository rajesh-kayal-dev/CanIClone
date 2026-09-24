const defaultBase = 'http://localhost:7000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? defaultBase;
}

type ApiFetchOptions = Omit<RequestInit, 'cache'> & {
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

/** JSON API helper. Client calls are uncached; server callers can opt into ISR. */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const base = getApiUrl();
  const init: ApiFetchOptions = {
    cache: 'no-store',
    ...options,
  };
  const res = await fetch(`${base}${path}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(
      res.status,
      body?.message ?? body?.error ?? `API ${res.status}`,
    );
  }
  const json = await res.json();
  return json.data as T;
}

export function cachedApiFetch<T>(
  path: string,
  revalidate = 60,
  tags: string[] = [],
): Promise<T> {
  return apiFetch<T>(path, {
    cache: 'force-cache',
    next: { revalidate, tags },
  });
}
