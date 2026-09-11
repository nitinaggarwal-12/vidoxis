import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { generateLyriaMusicBedAndMasterMix } from "./lyria-scoring.js";

export interface VoicePreset {
  id: string;
  name: string;
  role: string;
  gender: "female" | "male";
  style: string;
  badge: string;
  avatarSeed: string;
}

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: "en-US-Journey-F",
    name: "Dr. Maya Lin",
    role: "Google Cloud AI Evangelist",
    gender: "female",
    style: "Warm, authoritative & natural phrasing",
    badge: "RECOMMENDED",
    avatarSeed: "maya"
  },
  {
    id: "en-US-Journey-D",
    name: "Alex Chen",
    role: "Principal Solutions Architect",
    gender: "male",
    style: "Deep, conversational & precise cadence",
    badge: "CONVERSATIONAL",
    avatarSeed: "alex"
  },
  {
    id: "en-US-Journey-O",
    name: "Elena Vance",
    role: "Executive Keynote Presenter",
    gender: "female",
    style: "Dynamic, energetic & keynote polished",
    badge: "DYNAMIC",
    avatarSeed: "elena"
  },
  {
    id: "en-US-Studio-O",
    name: "Sarah Jenkins",
    role: "Cloud Engineering Lead",
    gender: "female",
    style: "Studio-mastered broadcast clarity",
    badge: "STUDIO BROADCAST",
    avatarSeed: "sarah"
  },
  {
    id: "en-US-Studio-Q",
    name: "David Ross",
    role: "Enterprise Infrastructure Director",
    gender: "male",
    style: "Commanding, resonant enterprise delivery",
    badge: "ENTERPRISE",
    avatarSeed: "david"
  }
];

export interface ScriptSegment {
  actId: string;
  actName: string;
  text: string;
}

export const DEFAULT_SCRIPT: ScriptSegment[] = [
  {
    actId: "act1_hook",
    actName: "Act 1: Cold Open Hook",
    text: "Welcome to Vidoxis. Today we architect zero-egress Gemini private endpoints on Google Cloud."
  },
  {
    actId: "act2_whiteboard",
    actName: "Act 2: Architecture Synthesis",
    text: "Notice the progressive whiteboard topology. We isolate traffic inside the Client VPC with Private Service Connect."
  },
  {
    actId: "act3_console_step1",
    actName: "Act 3: Model Garden & Discovery",
    text: "In the live Google Cloud Console, explore Vertex AI Model Garden and select Gemini 3.1 Pro for enterprise orchestration."
  },
  {
    actId: "act3_console_step2",
    actName: "Act 3: Security & Observability",
    text: "Configure Customer Managed Encryption Keys via Cloud KMS Autokey and verify sub-15ms latency on Cloud Run."
  },
  {
    actId: "act5_checklist",
    actName: "Act 5: Production Checklist",
    text: "BigQuery Studio lakehouse connected with zero egress. Production checklist verified. Deploy with confidence."
  }
];

export interface SynthesisCustomizationOptions {
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
  duckingDb?: number;
  script?: ScriptSegment[];
}

function getAccessToken(): string {
  return execSync("gcloud auth print-access-token", { encoding: "utf-8" }).trim();
}

