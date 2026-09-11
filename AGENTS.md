# Vidoxis Multi-Agent Protocol & Pair-Programming Guidelines
**Target Audience:** Autonomous Coding Agents (Antigravity, Gemini Omni, Gemini 2.0 Flash) & Pair Programmers  
**Workspace:** `/Users/nitinagga/Documents/vidoxis` (formerly `/Users/nitinagga/Documents/trainex`)  

---

## 1. Multi-Agent Operational Hierarchy

When operating within the Vidoxis codebase, agents must strictly follow the **5-Tier Command Hierarchy**:

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

---

## 5. Executive Agentic Whiteboard Standard (Act 2 & Draw.io Parity)

All whiteboard sequences and architectural visual assets must strictly adhere to the **Executive Agentic Whiteboard Template** (modeled after the approved enterprise Google Cloud Agentic AI reference architecture):

1. **5-Tier Executive Layout Hierarchy:**
   - **Tier 1 (Left): Experience & Ingress** — Client users (Clinical Researchers, Healthcare Professionals, Operators), mobile/web apps, and API Gateway / Apigee.
   - **Tier 2: Orchestration & Intelligence Hub** — Multi-Agent Orchestrator (LangGraph / Vertex Reasoning Engine) powered by Gemini 2.5 Flash and Gemini 2.5 Pro models.
   - **Tier 3: Agentic Reasoning Engine & Specialized Tools** — Search & RAG Agent, Clinical Knowledge Agent, Regulatory & Compliance Agent, Data Analysis & Code Agent.
   - **Tier 4: Enterprise Core & Grounding** — Vertex AI Search & Conversation, BigQuery Clinical Data Lakehouse, Cloud Storage (Unstructured/Raw), Cloud SQL / AlloyDB.
   - **Tier 5 (Right): Enterprise Systems & Ecosystem Fabric** — Monolithic Enterprise Core (ERP / SAP / Clinical Trials Registry / LIMS) and External APIs & Biomedical Ontologies (PubMed / NCBI).

2. **Intentional Semantic Shape & Stencil Rules:**
   - **Gemini Foundation Models:** Must use capsule or rounded pill shapes (`shape=mxgraph.flowchart.terminator;` or `rounded=1;arcSize=50;`).
   - **Databases & Data Lakes:** Must use 3D cylinders (`shape=cylinder3;whiteSpace=wrap;html=1;size=14;fillColor=...;strokeColor=...;strokeWidth=2;`). **Strictly forbidden:** Never use legacy `shape=cylinder;` (which renders curved horn artifacts in graph viewers).
   - **Enterprise Legacy Systems:** Monolithic rectangular pillars (`shape=rectangle;rounded=0;fillColor=#F8FAFC;strokeColor=#475569;strokeWidth=2;`).
   - **Data Plane Cloud Boundary:** Scalloped dashed cloud (`shape=cloud;dashed=1;`) wrapping only the data tier ($x \ge 730$) without occluding or intersecting node text.

3. **Light-Theme Google Studio Paper Aesthetics:**
   - Pure studio white canvas (`#FFFFFF` or `#F8FAFC`).
   - Typography: Google Sans Flex for titles, headers, and badges; Roboto Mono for technical IDs and parameters.
   - Strict WCAG AAA contrast ($\ge 7.0:1$) with dark slate text (`#0F172A`), Google Deep Navy (`#00205B`), Google Blue (`#1A73E8`), and Agent Violet (`#7C3AED`).

4. **1:1 Dual-Artifact Parity Guard (`.drawio` + Broadcast Raster):**
   - Every whiteboard sequence generated by the compiler must simultaneously emit:
     1. A 4K broadcast video/PNG raster with progressive stroke unwinding and kinetic particles.
     2. A fully editable, standards-compliant Draw.io XML file (`.drawio`) matching node coordinates, stencils, connection ports, and semantic callout badges.

---

## 6. Official Google Documentation, Quickstarts & Training Sources Protocol

All autonomous agents authoring, synthesizing, and executing training sequences must ground in verified Google sources:

* **Official Public Documentation & Codelabs (`cloud.google.com/docs`):** Content and commands must adhere strictly to current official Google documentation, API references, and step-by-step Quickstarts.
* **Google Cloud Architecture Center:** Topology, interconnects, and resource relationships must mirror official reference architectures.
* **Official GCP GitHub Repositories (`github.com/GoogleCloudPlatform`):** Code snippets, queries, and demo datasets must come from vetted official GCP repositories.
* **Official Training Media (Google Cloud Next & Skills Boost):** Pedagogical structure, timing benchmarks, and presentation delivery must align with official Cloud Next keynote/breakout recordings and Skills Boost lab guides.
* **Fail-Closed Verification in `hooks.json`:** Every manifest and trace must pass `google_public_docs_quickstart_grounding`, `official_gcp_github_samples_verification`, `google_architecture_center_topology_audit`, `official_training_media_and_codelab_crosscheck`, and `console_quickstart_step_parity_audit`.
