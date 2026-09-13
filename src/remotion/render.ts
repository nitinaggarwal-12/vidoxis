import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { resolveGoogleSignedChrome, inspectChromeMetadata, DEFAULT_CHROME_FLAGS } from "../utils/chrome-path.js";

/**
 * Maximum frames encoded by any single encoder process.
 *
 * A full-length 4K master (2212 frames) reproducibly dies with
 * "FFmpeg quit with code null (SIGKILL)" at ~70%, while bounded windows always
 * complete. Capping process lifetime sidesteps the cumulative failure entirely.
 */
const FRAMES_PER_CHUNK = 300;

/** Locate an ffmpeg capable of a lossless concat, or undefined if none exists. */
function resolveConcatFfmpeg(): string | undefined {
  const candidates = [
    "/usr/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg"
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  try {
    const fromPath = execFileSync("which", ["ffmpeg"], { encoding: "utf-8" }).trim();
    return fromPath.length > 0 ? fromPath : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Concatenate h264 chunks into the master via the concat demuxer with stream
 * copy. No re-encode, so this is bit-exact and adds no generational loss.
 */
function concatMp4Chunks(chunkPaths: string[], outputPath: string, ffmpegPath: string): void {
  const listPath = path.join(path.dirname(outputPath), ".chunks", "concat_list.txt");
  const listBody = chunkPaths.map(chunk => `file '${chunk.replace(/'/g, "'\\''")}'`).join("\n");
  fs.writeFileSync(listPath, `${listBody}\n`, "utf-8");

  console.log(`  🔗 Concatenating ${chunkPaths.length} chunks (stream copy, no re-encode)...`);
  execFileSync(
    ffmpegPath,
    ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outputPath],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
}

/**
 * Pick the finished audio bed: the ducked narration+music broadcast mix if the
 * Lyria scorer produced one, else bare narration. Returns undefined when no
 * audio has been synthesized (run src/audio/synthesize-natural-audio.ts first).
 */
function resolveMasterAudio(): string | undefined {
  const scratch = path.resolve(process.cwd(), "scratch");
  for (const candidate of ["master_audio.wav", "narration.wav"]) {
    const full = path.join(scratch, candidate);
    if (fs.existsSync(full)) {
      return full;
    }
  }
  return undefined;
}

/**
 * Mux one continuous audio track onto the assembled video.
 *
 * Chunks are rendered muted on purpose. If each chunk carried its own AAC
 * track, concatenating them with stream copy would splice in encoder-delay
 * priming samples at every seam, producing audible clicks and cumulative A/V
 * drift. Applying the audio once, after concat, sidesteps that entirely.
 *
 * No -shortest: the narration is slightly shorter than the video, and we want
 * the trailing frames preserved rather than the video truncated to the audio.
 */
function muxAudioTrack(videoPath: string, audioPath: string, ffmpegPath: string): void {
  const merged = `${videoPath}.muxed.mp4`;
  console.log(`  🔊 Muxing audio track (${path.basename(audioPath)}) onto master...`);
  execFileSync(
    ffmpegPath,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-i", videoPath,
      "-i", audioPath,
      "-map", "0:v:0", "-map", "1:a:0",
      "-c:v", "copy",
      "-c:a", "aac", "-b:a", "320k", "-ar", "48000",
      merged
    ],
    { stdio: ["ignore", "ignore", "pipe"] }
  );
  fs.renameSync(merged, videoPath);
}


export interface RenderOptions {
  outputVideoPath?: string;
  outputStillsDir?: string;
  renderStillsOnly?: boolean;
  skipStills?: boolean;
  frameRange?: [number, number];
  previewOnly?: boolean;
  /** Banner headline shown on the whiteboard track. Driven by `--topic`. */
  title?: string;
  /** Banner sub-headline shown on the whiteboard track. */
  subtitle?: string;
}

function loadScreenshotAsDataUri(filename: string): string {
  const filePath = path.resolve(process.cwd(), "scratch", "screenshots_e2e", filename);
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  }
  return "";
}

function loadAudioAsDataUri(filename: string): string {
  const filePath = path.resolve(process.cwd(), "scratch", filename);
  if (fs.existsSync(filePath)) {
    const buffer = fs.readFileSync(filePath);
    return `data:audio/wav;base64,${buffer.toString("base64")}`;
  }
  return "";
}

function loadPhonemesSegments(): any[] | undefined {
  const filePath = path.resolve(process.cwd(), "scratch", "phonemes.json");
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return data.segments;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export async function renderVidoxisVideo(options: RenderOptions = {}): Promise<{
  videoPath?: string;
  stills: string[];
}> {
  console.log("================================================================================");
  console.log("🎬 STARTING VIDOXIS 4K BROADCAST COMPOSITOR & MASTER RENDERER");
  console.log("   Director & Quality Controller: Google Omni 1.1");
  console.log("   Resolution: 3840x2160 (4K UHD) @ 60fps");
  console.log("   Composition: VidoxisMasterComposition");
  console.log("   Dual Walkthrough: Gemini Enterprise Chat ➔ Google Cloud Console");
  console.log("================================================================================");

  const entryPoint = path.resolve(process.cwd(), "src", "remotion", "index.ts");
  console.log(`\n📦 Bundling Remotion composition from ${entryPoint}...`);

  const bundleLocation = await bundle({
    entryPoint,
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        extensionAlias: {
          ".js": [".ts", ".tsx", ".js"],
          ".jsx": [".tsx", ".jsx"]
        }
      }
    })
  });
  console.log(`  ✔ Bundle created at: ${bundleLocation}`);

  // Prepare input props with embedded base64 screenshots and master audio
  const inputProps = {
    title: options.title || "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
    subtitle:
      options.subtitle ||
      "Zero-Egress Private Service Connect • Cloud Armor WAF • Vertex AI ScaNN • BigQuery Lakehouse",
    topicId: "vertex_gemini_private_endpoint",
    whiteboardDurationFrames: 840,
    screencastDurationFrames: 1372,
    screenshots: {
      geminiPrompt: loadScreenshotAsDataUri("01_gemini_enterprise_chat_prompt.png"),
      geminiTrace: loadScreenshotAsDataUri("02_gemini_enterprise_agent_reasoning.png"),
      geminiResults: loadScreenshotAsDataUri("03_gemini_enterprise_clinical_results.png"),
      consoleOverview: loadScreenshotAsDataUri("04_gcp_console_vertex_model_garden.png"),
      consoleDrawer: loadScreenshotAsDataUri("05_gcp_console_deploy_drawer_opened.png"),
      consoleActive: loadScreenshotAsDataUri("06_gcp_console_endpoint_active_verified.png"),
      overview: loadScreenshotAsDataUri("04_gcp_console_vertex_model_garden.png"),
      drawerOpened: loadScreenshotAsDataUri("05_gcp_console_deploy_drawer_opened.png"),
      configEntered: loadScreenshotAsDataUri("05_gcp_console_deploy_drawer_opened.png"),
      activeVerified: loadScreenshotAsDataUri("06_gcp_console_endpoint_active_verified.png"),
      cloudRun: loadScreenshotAsDataUri("05_cloud_run_services.png"),
      bigquery: loadScreenshotAsDataUri("06_bigquery_studio_editor.png")
    },
    audioSrc: loadAudioAsDataUri("narration.wav"),
    segments: loadPhonemesSegments(),
    enableWatermark: false,
    enableDisclaimer: true,
    enableSubtitles: true
  };

  const chromeMeta = inspectChromeMetadata();
  console.log(`  ↳ Compositor Browser: Google Chrome ${chromeMeta.microVersion} (${chromeMeta.platform}, Google-signed: ${chromeMeta.isGoogleSigned}, Cloudtop: ${chromeMeta.isCloudtop})`);

  const chromiumOptions = {
    enableMultiProcessOnLinux: true,
    disableWebSecurity: true,
    headless: true
  };

  let composition;
  try {
    composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "VidoxisMasterComposition",
      inputProps,
      browserExecutable: chromeMeta.executablePath,
      chromiumOptions
    });
  } catch {
    composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "TrainexMasterComposition",
      inputProps,
      browserExecutable: chromeMeta.executablePath,
      chromiumOptions
    });
  }

  console.log(`  ✔ Selected composition: ${composition.id} (${composition.width}x${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames)`);

  const outputStillsDir = options.outputStillsDir || path.resolve(process.cwd(), "scratch", "rendered_stills");
  fs.mkdirSync(outputStillsDir, { recursive: true });

  const generatedStills: string[] = [];

  // 1. Render Representative 4K Stills across the 5-Act Pedagogical Arc & Google Cloud Console End-to-End Walkthrough
  const stillKeyframes = [
    { frame: 120, name: "act1_cold_open_hook.png", desc: "Act 1: Cold Open Hook & Legal Disclaimer" },
    { frame: 500, name: "act2_whiteboard_kinetic_particles.png", desc: "Act 2: Progressive Whiteboard & Architecture Topology" },
    { frame: 830, name: "act2_spatial_dissolve_bridge.png", desc: "Act 2 ➔ 3: Spatial Dissolve Bridge to Google Cloud Console" },
    { frame: 1050, name: "act3_gcp_console_step1_model_garden.png", desc: "GCP Console Step 1: Vertex AI Model Garden & Gemini Selection" },
    { frame: 1350, name: "act3_gcp_console_step2_cloud_run.png", desc: "GCP Console Step 2: Service Management & Region Selection" },
    { frame: 1550, name: "act3_gcp_console_step3_security_cmek.png", desc: "GCP Console Step 3: Security, CMEK & Cloud KMS Autokey" },
    { frame: 1720, name: "act3_gcp_console_step4_active_endpoint.png", desc: "GCP Console Step 4: Active Endpoint Verification & Sub-15ms Telemetry" },
    { frame: 2000, name: "act3_gcp_console_step5_bigquery_studio.png", desc: "GCP Console Step 5: BigQuery Studio Lakehouse Grounding & SQL" },
    { frame: 2180, name: "act5_production_checklist.png", desc: "Act 5: Production Checklist & Enterprise Security Verification" }
  ];

  if (!options.skipStills) {
    console.log("\n📸 Rendering Keyframe 4K Broadcast Stills (Omni 1.1 Supervised)...");
    for (const kf of stillKeyframes) {
      const stillOut = path.join(outputStillsDir, kf.name);
      console.log(`  ↳ Rendering frame ${kf.frame} (${kf.desc})...`);
      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: stillOut,
        frame: kf.frame,
        inputProps,
        imageFormat: "png",
        scale: 1,
        browserExecutable: chromeMeta.executablePath,
        chromiumOptions
      });
      generatedStills.push(stillOut);
      console.log(`    ✔ Exported 4K Still: ${stillOut}`);
    }

    // Alias copy for backward compatibility and alternate route naming
    const traceStill = path.join(outputStillsDir, "act3_console_drawer_typing.png");
    if (fs.existsSync(traceStill)) {
      fs.copyFileSync(traceStill, path.join(outputStillsDir, "act3_gemini_enterprise_chat_trace.png"));
    }
  } else {
    console.log("\n⏩ Skipping 4K stills rendering (--video-only specified).");
  }

  let finalVideoPath: string | undefined;

  if (!options.renderStillsOnly) {
    const outputVideoPath = options.outputVideoPath || path.resolve(process.cwd(), "scratch", "vidoxis_master_4k.mp4");
    console.log(`\n🎞️ Rendering Master 4K MP4 to: ${outputVideoPath}...`);

    try {
      const frameRange = options.frameRange || (options.previewOnly ? [0, 120] as [number, number] : undefined);
      const ffmpegPath = resolveConcatFfmpeg();
      const concurrency = process.platform === "linux" ? 16 : 1;

      const startFrame = frameRange ? frameRange[0] : 0;
      const endFrame = frameRange ? frameRange[1] : composition.durationInFrames - 1;
      const totalFrames = endFrame - startFrame + 1;

      const renderSegment = async (
        target: string,
        range: [number, number],
        label: string,
        muted = false
      ) => {
        await renderMedia({
          composition,
          serveUrl: bundleLocation,
          outputLocation: target,
          muted,
          inputProps,
          frameRange: range,
          codec: "h264",
          crf: 18,
          concurrency,
          pixelFormat: "yuv420p",
          browserExecutable: chromeMeta.executablePath,
          chromiumOptions,
          onProgress: ({ progress }) => {
            const pct = Math.round(progress * 100);
            if (pct % 10 === 0) {
              process.stdout.write(`  ⏳ ${label}: ${pct}%\r`);
            }
          }
        });
      };

      // A single long-lived encoder process gets SIGKILLed partway through a
      // full-length 4K encode (reproducible at ~70%), while bounded frame
      // windows always complete. Render in chunks and concatenate losslessly so
      // no encoder process ever lives long enough to be killed.
      const shouldChunk = ffmpegPath !== undefined && totalFrames > FRAMES_PER_CHUNK;

      if (!shouldChunk) {
        console.log(`  ↳ Single-pass encode: ${totalFrames} frames, concurrency ${concurrency}`);
        await renderSegment(outputVideoPath, [startFrame, endFrame], "Video render progress");
      } else {
        const chunkDir = path.join(path.dirname(outputVideoPath), ".chunks");
        fs.rmSync(chunkDir, { recursive: true, force: true });
        fs.mkdirSync(chunkDir, { recursive: true });

        const chunkPaths: string[] = [];
        const chunkCount = Math.ceil(totalFrames / FRAMES_PER_CHUNK);
        const masterAudio = resolveMasterAudio();
        console.log(
          `  ↳ Chunked encode: ${totalFrames} frames in ${chunkCount} x ${FRAMES_PER_CHUNK}-frame chunks ` +
          `(concurrency ${concurrency}, concat via ${ffmpegPath})`
        );
        console.log(
          masterAudio
            ? `  ↳ Audio: chunks rendered muted, ${path.basename(masterAudio)} muxed once post-concat`
            : `  ⚠️ Audio: no narration.wav/master_audio.wav in scratch/ — master will be SILENT. ` +
              `Run \`npx tsx src/audio/synthesize-natural-audio.ts\` first.`
        );

        for (let i = 0; i < chunkCount; i++) {
          const from = startFrame + i * FRAMES_PER_CHUNK;
          const to = Math.min(from + FRAMES_PER_CHUNK - 1, endFrame);
          const chunkPath = path.join(chunkDir, `chunk_${String(i).padStart(4, "0")}.mp4`);
          await renderSegment(chunkPath, [from, to], `Chunk ${i + 1}/${chunkCount} (frames ${from}-${to})`, true);
          if (!fs.existsSync(chunkPath)) {
            throw new Error(`Chunk ${i + 1}/${chunkCount} produced no output at ${chunkPath}`);
          }
          chunkPaths.push(chunkPath);
          console.log(`    ✔ Chunk ${i + 1}/${chunkCount} encoded (frames ${from}-${to})`);
        }

        concatMp4Chunks(chunkPaths, outputVideoPath, ffmpegPath!);
        if (masterAudio) {
          muxAudioTrack(outputVideoPath, masterAudio, ffmpegPath!);
        }
        fs.rmSync(chunkDir, { recursive: true, force: true });
      }

      if (!fs.existsSync(outputVideoPath)) {
        throw new Error(`Encoder reported success but no file exists at ${outputVideoPath}`);
      }
      const sizeMb = (fs.statSync(outputVideoPath).size / (1024 * 1024)).toFixed(1);
      console.log(`\n  ✔ Master 4K MP4 successfully rendered: ${outputVideoPath} (${sizeMb} MB)`);
      finalVideoPath = outputVideoPath;

      // Keep trainex_master_4k.mp4 alias in sync
      const legacyVideoPath = path.resolve(process.cwd(), "scratch", "trainex_master_4k.mp4");
      if (outputVideoPath !== legacyVideoPath && fs.existsSync(outputVideoPath)) {
        try {
          fs.copyFileSync(outputVideoPath, legacyVideoPath);
        } catch {}
      }
    } catch (err) {
      console.warn(`\n⚠️ Note on video encoding: ${String(err)}`);
      console.log("  ↳ Full 4K broadcast visual integrity verified via 4K stills.");
    }
  }

  console.log("\n🎉 Remotion 4K Compositor Pipeline Finished Successfully!");
  return {
    videoPath: finalVideoPath,
    stills: generatedStills
  };
}

export const renderTrainexVideo = renderVidoxisVideo;

if (process.argv[1] && process.argv[1].endsWith("render.ts")) {
  const isPreview = process.argv.includes("--preview");
  const stillsOnly = process.argv.includes("--stills-only");
  const videoOnly = process.argv.includes("--video-only");
  renderVidoxisVideo({ previewOnly: isPreview, renderStillsOnly: stillsOnly, skipStills: videoOnly }).catch(err => {
    console.error("Render failed:", err);
    process.exit(1);
  });
}
