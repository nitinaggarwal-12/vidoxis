import { WhiteboardNode, WhiteboardEdge } from "./WhiteboardTrack.js";

export const ENTERPRISE_WHITEBOARD_NODES: WhiteboardNode[] = [
  {
    "id": "actor_client",
    "label": "Enterprise Client Ingress",
    "sublabel": "Mobile / Web Ingress Gateway",
    "service": "client",
    "categoryTag": "CLIENT INGRESS",
    "statusChip": "CLIENT INGRESS",
    "x": 120,
    "y": 260,
    "width": 480,
    "height": 280,
    "flowType": "user_flow",
    "startFrame": 20,
    "color": "#0284C7",
    "zone": "ingress_edge",
    "techSpec": "TLS 1.3 / HTTP/3",
    "details": [
      "Global Anycast PoPs",
      "mTLS 1.3 Authorized Ingress"
    ]
  },
  {
    "id": "cloud_cdn",
    "label": "Cloud CDN & Media Edge",
    "sublabel": "Anycast Edge Content Cache",
    "service": "cloud_cdn",
    "categoryTag": "EDGE CACHE",
    "statusChip": "EDGE CACHE",
    "x": 120,
    "y": 630,
    "width": 480,
    "height": 280,
    "flowType": "process_flow",
    "startFrame": 32,
    "color": "#D97706",
    "zone": "ingress_edge",
    "techSpec": "p99 <8ms • Edge Hits",
    "details": [
      "Dynamic Content Caching",
      "Cloud Storage Byte Serving"
    ]
  },
  {
    "id": "cloud_armor",
    "label": "Cloud Armor Security Policy",
    "sublabel": "Adaptive DDoS & L7 WAF Shield",
    "service": "cloud_armor",
    "categoryTag": "L7 SECURITY",
    "statusChip": "L7 SECURITY",
    "x": 120,
    "y": 1000,
    "width": 480,
    "height": 280,
    "flowType": "process_flow",
    "startFrame": 44,
    "color": "#DC2626",
    "zone": "ingress_edge",
    "techSpec": "CRS 3.3 • 10k req/min",
    "details": [
      "OWASP Top 10 Mitigation",
      "Adaptive Layer 3/7 DDoS Defense"
    ]
  },
  {
    "id": "external_alb",
    "label": "Global External HTTPS LB",
    "sublabel": "Global Anycast L7 Application LB",
    "service": "cloud_load_balancing",
    "categoryTag": "ANYCAST LB",
    "statusChip": "ANYCAST LB",
    "x": 120,
    "y": 1370,
    "width": 480,
    "height": 280,
    "flowType": "process_flow",
    "startFrame": 56,
    "color": "#D97706",
    "zone": "ingress_edge",
    "techSpec": "p99 SSL <12ms",
    "details": [
      "Single Anycast Virtual IP",
      "Global SSL Acceleration"
    ]
  },
  {
    "id": "gke_autopilot",
    "label": "GKE Autopilot Microservices",
    "sublabel": "Cilium Mesh Container Cluster",
    "service": "gke",
    "categoryTag": "K8S MESH",
    "statusChip": "K8S MESH",
    "x": 720,
    "y": 350,
    "width": 430,
    "height": 340,
    "flowType": "process_flow",
    "startFrame": 68,
    "color": "#4F46E5",
    "zone": "app_mesh",
    "techSpec": "c3-standard-8 • Cilium CNI",
    "details": [
      "Keyless Workload Identity",
      "Horizontal Pod Autoscaling (HPA)"
    ]
  },
  {
    "id": "api_gateway",
    "label": "Cloud Run API Gateway",
    "sublabel": "Gen 2 Serverless Microservices",
    "service": "cloud_run",
    "categoryTag": "SERVERLESS",
    "statusChip": "SERVERLESS",
    "x": 1220,
    "y": 350,
    "width": 430,
    "height": 340,
    "flowType": "process_flow",
    "startFrame": 80,
    "color": "#4F46E5",
    "zone": "app_mesh",
    "techSpec": "Direct Serverless VPC Egress",
    "details": [
      "0-to-N Fast Cold Starts",
      "JWT Token Validation"
    ]
  },
  {
    "id": "memorystore",
    "label": "Cloud Memorystore (Redis HA)",
    "sublabel": "Sub-millisecond Session & Response Cache",
    "service": "memorystore",
    "categoryTag": "CACHE MESH",
    "statusChip": "CACHE MESH",
    "x": 1720,
    "y": 350,
    "width": 430,
    "height": 340,
    "flowType": "data_flow",
    "startFrame": 92,
    "color": "#059669",
    "zone": "app_mesh",
    "techSpec": "Sub-ms Latency • In-Memory",
    "details": [
      "Multi-Zone Automatic Failover",
      "Active Session Store"
    ]
  },
  {
    "id": "pubsub",
    "label": "Cloud Pub/Sub Messaging Bus",
    "sublabel": "High-Throughput Global Event Fabric",
    "service": "pubsub",
    "categoryTag": "EVENT BUS",
    "statusChip": "EVENT BUS",
    "x": 770,
    "y": 1180,
    "width": 520,
    "height": 340,
    "flowType": "data_flow",
    "startFrame": 104,
    "color": "#059669",
    "zone": "event_streaming",
    "techSpec": "100k msg/sec • Exactly-Once",
    "details": [
      "Dead-Letter Queue Buffering",
      "Zero-Data-Loss Ordering"
    ]
  },
  {
    "id": "dataflow",
    "label": "Cloud Dataflow (Apache Beam)",
    "sublabel": "Serverless Stream Transformation Pipeline",
    "service": "dataflow",
    "categoryTag": "STREAMING ETL",
    "statusChip": "STREAMING ETL",
    "x": 1450,
    "y": 1180,
    "width": 520,
    "height": 340,
    "flowType": "process_flow",
    "startFrame": 116,
    "color": "#4F46E5",
    "zone": "event_streaming",
    "techSpec": "Streaming Engine Gen 2",
    "details": [
      "Sliding Window Aggregation",
      "Direct Lakehouse Sink"
    ]
  },
  {
    "id": "model_armor",
    "label": "Vertex AI Model Armor",
    "sublabel": "Real-Time Prompt Injection & Safety Guardrail",
    "service": "model_armor",
    "categoryTag": "AI GUARDRAILS",
    "statusChip": "AI GUARDRAILS",
    "x": 2270,
    "y": 350,
    "width": 430,
    "height": 340,
    "flowType": "process_flow",
    "startFrame": 128,
    "color": "#DC2626",
    "zone": "vertex_ai",
    "techSpec": "p99 <15ms Inspection",
    "details": [
      "Prompt Injection Defense",
      "PII & Jailbreak Sanitization"
    ]
  },
  {
    "id": "vertex_endpoint",
    "label": "Gemini 2.0 Flash Private Endpoint",
    "sublabel": "Vertex AI Dedicated Model Pool via PSC",
    "service": "vertex_ai",
    "categoryTag": "FOUNDATION AI",
    "statusChip": "FOUNDATION AI",
    "x": 2770,
    "y": 350,
    "width": 430,
    "height": 340,
    "flowType": "data_flow",
    "startFrame": 140,
    "color": "#7C3AED",
    "zone": "vertex_ai",
    "techSpec": "Dedicated PSC • Zero Egress",
    "details": [
      "Multimodal Inference Engine",
      "Isolated Tenant Network"
    ]
  },
  {
    "id": "vector_search",
    "label": "Vertex Vector Search (ScaNN)",
    "sublabel": "Billion-Scale Low-Latency Vector Similarity",
    "service": "vector_search",
    "categoryTag": "VECTOR SEARCH",
    "statusChip": "VECTOR SEARCH",
    "x": 3270,
    "y": 350,
    "width": 430,
    "height": 340,
    "flowType": "data_flow",
    "startFrame": 152,
    "color": "#7C3AED",
    "zone": "vertex_ai",
    "techSpec": "p99 <5ms • ScaNN Trees",
    "details": [
      "Enterprise RAG Grounding",
      "Dynamic Filtering Index"
    ]
  },
  {
    "id": "spanner",
    "label": "Cloud Spanner Global DB",
    "sublabel": "Mission-Critical Multi-Region Relational DB",
    "service": "spanner",
    "categoryTag": "GLOBAL DB",
    "statusChip": "GLOBAL DB",
    "x": 2270,
    "y": 1180,
    "width": 430,
    "height": 340,
    "flowType": "data_flow",
    "startFrame": 164,
    "color": "#059669",
    "zone": "lakehouse_db",
    "techSpec": "99.999% SLA • TrueTime ACID",
    "details": [
      "External Consistency",
      "nam3 Synchronous Replication"
    ]
  },
  {
    "id": "bigquery",
    "label": "BigQuery Enterprise Lakehouse",
    "sublabel": "Unified Analytics Mart & AI Grounding Store",
    "service": "bigquery",
    "categoryTag": "LAKEHOUSE",
    "statusChip": "LAKEHOUSE",
    "x": 2770,
    "y": 1180,
    "width": 430,
    "height": 340,
    "flowType": "data_flow",
    "startFrame": 176,
    "color": "#059669",
    "zone": "lakehouse_db",
    "techSpec": "Petabyte Columnar Engine",
    "details": [
      "Vector Embeddings Storage",
      "Audit & Telemetry Mart"
    ]
  },
  {
    "id": "cloud_storage",
    "label": "Cloud Storage (Dual-Region)",
    "sublabel": "Encrypted Unstructured Training & Raw Data",
    "service": "cloud_storage",
    "categoryTag": "OBJECT STORE",
    "statusChip": "OBJECT STORE",
    "x": 3270,
    "y": 1180,
    "width": 430,
    "height": 340,
    "flowType": "data_flow",
    "startFrame": 188,
    "color": "#059669",
    "zone": "lakehouse_db",
    "techSpec": "99.999999999% Durability",
    "details": [
      "Immutable Object Holds",
      "CMEK Envelope Encryption"
    ]
  },
  {
    "id": "vpc_sc",
    "label": "VPC Service Controls (VPC-SC)",
    "sublabel": "Context-Aware Perimeter & Anti-Exfiltration",
    "service": "vpc_sc",
    "categoryTag": "ZERO-EGRESS",
    "statusChip": "ZERO-EGRESS",
    "x": 115,
    "y": 1835,
    "width": 1180,
    "height": 150,
    "flowType": "process_flow",
    "startFrame": 200,
    "color": "#DC2626",
    "zone": "zero_trust_baseline",
    "techSpec": "Perimeter: 08492041284",
    "details": [
      "Prevents Data Exfiltration",
      "Strict Access Levels"
    ]
  },
  {
    "id": "cloud_iam",
    "label": "Cloud IAM & Workload Identity",
    "sublabel": "Keyless Federation & Least-Privilege IAM",
    "service": "cloud_iam",
    "categoryTag": "KEYLESS IAM",
    "statusChip": "KEYLESS IAM",
    "x": 1330,
    "y": 1835,
    "width": 1180,
    "height": 150,
    "flowType": "process_flow",
    "startFrame": 212,
    "color": "#DC2626",
    "zone": "zero_trust_baseline",
    "techSpec": "Zero Long-Lived Keys",
    "details": [
      "OIDC Token Exchange",
      "Service Account Impersonation"
    ]
  },
  {
    "id": "cloud_monitoring",
    "label": "Cloud Monitoring & Audit Trail",
    "sublabel": "Full-Stack Distributed SRE Observability",
    "service": "cloud_monitoring",
    "categoryTag": "SRE OBSERVABILITY",
    "statusChip": "SRE OBSERVABILITY",
    "x": 2545,
    "y": 1835,
    "width": 1180,
    "height": 150,
    "flowType": "process_flow",
    "startFrame": 224,
    "color": "#DC2626",
    "zone": "zero_trust_baseline",
    "techSpec": "SLI / SLO Telemetry",
    "details": [
      "OpenTelemetry Distributed Traces",
      "Immutable Cryptographic Audit Logs"
    ]
  }
];

