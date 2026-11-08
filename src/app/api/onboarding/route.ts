import { apiRoute, readJson } from "@/server/apiRoute";
import { currentServices } from "@/server/tenant";

export const POST = apiRoute(async (request) => {
  const { onboarding } = await currentServices();
  return Response.json(await onboarding.reply(await readJson(request)));
});
