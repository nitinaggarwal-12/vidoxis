import { CanonicalTopologyContractSchema, CanonicalTopologyContract } from "../src/types/contract.js";

export const sampleContract: CanonicalTopologyContract = {
  topicId: "vertex_gemini_private_endpoint",
  title: "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
  globalParameters: {
    projectId: "trainex-sandbox-8f2a",
    region: "us-central1",
    zone: "us-central1-a",
    vpcNetwork: "vpc-prod-private",
    subnetwork: "subnet-us-central1"
  },
  architectureGraph: {
    nodes: [
      {
        id: "actor_client",
        label: "Enterprise Client Application",
        category: "client",
        description: "Mobile/Web clients connecting over mutual TLS"
      },
      {
        id: "cloud_armor",
        label: "Cloud Armor Security Policy",
        category: "security",
        description: "WAF rate limiting & geo-fencing rules"
      },
      {
        id: "internal_alb",
        label: "Internal Application Load Balancer",
        category: "ingress",
        description: "Private regional ALB with Envoy proxying"
      },
      {
        id: "api_gateway",
        label: "API Gateway Service",
        category: "compute",
        description: "Cloud Run container validating JWT tokens"
      },
      {
        id: "vertex_endpoint",
        label: "Gemini 2.0 Flash Private Endpoint",
        category: "ai",
        description: "Vertex AI Prediction endpoint bound to private PSC"
      }
    ],
    edges: [
      {
        id: "edge_client_armor",
        source: "actor_client",
        target: "cloud_armor",
        protocol: "HTTPS",
        flowType: "data_plane",
        ratePps: 150
      },
      {
        id: "edge_armor_alb",
        source: "cloud_armor",
        target: "internal_alb",
        protocol: "TCP",
        flowType: "control_plane",
        ratePps: 150
      },
      {
        id: "edge_alb_gateway",
        source: "internal_alb",
        target: "api_gateway",
        protocol: "HTTP/S",
        flowType: "data_plane",
        ratePps: 150
      },
      {
        id: "edge_gateway_vertex",
        source: "api_gateway",
        target: "vertex_endpoint",
        protocol: "gRPC",
        flowType: "data_plane",
        ratePps: 200
      }
    ]
  },
  demoActionParameters: {
    endpoint_display_name: "gemini-2-flash-prod",
    min_replicas: 1,
    max_replicas: 5,
    machine_type: "n1-standard-4"
  }
};

export function testContractValidation(): boolean {
  console.log("▶ [Test 1] Validating Canonical Topology Contract against Zod schema...");
  const parsed = CanonicalTopologyContractSchema.safeParse(sampleContract);
  if (!parsed.success) {
    console.error("❌ Contract schema validation failed:", parsed.error);
    return false;
  }
  console.log(`✔ Contract validated: "${sampleContract.title}" (${sampleContract.architectureGraph.nodes.length} nodes, ${sampleContract.architectureGraph.edges.length} edges)`);
  return true;
}