export const ENTERPRISE_WHITEBOARD_EDGES: WhiteboardEdge[] = [
  {
    "id": "e1",
    "source": "actor_client",
    "target": "cloud_cdn",
    "label": "TLS 1.3 Ingress",
    "flowType": "user_flow",
    "p1": {
      "x": 360,
      "y": 540
    },
    "cp1": {
      "x": 360,
      "y": 585
    },
    "cp2": {
      "x": 360,
      "y": 585
    },
    "p2": {
      "x": 360,
      "y": 630
    },
    "startFrame": 45,
    "color": "#0284C7"
  },
  {
    "id": "e2",
    "source": "actor_client",
    "target": "cloud_armor",
    "label": "WAF Ingress",
    "flowType": "user_flow",
    "p1": {
      "x": 360,
      "y": 540
    },
    "cp1": {
      "x": 360,
      "y": 770
    },
    "cp2": {
      "x": 360,
      "y": 770
    },
    "p2": {
      "x": 360,
      "y": 1000
    },
    "startFrame": 45,
    "color": "#0284C7"
  },
  {
    "id": "e3",
    "source": "cloud_armor",
    "target": "external_alb",
    "label": "WAF Inspected",
    "flowType": "process_flow",
    "p1": {
      "x": 360,
      "y": 1280
    },
    "cp1": {
      "x": 360,
      "y": 1325
    },
    "cp2": {
      "x": 360,
      "y": 1325
    },
    "p2": {
      "x": 360,
      "y": 1370
    },
    "startFrame": 69,
    "color": "#6366F1"
  },
  {
    "id": "e4",
    "source": "external_alb",
    "target": "api_gateway",
    "label": "Serverless NEG",
    "flowType": "process_flow",
    "p1": {
      "x": 600,
      "y": 1405
    },
    "cp1": {
      "x": 645,
      "y": 790
    },
    "cp2": {
      "x": 846.25,
      "y": 730
    },
    "p2": {
      "x": 1220,
      "y": 520
    },
    "startFrame": 81,
    "color": "#6366F1"
  },
  {
    "id": "e5",
    "source": "external_alb",
    "target": "gke_autopilot",
    "label": "Envoy Ingress",
    "flowType": "process_flow",
    "p1": {
      "x": 600,
      "y": 1405
    },
    "cp1": {
      "x": 645,
      "y": 790
    },
    "cp2": {
      "x": 671.25,
      "y": 730
    },
    "p2": {
      "x": 720,
      "y": 520
    },
    "startFrame": 81,
    "color": "#6366F1"
  },
  {
    "id": "e6",
    "source": "api_gateway",
    "target": "memorystore",
    "label": "Direct VPC",
    "flowType": "process_flow",
    "p1": {
      "x": 1650,
      "y": 520
    },
    "cp1": {
      "x": 1685,
      "y": 520
    },
    "cp2": {
      "x": 1685,
      "y": 520
    },
    "p2": {
      "x": 1720,
      "y": 520
    },
    "startFrame": 105,
    "color": "#6366F1"
  },
  {
    "id": "e7",
    "source": "api_gateway",
    "target": "model_armor",
    "label": "Prompt Sanitize",
    "flowType": "process_flow",
    "p1": {
      "x": 1650,
      "y": 520
    },
    "cp1": {
      "x": 1960,
      "y": 520
    },
    "cp2": {
      "x": 1960,
      "y": 520
    },
    "p2": {
      "x": 2270,
      "y": 520
    },
    "startFrame": 105,
    "color": "#6366F1"
  },
  {
    "id": "e8",
    "source": "model_armor",
    "target": "vertex_endpoint",
    "label": "PSC Model gRPC",
    "flowType": "process_flow",
    "p1": {
      "x": 2700,
      "y": 520
    },
    "cp1": {
      "x": 2735,
      "y": 520
    },
    "cp2": {
      "x": 2735,
      "y": 520
    },
    "p2": {
      "x": 2770,
      "y": 520
    },
    "startFrame": 153,
    "color": "#6366F1"
  },
  {
    "id": "e9",
    "source": "vertex_endpoint",
    "target": "vector_search",
    "label": "ScaNN Vector Search",
    "flowType": "process_flow",
    "p1": {
      "x": 3200,
      "y": 520
    },
    "cp1": {
      "x": 3235,
      "y": 520
    },
    "cp2": {
      "x": 3235,
      "y": 520
    },
    "p2": {
      "x": 3270,
      "y": 520
    },
    "startFrame": 165,
    "color": "#6366F1"
  },
  {
    "id": "e10",
    "source": "api_gateway",
    "target": "pubsub",
    "label": "Event Ingestion",
    "flowType": "data_flow",
    "p1": {
      "x": 1370.5,
      "y": 690
    },
    "cp1": {
      "x": 1370.5,
      "y": 820
    },
    "cp2": {
      "x": 1108,
      "y": 940
    },
    "p2": {
      "x": 1108,
      "y": 1180
    },
    "startFrame": 105,
    "color": "#0D9488"
  },
  {
    "id": "e11",
    "source": "pubsub",
    "target": "dataflow",
    "label": "Beam Streaming",
    "flowType": "data_flow",
    "p1": {
      "x": 1290,
      "y": 1350
    },
    "cp1": {
      "x": 1370,
      "y": 1350
    },
    "cp2": {
      "x": 1370,
      "y": 1350
    },
    "p2": {
      "x": 1450,
      "y": 1350
    },
    "startFrame": 129,
    "color": "#0D9488"
  },
  {
    "id": "e12",
    "source": "dataflow",
    "target": "bigquery",
    "label": "BigQueryIO Sink",
    "flowType": "data_flow",
    "p1": {
      "x": 1970,
      "y": 1350
    },
    "cp1": {
      "x": 2370,
      "y": 1350
    },
    "cp2": {
      "x": 2370,
      "y": 1350
    },
    "p2": {
      "x": 2770,
      "y": 1350
    },
    "startFrame": 141,
    "color": "#0D9488"
  },
  {
    "id": "e13",
    "source": "gke_autopilot",
    "target": "spanner",
    "label": "TrueTime ACID",
    "flowType": "data_flow",
    "p1": {
      "x": 999.5,
      "y": 690
    },
    "cp1": {
      "x": 999.5,
      "y": 820
    },
    "cp2": {
      "x": 2420.5,
      "y": 940
    },
    "p2": {
      "x": 2420.5,
      "y": 1180
    },
    "startFrame": 93,
    "color": "#0D9488"
  },
  {
    "id": "e14",
    "source": "spanner",
    "target": "bigquery",
    "label": "BigLake Storage",
    "flowType": "data_flow",
    "p1": {
      "x": 2700,
      "y": 1350
    },
    "cp1": {
      "x": 2735,
      "y": 1350
    },
    "cp2": {
      "x": 2735,
      "y": 1350
    },
    "p2": {
      "x": 2770,
      "y": 1350
    },
    "startFrame": 189,
    "color": "#0D9488"
  }
];
