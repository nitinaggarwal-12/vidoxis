#!/usr/bin/env -S node --import tsx
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { inspectChromeMetadata } from "./utils/chrome-path.js";
import { CanonicalTopologyContractSchema, CanonicalTopologyContract } from "./types/contract.js";
import { compileWhiteboardManifest } from "./whiteboard/whiteboard-compiler.js";
import { exportWhiteboardToSvg } from "./whiteboard/whiteboard-svg-exporter.js";
import { startMockServer } from "./mock-server/server.js";
import { runRehearsalMatrix } from "./runner/rehearsal-runner.js";
import { StepTrace } from "./types/trace.js";
import { renderTrainexVideo } from "./remotion/render.js";

async function main() {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      topic: { type: "string", short: "t", default: "Deploying Private Gemini 2.0 Endpoints on Google Cloud" },
      output: { type: "string", short: "o", default: "./scratch" },
      rehearsals: { type: "string", short: "r", default: "3" },
      help: { type: "boolean", short: "h", default: false },
      "stills-only": { type: "boolean", default: false }
    },
    allowPositionals: true
  });

  const command = positionals[0] || "generate";

  if (values.help || command === "help") {
    console.log(`
================================================================================
TRAINEX AUTONOMOUS CLOUD DEMO & TRAINING STUDIO CLI
================================================================================
Usage:
  npx trainex generate [options]

Options:
  -t, --topic <string>     Training topic and architecture title
  -o, --output <dir>       Target directory for artifacts and renders (default: ./scratch)
  -r, --rehearsals <num>   Consecutive rehearsal runs required (default: 3)
  --stills-only            Render 4K broadcast keyframe stills only
  -h, --help               Show this help manual
`);
    process.exit(0);
  }

  console.log("================================================================================");
  console.log("🚀 TRAINEX AUTONOMOUS CLOUD STUDIO — END-TO-END GENERATION PIPELINE");
  console.log(`   Topic: "${values.topic}"`);
  console.log("================================================================================\n");

  // Step 0: Pre-flight Google-Signed Chrome Verification
  console.log("🔍 [Phase 0: Environment Pre-Flight]");
  const chromeMeta = inspectChromeMetadata();
  console.log(`  ✔ Google Chrome Binary: ${chromeMeta.executablePath}`);
  console.log(`  ✔ Micro-Version: ${chromeMeta.microVersion} (Signed by Google LLC: ${chromeMeta.isGoogleSigned}, Cloudtop: ${chromeMeta.isCloudtop})`);
  if (!chromeMeta.isGoogleSigned && chromeMeta.platform === "darwin") {
    console.warn("  ⚠️ Warning: Chrome binary is not recognized as signed by Google LLC. May encounter Santa security blocks.");
  }

  const outputDir = path.resolve(process.cwd(), values.output || "./scratch");
  fs.mkdirSync(outputDir, { recursive: true });

  // Step 1: Topology Contract & Progressive Whiteboard
  console.log("\n📐 [Phase 1: Progressive Whiteboard Compilation]");
  const sampleContract: CanonicalTopologyContract = {
    topicId: "vertex_gemini_private_endpoint",
    title: values.topic || "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
    globalParameters: {
      projectId: "trainex-sandbox-8f2a",
      region: "us-central1",
      zone: "us-central1-a",
      vpcNetwork: "vpc-prod-private",
      subnetwork: "subnet-us-central1"
    },
    architectureGraph: {
      nodes: [
        { id: "actor_client", label: "Enterprise Client Application", category: "client" },
        { id: "cloud_armor", label: "Cloud Armor Security Policy", category: "security" },
        { id: "internal_alb", label: "Internal Application Load Balancer", category: "ingress" },
        { id: "api_gateway", label: "API Gateway Service", category: "compute" },
        { id: "vertex_endpoint", label: "Gemini 2.0 Flash Private Endpoint", category: "ai" }
      ],
      edges: [
        { id: "e1", source: "actor_client", target: "cloud_armor", flowType: "data_plane", protocol: "HTTPS", ratePps: 120 },
        { id: "e2", source: "cloud_armor", target: "internal_alb", flowType: "control_plane", protocol: "TCP", ratePps: 80 },
        { id: "e3", source: "internal_alb", target: "api_gateway", flowType: "data_plane", protocol: "HTTP", ratePps: 120 },
        { id: "e4", source: "api_gateway", target: "vertex_endpoint", flowType: "data_plane", protocol: "gRPC", ratePps: 150 }
      ]
    },
    demoActionParameters: {
      modelName: "gemini-2.0-flash",
      minReplicas: 1,
      maxReplicas: 5
    }
  };

  const validatedContract = CanonicalTopologyContractSchema.parse(sampleContract);
  console.log(`  ✔ Validated topology contract: ${validatedContract.architectureGraph.nodes.length} nodes, ${validatedContract.architectureGraph.edges.length} edges.`);

  const whiteboardManifest = await compileWhiteboardManifest(validatedContract);
  const svgOutput = path.join(outputDir, "01_whiteboard_architecture.svg");
  fs.writeFileSync(svgOutput, exportWhiteboardToSvg(whiteboardManifest), "utf-8");
  console.log(`  ✔ Progressive Whiteboard 4K SVG exported: ${svgOutput}`);

  // Step 2: Headless Rehearsal Matrix (Path B Determinism)
  console.log("\n🧪 [Phase 2: 3x Headless Rehearsal Matrix (Path B)]");
  const mockServer = await startMockServer({ port: 8092 });
  console.log(`  ↳ Google Cloud Sandbox Mock active at ${mockServer.baseUrl}`);

  const sampleTrace: StepTrace = {
    traceId: "trace_vertex_deploy_01",
    topicId: "vertex_gemini_private_endpoint",
    version: "2.0.0",
    targetConsole: "gcp",
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
    steps: [
      {
        id: "step_01_nav",
        index: 1,
        act: "act3_live_console",
        intent: "Navigate to Vertex AI Model Garden deep link",
        action: "navigate",
        targetUrl: "https://console.cloud.google.com/vertex-ai/models?project=trainex-sandbox-8f2a",
        dwellTimeMs: 150,
        redactPii: false,
        cameraFocus: false
      },
      {
        id: "step_02_open_drawer",
        index: 2,
        act: "act3_live_console",
        intent: "Click Deploy Model button to open deployment drawer",
        action: "click",
        selector: {
          primary: { role: "button", name: "Deploy Model", exact: true },
          secondary: { testId: "mg-deploy-btn" },
          fallback: { bbox: [120, 800, 160, 920] }
        },
        dwellTimeMs: 150,
        redactPii: false,
        cameraFocus: true
      },
      {
        id: "step_03_type_name",
        index: 3,
        act: "act3_live_console",
        intent: "Specify endpoint display name",
        action: "type",
        selector: {
          primary: { role: "textbox", name: "Endpoint name", exact: true },
          secondary: { testId: "input-endpoint-name" },
          fallback: { bbox: [200, 650, 240, 950] }
        },
        textValue: "gemini-2-flash-prod",
        dwellTimeMs: 150,
        redactPii: false,
        cameraFocus: true
      },
      {
        id: "step_04_submit_deploy",
        index: 4,
        act: "act3_live_console",
        intent: "Click Confirm and Deploy button",
        action: "click",
        selector: {
          primary: { role: "button", name: "Confirm and Deploy", exact: true },
          secondary: { testId: "btn-confirm-deploy" },
          fallback: { bbox: [500, 650, 540, 750] }
        },
        dwellTimeMs: 150,
        conditionGate: {
          type: "dom_mutation",
          targetSelector: "#endpoints-table-body",
          timeoutMs: 5000
        },
        redactPii: false,
        cameraFocus: true
      }
    ]
  };

  const rehearsalRuns = parseInt(values.rehearsals || "3", 10);
  const rehearsalResult = await runRehearsalMatrix(sampleTrace, rehearsalRuns, {
    headless: true,
    urlMap: { "https://console.cloud.google.com": mockServer.baseUrl }
  });

  if (!rehearsalResult.passed) {
    console.error(`❌ Rehearsal Failed: ${rehearsalResult.failureReason}`);
    await mockServer.close();
    process.exit(1);
  }
  console.log(`  ✔ Rehearsal matrix passed: ${rehearsalRuns}/${rehearsalRuns} clean runs (0% flake gate satisfied).`);
  await mockServer.close();

  // Step 3: Remotion 4K Broadcast Compositing
  console.log("\n🎬 [Phase 3: Remotion 4K Broadcast Compositor]");
  const renderResult = await renderTrainexVideo({
    outputStillsDir: path.join(outputDir, "rendered_stills"),
    outputVideoPath: path.join(outputDir, "trainex_master_4k.mp4"),
    renderStillsOnly: Boolean(values["stills-only"])
  });

  console.log("\n================================================================================");
  console.log("🎉 TRAINEX STUDIO PIPELINE COMPLETED SUCCESSFULLY!");
  console.log("================================================================================");
  console.log("Generated Broadcast Artifacts:");
  console.log(`  • Whiteboard 4K SVG: file://${svgOutput}`);
  for (const still of renderResult.stills) {
    console.log(`  • Keyframe 4K Still: file://${still}`);
  }
  if (renderResult.videoPath) {
    console.log(`  • Master 4K Video:   file://${renderResult.videoPath}`);
  }
  console.log("================================================================================\n");
}

main().catch(err => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
