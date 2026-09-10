import fs from "node:fs";
import path from "node:path";
import { startMockServer } from "../src/mock-server/server.js";
import { runRehearsalMatrix } from "../src/runner/rehearsal-runner.js";
export async function testRehearsalMatrix() {
    console.log("▶ [Test 3] Executing Headless Rehearsal Matrix (3 consecutive runs, 0% flake gate)...");
    let mockServer = null;
    try {
        mockServer = await startMockServer({ port: 8099 });
        console.log(`  ↳ Local Mock Google Cloud Console active at ${mockServer.baseUrl}`);
        const sampleTrace = {
            traceId: "trace_vertex_deploy_01",
            topicId: "vertex_gemini_private_endpoint",
            version: "2.0.0",
            targetConsole: "gcp",
            viewport: { width: 1920, height: 1080, deviceScaleFactor: 2 },
            steps: [
                {
                    id: "step_01_nav",
                    index: 1,
                    act: "act3_live_console",
                    intent: "Navigate to Vertex AI Model Garden deep link",
                    action: "navigate",
                    targetUrl: "https://console.cloud.google.com/vertex-ai/models?project=trainex-sandbox-8f2a",
                    dwellTimeMs: 150,
                    redactPii: false,
                    cameraFocus: false
                },
                {
                    id: "step_02_open_drawer",
                    index: 2,
                    act: "act3_live_console",
                    intent: "Click Deploy Model button to open deployment drawer",
                    action: "click",
                    selector: {
                        primary: { role: "button", name: "Deploy Model", exact: true },
                        secondary: { testId: "mg-deploy-btn" },
                        fallback: { bbox: [120, 800, 160, 920] }
                    },
                    dwellTimeMs: 150,
                    redactPii: false,
                    cameraFocus: true
                },
                {
                    id: "step_03_type_name",
                    index: 3,
                    act: "act3_live_console",
                    intent: "Specify endpoint display name",
                    action: "type",
                    selector: {
                        primary: { role: "textbox", name: "Endpoint name", exact: true },
                        secondary: { testId: "input-endpoint-name" },
                        fallback: { bbox: [200, 650, 240, 950] }
                    },
                    textValue: "gemini-2-flash-prod",
                    dwellTimeMs: 150,
                    redactPii: false,
                    cameraFocus: true
                },
                {
                    id: "step_04_submit_deploy",
                    index: 4,
                    act: "act3_live_console",
                    intent: "Click Confirm and Deploy button",
                    action: "click",
                    selector: {
                        primary: { role: "button", name: "Confirm and Deploy", exact: true },
                        secondary: { testId: "btn-confirm-deploy" },
                        fallback: { bbox: [500, 650, 540, 750] }
                    },
                    dwellTimeMs: 150,
                    conditionGate: {
                        type: "dom_mutation",
                        targetSelector: "#endpoints-table-body",
                        timeoutMs: 5000
                    },
                    redactPii: false,
                    cameraFocus: true
                }
            ]
        };
        const urlMap = {
            "https://console.cloud.google.com": mockServer.baseUrl
        };
        const result = await runRehearsalMatrix(sampleTrace, 3, {
            headless: true,
            urlMap
        });
        if (!result.passed) {
            console.error(`❌ Rehearsal failed at step ${result.failedStepId}: ${result.failureReason}`);
            return false;
        }
        console.log(`  ✔ Rehearsal matrix completed: ${result.successfulRuns}/${result.totalRuns} runs passed cleanly!`);
        console.log(`  ✔ Average run duration: ${result.averageRunDurationMs}ms (Total frames: ${result.totalFrames})`);
        // Save Telemetry Stream Artifact
        const scratchDir = path.resolve(process.cwd(), "scratch");
        const telemetryPath = path.join(scratchDir, "02_telemetry_stream.json");
        fs.writeFileSync(telemetryPath, JSON.stringify(result.telemetryStreams[0], null, 2), "utf-8");
        console.log(`  ✔ Exported telemetry stream: file://${telemetryPath}`);
        return true;
    }
    catch (err) {
        console.error("❌ Exception during rehearsal matrix:", err);
        return false;
    }
    finally {
        if (mockServer) {
            await mockServer.close();
            console.log("  ↳ Local Mock Google Cloud Console shut down cleanly.");
        }
    }
}
//# sourceMappingURL=rehearsal_matrix.test.js.map