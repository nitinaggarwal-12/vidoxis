import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export interface HookDefinition {
  id: string;
  description: string;
  command: string;
  fail_action?: "abort" | "warn" | "auto_resample" | "auto_inject" | "reject_delivery" | "alert_oncall";
  timeout_ms?: number;
  diagnostic_snapshot_on_fail?: boolean;
  failure_snapshot_path?: string;
  failure_dom_dump_path?: string;
  on_flake?: {
    trigger_agent: string;
    prompt: string;
  };
}

export interface HooksConfiguration {
  project_name: string;
  version: string;
  hooks: Record<string, HookDefinition[]>;
}

export interface HookExecutionResult {
  hookId: string;
  description: string;
  commandExecuted: string;
  passed: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export class TrainexHookRunner {
  private config: HooksConfiguration;
  private configPath: string;

  constructor(customConfigPath?: string) {
    this.configPath = customConfigPath || path.resolve(process.cwd(), "hooks.json");
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`[HookRunner] hooks.json not found at ${this.configPath}`);
    }
    const raw = fs.readFileSync(this.configPath, "utf-8");
    this.config = JSON.parse(raw);
  }

  public getAvailableLifecycles(): string[] {
    return Object.keys(this.config.hooks);
  }

  public async runLifecycle(
    lifecycleEvent: string,
    contextParams: Record<string, string> = {}
  ): Promise<{ passed: boolean; results: HookExecutionResult[] }> {
    const hooks = this.config.hooks[lifecycleEvent] || [];
    const results: HookExecutionResult[] = [];
    let overallPassed = true;

    for (const hook of hooks) {
      // Substitute placeholders in command
      let command = hook.command;
      for (const [key, val] of Object.entries(contextParams)) {
        command = command.replaceAll(`{${key}}`, val);
      }

      const start = Date.now();
      let passed = true;
      let exitCode = 0;
      let stdout = "";
      let stderr = "";

      try {
        stdout = execSync(command, {
          cwd: process.cwd(),
          encoding: "utf-8",
          timeout: hook.timeout_ms || 30000,
          stdio: ["ignore", "pipe", "pipe"]
        });
      } catch (err: any) {
        passed = false;
        exitCode = err.status || 1;
        stdout = err.stdout ? err.stdout.toString() : "";
        stderr = err.stderr ? err.stderr.toString() : String(err.message);
      }

      const durationMs = Date.now() - start;
      results.push({
        hookId: hook.id,
        description: hook.description,
        commandExecuted: command,
        passed,
        exitCode,
        stdout,
        stderr,
        durationMs
      });

      if (!passed && hook.fail_action !== "warn") {
        overallPassed = false;
        break;
      }
    }

    return { passed: overallPassed, results };
  }
}
