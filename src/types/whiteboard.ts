import { z } from "zod";

export const WhiteboardNodeTypeSchema = z.enum([
  "actor",
  "client_app",
  "gateway",
  "auth_service",
  "load_balancer",
  "microservice",
  "database",
  "queue",
  "ai_endpoint",
  "security_shield"
]);

export const WhiteboardFlowTypeSchema = z.enum([
  "user_flow",
  "process_flow",
  "data_flow"
]);

export const WhiteboardElementSchema = z.object({
  id: z.string(),
  label: z.string(),
  subLabel: z.string().optional(),
  type: WhiteboardNodeTypeSchema,
  flow: WhiteboardFlowTypeSchema,
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  drawStartFrame: z.number(),
  drawDurationFrames: z.number(),
  color: z.string(),
  accentGlow: z.string().optional(),
  cloudIcon: z.string().optional()
});

export const WhiteboardEdgeSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  flow: WhiteboardFlowTypeSchema,
  protocol: z.string().default("HTTPS"),
  payloadType: z.string().optional(),
  ratePps: z.number().default(100),
  color: z.string().default("#38BDF8"),
  drawStartFrame: z.number(),
  drawDurationFrames: z.number(),
  points: z.array(z.object({ x: z.number(), y: z.number() })).optional()
});

export const WhiteboardManifestSchema = z.object({
  $schema: z.string().optional(),
  whiteboardId: z.string(),
  topicId: z.string(),
  theme: z.enum(["digital_glassboard", "studio_blueprint"]).default("digital_glassboard"),
  canvas: z.object({
    width: z.number().default(3840),
    height: z.number().default(2160)
  }),
  totalFrames: z.number(),
  elements: z.array(WhiteboardElementSchema),
  edges: z.array(WhiteboardEdgeSchema),
  spatialHandoff: z.object({
    targetElementId: z.string(),
    zoomFactor: z.number().default(2.0),
    transitionStartFrame: z.number(),
    transitionDurationFrames: z.number().default(36)
  })
});

export type WhiteboardNodeType = z.infer<typeof WhiteboardNodeTypeSchema>;
export type WhiteboardFlowType = z.infer<typeof WhiteboardFlowTypeSchema>;
export type WhiteboardElement = z.infer<typeof WhiteboardElementSchema>;
export type WhiteboardEdge = z.infer<typeof WhiteboardEdgeSchema>;
export type WhiteboardManifest = z.infer<typeof WhiteboardManifestSchema>;
