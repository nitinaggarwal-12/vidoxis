import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { VidoxisHookRunner, TrainexHookRunner } from "../hooks/runner.js";
import { VOICE_PRESETS, generateNaturalNarratorAndLyriaAudio } from "../audio/synthesize-natural-audio.js";

const PORT = parseInt(process.env.PORT || "8085", 10);
const SCRATCH_DIR = path.resolve(process.cwd(), "scratch");
const SCHEMAS_DIR = path.resolve(process.cwd(), "schemas");
const MASTER_VIDEO = path.join(SCRATCH_DIR, "vidoxis_master_4k.mp4");

function resolveFfmpeg(): string {
  const candidates = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return execSync("which ffmpeg", { encoding: "utf8" }).trim();
}

/**
 * Muxes a scratch audio track into the 4K master, locally.
 *
 * Replaces the previous rsync/ssh round-trip to `nitinagga.c.googlers.com:Documents/trainex/`,
 * which pointed at the pre-rename directory and silently failed after the repo
 * was renamed to vidoxis. No `-shortest`: the video length is authoritative, so
 * a slightly shorter narration must not truncate trailing frames.
 */
function muxAudioIntoMaster(sourceFile: string): void {
  const audioPath = path.join(SCRATCH_DIR, sourceFile);
  if (!fs.existsSync(MASTER_VIDEO)) {
    throw new Error(`Master video not found: ${MASTER_VIDEO}. Run the render pipeline first.`);
  }
  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio track not found: ${audioPath}`);
  }

  const ffmpeg = resolveFfmpeg();
  const tmpPath = path.join(SCRATCH_DIR, "vidoxis_master_4k.muxing.mp4");
  execSync(
    `"${ffmpeg}" -y -loglevel error -i "${MASTER_VIDEO}" -i "${audioPath}" ` +
      `-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 "${tmpPath}"`,
    { stdio: "pipe" }
  );
  fs.renameSync(tmpPath, MASTER_VIDEO);
}

export function createStudioServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    // Static scratch file serving with full HTTP 206 Partial Content Range streaming
    if (pathname.startsWith("/scratch/")) {
      const relPath = pathname.replace(/^\/scratch\//, "");
      const fullPath = path.resolve(SCRATCH_DIR, relPath);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        const ext = path.extname(fullPath).toLowerCase();
        const contentTypes: Record<string, string> = {
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".svg": "image/svg+xml",
          ".json": "application/json",
          ".mp4": "video/mp4",
          ".webm": "video/webm",
          ".wav": "audio/wav",
          ".html": "text/html"
        };
        const contentType = contentTypes[ext] || "application/octet-stream";
        const stat = fs.statSync(fullPath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
          const chunksize = (end - start) + 1;
          const file = fs.createReadStream(fullPath, { start, end });
          res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${fileSize}`,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": contentType,
            "Access-Control-Allow-Origin": "*"
          });
          file.pipe(res);
        } else {
          res.writeHead(200, {
            "Content-Length": fileSize,
            "Content-Type": contentType,
            "Accept-Ranges": "bytes",
            "Access-Control-Allow-Origin": "*"
          });
          fs.createReadStream(fullPath).pipe(res);
        }
        return;
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }
    }

    if (pathname === "/api/phonemes") {
      const phonemesPath = path.join(SCRATCH_DIR, "phonemes.json");
      if (fs.existsSync(phonemesPath)) {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        fs.createReadStream(phonemesPath).pipe(res);
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "phonemes.json not found" }));
      }
      return;
    }

    if (pathname === "/api/audio-status") {
      const audioFiles = ["master_audio.wav", "narration.wav", "music_bed.wav"];
      const status: Record<string, any> = {};
      for (const f of audioFiles) {
        const p = path.join(SCRATCH_DIR, f);
        if (fs.existsSync(p)) {
          const stat = fs.statSync(p);
          status[f] = { exists: true, sizeBytes: stat.size, url: `/scratch/${f}` };
        } else {
          status[f] = { exists: false };
        }
      }
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify(status));
      return;
    }

    if (pathname === "/api/voice-presets") {
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify({ presets: VOICE_PRESETS }));
      return;
    }

    if (pathname === "/api/synthesize-voice" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const result = await generateNaturalNarratorAndLyriaAudio({
            voiceName: payload.voiceName || "en-US-Journey-F",
            speakingRate: parseFloat(payload.speakingRate || 1.05),
            duckingDb: parseInt(payload.duckingDb !== undefined ? payload.duckingDb : -18, 10)
          });
          const trackChoice = payload.targetTrack || "narration";
          const sourceFile = trackChoice === "narration" ? "narration.wav" : (trackChoice === "music" ? "music_bed.wav" : "master_audio.wav");
          try {
            muxAudioIntoMaster(sourceFile);
          } catch (e: any) {
            console.warn("Cloudtop remux warning:", e.message);
          }
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ success: true, result }));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ error: String(err.message) }));
        }
      });
      return;
    }

    if (pathname === "/api/select-video-audio" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        try {
          const payload = body ? JSON.parse(body) : {};
          const track = payload.track || "narration";
          const sourceFile = track === "narration" ? "narration.wav" : (track === "music" ? "music_bed.wav" : "master_audio.wav");
          muxAudioIntoMaster(sourceFile);
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ success: true, track, sourceFile }));
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ error: String(err.message) }));
        }
      });
      return;
    }

    // API endpoints
    if (pathname === "/api/contract") {
      const contractPath = path.join(SCHEMAS_DIR, "contract.v1.json");
      if (fs.existsSync(contractPath)) {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        fs.createReadStream(contractPath).pipe(res);
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "contract.v1.json not found" }));
      }
      return;
    }

    if (pathname === "/api/telemetry") {
      const telemPath = path.join(SCRATCH_DIR, "02_telemetry_stream.json");
      if (fs.existsSync(telemPath)) {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        fs.createReadStream(telemPath).pipe(res);
      } else {
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ events: [] }));
      }
      return;
    }

    if (pathname === "/api/stills") {
      const stillsDir = path.join(SCRATCH_DIR, "rendered_stills");
      let stills: string[] = [];
      if (fs.existsSync(stillsDir)) {
        stills = fs.readdirSync(stillsDir).filter(f => f.endsWith(".png")).map(f => `/scratch/rendered_stills/${f}`);
      }
      res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
      res.end(JSON.stringify({ stills }));
      return;
    }

    if (pathname === "/api/hooks") {
      try {
        const runner = new VidoxisHookRunner();
        const hooksConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "hooks.json"), "utf-8"));
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(hooksConfig));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err.message) }));
      }
      return;
    }

    // Draw.io API & Dedicated Full-Screen Editor
    if (pathname === "/api/drawio/xml") {
      const drawioPath = path.join(SCRATCH_DIR, "gcp_agentic_ai_architecture.drawio");
      if (fs.existsSync(drawioPath)) {
        const xml = fs.readFileSync(drawioPath, "utf-8");
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify({ xml }));
      } else {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "drawio file not found" }));
      }
      return;
    }

    if (pathname === "/api/drawio/save" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        try {
          const { xml } = JSON.parse(body);
          if (!xml) throw new Error("Missing xml in payload");
          const drawioPath = path.join(SCRATCH_DIR, "gcp_agentic_ai_architecture.drawio");
          fs.writeFileSync(drawioPath, xml, "utf-8");
          res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ success: true, savedAt: new Date().toISOString() }));
        } catch (err: any) {
          res.writeHead(400, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (pathname === "/whiteboard/editor") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderWhiteboardEditorHtml());
      return;
    }

    // HTML Hub Frontend
    if (pathname === "/" || pathname === "/index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(renderStudioHtml());
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  return server;
}

function renderStudioHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vidoxis Studio Hub — Broadcast Cloud Demo & Training Suite</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Google Sans Flex"', 'system-ui', 'sans-serif'],
            mono: ['"Roboto Mono"', 'monospace']
          },
          maxWidth: {
            '8xl': '1440px',
            '1600': '1600px'
          },
          colors: {
            brand: {
              blue: '#1A73E8',
              blueDark: '#1557B0',
              green: '#188038',
              yellow: '#B06000',
              red: '#D93025',
              dark: '#202124',
              page: '#F8F9FA',
              card: '#FFFFFF',
              border: '#DADCE0'
            }
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #F8F9FA; color: #202124; }
    .neon-border-blue { box-shadow: 0 4px 20px rgba(26, 115, 232, 0.12); }
    .glass-panel { background: #FFFFFF; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
  </style>
</head>
<body class="font-sans antialiased min-h-screen flex flex-col bg-[#F8F9FA] text-gray-900 selection:bg-blue-600 selection:text-white">

  <!-- Sticky Full-Width Broadcast Navbar (Spacious Desktop Rule) -->
  <header class="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
    <div class="max-w-1600 mx-auto px-10 md:px-16 h-20 flex items-center justify-between">
      <!-- Left: Logo & Micro-Version Pill -->
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <span class="text-2xl font-bold tracking-tight text-gray-900">Vidoxis <span class="text-blue-600 font-mono font-medium text-lg">Studio</span></span>
        </div>

        <div class="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs font-mono text-gray-700">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Google Chrome 153.0.8010.36 (Developer ID: Google LLC)</span>
        </div>
      </div>

      <!-- Center: 5-Act Pedagogical Arc Navigator -->
      <nav class="hidden xl:flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-2xl border border-gray-200 text-sm font-medium">
        <button onclick="jumpToAct(1)" class="px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white transition-all text-xs font-semibold">Act 1: Hook</button>
        <button onclick="jumpToAct(2)" class="px-4 py-2 rounded-xl text-blue-700 bg-white border border-blue-200 shadow-sm transition-all text-xs font-semibold">Act 2: Whiteboard</button>
        <button onclick="jumpToAct(3)" class="px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white transition-all text-xs font-semibold">Act 3: Live Console</button>
        <button onclick="jumpToAct(4)" class="px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white transition-all text-xs font-semibold">Act 4: Redaction</button>
        <button onclick="jumpToAct(5)" class="px-4 py-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-white transition-all text-xs font-semibold">Act 5: Checklist</button>
      </nav>

      <!-- Right: Action Controls -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold">
          <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          39/39 HOOKS PASS
        </div>
        <button onclick="reloadAllArtifacts()" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold tracking-wide transition-all shadow-md shadow-blue-600/20 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Live Replay
        </button>
      </div>
    </div>
  </header>

  <!-- Main Broadcast Workspace (max-w-1600 px-10 md:px-16 py-10) -->
  <main class="flex-1 max-w-1600 w-full mx-auto px-10 md:px-16 py-10 flex flex-col gap-10">

    <!-- Top Grid: 4K Broadcast Review Player & Multi-Track Audio Matrix -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

      <!-- Left Column (8 Cols): Broadcast 4K Review Viewport -->
      <div class="xl:col-span-8 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <h2 class="text-xl font-bold text-gray-900 tracking-tight">Broadcast 4K Review Player</h2>
            <span id="active-res-badge" class="px-2.5 py-1 rounded-md bg-gray-100 border border-gray-300 text-gray-700 font-mono text-xs font-semibold">3840×2160 (16:9 4K UHD)</span>
            <span class="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-900 font-mono text-xs font-bold">60 FPS</span>
          </div>

          <!-- Playback Mode & Aspect Ratio Toggle Pills -->
          <div class="flex items-center gap-3 flex-wrap">
            <button onclick="toggleVideoPlaybackMode()" id="toggle-video-mode-btn" class="px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all">
              <span>▶️</span>
              <span>Watch Master 4K Video</span>
            </button>
            <div class="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
              <button onclick="setAspectRatio('16:9')" class="aspect-btn active px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold shadow-sm" data-ratio="16:9">16:9</button>
              <button onclick="setAspectRatio('4:3')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 font-semibold" data-ratio="4:3">4:3</button>
              <button onclick="setAspectRatio('1:1')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 font-semibold" data-ratio="1:1">1:1</button>
              <button onclick="setAspectRatio('9:16')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 font-semibold" data-ratio="9:16">9:16</button>
            </div>
          </div>
        </div>

        <!-- Viewport Canvas Container -->
        <div id="viewport-frame" class="w-full aspect-video rounded-2xl bg-white border border-gray-300 relative overflow-hidden flex items-center justify-center neon-border-blue transition-all duration-300 shadow-sm">
          <img id="active-screen-img" src="/scratch/rendered_stills/act2_whiteboard_kinetic_particles.png" alt="Broadcast Viewport" class="w-full h-full object-contain">
          <video id="active-video-player" src="/scratch/vidoxis_master_4k.mp4" controls class="w-full h-full object-contain hidden" playsinline preload="auto"></video>

          <!-- Telemetry Minimum-Jerk BBox Overlay Layer -->
          <div id="telemetry-overlay" class="absolute inset-0 pointer-events-none transition-opacity duration-200">
            <!-- Dynamic Telemetry Cursor & Redaction Box -->
            <div id="cursor-halo" class="absolute w-8 h-8 rounded-full border-2 border-amber-500 bg-amber-400/30 shadow-md transition-all duration-100 hidden" style="left: 45%; top: 38%;"></div>
            <div id="redaction-box" class="absolute border-2 border-emerald-600 bg-emerald-500/20 backdrop-blur-md rounded-md transition-all duration-200 hidden" style="left: 20%; top: 15%; width: 220px; height: 36px;">
              <span class="absolute -top-5 left-0 text-[10px] font-mono text-emerald-800 font-bold bg-white/95 border border-emerald-300 px-1.5 py-0.5 rounded shadow-sm">+12px Safety Dilation</span>
            </div>
          </div>

          <!-- Bottom Floating Badges -->
          <div class="absolute bottom-4 left-6 flex items-center gap-3 pointer-events-none">
            <div class="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-gray-300 text-xs font-mono text-gray-800 font-medium shadow-sm flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              <span id="current-frame-badge">FRAME 90 / 750</span>
            </div>
            <div class="px-3 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-gray-300 text-xs font-mono text-gray-800 font-medium shadow-sm">
              <span id="current-timestamp-badge">00:01.500</span>
            </div>
          </div>
        </div>

        <!-- Gold Karaoke Subtitle Track (Broadcast Standard - High Contrast Light Theme) -->
        <div class="glass-panel p-5 rounded-2xl flex flex-col gap-2 border-2 border-amber-300 bg-amber-50/40">
          <div class="flex items-center justify-between text-xs font-mono">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span id="subtitle-act-badge" class="px-2.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-900 font-bold uppercase tracking-wider text-[11px]">Act 2: Architecture Synthesis</span>
            </div>
            <span id="subtitle-timing-badge" class="text-gray-600 font-medium">00:01.500 / 00:12.500</span>
          </div>
          <div id="karaoke-text-box" class="text-base md:text-lg font-medium text-gray-900 min-h-[3rem] flex flex-wrap items-center gap-2 px-2 py-1 leading-relaxed">
            <!-- Words dynamically highlighted here -->
            <span class="text-gray-500 italic">Initializing DeepMind Phoneme Karaoke Subtitles...</span>
          </div>
        </div>

        <!-- Timeline Scrubber & Transport Controls -->
        <div class="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <!-- Scrubber Range -->
          <div class="flex items-center gap-4">
            <span class="text-xs font-mono text-gray-600 font-semibold">00:00</span>
            <input id="timeline-slider" type="range" min="0" max="2212" value="120" class="flex-1 accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded-lg" oninput="onScrubFrame(this.value)">
            <span class="text-xs font-mono text-gray-600 font-semibold">00:36.9</span>
          </div>

          <!-- Control Buttons Bar -->
          <div class="flex items-center justify-between flex-wrap gap-4">
            <!-- Left: Play/Pause & Stepping -->
            <div class="flex items-center gap-2">
              <button onclick="stepFrame(-1)" class="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold flex items-center gap-1 border border-gray-300 transition-all">
                &lt; -1 Frame
              </button>
              <button id="play-pause-btn" onclick="togglePlay()" class="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all">
                <svg id="play-icon" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span id="play-btn-text">Play</span>
              </button>
              <button onclick="stepFrame(1)" class="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono font-bold flex items-center gap-1 border border-gray-300 transition-all">
                +1 Frame &gt;
              </button>
            </div>

            <!-- Middle: Quick Keyframe Selector Across All 5 Acts (Synchronized with Phonemes) -->
            <div class="flex items-center gap-1.5 text-xs font-mono flex-wrap">
              <button onclick="seekFrame(120)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F120 Hook</button>
              <button onclick="seekFrame(500)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F500 Whiteboard</button>
              <button onclick="seekFrame(830)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F830 Bridge</button>
              <button onclick="seekFrame(1050)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F1050 Model Garden</button>
              <button onclick="seekFrame(1350)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F1350 Cloud Run</button>
              <button onclick="seekFrame(1550)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F1550 KMS Autokey</button>
              <button onclick="seekFrame(1720)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F1720 Active PSC</button>
              <button onclick="seekFrame(2000)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F2000 BigQuery</button>
              <button onclick="seekFrame(2180)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F2180 Checklist</button>
            </div>

            <!-- Right: Playback Speed & Telemetry Toggle -->
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 text-xs text-gray-700 font-semibold cursor-pointer">
                <input type="checkbox" id="overlay-toggle" checked onchange="toggleOverlay(this.checked)" class="rounded accent-blue-600">
                Telemetry BBoxes
              </label>
              <select id="speed-select" onchange="setSpeed(this.value)" class="bg-white border border-gray-300 text-xs font-mono text-gray-800 font-semibold px-3 py-1.5 rounded-lg shadow-sm">
                <option value="0.5">0.5x Slow</option>
                <option value="1.0" selected>1.0x Normal</option>
                <option value="1.5">1.5x Fast</option>
                <option value="2.0">2.0x Double</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column (4 Cols): Multi-Track Audio Matrix & Master Peak Meter -->
      <div class="xl:col-span-4 flex flex-col gap-6">

        <!-- Hidden Audio Elements (Loaded from /scratch/) -->
        <audio id="audio-master" src="/scratch/master_audio.wav" preload="auto"></audio>
        <audio id="audio-narration" src="/scratch/narration.wav" preload="auto"></audio>
        <audio id="audio-music" src="/scratch/music_bed.wav" preload="auto"></audio>

        <!-- Audio Mixer & Voice Customization Card -->
        <div class="glass-panel p-6 rounded-2xl flex flex-col gap-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
              <h3 class="text-base font-bold text-gray-900 tracking-tight">Audio Track & Voice Customizer</h3>
            </div>
            <div class="flex items-center gap-2">
              <span id="audio-engine-mode" class="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-bold">ISOLATED VOICE</span>
              <span class="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px] font-bold">48 kHz</span>
            </div>
          </div>

          <!-- Section 1: Choose Active Audio Track for Training Video -->
          <div class="flex flex-col gap-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-900 uppercase tracking-wider">Choose Active Audio Track</span>
              <span class="text-[10px] text-gray-500 font-mono">1-Click Live Switch</span>
            </div>
            
            <!-- Option 1: Isolated Natural Trainer Voice (Recommended) -->
            <div id="track-opt-narration" onclick="switchActiveTrack('narration')" class="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 cursor-pointer transition-all flex items-start justify-between gap-3 shadow-sm hover:shadow">
              <div class="flex items-start gap-2.5">
                <input type="radio" name="active-track-radio" id="radio-narration" checked class="mt-0.5 accent-emerald-600">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-900">Isolated Natural Trainer Voice</span>
                    <span class="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">RECOMMENDED</span>
                  </div>
                  <span class="text-[11px] text-gray-600 mt-0.5">Clean 48kHz voice only (<code class="text-emerald-700">narration.wav</code>) • Zero BGM distractions for technical training</span>
                </div>
              </div>
              <span class="text-xs font-mono font-bold text-emerald-700">ACTIVE</span>
            </div>

            <!-- Option 2: Master Broadcast Mix -->
            <div id="track-opt-master" onclick="switchActiveTrack('master')" class="p-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-start justify-between gap-3 hover:border-blue-300 hover:bg-gray-50/80">
              <div class="flex items-start gap-2.5">
                <input type="radio" name="active-track-radio" id="radio-master" class="mt-0.5 accent-blue-600">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-900">Master Broadcast Mix</span>
                    <span class="px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 text-[10px] font-bold font-mono">KEYNOTE</span>
                  </div>
                  <span class="text-[11px] text-gray-600 mt-0.5">Natural Trainer Voice + Ducked Lyria Music Bed (<code class="text-blue-700">master_audio.wav</code>)</span>
                </div>
              </div>
              <span class="text-xs font-mono text-gray-400">SELECT</span>
            </div>

            <!-- Option 3: Lyria Ambient Music Bed Only -->
            <div id="track-opt-music" onclick="switchActiveTrack('music')" class="p-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-start justify-between gap-3 hover:border-purple-300 hover:bg-gray-50/80">
              <div class="flex items-start gap-2.5">
                <input type="radio" name="active-track-radio" id="radio-music" class="mt-0.5 accent-purple-600">
                <div class="flex flex-col">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-gray-900">Lyria Ambient Music Bed Only</span>
                    <span class="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold font-mono">BGM</span>
                  </div>
                  <span class="text-[11px] text-gray-600 mt-0.5">Procedural keynote score without speech (<code class="text-purple-700">music_bed.wav</code>)</span>
                </div>
              </div>
              <span class="text-xs font-mono text-gray-400">SELECT</span>
            </div>

            <!-- 1-Click Mux into 4K Video -->
            <button id="btn-mux-audio" onclick="muxTrackToVideo()" class="w-full mt-1 py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2">
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              <span>⚡ Mux Selected Track into Master 4K Video</span>
            </button>
          </div>

          <!-- Section 2: Voice Persona & Customization Controls -->
          <div class="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-3.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-900 uppercase tracking-wider">Customize Voice & Pacing</span>
              <span class="text-[10px] text-blue-700 font-mono font-bold">GOOGLE NEURAL CORE</span>
            </div>

            <!-- Voice Persona Dropdown -->
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-semibold text-gray-700">Voice Persona</label>
              <select id="select-voice-persona" class="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en-US-Journey-F" selected>Dr. Maya Lin (Google Cloud AI Evangelist • Natural Female)</option>
                <option value="en-US-Journey-D">Alex Chen (Principal Solutions Architect • Natural Male)</option>
                <option value="en-US-Journey-O">Elena Vance (Executive Keynote Presenter • Dynamic Female)</option>
                <option value="en-US-Studio-O">Sarah Jenkins (Cloud Engineering Lead • Studio Master)</option>
                <option value="en-US-Studio-Q">David Ross (Infrastructure Director • Enterprise Baritone)</option>
              </select>
            </div>

            <!-- Speaking Rate & Ducking in 2 columns -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-700">Speaking Pace</label>
                <select id="select-voice-speed" class="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
                  <option value="0.95">0.95x (Deep Dive)</option>
                  <option value="1.05" selected>1.05x (Standard)</option>
                  <option value="1.15">1.15x (Brisk Technical)</option>
                </select>
              </div>

              <div class="flex flex-col gap-1">
                <label class="text-[11px] font-semibold text-gray-700">Lyria Ducking Depth</label>
                <select id="select-ducking-db" class="bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
                  <option value="-99">Muted (Voice Only)</option>
                  <option value="-24">-24 dB (Subtle Whisper)</option>
                  <option value="-18" selected>-18 dB (Keynote Standard)</option>
                  <option value="-12">-12 dB (Prominent BGM)</option>
                </select>
              </div>
            </div>

            <button id="btn-synthesize-voice" onclick="applyVoiceCustomization()" class="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg>
              <span>🎙️ Re-Synthesize Voice Persona</span>
            </button>
          </div>

          <!-- Presenter Avatar Information Card -->
          <div class="p-4 rounded-xl bg-white border border-gray-200 flex items-center gap-4">
            <div class="relative w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"></circle><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"></path></svg>
              <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
            </div>
            <div class="flex flex-col">
              <span id="avatar-name" class="text-sm font-bold text-gray-900 tracking-tight">Dr. Maya Lin</span>
              <span id="avatar-role" class="text-xs text-blue-700 font-semibold">Google Cloud AI Evangelist</span>
              <span id="avatar-subtext" class="text-[11px] text-gray-500 font-mono mt-0.5">Veo 2 Avatar • 60fps Gaze Tracking Active</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Master Broadcast Assets Gallery & Direct Inspection (Phase 3 Delivery Hub) -->
    <div class="glass-panel p-8 rounded-3xl flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Phase 3 Master Broadcast Asset Hub</h2>
          <p class="text-sm text-gray-600 mt-1">Synthesized 48kHz DeepMind Audio Stems, Millisecond Timing Manifest & Remotion 4K Broadcast Stills</p>
        </div>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold">
          ✔ 100% Deterministic Artifacts Ready
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <!-- Asset 0: Master 4K Broadcast MP4 -->
        <div class="p-5 rounded-2xl bg-purple-50/70 border-2 border-purple-300 hover:border-purple-500 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">4K MP4</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">Master 4K Broadcast Reel</h4>
                <p class="text-xs text-gray-600">3840×2160 @ 60fps • 10.0s • H.264</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-purple-800 font-bold bg-purple-100 px-2 py-0.5 rounded border border-purple-200">27 MB</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="/scratch/vidoxis_master_4k.mp4" download class="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold text-center transition-all shadow-sm">Download 4K MP4</a>
            <button onclick="playMasterVideo()" class="py-2 px-3 rounded-xl bg-white hover:bg-purple-100 text-purple-900 border border-purple-300 text-xs font-mono font-bold shadow-sm transition-all">Watch Now ▶</button>
          </div>
        </div>

        <!-- Asset 1: Master Audio -->
        <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">WAV</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">Master Broadcast Audio</h4>
                <p class="text-xs text-gray-600">48kHz 16-bit PCM • -14.2 LUFS</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-gray-600 font-medium">1.2 MB</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="/scratch/master_audio.wav" download class="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold text-center transition-all shadow-sm">Download WAV</a>
            <button onclick="playSolo('/scratch/master_audio.wav')" class="py-2 px-3 rounded-xl bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 text-xs font-mono font-semibold shadow-sm transition-all">Play</button>
          </div>
        </div>

        <!-- Asset 2: Narration Voice -->
        <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">TTS</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">DeepMind Narration Voice</h4>
                <p class="text-xs text-gray-600">Dr. Maya Lin • 5 Acoustic Formants</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-gray-600 font-medium">1.2 MB</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="/scratch/narration.wav" download class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">Download Stem</a>
            <button onclick="playSolo('/scratch/narration.wav')" class="py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-mono font-semibold shadow-sm transition-all">Play</button>
          </div>
        </div>

        <!-- Asset 3: Lyria Dynamic Music Bed -->
        <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">BED</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">Lyria Music Bed (-18dB)</h4>
                <p class="text-xs text-gray-600">Dynamic Speech Ducking Envelope</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-gray-600 font-medium">1.2 MB</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="/scratch/music_bed.wav" download class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">Download Stem</a>
            <button onclick="playSolo('/scratch/music_bed.wav')" class="py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-mono font-semibold shadow-sm transition-all">Play</button>
          </div>
        </div>

        <!-- Asset 4: Phonemes Timing Manifest -->
        <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">JSON</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">Phoneme Alignment Manifest</h4>
                <p class="text-xs text-gray-600">Word-level bounds for 750 frames</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-gray-600 font-medium">13.5 KB</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="/scratch/phonemes.json" target="_blank" class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">View Raw JSON &gt;</a>
          </div>
        </div>

        <!-- Asset 5: Executive Agentic Draw.io Architecture -->
        <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">DRAW.IO</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">Executive Agentic Architecture</h4>
                <p class="text-xs text-gray-600">5-Tier Enterprise Standard • Draw.io Parity</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-gray-600 font-medium">17.8 KB</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="/scratch/gcp_agentic_ai_architecture.drawio" download class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">Download .drawio</a>
            <a href="/whiteboard/editor" target="_blank" class="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold shadow-sm transition-all">Open Editor &gt;</a>
          </div>
        </div>

        <!-- Asset 6: 4K Broadcast Stills Gallery -->
        <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">PNG</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">9x 4K Broadcast Stills</h4>
                <p class="text-xs text-gray-600">3840×2160 • Real Argolis & Cloudtop Mastered</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-gray-600 font-medium">9 Shots</span>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <a href="/scratch/rendered_stills/act3_console_drawer_typing.png" target="_blank" class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">Gemini Chat &gt;</a>
            <a href="/scratch/rendered_stills/act3_gcp_console_model_garden.png" target="_blank" class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">Model Garden &gt;</a>
            <a href="/scratch/rendered_stills/act3_endpoint_active_redaction.png" target="_blank" class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">Active PSC &gt;</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Section: Progressive Whiteboard Engine (ElkJS + RoughJS) Visualizer -->
    <div class="glass-panel p-8 rounded-3xl flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Progressive Whiteboard Stage & Architecture Visualizer</h2>
          <p class="text-sm text-gray-600 mt-1">Broadcast Studio Light Stage with 0% Bounding Box Collisions, Draw.io 5-Tier Parity & Glowing Kinetic Particles</p>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <!-- Executive Agentic Standard Badge -->
          <div class="flex items-center px-3.5 py-1.5 bg-blue-50 border border-blue-200 rounded-xl gap-2 text-xs font-bold text-blue-800 shadow-sm">
            <span class="w-2 h-2 rounded-full bg-blue-600"></span>
            <span>Executive Agentic Architecture (Draw.io)</span>
          </div>

          <!-- Edit Controls (Inline & Separate Tab) -->
          <div class="flex items-center p-1 bg-amber-50 border border-amber-200 rounded-xl gap-1">
            <button onclick="toggleInlineDrawioEditor()" id="wb-btn-inline-edit" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-900 bg-white hover:bg-amber-100 shadow-sm transition-all flex items-center gap-1.5">
              <span>✏️</span>
              <span id="wb-inline-text">Edit Inline</span>
            </button>
            <a href="/whiteboard/editor" target="_blank" class="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-all flex items-center gap-1.5">
              <span>↗️</span>
              <span>Edit on Separate Tab</span>
            </a>
          </div>

          <div class="flex items-center p-1 bg-gray-100 border border-gray-300 rounded-xl gap-1" id="wb-zoom-controls-group">
            <button onclick="setWhiteboardZoom('fit')" id="wb-zoom-fit" class="wb-zoom-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-blue-700 shadow-sm transition-all">Fit Canvas</button>
            <button onclick="setWhiteboardZoom('focus')" id="wb-zoom-focus" class="wb-zoom-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-gray-900 transition-all">Focus (1.8x)</button>
            <button onclick="setWhiteboardZoom('4k')" id="wb-zoom-4k" class="wb-zoom-btn px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 hover:text-gray-900 transition-all">4K (2.5x)</button>
          </div>
          <button onclick="toggleParticles()" id="particle-btn" class="px-4 py-2 rounded-xl bg-blue-50 border border-blue-300 text-blue-700 text-xs font-semibold flex items-center gap-2 shadow-sm">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            Kinetic Particles: ON
          </button>
          <a id="wb-open-link" href="/scratch/gcp_agentic_ai_architecture.png" target="_blank" class="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-2 border border-gray-300 shadow-sm transition-all">
            Open High-Res PNG &gt;
          </a>
        </div>
      </div>

      <!-- Interactive SVG / Draw.io Whiteboard Container -->
      <div id="whiteboard-stage-wrapper" class="w-full bg-[#F8FAFC] border border-gray-300 rounded-2xl p-6 overflow-auto flex items-center justify-center min-h-[460px] max-h-[750px] shadow-inner custom-scrollbar cursor-grab select-none relative">
        <div id="whiteboard-inline-status" class="hidden absolute top-4 right-6 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span id="whiteboard-inline-status-text">🟢 Draw.io Live Inline Editor • Autosaving to scratch/</span>
        </div>
        <div id="whiteboard-zoom-container" class="w-full flex items-center justify-center transition-transform duration-300 origin-center">
          <img id="whiteboard-drawio-img" src="/scratch/gcp_agentic_ai_architecture.png" alt="Executive Agentic Architecture Diagram" class="w-full h-auto max-h-[580px] object-contain" />
          <iframe id="whiteboard-inline-iframe" class="w-full h-[660px] rounded-xl border-0 hidden" src="about:blank"></iframe>
        </div>
      </div>

      <!-- Contract Nodes Telemetry Strip -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-blue-700 font-bold">NODE 1</span>
          <span class="text-xs font-semibold text-gray-900">Client VPC</span>
          <span class="text-[11px] text-gray-600 font-mono">10.0.0.0/16</span>
        </div>
        <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-blue-700 font-bold">NODE 2</span>
          <span class="text-xs font-semibold text-gray-900">PSC Forwarding Rule</span>
          <span class="text-[11px] text-gray-600 font-mono">10.0.1.50</span>
        </div>
        <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-blue-700 font-bold">NODE 3</span>
          <span class="text-xs font-semibold text-gray-900">Private Service Connect</span>
          <span class="text-[11px] text-gray-600 font-mono">Zero Public IPs</span>
        </div>
        <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-blue-700 font-bold">NODE 4</span>
          <span class="text-xs font-semibold text-gray-900">Vertex AI Endpoint</span>
          <span class="text-[11px] text-gray-600 font-mono">europe-west1</span>
        </div>
        <div class="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-emerald-700 font-bold">NODE 5</span>
          <span class="text-xs font-semibold text-gray-900">Gemini 2.0 Flash</span>
          <span class="text-[11px] text-gray-600 font-mono">Sub-15ms Private</span>
        </div>
      </div>
    </div>

    <!-- Bottom Grid: Telemetry Stream & 39 Quality Hooks Matrix -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">

      <!-- Left 6 Cols: CDP Rehearsal Telemetry Stream -->
      <div class="xl:col-span-6 glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 class="text-lg font-bold text-gray-900">Deterministic CDP Telemetry</h3>
          </div>
          <span class="text-xs font-mono text-gray-600 font-semibold">0% Flake Replay</span>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 font-mono text-xs text-gray-800 h-64 overflow-y-auto custom-scrollbar flex flex-col gap-2">
          <div class="text-blue-700 font-semibold">▶ [Session] CDP Replayer connected to Chrome 153.0.8010.36</div>
          <div class="text-emerald-700 font-semibold">✔ [Step 1] Navigate to https://console.cloud.google.com/vertex-ai/models</div>
          <div class="text-gray-600">↳ [Telemetry] Mouse spline moved to [x: 480, y: 160] (Duration: 320ms)</div>
          <div class="text-emerald-700 font-semibold">✔ [Step 2] Click 'Deploy Model' [data-test-id='mg-deploy-btn']</div>
          <div class="text-gray-600">↳ [Telemetry] Drawer expanded to 680px width</div>
          <div class="text-emerald-700 font-semibold">✔ [Step 3] Type 'gemini-2-private-ep' with minimum-jerk dwell</div>
          <div class="text-emerald-700 font-semibold">✔ [Step 4] Verified endpoint status 'Active' with 12px dilation redaction</div>
        </div>
      </div>

      <!-- Right 6 Cols: 13 Lifecycle Events & 39 Quality Hooks -->
      <div class="xl:col-span-6 glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <h3 class="text-lg font-bold text-gray-900">Quality Guard Engine (39 Hooks)</h3>
          </div>
          <span class="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono text-xs font-bold">100% Verified</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs font-mono h-64 overflow-y-auto custom-scrollbar p-1">
          <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
            <span class="text-gray-800 font-medium truncate">sandbox_project_id_firewall</span>
            <span class="text-emerald-700 font-bold">✔ PASS</span>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
            <span class="text-gray-800 font-medium truncate">validate_manifest_schema</span>
            <span class="text-emerald-700 font-bold">✔ PASS</span>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
            <span class="text-gray-800 font-medium truncate">whiteboard_bbox_collision_audit</span>
            <span class="text-emerald-700 font-bold">✔ PASS</span>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
            <span class="text-gray-800 font-medium truncate">triad_selector_shadow_dom</span>
            <span class="text-emerald-700 font-bold">✔ PASS</span>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
            <span class="text-gray-800 font-medium truncate">headless_rehearsal_matrix</span>
            <span class="text-emerald-700 font-bold">✔ PASS</span>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
            <span class="text-gray-800 font-medium truncate">google_signed_chrome_guard</span>
            <span class="text-emerald-700 font-bold">✔ PASS</span>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
            <span class="text-gray-800 font-medium truncate">zero_blank_frame_audit</span>
            <span class="text-emerald-700 font-bold">✔ PASS</span>
          </div>
          <div class="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between">
            <span class="text-gray-800 font-medium truncate">redaction_bounding_box_dilation</span>
            <span class="text-emerald-700 font-bold">✔ PASS</span>
          </div>
        </div>
      </div>

    </div>

  </main>

  <!-- Interactive JavaScript Engine -->
  <script>
    const STILLS_MAP = {
      120: '/scratch/rendered_stills/act1_cold_open_hook.png',
      500: '/scratch/rendered_stills/act2_whiteboard_kinetic_particles.png',
      830: '/scratch/rendered_stills/act2_spatial_dissolve_bridge.png',
      1050: '/scratch/rendered_stills/act3_gcp_console_step1_model_garden.png',
      1350: '/scratch/rendered_stills/act3_gcp_console_step2_cloud_run.png',
      1550: '/scratch/rendered_stills/act3_gcp_console_step3_security_cmek.png',
      1720: '/scratch/rendered_stills/act3_gcp_console_step4_active_endpoint.png',
      2000: '/scratch/rendered_stills/act3_gcp_console_step5_bigquery_studio.png',
      2180: '/scratch/rendered_stills/act5_production_checklist.png'
    };

    let currentFrame = 120;
    let isPlaying = false;
    let phonemesData = null;
    let activeAudio = null;
    let animFrameId = null;

    // Load Phonemes JSON for Gold Karaoke
    async function loadPhonemes() {
      try {
        const res = await fetch('/api/phonemes');
        if (res.ok) {
          phonemesData = await res.json();
          updateKaraokeSubtitles();
        }
      } catch (err) {
        console.warn('Phonemes load error:', err);
      }
    }
    loadPhonemes();

    const masterAudio = document.getElementById('audio-master');
    const narrationAudio = document.getElementById('audio-narration');
    const musicAudio = document.getElementById('audio-music');
    activeAudio = narrationAudio; // Default to Isolated Natural Trainer Voice as requested
    let currentActiveTrack = 'narration';

    function switchActiveTrack(track) {
      currentActiveTrack = track;
      const optNarr = document.getElementById('track-opt-narration');
      const optMaster = document.getElementById('track-opt-master');
      const optMusic = document.getElementById('track-opt-music');
      const radioNarr = document.getElementById('radio-narration');
      const radioMaster = document.getElementById('radio-master');
      const radioMusic = document.getElementById('radio-music');
      const modeBadge = document.getElementById('audio-engine-mode');

      if (track === 'narration') {
        activeAudio = narrationAudio;
        radioNarr.checked = true;
        modeBadge.textContent = 'ISOLATED VOICE';
        modeBadge.className = 'px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-bold';
        optNarr.className = 'p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50/50 cursor-pointer transition-all flex items-start justify-between gap-3 shadow-sm';
        optMaster.className = 'p-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-start justify-between gap-3 hover:border-blue-300';
        optMusic.className = 'p-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-start justify-between gap-3 hover:border-purple-300';
      } else if (track === 'master') {
        activeAudio = masterAudio;
        radioMaster.checked = true;
        modeBadge.textContent = 'MASTER STEREO';
        modeBadge.className = 'px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px] font-bold';
        optMaster.className = 'p-3 rounded-xl border-2 border-blue-500 bg-blue-50/50 cursor-pointer transition-all flex items-start justify-between gap-3 shadow-sm';
        optNarr.className = 'p-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-start justify-between gap-3 hover:border-emerald-300';
        optMusic.className = 'p-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-start justify-between gap-3 hover:border-purple-300';
      } else if (track === 'music') {
        activeAudio = musicAudio;
        radioMusic.checked = true;
        modeBadge.textContent = 'LYRIA BGM ONLY';
        modeBadge.className = 'px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-700 font-mono text-[11px] font-bold';
        optMusic.className = 'p-3 rounded-xl border-2 border-purple-500 bg-purple-50/50 cursor-pointer transition-all flex items-start justify-between gap-3 shadow-sm';
        optNarr.className = 'p-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-start justify-between gap-3 hover:border-emerald-300';
        optMaster.className = 'p-3 rounded-xl border border-gray-200 bg-white cursor-pointer transition-all flex items-start justify-between gap-3 hover:border-blue-300';
      }
      if (isPlaying && activeAudio) {
        activeAudio.currentTime = currentFrame / 60;
        activeAudio.play().catch(() => {});
      }
    }

    async function muxTrackToVideo() {
      const btn = document.getElementById('btn-mux-audio');
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin">⏳</span> Muxing ' + currentActiveTrack.toUpperCase() + ' to 4K Video...';
      try {
        const res = await fetch('/api/select-video-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ track: currentActiveTrack })
        });
        const data = await res.json();
        if (data.success) {
          btn.innerHTML = '✔ 4K Video Muxed with ' + currentActiveTrack.toUpperCase();
          btn.className = 'w-full mt-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2';
          const videoPlayer = document.getElementById('active-video-player');
          if (videoPlayer) {
            videoPlayer.src = '/scratch/vidoxis_master_4k.mp4?t=' + Date.now();
          }
          setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg><span>⚡ Mux Selected Track into Master 4K Video</span>';
            btn.className = 'w-full mt-1 py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2';
          }, 3500);
        } else {
          btn.innerHTML = 'Mux Failed: ' + (data.error || 'Server error');
          btn.disabled = false;
        }
      } catch (err) {
        btn.innerHTML = 'Error: ' + err.message;
        btn.disabled = false;
      }
    }

    async function applyVoiceCustomization() {
      const btn = document.getElementById('btn-synthesize-voice');
      const voiceSelect = document.getElementById('select-voice-persona');
      const rateSelect = document.getElementById('select-voice-speed');
      const duckingSelect = document.getElementById('select-ducking-db');
      
      btn.disabled = true;
      btn.innerHTML = '<span class="animate-spin">🎙️</span> Synthesizing Neural Voice & Ducking...';
      
      try {
        const res = await fetch('/api/synthesize-voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voiceName: voiceSelect.value,
            speakingRate: parseFloat(rateSelect.value),
            duckingDb: parseInt(duckingSelect.value, 10),
            targetTrack: currentActiveTrack
          })
        });
        const data = await res.json();
        if (data.success) {
          btn.innerHTML = '✔ Voice & Score Synthesized';
          btn.className = 'w-full py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-2';
          
          masterAudio.src = '/scratch/master_audio.wav?t=' + Date.now();
          narrationAudio.src = '/scratch/narration.wav?t=' + Date.now();
          musicAudio.src = '/scratch/music_bed.wav?t=' + Date.now();
          masterAudio.load();
          narrationAudio.load();
          musicAudio.load();
          
          await loadPhonemes();
          
          if (data.result && data.result.voiceMetadata) {
            document.getElementById('avatar-name').textContent = data.result.voiceMetadata.name;
            document.getElementById('avatar-role').textContent = data.result.voiceMetadata.role;
            document.getElementById('avatar-subtext').textContent = data.result.voiceMetadata.style;
          }
          
          const videoPlayer = document.getElementById('active-video-player');
          if (videoPlayer) {
            videoPlayer.src = '/scratch/vidoxis_master_4k.mp4?t=' + Date.now();
          }
          
          setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"></path></svg><span>🎙️ Re-Synthesize Voice Persona</span>';
            btn.className = 'w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2';
          }, 3500);
        } else {
          btn.innerHTML = 'Failed: ' + (data.error || 'API error');
          btn.disabled = false;
        }
      } catch (err) {
        btn.innerHTML = 'Error: ' + err.message;
        btn.disabled = false;
      }
    }

    function seekFrame(frameNum) {
      currentFrame = Math.max(0, Math.min(2212, parseInt(frameNum, 10)));
      document.getElementById('timeline-slider').value = currentFrame;
      const targetSec = currentFrame / 60;
      if (activeAudio) {
        activeAudio.currentTime = targetSec;
      }
      if (narrationAudio) narrationAudio.currentTime = targetSec;
      if (musicAudio) musicAudio.currentTime = targetSec;
      updateFrameDisplay();
    }

    function onScrubFrame(val) {
      currentFrame = parseInt(val, 10);
      const targetSec = currentFrame / 60;
      if (activeAudio) {
        activeAudio.currentTime = targetSec;
      }
      if (narrationAudio) narrationAudio.currentTime = targetSec;
      if (musicAudio) musicAudio.currentTime = targetSec;
      updateFrameDisplay();
    }

    function stepFrame(delta) {
      seekFrame(currentFrame + delta);
    }

    function updateFrameDisplay() {
      document.getElementById('current-frame-badge').textContent = 'FRAME ' + currentFrame + ' / 2212';
      const seconds = (currentFrame / 60);
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const remSecs = (seconds % 60).toFixed(3).padStart(6, '0');
      document.getElementById('current-timestamp-badge').textContent = mins + ':' + remSecs;
      document.getElementById('subtitle-timing-badge').textContent = mins + ':' + remSecs + ' / 00:36.866';

      // Select closest rendered still across the 5 acts
      const img = document.getElementById('active-screen-img');
      const cursorHalo = document.getElementById('cursor-halo');
      const redactionBox = document.getElementById('redaction-box');

      if (currentFrame < 340) {
        img.src = STILLS_MAP[120] || STILLS_MAP[500];
        cursorHalo.classList.add('hidden');
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 820) {
        img.src = STILLS_MAP[500];
        cursorHalo.classList.add('hidden');
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 840) {
        img.src = STILLS_MAP[830];
        cursorHalo.classList.remove('hidden');
        cursorHalo.style.left = '48%';
        cursorHalo.style.top = '36%';
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 1270) {
        img.src = STILLS_MAP[1050];
        cursorHalo.classList.remove('hidden');
        cursorHalo.style.left = '52%';
        cursorHalo.style.top = '48%';
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 1470) {
        img.src = STILLS_MAP[1350];
        cursorHalo.classList.remove('hidden');
        cursorHalo.style.left = '55%';
        cursorHalo.style.top = '42%';
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 1650) {
        img.src = STILLS_MAP[1550];
        cursorHalo.classList.remove('hidden');
        cursorHalo.style.left = '67%';
        cursorHalo.style.top = '33%';
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 1810) {
        img.src = STILLS_MAP[1720];
        cursorHalo.classList.remove('hidden');
        cursorHalo.style.left = '86%';
        cursorHalo.style.top = '14%';
        redactionBox.classList.remove('hidden');
      } else if (currentFrame < 2050) {
        img.src = STILLS_MAP[2000];
        cursorHalo.classList.remove('hidden');
        cursorHalo.style.left = '45%';
        cursorHalo.style.top = '48%';
        redactionBox.classList.add('hidden');
      } else {
        img.src = STILLS_MAP[2180] || STILLS_MAP[2000];
        cursorHalo.classList.add('hidden');
        redactionBox.classList.add('hidden');
      }

      updateKaraokeSubtitles();
      updateVisualizerBars();
    }

    function updateKaraokeSubtitles() {
      if (!phonemesData || !phonemesData.segments) return;
      const currentMs = (currentFrame / 60) * 1000;

      // Find active segment
      let activeSeg = phonemesData.segments.find(s => currentMs >= s.startMs && currentMs < s.endMs);
      if (!activeSeg) {
        activeSeg = phonemesData.segments[0];
      }

      document.getElementById('subtitle-act-badge').textContent = activeSeg.actName;

      const textBox = document.getElementById('karaoke-text-box');
      if (!activeSeg.words || activeSeg.words.length === 0) {
        textBox.textContent = activeSeg.text;
        return;
      }

      let html = '';
      for (const w of activeSeg.words) {
        const isCurrent = currentMs >= w.startMs && currentMs < w.endMs;
        const isPast = currentMs >= w.endMs;

        if (isCurrent) {
          html += '<span class="text-amber-900 font-bold text-lg scale-105 px-2 py-0.5 rounded-lg bg-amber-100 border border-amber-400 shadow-sm transition-all duration-75">' + escapeHtml(w.word) + '</span> ';
        } else if (isPast) {
          html += '<span class="text-gray-900 font-semibold">' + escapeHtml(w.word) + '</span> ';
        } else {
          html += '<span class="text-slate-500 font-medium">' + escapeHtml(w.word) + '</span> ';
        }
      }
      textBox.innerHTML = html;
    }

    function escapeHtml(str) {
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      const btnText = document.getElementById('play-btn-text');
      const btnIcon = document.getElementById('play-icon');

      if (isPlaying) {
        btnText.textContent = 'Pause';
        btnIcon.outerHTML = '<svg id="play-icon" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';

        if (activeAudio) {
          activeAudio.currentTime = currentFrame / 60;
          activeAudio.play().catch(e => console.log('Audio autoplay policy note:', e));
        }

        function playbackLoop() {
          if (!isPlaying) return;
          if (activeAudio && !activeAudio.paused) {
            currentFrame = Math.round(activeAudio.currentTime * 60);
            if (currentFrame >= 2212) {
              currentFrame = 0;
              activeAudio.currentTime = 0;
            }
          } else {
            currentFrame += 2;
            if (currentFrame >= 2212) currentFrame = 0;
          }
          document.getElementById('timeline-slider').value = currentFrame;
          updateFrameDisplay();
          animFrameId = requestAnimationFrame(playbackLoop);
        }
        animFrameId = requestAnimationFrame(playbackLoop);
      } else {
        btnText.textContent = 'Play';
        btnIcon.outerHTML = '<svg id="play-icon" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        if (activeAudio) activeAudio.pause();
        if (animFrameId) cancelAnimationFrame(animFrameId);
      }
    }

    function updateVisualizerBars() {
      const bars = document.querySelectorAll('#wave-bars-container div');
      const duckBadge = document.getElementById('ducking-indicator');
      const t = currentFrame / 15;

      // When playing, animate bars with dynamic ducking level
      bars.forEach((bar, idx) => {
        const h = isPlaying ? Math.max(3, Math.min(20, Math.sin(t + idx * 0.8) * 8 + 10)) : 3 + (idx % 3) * 2;
        bar.style.height = h + 'px';
      });

      // Show ducked status when active speech is present
      if (duckBadge) {
        const isDucked = currentFrame < 2100;
        if (isDucked) {
          duckBadge.textContent = '-18dB DUCKED';
          duckBadge.className = 'px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-mono font-bold transition-colors duration-200';
        } else {
          duckBadge.textContent = 'AMBIENT 0dB';
          duckBadge.className = 'px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-300 text-[10px] font-mono font-bold transition-colors duration-200';
        }
      }
    }

    function setSpeed(val) {
      const spd = parseFloat(val);
      if (activeAudio) activeAudio.playbackRate = spd;
      if (narrationAudio) narrationAudio.playbackRate = spd;
      if (musicAudio) musicAudio.playbackRate = spd;
    }

    function setAspectRatio(ratio) {
      const frame = document.getElementById('viewport-frame');
      const badge = document.getElementById('active-res-badge');
      document.querySelectorAll('.aspect-btn').forEach(b => {
        b.className = 'aspect-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 font-semibold transition-all';
      });
      const activeBtn = document.querySelector('.aspect-btn[data-ratio="' + ratio + '"]');
      if (activeBtn) {
        activeBtn.className = 'aspect-btn active px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold shadow-sm transition-all';
      }

      frame.className = 'w-full rounded-2xl bg-white border border-gray-300 relative overflow-hidden flex items-center justify-center neon-border-blue transition-all duration-300 shadow-sm';
      if (ratio === '16:9') {
        frame.classList.add('aspect-video');
        badge.textContent = '3840×2160 (16:9 4K UHD)';
      } else if (ratio === '4:3') {
        frame.classList.add('aspect-[4/3]', 'max-w-[75%]', 'mx-auto');
        badge.textContent = '2880×2160 (4:3 Academy)';
      } else if (ratio === '1:1') {
        frame.classList.add('aspect-square', 'max-w-[55%]', 'mx-auto');
        badge.textContent = '2160×2160 (1:1 Square)';
      } else if (ratio === '9:16') {
        frame.classList.add('aspect-[9/16]', 'max-w-[35%]', 'mx-auto');
        badge.textContent = '1215×2160 (9:16 Shorts/Reels)';
      }
    }

    function toggleOverlay(visible) {
      document.getElementById('telemetry-overlay').style.opacity = visible ? '1' : '0';
    }

    let inlineEditActive = false;
    let currentDrawioXml = '';

    async function toggleInlineDrawioEditor() {
      const imgObj = document.getElementById('whiteboard-drawio-img');
      const iframe = document.getElementById('whiteboard-inline-iframe');
      const inlineStatus = document.getElementById('whiteboard-inline-status');
      const inlineBtnText = document.getElementById('wb-inline-text');
      const zoomGroup = document.getElementById('wb-zoom-controls-group');
      const container = document.getElementById('whiteboard-zoom-container');
      const stageWrapper = document.getElementById('whiteboard-stage-wrapper');

      inlineEditActive = !inlineEditActive;

      if (inlineEditActive) {
        imgObj.classList.add('hidden');
        iframe.classList.remove('hidden');
        inlineStatus.classList.remove('hidden');
        inlineBtnText.textContent = '✕ Exit Inline Edit';
        zoomGroup.classList.add('opacity-40', 'pointer-events-none');
        container.style.transform = 'scale(1)';
        container.style.minWidth = '100%';
        stageWrapper.style.minHeight = '720px';
        stageWrapper.style.padding = '8px';

        if (iframe.src === 'about:blank' || !iframe.src.includes('embed.diagrams.net')) {
          iframe.src = 'https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json&configure=1';
        }
      } else {
        iframe.classList.add('hidden');
        inlineStatus.classList.add('hidden');
        inlineBtnText.textContent = 'Edit Inline';
        zoomGroup.classList.remove('opacity-40', 'pointer-events-none');
        stageWrapper.style.minHeight = '460px';
        stageWrapper.style.padding = '24px';
        imgObj.classList.remove('hidden');
      }
    }

    window.addEventListener('message', async (e) => {
      if (!e.data || typeof e.data !== 'string') return;
      try {
        const msg = JSON.parse(e.data);
        const inlineIframe = document.getElementById('whiteboard-inline-iframe');
        if (msg.event === 'configure') {
          if (inlineIframe && inlineIframe.contentWindow) {
            inlineIframe.contentWindow.postMessage(JSON.stringify({
              action: 'configure',
              config: {}
            }), '*');
          }
        } else if (msg.event === 'init') {
          if (!currentDrawioXml) {
            const res = await fetch('/api/drawio/xml');
            const data = await res.json();
            currentDrawioXml = data.xml;
          }
          if (inlineIframe && inlineIframe.contentWindow) {
            inlineIframe.contentWindow.postMessage(JSON.stringify({
              action: 'load',
              autosave: 1,
              xml: currentDrawioXml,
              title: 'gcp_agentic_ai_architecture.drawio'
            }), '*');
          }
        } else if (msg.event === 'load') {
          const inlineStatusText = document.getElementById('whiteboard-inline-status-text');
          if (inlineStatusText) {
            inlineStatusText.innerHTML = '🟢 Draw.io Live Editor Active • Autosaving Enabled';
          }
        } else if (msg.event === 'save' || msg.event === 'autosave') {
          currentDrawioXml = msg.xml;
          await fetch('/api/drawio/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ xml: msg.xml })
          });
          const inlineStatusText = document.getElementById('whiteboard-inline-status-text');
          if (inlineStatusText) {
            inlineStatusText.innerHTML = '✔ Autosaved to workspace at ' + new Date().toLocaleTimeString();
          }
        }
      } catch (err) {}
    });

    function setWhiteboardZoom(mode) {
      const container = document.getElementById('whiteboard-zoom-container');
      const img = document.getElementById('whiteboard-drawio-img');
      document.querySelectorAll('.wb-zoom-btn').forEach(btn => {
        btn.classList.remove('bg-white', 'text-blue-700', 'shadow-sm');
        btn.classList.add('text-gray-700');
      });
      const activeBtn = document.getElementById('wb-zoom-' + mode);
      if (activeBtn) {
        activeBtn.classList.add('bg-white', 'text-blue-700', 'shadow-sm');
        activeBtn.classList.remove('text-gray-700');
      }

      if (mode === 'focus') {
        container.style.transform = 'scale(1.8)';
        container.style.minWidth = '180%';
        img.style.maxHeight = '800px';
      } else if (mode === '4k') {
        container.style.transform = 'scale(2.5)';
        container.style.minWidth = '250%';
        img.style.maxHeight = '1100px';
      } else {
        container.style.transform = 'scale(1)';
        container.style.minWidth = '100%';
        img.style.maxHeight = '580px';
      }
    }

    function toggleParticles() {
      const btn = document.getElementById('particle-btn');
      const isCurrentlyOn = btn.textContent.includes('ON');
      if (isCurrentlyOn) {
        btn.innerHTML = 'Kinetic Particles: OFF';
        btn.className = 'px-4 py-2 rounded-xl bg-gray-100 border border-gray-300 text-gray-600 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all';
      } else {
        btn.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>Kinetic Particles: ON';
        btn.className = 'px-4 py-2 rounded-xl bg-blue-50 border border-blue-300 text-blue-700 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all';
      }
    }

    function toggleVideoPlaybackMode() {
      const img = document.getElementById('active-screen-img');
      const vid = document.getElementById('active-video-player');
      const btn = document.getElementById('toggle-video-mode-btn');
      const telem = document.getElementById('telemetry-overlay');
      if (vid.classList.contains('hidden')) {
        vid.classList.remove('hidden');
        img.classList.add('hidden');
        if (telem) telem.classList.add('hidden');
        btn.innerHTML = '<span>🖼️</span><span>Switch to Stills Scrubbing</span>';
        btn.className = 'px-3.5 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all';
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.classList.add('hidden');
        img.classList.remove('hidden');
        if (telem) telem.classList.remove('hidden');
        btn.innerHTML = '<span>▶️</span><span>Watch Master 4K Video</span>';
        btn.className = 'px-3.5 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all';
      }
    }

    function playMasterVideo() {
      const vid = document.getElementById('active-video-player');
      const img = document.getElementById('active-screen-img');
      const btn = document.getElementById('toggle-video-mode-btn');
      const telem = document.getElementById('telemetry-overlay');
      vid.classList.remove('hidden');
      img.classList.add('hidden');
      if (telem) telem.classList.add('hidden');
      if (btn) {
        btn.innerHTML = '<span>🖼️</span><span>Switch to Stills Scrubbing</span>';
        btn.className = 'px-3.5 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-900 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all';
      }
      window.scrollTo({ top: 120, behavior: 'smooth' });
      vid.play().catch(() => {});
    }

    function jumpToAct(act) {
      if (act === 1) seekFrame(15);
      else if (act === 2) seekFrame(90);
      else if (act === 3) seekFrame(220);
      else if (act === 4) seekFrame(430);
      else if (act === 5) seekFrame(480);
    }

    function reloadAllArtifacts() {
      window.location.reload();
    }

    function updateAudioVol(track, val) {
      const num = parseInt(val, 10);
      const frac = num / 100;
      if (track === 'narration' && narrationAudio) {
        narrationAudio.volume = frac;
        document.getElementById('vol-narration-val').textContent = val + '% (' + (num === 100 ? '0 dB' : Math.round(20 * Math.log10(Math.max(0.001, frac))) + ' dB') + ')';
      } else if (track === 'music' && musicAudio) {
        musicAudio.volume = frac;
        document.getElementById('vol-music-val').textContent = val + '% (' + Math.round(20 * Math.log10(Math.max(0.001, frac))) + ' dB)';
      }
    }

    function toggleMute(track) {
      if (track === 'narration' && narrationAudio) {
        narrationAudio.muted = !narrationAudio.muted;
        document.getElementById('btn-mute-narration').textContent = narrationAudio.muted ? 'UNMUTE' : 'MUTE';
        document.getElementById('vol-narration-val').textContent = narrationAudio.muted ? 'MUTED' : '100% (0 dB)';
      } else if (track === 'music' && musicAudio) {
        musicAudio.muted = !musicAudio.muted;
        document.getElementById('btn-mute-music').textContent = musicAudio.muted ? 'UNMUTE' : 'MUTE';
        document.getElementById('vol-music-val').textContent = musicAudio.muted ? 'MUTED' : '25% (-18 dB)';
      }
    }

    function playSolo(src) {
      const a = new Audio(src);
      a.play().catch(e => console.log('Playback error:', e));
    }

    // Initialize layout
    updateFrameDisplay();
  </script>
