import { CanonicalTopologyContractSchema, CanonicalTopologyContract } from "../src/types/contract.js";

export const sampleContract: CanonicalTopologyContract = {
  topicId: "vertex_gemini_private_endpoint",
  title: "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
  subtitle: "Zero-Egress Private Service Connect • Cloud Armor WAF • Vertex AI ScaNN • BigQuery Lakehouse",
  globalParameters: {
    projectId: "trainex-sandbox-8f2a",
    region: "us-central1",
    zone: "us-central1-a",
    vpcNetwork: "vpc-prod-private",
    subnetwork: "subnet-us-central1",
    sla: "99.999% High Availability"
  },
  architectureGraph: {
    nodes: [
      // ZONE 1: INGRESS & EDGE GATEWAY (Left Column)
      {
        id: "actor_client",
        label: "Enterprise Client Ingress",
        category: "client",
        zone: "ingress_edge",
        cloudIcon: "client",
        description: "Mobile / Web Ingress Gateway",
        techSpec: "TLS 1.3 / HTTP/3",
        badge: "CLIENT INGRESS",
        details: ["Global Anycast PoPs", "mTLS 1.3 Authorized Ingress"]
      },
      {
        id: "cloud_cdn",
        label: "Cloud CDN & Media Edge",
        category: "ingress",
        zone: "ingress_edge",
        cloudIcon: "cloud_cdn",
        description: "Anycast Edge Content Cache",
        techSpec: "p99 <8ms • Edge Hits",
        badge: "EDGE CACHE",
        details: ["Dynamic Content Caching", "Cloud Storage Byte Serving"]
      },
      {
        id: "cloud_armor",
        label: "Cloud Armor Security Policy",
        category: "security",
        zone: "ingress_edge",
        cloudIcon: "cloud_armor",
        description: "Adaptive DDoS & L7 WAF Shield",
        techSpec: "CRS 3.3 • 10k req/min",
        badge: "L7 SECURITY",
        details: ["OWASP Top 10 Mitigation", "Adaptive Layer 3/7 DDoS Defense"]
      },
      {
        id: "external_alb",
        label: "Global External HTTPS LB",
        category: "ingress",
        zone: "ingress_edge",
        cloudIcon: "cloud_load_balancing",
        description: "Global Anycast L7 Application LB",
        techSpec: "p99 SSL <12ms",
        badge: "ANYCAST LB",
        details: ["Single Anycast Virtual IP", "Global SSL Acceleration"]
      },

      // ZONE 2: APPLICATION CORE MESH (VPC 10.128.0.0/16)
      {
        id: "gke_autopilot",
        label: "GKE Autopilot Microservices",
        category: "compute",
        zone: "app_mesh",
        cloudIcon: "gke",
        description: "Cilium Mesh Container Cluster",
        techSpec: "c3-standard-8 • Cilium CNI",
        badge: "K8S MESH",
        details: ["Keyless Workload Identity", "Horizontal Pod Autoscaling (HPA)"]
      },
      {
        id: "api_gateway",
        label: "Cloud Run API Gateway",
        category: "compute",
        zone: "app_mesh",
        cloudIcon: "cloud_run",
        description: "Gen 2 Serverless Microservices",
        techSpec: "Direct Serverless VPC Egress",
        badge: "SERVERLESS",
        details: ["0-to-N Fast Cold Starts", "JWT Token Validation"]
      },
      {
        id: "memorystore",
        label: "Cloud Memorystore (Redis HA)",
        category: "storage",
        zone: "app_mesh",
        cloudIcon: "memorystore",
        description: "Sub-millisecond Session & Response Cache",
        techSpec: "Sub-ms Latency • In-Memory",
        badge: "CACHE MESH",
        details: ["Multi-Zone Automatic Failover", "Active Session Store"]
      },

      // ZONE 3: REAL-TIME EVENT STREAMING & INGESTION (Subnet 10.128.32.0/20)
      {
        id: "pubsub",
        label: "Cloud Pub/Sub Messaging Bus",
        category: "storage",
        zone: "event_streaming",
        cloudIcon: "pubsub",
        description: "High-Throughput Global Event Fabric",
        techSpec: "100k msg/sec • Exactly-Once",
        badge: "EVENT BUS",
        details: ["Dead-Letter Queue Buffering", "Zero-Data-Loss Ordering"]
      },
      {
        id: "dataflow",
        label: "Cloud Dataflow (Apache Beam)",
        category: "compute",
        zone: "event_streaming",
        cloudIcon: "dataflow",
        description: "Serverless Stream Transformation Pipeline",
        techSpec: "Streaming Engine Gen 2",
        badge: "STREAMING ETL",
        details: ["Sliding Window Aggregation", "Direct Lakehouse Sink"]
      },

      // ZONE 4: VERTEX AI & INTELLIGENCE HUB (Google Services Network / PSC)
      {
        id: "model_armor",
        label: "Vertex AI Model Armor",
        category: "security",
        zone: "vertex_ai",
        cloudIcon: "model_armor",
        description: "Real-Time Prompt Injection & Safety Guardrail",
        techSpec: "p99 <15ms Inspection",
        badge: "AI GUARDRAILS",
        details: ["Prompt Injection Defense", "PII & Jailbreak Sanitization"]
      },
      {
        id: "vertex_endpoint",
        label: "Gemini 2.0 Flash Private Endpoint",
        category: "ai",
        zone: "vertex_ai",
        cloudIcon: "vertex_ai",
        description: "Vertex AI Dedicated Model Pool via PSC",
        techSpec: "Dedicated PSC • Zero Egress",
        badge: "FOUNDATION AI",
        details: ["Multimodal Inference Engine", "Isolated Tenant Network"]
      },
      {
        id: "vector_search",
        label: "Vertex Vector Search (ScaNN)",
        category: "ai",
        zone: "vertex_ai",
        cloudIcon: "vector_search",
        description: "Billion-Scale Low-Latency Vector Similarity",
        techSpec: "p99 <5ms • ScaNN Trees",
        badge: "VECTOR SEARCH",
        details: ["Enterprise RAG Grounding", "Dynamic Filtering Index"]
      },

      // ZONE 5: MULTI-REGION LAKEHOUSE & PERSISTENCE (nam3 Multi-Region)
      {
        id: "spanner",
        label: "Cloud Spanner Global DB",
        category: "storage",
        zone: "lakehouse_db",
        cloudIcon: "spanner",
        description: "Mission-Critical Multi-Region Relational DB",
        techSpec: "99.999% SLA • TrueTime ACID",
        badge: "GLOBAL DB",
        details: ["External Consistency", "nam3 Synchronous Replication"]
      },
      {
        id: "bigquery",
        label: "BigQuery Enterprise Lakehouse",
        category: "storage",
        zone: "lakehouse_db",
        cloudIcon: "bigquery",
        description: "Unified Analytics Mart & AI Grounding Store",
        techSpec: "Petabyte Columnar Engine",
        badge: "LAKEHOUSE",
        details: ["Vector Embeddings Storage", "Audit & Telemetry Mart"]
      },
      {
        id: "cloud_storage",
        label: "Cloud Storage (Dual-Region)",
        category: "storage",
        zone: "lakehouse_db",
        cloudIcon: "cloud_storage",
        description: "Encrypted Unstructured Training & Raw Data",
        techSpec: "99.999999999% Durability",
        badge: "OBJECT STORE",
        details: ["Immutable Object Holds", "CMEK Envelope Encryption"]
      },

      // ZONE 6: ZERO-TRUST SECURITY, SRE OBSERVABILITY & GOVERNANCE BASELINE (Bottom Spanning Rail)
      {
        id: "vpc_sc",
        label: "VPC Service Controls (VPC-SC)",
        category: "security",
        zone: "zero_trust_baseline",
        cloudIcon: "vpc_sc",
        description: "Context-Aware Perimeter & Anti-Exfiltration",
        techSpec: "Perimeter: 08492041284",
        badge: "ZERO-EGRESS",
        details: ["Prevents Data Exfiltration", "Strict Access Levels"]
      },
      {
        id: "cloud_iam",
        label: "Cloud IAM & Workload Identity",
        category: "security",
        zone: "zero_trust_baseline",
        cloudIcon: "cloud_iam",
        description: "Keyless Federation & Least-Privilege IAM",
        techSpec: "Zero Long-Lived Keys",
        badge: "KEYLESS IAM",
        details: ["OIDC Token Exchange", "Service Account Impersonation"]
      },
      {
        id: "cloud_monitoring",
        label: "Cloud Monitoring & Audit Trail",
        category: "security",
        zone: "zero_trust_baseline",
        cloudIcon: "cloud_monitoring",
        description: "Full-Stack Distributed SRE Observability",
        techSpec: "SLI / SLO Telemetry",
        badge: "SRE OBSERVABILITY",
        details: ["OpenTelemetry Distributed Traces", "Immutable Cryptographic Audit Logs"]
      }
    ],
    edges: [
      { id: "e1", source: "actor_client", target: "cloud_cdn", protocol: "TLS 1.3 Ingress", flowType: "user_flow", ratePps: 200 },
      { id: "e2", source: "actor_client", target: "cloud_armor", protocol: "WAF Ingress", flowType: "user_flow", ratePps: 200 },
      { id: "e3", source: "cloud_armor", target: "external_alb", protocol: "WAF Inspected", flowType: "process_flow", ratePps: 200 },
      { id: "e4", source: "external_alb", target: "api_gateway", protocol: "Serverless NEG", flowType: "process_flow", ratePps: 200 },
      { id: "e5", source: "external_alb", target: "gke_autopilot", protocol: "Envoy Ingress", flowType: "process_flow", ratePps: 180 },
      { id: "e6", source: "api_gateway", target: "memorystore", protocol: "Direct VPC", flowType: "process_flow", ratePps: 250 },
      { id: "e7", source: "api_gateway", target: "model_armor", protocol: "Prompt Sanitize", flowType: "process_flow", ratePps: 150 },
      { id: "e8", source: "model_armor", target: "vertex_endpoint", protocol: "PSC Model gRPC", flowType: "process_flow", ratePps: 150 },
      { id: "e9", source: "vertex_endpoint", target: "vector_search", protocol: "ScaNN Vector Search", flowType: "process_flow", ratePps: 150 },
      { id: "e10", source: "api_gateway", target: "pubsub", protocol: "Event Ingestion", flowType: "data_flow", ratePps: 300 },
      { id: "e11", source: "pubsub", target: "dataflow", protocol: "Beam Streaming", flowType: "data_flow", ratePps: 300 },
      { id: "e12", source: "dataflow", target: "bigquery", protocol: "BigQueryIO Sink", flowType: "data_flow", ratePps: 300 },
      { id: "e13", source: "gke_autopilot", target: "spanner", protocol: "TrueTime ACID", flowType: "data_flow", ratePps: 200 },
      { id: "e14", source: "spanner", target: "bigquery", protocol: "BigLake Storage", flowType: "data_flow", ratePps: 100 }
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
