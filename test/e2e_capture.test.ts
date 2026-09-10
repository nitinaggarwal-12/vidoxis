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
  console.log("🚀 EXECUTING E2E SCREENSHOT SUITE VIA GOOGLE-SIGNED CHROME");
  console.log(`   Binary: ${chromeMeta.executablePath}`);
  console.log(`   Version: Google Chrome ${chromeMeta.microVersion} (Google-signed: ${chromeMeta.isGoogleSigned}, Cloudtop: ${chromeMeta.isCloudtop})`);
  console.log("   Resolution: 1920x1080 @ DPR 2 (4K Master Density)");
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
    console.log(`  ↳ Mock Console server ready at ${mockServer.baseUrl}`);

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
      console.log("📸 [00] Capturing Progressive Whiteboard Canvas at 4K UHD (3840x2160)...");
      await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
      await page.goto(`file://${svgPath}`, { waitUntil: "networkidle0" });
      await sleep(800);
      const out00 = path.join(screenshotDir, "00_whiteboard_architecture_canvas.png");
      await page.screenshot({ path: out00 });
      capturedFiles.push(out00);
      console.log(`  ✔ Captured 4K Whiteboard: ${out00}`);
    }

    // Reset to 1920x1080 @ DPR 2 for Cloud Console Recording
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

    // 01. Vertex AI Model Garden Overview
    console.log("📸 [01] Navigating to Vertex AI Model Garden deep link...");
    await page.goto(`${mockServer.baseUrl}/vertex-ai/models?project=trainex-sandbox-8f2a`, { waitUntil: "networkidle0" });
    await sleep(800); // 800ms settling delay
    const out01 = path.join(screenshotDir, "01_model_garden_overview.png");
    await page.screenshot({ path: out01 });
    capturedFiles.push(out01);
    console.log(`  ✔ Captured: ${out01}`);

    // 02. Click "Deploy Model" Button to open drawer
    console.log("📸 [02] Clicking 'Deploy Model' to trigger drawer slide-in...");
    const deployBtn = await page.$("[data-test-id='mg-deploy-btn']");
    if (deployBtn) await deployBtn.click();
    await sleep(800); // Allow 250ms CSS drawer transition + React settle
    const out02 = path.join(screenshotDir, "02_deploy_model_drawer_opened.png");
    await page.screenshot({ path: out02 });
    capturedFiles.push(out02);
    console.log(`  ✔ Captured: ${out02}`);

    // 03. Enter Endpoint Name and Configuration
    console.log("📸 [03] Typing endpoint configuration into form fields...");
    const nameInput = await page.$("pantheon-deploy-drawer >>> [data-test-id='input-endpoint-name']");
    if (nameInput) {
      await nameInput.click({ clickCount: 3 });
      await page.keyboard.press("Backspace");
      await nameInput.type("gemini-2-flash-prod", { delay: 35 });
    }
    await sleep(800);
    const out03 = path.join(screenshotDir, "03_endpoint_name_and_config_entered.png");
    await page.screenshot({ path: out03 });
    capturedFiles.push(out03);
    console.log(`  ✔ Captured: ${out03}`);

    // 04. Confirm and Deploy (Wait for Active DOM Mutation)
    console.log("📸 [04] Clicking 'Confirm and Deploy' and waiting for Active status...");
    const confirmBtn = await page.$("pantheon-deploy-drawer >>> [data-test-id='btn-confirm-deploy']");
    if (confirmBtn) await confirmBtn.click();

    // Condition gate: wait for Active status badge inside shadow root
    await page.waitForFunction(() => {
      const drawer = document.getElementById('pantheon-drawer-component');
      const badge = drawer?.shadowRoot?.querySelector('#deploy-badge');
      return badge && badge.textContent && badge.textContent.includes("Active");
    }, { timeout: 5000 });

    await sleep(800);
    const out04 = path.join(screenshotDir, "04_deployment_active_verified.png");
    await page.screenshot({ path: out04 });
    capturedFiles.push(out04);
    console.log(`  ✔ Captured: ${out04}`);

    // 05. Cloud Run Services Deep Link
    console.log("📸 [05] Navigating to Cloud Run Services...");
    await page.goto(`${mockServer.baseUrl}/run/deploy?project=trainex-sandbox-8f2a`, { waitUntil: "networkidle0" });
    await sleep(800);
    const out05 = path.join(screenshotDir, "05_cloud_run_services.png");
    await page.screenshot({ path: out05 });
    capturedFiles.push(out05);
    console.log(`  ✔ Captured: ${out05}`);

    // 06. BigQuery Studio Editor Deep Link
    console.log("📸 [06] Navigating to BigQuery Studio...");
    await page.goto(`${mockServer.baseUrl}/bigquery?project=trainex-sandbox-8f2a`, { waitUntil: "networkidle0" });
    await sleep(800);
    const out06 = path.join(screenshotDir, "06_bigquery_studio_editor.png");
    await page.screenshot({ path: out06 });
    capturedFiles.push(out06);
    console.log(`  ✔ Captured: ${out06}`);

    await browser.close();
    console.log("\n🎉 E2E Capture Suite Completed Successfully!");
    return capturedFiles;
  } finally {
    if (mockServer) {
      await mockServer.close();
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith("e2e_capture.test.ts")) {
  runE2ECaptureSuite().catch(err => {
    console.error("E2E Capture Failed:", err);
    process.exit(1);
  });
}
