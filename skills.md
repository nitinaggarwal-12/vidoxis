# Trainex Skills Catalog & Trigger Matrix (v3.0 Production Standard)

This document defines the complete catalog of **18 specialized enterprise skills and autonomous engines** available to the Trainex platform. Every skill has an unambiguous trigger condition, operational responsibility, CLI invocation pattern, and typed input/output contract.

---

## 1. Complete Skills Index & Trigger Matrix

| Skill ID | Trigger Condition | Primary Responsibility | Input Contract | Output Contract |
| :--- | :--- | :--- | :--- | :--- |
| **`console-pilot`** | Authoring a new demo step | Explores live sandbox DOM; resolves Triad selectors (`getByRole`, `test_id`, BBox). | Live Browser + Target Intent | `trace.v2.json` snippet |
| **`cdp-replay-engine`** | Recording take execution | Headless Chrome @ 4K DPR 2, clock freeze, CDP screencast capture. | `trace.v2.json` | Raw 60fps MP4 + Telemetry Stream |
| **`deepmind-audio-master`** | Voice generation request | Synthesizes emotional narration with 5-band vocal tract formant convolution. | Narration Text + Tone Tags | Master 48kHz WAV + Phoneme Clock |
| **`veo-avatar-director`** | Presenter synthesis | Renders talking-head video with BBox-directed eyeline and head-pose steering. | Narration WAV + Action BBoxes | 4K Alpha/MP4 Avatar Capsule |
| **`lyria-sound-engine`** | Music & SFX generation | Composes adaptive keynote score; applies -18dB lookahead audio ducking. | Speech Phonemes + Video Cuts | Master Stereo Audio Bed |
| **`remotion-compositor`** | Final studio rendering | Synthesizes Minimum-Jerk cursor, spring camera zoom, and automated PII blur. | Raw MP4 + Avatar + Audio + BBoxes | Master 4K Deliverable MP4 |
| **`chaos-demo-injector`** | Production error demo | Injects authentic IAM 403 / Quota failures; scripts Cloud Logging fix. | Demo Intent | Failure Step + Remediation Trace |
| **`omni-screening-auditor`** | Post-render quality check | Multimodally inspects final video: catches audio-visual desyncs and PII leaks. | Master MP4 + Manifest | Audit Verdict (`PASS` / `REJECT` + Diffs) |
| **`webrtc-socratic-proctor`**| Learner hands-on practice | Listens to learner voice and watches shared screen; provides live verbal coaching.| Live WebRTC Video/Audio Stream | Spoken Hints + Canvas Highlighting |
| **`cloud-translation-dubber`**| Global localization | Contextual 30+ language translation, timbre-matched voice clone, subtitle sync.| Master Video + Target Langs | Localized Audio Tracks + VTT Subtitles |
| **`promptcanvas-diagram-compiler`** | Stage 1 Keynote Slides | Compiles natural language into collision-free Draw.io/SVG cloud slides with official logos.| Architecture Description | 100% Collision-Free Slide SVG |
| **`timeline-elastic-sync`** | Pre-composite sync | Implements zyvoriq studio1 math: bounds drift to ≤50ms, retimes hold regions (0.92–1.10x).| Telemetry JSON + Phonemes JSON | Quantized Frame Timeline |
| **`scorex-maturity-evaluator`** | Socratic certification | Ingests learner cloud assets; grades against 6-pillar, 5-level maturity rubric. | Cloud Asset Inventory JSON | Maturity Score (1–5) + Remediation |
| **`a2a-protocol-broker`** | Inter-agent dispatch | Handles mutual-TLS RPC dispatching and signed execution tokens across 5 tiers.| Agent Task Object | Signed Task Execution Result |
| **`terraform-sandbox-manager`** | Pre/post authoring & replay | Provisions and tears down ephemeral sandboxes with immutable project regex firewall.| Project Pool ID + Config | Clean Provisioned Project ID |
| **`session-vault-manager`** | Pre-replay authentication | Decrypts GCS profile into `/dev/shm` (RAM) via KMS; executes liveness probe.| Vault URI + KMS Key | Decrypted In-Memory Profile Path |
| **`ocr-redaction-scanner`** | Pre-composite security audit| Scans frames for `@google.com`, `01XXXX-...` billing IDs using OpenCV/Tesseract.| Raw Screencast Video | Redaction Bounding Boxes List |
| **`veo-neural-inpainter`** | UI layout drift detected | Surgically in-paints 3-second UI deltas into master footage without full re-render.| Delta Start/End + New Clip | Patched Master MP4 Stream |
| **`progressive-whiteboard-engine`** | Concept whiteboarding phase | Synthesizes progressive User Flow, Process Flow, & Data Flow diagrams with animated stroke unwinding and particle physics.| Concept Description + Flow Mode | Dynamic Whiteboard Animation Manifest |

