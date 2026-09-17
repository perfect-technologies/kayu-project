import { ApiError } from "./error.js";

export type QueryParams = object;

// Skips null/undefined, joins arrays with commas (the backend's csv id lists), ISO-formats dates.
function toQueryEntries(params: QueryParams): Array<[string, string]> {
  return Object.entries(params).flatMap(([key, value]): Array<[string, string]> => {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value.length > 0 ? [[key, value.join(",")]] : [];
    if (value instanceof Date) return [[key, value.toISOString()]];
    return [[key, String(value)]];
  });
}

export class ApiClient {
  private accessToken: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async get<T>(path: string, params?: QueryParams): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: "GET" });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(this.buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(this.buildUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(this.buildUrl(path), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(path: string, params?: QueryParams): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: "DELETE" });
  }

  private buildUrl(path: string, params?: QueryParams): string {
    const base = this.baseUrl.replace(/\/+$/, "");
    const raw = `${base}${path}`;
    const entries = params ? toQueryEntries(params) : [];

    // When baseUrl is empty or relative (browser proxy), we can't use new URL()
    // directly because it requires an absolute URL. Build query string manually.
    if (!base || !base.startsWith("http")) {
      const qs = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");
      return qs ? `${raw}?${qs}` : raw;
    }

    const url = new URL(raw);
    for (const [key, value] of entries) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async request<T>(url: string, init: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      ...(init.headers as Record<string, string>),
    };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      let message = response.statusText;
      let error: string | undefined;
      let code: string | undefined;
      let parsedBody: unknown;
      try {
        parsedBody = await response.json();
        const b = parsedBody as Record<string, unknown>;
        message = (b.message as string) ?? (b.error as string) ?? message;
        error = b.error as string | undefined;
        code = typeof b.code === "string" ? b.code : undefined;
      } catch {
        // response body wasn't JSON — keep statusText
      }
      const err = new ApiError(response.status, message, error, code);
      err.body = parsedBody;
      throw err;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
