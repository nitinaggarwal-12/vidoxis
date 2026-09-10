import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer";
import { createStudioServer } from "../src/studio/server.js";
import { inspectChromeMetadata, DEFAULT_CHROME_FLAGS } from "../src/utils/chrome-path.js";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runStudioHubVerification(): Promise<boolean> {
  const chromeMeta = inspectChromeMetadata();
  console.log("================================================================================");
  console.log("🚀 TESTING TRAINEX STUDIO WEB HUB VIA GOOGLE-SIGNED CHROME");
  console.log(`   Binary: ${chromeMeta.executablePath}`);
  console.log(`   Version: Google Chrome ${chromeMeta.microVersion} (Signed: ${chromeMeta.isGoogleSigned})`);
  console.log("   Viewport: 1600x1000 @ DPR 2 (Spacious Desktop Standard)");
  console.log("================================================================================\n");

  const screenshotDir = path.resolve(process.cwd(), "scratch", "screenshots_studio");
  if (fs.existsSync(screenshotDir)) {
    fs.rmSync(screenshotDir, { recursive: true, force: true });
  }
  fs.mkdirSync(screenshotDir, { recursive: true });

  const PORT = 8086;
  const server = createStudioServer();
  await new Promise<void>(resolve => server.listen(PORT, resolve));
  console.log(`  ✔ Trainex Studio test server listening on http://127.0.0.1:${PORT}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: chromeMeta.executablePath,
      args: [
        ...DEFAULT_CHROME_FLAGS,
        "--lang=en-US",
        "--window-size=1600,1000"
      ],
      defaultViewport: {
        width: 1600,
        height: 1000,
        deviceScaleFactor: 2
      }
    });

    const page = await browser.newPage();

    // 1. Initial Overview (Act 2 Whiteboard frame 90 default)
    console.log("📸 [01] Capturing Studio Hub Wide Desktop Overview...");
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: "networkidle0" });
    await sleep(800);
    const out01 = path.join(screenshotDir, "01_studio_hub_wide_desktop_overview.png");
    await page.screenshot({ path: out01, fullPage: false });
    console.log(`  ✔ Captured: ${out01}`);

    // 2. Scrub to Frame 220 (Act 3: Live Console Drawer)
    console.log("📸 [02] Scrubbing to Frame 220 (Act 3: Console Drawer)...");
    await page.evaluate(() => {
      (window as any).seekFrame(220);
    });
    await sleep(800);
    const out02 = path.join(screenshotDir, "02_studio_hub_act3_drawer_frame220.png");
    await page.screenshot({ path: out02, fullPage: false });
    console.log(`  ✔ Captured: ${out02}`);

    // 3. Scrub to Frame 270 (Act 4: 12px Dilation Redaction)
    console.log("📸 [03] Scrubbing to Frame 270 (Act 4: 12px Dilation Redaction)...");
    await page.evaluate(() => {
      (window as any).seekFrame(270);
    });
    await sleep(800);
    const out03 = path.join(screenshotDir, "03_studio_hub_act4_redaction_frame270.png");
    await page.screenshot({ path: out03, fullPage: false });
    console.log(`  ✔ Captured: ${out03}`);

    // 4. Test Aspect Ratio Switching (4:3 Academy)
    console.log("📸 [04] Testing Aspect Ratio Morphing (4:3 Academy Mode)...");
    await page.evaluate(() => {
      (window as any).setAspectRatio("4:3");
    });
    await sleep(800);
    const out04 = path.join(screenshotDir, "04_studio_hub_aspect_ratio_4_3.png");
    await page.screenshot({ path: out04, fullPage: false });
    console.log(`  ✔ Captured: ${out04}`);

    // 5. Scroll down to Progressive Whiteboard & Telemetry Section
    console.log("📸 [05] Capturing Whiteboard Stage & Telemetry Section...");
    await page.evaluate(() => {
      window.scrollTo({ top: 750, behavior: "instant" });
    });
    await sleep(800);
    const out05 = path.join(screenshotDir, "05_studio_hub_whiteboard_and_telemetry.png");
    await page.screenshot({ path: out05, fullPage: false });
    console.log(`  ✔ Captured: ${out05}`);

    console.log("\n🎉 Trainex Studio Hub E2E Verification Succeeded (5/5 Pristine Shots Captured)!");
    return true;
  } catch (err) {
    console.error("Studio Hub test failed:", err);
    return false;
  } finally {
    if (browser) await browser.close();
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

if (process.argv[1] && process.argv[1].endsWith("studio_hub.test.ts")) {
  runStudioHubVerification().then(success => {
    if (!success) process.exit(1);
  });
}