---

## 2. Detailed Skill Specifications

### 2.1 `promptcanvas-diagram-compiler` (from `PromptCanvas`)
* **Description:** Leverages PromptCanvas Pipeline V2 (`elkjs` Graph-then-Layout engine). Translates architecture descriptions into production-grade, collision-free Draw.io XML and high-contrast SVG slides with official Google Cloud vendor icons.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js promptcanvas-diagram-compiler \
    --prompt="Cloud Armor fronting Regional ALB routing to Cloud Run and Cloud SQL" \
    --theme="google-cloud-dark" \
    --output=slides/seg_01_arch.svg
  ```
* **Quality Constraint:** Enforces 0% node collisions with a mandatory **30px safety padding margin**.

### 2.2 `timeline-elastic-sync` (from `zyvoriq`)
* **Description:** Direct port of `zyvoriq`'s `studio1_timeline_sync.mjs`. Binds narration phonemes to CDP action hold regions, bounding drift to $\le 50\text{ms}$ and retiming clips between $0.92\times$ (compression floor) and $1.10\times$ (extension ceiling).
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js timeline-elastic-sync \
    --telemetry=scratch/take_01/telemetry.json \
    --phonemes=scratch/take_01/phonemes.json \
    --fps=60 \
    --output=scratch/take_01/quantized_timeline.json
  ```
* **Output Contract:**
  ```json
  {
    "total_frames": 3600,
    "drift_status": "LOCKED",
    "max_drift_ms": 22.4,
    "actions": [
      { "step_id": 3, "trigger_frame": 85, "settle_frame": 120, "bbox": [842, 320, 120, 40] }
    ]
  }
  ```

### 2.3 `scorex-maturity-evaluator` (from `scorex`)
* **Description:** Ingests learner cloud deployments from Cloud Asset Inventory during the Socratic Reverse-Training phase, mapping configuration parameters to `scorex`'s 6-pillar assessment framework (Security, Governance, Data, ML, GenAI, Operations).
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js scorex-maturity-evaluator \
    --project-id="trainex-sandbox-8f2a" \
    --rubric="vertex-private-endpoint"
  ```
* **Output Contract:**
  ```json
  {
    "pillar_scores": { "security": 4.5, "architecture": 5.0, "finops": 4.0 },
    "overall_maturity": "OPTIMIZE",
    "detected_anti_patterns": [],
    "certificate_eligible": true
  }
  ```

### 2.4 `a2a-protocol-broker` (from `a2a-enterprise-gateway`)
* **Description:** Bridges the 14 Cognitive AI Roles and 4 Worker Types using `a2a_sdk`. Manages mutual-TLS gRPC task dispatches, request signing, and signed token validation.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js a2a-protocol-broker \
    --sender="tier1-omni-orchestrator" \
    --recipient="tier3-console-supervisor" \
    --action="AUTHOR_AND_REHEARSE" \
    --payload='{"workflow": "vertex_deploy"}'
  ```

### 2.5 `terraform-sandbox-manager`
* **Description:** Provisions and tears down ephemeral sandboxes across the Dual Ephemeral Project Pool ($Project_A$ and $Project_B$). Enforces the immutable `assertSafeSandboxProject` regex firewall.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js terraform-sandbox-manager \
    --action="reset" \
    --target-project="trainex-sandbox-8f2a"
  ```

### 2.6 `session-vault-manager`
* **Description:** Manages the Chrome session vault lifecycle. Decrypts `profile.tar.gz` from GCS via Cloud KMS directly into `/dev/shm` (RAM), runs the pre-flight `/m/services` RPC liveness probe, and manages OAuth token refreshes.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js session-vault-manager \
    --vault-uri="gs://trainex-vault/sessions/linux-session.tar.gz" \
    --kms-key="projects/trainex-prod/locations/global/keyRings/vault/cryptoKeys/session" \
    --mount-point="/dev/shm/chrome-profile"
  ```

### 2.7 `ocr-redaction-scanner`
* **Description:** Executes OpenCV and Tesseract OCR over raw screencasts to detect unblurred billing account IDs (`\b01[0-9A-Z]{4}-...\b`), internal `@google.com` LDAPs, and internal project numbers.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js ocr-redaction-scanner \
    --video="scratch/take_01/raw_screencast.mp4" \
    --sample-interval-frames=15
  ```

### 2.8 `veo-neural-inpainter`
* **Description:** Re-records a 3-second UI delta caused by console drift and invokes DeepMind Veo 2 inpainting to surgically patch the master 4K video raster without requiring a full re-render.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js veo-neural-inpainter \
    --master-video="gs://trainex-media-prod/master_vertex.mp4" \
    --delta-screencast="scratch/patch_01/delta.mp4" \
    --start-frame=480 \
    --end-frame=660
  ```

