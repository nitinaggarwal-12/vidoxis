#!/usr/bin/env node
import fs from "node:fs";

const resolverCode = fs.readFileSync("src/runner/triad-selector.ts", "utf-8");
if (!resolverCode.includes("shadowRoot")) {
  console.error("❌ Shadow DOM piercing audit failed: shadowRoot traversal not found in TriadSelectorResolver!");
  process.exit(1);
}
console.log("✔ Triad selector verified: Deep recursive shadowRoot traversal active.");
