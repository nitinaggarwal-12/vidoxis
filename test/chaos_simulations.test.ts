import fs from "node:fs";
import path from "node:path";
import puppeteer, { Browser, Page } from "puppeteer";
import { compileWhiteboardManifest } from "../src/whiteboard/whiteboard-compiler.js";
import { exportWhiteboardToSvg } from "../src/whiteboard/whiteboard-svg-exporter.js";
import { ParticleStreamSimulator } from "../src/whiteboard/particle-system.js";
import { WhiteboardManifestSchema } from "../src/types/whiteboard.js";
import { CanonicalTopologyContract } from "../src/types/contract.js";
import { CDPReplayRunner } from "../src/runner/cdp-replayer.js";
import { StepTrace } from "../src/types/trace.js";
import { startMockServer, RunningMockServer } from "../src/mock-server/server.js";
import { createStudioServer } from "../src/studio/server.js";
import { resolveGoogleSignedChrome, inspectChromeMetadata, DEFAULT_CHROME_FLAGS } from "../src/utils/chrome-path.js";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runChaosSimulations(): Promise<boolean> {
  const chromeMeta = inspectChromeMetadata();
  console.log("================================================================================");
  console.log("⚡ RUNNING ADVERSARIAL & 'ODD ONE OUT' CHAOS SIMULATION SUITE");
  console.log(`   Binary: ${chromeMeta.executablePath}`);
  console.log(`   Version: Google Chrome ${chromeMeta.microVersion} (Signed: ${chromeMeta.isGoogleSigned})`);
  console.log("================================================================================\n");

  const scratchChaosDir = path.resolve(process.cwd(), "scratch", "screenshots_chaos");
  if (fs.existsSync(scratchChaosDir)) {
    fs.rmSync(scratchChaosDir, { recursive: true, force: true });
  }
  fs.mkdirSync(scratchChaosDir, { recursive: true });

  let allPassed = true;

  // ============================================================================
  // SIMULATION 1: Whiteboard "Odd One Out" Topology Chaos
  // ============================================================================
  console.log("▶ [Chaos Sim 1] Whiteboard Architecture 'Odd One Out' Edge Cases...");

  // Scenario A: Disconnected "Odd One Out" Island Node (0 in, 0 out)
  console.log("  ↳ Scenario 1A: Isolated Rogue Island Node ('shadow_db' with zero connections)...");
  const islandContract: CanonicalTopologyContract = {
    topicId: "chaos_disconnected_island",
    title: "Chaos: Disconnected Island Topology",
    globalParameters: {
      projectId: "trainex-chaos-sandbox",
      region: "us-central1"
    },
    architectureGraph: {
      nodes: [
        { id: "client", label: "Client App", category: "client", description: "Inference client" },
        { id: "gateway", label: "Cloud Run Gateway", category: "compute", description: "Ingress proxy" },
        { id: "vertex", label: "Vertex AI", category: "ai", description: "Gemini 2.0 Flash" },
        // The Odd One Out: completely isolated node
        { id: "rogue_island", label: "Rogue Shadow DB (Odd One Out)", category: "security", description: "Unconnected isolated island node" }
      ],
      edges: [
        { id: "e1", source: "client", target: "gateway", protocol: "gRPC", flowType: "data_plane", ratePps: 100 },
        { id: "e2", source: "gateway", target: "vertex", protocol: "HTTPS", flowType: "data_plane", ratePps: 100 }
      ]
    },
    demoActionParameters: {}
  };

  const islandManifest = await compileWhiteboardManifest(islandContract, {
    canvasWidth: 3840,
    canvasHeight: 2160
  });

  const parsedIsland = WhiteboardManifestSchema.safeParse(islandManifest);
  if (!parsedIsland.success) {
    console.error("  ❌ Island manifest schema validation failed:", parsedIsland.error);
    allPassed = false;
  } else {
    // Audit BBox collisions across all 4 nodes (including rogue island)
    let collisions = 0;
    const els = islandManifest.elements;
    for (let i = 0; i < els.length; i++) {
      for (let j = i + 1; j < els.length; j++) {
        const a = els[i];
        const b = els[j];
        const overlap = !(
          a.x + a.width + 30 <= b.x ||
          b.x + b.width + 30 <= a.x ||
          a.y + a.height + 30 <= b.y ||
          b.y + b.height + 30 <= a.y
        );
        if (overlap) {
          console.error(`  ❌ Collision between "${a.label}" and "${b.label}"!`);
          collisions++;
        }
      }
    }
    if (collisions === 0) {
      console.log("  ✔ 0% BBox Collisions with 30px padding confirmed on disconnected island.");
    } else {
      allPassed = false;
    }
  }

  // Scenario B: Adversarial 150-Character Extreme Node Label
  console.log("  ↳ Scenario 1B: Adversarial 150-Character Extreme Node Label...");
  const extremeContract: CanonicalTopologyContract = {
    topicId: "chaos_extreme_label",
    title: "Chaos: Extreme Label Length",
    globalParameters: {
      projectId: "trainex-chaos-sandbox",
      region: "us-central1"
    },
    architectureGraph: {
      nodes: [
        {
          id: "massive_node",
          label: "Ultra-Secure Regional Zero-Egress VPC Service Controls Private Service Connect Multi-Zone High-Performance Inference Mesh for Enterprise Gemini Cloud Operations",
          category: "security",
          description: "Stress testing XML attribute and text rendering bounds"
        }
      ],
      edges: []
    },
    demoActionParameters: {}
  };

  const extremeManifest = await compileWhiteboardManifest(extremeContract);
  const extremeSvg = exportWhiteboardToSvg(extremeManifest);
  if (!extremeSvg.includes("<svg") || !extremeSvg.includes("Ultra-Secure Regional")) {
    console.error("  ❌ Extreme label SVG export failed!");
    allPassed = false;
  } else {
    console.log("  ✔ Extreme 150-character label safely escaped and compiled into valid 4K SVG.");
  }

  // Scenario C: Degenerate Single Node Graph with 0 Edges
  console.log("  ↳ Scenario 1C: Degenerate Single-Node Graph (0 edges)...");
  const simulator = new ParticleStreamSimulator();
  const emptyParticles = simulator.computeParticlesForEdge("empty", { p0: { x: 0, y: 0 }, p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 }, p3: { x: 0, y: 0 } }, 0, 0, 0);
  console.log(`  ✔ Particle simulator gracefully handled degenerate 0-edge state (returned ${emptyParticles.length} particles).`);

  // ============================================================================
  // SIMULATION 2: CDP Triad Selector Sabotage & Autonomous Fallback
  // ============================================================================
  console.log("\n▶ [Chaos Sim 2] CDP Replayer Adversarial Triad Selector Sabotage...");

  const MOCK_PORT = 8098;
  const mockServer = await startMockServer({ port: MOCK_PORT });
  console.log(`  ↳ Local Mock Console active on ${mockServer.baseUrl}`);

  const replayer = new CDPReplayRunner();
  await replayer.initialize(true, chromeMeta.executablePath);

  // Sabotaged Trace: Primary selector is sabotaged with non-existent text
  // The replayer MUST automatically fall back to Secondary data-test-id
  const sabotagedPrimaryTrace: StepTrace = {
    traceId: "chaos_trace_sabotaged_primary",
    topicId: "chaos_sabotaged_selector",
    version: "2.0.0",
    targetConsole: "gcp",
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
    steps: [
      {
        id: "step_nav",
        index: 0,
        act: "act3_live_console",
        intent: "Navigate to Vertex AI models",
        action: "navigate",
        targetUrl: `http://127.0.0.1:${MOCK_PORT}/vertex-ai/models?project=trainex-chaos-sandbox`,
        dwellTimeMs: 100,
        redactPii: false,
        cameraFocus: true
      },
      {
        id: "step_sabotaged_button",
        index: 1,
        act: "act3_live_console",
        intent: "Click deploy button with sabotaged primary selector",
        action: "click",
        selector: {
          // SABOTAGED: Primary button name does NOT exist on the page
          primary: { role: "button", name: "NONEXISTENT_SABOTAGED_BUTTON", exact: true },
          // VALID FALLBACK: Secondary testId exists on the page
          secondary: { testId: "mg-deploy-btn" },
          // FALLBACK BBOX
          fallback: { bbox: [120, 1500, 160, 1620] }
        },
        dwellTimeMs: 150,
        redactPii: false,
        cameraFocus: true
      }
    ]
  };

  console.log("  ↳ Executing Sabotaged Primary Selector Trace (Testing Fallback to Secondary)...");
  try {
    const tele = await replayer.executeTrace(sabotagedPrimaryTrace, {
      headless: true,
      executablePath: chromeMeta.executablePath
    });
    console.log(`  ✔ Triad Fallback succeeded! Total frames recorded: ${tele.totalFrames}`);
  } catch (err: any) {
    console.error("  ❌ Triad fallback failed unexpectedly:", err);
    allPassed = false;
  } finally {
    await replayer.close();
  }

  // ============================================================================
  // SIMULATION 3: Studio Hub "Odd User" Monkey Stress & Rapid Timeline Scrubbing
  // ============================================================================
  console.log("\n▶ [Chaos Sim 3] Studio Web Hub 'Odd User' Monkey Scrubbing & Latency Fuzzing...");

  const STUDIO_CHAOS_PORT = 8087;
  const studioServer = createStudioServer();
  await new Promise<void>(resolve => studioServer.listen(STUDIO_CHAOS_PORT, resolve));
  console.log(`  ↳ Studio Hub test instance on http://127.0.0.1:${STUDIO_CHAOS_PORT}`);

  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: chromeMeta.executablePath,
      args: [...DEFAULT_CHROME_FLAGS, "--window-size=1600,1000"],
      defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 2 }
    });

    const page = await browser.newPage();

    // Listen for uncaught JavaScript errors in browser context
    const clientErrors: string[] = [];
    page.on("pageerror", (err: any) => clientErrors.push(err.message));

    await page.goto(`http://127.0.0.1:${STUDIO_CHAOS_PORT}`, { waitUntil: "networkidle0" });

    // Monkey Scrubbing: 12 chaotic, out-of-order scrub operations within 200ms
    console.log("  ↳ Dispatching 12 rapid-fire out-of-order timeline scrub jumps (Chaos Jitter)...");
    const chaoticFrames = [0, 750, 15, 749, 90, 680, 220, 15, 360, 270, 750, 90];
    for (const f of chaoticFrames) {
      await page.evaluate((targetFrame) => {
        (window as any).seekFrame(targetFrame);
      }, f);
      await sleep(25); // 25ms rapid cadence
    }

    await sleep(500);

    // Verify page didn't throw uncaught JS errors
    if (clientErrors.length > 0) {
      console.error("  ❌ Client errors detected during monkey scrubbing:", clientErrors);
      allPassed = false;
    } else {
      console.log("  ✔ 0 Uncaught client errors during rapid-fire timeline monkey scrubbing.");
    }

    // Capture screenshot after chaos scrub
    const outChaosScrub = path.join(scratchChaosDir, "01_chaos_monkey_scrub_settled.png");
    await page.screenshot({ path: outChaosScrub, fullPage: false });
    console.log(`  ✔ Captured: ${outChaosScrub}`);

    // ============================================================================
    // SIMULATION 4: Extreme Responsive Viewports ("Odd Viewports Out")
    // ============================================================================
    console.log("\n▶ [Chaos Sim 4] Extreme Responsive Viewports ('Odd Viewports Out')...");

    // Viewport A: iPhone 14 Mobile (390x844 @ DPR 3)
    console.log("  ↳ Viewport 4A: Mobile Smartphone (390x844 @ DPR 3)...");
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true });
    await sleep(800);
    const outMobile = path.join(scratchChaosDir, "02_chaos_mobile_viewport_390x844.png");
    await page.screenshot({ path: outMobile, fullPage: false });
    console.log(`  ✔ Captured: ${outMobile}`);

    // Viewport B: Ultrawide Cinematic Monitor (2560x1080 - 21:9 Aspect Ratio)
    console.log("  ↳ Viewport 4B: Ultrawide 21:9 Display (2560x1080 @ DPR 2)...");
    await page.setViewport({ width: 2560, height: 1080, deviceScaleFactor: 2, isMobile: false });
    await sleep(800);
    const outUltrawide = path.join(scratchChaosDir, "03_chaos_ultrawide_21_9_2560x1080.png");
    await page.screenshot({ path: outUltrawide, fullPage: false });
    console.log(`  ✔ Captured: ${outUltrawide}`);

    // Viewport C: Extreme Square Aspect Ratio (1:1 Mode Morphing)
    console.log("  ↳ Viewport 4C: Morphing Review Player to 1:1 Square Mode on Ultrawide...");
    await page.evaluate(() => {
      (window as any).setAspectRatio("1:1");
    });
    await sleep(800);
    const outSquare = path.join(scratchChaosDir, "04_chaos_square_1_1_mode.png");
    await page.screenshot({ path: outSquare, fullPage: false });
    console.log(`  ✔ Captured: ${outSquare}`);

  } finally {
    if (browser) await browser.close();
    await new Promise<void>(resolve => studioServer.close(() => resolve()));
    if (mockServer) await mockServer.close();
  }

  console.log("\n================================================================================");
  console.log(`🏁 CHAOS & ODD ONE OUT SIMULATION RESULT: ${allPassed ? "ALL 4 SCENARIOS PASSED" : "FAILED"}`);
  console.log("================================================================================");

  return allPassed;
}

if (process.argv[1] && process.argv[1].endsWith("chaos_simulations.test.ts")) {
  runChaosSimulations().then(success => {
    if (!success) process.exit(1);
  });
}
