import { apiRoute } from "@/server/apiRoute";
import { currentServices } from "@/server/tenant";

export const maxDuration = 90;

export const POST = apiRoute(async () => {
  const { plans } = await currentServices();
  return Response.json(await plans.generate());
});
