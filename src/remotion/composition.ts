import { MasterSegmentManifest } from "../types/manifest.js";
import { StepTrace } from "../types/trace.js";
import { TelemetryStream } from "../types/telemetry.js";
import { WhiteboardManifest } from "../types/whiteboard.js";

export interface VidoxisMasterCompositionProps {
  manifest: MasterSegmentManifest;
  whiteboardManifest: WhiteboardManifest;
  trace: StepTrace;
  telemetry: TelemetryStream;
  assets: {
    narrationWavUri?: string;
    screencastMp4Uri?: string;
    avatarMp4Uri?: string;
    lyriaScoreUri?: string;
  };
}

export type TrainexMasterCompositionProps = VidoxisMasterCompositionProps;

export interface CompositionLayerConfig {
  name: string;
  zIndex: number;
  description: string;
}

export const MASTER_LAYERS: CompositionLayerConfig[] = [
  { name: "ScreencastRaw", zIndex: 1, description: "Raw headless Chrome capture at 1920x1080 DPR 2" },
  { name: "CameraSpringPanZoom", zIndex: 5, description: "Critically damped spring camera controller (k=180, c=18)" },
  { name: "ProgressiveWhiteboard", zIndex: 10, description: "Hand-drawn RoughJS + ElkJS multi-flow canvas with particle streams" },
  { name: "SyntheticCursorHalo", zIndex: 15, description: "Minimum-Jerk cursor with animated frosted halo ripple" },
  { name: "VeoAvatarPresenter", zIndex: 20, description: "4K Alpha-masked talking avatar with gaze tracking" },
  { name: "ComplianceAndDisclaimers", zIndex: 30, description: "Gaussian blur PII redaction, NDA watermarks, Pre-GA slates" },
  { name: "DualChannelCaptions", zIndex: 40, description: "CEA-608 & styled WebVTT captions" }
];

export function getCompositionDimensions(): { width: number; height: number; fps: number } {
  return {
    width: 3840,
    height: 2160,
    fps: 60
  };
}

export function calculateAudioMix(frame: number, isNarrationActive: boolean): { narrationVol: number; musicVol: number; sfxVol: number } {
  // -18dB lookahead ducking when speech is active
  const musicVol = isNarrationActive ? 0.12 : 0.65;
  return {
    narrationVol: 1.0,
    musicVol,
    sfxVol: 0.5
  };
}
