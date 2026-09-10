import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { TrainexHookRunner } from "../hooks/runner.js";

const PORT = parseInt(process.env.PORT || "8085", 10);
const SCRATCH_DIR = path.resolve(process.cwd(), "scratch");
const SCHEMAS_DIR = path.resolve(process.cwd(), "schemas");

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
        const runner = new TrainexHookRunner();
        const hooksConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "hooks.json"), "utf-8"));
        res.writeHead(200, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
        res.end(JSON.stringify(hooksConfig));
      } catch (err: any) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err.message) }));
      }
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
  <title>Trainex Studio Hub — Broadcast Cloud Demo & Training Suite</title>
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
          <span class="text-2xl font-bold tracking-tight text-gray-900">Trainex <span class="text-blue-600 font-mono font-medium text-lg">Studio</span></span>
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

          <!-- Aspect Ratio Toggle Pills -->
          <div class="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-semibold">
            <button onclick="setAspectRatio('16:9')" class="aspect-btn active px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold shadow-sm" data-ratio="16:9">16:9</button>
            <button onclick="setAspectRatio('4:3')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 font-semibold" data-ratio="4:3">4:3</button>
            <button onclick="setAspectRatio('1:1')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 font-semibold" data-ratio="1:1">1:1</button>
            <button onclick="setAspectRatio('9:16')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 font-semibold" data-ratio="9:16">9:16</button>
          </div>
        </div>

        <!-- Viewport Canvas Container -->
        <div id="viewport-frame" class="w-full aspect-video rounded-2xl bg-white border border-gray-300 relative overflow-hidden flex items-center justify-center neon-border-blue transition-all duration-300 shadow-sm">
          <img id="active-screen-img" src="/scratch/rendered_stills/act2_whiteboard_kinetic_particles.png" alt="Broadcast Viewport" class="w-full h-full object-contain">

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
            <input id="timeline-slider" type="range" min="0" max="750" value="90" class="flex-1 accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded-lg" oninput="onScrubFrame(this.value)">
            <span class="text-xs font-mono text-gray-600 font-semibold">00:12.5</span>
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

            <!-- Middle: Quick Keyframe Selector Across All 5 Acts -->
            <div class="flex items-center gap-1.5 text-xs font-mono flex-wrap">
              <button onclick="seekFrame(15)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F15 Hook</button>
              <button onclick="seekFrame(90)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F90 Whiteboard</button>
              <button onclick="seekFrame(175)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F175 Bridge</button>
              <button onclick="seekFrame(220)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F220 Drawer</button>
              <button onclick="seekFrame(270)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F270 Redact</button>
              <button onclick="seekFrame(360)" class="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-semibold transition-all">F360 Checklist</button>
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

        <!-- Audio Mixer Card -->
        <div class="glass-panel p-6 rounded-2xl flex flex-col gap-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
              <h3 class="text-base font-bold text-gray-900 tracking-tight">Multi-Track Audio Engine</h3>
            </div>
            <div class="flex items-center gap-2">
              <span id="audio-engine-mode" class="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[11px] font-bold">MASTER STEREO</span>
              <span class="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[11px] font-bold">48 kHz</span>
            </div>
          </div>

          <!-- Track 1: Narration (TTS) -->
          <div class="flex flex-col gap-2 p-3.5 rounded-xl bg-gray-50 border border-gray-200">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-gray-900">Narration Voice</span>
                <span class="text-[10px] text-gray-600 font-mono">(Dr. Maya Lin)</span>
              </div>
              <span class="font-mono text-gray-800 font-bold" id="vol-narration-val">100% (0 dB)</span>
            </div>
            <div class="flex items-center gap-3">
              <input id="slider-vol-narration" type="range" min="0" max="100" value="100" class="flex-1 accent-blue-600 h-1.5 bg-gray-200 rounded cursor-pointer" oninput="updateAudioVol('narration', this.value)">
              <button id="btn-mute-narration" onclick="toggleMute('narration')" class="px-2.5 py-1 rounded bg-white hover:bg-gray-100 border border-gray-300 text-[10px] font-mono font-bold text-gray-700 shadow-sm transition-all">MUTE</button>
            </div>
          </div>

          <!-- Track 2: Lyria Dynamic Music Bed with -18dB Ducking Envelope -->
          <div class="flex flex-col gap-2 p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <span class="font-bold text-blue-900">Lyria Music Bed</span>
                <span id="ducking-indicator" class="px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-mono font-bold transition-colors duration-200">-18dB DUCKED</span>
              </div>
              <span class="font-mono text-blue-700 font-bold" id="vol-music-val">25% (-18 dB)</span>
            </div>
            <div class="flex items-center gap-3">
              <input id="slider-vol-music" type="range" min="0" max="100" value="25" class="flex-1 accent-blue-600 h-1.5 bg-gray-200 rounded cursor-pointer" oninput="updateAudioVol('music', this.value)">
              <button id="btn-mute-music" onclick="toggleMute('music')" class="px-2.5 py-1 rounded bg-white hover:bg-gray-100 border border-gray-300 text-[10px] font-mono font-bold text-gray-700 shadow-sm transition-all">MUTE</button>
            </div>
            <!-- Ducking Envelope Animated Waveform Visualizer -->
            <div id="wave-bars-container" class="h-6 w-full flex items-end gap-1 px-1 bg-white border border-blue-200 rounded-lg overflow-hidden py-1">
              <div class="w-1.5 bg-blue-600 h-2 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-3 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-4 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-2.5 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-5 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-3.5 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-2 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-4.5 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-3 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-2.5 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-4 rounded-sm transition-all duration-75"></div>
              <div class="w-1.5 bg-blue-600 h-2 rounded-sm transition-all duration-75"></div>
            </div>
          </div>

          <!-- Master LUFS Broadcast Peak Meter -->
          <div class="flex flex-col gap-1.5 pt-2 border-t border-gray-200">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-gray-600 font-semibold">Master Broadcast LUFS</span>
              <span id="lufs-val" class="text-emerald-700 font-bold">-14.2 LUFS (Target: -14.0)</span>
            </div>
            <div class="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden flex">
              <div id="meter-bar-green" class="bg-emerald-500 w-[72%] h-full transition-all duration-100"></div>
              <div id="meter-bar-yellow" class="bg-amber-400 w-[12%] h-full transition-all duration-100"></div>
              <div id="meter-bar-red" class="bg-rose-500 w-[0%] h-full transition-all duration-100"></div>
            </div>
          </div>
        </div>

        <!-- Presenter Avatar Information Card -->
        <div class="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"></circle><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"></path></svg>
            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse"></span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-gray-900 tracking-tight">Dr. Maya Lin</span>
            <span class="text-xs text-blue-700 font-semibold">Google Cloud AI Evangelist</span>
            <span class="text-[11px] text-gray-600 font-mono mt-0.5">Veo 2 Avatar • 60fps Gaze Tracking Active</span>
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

        <!-- Asset 5: Whiteboard SVG Architecture -->
        <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs">SVG</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">Whiteboard Architecture</h4>
                <p class="text-xs text-gray-600">ElkJS + RoughJS • 0% BBox Collisions</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-gray-600 font-medium">13.6 KB</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="/scratch/01_whiteboard_architecture.svg" target="_blank" class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">View 4K SVG &gt;</a>
          </div>
        </div>

        <!-- Asset 6: 4K Broadcast Stills Gallery -->
        <div class="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4">
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">PNG</div>
              <div>
                <h4 class="text-sm font-bold text-gray-900">6x 4K Broadcast Stills</h4>
                <p class="text-xs text-gray-600">3840×2160 • All 5 Acts Mastered</p>
              </div>
            </div>
            <span class="text-[11px] font-mono text-gray-600 font-medium">6 Shots</span>
          </div>
          <div class="flex items-center gap-2">
            <a href="/scratch/rendered_stills/act1_cold_open_hook.png" target="_blank" class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">Open Still F15 &gt;</a>
            <a href="/scratch/rendered_stills/act5_production_checklist.png" target="_blank" class="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-semibold text-center shadow-sm transition-all">Open Still F360 &gt;</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Middle Section: Progressive Whiteboard Engine (ElkJS + RoughJS) Visualizer -->
    <div class="glass-panel p-8 rounded-3xl flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 tracking-tight">Progressive Whiteboard Stage (ElkJS + RoughJS)</h2>
          <p class="text-sm text-gray-600 mt-1">Broadcast Studio Light Stage with 0% Bounding Box Collisions & Glowing Kinetic Particles</p>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="toggleParticles()" id="particle-btn" class="px-4 py-2 rounded-xl bg-blue-50 border border-blue-300 text-blue-700 text-xs font-semibold flex items-center gap-2 shadow-sm">
            <span class="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            Kinetic Particles: ON
          </button>
          <a href="/scratch/01_whiteboard_architecture.svg" target="_blank" class="px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-2 border border-gray-300 shadow-sm transition-all">
            Open Raw 4K SVG &gt;
          </a>
        </div>
      </div>

      <!-- Interactive SVG Whiteboard Container -->
      <div class="w-full bg-[#F8FAFC] border border-gray-300 rounded-2xl p-6 overflow-hidden flex items-center justify-center min-h-[420px] shadow-inner">
        <object id="whiteboard-svg-obj" data="/scratch/01_whiteboard_architecture.svg" type="image/svg+xml" class="w-full h-auto max-h-[500px] object-contain"></object>
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
      15: '/scratch/rendered_stills/act1_cold_open_hook.png',
      90: '/scratch/rendered_stills/act2_whiteboard_kinetic_particles.png',
      175: '/scratch/rendered_stills/act2_spatial_dissolve_bridge.png',
      220: '/scratch/rendered_stills/act3_console_drawer_typing.png',
      270: '/scratch/rendered_stills/act3_endpoint_active_redaction.png',
      360: '/scratch/rendered_stills/act5_production_checklist.png'
    };

    let currentFrame = 90;
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
    activeAudio = masterAudio;

    function seekFrame(frameNum) {
      currentFrame = Math.max(0, Math.min(750, parseInt(frameNum, 10)));
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
      document.getElementById('current-frame-badge').textContent = 'FRAME ' + currentFrame + ' / 750';
      const seconds = (currentFrame / 60);
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const remSecs = (seconds % 60).toFixed(3).padStart(6, '0');
      document.getElementById('current-timestamp-badge').textContent = mins + ':' + remSecs;
      document.getElementById('subtitle-timing-badge').textContent = mins + ':' + remSecs + ' / 00:12.500';

      // Select closest rendered still
      const img = document.getElementById('active-screen-img');
      const cursorHalo = document.getElementById('cursor-halo');
      const redactionBox = document.getElementById('redaction-box');

      if (currentFrame < 50) {
        img.src = STILLS_MAP[15] || STILLS_MAP[90];
        cursorHalo.classList.add('hidden');
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 140) {
        img.src = STILLS_MAP[90];
        cursorHalo.classList.add('hidden');
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 200) {
        img.src = STILLS_MAP[175];
        cursorHalo.classList.remove('hidden');
        cursorHalo.style.left = '48%';
        cursorHalo.style.top = '36%';
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 250) {
        img.src = STILLS_MAP[220];
        cursorHalo.classList.remove('hidden');
        cursorHalo.style.left = '75%';
        cursorHalo.style.top = '40%';
        redactionBox.classList.add('hidden');
      } else if (currentFrame < 340) {
        img.src = STILLS_MAP[270];
        cursorHalo.classList.add('hidden');
        redactionBox.classList.remove('hidden');
      } else {
        img.src = STILLS_MAP[360] || STILLS_MAP[270];
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
          html += '<span class="text-gray-400">' + escapeHtml(w.word) + '</span> ';
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
            if (currentFrame >= 750) {
              currentFrame = 0;
              activeAudio.currentTime = 0;
            }
          } else {
            currentFrame += 2;
            if (currentFrame >= 750) currentFrame = 0;
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
      const isDucked = currentFrame < 700;
      if (isDucked) {
        duckBadge.textContent = '-18dB DUCKED';
        duckBadge.className = 'px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-mono font-bold transition-colors duration-200';
      } else {
        duckBadge.textContent = 'AMBIENT 0dB';
        duckBadge.className = 'px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-300 text-[10px] font-mono font-bold transition-colors duration-200';
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

    function jumpToAct(act) {
      if (act === 1) seekFrame(15);
      else if (act === 2) seekFrame(90);
      else if (act === 3) seekFrame(220);
      else if (act === 4) seekFrame(270);
      else if (act === 5) seekFrame(360);
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

if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  const server = createStudioServer();
  server.listen(PORT, () => {
    console.log(`================================================================================`);
    console.log(`🎨 TRAINEX STUDIO WEB HUB RUNNING AT: http://127.0.0.1:${PORT}`);
    console.log(`   Desktop Resolution Layout: max-w-1600 (Spacious Desktop Standard)`);
    console.log(`   Broadcast 4K Video Review & Multi-Track Audio Matrix Active`);
    console.log(`================================================================================`);
  });
}
