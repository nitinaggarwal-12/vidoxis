import { testContractValidation } from "./topology_contract.test.js";
import { testWhiteboardCompilation } from "./whiteboard_compiler.test.js";
import { testRehearsalMatrix } from "./rehearsal_matrix.test.js";
async function main() {
    console.log("======================================================================");
    console.log("             TRAINEX ENTERPRISE TEST & VERIFICATION HARNESS            ");
    console.log("======================================================================\n");
    const results = [];
    // Suite 1: Canonical Topology Contract
    const r1 = testContractValidation();
    results.push({ suite: "Canonical Topology Contract Validation", passed: r1 });
    console.log("");
    // Suite 2: Progressive Whiteboard Compiler & Layout Collisions
    const r2 = await testWhiteboardCompilation();
    results.push({ suite: "Progressive Whiteboard Engine (ElkJS + RoughJS)", passed: r2 });
    console.log("");
    // Suite 3: CDP Headless Rehearsal Matrix & Triad Selectors
    const r3 = await testRehearsalMatrix();
    results.push({ suite: "CDP Deterministic Replay & 3x Rehearsal Matrix", passed: r3 });
    console.log("");
    console.log("======================================================================");
    console.log("                           VERIFICATION REPORT                        ");
    console.log("======================================================================");
    let allPassed = true;
    for (const r of results) {
        const mark = r.passed ? "✔ PASS" : "❌ FAIL";
        console.log(`  ${mark.padEnd(8)} ${r.suite}`);
        if (!r.passed)
            allPassed = false;
    }
    console.log("======================================================================");
    if (!allPassed) {
        console.error("\n❌ Test harness detected one or more failures. Exiting with code 1.");
        process.exit(1);
    }
    else {
        console.log("\n🎉 ALL QUALITY GATES PASSED (3/3 SUITES VERIFIED).");
    }
}
main().catch(err => {
    console.error("Fatal test runner crash:", err);
    process.exit(1);
});
//# sourceMappingURL=run_all_tests.js.map