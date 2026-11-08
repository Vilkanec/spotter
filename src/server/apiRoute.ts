import { AiUnavailableError } from "@/ai/AiClient";
import { InputError } from "@/services/errors";

type Handler = (request: Request) => Promise<Response>;

export function apiRoute(handler: Handler): Handler {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof InputError) return Response.json({ error: error.message }, { status: 400 });
      if (error instanceof AiUnavailableError) {
        return Response.json({ error: "Asistentas šiuo metu nepasiekiamas. Pabandyk po akimirkos." }, { status: 503 });
      }
      console.error(error);
      return Response.json({ error: "Kažkas nepavyko." }, { status: 500 });
    }
  };
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new InputError("Užklausos turinys turi būti tinkamas JSON.");
  }
}
