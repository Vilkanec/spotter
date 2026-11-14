import { apiRoute, readJson } from "@/server/apiRoute";
import { switchTenant } from "@/server/tenantContext";

export const PUT = apiRoute(async (request) => {
  const body = await readJson(request);
  await switchTenant(body?.tenantId);
  return Response.json({ ok: true });
});
