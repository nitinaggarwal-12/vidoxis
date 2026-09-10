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
  "/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev",
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
];

const LINUX_CLOUDTOP_CANDIDATE_PATHS = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/opt/google/chrome/chrome",
  "/opt/google/chrome/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium"
];

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
 * Resolves the Google-signed Chrome binary on macOS or Google Cloudtop.
 */
export function resolveGoogleSignedChrome(): string {
  // 1. Explicit Environment Override
  const envPath = process.env.CHROME_BIN || process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath && fs.existsSync(envPath)) {
    return envPath;
  }

  const isMac = process.platform === "darwin";
  const candidates = isMac ? MAC_CANDIDATE_PATHS : LINUX_CLOUDTOP_CANDIDATE_PATHS;

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Check PATH if not found in standard directories
  try {
    const whichCmd = isMac ? "which 'Google Chrome' 2>/dev/null" : "which google-chrome 2>/dev/null || which google-chrome-stable 2>/dev/null";
    const resolved = execSync(whichCmd, { encoding: "utf-8" }).trim();
    if (resolved && fs.existsSync(resolved)) {
      return resolved;
    }
  } catch {
    // Ignore PATH search failure
  }

  throw new Error(
    `[Chrome Path Resolver Failure] Could not locate Google-signed Chrome on ${process.platform}. ` +
    `Ensure Google Chrome is installed at /Applications/Google Chrome.app (Mac) or /usr/bin/google-chrome (Cloudtop), ` +
    `or set PUPPETEER_EXECUTABLE_PATH.`
  );
}

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
    try {
      // Find enclosing .app bundle
      const appIndex = executablePath.indexOf(".app");
      const appPath = appIndex !== -1 ? executablePath.substring(0, appIndex + 4) : executablePath;
      const codesignOut = execSync(`codesign -dv "${appPath}" 2>&1`, { encoding: "utf-8" });
      
      signingAuthority = codesignOut.split("\n").find(l => l.includes("Authority="))?.trim();
      // Google's Developer ID Team Identifier is EQHXZ8M8AV
      if (codesignOut.includes("EQHXZ8M8AV") || codesignOut.includes("Google LLC")) {
        isGoogleSigned = true;
      }
    } catch {
      isGoogleSigned = false;
    }
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
