import { CDPReplayRunner, ReplayOptions } from "./cdp-replayer.js";
import { StepTrace } from "../types/trace.js";
import { TelemetryStream } from "../types/telemetry.js";

export interface RehearsalResult {
  passed: boolean;
  totalRuns: number;
  successfulRuns: number;
  failedStepId?: string;
  failureReason?: string;
  telemetryStreams: TelemetryStream[];
  totalFrames: number;
  averageRunDurationMs: number;
}

export async function runRehearsalMatrix(
  trace: StepTrace,
  runs = 3,
  options: ReplayOptions = {}
): Promise<RehearsalResult> {
  const telemetryStreams: TelemetryStream[] = [];
  const startTotal = Date.now();

  for (let r = 1; r <= runs; r++) {
    const runner = new CDPReplayRunner();
    try {
      await runner.initialize(options.headless ?? true);
      const stream = await runner.executeTrace(trace, options);
      telemetryStreams.push(stream);
    } catch (err: any) {
      await runner.close();
      return {
        passed: false,
        totalRuns: runs,
        successfulRuns: r - 1,
        failureReason: err.message || String(err),
        telemetryStreams,
        totalFrames: 0,
        averageRunDurationMs: 0
      };
    } finally {
      await runner.close();
    }
  }

  const totalDuration = Date.now() - startTotal;
  const totalFrames = telemetryStreams.reduce((acc, s) => acc + s.totalFrames, 0);

  return {
    passed: true,
    totalRuns: runs,
    successfulRuns: runs,
    telemetryStreams,
    totalFrames,
    averageRunDurationMs: Math.round(totalDuration / runs)
  };
}
