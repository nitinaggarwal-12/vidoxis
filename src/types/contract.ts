import { z } from "zod";

export const ArchitectureNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(["client", "ingress", "compute", "storage", "ai", "security"]),
  cloudIcon: z.string().optional(),
  description: z.string().optional(),
  zone: z.enum([
    "ingress_edge",
    "app_mesh",
    "event_streaming",
    "vertex_ai",
    "lakehouse_db",
    "zero_trust_baseline"
  ]).optional(),
  techSpec: z.string().optional(),
  badge: z.string().optional(),
  details: z.array(z.string()).optional()
});

export const ArchitectureEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  protocol: z.string().default("HTTPS"),
  flowType: z.enum([
    "user_flow",
    "process_flow",
    "data_flow",
    "security_flow",
    "control_plane",
    "data_plane"
  ]).default("data_flow"),
  ratePps: z.number().default(100)
});

export const CanonicalTopologyContractSchema = z.object({
  $schema: z.string().optional(),
  topicId: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  globalParameters: z.object({
    projectId: z.string(),
    region: z.string(),
    zone: z.string().optional(),
    vpcNetwork: z.string().optional(),
    subnetwork: z.string().optional(),
    sla: z.string().optional()
  }),
  architectureGraph: z.object({
    nodes: z.array(ArchitectureNodeSchema),
    edges: z.array(ArchitectureEdgeSchema)
  }),
  demoActionParameters: z.record(z.union([z.string(), z.number(), z.boolean()]))
});

export type ArchitectureNode = z.infer<typeof ArchitectureNodeSchema>;
export type ArchitectureEdge = z.infer<typeof ArchitectureEdgeSchema>;
export type CanonicalTopologyContract = z.infer<typeof CanonicalTopologyContractSchema>;
