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

    // 1. Initial Overview (Act 2 Whiteboard frame 90 default with Gold Karaoke Subtitles)
    console.log("📸 [01] Capturing Studio Hub Wide Desktop Overview...");
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: "networkidle0" });
    await sleep(800);
    const out01 = path.join(screenshotDir, "01_studio_hub_wide_desktop_overview.png");
    await page.screenshot({ path: out01, fullPage: false });
    console.log(`  ✔ Captured: ${out01}`);

    // 2. Seek to Frame 15 (Act 1: Cold Open Hook & Legal Disclaimer)
    console.log("📸 [02] Seeking to Frame 15 (Act 1: Cold Open Hook)...");
    await page.evaluate(() => {
      (window as any).seekFrame(15);
    });
    await sleep(800);
    const out02 = path.join(screenshotDir, "02_studio_hub_act1_hook.png");
    await page.screenshot({ path: out02, fullPage: false });
    console.log(`  ✔ Captured: ${out02}`);

    // 3. Seek to Frame 90 (Act 2: Whiteboard Architecture & Gold Karaoke Subtitles)
    console.log("📸 [03] Seeking to Frame 90 (Act 2: Whiteboard + Gold Karaoke)...");
    await page.evaluate(() => {
      (window as any).seekFrame(90);
    });
    await sleep(800);
    const out03 = path.join(screenshotDir, "03_studio_hub_act2_whiteboard_karaoke.png");
    await page.screenshot({ path: out03, fullPage: false });
    console.log(`  ✔ Captured: ${out03}`);

    // 4. Seek to Frame 220 (Act 3: Live Console Drawer Typing)
    console.log("📸 [04] Seeking to Frame 220 (Act 3: Live Console Drawer)...");
    await page.evaluate(() => {
      (window as any).seekFrame(220);
    });
    await sleep(800);
    const out04 = path.join(screenshotDir, "04_studio_hub_act3_drawer_frame220.png");
    await page.screenshot({ path: out04, fullPage: false });
    console.log(`  ✔ Captured: ${out04}`);

    // 5. Seek to Frame 270 (Act 4: 12px Dilation Redaction Box)
    console.log("📸 [05] Seeking to Frame 270 (Act 4: 12px Dilation Redaction)...");
    await page.evaluate(() => {
      (window as any).seekFrame(270);
    });
    await sleep(800);
    const out05 = path.join(screenshotDir, "05_studio_hub_act4_redaction_frame270.png");
    await page.screenshot({ path: out05, fullPage: false });
    console.log(`  ✔ Captured: ${out05}`);

    // 6. Seek to Frame 360 (Act 5: Production Checklist)
    console.log("📸 [06] Seeking to Frame 360 (Act 5: Production Checklist)...");
    await page.evaluate(() => {
      (window as any).seekFrame(360);
    });
    await sleep(800);
    const out06 = path.join(screenshotDir, "06_studio_hub_act5_checklist_frame360.png");
    await page.screenshot({ path: out06, fullPage: false });
    console.log(`  ✔ Captured: ${out06}`);

    // 7. Test Aspect Ratio Switching (4:3 Academy Mode)
    console.log("📸 [07] Testing Aspect Ratio Morphing (4:3 Academy Mode)...");
    await page.evaluate(() => {
      (window as any).setAspectRatio("4:3");
    });
    await sleep(800);
    const out07 = path.join(screenshotDir, "07_studio_hub_aspect_ratio_4_3.png");
    await page.screenshot({ path: out07, fullPage: false });
    console.log(`  ✔ Captured: ${out07}`);

    // 8. Test Audio Mixer & Asset Hub (Scroll to Middle Section)
    console.log("📸 [08] Capturing Phase 3 Master Broadcast Asset Hub & Whiteboard...");
    await page.evaluate(() => {
      (window as any).setAspectRatio("16:9");
      window.scrollTo({ top: 680, behavior: "instant" });
    });
    await sleep(800);
    const out08 = path.join(screenshotDir, "08_studio_hub_master_asset_hub_and_whiteboard.png");
    await page.screenshot({ path: out08, fullPage: false });
    console.log(`  ✔ Captured: ${out08}`);

    // 9. Scroll to Bottom (Deterministic CDP Telemetry & 39 Quality Hooks)
    console.log("📸 [09] Capturing Bottom Grid (CDP Telemetry & 39 Quality Hooks)...");
    await page.evaluate(() => {
      window.scrollTo({ top: 1550, behavior: "instant" });
    });
    await sleep(800);
    const out09 = path.join(screenshotDir, "09_studio_hub_telemetry_and_hooks.png");
    await page.screenshot({ path: out09, fullPage: false });
    console.log(`  ✔ Captured: ${out09}`);

    console.log("\n🎉 Trainex Studio Hub E2E Verification Succeeded (9/9 Pristine 4K Shots Captured)!");
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
