export async function sendJson<T>(url: string, method: "POST" | "PUT", body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Užklausa nepavyko.");
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Kažkas nepavyko.";
}
