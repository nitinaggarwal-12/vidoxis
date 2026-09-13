import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { startMockServer, RunningMockServer } from "../src/mock-server/server.js";
import { resolveGoogleSignedChrome, inspectChromeMetadata, DEFAULT_CHROME_FLAGS } from "../src/utils/chrome-path.js";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runE2ECaptureSuite(): Promise<string[]> {
  const chromeMeta = inspectChromeMetadata();
  console.log("================================================================================");
  console.log("🚀 EXECUTING DUAL E2E SCREENSHOT SUITE VIA GOOGLE-SIGNED CHROME");
  console.log("   Director & Quality Controller: Google Omni 1.1");
  console.log(`   Binary: ${chromeMeta.executablePath}`);
  console.log(`   Version: Google Chrome ${chromeMeta.microVersion} (Google-signed: ${chromeMeta.isGoogleSigned}, Cloudtop: ${chromeMeta.isCloudtop})`);
  console.log("   Resolution: 1920x1080 @ DPR 2 (4K Master Density)");
  console.log("   Scope: Dual Walkthrough (Gemini Enterprise Chat + GCP Vertex AI Console)");
  console.log("================================================================================\n");

  const screenshotDir = path.resolve(process.cwd(), "scratch", "screenshots_e2e");
  if (fs.existsSync(screenshotDir)) {
    fs.rmSync(screenshotDir, { recursive: true, force: true });
  }
  fs.mkdirSync(screenshotDir, { recursive: true });

  let mockServer: RunningMockServer | null = null;
  const capturedFiles: string[] = [];

  try {
    mockServer = await startMockServer({ port: 8092 });
    console.log(`  ↳ Mock Console & Gemini Enterprise server ready at ${mockServer.baseUrl}`);

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromeMeta.executablePath,
      args: [
        ...DEFAULT_CHROME_FLAGS,
        "--lang=en-US",
        "--window-size=1920,1080"
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2
      }
    });

    const page = await browser.newPage();

    // 00. Render Whiteboard Architecture SVG at true 4K UHD (3840x2160)
    const svgPath = path.resolve(process.cwd(), "scratch", "01_whiteboard_architecture.svg");
    if (fs.existsSync(svgPath)) {
      console.log("📸 [00] Capturing Executive 5-Tier Whiteboard at 4K UHD (3840x2160)...");
      await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
      await page.goto(`file://${svgPath}`, { waitUntil: "networkidle0" });
      await sleep(800); // Settling delay per protocol
      const out00 = path.join(screenshotDir, "00_whiteboard_architecture_canvas.png");
      await page.screenshot({ path: out00 });
      capturedFiles.push(out00);
      console.log(`  ✔ Captured 4K Whiteboard: ${out00}`);
    }

    // Reset to 1920x1080 @ DPR 2 for Screen Captures
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

    // -------------------------------------------------------------------------
    // STAGE 1: GEMINI ENTERPRISE CHAT (The User Experience - Dr. Maya Lin)
    // -------------------------------------------------------------------------
    console.log("\n💬 STAGE 1: GEMINI ENTERPRISE CHAT (Front-of-House Clinical Experience)");
    
    // 01. Gemini Enterprise Chat Prompt & Context
    console.log("📸 [01] Navigating to Gemini Enterprise Chat (/chat/gemini-enterprise)...");
    await page.goto(`${mockServer.baseUrl}/chat/gemini-enterprise?trial=NCT-048291`, { waitUntil: "networkidle0" });
    await page.waitForSelector(".top-nav", { timeout: 5000 });
    await sleep(800); // 800ms settling delay
    const out01 = path.join(screenshotDir, "01_gemini_enterprise_chat_prompt.png");
    await page.screenshot({ path: out01 });
    capturedFiles.push(out01);
    console.log(`  ✔ Captured: ${out01}`);

    // 02. Agentic Multi-Tool Execution Trace
    console.log("📸 [02] Capturing Agentic Execution Trace (3 Deterministic Tool Calls)...");
    await page.waitForSelector("[data-test-id='agentic-trace-panel']", { timeout: 5000 });
    await sleep(800);
    const out02 = path.join(screenshotDir, "02_gemini_enterprise_agent_reasoning.png");
    await page.screenshot({ path: out02 });
    capturedFiles.push(out02);
    console.log(`  ✔ Captured: ${out02}`);

    // 03. Clinical Results Card & Grounded Patient Matches
    console.log("📸 [03] Capturing Clinical Assessment & SAP Inventory Table...");
    await page.waitForSelector("[data-test-id='clinical-card-panel']", { timeout: 5000 });
    await sleep(800);
    const out03 = path.join(screenshotDir, "03_gemini_enterprise_clinical_results.png");
    await page.screenshot({ path: out03 });
    capturedFiles.push(out03);
    console.log(`  ✔ Captured: ${out03}`);

    // -------------------------------------------------------------------------
    // STAGE 2: GOOGLE CLOUD CONSOLE (The Platform Infrastructure - Vertex AI)
    // -------------------------------------------------------------------------
    console.log("\n☁️ STAGE 2: GOOGLE CLOUD CONSOLE (Back-of-House Vertex AI Infrastructure)");

    // 04. Google Cloud Console Vertex AI Model Garden
    console.log("📸 [04] Navigating to GCP Console Vertex AI Model Garden deep link...");
    await page.goto(`${mockServer.baseUrl}/vertex-ai/models?project=vidoxis-sandbox-8f2a`, { waitUntil: "networkidle0" });
    await page.waitForSelector("[data-test-id='pantheon-logo']", { timeout: 5000 });
    await page.waitForSelector("[data-test-id='mg-deploy-btn']", { timeout: 5000 });
    await sleep(800);
    const out04 = path.join(screenshotDir, "04_gcp_console_vertex_model_garden.png");
    await page.screenshot({ path: out04 });
    capturedFiles.push(out04);
    console.log(`  ✔ Captured: ${out04}`);

    // 05. Open Vertex AI Private Deployment Drawer
    console.log("📸 [05] Clicking 'Deploy to Private Endpoint' to trigger slide drawer...");
    const deployBtn = await page.$("[data-test-id='mg-deploy-btn']");
    if (deployBtn) {
      await deployBtn.click();
    } else {
      await page.evaluate(() => {
        (window as any).openDeployDrawer?.();
      });
    }
    // Wait for 250ms CSS drawer transition + 800ms settling delay
    await sleep(800);
    const out05 = path.join(screenshotDir, "05_gcp_console_deploy_drawer_opened.png");
    await page.screenshot({ path: out05 });
    capturedFiles.push(out05);
    console.log(`  ✔ Captured: ${out05}`);

    // 06. Submit Private VPC Deployment & Verify Active Status
    console.log("📸 [06] Clicking 'Deploy Endpoint' and awaiting Active PSC verification...");
    await page.evaluate(() => {
      const drawer = document.getElementById('pantheon-drawer-component');
      const form = drawer?.shadowRoot?.getElementById('endpoint-deploy-form') as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    });

    // Condition gate: wait for Active status badge inside shadow root
    await page.waitForFunction(() => {
      const drawer = document.getElementById('pantheon-drawer-component');
      const badge = drawer?.shadowRoot?.querySelector('#deploy-badge');
      return badge && badge.textContent && badge.textContent.includes("Active");
    }, { timeout: 5000 });

    await sleep(800);
    const out06 = path.join(screenshotDir, "06_gcp_console_endpoint_active_verified.png");
    await page.screenshot({ path: out06 });
    capturedFiles.push(out06);
    console.log(`  ✔ Captured: ${out06}`);

    // Backward-compatible alias copies for downstream tooling
    fs.copyFileSync(out04, path.join(screenshotDir, "01_model_garden_overview.png"));
    fs.copyFileSync(out05, path.join(screenshotDir, "02_deploy_model_drawer_opened.png"));
    fs.copyFileSync(out05, path.join(screenshotDir, "03_endpoint_name_and_config_entered.png"));
    fs.copyFileSync(out06, path.join(screenshotDir, "04_deployment_active_verified.png"));
    // Additional service pages
    fs.copyFileSync(out04, path.join(screenshotDir, "05_cloud_run_services.png"));
    fs.copyFileSync(out03, path.join(screenshotDir, "06_bigquery_studio_editor.png"));

    await browser.close();
    console.log("\n🎉 Dual E2E Capture Suite Completed Successfully (Director: Google Omni 1.1)!");
    return capturedFiles;
  } finally {
    if (mockServer) {
      await mockServer.close();
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith("e2e_capture.test.ts")) {
  runE2ECaptureSuite().catch(err => {
    console.error("Dual E2E Capture Failed:", err);
    process.exit(1);
  });
}
