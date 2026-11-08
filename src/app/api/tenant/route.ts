import { apiRoute, readJson } from "@/server/apiRoute";
import { switchTenant } from "@/server/tenant";

export const PUT = apiRoute(async (request) => {
  const body = (await readJson(request)) as { tenantId?: unknown };
  await switchTenant(body?.tenantId);
  return Response.json({ ok: true });
});
