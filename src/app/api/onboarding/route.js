import { apiRoute, readJson } from "@/server/apiRoute";
import { currentServices } from "@/server/tenantContext";

export const POST = apiRoute(async (request) => {
  const { onboarding } = await currentServices();
  return Response.json(await onboarding.reply(await readJson(request)));
});
