import { apiRoute, readJson } from "@/server/apiRoute";
import { currentServices } from "@/server/tenant";

export const PUT = apiRoute(async (request) => {
  const { plans } = await currentServices();
  return Response.json({ warnings: plans.saveManual(await readJson(request)) });
});
