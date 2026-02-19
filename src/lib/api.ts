export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!;

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: isFormData
      ? undefined // ✅ let browser set multipart boundary
      : { "Content-Type": "application/json" },
    body: body
      ? isFormData
        ? (body as FormData)
        : JSON.stringify(body)
      : undefined,
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `Request failed: ${res.status}`);
  }

  // if not json, return empty
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
