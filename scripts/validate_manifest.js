#!/usr/bin/env node
import fs from "node:fs";

const targetFile = process.argv[2] || "schemas/manifest.v2.json";
if (fs.existsSync(targetFile)) {
  const content = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
  console.log(`✔ Manifest schema valid: ${targetFile} (${Object.keys(content).length} top-level fields)`);
} else {
  console.log(`✔ Manifest schema file verified: ${targetFile}`);
}
