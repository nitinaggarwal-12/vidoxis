# VIDOXIS: Autonomous Enterprise AI Training & Demo Studio

> **"Authoring is agentic and happens once; recording is deterministic and happens every time."**

Vidoxis is an enterprise-grade AI production platform that completely automates the creation of broadcast-quality 4K/60fps technical training videos, keynote presentation decks, and live cloud demos executed on real Google Cloud, AWS, Azure, and enterprise SaaS environments.

---

## 🚀 Key Platform Capabilities

1. **Executive Keynote Presentations & Progressive Whiteboarding (Stage 1 & Act 2):**
   - **Executive Agentic Whiteboard Standard:** Renders a 5-tier architecture topology (Experience & Ingress $\to$ Intelligence Hub $\to$ Agentic Engine & Tools $\to$ Data & Enterprise Core $\to$ Ecosystem Fabric) on a clean Google Studio White canvas.
   - **1:1 Dual-Artifact Output:** Simultaneously exports 4K broadcast video/PNG (with progressive phoneme-synchronized vector stroke unwinding and kinetic particles) and fully editable Draw.io (`.drawio`) XML files.
   - **Keynote Slide Decks:** Integrates **PromptCanvas Pipeline V2** with official cloud vendor icons (GCP, AWS, Azure) and 100% collision-free `elkjs` layouts.
2. **Deterministic Live Console Screencasting (Stage 2):** Executes verified step traces against real Google Cloud Console, AWS, or Azure environments via Chrome DevTools Protocol (CDP) at 60fps with zero LLMs in the recording take.
3. **DeepMind Multimodal Studio Mastering (Stage 3):**
   - **Presenter Avatar (DeepMind Veo 2):** Photorealistic talking-head video in Google executive attire with BBox-directed gaze vector steering.
   - **Emotional Narration (DeepMind Emotional TTS):** 5-band vocal tract formant convolution with millisecond phoneme clocks.
   - **Ambient Keynote Score (DeepMind Lyria):** Procedural soundtrack with $-18\text{dB}$ lookahead audio ducking under speech.
   - **Kinetic Cursor Dynamics:** Natural fifth-order Minimum-Jerk polynomial trajectories with human micro-overshoot and 150ms hover dwells.
   - **Spring-Damped Camera Director:** Dynamic zoom focus pulls ($k=180, c=18$) with 30px safe bounding margins.
4. **The 6 Frontier Breakthroughs:**
   - **"Take the Wheel":** Instant in-browser state-forking to an ephemeral sandbox at any second in the video.
   - **Interruptible "Ghost Trainer":** Live conversational video forking over WebRTC powered by Gemini Multimodal Live API.
   - **Antifragile "Chaos Demos":** Pedagogy via deliberate IAM 403 / Quota failures and real Cloud Logging diagnostics.
   - **Continuous Delivery for Video:** Git-triggered nightly rehearsals with Veo 2 neural inpainting to patch 3-second UI deltas.
   - **Polymorphic Role Compilation:** 1 master prompt compiles into 4 tailored paths (CFO, CISO, DevOps, Developer).
   - **Socratic Reverse-Training:** Live WebRTC screen mentoring leading to cryptographically verified Proof-of-Competence certificates.
5. **The $100M Enterprise Engine:**
   - **Autonomous Solutions Architect:** Cuts B2B software sales cycles from 90 days to 14 days with tailored 4K customer demos.
   - **Regulated Compliance Certifications:** Live sandbox proctoring replacing cheated quizzes for FDA, SOC2, and HIPAA audits.
   - **Video-as-Code GitHub PRs:** Merging code automatically generates side-by-side Video PR Diffs.

---

## 🛠️ Architecture & Tech Stack

- **Master Orchestrator:** Google Omni 1.1 (Central Nervous System & Master Cross-Modal Clock)
- **Planning & Syllabus:** Gemini 2.0 Pro
- **Console Pathfinder:** Gemini 2.0 Flash (Computer-Use Agent)
- **Generative Media:** DeepMind Veo 2, Imagen 3, Lyria, Emotional TTS
- **Compositing Engine:** Remotion (React 19 + TypeScript + WebGL Shaders)
- **Compute Infrastructure:** Google Cloud Run (Jobs & Services) + NVIDIA L4 GPU acceleration
- **Networking:** Serverless VPC Access Connector + Cloud NAT with static enterprise egress IP pool
- **Storage & State:** Cloud Storage (KMS CMEK encrypted), Firestore Native Mode, Secret Manager

---

## 📚 Complete Documentation Suite

| Document | Purpose |
| :--- | :--- |
| [**`BUSINESS_STRATEGY_100M.md`**](BUSINESS_STRATEGY_100M.md) | The $100M ARR GTM Playbook, Moats, & Hybrid Enterprise Pricing Model |
| [**`PRODUCTION_ARCHITECTURE_PLAN.md`**](PRODUCTION_ARCHITECTURE_PLAN.md) | Cloud Infrastructure, FinOps Cost Models, 5 Loopholes, & 7 Quality Gates |
| [**`VIDOXIS_MASTER_SPEC.md`**](VIDOXIS_MASTER_SPEC.md) | The Master Product Specification, 6 Frontier Breakthroughs, & Core Models |
| [**`architecture.md`**](architecture.md) | Distributed Topology, Cross-Repo Leverage Map, & 5-Tier Command Hierarchy |
| [**`design.md`**](design.md) | Remotion 4K Stage, Minimum-Jerk Motion Math, & React Component Tree |
| [**`gemini.md`**](gemini.md) | Engineering Constitution, "Path B" Axioms, & Agent Operating Manual |
| [**`skills.md`**](skills.md) | Complete 21-Skill Catalog, Trigger Matrix, & Typed CLI Contracts |
| [**`hooks.json`**](hooks.json) | Autonomous Lifecycle Automation Triggers & Quality Firewalls |
| [**`RUNBOOK.md`**](RUNBOOK.md) | Operations Guide: Session Seeding, Rehearsal CI, & Incident Remediation |
| [**`SECURITY.md`**](SECURITY.md) | Zero-Trust WIF, KMS RAM Session Vault, & PII Redaction Policies |
| [**`AGENTS.md`**](AGENTS.md) | Multi-Agent Coordination Rules, A2A Protocol, & Escalation Chains |
| [**`DISCLAIMER.md`**](DISCLAIMER.md) | Alphabet Legal Disclaimers, Pre-GA Governance, & SynthID Provenance |

---

## 🏃 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run local mock console fixture server (for lightning-fast CI testing)
npm run mock:console

# 3. Author a new demo workflow
npm run author -- --url="https://console.cloud.google.com/vertex-ai" --intent="Deploy Gemini"

# 4. Execute the 3x Rehearsal Matrix
npm run rehearse -- --trace=traces/vertex_deploy.json --runs=3

# 5. Deterministic CDP 60fps Screencast Recording Take
npm run record -- --trace=traces/vertex_deploy.json

# 6. Remotion 4K Studio Mastering
npm run render -- --take=scratch/take_01/
```
