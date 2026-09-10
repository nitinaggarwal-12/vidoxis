import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ParticleStreamSimulator, Particle } from "../../whiteboard/particle-system.js";

export interface WhiteboardNode {
  id: string;
  label: string;
  sublabel: string;
  service: string;
  x: number;
  y: number;
  width: number;
  height: number;
  flowType: "user_flow" | "process_flow" | "data_flow";
  startFrame: number;
  color: string;
}

export interface WhiteboardEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  flowType: "user_flow" | "process_flow" | "data_flow";
  p1: { x: number; y: number };
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
  p2: { x: number; y: number };
  startFrame: number;
  color: string;
}

export interface WhiteboardTrackProps {
  nodes?: WhiteboardNode[];
  edges?: WhiteboardEdge[];
}

const DEFAULT_NODES: WhiteboardNode[] = [
  {
    id: "client_app",
    label: "Enterprise Client App",
    sublabel: "Authorized gRPC Client (mTLS)",
    service: "client",
    x: 240,
    y: 920,
    width: 440,
    height: 180,
    flowType: "user_flow",
    startFrame: 10,
    color: "#4285F4"
  },
  {
    id: "api_gateway",
    label: "Internal Cloud Run Gateway",
    sublabel: "Regional Serverless Proxy",
    service: "cloud_run",
    x: 960,
    y: 920,
    width: 480,
    height: 180,
    flowType: "process_flow",
    startFrame: 35,
    color: "#34A853"
  },
  {
    id: "psc_endpoint",
    label: "Private Service Connect",
    sublabel: "Private Endpoint (10.128.0.45)",
    service: "network",
    x: 1720,
    y: 920,
    width: 480,
    height: 180,
    flowType: "process_flow",
    startFrame: 60,
    color: "#D97706"
  },
  {
    id: "vertex_model",
    label: "Vertex AI Gemini 2.0 Flash",
    sublabel: "Dedicated Private Endpoint",
    service: "vertex_ai",
    x: 2480,
    y: 920,
    width: 520,
    height: 180,
    flowType: "data_flow",
    startFrame: 85,
    color: "#1A73E8"
  },
  {
    id: "bigquery_analytics",
    label: "BigQuery Grounding & Logs",
    sublabel: "Audit Telemetry Warehouse",
    service: "bigquery",
    x: 3260,
    y: 920,
    width: 460,
    height: 180,
    flowType: "data_flow",
    startFrame: 110,
    color: "#EA4335"
  }
];

const DEFAULT_EDGES: WhiteboardEdge[] = [
  {
    id: "edge_client_gateway",
    source: "client_app",
    target: "api_gateway",
    label: "mTLS Inference Call",
    flowType: "user_flow",
    p1: { x: 680, y: 1010 },
    cp1: { x: 780, y: 950 },
    cp2: { x: 860, y: 950 },
    p2: { x: 960, y: 1010 },
    startFrame: 45,
    color: "#4285F4"
  },
  {
    id: "edge_gateway_psc",
    source: "api_gateway",
    target: "psc_endpoint",
    label: "Forward Internal VPC",
    flowType: "process_flow",
    p1: { x: 1440, y: 1010 },
    cp1: { x: 1540, y: 950 },
    cp2: { x: 1620, y: 950 },
    p2: { x: 1720, y: 1010 },
    startFrame: 70,
    color: "#34A853"
  },
  {
    id: "edge_psc_vertex",
    source: "psc_endpoint",
    target: "vertex_model",
    label: "Direct Endpoint Route",
    flowType: "process_flow",
    p1: { x: 2200, y: 1010 },
    cp1: { x: 2300, y: 950 },
    cp2: { x: 2380, y: 950 },
    p2: { x: 2480, y: 1010 },
    startFrame: 95,
    color: "#D97706"
  },
  {
    id: "edge_vertex_bq",
    source: "vertex_model",
    target: "bigquery_analytics",
    label: "Audit Telemetry Log",
    flowType: "data_flow",
    p1: { x: 3000, y: 1010 },
    cp1: { x: 3100, y: 950 },
    cp2: { x: 3180, y: 950 },
    p2: { x: 3260, y: 1010 },
    startFrame: 120,
    color: "#EA4335"
  }
];