### 2.9 `deprecation-sentinel`
* **Description:** Monitors Google Cloud Release Notes and API lifecycle feeds. Scans manifest scripts and trace actions for deprecated CLI commands (`gcloud beta ...`), obsolete SDKs, or legacy UI paths, failing closed before authoring.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js deprecation-sentinel \
    --manifest=manifests/vertex_deploy.json \
    --feed-url="https://cloud.google.com/release-notes"
  ```

### 2.10 `cognitive-density-auditor`
* **Description:** Employs Gemini Omni 1.1 to evaluate the technical information density of narration beats. Enforces Cognitive Density $CD \ge 0.40$ and scrubs filler phrases, corporate buzzwords, and tautological commentary.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js cognitive-density-auditor \
    --manifest=manifests/vertex_deploy.json \
    --min-threshold=0.40
  ```

### 2.11 `pedagogical-arc-validator`
* **Description:** Validates that the Segment Manifest adheres strictly to Bloom's Taxonomy 5-Act Masterclass Curve (Cold Open Hook $\rightarrow$ Architecture $\rightarrow$ Live Console $\rightarrow$ Chaos Debugging $\rightarrow$ Production Checklist).
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js pedagogical-arc-validator \
    --manifest=manifests/vertex_deploy.json
  ```

### 2.12 `multi-cloud-console-driver`
* **Description:** Provides abstracted console drivers for Google Cloud, AWS Management Console, Microsoft Azure Portal, Salesforce, and ServiceNow. Translates canonical deep-links and bypasses cloud-specific nav chrome.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js multi-cloud-console-driver \
    --cloud=aws \
    --service=ecs \
    --tenant-id=123456789012 \
    --region=us-east-1
  ```

### 2.13 `git-pr-video-differ`
* **Description:** Generates side-by-side Visual Video Diff MP4s for GitHub Pull Requests. Re-records only modified steps and comments on the PR with an embedded diff player.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js git-pr-video-differ \
    --pr-diff=scratch/pr_diffs/pr_124.patch \
    --base-video=gs://trainex-media-prod/master_v1.mp4
  ```

### 2.14 `socratic-certificate-minter`
* **Description:** Evaluates completed Socratic Reverse-Training sandbox sessions, verifies that cloud security and architecture criteria are met, signs an immutable cryptographic proof, and logs to the compliance audit ledger.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js socratic-certificate-minter \
    --learner-id="usr_99120" \
    --evaluation-id="eval_8f2a9c" \
    --signing-key="projects/trainex-prod/locations/global/keyRings/compliance/cryptoKeys/cert-signer"
  ```

### 2.15 `slide-demo-alignment-auditor`
* **Description:** Employs Gemini Omni 1.1 to audit parameter and iconographic alignment between PromptCanvas architecture slides and the live CDP console screencast. Catches visual contradictions (e.g. Postgres elephant on slide vs. MySQL dolphin in console dropdown).
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js slide-demo-alignment-auditor \
    --contract=contract.json \
    --slides=slides/seg_01_arch.svg \
    --trace=traces/vertex_deploy.json
  ```

### 2.16 `dual-plane-slide-recall`
* **Description:** Powers the Ghost Trainer's interactive in-video recall. When a viewer asks a question during the console demo, generates a Picture-in-Picture slide overlay highlighting the exact architecture node corresponding to the active console input field.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js dual-plane-slide-recall \
    --active-step=3 \
    --contract=contract.json \
    --slides=slides/seg_01_arch.svg
  ```

### 2.17 `progressive-whiteboard-engine`
* **Description:** Progressively illustrates complex technical concepts before live demos. Generates synchronized User Flow (actor journey), Process Flow (step execution state machine), and Data Flow (packet/event routing) with animated hand-drawn or high-tech glassboard strokes (via Rough.js + Elk.js), glowing bezier particle streams, and seamless spatial hand-off into the cloud console.
* **CLI Invocation:**
  ```bash
  node scripts/run_skill.js progressive-whiteboard-engine \
    --contract=contract.json \
    --mode=all-flows \
    --style=digital-glassboard \
    --output=scratch/whiteboard/manifest.json
  ```
* **Output Contract:**
  ```json
  {
    "flows": ["user_flow", "process_flow", "data_flow"],
    "total_draw_time_ms": 42000,
    "elements": [
      { "id": "actor_client", "type": "actor", "draw_start_frame": 60, "draw_duration_frames": 45 },
      { "id": "waf_node", "type": "process_step", "draw_start_frame": 120, "draw_duration_frames": 50 },
      { "id": "stream_client_to_waf", "type": "data_stream", "rate_pps": 120, "color": "#38BDF8" }
    ],
    "spatial_handoff_target": "vertex_endpoint"
  }
  ```

