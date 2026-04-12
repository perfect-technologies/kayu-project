import { ApiError } from "./error.js";

export class ApiClient {
  private accessToken: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
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

  async delete<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: "DELETE" });
  }

  private buildUrl(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    const base = this.baseUrl.replace(/\/+$/, "");
    const url = new URL(`${base}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
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
      try {
        const body = await response.json();
        message = body.message ?? body.error ?? message;
        error = body.error;
      } catch {
        // response body wasn't JSON — keep statusText
      }
      throw new ApiError(response.status, message, error);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
