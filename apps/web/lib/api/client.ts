const defaultBase = 'http://localhost:4000';

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

export async function apiFetch<T>(path: string): Promise<T> {
  const base = getApiUrl();
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body?.message ?? `API ${res.status}`);
  }
  const json = await res.json();
  return json.data as T;
}