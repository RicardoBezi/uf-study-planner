import { API_BASE_URL } from "./config";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${text}`);
  }

  return (await res.json()) as T;
}

export function apiGet<T>(path: string) {
  return request<T>(path);
}
export function apiPost<T>(path: string, body: any) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}
export function apiPatch<T>(path: string, body: any) {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}
export function apiDelete(path: string) {
  return request<void>(path, { method: "DELETE" });
}