export const WhiteboardTrack: React.FC<WhiteboardTrackProps> = ({
  nodes = DEFAULT_NODES,
  edges = DEFAULT_EDGES
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const simulator = useMemo(() => new ParticleStreamSimulator(), []);

  // Calculate kinetic particles for each edge
  const edgeParticles = useMemo(() => {
    return edges.map(edge => {
      if (frame < edge.startFrame) return { edge, particles: [] as Particle[] };
      const particles = simulator.computeParticlesForEdge(
        edge.id,
        {
          p0: edge.p1,
          p1: edge.cp1,
          p2: edge.cp2,
          p3: edge.p2
        },
        frame,
        edge.startFrame,
        60,
        edge.color
      );
      return { edge, particles };
    });
  }, [edges, frame, simulator]);

  // Compute optical stylus tip position tracking current drawing head
  const stylusTip = useMemo(() => {
    for (const node of nodes) {
      if (frame >= node.startFrame && frame <= node.startFrame + 25) {
        const progress = (frame - node.startFrame) / 25;
        return {
          visible: true,
          x: node.x + node.width * progress,
          y: node.y + node.height / 2,
          color: node.color
        };
      }
    }
    return { visible: false, x: 0, y: 0, color: "#38BDF8" };
  }, [nodes, frame]);

  return (
    <div
      style={{
        position: "absolute",
        width: 3840,
        height: 2160,
        backgroundColor: "#F8FAFC",
        overflow: "hidden",
        fontFamily: "'Google Sans', 'Google Sans Flex', system-ui, sans-serif"
      }}
    >
      {/* Background SVG Grid & Hand-drawn elements */}
      <svg
        width="3840"
        height="2160"
        viewBox="0 0 3840 2160"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {/* 32px Isometric Dot Grid */}
          <pattern id="dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1.5" fill="#CBD5E1" opacity="0.8" />
          </pattern>
          <filter id="glow-filter" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Isometric Grid Background */}
        <rect width="3840" height="2160" fill="url(#dot-grid)" />

        {/* Outer Boundary Container: Google Cloud Sandbox VPC */}
        <g opacity={interpolate(frame, [5, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          <rect
            x="160"
            y="680"
            width="3560"
            height="620"
            rx="24"
            fill="rgba(26, 115, 232, 0.04)"
            stroke="#CBD5E1"
            strokeWidth="3"
            strokeDasharray="8 6"
          />
          <text
            x="200"
            y="730"
            fill="#334155"
            fontSize="24"
            fontWeight="700"
            letterSpacing="1px"
          >
            GOOGLE CLOUD PLATFORM • REGIONAL ENTERPRISE VPC (US-CENTRAL1)
          </text>
        </g>

        {/* Edge Spline Curves */}
        {edges.map(edge => {
          const edgeProgress = interpolate(
            frame,
            [edge.startFrame, edge.startFrame + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const d = `M ${edge.p1.x} ${edge.p1.y} C ${edge.cp1.x} ${edge.cp1.y}, ${edge.cp2.x} ${edge.cp2.y}, ${edge.p2.x} ${edge.p2.y}`;

          return (
            <g key={edge.id} opacity={edgeProgress}>
              {/* Glow halo under path */}
              <path
                d={d}
                fill="none"
                stroke={edge.color}
                strokeWidth="6"
                strokeOpacity="0.25"
                filter="url(#glow-filter)"
              />
              {/* Primary connector curve */}
              <path
                d={d}
                fill="none"
                stroke={edge.color}
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Edge Label Pill with High-Contrast Text */}
              <g transform={`translate(${(edge.p1.x + edge.p2.x) / 2}, ${(edge.p1.y + edge.p2.y) / 2 - 32})`}>
                <rect
                  x="-120"
                  y="-18"
                  width="240"
                  height="36"
                  rx="18"
                  fill="#FFFFFF"
                  stroke={edge.color}
                  strokeWidth="2"
                  filter="url(#glow-filter)"
                />
                <text
                  x="0"
                  y="6"
                  fill="#0F172A"
                  fontSize="18"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="'Roboto Mono', monospace"
                >
                  {edge.label}
                </text>
              </g>
            </g>
          );
        })}

        {/* Kinetic Glowing Bezier Particles */}
        {edgeParticles.map(({ edge, particles }) => (
          <g key={`particles-${edge.id}`}>
            {particles.map((particle: Particle) => (
              <g key={particle.id}>
                {/* Glowing Aura */}
                <circle
                  cx={particle.x}
                  cy={particle.y}
                  r={particle.radius * 2}
                  fill={particle.color}
                  opacity={particle.opacity * 0.4}
                  filter="url(#glow-filter)"
                />
                {/* Core Particle */}
                <circle
                  cx={particle.x}
                  cy={particle.y}
                  r={particle.radius}
                  fill="#FFFFFF"
                  opacity={particle.opacity}
                />
              </g>
            ))}
          </g>
        ))}

        {/* Hand-Drawn Progressive Nodes */}
        {nodes.map(node => {
          const nodeSpring = spring({
            frame: frame - node.startFrame,
            fps,
            config: { damping: 14, stiffness: 120 }
          });

          if (frame < node.startFrame) return null;

          return (
            <g
              key={node.id}
              transform={`matrix(${nodeSpring}, 0, 0, ${nodeSpring}, ${node.x + (node.width * (1 - nodeSpring)) / 2}, ${node.y + (node.height * (1 - nodeSpring)) / 2})`}
            >
              {/* Card Background */}
              <rect
                x="0"
                y="0"
                width={node.width}
                height={node.height}
                rx="16"
                fill="#FFFFFF"
                stroke={node.color}
                strokeWidth="3"
                filter="url(#glow-filter)"
              />
              {/* Top Accent Strip */}
              <rect
                x="0"
                y="0"
                width={node.width}
                height="8"
                rx="4"
                fill={node.color}
              />
              {/* Flow Type Tag */}
              <rect
                x="24"
                y="24"
                width="140"
                height="28"
                rx="6"
                fill="#F1F5F9"
              />
              <text
                x="94"
                y="43"
                fill={node.color}
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
                letterSpacing="0.5px"
              >
                {node.flowType.toUpperCase().replace("_", " ")}
              </text>
              {/* Node Title */}
              <text
                x="24"
                y="95"
                fill="#0F172A"
                fontSize="26"
                fontWeight="700"
              >
                {node.label}
              </text>
              {/* Node Sublabel */}
              <text
                x="24"
                y="135"
                fill="#475569"
                fontSize="18"
                fontWeight="500"
              >
                {node.sublabel}
              </text>
            </g>
          );
        })}

        {/* Optical Stylus Tracker */}
        {stylusTip.visible && (
          <g transform={`translate(${stylusTip.x}, ${stylusTip.y})`}>
            <circle r="18" fill={stylusTip.color} opacity="0.35" filter="url(#glow-filter)" />
            <circle r="7" fill={stylusTip.color} />
            <line x1="0" y1="0" x2="-28" y2="-48" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
            <line x1="-2" y1="-3" x2="-26" y2="-45" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* Header Title Slate */}
        <g opacity={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" })}>
          <text
            x="160"
            y="220"
            fill="#0F172A"
            fontSize="54"
            fontWeight="800"
            letterSpacing="-0.5px"
          >
            High-Performance Private AI Infrastructure
          </text>
          <text
            x="160"
            y="280"
            fill="#475569"
            fontSize="26"
            fontWeight="600"
          >
            Act 2: Architecture Synthesis • User Flow ➔ Process Flow ➔ Data Flow
          </text>
        </g>
      </svg>
    </div>
  );
};
