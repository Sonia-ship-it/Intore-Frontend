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

function extractBackendMessage(details: unknown): string | undefined {
  if (!details || typeof details !== 'object') return undefined;
  const maybe = details as { message?: unknown; error?: unknown; details?: unknown };
  if (typeof maybe.message === 'string' && maybe.message.trim()) return maybe.message;
  if (typeof maybe.error === 'string' && maybe.error.trim()) return maybe.error;
  if (typeof maybe.details === 'string' && maybe.details.trim()) return maybe.details;
  return undefined;
}

export async function apiFetch<T>(
  path: string,
  opts: RequestInit & { headers?: Record<string, string> } = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getAuthToken();
  let res: Response;
  try {
    res = await fetch(url, {
      ...opts,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers || {}),
      },
    });
  } catch {
    throw new ApiError('Unable to connect to the server. Please check your internet or server status.', 0);
  }

  if (!res.ok) {
    const details = await parseJsonSafe(res);
    const backendMessage = extractBackendMessage(details);
    const fallbackMessage =
      res.status === 401
        ? 'Your session is invalid. Please log in again.'
        : res.status === 403
          ? 'You are not allowed to perform this action.'
          : res.status === 404
            ? 'The requested resource was not found.'
            : res.status >= 500
              ? 'Something went wrong on the server. Please try again shortly.'
              : 'We could not process your request. Please review your input and try again.';
    throw new ApiError(backendMessage || fallbackMessage, res.status, details);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  // Let the browser set multipart boundary automatically.
  return apiFetch<T>(path, { method: 'POST', body: form });
}

