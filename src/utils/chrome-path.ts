import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export interface ChromeBinaryMetadata {
  executablePath: string;
  version: string;
  microVersion: string; // e.g. "153.0.8010.36"
  platform: "darwin" | "linux" | "win32" | "other";
  isGoogleSigned: boolean;
  signingAuthority?: string;
  isCloudtop: boolean;
}

const MAC_CANDIDATE_PATHS = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
  "/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta",
  "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev"
  // NOTE: Chromium is deliberately NOT a candidate. It is not signed with
  // Google's Developer ID and is blocked by Santa in Lockdown mode.
];

const LINUX_CLOUDTOP_CANDIDATE_PATHS = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/opt/google/chrome/chrome",
  "/opt/google/chrome/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium"
];

/** Google's Apple Developer ID Team Identifier. */
export const GOOGLE_TEAM_IDENTIFIER = "EQHXZ8M8AV";

/**
 * Binaries that must never be used for capture or compositing.
 *
 * Puppeteer and Remotion both download their own browsers into user caches.
 * Those are "Chrome for Testing" / "chrome-headless-shell" builds: they are
 * ad-hoc or linker-signed with no TeamIdentifier, so Santa Lockdown kills them
 * (SIGKILL / "Killed: 9"), and they drift from the installed Chrome version.
 */
const BANNED_PATH_FRAGMENTS = [
  ".cache/puppeteer",
  "chrome-headless-shell",
  "Chrome for Testing",
  "chrome-mac-arm64",
  "chrome-mac-x64",
  ".remotion/chrome",
  "Chromium.app"
];

export function isBannedBrowserPath(candidate: string): boolean {
  return BANNED_PATH_FRAGMENTS.some(fragment => candidate.includes(fragment));
}

/**
 * Verifies a macOS binary is signed by "Developer ID Application: Google LLC".
 * Returns the authority line when valid, or undefined when not.
 */
export function verifyGoogleSignature(executablePath: string): string | undefined {
  if (process.platform !== "darwin") {
    return undefined;
  }
  try {
    const appIndex = executablePath.indexOf(".app");
    const appPath = appIndex !== -1 ? executablePath.substring(0, appIndex + 4) : executablePath;
    const out = execSync(`codesign -dv --verbose=2 "${appPath}" 2>&1`, { encoding: "utf-8" });
    const hasTeam = out.includes(`TeamIdentifier=${GOOGLE_TEAM_IDENTIFIER}`);
    const hasAuthority = out.includes("Developer ID Application: Google LLC");
    if (hasTeam && hasAuthority) {
      return out.split("\n").find(l => l.includes("Authority=Developer ID Application"))?.trim();
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Resolves the Google-signed Chrome binary on macOS or Google Cloudtop.
 *
 * On macOS this now *enforces* the Developer ID signature rather than merely
 * reporting it, so screenshots and video compositing can never silently fall
 * back to an unsigned Chrome for Testing build.
 */
export function resolveGoogleSignedChrome(): string {
  const isMac = process.platform === "darwin";

  // 1. Explicit environment override — still verified, not blindly trusted.
  const envPath = process.env.CHROME_BIN || process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) {
    if (isBannedBrowserPath(envPath)) {
      throw new Error(
        `[Chrome Path Resolver] Refusing to use "${envPath}": it is a Chrome for Testing / ` +
          `headless-shell build, which is not Google Developer ID signed and is blocked by Santa. ` +
          `Point CHROME_BIN at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome.`
      );
    }
    if (isMac && !verifyGoogleSignature(envPath)) {
      throw new Error(
        `[Chrome Path Resolver] "${envPath}" is not signed by "Developer ID Application: Google LLC" ` +
          `(TeamIdentifier ${GOOGLE_TEAM_IDENTIFIER}). Refusing to launch an unsigned browser for capture.`
      );
    }
    return envPath;
  }

  const candidates = isMac ? MAC_CANDIDATE_PATHS : LINUX_CLOUDTOP_CANDIDATE_PATHS;

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate) || isBannedBrowserPath(candidate)) {
      continue;
    }
    if (isMac && !verifyGoogleSignature(candidate)) {
      continue;
    }
    return candidate;
  }

  // Check PATH if not found in standard directories
  try {
    const whichCmd = isMac ? "which 'Google Chrome' 2>/dev/null" : "which google-chrome 2>/dev/null || which google-chrome-stable 2>/dev/null";
    const resolved = execSync(whichCmd, { encoding: "utf-8" }).trim();
    if (resolved && fs.existsSync(resolved) && !isBannedBrowserPath(resolved)) {
      if (!isMac || verifyGoogleSignature(resolved)) {
        return resolved;
      }
    }
  } catch {
    // Ignore PATH search failure
  }

  throw new Error(
    `[Chrome Path Resolver Failure] Could not locate a Google-signed Chrome on ${process.platform}. ` +
    `On macOS the binary must be signed "Developer ID Application: Google LLC" (TeamIdentifier ${GOOGLE_TEAM_IDENTIFIER}); ` +
    `install Google Chrome to /Applications/Google Chrome.app. On Cloudtop use /usr/bin/google-chrome. ` +
    `Puppeteer's bundled Chrome for Testing is explicitly rejected.`
  );
}

export const DEFAULT_CHROME_FLAGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-features=Translate,OptimizationHints,MediaRouter",
  "--disable-background-networking",
  "--enable-features=NetworkService,NetworkServiceInProcess",
  "--force-color-profile=srgb"
];

/**
 * Inspects the binary, verifying Google LLC code signature and micro-version.
 */
export function inspectChromeMetadata(customPath?: string): ChromeBinaryMetadata {
  const executablePath = customPath || resolveGoogleSignedChrome();
  const platform = process.platform as ChromeBinaryMetadata["platform"];
  const isCloudtop = Boolean(
    process.env.CLOUDTOP ||
    process.env.GOOGLE_CLOUDTOP ||
    (fs.existsSync("/etc/issue") && fs.readFileSync("/etc/issue", "utf8").includes("Debian"))
  );

  let version = "unknown";
  let microVersion = "unknown";

  try {
    const out = execSync(`"${executablePath}" --version`, { encoding: "utf-8" }).trim();
    version = out;
    const match = out.match(/(\d+\.\d+\.\d+\.\d+)/);
    if (match) {
      microVersion = match[1];
    }
  } catch (err) {
    console.warn(`[Chrome Metadata] Failed to execute ${executablePath} --version: ${err}`);
  }

  let isGoogleSigned = false;
  let signingAuthority: string | undefined;

  if (platform === "darwin") {
    // Reuse the single strict verifier so reporting and enforcement can never
    // disagree: both require TeamIdentifier=EQHXZ8M8AV *and* the
    // "Developer ID Application: Google LLC" authority.
    signingAuthority = verifyGoogleSignature(executablePath);
    isGoogleSigned = Boolean(signingAuthority);
  } else if (platform === "linux") {
    // On Cloudtop / Linux, google-chrome packages from Google apt repository are signed
    if (executablePath.includes("google-chrome") || executablePath.includes("/opt/google/chrome")) {
      isGoogleSigned = true;
      signingAuthority = "Google LLC (Debian/Apt Repo)";
    }
  }

  return {
    executablePath,
    version,
    microVersion,
    platform,
    isGoogleSigned,
    signingAuthority,
    isCloudtop
  };
}
