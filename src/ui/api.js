export async function sendJson(url, method, body) {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Užklausa nepavyko.");
  return data;
}

export function errorMessage(error) {
  return error instanceof Error ? error.message : "Kažkas nepavyko.";
}
