import test from "node:test";
import assert from "node:assert/strict";
import { AssistantError, DEFAULT_MODEL, demoAssistant, parseAssistantInput, runAssistant } from "./assistant.ts";
import { demoScenarios, planScenario } from "./planner.ts";
import { getServerEnv, runWithServerEnv } from "./server-env.ts";

const scenario = () => structuredClone(demoScenarios[0]);
const messages = (content: string) => [{ role: "user" as const, content }];
const response = (message: unknown) => new Response(JSON.stringify({ choices: [{ message }], usage: { prompt_tokens: 10, completion_tokens: 5 } }));

test("demo is explicit and power changes reach the numerical planner", () => {
  const base = scenario();
  const result = demoAssistant(messages("Reduce la potencia de red a 25 kW"), base);
  assert.equal(result.mode, "demo");
  assert.ok(result.scenario.gridPowerWBySlot.every(p => p === 25000));
  assert.notDeepEqual(result.scenario, base);
  assert.deepEqual(base, demoScenarios[0]);
  assert.match(result.message, /no se ha llamado a Nebius/);
  assert.equal(planScenario(result.scenario).status, "infeasible");
});

test("demo cannot silently interpret arbitrary unsupported language", () => {
  const base = scenario();
  const result = demoAssistant(messages("Estima los ahorros operacionales reales de la mina"), base);
  assert.deepEqual(result.scenario, base);
  assert.match(result.message, /por reglas/);
  assert.equal(result.actions.length, 0);
});

test("negated and hypothetical commands do not mutate the demo scenario", () => {
  for (const command of ["No cambies la potencia de red a 25 kW; solo explica el plan actual.", "¿Qué pasaría si baja la red a 25 kW?", "No reinicies el escenario"]) {
    const base = scenario();
    assert.deepEqual(demoAssistant(messages(command), base).scenario, base);
  }
});

test("invalid inputs and nonexistent battery values are rejected", () => {
  assert.throws(() => parseAssistantInput({ messages: messages("hola"), scenario: { ...scenario(), slotCount: -1 } }), AssistantError);
  assert.throws(() => parseAssistantInput({ messages: [{ role: "system", content: "hola" }], scenario: scenario() }), AssistantError);
  assert.throws(() => parseAssistantInput({ messages: messages("x".repeat(2501)), scenario: scenario() }), AssistantError);
  assert.throws(() => demoAssistant(messages("Cambia la potencia del cargador a 0 kW"), scenario()), AssistantError);
});

test("without a key the provider is never contacted", async () => {
  let calls = 0;
  const result = await runAssistant({ messages: messages("Explica el plan"), scenario: scenario() }, {
    fetchFn: (async () => { calls++; throw new Error("unexpected network"); }) as typeof fetch,
  });
  assert.equal(calls, 0);
  assert.equal(result.mode, "demo");
});

test("provider tool loop applies a validated change and sends computed evidence", async () => {
  let calls = 0;
  const result = await runAssistant({ messages: messages("Reduce la red a 25 kW"), scenario: scenario() }, {
    apiKey: "test-placeholder",
    fetchFn: (async (url: string | URL | Request, options?: RequestInit) => {
      assert.equal(String(url), "https://api.tokenfactory.nebius.com/v1/chat/completions");
      const body = JSON.parse(String(options?.body));
      assert.equal(body.model, DEFAULT_MODEL);
      calls++;
      if (calls === 1) return response({ role: "assistant", content: null, tool_calls: [{ id: "a", type: "function", function: { name: "update_scenario", arguments: '{"gridPowerKw":25}' } }] });
      const tool = body.messages.at(-1);
      assert.equal(tool.role, "tool");
      assert.equal(JSON.parse(tool.content).status, "infeasible");
      return response({ role: "assistant", content: "La alternativa no es factible dentro del modelo." });
    }) as typeof fetch,
  });
  assert.equal(calls, 2);
  assert.equal(result.mode, "nebius");
  assert.ok(result.scenario.gridPowerWBySlot.every(p => p === 25000));
  assert.ok(result.actions.some(a => a.tool === "update_scenario"));
  assert.equal(result.usage?.prompt_tokens, 20);
});

test("invalid tool changes leave scenario intact and return a tool error", async () => {
  let calls = 0;
  const base = scenario();
  const result = await runAssistant({ messages: messages("Cambia la batería"), scenario: base }, {
    apiKey: "test-placeholder", fetchFn: (async (_url, options) => {
      calls++;
      if (calls === 1) return response({ role: "assistant", tool_calls: [{ id: "a", type: "function", function: { name: "update_scenario", arguments: '{"assetId":"missing","initialKwh":10}' } }] });
      assert.ok(JSON.parse(JSON.parse(String(options?.body)).messages.at(-1).content).error);
      return response({ role: "assistant", content: "Indica un equipo existente." });
    }) as typeof fetch,
  });
  assert.deepEqual(result.scenario, base);
});

test("a configured provider failure never becomes a fake AI response", async () => {
  await assert.rejects(() => runAssistant({ messages: messages("hola"), scenario: scenario() }, {
    apiKey: "test-placeholder", fetchFn: (async () => new Response("invalid", { status: 401 })) as typeof fetch,
  }), (error: unknown) => error instanceof AssistantError && error.status === 502 && /rechazó/.test(error.message));
});

test("request-scoped server credentials remain isolated under concurrency", async () => {
  const values = await Promise.all(["alpha", "beta"].map(key => runWithServerEnv({ NEBIUS_API_KEY: key }, async () => {
    await new Promise(resolve => setTimeout(resolve, key === "alpha" ? 10 : 0));
    return getServerEnv().NEBIUS_API_KEY;
  })));
  assert.deepEqual(values, ["alpha", "beta"]);
});

test("demo infrastructure and evidence commands are read-only and grounded", () => {
  const base = scenario();
  const analysis = demoAssistant(messages("Analiza la infraestructura"), base);
  assert.deepEqual(analysis.scenario, base);
  assert.equal(analysis.actions[0].tool, "analyze_infrastructure");
  assert.match(analysis.message, /candidato inferior/);
  const evidence = demoAssistant(messages("Qué datos faltan"), base);
  assert.deepEqual(evidence.scenario, base);
  assert.equal(evidence.actions[0].tool, "get_evidence");
  assert.match(evidence.message, /sin calibración|No calibran/);
  assert.match(evidence.message, /Ciclo de trabajo/);
});

test("provider can retrieve evidence and efficiency changes remain validated", async () => {
  let calls = 0;
  const base = scenario();
  const result = await runAssistant({ messages: messages("Revisa las fuentes"), scenario: base }, {
    apiKey: "test-placeholder", fetchFn: (async (_url, options) => {
      calls++;
      if (calls === 1) return response({ role: "assistant", tool_calls: [
        { id: "evidence", type: "function", function: { name: "get_evidence", arguments: "{}" } },
        { id: "invalid-change", type: "function", function: { name: "update_scenario", arguments: '{"chargingEfficiencyPct":120}' } },
      ] });
      const history = JSON.parse(String(options?.body)).messages;
      const evidence = JSON.parse(history.at(-2).content);
      assert.ok(evidence.sources.every((item: { url: string }) => item.url.startsWith("https://")));
      assert.equal(evidence.dataRequirements.length, 6);
      assert.ok(JSON.parse(history.at(-1).content).error);
      return response({ role: "assistant", content: "Hay datos por validar antes de aplicar el modelo a una mina." });
    }) as typeof fetch,
  });
  assert.deepEqual(result.scenario, base);
  assert.ok(result.actions.some(action => action.tool === "get_evidence"));
});
