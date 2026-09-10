import { z } from "zod";

export const TelemetryBoundingBoxSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number()
});

export const TelemetryEventSchema = z.object({
  frame: z.number(),
  timestampMs: z.number(),
  stepId: z.string(),
  action: z.string(),
  cursor: z.object({
    x: z.number(),
    y: z.number(),
    state: z.enum(["moving", "dwell", "clicking", "idle"])
  }),
  targetElement: z.object({
    role: z.string().optional(),
    name: z.string().optional(),
    testId: z.string().optional(),
    bbox: TelemetryBoundingBoxSchema
  }).optional(),
  cameraSpring: z.object({
    targetX: z.number(),
    targetY: z.number(),
    currentX: z.number(),
    currentY: z.number(),
    zoom: z.number()
  }),
  isRedacted: z.boolean().default(false)
});

export const TelemetryStreamSchema = z.object({
  traceId: z.string(),
  totalFrames: z.number(),
  fps: z.number().default(60),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
    scale: z.number()
  }),
  events: z.array(TelemetryEventSchema)
});

export type TelemetryBoundingBox = z.infer<typeof TelemetryBoundingBoxSchema>;
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type TelemetryStream = z.infer<typeof TelemetryStreamSchema>;