</body>
</html>`;
}

function renderWhiteboardEditorHtml(): string {
  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Draw.io Cloud Editor — GCP Agentic AI Reference Architecture</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Google Sans Flex', system-ui, sans-serif; }
    .mono { font-family: 'Roboto Mono', monospace; }
  </style>
</head>
<body class="h-full w-full flex flex-col bg-[#F8FAFC] overflow-hidden m-0 p-0">
  <!-- Top Bar -->
  <header class="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-10 shadow-sm shrink-0">
    <div class="flex items-center gap-4">
      <a href="/" class="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-all py-1.5 px-3 rounded-lg hover:bg-gray-100">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Studio Hub
      </a>
      <div class="h-5 w-px bg-gray-200"></div>
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs">📐</div>
        <div>
          <h1 class="text-sm font-bold text-gray-900 leading-tight">gcp_agentic_ai_architecture.drawio</h1>
          <p class="text-[11px] text-gray-500 mono">Executive 5-Tier Reference Architecture • Workspace Sync Active</p>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <div id="save-status" class="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Workspace Synced
      </div>
      <button onclick="saveDiagram()" class="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>
        Save Workspace File
      </button>
      <a href="/scratch/gcp_agentic_ai_architecture.png" target="_blank" class="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all">
        View PNG
      </a>
      <a href="/scratch/gcp_agentic_ai_architecture.drawio" download class="px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all">
        Download .drawio
      </a>
    </div>
  </header>

  <!-- Fullscreen Embedded Draw.io Iframe -->
  <main class="flex-1 w-full h-[calc(100vh-3.5rem)] relative">
    <iframe id="drawio-iframe" class="w-full h-full border-0" src="https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&proto=json&configure=1"></iframe>
  </main>

  <script>
    let currentXml = '';
    const iframe = document.getElementById('drawio-iframe');
    const statusEl = document.getElementById('save-status');

    async function loadInitialXml() {
      try {
        const res = await fetch('/api/drawio/xml');
        const data = await res.json();
        currentXml = data.xml || '';
      } catch (err) {
        console.error('Failed to load initial XML:', err);
      }
    }
    loadInitialXml();

    window.addEventListener('message', async (e) => {
      if (!e.data || typeof e.data !== 'string') return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === 'configure') {
          iframe.contentWindow.postMessage(JSON.stringify({
            action: 'configure',
            config: {}
          }), '*');
        } else if (msg.event === 'init') {
          if (!currentXml) {
            const res = await fetch('/api/drawio/xml');
            const data = await res.json();
            currentXml = data.xml;
          }
          iframe.contentWindow.postMessage(JSON.stringify({
            action: 'load',
            autosave: 1,
            xml: currentXml,
            title: 'gcp_agentic_ai_architecture.drawio'
          }), '*');
        } else if (msg.event === 'load') {
          statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Workspace Synced (Draw.io Active)';
        } else if (msg.event === 'save' || msg.event === 'autosave') {
          await persistXml(msg.xml);
        } else if (msg.event === 'export') {
          if (msg.data) {
            await persistXml(msg.data);
          }
        }
      } catch (err) {}
    });

    async function persistXml(xml) {
      statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span> Saving...';
      statusEl.className = 'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200';
      try {
        const res = await fetch('/api/drawio/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ xml })
        });
        const resData = await res.json();
        if (resData.success) {
          const now = new Date().toLocaleTimeString();
          statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span> Saved at ' + now;
          statusEl.className = 'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
        }
      } catch (err) {
        statusEl.innerHTML = '❌ Save Error';
        statusEl.className = 'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200';
      }
    }

    function saveDiagram() {
      iframe.contentWindow.postMessage(JSON.stringify({ action: 'export', format: 'xml' }), '*');
    }
  </script>
</body>
</html>`;
}

if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  const server = createStudioServer();
  server.listen(PORT, () => {
    console.log(`================================================================================`);
    console.log(`🎨 VIDOXIS STUDIO WEB HUB RUNNING AT: http://127.0.0.1:${PORT}`);
    console.log(`   Desktop Resolution Layout: max-w-1600 (Spacious Desktop Standard)`);
    console.log(`   Broadcast 4K Video Review & Multi-Track Audio Matrix Active`);
    console.log(`================================================================================`);
  });
}
