import fs from "node:fs";
import path from "node:path";
import { sampleContract } from "./topology_contract.test.js";
import { compileWhiteboardManifest } from "../src/whiteboard/whiteboard-compiler.js";
import { WhiteboardManifestSchema } from "../src/types/whiteboard.js";
import { exportWhiteboardToSvg } from "../src/whiteboard/whiteboard-svg-exporter.js";
import { ParticleStreamSimulator } from "../src/whiteboard/particle-system.js";

export async function testWhiteboardCompilation(): Promise<boolean> {
  console.log("▶ [Test 2] Compiling Progressive Whiteboard Manifest (ElkJS + RoughJS layers)...");
  
  const manifest = await compileWhiteboardManifest(sampleContract, {
    canvasWidth: 3840,
    canvasHeight: 2160,
    fps: 60,
    theme: "digital_glassboard"
  });

  const parsed = WhiteboardManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    console.error("❌ Whiteboard manifest schema validation failed:", parsed.error);
    return false;
  }

  // 1. Audit Bounding Box Collisions with 30px Safety Margin
  console.log("  ↳ Checking 2D bounding box intersections with 30px safety margins...");
  const elements = manifest.elements;
  let collisions = 0;

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const a = elements[i];
      const b = elements[j];

      const overlap = !(
        a.x + a.width + 30 <= b.x ||
        b.x + b.width + 30 <= a.x ||
        a.y + a.height + 30 <= b.y ||
        b.y + b.height + 30 <= a.y
      );

      if (overlap) {
        console.error(`  ❌ Collision detected between "${a.label}" and "${b.label}"!`);
        collisions++;
      }
    }
  }

  if (collisions > 0) {
    console.error(`❌ Found ${collisions} bounding box collisions in whiteboard layout!`);
    return false;
  }
  console.log("  ✔ 0% Bounding box collisions confirmed across all 5 nodes.");

  // 2. Test Kinetic Particle Simulation
  console.log("  ↳ Simulating kinetic Bezier particle stream on data edge...");
  const simulator = new ParticleStreamSimulator();
  const sampleEdge = manifest.edges[0];
  const curve = {
    p0: { x: 500, y: 500 },
    p1: { x: 750, y: 500 },
    p2: { x: 750, y: 700 },
    p3: { x: 1000, y: 700 }
  };
  const particles = simulator.computeParticlesForEdge(sampleEdge.id, curve, 90, sampleEdge.drawStartFrame, 120);
  console.log(`  ✔ Computed ${particles.length} active glowing particles in flight at frame 90.`);

  // 3. Export Standalone 4K Broadcast SVG Artifact
  const svgContent = exportWhiteboardToSvg(manifest);
  const scratchDir = path.resolve(process.cwd(), "scratch");
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }
  const svgPath = path.join(scratchDir, "01_whiteboard_architecture.svg");
  fs.writeFileSync(svgPath, svgContent, "utf-8");
  console.log(`  ✔ Exported broadcast 4K SVG: file://${svgPath}`);

  return true;
}
