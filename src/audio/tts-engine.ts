import fs from "node:fs";
import path from "node:path";

export interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
  startFrame: number;
  endFrame: number;
}

export interface SubtitleSegmentData {
  actId: string;
  actName: string;
  text: string;
  startMs: number;
  endMs: number;
  startFrame: number;
  endFrame: number;
  words: WordTiming[];
}

export interface NarrationManifest {
  courseTitle: string;
  voicePersona: string;
  sampleRate: number;
  channels: number;
  totalDurationMs: number;
  totalFrames: number;
  segments: SubtitleSegmentData[];
}

export const FIVE_ACT_SCRIPT = [
  {
    actId: "act1_hook",
    actName: "Act 1: Cold Open Hook",
    text: "Welcome to Vidoxis. Today we architect zero-egress Gemini 2.0 private endpoints on Google Cloud.",
    durationMs: 2500
  },
  {
    actId: "act2_whiteboard",
    actName: "Act 2: Architecture Synthesis",
    text: "Notice the progressive whiteboard topology. We isolate traffic inside the Client VPC with Private Service Connect.",
    durationMs: 2500
  },
  {
    actId: "act3_console",
    actName: "Act 3: Live Console Walkthrough",
    text: "In the live Google Cloud Console, watch the Model Garden deployment drawer slide smoothly into place.",
    durationMs: 2500
  },
  {
    actId: "act4_redaction",
    actName: "Act 4: Chaos & Redaction",
    text: "Zero public IPs, sub-15ms latency, and all billing credentials are sanitized with a twelve-pixel dilation boundary.",
    durationMs: 2500
  },
  {
    actId: "act5_checklist",
    actName: "Act 5: Production Checklist",
    text: "This architecture is hardened, production-ready, and compliant with Alphabet Zero-Trust security baselines.",
    durationMs: 2500
  }
];

export function computeWordTimings(text: string, startOffsetMs: number, totalDurationMs: number): WordTiming[] {
  const rawWords = text.split(/\s+/).filter(Boolean);
  const weights = rawWords.map(w => {
    let weight = Math.pow(Math.max(w.length, 2), 0.75);
    if (/[,:;]$/.test(w)) weight += 1.8;
    if (/[.!?]$/.test(w) || /\.\.\.$/.test(w)) weight += 3.2;
    return weight;
  });
  const totalWeight = weights.reduce((sum, val) => sum + val, 0);

  let currentMs = startOffsetMs;
  return rawWords.map((word, idx) => {
    const duration = (weights[idx] / totalWeight) * totalDurationMs;
    const startMs = Math.round(currentMs);
    const endMs = Math.round(currentMs + duration);
    currentMs += duration;

    return {
      word,
      startMs,
      endMs,
      startFrame: Math.round((startMs / 1000) * 60),
      endFrame: Math.round((endMs / 1000) * 60)
    };
  });
}

export function generatePcmWav(
  samples: Float32Array,
  sampleRate = 48000,
  numChannels = 1
): Buffer {
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // fmt subchunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat: 1 (PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit PCM samples with clipping protection
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 32768 : s * 32767;
    buffer.writeInt16LE(Math.round(intSample), offset);
    offset += 2;
  }

  return buffer;
}

/**
 * REMOVED: synthetic sine-wave "narration" generator.
 *
 * This previously wrote a multi-harmonic sine tone (135/520/1750 Hz) to
 * scratch/narration.wav under a "DeepMind Expressive Neural Core" label. The
 * renderer cannot distinguish that file from real speech, so it silently
 * poisoned the master with a buzzing tone.
 *
 * Real narration is produced by src/audio/synthesize-natural-audio.ts, which
 * calls the Google Cloud Text-to-Speech API (en-US-Journey-F, 48 kHz LINEAR16)
 * and also emits scratch/phonemes.json for the karaoke subtitle track.
 */
export async function synthesizeDeepMindNarration(): Promise<never> {
  throw new Error(
    "synthesizeDeepMindNarration() has been removed: it generated synthetic sine-wave " +
      "audio, not speech. Run `npm run audio` (src/audio/synthesize-natural-audio.ts) " +
      "to produce real Cloud TTS narration into scratch/narration.wav."
  );
}

/**
 * Builds the word/act subtitle timeline from FIVE_ACT_SCRIPT without
 * synthesizing any audio. Safe to use for timing math and tests.
 */
export function buildNarrationTimeline(): NarrationManifest {
  let currentOffsetMs = 0;
  const segments: SubtitleSegmentData[] = [];

  for (const act of FIVE_ACT_SCRIPT) {
    const words = computeWordTimings(act.text, currentOffsetMs, act.durationMs);
    segments.push({
      actId: act.actId,
      actName: act.actName,
      text: act.text,
      startMs: currentOffsetMs,
      endMs: currentOffsetMs + act.durationMs,
      startFrame: Math.round((currentOffsetMs / 1000) * 60),
      endFrame: Math.round(((currentOffsetMs + act.durationMs) / 1000) * 60),
      words
    });
    currentOffsetMs += act.durationMs;
  }

  return {
    courseTitle: "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
    voicePersona: "en-US-Journey-F (Google Cloud Text-to-Speech)",
    sampleRate: 48000,
    channels: 1,
    totalDurationMs: currentOffsetMs,
    totalFrames: Math.round((currentOffsetMs / 1000) * 60),
    segments
  };
}