async function synthesizeSpeech(
  text: string,
  token: string,
  voiceName = "en-US-Journey-F",
  speakingRate = 1.05,
  pitch = 0.0
): Promise<Buffer> {
  const url = "https://texttospeech.googleapis.com/v1/text:synthesize";
  const body = {
    input: { text },
    voice: {
      languageCode: "en-US",
      name: voiceName
    },
    audioConfig: {
      audioEncoding: "LINEAR16",
      sampleRateHertz: 48000,
      speakingRate,
      pitch
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "X-Goog-User-Project": "vertex-ai-493102",
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TTS API failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return Buffer.from(data.audioContent, "base64");
}

function computeWordTimings(text: string, startMs: number, durationMs: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const weights = words.map(w => {
    let weight = Math.pow(Math.max(w.length, 2), 0.75);
    if (/[,:;]$/.test(w)) weight += 1.8;
    if (/[.!?]$/.test(w)) weight += 3.2;
    return weight;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let currentStart = startMs;
  return words.map((word, idx) => {
    const wordDur = (weights[idx] / totalWeight) * durationMs;
    const item = {
      word,
      startMs: Math.round(currentStart),
      endMs: Math.round(currentStart + wordDur),
      startFrame: Math.round((currentStart / 1000) * 60),
      endFrame: Math.round(((currentStart + wordDur) / 1000) * 60)
    };
    currentStart += wordDur;
    return item;
  });
}

function writeWavHeader(sampleCount: number, sampleRate = 48000, channels = 1): Buffer {
  const buffer = Buffer.alloc(44);
  const dataSize = sampleCount * channels * 2;
  const fileSize = 36 + dataSize;

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(fileSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

export async function generateNaturalNarratorAndLyriaAudio(
  options: SynthesisCustomizationOptions = {}
) {
  const voiceName = options.voiceName || "en-US-Journey-F";
  const speakingRate = options.speakingRate || 1.05;
  const pitch = options.pitch || 0.0;
  const duckingDb = options.duckingDb !== undefined ? options.duckingDb : -18;
  const script = options.script || DEFAULT_SCRIPT;

  const matchedVoice = VOICE_PRESETS.find(v => v.id === voiceName) || {
    id: voiceName,
    name: "Custom Persona",
    role: "Google Cloud Evangelist",
    badge: "CUSTOM",
    gender: "female",
    style: "Configured neural voice",
    avatarSeed: "custom"
  };

  console.log("================================================================================");
  console.log(`🎙️ SYNTHESIZING NATURAL NEURAL NARRATOR: ${matchedVoice.name} (${voiceName})`);
  console.log(`   Speed: ${speakingRate}x | Pitch: ${pitch} | Ducking: ${duckingDb}dB`);
  console.log("================================================================================");

  const token = getAccessToken();
  console.log("✔ Acquired Google Cloud ADC Access Token");

  const scratchDir = path.resolve(process.cwd(), "scratch");
  fs.mkdirSync(scratchDir, { recursive: true });

  const pcmBuffers: Buffer[] = [];
  const segments: any[] = [];
  let currentOffsetMs = 0;

  for (let i = 0; i < script.length; i++) {
    const act = script[i];
    console.log(`[${i + 1}/${script.length}] Synthesizing "${act.actName}"...`);
    const wavWithHeader = await synthesizeSpeech(act.text, token, voiceName, speakingRate, pitch);
    
    // Extract raw PCM (skip 44 bytes header)
    const rawPcm = wavWithHeader.subarray(44);
    const sampleCount = rawPcm.length / 2;
    const durationMs = Math.round((sampleCount / 48000) * 1000);

    const words = computeWordTimings(act.text, currentOffsetMs, durationMs);
    segments.push({
      actId: act.actId,
      actName: act.actName,
      text: act.text,
      startMs: currentOffsetMs,
      endMs: currentOffsetMs + durationMs,
      startFrame: Math.round((currentOffsetMs / 1000) * 60),
      endFrame: Math.round(((currentOffsetMs + durationMs) / 1000) * 60),
      words
    });

    pcmBuffers.push(rawPcm);
    currentOffsetMs += durationMs;

    // Add 350ms pause between sections
    if (i < script.length - 1) {
      const pauseSamples = Math.round(0.35 * 48000);
      const pausePcm = Buffer.alloc(pauseSamples * 2);
      pcmBuffers.push(pausePcm);
      currentOffsetMs += 350;
    }
  }

  // Combine full PCM narration
  const totalPcm = Buffer.concat(pcmBuffers);
  const totalSamples = totalPcm.length / 2;
  const header = writeWavHeader(totalSamples, 48000, 1);
  const narrationWav = Buffer.concat([header, totalPcm]);

  const narrationPath = path.join(scratchDir, "narration.wav");
  fs.writeFileSync(narrationPath, narrationWav);
  console.log(`✔ Exported Natural Narrator Audio: ${narrationPath} (${(narrationWav.length / 1024 / 1024).toFixed(2)} MB, ${(totalSamples / 48000).toFixed(2)}s)`);

  // Write phonemes / subtitles manifest
  const manifest = {
    courseTitle: "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
    voicePersona: `${matchedVoice.name} (${voiceName})`,
    voiceMetadata: matchedVoice,
    sampleRate: 48000,
    channels: 1,
    totalDurationMs: currentOffsetMs,
    totalFrames: Math.round((currentOffsetMs / 1000) * 60),
    segments
  };
  const phonemesPath = path.join(scratchDir, "phonemes.json");
  fs.writeFileSync(phonemesPath, JSON.stringify(manifest, null, 2));
  console.log(`✔ Exported Real-Time Subtitles & Phoneme Alignment: ${phonemesPath}`);

  // Generate Lyria music bed with customized ducking
  console.log("\n🎵 Composing Lyria Keynote Ambient Score & Lookahead Ducking...");
  const lyriaResult = await generateLyriaMusicBedAndMasterMix({
    outputDir: scratchDir,
    phonemesManifestPath: phonemesPath,
    totalDurationMs: currentOffsetMs,
    sampleRate: 48000,
    duckingDb
  });

  console.log(`✔ Lyria Music Bed: ${lyriaResult.musicBedPath}`);
  console.log(`✔ Broadcast Master Audio: ${lyriaResult.masterAudioPath}`);

  return {
    narrationPath,
    phonemesPath,
    musicBedPath: lyriaResult.musicBedPath,
    masterAudioPath: lyriaResult.masterAudioPath,
    voiceMetadata: matchedVoice,
    totalDurationSec: (totalSamples / 48000).toFixed(2)
  };
}

if (process.argv[1] && process.argv[1].endsWith("synthesize-natural-audio.ts")) {
  generateNaturalNarratorAndLyriaAudio().catch(err => {
    console.error("Audio generation failed:", err);
    process.exit(1);
  });
}
