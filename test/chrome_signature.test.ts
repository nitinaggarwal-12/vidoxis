import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  GOOGLE_TEAM_IDENTIFIER,
  isBannedBrowserPath,
  verifyGoogleSignature,
  resolveGoogleSignedChrome,
  inspectChromeMetadata
} from "../src/utils/chrome-path.js";
import { CDPReplayRunner } from "../src/runner/cdp-replayer.js";

const BROWSER_ENV_KEYS = ["CHROME_BIN", "CHROME_PATH", "PUPPETEER_EXECUTABLE_PATH"] as const;

/** Runs `fn` with all browser env overrides cleared, then restores them. */
function withCleanBrowserEnv<T>(fn: () => T): T {
  const saved = new Map<string, string | undefined>();
  for (const key of BROWSER_ENV_KEYS) {
    saved.set(key, process.env[key]);
    delete process.env[key];
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function check(label: string, condition: boolean, detail = ""): boolean {
  console.log(`  ${condition ? "✔" : "❌"} ${label}${detail ? ` — ${detail}` : ""}`);
  return condition;
}

export async function testChromeSignatureEnforcement(): Promise<boolean> {
  console.log("→ Suite: Google-Signed Chrome Enforcement (Santa Lockdown Guard)");
  const isMac = process.platform === "darwin";
  let passed = true;

  // ------------------------------------------------------------------
  // 1. The resolver must find a browser, and on macOS it must be signed.
  // ------------------------------------------------------------------
  let resolved = "";
  try {
    resolved = withCleanBrowserEnv(() => resolveGoogleSignedChrome());
    passed = check("resolver returned a browser", Boolean(resolved), resolved) && passed;
  } catch (err) {
    passed = check("resolver returned a browser", false, String(err));
    return passed;
  }

  passed = check("resolved path is not a banned build", !isBannedBrowserPath(resolved), resolved) && passed;

  if (isMac) {
    const authority = verifyGoogleSignature(resolved);
    passed =
      check(
        `resolved binary is Developer ID signed (Team ${GOOGLE_TEAM_IDENTIFIER})`,
        Boolean(authority),
        authority ?? "no valid Google authority found"
      ) && passed;
  }

  // ------------------------------------------------------------------
  // 2. Metadata reporting must agree with enforcement.
  // ------------------------------------------------------------------
  const meta = withCleanBrowserEnv(() => inspectChromeMetadata());
  passed = check("metadata reports Google-signed", meta.isGoogleSigned, meta.version) && passed;
  passed =
    check(
      "metadata micro-version parsed",
      /^\d+\.\d+\.\d+\.\d+$/.test(meta.microVersion),
      meta.microVersion
    ) && passed;

  // ------------------------------------------------------------------
  // 3. NEGATIVE: known-bad paths must be classified as banned.
  //    These are the exact builds Puppeteer and Remotion download.
  // ------------------------------------------------------------------
  const knownBadPaths = [
    path.join(os.homedir(), ".cache/puppeteer/chrome/mac_arm-148.0.7778.97/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
    path.join(os.homedir(), ".cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell"),
    "/Applications/Chromium.app/Contents/MacOS/Chromium"
  ];
  for (const bad of knownBadPaths) {
    passed = check(`rejected as banned: ${path.basename(bad)}`, isBannedBrowserPath(bad)) && passed;
  }

  // A legitimate path must NOT be caught by the ban list (no false positives).
  passed =
    check(
      "signed Chrome is not falsely banned",
      !isBannedBrowserPath("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
    ) && passed;

  // ------------------------------------------------------------------
  // 4. NEGATIVE: env override pointing at a banned build must THROW,
  //    not be silently trusted. This is the regression that mattered.
  // ------------------------------------------------------------------
  const saved = process.env.CHROME_BIN;
  const fakeCacheDir = fs.mkdtempSync(path.join(os.tmpdir(), "vidoxis-puppeteer-cache-"));
  // Mimic the real puppeteer cache layout so existsSync() passes and we
  // genuinely exercise the rejection branch rather than the "missing file" branch.
  const fakeBanned = path.join(fakeCacheDir, ".cache/puppeteer/chrome/mac_arm-148/chrome-mac-arm64");
  fs.mkdirSync(path.dirname(fakeBanned), { recursive: true });
  fs.writeFileSync(fakeBanned, "#!/bin/sh\nexit 0\n", { mode: 0o755 });

  try {
    process.env.CHROME_BIN = fakeBanned;
    let threw = false;
    let message = "";
    try {
      resolveGoogleSignedChrome();
    } catch (err) {
      threw = true;
      message = err instanceof Error ? err.message : String(err);
    }
    passed = check("CHROME_BIN pointing at a Chrome-for-Testing build throws", threw) && passed;
    passed =
      check(
        "rejection message explains why",
        threw && /not Google Developer ID signed|Chrome for Testing/i.test(message)
      ) && passed;

    // 5. NEGATIVE (macOS only): an existing but UNSIGNED binary must throw.
    if (isMac) {
      const unsigned = path.join(fakeCacheDir, "my-custom-browser");
      fs.writeFileSync(unsigned, "#!/bin/sh\nexit 0\n", { mode: 0o755 });
      process.env.CHROME_BIN = unsigned;
      let threwUnsigned = false;
      try {
        resolveGoogleSignedChrome();
      } catch {
        threwUnsigned = true;
      }
      passed =
        check("CHROME_BIN pointing at an unsigned binary throws", threwUnsigned) && passed;
    }
  } finally {
    if (saved === undefined) delete process.env.CHROME_BIN;
    else process.env.CHROME_BIN = saved;
    fs.rmSync(fakeCacheDir, { recursive: true, force: true });
  }

  // ------------------------------------------------------------------
  // 6. NEGATIVE: the CDP replayer must reject a banned path too.
  //    Regression guard: it previously passed `undefined` straight to
  //    puppeteer.launch on resolution failure, which silently selected
  //    Puppeteer's own unsigned Chrome for Testing build.
  // ------------------------------------------------------------------
  {
    const runner = new CDPReplayRunner();
    const bannedPath =
      "/tmp/.cache/puppeteer/chrome/mac_arm-148/chrome-mac-arm64/Google Chrome for Testing";
    let threw = false;
    try {
      await runner.initialize(true, bannedPath);
    } catch (err) {
      threw = /Refusing to launch|Chrome for Testing/i.test(
        err instanceof Error ? err.message : String(err)
      );
    }
    passed = check("CDPReplayRunner rejects a banned executable path", threw) && passed;
  }

  console.log(
    passed
      ? "  → Chrome signature enforcement VERIFIED."
      : "  → Chrome signature enforcement FAILED."
  );
  return passed;
}

const isDirectRun = process.argv[1] && process.argv[1].includes("chrome_signature.test");
if (isDirectRun) {
  testChromeSignatureEnforcement().then(ok => process.exit(ok ? 0 : 1));
}
