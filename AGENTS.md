# Trainex Multi-Agent Protocol & Pair-Programming Guidelines
**Target Audience:** Autonomous Coding Agents (Antigravity, Gemini Omni, Gemini 2.0 Flash) & Pair Programmers  
**Workspace:** `/Users/nitinagga/Documents/trainex`

---

## 1. Multi-Agent Operational Hierarchy

When operating within the Trainex codebase, agents must strictly follow the **5-Tier Command Hierarchy**:

```
[ Tier 1: Master Orchestrator (Omni 1.1) ]
                  │
                  ▼
[ Tier 2: Planners & Architects (Gemini 2.0 Pro) ]
                  │
                  ▼
[ Tier 3: Domain Supervisors (Quality Firewalls) ]
                  │
                  ▼
[ Tier 4: Autonomous Subagents (Specialized Tools) ]
                  │
                  ▼
[ Tier 5: Deterministic Compute Workers (Zero-LLM) ]
```

### Delegation Rules:
* **Strict Vertical Delegation:** Agents only communicate upward to their parent supervisor or downward to their assigned child subagents. Cross-tier open-ended group discussions are strictly prohibited to prevent conversational dilution.
* **Typed RPC Communication:** All inter-agent requests and responses must use typed JSON payloads matching schemas in `schemas/` and dispatched via `a2a_sdk`.
* **Fail-Closed Escalation:** If a Tier 4 subagent flakes or encounters an unhandled exception, it must emit a structured failure event to its Tier 3 Supervisor rather than attempting speculative workarounds.

---

## 2. The Core Engineering Axiom: "Path B"

> **"Authoring is agentic and happens once; recording is deterministic and happens every time."**

* **Never introduce an LLM into the recording loop.** The recording runner executes frozen step traces via Chrome DevTools Protocol (CDP).
* **Condition Gates over Static Sleep:** Never write `await sleep(3000)`. Always wait on explicit DOM mutations or network idle events.
* **URL-First Navigation:** When scripting Google Cloud Console workflows, navigate directly to canonical deep-links (`https://console.cloud.google.com/{service}?project={PROJECT_ID}`). Never click hamburger menus or sidebars.

---

## 3. Autonomous Issue Remediation (Fix Without Asking)

* When a test fails, a rehearsal flakes, or a lint error is detected: **never ask the user for permission to fix it.**
* Autonomously analyze the root cause, apply targeted code changes, re-run tests, and verify resolution independently before presenting results.

---

## 4. File Link & Markdown Conventions

* All references to workspace files must use clickable Markdown links with the `file://` scheme:
  - Example: `[architecture.md](file:///Users/nitinagga/Documents/trainex/architecture.md)`
* Store all scratch scripts, test automation tools, and visual screenshots inside the workspace (`scratch/` or subdirectories inside `/Users/nitinagga/Documents/trainex`).
