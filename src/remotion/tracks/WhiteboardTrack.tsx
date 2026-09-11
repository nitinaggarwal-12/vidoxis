import React, { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ParticleStreamSimulator, Particle } from "../../whiteboard/particle-system.js";
import {
  getGcpServiceIconSvg,
  renderGoogleCloudLogoSvg,
  renderVpcNetworkIconSvg,
  renderVpcScLockIconSvg
} from "../../whiteboard/gcp-icons.js";

import {
  ENTERPRISE_WHITEBOARD_NODES,
  ENTERPRISE_WHITEBOARD_EDGES
} from "./enterprise-whiteboard-data.js";

export interface WhiteboardNode {
  id: string;
  label: string;
  sublabel: string;
  service: string;
  categoryTag: string;
  statusChip: string;
  x: number;
  y: number;
  width: number;
  height: number;
  flowType: "user_flow" | "process_flow" | "data_flow" | "security_flow";
  startFrame: number;
  color: string;
  zone?: string;
  techSpec?: string;
  details?: string[];
}

export interface WhiteboardEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  flowType: "user_flow" | "process_flow" | "data_flow" | "security_flow";
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

export const DEFAULT_NODES: WhiteboardNode[] = ENTERPRISE_WHITEBOARD_NODES;
export const DEFAULT_EDGES: WhiteboardEdge[] = ENTERPRISE_WHITEBOARD_EDGES;

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
        fontFamily: "'Google Sans Flex', 'Google Sans', -apple-system, sans-serif"
      }}
    >
      <svg
        width="3840"
        height="2160"
        viewBox="0 0 3840 2160"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          {/* Light Dot Grid */}
          <pattern id="dot-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="16" cy="16" r="1.5" fill="#CBD5E1" opacity="0.6" />
          </pattern>
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="rgba(15, 23, 42, 0.08)" />
            <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="rgba(15, 23, 42, 0.04)" />
          </filter>
          <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(15, 23, 42, 0.12)" />
          </filter>

          {/* Flow Type Directional Arrowheads */}
          {/* User Flow Arrow (Blue #0284C7) */}
          <marker id="arrow-user_flow" viewBox="0 0 14 14" refX="10" refY="7" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M 1 2 L 12 7 L 1 12 L 4 7 Z" fill="#0284C7" stroke="#0284C7" strokeWidth="0.8" strokeLinejoin="round" />
          </marker>

          {/* Process Flow Arrow (Indigo #6366F1) */}
          <marker id="arrow-process_flow" viewBox="0 0 14 14" refX="10" refY="7" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M 1 2 L 12 7 L 1 12 L 4 7 Z" fill="#6366F1" stroke="#6366F1" strokeWidth="0.8" strokeLinejoin="round" />
          </marker>

          {/* Data Flow Arrow (Teal #0D9488) */}
          <marker id="arrow-data_flow" viewBox="0 0 14 14" refX="10" refY="7" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M 1 2 L 12 7 L 1 12 L 4 7 Z" fill="#0D9488" stroke="#0D9488" strokeWidth="0.8" strokeLinejoin="round" />
          </marker>

          {/* Security Flow Arrow (Red #DC2626) */}
          <marker id="arrow-security_flow" viewBox="0 0 14 14" refX="10" refY="7" markerWidth="9" markerHeight="9" orient="auto">
            <path d="M 1 2 L 12 7 L 1 12 L 4 7 Z" fill="#DC2626" stroke="#DC2626" strokeWidth="0.8" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect width="3840" height="2160" fill="url(#dot-grid)" />

        {/* ========================================================================= */}
        {/* 1. OFFICIAL GOOGLE CLOUD MASTER BANNER */}
        {/* ========================================================================= */}
        <g opacity={interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" })} transform="translate(80, 40)">
          <rect width="3680" height="124" rx="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="url(#glow-filter)" />
          
          <g transform="translate(26, 26)" dangerouslySetInnerHTML={{ __html: renderGoogleCloudLogoSvg(56) }} />

          <g transform="translate(104, 28)">
            <text x="0" y="18" fill="#1A73E8" fontSize="13.5" fontWeight="800" letterSpacing="1.5">GOOGLE CLOUD PLATFORM</text>
            <text x="214" y="18" fill="#94A3B8" fontSize="13" fontFamily="'Roboto Mono', monospace">|</text>
            <text x="230" y="18" fill="#475569" fontSize="12" fontWeight="600">ENTERPRISE REFERENCE ARCHITECTURE</text>
            
            <text x="0" y="52" fill="#0F172A" fontSize="26" fontWeight="800">Deploying Private Gemini 2.0 Endpoints on Google Cloud</text>
            <text x="0" y="74" fill="#64748B" fontSize="13" fontWeight="500" fontFamily="'Roboto Mono', monospace">Zero-Egress Private Service Connect • Cloud Armor WAF • Vertex AI ScaNN • BigQuery Lakehouse</text>
          </g>

          {/* Metadata Badges */}
          <g transform="translate(3060, 24)">
            <rect x="0" y="0" width="220" height="32" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
            <text x="12" y="20" fill="#334155" fontSize="11" fontWeight="700" fontFamily="'Roboto Mono', monospace">REGION: <tspan fill="#0284C7">us-central1 (Iowa)</tspan></text>

            <rect x="230" y="0" width="210" height="32" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
            <text x="242" y="20" fill="#334155" fontSize="11" fontWeight="700" fontFamily="'Roboto Mono', monospace">PROJECT: <tspan fill="#10B981">vidoxis-8f2a</tspan></text>

            <rect x="0" y="42" width="220" height="32" rx="6" fill="#FEF2F2" stroke="#FECACA" strokeWidth="1" />
            <circle cx="16" cy="58" r="4" fill="#DC2626" />
            <text x="26" y="62" fill="#991B1B" fontSize="11" fontWeight="800" fontFamily="'Roboto Mono', monospace">VPC-SC: ZERO-EGRESS</text>

            <rect x="230" y="42" width="210" height="32" rx="6" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
            <text x="242" y="62" fill="#1D4ED8" fontSize="10.5" fontWeight="700">★ Google Arch Center 2026</text>
          </g>
        </g>

        {/* ========================================================================= */}
        {/* 2. ARCHITECTURAL BOUNDARIES (6 Dedicated Zones) */}
        {/* ========================================================================= */}
        <g opacity={interpolate(frame, [5, 25], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
          {/* ZONE 1: INGRESS & EDGE GATEWAY */}
          <rect x="80" y="180" width="560" height="1570" rx="20" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" strokeDasharray="8 6" />
          <rect x="80" y="180" width="560" height="46" rx="20" fill="#F0F9FF" />
          <path d="M 80 206 L 80 226 L 640 226 L 640 206 Z" fill="#F0F9FF" />
          <text x="100" y="209" fill="#0369A1" fontSize="13" fontWeight="800" letterSpacing="1">ZONE 1: INGRESS &amp; EDGE GATEWAY</text>
          <rect x="470" y="191" width="150" height="24" rx="12" fill="#E0F2FE" />
          <text x="545" y="207" fill="#0284C7" fontSize="10" fontWeight="800" fontFamily="'Roboto Mono', monospace" textAnchor="middle">GLOBAL ANYCAST VIP</text>

          {/* ZONE 2: APPLICATION CORE MESH (REGIONAL VPC) */}
          <rect x="670" y="180" width="1530" height="765" rx="20" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="2" strokeDasharray="6 4" />
          <rect x="670" y="180" width="1530" height="46" rx="20" fill="#EFF6FF" />
          <path d="M 670 206 L 670 226 L 2200 226 L 2200 206 Z" fill="#EFF6FF" />
          <g transform="translate(686, 191)" dangerouslySetInnerHTML={{ __html: renderVpcNetworkIconSvg(24) }} />
          <text x="722" y="209" fill="#1D4ED8" fontSize="13.5" fontWeight="800">ZONE 2: APPLICATION CORE MESH (REGIONAL VPC: vpc-prod-private)</text>
          <rect x="2000" y="191" width="180" height="24" rx="12" fill="#DBEAFE" />
          <text x="2090" y="207" fill="#1D4ED8" fontSize="10.5" fontWeight="700" fontFamily="'Roboto Mono', monospace" textAnchor="middle">VPC CIDR: 10.128.0.0/16</text>

          {/* ZONE 3: REAL-TIME EVENT STREAMING & INGESTION */}
          <rect x="670" y="975" width="1530" height="775" rx="20" fill="#FFFFFF" stroke="#F97316" strokeWidth="2" strokeDasharray="6 4" />
          <rect x="670" y="975" width="1530" height="46" rx="20" fill="#FFF7ED" />
          <path d="M 670 1001 L 670 1021 L 2200 1021 L 2200 1001 Z" fill="#FFF7ED" />
          <text x="700" y="1004" fill="#C2410C" fontSize="13.5" fontWeight="800" letterSpacing="0.5">ZONE 3: REAL-TIME EVENT STREAMING &amp; INGESTION (HIGH-THROUGHPUT FABRIC)</text>
          <rect x="2000" y="986" width="180" height="24" rx="12" fill="#FFEDD5" />
          <text x="2090" y="1002" fill="#C2410C" fontSize="10.5" fontWeight="700" fontFamily="'Roboto Mono', monospace" textAnchor="middle">SUBNET: 10.128.32.0/20</text>

          {/* ZONE 4: VERTEX AI & INTELLIGENCE HUB (PRODUCER VPC) */}
          <rect x="2230" y="180" width="1530" height="765" rx="20" fill="#FAF5FF" stroke="#7C3AED" strokeWidth="2" strokeDasharray="8 6" />
          <rect x="2230" y="180" width="1530" height="46" rx="20" fill="#F3E8FF" />
          <path d="M 2230 206 L 2230 226 L 3760 226 L 3760 206 Z" fill="#F3E8FF" />
          <g transform="translate(2246, 191)" dangerouslySetInnerHTML={{ __html: renderVpcScLockIconSvg(24) }} />
          <text x="2282" y="209" fill="#6D28D9" fontSize="13.5" fontWeight="800">ZONE 4: VERTEX AI &amp; INTELLIGENCE HUB (GOOGLE SERVICES NETWORK / PSC)</text>
          <rect x="3480" y="191" width="260" height="24" rx="12" fill="#FEE2E2" />
          <text x="3610" y="207" fill="#991B1B" fontSize="10" fontWeight="800" fontFamily="'Roboto Mono', monospace" textAnchor="middle">VPC-SC PERIMETER LOCK • ZERO-EGRESS</text>

          {/* ZONE 5: MULTI-REGION LAKEHOUSE & PERSISTENCE */}
          <rect x="2230" y="975" width="1530" height="775" rx="20" fill="#F0FDFA" stroke="#0D9488" strokeWidth="2" strokeDasharray="6 4" />
          <rect x="2230" y="975" width="1530" height="46" rx="20" fill="#CCFBF1" />
          <path d="M 2230 1001 L 2230 1021 L 3760 1021 L 3760 1001 Z" fill="#CCFBF1" />
          <text x="2256" y="1004" fill="#0F766E" fontSize="13.5" fontWeight="800" letterSpacing="0.5">ZONE 5: MULTI-REGION LAKEHOUSE &amp; PERSISTENCE (nam3 DUAL-REGION STORAGE)</text>
          <rect x="3480" y="986" width="260" height="24" rx="12" fill="#E6FFFA" stroke="#99F6E4" strokeWidth="1" />
          <text x="3610" y="1002" fill="#0F766E" fontSize="10" fontWeight="800" fontFamily="'Roboto Mono', monospace" textAnchor="middle">99.999% SLA • nam3 REPLICATION</text>

          {/* ZONE 6: ZERO-TRUST SECURITY, SRE OBSERVABILITY & GOVERNANCE BASELINE */}
          <rect x="80" y="1775" width="3680" height="235" rx="18" fill="#F8FAFC" stroke="#334155" strokeWidth="2" />
          <rect x="80" y="1775" width="3680" height="44" rx="18" fill="#F1F5F9" />
          <path d="M 80 1799 L 80 1819 L 3760 1819 L 3760 1799 Z" fill="#F1F5F9" />
          <text x="104" y="1803" fill="#1E293B" fontSize="13" fontWeight="800" letterSpacing="1">ZONE 6: ZERO-TRUST SECURITY, SRE OBSERVABILITY &amp; GOVERNANCE BASELINE</text>
          <rect x="3460" y="1785" width="280" height="24" rx="12" fill="#E2E8F0" />
          <text x="3600" y="1801" fill="#334155" fontSize="10" fontWeight="800" fontFamily="'Roboto Mono', monospace" textAnchor="middle">ENTERPRISE SRE &amp; COMPLIANCE STANDARD</text>
        </g>

        {/* ========================================================================= */}
        {/* 3. CONNECTORS / DATA FLOW EDGES WITH DIRECTIONAL ARROWHEADS */}
        {/* ========================================================================= */}
        {edges.map(edge => {
          const edgeProgress = interpolate(
            frame,
            [edge.startFrame, edge.startFrame + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const d = `M ${edge.p1.x} ${edge.p1.y} C ${edge.cp1.x} ${edge.cp1.y}, ${edge.cp2.x} ${edge.cp2.y}, ${edge.p2.x} ${edge.p2.y}`;
          const flowType = edge.flowType || "data_flow";
          const markerUrl = `url(#arrow-${flowType})`;
          const strokeDash =
            flowType === "process_flow" ? "8 5" :
            flowType === "security_flow" ? "4 4" : undefined;
          const strokeWidth =
            flowType === "data_flow" ? 4 :
            flowType === "user_flow" ? 3.5 :
            flowType === "process_flow" ? 3 : 2.5;

          return (
            <g key={`path-${edge.id}`} opacity={edgeProgress}>
              {/* Base Track */}
              <path d={d} fill="none" stroke="#E2E8F0" strokeWidth={2} strokeDasharray="6 6" />
              {/* Directional Flow Path with Marker Arrowhead */}
              <path
                d={d}
                fill="none"
                stroke={edge.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDash}
                strokeLinecap="round"
                markerEnd={markerUrl}
              />
              {/* Source Port Origin Dot */}
              <circle cx={edge.p1.x} cy={edge.p1.y} r={4} fill={edge.color} />
              {/* Target Port Ingress Ring */}
              <circle cx={edge.p2.x} cy={edge.p2.y} r={6} fill="#FFFFFF" stroke={edge.color} strokeWidth={2.5} />
              <circle cx={edge.p2.x} cy={edge.p2.y} r={2} fill={edge.color} />
            </g>
          );
        })}

        {/* ========================================================================= */}
        {/* 4. KINETIC PARTICLES STREAM */}
        {/* ========================================================================= */}
        {edgeParticles.map(({ edge, particles }) => (
          <g key={`particles-${edge.id}`}>
            {particles.map((particle: Particle) => (
              <g key={particle.id}>
                <circle cx={particle.x} cy={particle.y} r={particle.radius * 2.5} fill={particle.color} opacity={particle.opacity * 0.4} filter="url(#glow-filter)" />
                <circle cx={particle.x} cy={particle.y} r={particle.radius} fill="#FFFFFF" opacity={particle.opacity} />
              </g>
            ))}
          </g>
        ))}

        {/* ========================================================================= */}
        {/* 5. GOOGLE CLOUD ARCHITECTURE NODES (CARDS) */}
        {/* ========================================================================= */}
        {nodes.map(node => {
          const nodeSpring = spring({
            frame: frame - node.startFrame,
            fps,
            config: { damping: 14, stiffness: 120 }
          });

          if (frame < node.startFrame) return null;

          // ZONE 6 Wide Card Layout
          if (node.width >= 1000) {
            const detailsList = node.details || [];
            const bullet1 = detailsList[0] || "Immutable SRE Telemetry & Compliance Guardrails";
            const bullet2 = detailsList[1] || "Enterprise Zero-Trust Security Baseline";

            return (
              <g
                key={node.id}
                transform={`matrix(${nodeSpring}, 0, 0, ${nodeSpring}, ${node.x + (node.width * (1 - nodeSpring)) / 2}, ${node.y + (node.height * (1 - nodeSpring)) / 2})`}
              >
                <rect x="0" y="0" width={node.width} height={node.height} rx="16" ry="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.8" filter="url(#glow-filter)" />
                <path d={`M 0 16 C 0 7.16 7.16 0 16 0 L ${node.width - 16} 0 C ${node.width - 7.16} 0 ${node.width} 7.16 ${node.width} 16 L ${node.width} 5 L 0 5 Z`} fill={node.color} />
                <g transform="translate(24, 26)" dangerouslySetInnerHTML={{ __html: getGcpServiceIconSvg(node.service || node.label, 56) }} />

                {/* Col 1 */}
                <g transform="translate(98, 22)">
                  <rect x="0" y="0" width={Math.min(260, node.categoryTag.length * 8.5 + 20)} height="22" rx="6" fill="#F1F5F9" />
                  <text x="10" y="15" fill={node.color} fontSize="10.5" fontWeight="800" letterSpacing="0.8">{node.categoryTag}</text>
                  <text x="0" y="52" fill="#0F172A" fontSize="21" fontWeight="700">{node.label}</text>
                  <text x="0" y="78" fill="#475569" fontSize="13" fontWeight="500" fontFamily="'Roboto Mono', monospace">{node.sublabel}</text>
                  <text x="0" y="104" fill="#64748B" fontSize="11.5" fontWeight="500" fontFamily="'Roboto Mono', monospace">Resource: <tspan fill="#0F172A" fontWeight="700">{node.id}</tspan></text>
                </g>

                {/* Col 2 */}
                <g transform="translate(560, 22)">
                  <rect x="0" y="0" width="130" height="22" rx="11" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
                  <circle cx="12" cy="11" r="3.5" fill="#10B981" />
                  <text x="70" y="15" fill="#065F46" fontSize="9" fontWeight="800" textAnchor="middle">{node.statusChip}</text>

                  <rect x="140" y="0" width="220" height="22" rx="11" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
                  <text x="250" y="15" fill="#334155" fontSize="9.5" fontWeight="700" fontFamily="'Roboto Mono', monospace" textAnchor="middle">{node.techSpec || "Enterprise Baseline"}</text>

                  <text x="0" y="54" fill="#1E293B" fontSize="13.5" fontWeight="600">▸ {bullet1}</text>
                  <text x="0" y="80" fill="#1E293B" fontSize="13.5" fontWeight="600">▸ {bullet2}</text>
                  <text x="0" y="104" fill="#0284C7" fontSize="12" fontWeight="700" fontFamily="'Roboto Mono', monospace">us-central1 • Active-Active SLA</text>
                </g>
              </g>
            );
          }

          // Standard Card Layout
          const detailsList = node.details || [];
          const hasBullets = detailsList.length > 0;

          return (
            <g
              key={node.id}
              transform={`matrix(${nodeSpring}, 0, 0, ${nodeSpring}, ${node.x + (node.width * (1 - nodeSpring)) / 2}, ${node.y + (node.height * (1 - nodeSpring)) / 2})`}
            >
              <rect x="0" y="0" width={node.width} height={node.height} rx="16" ry="16" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.8" filter="url(#glow-filter)" />
              <path d={`M 0 16 C 0 7.16 7.16 0 16 0 L ${node.width - 16} 0 C ${node.width - 7.16} 0 ${node.width} 7.16 ${node.width} 16 L ${node.width} 5 L 0 5 Z`} fill={node.color} />
              <g transform="translate(24, 24)" dangerouslySetInnerHTML={{ __html: getGcpServiceIconSvg(node.service || node.label, 56) }} />

              <g transform="translate(96, 22)">
                <rect x="0" y="0" width={Math.min(230, node.categoryTag.length * 8.5 + 20)} height="22" rx="6" fill="#F1F5F9" />
                <text x="10" y="15" fill={node.color} fontSize="10.5" fontWeight="800" letterSpacing="0.6">{node.categoryTag}</text>
                
                <rect x={node.width - 96 - 126} y="0" width="116" height="22" rx="11" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
                <circle cx={node.width - 96 - 114} cy="11" r="3.5" fill="#10B981" />
                <text x={node.width - 96 - 63} y="15" fill="#065F46" fontSize="9" fontWeight="800" textAnchor="middle">{node.statusChip}</text>

                <text x="0" y="54" fill="#0F172A" fontSize="20" fontWeight="700">{node.label}</text>
                <text x="0" y="78" fill="#475569" fontSize="13" fontWeight="500" fontFamily="'Roboto Mono', monospace">{node.sublabel}</text>
              </g>

              {hasBullets && (
                <>
                  <line x1="20" y1="106" x2={node.width - 20} y2="106" stroke="#F1F5F9" strokeWidth="1.5" />
                  <text x="24" y="126" fill="#334155" fontSize="12" fontWeight="600">▸ {detailsList[0]}</text>
                  {detailsList[1] && <text x="24" y="148" fill="#334155" fontSize="12" fontWeight="600">▸ {detailsList[1]}</text>}
                </>
              )}

              {/* Enterprise High-Density Spec Container (For Scaled Cards) */}
              {node.height >= 300 && (
                <g transform="translate(20, 176)">
                  <rect x={0} y={0} width={node.width - 40} height={94} rx={8} fill="#F8FAFC" stroke="#E2E8F0" strokeWidth={1.2} />
                  <text x={12} y={22} fill="#475569" fontSize={10.5} fontWeight={700} letterSpacing={0.5}>DEPLOYMENT ARCHITECTURE SPEC</text>
                  <rect x={node.width - 40 - 140} y={7} width={128} height={20} rx={10} fill="#EFF6FF" />
                  <text x={node.width - 40 - 76} y={21} fill="#1D4ED8" fontSize={9} fontWeight={800} fontFamily="'Roboto Mono', monospace" textAnchor="middle">ACTIVE-ACTIVE HA</text>
                  
                  <text x={12} y={48} fill="#1E293B" fontSize={12} fontWeight={600}>HA Topology: Multi-Zone Regional Redundancy</text>
                  <text x={12} y={72} fill="#0284C7" fontSize={11} fontWeight={700} fontFamily="'Roboto Mono', monospace">Telemetry: OpenTelemetry Traces • SLI 99.99%</text>
                </g>
              )}
              {node.height >= 260 && node.height < 300 && (
                <g transform="translate(20, 168)">
                  <rect x={0} y={0} width={node.width - 40} height={52} rx={6} fill="#F8FAFC" stroke="#E2E8F0" strokeWidth={1.2} />
                  <text x={12} y={20} fill="#475569" fontSize={10} fontWeight={700} letterSpacing={0.5}>SECURITY SPECIFICATION</text>
                  <text x={12} y={38} fill="#0284C7" fontSize={10.5} fontWeight={700} fontFamily="'Roboto Mono', monospace">mTLS 1.3 • Anti-DDoS Anycast VIP Ingress</text>
                </g>
              )}

              <line x1="20" y1={node.height - 38} x2={node.width - 20} y2={node.height - 38} stroke="#F1F5F9" strokeWidth="1.5" />
              <text x="24" y={node.height - 14} fill="#64748B" fontSize="11.5" fontWeight="500">Resource: <tspan fill="#0F172A" fontWeight="700" fontFamily="'Roboto Mono', monospace">{node.id}</tspan></text>
              <text x={node.width - 24} y={node.height - 14} fill="#0284C7" fontSize="11.5" fontWeight="700" fontFamily="'Roboto Mono', monospace" textAnchor="end">{node.techSpec || "us-central1"}</text>
            </g>
          );
        })}

        {/* ========================================================================= */}
        {/* 5b. CONNECTOR PILL BADGES (Rendered above cards for 0% clipping) */}
        {/* ========================================================================= */}
        {edges.map((edge, idx) => {
          const edgeProgress = interpolate(
            frame,
            [edge.startFrame, edge.startFrame + 20],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // True cubic bezier evaluation at t=0.5: B(0.5) = 0.125*p1 + 0.375*cp1 + 0.375*cp2 + 0.125*p2
          const midX = 0.125 * edge.p1.x + 0.375 * edge.cp1.x + 0.375 * edge.cp2.x + 0.125 * edge.p2.x;
          const midY = 0.125 * edge.p1.y + 0.375 * edge.cp1.y + 0.375 * edge.cp2.y + 0.125 * edge.p2.y;
          const badgeW = Math.max(105, Math.min(138, edge.label.length * 6.8 + 36));
          const badgeH = 28;

          return (
            <g key={`pill-${edge.id}`} opacity={edgeProgress}>
              <g transform={`translate(${midX - badgeW / 2}, ${midY - badgeH / 2})`}>
                <rect width={badgeW} height={badgeH} rx={7} fill="#FFFFFF" stroke={edge.color} strokeWidth={1.6} filter="url(#badge-shadow)" />
                {/* Step Icon */}
                <circle cx={14} cy={14} r={8} fill={edge.color} />
                <text x={14} y={17} fill="#FFFFFF" fontSize={9} fontWeight={900} fontFamily="'Google Sans Flex', sans-serif" textAnchor="middle">{idx + 1}</text>
                {/* Protocol Label */}
                <text x={28} y={17.5} fill="#0F172A" fontSize={10} fontWeight={800} fontFamily="'Roboto Mono', monospace">{edge.label}</text>
              </g>
            </g>
          );
        })}

        {/* Optical Stylus Tracker */}
        {stylusTip.visible && (
          <g transform={`translate(${stylusTip.x}, ${stylusTip.y})`}>
            <circle r="20" fill={stylusTip.color} opacity="0.35" filter="url(#glow-filter)" />
            <circle r="8" fill={stylusTip.color} />
            <line x1="0" y1="0" x2="-30" y2="-52" stroke="#1E293B" strokeWidth="5" strokeLinecap="round" />
            <line x1="-2" y1="-3" x2="-28" y2="-49" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* ========================================================================= */}
        {/* 6. GOOGLE ARCHITECTURE CENTER LEGEND */}
        {/* ========================================================================= */}
        <g opacity={interpolate(frame, [100, 130], [0, 1], { extrapolateRight: "clamp" })} transform="translate(80, 2035)">
          <rect width="3680" height="85" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" filter="url(#glow-filter)" />
          
          <g transform="translate(24, 28)">
            {/* Legend Item 1: Ingress Edge */}
            <rect x="0" y="6" width="24" height="14" rx="3" fill="#F0F9FF" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="32" y="18" fill="#334155" fontSize="12" fontWeight="700">Zone 1: Ingress Edge</text>

            {/* Legend Item 2: Regional VPC */}
            <rect x="180" y="6" width="24" height="14" rx="3" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="212" y="18" fill="#334155" fontSize="12" fontWeight="700">Zone 2: App Mesh</text>

            {/* Legend Item 3: Event Streaming */}
            <rect x="360" y="6" width="24" height="14" rx="3" fill="#FFF7ED" stroke="#F97316" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="392" y="18" fill="#334155" fontSize="12" fontWeight="700">Zone 3: Streaming Bus</text>

            {/* Legend Item 4: Producer VPC / Vertex AI */}
            <rect x="560" y="6" width="24" height="14" rx="3" fill="#FAF5FF" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="592" y="18" fill="#334155" fontSize="12" fontWeight="700">Zone 4: Vertex AI (PSC)</text>

            {/* Legend Item 5: Lakehouse & DB */}
            <rect x="760" y="6" width="24" height="14" rx="3" fill="#F0FDFA" stroke="#0D9488" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="792" y="18" fill="#334155" fontSize="12" fontWeight="700">Zone 5: Lakehouse &amp; DB</text>

            {/* Legend Item 6: Zero-Trust Security Baseline */}
            <rect x="970" y="6" width="24" height="14" rx="3" fill="#F8FAFC" stroke="#334155" strokeWidth="1.5" />
            <text x="1002" y="18" fill="#334155" fontSize="12" fontWeight="700">Zone 6: Zero-Trust Baseline</text>
          </g>

          {/* Vertical Separator */}
          <line x1="1230" y1="18" x2="1230" y2="68" stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Middle Section: 4 Architectural Flow Types */}
          <g transform="translate(1250, 24)">
            <text x="0" y="14" fill="#0F172A" fontSize="10.5" fontWeight="900" fontFamily="'Roboto Mono', monospace" letterSpacing="1">ARCHITECTURAL FLOWS:</text>
            
            {/* Flow 1: User Flow */}
            <g transform="translate(170, 0)">
              <line x1="0" y1="10" x2="28" y2="10" stroke="#0284C7" strokeWidth="3" />
              <polygon points="28,6 36,10 28,14" fill="#0284C7" />
              <text x="44" y="14" fill="#0284C7" fontSize="11" fontWeight="800">User Flow <tspan fill="#64748B" fontSize="9.5" fontWeight="500">(Ingress / TLS 1.3)</tspan></text>
            </g>

            {/* Flow 2: Process Flow */}
            <g transform="translate(430, 0)">
              <line x1="0" y1="10" x2="28" y2="10" stroke="#6366F1" strokeWidth="3" strokeDasharray="6 3" />
              <polygon points="28,6 36,10 28,14" fill="#6366F1" />
              <text x="44" y="14" fill="#4F46E5" fontSize="11" fontWeight="800">Process Flow <tspan fill="#64748B" fontSize="9.5" fontWeight="500">(Mesh / gRPC)</tspan></text>
            </g>

            {/* Flow 3: Data Flow */}
            <g transform="translate(680, 0)">
              <line x1="0" y1="10" x2="28" y2="10" stroke="#0D9488" strokeWidth="4" />
              <polygon points="28,6 36,10 28,14" fill="#0D9488" />
              <text x="44" y="14" fill="#0F766E" fontSize="11" fontWeight="800">Data Flow <tspan fill="#64748B" fontSize="9.5" fontWeight="500">(Streaming / Lakehouse)</tspan></text>
            </g>

            {/* Flow 4: Security Flow */}
            <g transform="translate(980, 0)">
              <line x1="0" y1="10" x2="28" y2="10" stroke="#DC2626" strokeWidth="2.5" strokeDasharray="4 3" />
              <polygon points="28,6 36,10 28,14" fill="#DC2626" />
              <text x="44" y="14" fill="#991B1B" fontSize="11" fontWeight="800">Security Flow <tspan fill="#64748B" fontSize="9.5" fontWeight="500">(KMS CMEK)</tspan></text>
            </g>

            <text x="0" y="38" fill="#64748B" fontSize="10" fontFamily="'Roboto Mono', monospace">Every connector path indicates causal direction, execution layer, and protocol telemetry</text>
          </g>

          <g transform="translate(3240, 26)">
            <text x="410" y="18" fill="#64748B" fontSize="11.5" fontWeight="600" fontFamily="'Roboto Mono', monospace" textAnchor="end">Google Cloud Architecture Center Standard Reference 2026</text>
            <text x="410" y="38" fill="#94A3B8" fontSize="10.5" textAnchor="end">Broadcast-Grade Enterprise Topologies • Multi-Tier Zero-Trust Micro-Architecture</text>
          </g>
        </g>
      </svg>
    </div>
  );
};
