import { apiRoute, readJson } from "@/server/apiRoute";
import { currentServices } from "@/server/tenantContext";

export const PUT = apiRoute(async (request) => {
  const { plans } = await currentServices();
  plans.updateCompletion(await readJson(request), new Date());
  return Response.json({ ok: true });
});
