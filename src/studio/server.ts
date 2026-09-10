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

    // Static scratch file serving
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
          ".wav": "audio/wav",
          ".html": "text/html"
        };
        res.writeHead(200, {
          "Content-Type": contentTypes[ext] || "application/octet-stream",
          "Access-Control-Allow-Origin": "*"
        });
        fs.createReadStream(fullPath).pipe(res);
        return;
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
      }
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
<html lang="en" class="dark">
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
      darkMode: 'class',
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
              blue: '#4285F4',
              green: '#34A853',
              yellow: '#FBBC04',
              red: '#EA4335',
              dark: '#0F1115',
              card: '#181B20',
              border: '#282E38'
            }
          }
        }
      }
    }
  </script>
  <style>
    body { background-color: #0F1115; color: #E8EAED; }
    .neon-border-blue { box-shadow: 0 0 25px rgba(66, 133, 244, 0.25); }
    .glass-panel { background: rgba(24, 27, 32, 0.75); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
  </style>
</head>
<body class="font-sans antialiased min-h-screen flex flex-col selection:bg-brand-blue selection:text-white">

  <!-- Sticky Full-Width Broadcast Navbar (Spacious Desktop Rule) -->
  <header class="sticky top-0 z-50 w-full bg-brand-dark/90 backdrop-blur-xl border-b border-brand-border">
    <div class="max-w-1600 mx-auto px-10 md:px-16 h-20 flex items-center justify-between">
      <!-- Left: Logo & Micro-Version Pill -->
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-green flex items-center justify-center shadow-lg shadow-brand-blue/30">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <span class="text-2xl font-bold tracking-tight text-white">Trainex <span class="text-brand-blue font-mono font-medium text-lg">Studio</span></span>
        </div>

        <div class="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-300">
          <span class="w-2 h-2 rounded-full bg-brand-green animate-pulse"></span>
          <span>Google Chrome 153.0.8010.36 (Developer ID: Google LLC)</span>
        </div>
      </div>

      <!-- Center: 5-Act Pedagogical Arc Navigator -->
      <nav class="hidden xl:flex items-center gap-2 bg-brand-card/90 px-3 py-2 rounded-2xl border border-white/5 text-sm font-medium">
        <button onclick="jumpToAct(1)" class="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold">Act 1: Hook</button>
        <button onclick="jumpToAct(2)" class="px-4 py-2 rounded-xl text-brand-blue bg-brand-blue/15 border border-brand-blue/30 transition-all text-xs font-semibold">Act 2: Whiteboard</button>
        <button onclick="jumpToAct(3)" class="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold">Act 3: Live Console</button>
        <button onclick="jumpToAct(4)" class="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold">Act 4: Redaction</button>
        <button onclick="jumpToAct(5)" class="px-4 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold">Act 5: Checklist</button>
      </nav>

      <!-- Right: Action Controls -->
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          39/39 HOOKS PASS
        </div>
        <button onclick="reloadAllArtifacts()" class="px-5 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold tracking-wide transition-all shadow-lg shadow-brand-blue/30 flex items-center gap-2">
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
            <h2 class="text-xl font-bold text-white tracking-tight">Broadcast 4K Review Player</h2>
            <span id="active-res-badge" class="px-2.5 py-1 rounded-md bg-white/10 text-gray-300 font-mono text-xs font-semibold">3840×2160 (16:9 4K UHD)</span>
            <span class="px-2.5 py-1 rounded-md bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow font-mono text-xs font-semibold">60 FPS</span>
          </div>

          <!-- Aspect Ratio Toggle Pills -->
          <div class="flex items-center gap-1.5 bg-brand-card p-1 rounded-xl border border-white/10 text-xs font-semibold">
            <button onclick="setAspectRatio('16:9')" class="aspect-btn active px-3 py-1.5 rounded-lg bg-brand-blue text-white" data-ratio="16:9">16:9</button>
            <button onclick="setAspectRatio('4:3')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-400 hover:text-white" data-ratio="4:3">4:3</button>
            <button onclick="setAspectRatio('1:1')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-400 hover:text-white" data-ratio="1:1">1:1</button>
            <button onclick="setAspectRatio('9:16')" class="aspect-btn px-3 py-1.5 rounded-lg text-gray-400 hover:text-white" data-ratio="9:16">9:16</button>
          </div>
        </div>

        <!-- Viewport Canvas Container -->
        <div id="viewport-frame" class="w-full aspect-video rounded-2xl glass-panel relative overflow-hidden flex items-center justify-center neon-border-blue transition-all duration-300">
          <img id="active-screen-img" src="/scratch/rendered_stills/act2_whiteboard_kinetic_particles.png" alt="Broadcast Viewport" class="w-full h-full object-contain">

          <!-- Telemetry Minimum-Jerk BBox Overlay Layer -->
          <div id="telemetry-overlay" class="absolute inset-0 pointer-events-none transition-opacity duration-200">
            <!-- Dynamic Telemetry Cursor & Redaction Box -->
            <div id="cursor-halo" class="absolute w-8 h-8 rounded-full border-2 border-brand-yellow bg-brand-yellow/20 shadow-lg shadow-brand-yellow/40 transition-all duration-100 hidden" style="left: 45%; top: 38%;"></div>
            <div id="redaction-box" class="absolute border-2 border-emerald-400 bg-emerald-400/20 backdrop-blur-md rounded-md transition-all duration-200 hidden" style="left: 20%; top: 15%; width: 220px; height: 36px;">
              <span class="absolute -top-5 left-0 text-[10px] font-mono text-emerald-300 font-bold bg-black/80 px-1.5 py-0.5 rounded">+12px Safety Dilation</span>
            </div>
          </div>

          <!-- Bottom Floating Badges -->
          <div class="absolute bottom-4 left-6 flex items-center gap-3 pointer-events-none">
            <div class="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono text-gray-300 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-brand-blue"></span>
              <span id="current-frame-badge">FRAME 90 / 480</span>
            </div>
            <div class="px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono text-gray-300">
              <span id="current-timestamp-badge">00:01.500</span>
            </div>
          </div>
        </div>

        <!-- Timeline Scrubber & Transport Controls -->
        <div class="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <!-- Scrubber Range -->
          <div class="flex items-center gap-4">
            <span class="text-xs font-mono text-gray-400">00:00</span>
            <input id="timeline-slider" type="range" min="0" max="480" value="90" class="flex-1 accent-brand-blue cursor-pointer h-2 bg-gray-700 rounded-lg" oninput="onScrubFrame(this.value)">
            <span class="text-xs font-mono text-gray-400">00:08</span>
          </div>

          <!-- Control Buttons Bar -->
          <div class="flex items-center justify-between flex-wrap gap-4">
            <!-- Left: Play/Pause & Stepping -->
            <div class="flex items-center gap-2">
              <button onclick="stepFrame(-1)" class="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-mono font-bold flex items-center gap-1 border border-white/10">
                &lt; -1 Frame
              </button>
              <button id="play-pause-btn" onclick="togglePlay()" class="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-2 shadow-md shadow-brand-blue/30">
                <svg id="play-icon" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Play</span>
              </button>
              <button onclick="stepFrame(1)" class="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-mono font-bold flex items-center gap-1 border border-white/10">
                +1 Frame &gt;
              </button>
            </div>

            <!-- Middle: Quick Keyframe Selector -->
            <div class="flex items-center gap-1.5 text-xs font-mono">
              <button onclick="seekFrame(90)" class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5">F90 Whiteboard</button>
              <button onclick="seekFrame(175)" class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5">F175 Bridge</button>
              <button onclick="seekFrame(220)" class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5">F220 Drawer</button>
              <button onclick="seekFrame(270)" class="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5">F270 Redact</button>
            </div>

            <!-- Right: Playback Speed & Telemetry Toggle -->
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-xs text-gray-300 font-medium cursor-pointer">
                <input type="checkbox" id="overlay-toggle" checked onchange="toggleOverlay(this.checked)" class="rounded accent-brand-blue">
                Show Telemetry BBoxes
              </label>
              <select id="speed-select" class="bg-brand-card border border-white/10 text-xs font-mono text-gray-200 px-3 py-1.5 rounded-lg">
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

        <!-- Audio Mixer Card -->
        <div class="glass-panel p-6 rounded-2xl flex flex-col gap-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
              <h3 class="text-base font-bold text-white tracking-tight">Multi-Track Audio Engine</h3>
            </div>
            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs font-semibold">48,000 Hz WAV</span>
          </div>

          <!-- Track 1: Narration (TTS) -->
          <div class="flex flex-col gap-2 p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-gray-200">Narration Voice (Gemini TTS)</span>
              <span class="font-mono text-gray-400" id="vol-narration-val">100% (0 dB)</span>
            </div>
            <div class="flex items-center gap-3">
              <input type="range" min="0" max="100" value="100" class="flex-1 accent-brand-blue h-1.5 bg-gray-700 rounded cursor-pointer" oninput="updateAudioVol('narration', this.value)">
              <button onclick="toggleMute('narration')" class="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-gray-300">MUTE</button>
            </div>
          </div>

          <!-- Track 2: Lyria Dynamic Music Bed with -18dB Ducking Envelope -->
          <div class="flex flex-col gap-2 p-3.5 rounded-xl bg-brand-blue/10 border border-brand-blue/20">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-1.5">
                <span class="font-semibold text-white">Lyria Music Bed</span>
                <span class="px-1.5 py-0.5 rounded bg-brand-blue/30 text-brand-blue text-[10px] font-mono font-bold">-18dB DUCKED</span>
              </div>
              <span class="font-mono text-brand-blue font-semibold" id="vol-music-val">25% (-18 dB)</span>
            </div>
            <div class="flex items-center gap-3">
              <input type="range" min="0" max="100" value="25" class="flex-1 accent-brand-blue h-1.5 bg-gray-700 rounded cursor-pointer" oninput="updateAudioVol('music', this.value)">
              <button onclick="toggleMute('music')" class="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-gray-300">MUTE</button>
            </div>
            <!-- Ducking Envelope Waveform Visualizer -->
            <div class="h-6 w-full flex items-end gap-1 px-1 bg-black/40 rounded-lg overflow-hidden py-1">
              <div class="w-1.5 bg-brand-blue h-2 rounded-sm animate-pulse"></div>
              <div class="w-1.5 bg-brand-blue h-3 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-2.5 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-1.5 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-2 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-3.5 rounded-sm animate-pulse"></div>
              <div class="w-1.5 bg-brand-blue h-2 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-2.5 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-1 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-2.5 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-3 rounded-sm"></div>
              <div class="w-1.5 bg-brand-blue h-2 rounded-sm"></div>
            </div>
          </div>

          <!-- Track 3: Kinetic SFX & Chalk Audio -->
          <div class="flex flex-col gap-2 p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-semibold text-gray-200">UI Kinetic & Chalk SFX</span>
              <span class="font-mono text-gray-400" id="vol-sfx-val">70% (-6 dB)</span>
            </div>
            <div class="flex items-center gap-3">
              <input type="range" min="0" max="100" value="70" class="flex-1 accent-brand-blue h-1.5 bg-gray-700 rounded cursor-pointer" oninput="updateAudioVol('sfx', this.value)">
              <button onclick="toggleMute('sfx')" class="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px] font-mono font-bold text-gray-300">MUTE</button>
            </div>
          </div>

          <!-- Master LUFS Broadcast Peak Meter -->
          <div class="flex flex-col gap-1.5 pt-2 border-t border-white/10">
            <div class="flex items-center justify-between text-xs font-mono">
              <span class="text-gray-400">Master Loudness</span>
              <span class="text-emerald-400 font-bold">-14.2 LUFS (Target: -14.0)</span>
            </div>
            <div class="h-2 w-full bg-gray-800 rounded-full overflow-hidden flex">
              <div class="bg-emerald-500 w-[72%] h-full"></div>
              <div class="bg-brand-yellow w-[12%] h-full"></div>
              <div class="bg-brand-red w-[0%] h-full"></div>
            </div>
          </div>
        </div>

        <!-- Presenter Avatar Information Card -->
        <div class="glass-panel p-6 rounded-2xl flex items-center gap-5">
          <div class="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-blue to-purple-600 flex items-center justify-center shadow-lg shadow-brand-blue/20">
            <svg class="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"></circle><path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"></path></svg>
            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-brand-dark"></span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-bold text-white tracking-tight">Dr. Maya Lin</span>
            <span class="text-xs text-brand-blue font-medium">Google Cloud AI Evangelist</span>
            <span class="text-[11px] text-gray-400 font-mono mt-0.5">Veo 2 Avatar • 60fps Gaze Tracking Active</span>
          </div>
        </div>

      </div>
    </div>

    <!-- Middle Section: Progressive Whiteboard Engine (ElkJS + RoughJS) Visualizer -->
    <div class="glass-panel p-8 rounded-3xl flex flex-col gap-6">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 class="text-2xl font-bold text-white tracking-tight">Progressive Whiteboard Stage (ElkJS + RoughJS)</h2>
          <p class="text-sm text-gray-400 mt-1">Broadcast Obsidian Glass Stage with 0% Bounding Box Collisions & Glowing Kinetic Particles</p>
        </div>
        <div class="flex items-center gap-3">
          <button onclick="toggleParticles()" id="particle-btn" class="px-4 py-2 rounded-xl bg-brand-blue/20 border border-brand-blue/40 text-brand-blue text-xs font-semibold flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-brand-blue animate-ping"></span>
            Kinetic Particles: ON
          </button>
          <a href="/scratch/01_whiteboard_architecture.svg" target="_blank" class="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold flex items-center gap-2 border border-white/10">
            Open Raw 4K SVG &gt;
          </a>
        </div>
      </div>

      <!-- Interactive SVG Whiteboard Container -->
      <div class="w-full bg-[#0F1115] border border-white/10 rounded-2xl p-6 overflow-hidden flex items-center justify-center min-h-[420px]">
        <object id="whiteboard-svg-obj" data="/scratch/01_whiteboard_architecture.svg" type="image/svg+xml" class="w-full h-auto max-h-[500px] object-contain"></object>
      </div>

      <!-- Contract Nodes Telemetry Strip -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-brand-blue font-bold">NODE 1</span>
          <span class="text-xs font-semibold text-white">Client VPC</span>
          <span class="text-[11px] text-gray-400 font-mono">10.0.0.0/16</span>
        </div>
        <div class="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-brand-blue font-bold">NODE 2</span>
          <span class="text-xs font-semibold text-white">PSC Forwarding Rule</span>
          <span class="text-[11px] text-gray-400 font-mono">10.0.1.50</span>
        </div>
        <div class="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-brand-blue font-bold">NODE 3</span>
          <span class="text-xs font-semibold text-white">Private Service Connect</span>
          <span class="text-[11px] text-gray-400 font-mono">Zero Public IPs</span>
        </div>
        <div class="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-brand-blue font-bold">NODE 4</span>
          <span class="text-xs font-semibold text-white">Vertex AI Endpoint</span>
          <span class="text-[11px] text-gray-400 font-mono">europe-west1</span>
        </div>
        <div class="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1">
          <span class="text-[10px] font-mono text-brand-green font-bold">NODE 5</span>
          <span class="text-xs font-semibold text-white">Gemini 2.0 Flash</span>
          <span class="text-[11px] text-gray-400 font-mono">Sub-15ms Private</span>
        </div>
      </div>
    </div>

    <!-- Bottom Grid: Telemetry Stream & 39 Quality Hooks Matrix -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">

      <!-- Left 6 Cols: CDP Rehearsal Telemetry Stream -->
      <div class="xl:col-span-6 glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 class="text-lg font-bold text-white">Deterministic CDP Telemetry</h3>
          </div>
          <span class="text-xs font-mono text-gray-400">0% Flake Replay</span>
        </div>
        <div class="bg-black/60 rounded-xl p-4 font-mono text-xs text-gray-300 h-64 overflow-y-auto custom-scrollbar flex flex-col gap-2">
          <div class="text-brand-blue">▶ [Session] CDP Replayer connected to Chrome 153.0.8010.36</div>
          <div class="text-emerald-400">✔ [Step 1] Navigate to https://console.cloud.google.com/vertex-ai/models</div>
          <div class="text-gray-300">↳ [Telemetry] Mouse spline moved to [x: 480, y: 160] (Duration: 320ms)</div>
          <div class="text-emerald-400">✔ [Step 2] Click 'Deploy Model' [data-test-id='mg-deploy-btn']</div>
          <div class="text-gray-300">↳ [Telemetry] Drawer expanded to 680px width</div>
          <div class="text-emerald-400">✔ [Step 3] Type 'gemini-2-private-ep' with minimum-jerk dwell</div>
          <div class="text-emerald-400">✔ [Step 4] Verified endpoint status 'Active' with 12px dilation redaction</div>
        </div>
      </div>

      <!-- Right 6 Cols: 13 Lifecycle Events & 39 Quality Hooks -->
      <div class="xl:col-span-6 glass-panel p-6 rounded-2xl flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <h3 class="text-lg font-bold text-white">Quality Guard Engine (39 Hooks)</h3>
          </div>
          <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs font-semibold">100% Verified</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs font-mono h-64 overflow-y-auto custom-scrollbar p-1">
          <div class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">sandbox_project_id_firewall</span>
            <span class="text-emerald-400">✔ PASS</span>
          </div>
          <div class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">validate_manifest_schema</span>
            <span class="text-emerald-400">✔ PASS</span>
          </div>
          <div class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">whiteboard_bbox_collision_audit</span>
            <span class="text-emerald-400">✔ PASS</span>
          </div>
          <div class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">triad_selector_shadow_dom</span>
            <span class="text-emerald-400">✔ PASS</span>
          </div>
          <div class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">headless_rehearsal_matrix</span>
            <span class="text-emerald-400">✔ PASS</span>
          </div>
          <div class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">google_signed_chrome_guard</span>
            <span class="text-emerald-400">✔ PASS</span>
          </div>
          <div class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">zero_blank_frame_audit</span>
            <span class="text-emerald-400">✔ PASS</span>
          </div>
          <div class="p-2 rounded bg-white/5 border border-white/5 flex items-center justify-between">
            <span class="text-gray-300 truncate">redaction_bounding_box_dilation</span>
            <span class="text-emerald-400">✔ PASS</span>
          </div>
        </div>
      </div>

    </div>

  </main>

  <!-- Broadcast Audio Elements (Simulated Web Audio Context) -->
  <script>
    const STILLS_MAP = {
      90: '/scratch/rendered_stills/act2_whiteboard_kinetic_particles.png',
      175: '/scratch/rendered_stills/act2_spatial_dissolve_bridge.png',
      220: '/scratch/rendered_stills/act3_console_drawer_typing.png',
      270: '/scratch/rendered_stills/act3_endpoint_active_redaction.png'
    };

    let currentFrame = 90;
    let isPlaying = false;
    let playInterval = null;

    function seekFrame(frameNum) {
      currentFrame = parseInt(frameNum, 10);
      document.getElementById('timeline-slider').value = currentFrame;
      updateFrameDisplay();
    }

    function onScrubFrame(val) {
      currentFrame = parseInt(val, 10);
      updateFrameDisplay();
    }

    function stepFrame(delta) {
      currentFrame = Math.max(0, Math.min(480, currentFrame + delta));
      document.getElementById('timeline-slider').value = currentFrame;
      updateFrameDisplay();
    }

    function updateFrameDisplay() {
      document.getElementById('current-frame-badge').textContent = 'FRAME ' + currentFrame + ' / 480';
      const seconds = (currentFrame / 60).toFixed(3);
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const remSecs = (seconds % 60).toFixed(3).padStart(6, '0');
      document.getElementById('current-timestamp-badge').textContent = mins + ':' + remSecs;

      // Select closest rendered still
      const img = document.getElementById('active-screen-img');
      const cursorHalo = document.getElementById('cursor-halo');
      const redactionBox = document.getElementById('redaction-box');

      if (currentFrame < 140) {
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
      } else {
        img.src = STILLS_MAP[270];
        cursorHalo.classList.add('hidden');
        redactionBox.classList.remove('hidden');
      }
    }

    function togglePlay() {
      isPlaying = !isPlaying;
      const btn = document.getElementById('play-pause-btn');
      if (isPlaying) {
        btn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg><span>Pause</span>';
        playInterval = setInterval(() => {
          if (currentFrame >= 480) {
            currentFrame = 0;
          }
          currentFrame += 2;
          document.getElementById('timeline-slider').value = currentFrame;
          updateFrameDisplay();
        }, 33);
      } else {
        btn.innerHTML = '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Play</span>';
        clearInterval(playInterval);
      }
    }

    function setAspectRatio(ratio) {
      const frame = document.getElementById('viewport-frame');
      const badge = document.getElementById('active-res-badge');
      document.querySelectorAll('.aspect-btn').forEach(b => {
        b.classList.remove('bg-brand-blue', 'text-white');
        b.classList.add('text-gray-400');
      });
      const activeBtn = document.querySelector('.aspect-btn[data-ratio="' + ratio + '"]');
      if (activeBtn) {
        activeBtn.classList.add('bg-brand-blue', 'text-white');
        activeBtn.classList.remove('text-gray-400');
      }

      frame.className = 'w-full rounded-2xl glass-panel relative overflow-hidden flex items-center justify-center neon-border-blue transition-all duration-300';
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
        btn.classList.remove('text-brand-blue');
        btn.classList.add('text-gray-400');
      } else {
        btn.innerHTML = '<span class="w-2 h-2 rounded-full bg-brand-blue animate-ping"></span>Kinetic Particles: ON';
        btn.classList.add('text-brand-blue');
        btn.classList.remove('text-gray-400');
      }
    }

    function jumpToAct(act) {
      if (act === 1) seekFrame(0);
      else if (act === 2) seekFrame(90);
      else if (act === 3) seekFrame(220);
      else if (act === 4) seekFrame(270);
      else if (act === 5) seekFrame(360);
    }

    function reloadAllArtifacts() {
      window.location.reload();
    }

    function updateAudioVol(track, val) {
      document.getElementById('vol-' + track + '-val').textContent = val + '%';
    }

    function toggleMute(track) {
      const valEl = document.getElementById('vol-' + track + '-val');
      if (valEl.textContent.includes('MUTED')) {
        valEl.textContent = '100%';
      } else {
        valEl.textContent = 'MUTED';
      }
    }
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
