import { testContractValidation } from "./topology_contract.test.js";
import { testWhiteboardCompilation } from "./whiteboard_compiler.test.js";
import { testRehearsalMatrix } from "./rehearsal_matrix.test.js";
import { testHookExecutionEngine } from "./hooks_execution.test.js";

async function main() {
  console.log("======================================================================");
  console.log("             VIDOXIS ENTERPRISE TEST & VERIFICATION HARNESS            ");
  console.log("======================================================================\n");

  const results: { suite: string; passed: boolean }[] = [];

  // Suite 1: Canonical Topology Contract
  const r1 = testContractValidation();
  results.push({ suite: "Canonical Topology Contract Validation", passed: r1 });
  console.log("");

  // Suite 2: Progressive Whiteboard Engine (ElkJS + RoughJS)
  const r2 = await testWhiteboardCompilation();
  results.push({ suite: "Progressive Whiteboard Engine (ElkJS + RoughJS)", passed: r2 });
  console.log("");

  // Suite 3: CDP Headless Rehearsal Matrix & Triad Selectors
  const r3 = await testRehearsalMatrix();
  results.push({ suite: "CDP Deterministic Replay & 3x Rehearsal Matrix", passed: r3 });
  console.log("");

  // Suite 4: Vidoxis Hook Execution Engine (All 13 Lifecycles & 39 Hooks)
  const r4 = await testHookExecutionEngine();
  results.push({ suite: "Vidoxis Lifecycle Hooks & Quality Guard Engine (39 Hooks)", passed: r4 });
  console.log("");

  console.log("======================================================================");
  console.log("                           VERIFICATION REPORT                        ");
  console.log("======================================================================");
  let allPassed = true;
  for (const r of results) {
    const mark = r.passed ? "✔ PASS" : "❌ FAIL";
    console.log(`  ${mark.padEnd(8)} ${r.suite}`);
    if (!r.passed) allPassed = false;
  }
  console.log("======================================================================");

  if (!allPassed) {
    console.error("\n❌ Test harness detected one or more failures. Exiting with code 1.");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL QUALITY GATES PASSED (4/4 SUITES VERIFIED).");
  }
}

main().catch(err => {
  console.error("Fatal test runner crash:", err);
  process.exit(1);
});
