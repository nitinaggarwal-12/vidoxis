#!/usr/bin/env node
const args = process.argv.slice(2);
let driver = "gcp";
for (const a of args) {
  if (a.startsWith("--driver=")) driver = a.split("=")[1];
}
const supported = ["gcp", "aws", "azure"];
if (!supported.includes(driver.toLowerCase())) {
  console.error(`[Driver Violation] Driver "${driver}" not supported. Expected: ${supported.join(", ")}`);
  process.exit(1);
}
console.log(`✔ Target console driver verified: ${driver}`);
