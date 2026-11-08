import { apiRoute, readJson } from "@/server/apiRoute";
import { currentServices } from "@/server/tenant";

export const maxDuration = 90;

export const POST = apiRoute(async (request) => {
  const { plans } = await currentServices();
  return Response.json(await plans.revise(await readJson(request)));
});
