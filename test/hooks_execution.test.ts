import { VidoxisHookRunner } from "../src/hooks/runner.js";

export async function testHookExecutionEngine(): Promise<boolean> {
  console.log("▶ [Test 4] Testing Vidoxis Hook Execution Engine across all lifecycle events...");
  const runner = new VidoxisHookRunner();
  const lifecycles = runner.getAvailableLifecycles();
  console.log(`  ↳ Found ${lifecycles.length} registered lifecycle events in hooks.json.`);

  let totalHooks = 0;
  let passedHooks = 0;

  for (const lc of lifecycles) {
    const { passed, results } = await runner.runLifecycle(lc, {
      PROJECT_ID: "trainex-sandbox-8f2a",
      TARGET_DRIVER: "gcp",
      FILE: "schemas/manifest.v2.json",
      CONTRACT_FILE: "schemas/contract.v1.json",
      SLIDE_SVG: "scratch/01_whiteboard_architecture.svg",
      WHITEBOARD_MANIFEST: "scratch/whiteboard_manifest.json",
      PHONEMES_JSON: "scratch/phonemes.json",
      TELEMETRY_JSON: "scratch/02_telemetry_stream.json",
      RAW_VIDEO: "scratch/raw_screencast.mp4",
      AUTH_PROFILE: "default",
      OUTPUT_MP4: "scratch/trainex_master_4k.mp4",
      TRANSCRIPT_JSON: "scratch/transcript.json",
      HLS_URL: "https://cdn.google.internal/live.m3u8"
    });

    totalHooks += results.length;
    for (const r of results) {
      if (r.passed) {
        passedHooks++;
      } else {
        console.error(`  ❌ Hook failed: ${r.hookId} (Exit ${r.exitCode})\n${r.stderr}`);
      }
    }
  }

  console.log(`  ✔ Hook execution results: ${passedHooks}/${totalHooks} hooks passed cleanly!`);
  return passedHooks === totalHooks;
}

if (process.argv[1] && process.argv[1].endsWith("hooks_execution.test.ts")) {
  testHookExecutionEngine().then(success => {
    if (!success) process.exit(1);
  });
}
