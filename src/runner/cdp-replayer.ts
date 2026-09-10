import fs from "node:fs";
import puppeteer, { Browser, Page, CDPSession } from "puppeteer";
import { StepTrace, TraceStep } from "../types/trace.js";
import { TelemetryStream, TelemetryEvent } from "../types/telemetry.js";
import { computeMinimumJerkTrajectory, Point2D } from "./trajectory-math.js";
import { CameraSpringController } from "./camera-spring.js";
import { TriadSelectorResolver } from "./triad-selector.js";

export interface ReplayOptions {
  headless?: boolean;
  executablePath?: string;
  urlMap?: Record<string, string>; // Maps cloud URLs to local mock server URLs
  onFrame?: (event: TelemetryEvent) => void;
}

export function detectChromeExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  const candidatePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium"
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

export class CDPReplayRunner {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private cdp: CDPSession | null = null;
  private currentCursor: Point2D = { x: 960, y: 540 }; // Center of 1920x1080
  private camera: CameraSpringController;
  private currentFrame = 0;
  private telemetryEvents: TelemetryEvent[] = [];

  constructor() {
    this.camera = new CameraSpringController({ x: 960, y: 540, zoom: 1.0 });
  }

  public async initialize(headless = true, customExecutablePath?: string): Promise<void> {
    const executablePath = customExecutablePath || detectChromeExecutablePath();

    this.browser = await puppeteer.launch({
      headless: headless ? true : false,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--force-color-profile=srgb",
        "--lang=en-US",
        "--window-size=1920,1080"
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2
      }
    });

    const pages = await this.browser.pages();
    this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();
    this.cdp = await this.page.createCDPSession();

    // Configure CDP emulation & auto-attach
    await this.cdp.send("Target.setAutoAttach", {
      autoAttach: true,
      waitForDebuggerOnStart: false,
      flatten: true
    });

    // Emulate time precision
    await this.cdp.send("Emulation.setTimezoneOverride", { timezoneId: "America/Los_Angeles" });
  }

  public async executeTrace(trace: StepTrace, options: ReplayOptions = {}): Promise<TelemetryStream> {
    if (!this.page || !this.cdp) {
      await this.initialize(options.headless ?? true, options.executablePath);
    }
    const page = this.page!;
    const cdp = this.cdp!;

    this.currentFrame = 0;
    this.telemetryEvents = [];

    for (const step of trace.steps) {
      await this.executeStep(step, options);
    }

    const stream: TelemetryStream = {
      traceId: trace.traceId,
      totalFrames: this.currentFrame,
      fps: 60,
      viewport: {
        width: trace.viewport.width,
        height: trace.viewport.height,
        scale: trace.viewport.deviceScaleFactor
      },
      events: this.telemetryEvents
    };

    return stream;
  }

  private async executeStep(step: TraceStep, options: ReplayOptions): Promise<void> {
    const page = this.page!;
    const cdp = this.cdp!;

    // 1. Navigation Action (80/20 Rule: Direct Deep-Links)
    if (step.action === "navigate" && step.targetUrl) {
      let resolvedUrl = step.targetUrl;
      if (options.urlMap) {
        for (const [from, to] of Object.entries(options.urlMap)) {
          if (resolvedUrl.startsWith(from)) {
            resolvedUrl = resolvedUrl.replace(from, to);
            break;
          }
        }
      }

      await page.goto(resolvedUrl, { waitUntil: "domcontentloaded" });
      await this.waitNetworkIdleCondition(2000);
      return;
    }

    // 2. Element Resolution via Triad Selectors
    if (!step.selector) return;
    const resolved = await TriadSelectorResolver.resolve(page, step.selector);

    if (resolved.methodUsed === "failed") {
      throw new Error(`[CDPReplay Fail-Closed] Failed to resolve selector for step ${step.id}: ${JSON.stringify(step.selector)}`);
    }

    // Direct camera spring focus toward target bounding box
    if (step.cameraFocus) {
      this.camera.setTarget({
        x: resolved.center.x,
        y: resolved.center.y,
        zoom: 1.15
      });
    }

    // 3. Minimum-Jerk Mouse Movement
    const trajectory = computeMinimumJerkTrajectory(this.currentCursor, resolved.center, {
      fps: 60,
      dwellTimeMs: step.dwellTimeMs ?? 150
    });

    for (const waypoint of trajectory) {
      this.currentFrame++;
      const cameraState = this.camera.step();

      // Dispatch physical mouse move via CDP
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: waypoint.x,
        y: waypoint.y
      });

      const event: TelemetryEvent = {
        frame: this.currentFrame,
        timestampMs: Math.round((this.currentFrame / 60) * 1000),
        stepId: step.id,
        action: step.action,
        cursor: {
          x: waypoint.x,
          y: waypoint.y,
          state: waypoint.state
        },
        targetElement: {
          role: step.selector.primary.role,
          name: step.selector.primary.name,
          testId: step.selector.secondary?.testId,
          bbox: resolved.bbox
        },
        cameraSpring: {
          targetX: resolved.center.x,
          targetY: resolved.center.y,
          currentX: cameraState.x,
          currentY: cameraState.y,
          zoom: cameraState.zoom
        },
        isRedacted: step.redactPii
      };

      this.telemetryEvents.push(event);
      if (options.onFrame) options.onFrame(event);
    }

    this.currentCursor = { x: resolved.center.x, y: resolved.center.y };

    // 4. Click Execution
    if (step.action === "click") {
      await cdp.send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        x: this.currentCursor.x,
        y: this.currentCursor.y,
        button: "left",
        clickCount: 1
      });

      // 50ms physical switch depress delay
      await new Promise(r => setTimeout(r, 50));

      await cdp.send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        x: this.currentCursor.x,
        y: this.currentCursor.y,
        button: "left",
        clickCount: 1
      });
    }

    // 5. Type Execution
    if (step.action === "type" && step.textValue) {
      // Focus element
      if (resolved.handle) {
        await resolved.handle.focus();
        // Clear existing value if necessary
        await page.keyboard.down("Meta");
        await page.keyboard.press("KeyA");
        await page.keyboard.up("Meta");
        await page.keyboard.press("Backspace");
      }

      for (const char of step.textValue) {
        await page.keyboard.type(char, { delay: 45 });
        this.currentFrame += 3;
        this.camera.step();
      }
    }

    // 6. Condition Gate (Never static sleep!)
    if (step.conditionGate) {
      await this.evaluateConditionGate(step.conditionGate);
    }
  }

  private async evaluateConditionGate(gate: any): Promise<void> {
    const page = this.page!;
    const timeoutMs = gate.timeoutMs ?? 5000;

    if (gate.type === "network_idle") {
      await this.waitNetworkIdleCondition(timeoutMs);
    } else if (gate.type === "selector_visible" && gate.selector) {
      await page.waitForSelector(gate.selector, { visible: true, timeout: timeoutMs });
    } else if (gate.type === "dom_mutation" && gate.targetSelector) {
      await page.waitForFunction((selector) => {
        const el = document.querySelector(selector);
        return el && el.children.length > 0;
      }, { timeout: timeoutMs }, gate.targetSelector);
    }
  }

  private async waitNetworkIdleCondition(timeoutMs: number): Promise<void> {
    const page = this.page!;
    try {
      await page.waitForNetworkIdle({ idleTime: 200, timeout: timeoutMs });
    } catch {
      // Graceful condition settle
    }
  }

  public async close(): Promise<void> {
    if (this.cdp) {
      try { await this.cdp.detach(); } catch {}
      this.cdp = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
