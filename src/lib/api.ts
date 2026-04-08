export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:4000';

function getAuthToken(): string | undefined {
  // Avoid crashing during Next SSR.
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('intore_token') || undefined;
}

async function parseJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { headers?: Record<string, string> } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getAuthToken();
  const res = await fetch(url, {
    ...opts,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    const details = await parseJsonSafe(res);
    throw new ApiError(`Request failed: ${res.status} ${res.statusText}`, res.status, details);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  // Let the browser set multipart boundary automatically.
  return apiFetch<T>(path, { method: 'POST', body: form });
}

