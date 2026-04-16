export class ApiClientError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.payload = payload;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export interface ApiClient {
  get<T>(path: string, init?: ApiRequestOptions): Promise<T>;
  post<T>(path: string, body?: unknown, init?: ApiRequestOptions): Promise<T>;
}

function buildUrl(baseUrl: string, path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const text = await response.text();
    return text ? (JSON.parse(text) as unknown) : null;
  }

  const text = await response.text();
  return text ? { message: text } : null;
}

function extractErrorMessage(payload: unknown, status: number) {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }

  return `Request failed with status ${status}`;
}

export function createApiClient(baseUrl = ''): ApiClient {
  async function request<T>(path: string, init: ApiRequestOptions = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const requestInit: RequestInit = {
      ...init,
      headers,
    };

    if (init.body !== undefined) {
      headers.set('Content-Type', 'application/json');
      requestInit.body = JSON.stringify(init.body);
    }

    const response = await fetch(buildUrl(baseUrl, path), requestInit);
    const payload: unknown = await parseResponse(response);

    if (!response.ok) {
      const message = extractErrorMessage(payload, response.status);
      throw new ApiClientError(message, response.status, payload);
    }

    return payload as T;
  }

  return {
    get: (path, init) => request(path, { ...init, method: 'GET' }),
    post: (path, body, init) => request(path, { ...init, method: 'POST', body }),
  };
}
