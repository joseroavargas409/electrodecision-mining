import { DEFAULT_MODEL } from "../../../src/lib/assistant";
import { getServerEnv } from "../../../src/lib/server-env";

export async function GET() {
  const env = getServerEnv();
  const configured = !!env.NEBIUS_API_KEY?.trim();
  return Response.json({ mode: configured ? "nebius" : "demo", configured, model: env.NEBIUS_MODEL || DEFAULT_MODEL, connectionVerified: false, appVersion: "0.11.0", dataMode: "synthetic" },
    { headers: { "Cache-Control": "no-store" } });
}
