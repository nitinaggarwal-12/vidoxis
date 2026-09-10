import { z } from "zod";

export const ArchitectureNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(["client", "ingress", "compute", "storage", "ai", "security"]),
  cloudIcon: z.string().optional(),
  description: z.string().optional()
});

export const ArchitectureEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  protocol: z.enum(["HTTP/S", "HTTP", "HTTPS", "gRPC", "TCP", "WebSocket", "Internal"]).default("HTTP/S"),
  flowType: z.enum(["control_plane", "data_plane"]).default("data_plane"),
  ratePps: z.number().default(100)
});

export const CanonicalTopologyContractSchema = z.object({
  $schema: z.string().optional(),
  topicId: z.string(),
  title: z.string(),
  globalParameters: z.object({
    projectId: z.string(),
    region: z.string(),
    zone: z.string().optional(),
    vpcNetwork: z.string().optional(),
    subnetwork: z.string().optional()
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
