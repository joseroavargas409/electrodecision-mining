import { AssistantError, parseAssistantInput, runAssistant } from "../../../src/lib/assistant";
import { getServerEnv } from "../../../src/lib/server-env";

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" };
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Origen no permitido." }, { status: 403, headers });
  if (Number(request.headers.get("content-length") ?? 0) > 100000)
    return Response.json({ error: "Solicitud demasiado extensa." }, { status: 413, headers });
  try {
    const text = await request.text();
    if (text.length > 100000) throw new AssistantError("Solicitud demasiado extensa.", 413);
    let body: unknown;
    try { body = JSON.parse(text); } catch { throw new AssistantError("La solicitud debe contener JSON válido."); }
    const input = parseAssistantInput(body);
    const env = getServerEnv();
    const result = await runAssistant(input, { apiKey: env.NEBIUS_API_KEY, model: env.NEBIUS_MODEL });
    return Response.json(result, { headers });
  } catch (error) {
    return Response.json({ error: error instanceof AssistantError ? error.message : "No se pudo procesar la solicitud." },
      { status: error instanceof AssistantError ? error.status : 500, headers });
  }
}
