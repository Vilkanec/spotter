import { apiRoute, readJson } from "@/server/apiRoute";
import { currentServices } from "@/server/tenant";

export const PUT = apiRoute(async (request) => {
  const { onboarding } = await currentServices();
  return Response.json(onboarding.confirm(await readJson(request)));
});
