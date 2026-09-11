#!/usr/bin/env node
const args = process.argv.slice(2);
let project = "";
for (const a of args) {
  if (a.startsWith("--project=")) project = a.split("=")[1];
}
if (!project) {
  console.log("No project passed, defaulting to trainex-sandbox-8f2a");
  project = "trainex-sandbox-8f2a";
}
const sandboxRegex = /^(?:vidoxis-sandbox-[a-z0-9]+|trainex-sandbox-[a-z0-9]+|ephemeral-[a-z0-9]+|sandbox-[a-z0-9]+)$/;
if (!sandboxRegex.test(project)) {
  console.error(`[Sandbox Firewall VIOLATION] Project "${project}" is not an authorized ephemeral sandbox!`);
  process.exit(1);
}
console.log(`✔ Sandbox project verified: ${project}`);
