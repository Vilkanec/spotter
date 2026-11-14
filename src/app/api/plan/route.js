import { apiRoute, readJson } from "@/server/apiRoute";
import { currentServices } from "@/server/tenantContext";

export const PUT = apiRoute(async (request) => {
  const { plans } = await currentServices();
  return Response.json({ warnings: plans.saveManual(await readJson(request)) });
});
