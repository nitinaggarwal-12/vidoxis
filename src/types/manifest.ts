import { z } from "zod";

export const PedagogicalActSchema = z.enum([
  "act1_cold_open",
  "act2_whiteboard_architecture",
  "act3_live_console_walkthrough",
  "act4_chaos_debugging",
  "act5_production_checklist"
]);

export const BeatNarrationSchema = z.object({
  text: z.string(),
  tone: z.enum(["confident_expert", "analytical", "cautionary", "encouraging"]).default("confident_expert"),
  phonemeTimelineUri: z.string().optional(),
  targetDurationSeconds: z.number()
});

export const ManifestSegmentSchema = z.object({
  id: z.string(),
  act: PedagogicalActSchema,
  title: z.string(),
  narration: BeatNarrationSchema,
  traceStepIds: z.array(z.string()),
  whiteboardTargetNodeId: z.string().optional(),
  startFrame: z.number(),
  durationFrames: z.number()
});

export const MasterSegmentManifestSchema = z.object({
  $schema: z.string().optional(),
  manifestId: z.string(),
  topicId: z.string(),
  title: z.string(),
  fps: z.number().default(60),
  resolution: z.object({
    width: z.number().default(3840),
    height: z.number().default(2160)
  }),
  cognitiveDensityScore: z.number().min(0.40),
  preGaDisclaimer: z.boolean().default(false),
  ndaWatermarkText: z.string().optional(),
  segments: z.array(ManifestSegmentSchema)
});

export type PedagogicalAct = z.infer<typeof PedagogicalActSchema>;
export type ManifestSegment = z.infer<typeof ManifestSegmentSchema>;
export type MasterSegmentManifest = z.infer<typeof MasterSegmentManifestSchema>;
