# ElectroDecision — Mining Electrification Copilot

**Track:** Best Apps and Agents

**Tagline:** Test electric mining fleets against production, charging and grid constraints, then review the evidence needed for an electrification decision.

## Inspiration

Replacing diesel equipment changes more than the source of energy. A mining fleet must still deliver its production target, share electrical capacity with critical services and start the next shift with enough battery energy. A second charger may not solve a constrained supply. A successful first shift may also conceal energy that still needs replenishing.

We built ElectroDecision for mining planners and engineering consultants who need a small, inspectable way to explore those trade-offs and organize missing project evidence.

## What it does

The English reviewer view contains two workflows. The shift lab compares four charging configurations for a synthetic underground loader fleet. It exposes production, vehicle waiting time, grid overload and battery inventory, then carries each vehicle's remaining energy into a second shift after a finite charging break.

The project review workflow adapts an evidence checklist to technology, implementation/operation stage and jurisdiction. It includes eight technology families, seven selected published cases and 21 primary references. It distinguishes a contract, pilot or published report from a confirmed current operating fleet.

NVIDIA Nemotron, served through Nebius Token Factory, can request calculation tools and retrieve project context. For the project dossier, it selects evidence IDs in a structured response. The application validates those IDs and constructs the displayed report from its catalog and computed status, rather than accepting newly generated regulatory statements.

## How we built it

React and TypeScript provide the interface. Vinext/Vite and a Worker-compatible server host request-scoped API routes. Deterministic simulation accounts for route gradient, rolling resistance, payload, traction/braking limits, battery health and reserve, charging efficiency, taper, finite ports, connection time, a charger outage and residual site power.

The model runs on Nebius Token Factory using `nvidia/Nemotron-3_5-Lightning`. Its read-only tools include `compare_shift`, `test_scenario`, `check_next_shift`, `get_evidence`, `assess_project_readiness` and `get_project_context`. Numerical outputs are recalculated by the application; the model does not invent the simulation or control equipment. No model training or dedicated GPU deployment was required.

## Demonstrated result

In the default synthetic case, one charger and a 1,050-kW supply deliver 1,188 tonnes in a 12-hour shift against a 1,700-tonne target. Two chargers on the same supply deliver 1,404 tonnes. Two chargers with 350 kW of additional supply deliver 1,782 tonnes without modeled overload. Unmanaged charging reaches the same tonnage while exceeding supply for 369 minutes.

After a 60-minute break, the upgraded scenario recovers the declared initial battery SOC and delivers 1,872 tonnes in shift two. The observation spans 25 hours; it is not a daily-output or perpetual-operation claim. These are reproducible synthetic outputs, not measured industrial savings or a universal recommendation.

## Challenges and what we learned

We had to separate energy from power, charging delay from grid overload, and apparent savings from reduced output. Terminal battery inventory also needs explicit treatment to avoid assuming a free recharge between shifts.

A real model test generalized an electrical requirement too broadly. We changed the dossier response path to validated evidence selection and catalog-backed rendering. Structured JSON alone was insufficient; context and ID validation were also necessary. We adjusted the final selection request after initially truncated model responses and verified the exact tool/schema combination against the live endpoint.

## Accomplishments

The project combines a reproducible simulation, two-shift energy continuity and a working NVIDIA/Nebius tool loop. Validation includes automated energy/constraint tests, server checks and recorded live integration evidence without credentials. The current release adds an English reviewer interface and translated project evidence while retaining the Spanish workspace.

## Limits and next steps

Operation inputs are synthetic and not calibrated to an OEM or mine. Shared road/loading congestion, idle cooling consumption, thermal/BMS behavior, electrical power flow and complete TCO remain outside the numerical model. The other mine visualizations are separate conceptual models. Declared document references do not verify contents or certify permits.

Next steps are to test usefulness with planners, import metered operational data with quality checks, calibrate equipment behavior and connect routes, site processes and charging in one validated model.
