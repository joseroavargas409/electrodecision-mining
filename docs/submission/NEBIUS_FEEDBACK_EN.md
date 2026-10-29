# Feedback based on actual use

## Services and model used

We used the Nebius Token Factory inference API at `https://api.tokenfactory.nebius.com/v1/chat/completions` with `nvidia/Nemotron-3_5-Lightning`. We did not deploy on Nebius AI Cloud compute, train a model or use robotics hardware. The simulation and evidence rules run in the application; Nebius serves the model at runtime.

## What worked well

- The compatible chat-completions interface let us add inference without operating a model server or GPU deployment.
- Function calling supported a useful loop: request a tool, calculate or retrieve evidence locally, and return the result to the model.
- The configured model successfully used both the tools and a strict JSON selection schema in real tests.
- Usage returned by the endpoint let us preserve token counts in integration evidence without storing the API key.

## Observed difficulties and our fixes

- A free-text answer generalized a regulatory requirement. Our fix was to validate selected evidence IDs and fill the displayed dossier report from a reviewed catalog. This is an application-grounding issue, not proof of a provider defect.
- A short output allowance produced a response with no final visible content in a structured-selection test. We increased the final allowance and verified `chat_template_kwargs.enable_thinking=false` for that selection with the actual configured model. Tool calls and the general shift explanation retain separate budgets.
- Our initial API wrapper hid different failures behind one generic message. Future work should expose safe, actionable distinctions between insufficient output, rate limits and provider availability without leaking credentials.

## Suggestions

A concise, model-specific example combining forced tools, reasoning controls, structured output and token accounting would reduce integration trial-and-error. A consolidated capability checklist and clearer troubleshooting examples for missing final content would also help.

## Impact on our workflow

Token Factory removed the need to build a model-serving stack for this prototype. We could focus on calculation tools, evidence boundaries and checking model outputs. We do not claim training acceleration, benchmark superiority or a measured time saving.

Individual integration records are examples, not a latency/cost benchmark. Earlier v0.10 dossier verification used 8963 input and 740 output tokens; the current English-release record should be read with its own configuration in `examples/nebius/`.
