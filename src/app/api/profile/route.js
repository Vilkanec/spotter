import { apiRoute, readJson } from "@/server/apiRoute";
import { currentServices } from "@/server/tenantContext";

export const PUT = apiRoute(async (request) => {
  const { onboarding } = await currentServices();
  return Response.json(onboarding.confirm(await readJson(request)));
});
