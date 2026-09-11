import { WhiteboardManifest, WhiteboardElement, WhiteboardEdge } from "../types/whiteboard.js";
import {
  getGcpServiceIconSvg,
  renderGoogleCloudLogoSvg,
  renderVpcNetworkIconSvg,
  renderVpcScLockIconSvg
} from "./gcp-icons.js";

function escapeXml(value: string): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function exportWhiteboardToSvg(manifest: WhiteboardManifest): string {
  const { width, height } = manifest.canvas;
  const hasExplicitZones = manifest.elements.some(e => Boolean(e.zone));

  // Step numbers for connectors
  const stepNumberIcons = ["❶", "❷", "❸", "❹", "❺", "❻", "❼", "❽", "❾", "❿", "⓫", "⓬", "⓭", "⓮", "⓯", "⓰"];

  // 1. Generate Architecture Nodes (Cards)
  const nodeElementsSvg = manifest.elements.map(el => {
    let categoryTag = el.badge || "GOOGLE CLOUD SERVICE";
    let statusChip = "MANAGED";
    let categoryColor = "#1A73E8";
    let specDetails = el.techSpec || el.subLabel || "Dedicated Regional Endpoint";

    const s = (el.label + " " + el.id + " " + (el.zone || "")).toLowerCase();
    if (s.includes("armor") || s.includes("security") || s.includes("waf") || s.includes("iam") || s.includes("vpc_sc")) {
      categoryColor = "#DC2626";
      statusChip = el.badge || "SECURITY ACTIVE";
    } else if (s.includes("load") || s.includes("alb") || s.includes("balancer") || s.includes("cdn") || s.includes("ingress")) {
      categoryColor = "#D97706";
      statusChip = el.badge || "REGIONAL PROXY";
    } else if (s.includes("run") || s.includes("gateway") || s.includes("gke") || s.includes("compute")) {
      categoryColor = "#4F46E5";
      statusChip = el.badge || "VPC EGRESS";
    } else if (s.includes("pubsub") || s.includes("dataflow") || s.includes("stream")) {
      categoryColor = "#EA580C";
      statusChip = el.badge || "STREAMING";
    } else if (s.includes("vertex") || s.includes("gemini") || s.includes("ai") || s.includes("vector")) {
      categoryColor = "#7C3AED";
      statusChip = el.badge || "PRIVATE ENDPOINT";
    } else if (s.includes("spanner") || s.includes("bigquery") || s.includes("storage") || s.includes("lakehouse") || s.includes("memorystore")) {
      categoryColor = "#059669";
      statusChip = el.badge || "LAKEHOUSE";
    } else if (s.includes("monitoring") || s.includes("audit") || s.includes("logging") || s.includes("sre")) {
      categoryColor = "#0284C7";
      statusChip = el.badge || "SRE ACTIVE";
    } else if (s.includes("client") || s.includes("actor")) {
      categoryColor = "#0284C7";
      statusChip = el.badge || "mTLS 1.3 ACTIVE";
    }

    const iconSvg = getGcpServiceIconSvg(el.cloudIcon || el.label + " " + el.id, 56);

    // ZONE 6 Wide Card Layout (width >= 1000)
    if (el.width >= 1000) {
      const detailsList = el.details || [];
      const bullet1 = detailsList[0] || "Immutable SRE Telemetry & Compliance Guardrails";
      const bullet2 = detailsList[1] || "Enterprise Zero-Trust Security Baseline";

      return `
      <!-- Zone 6 Enterprise Baseline Node: ${el.id} -->
      <g id="node-${el.id}" transform="translate(${el.x}, ${el.y})" class="whiteboard-node">
        <rect x="0" y="0" width="${el.width}" height="${el.height}" rx="16" ry="16"
              fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8" filter="url(#card-shadow)" />
        
        <!-- Category Top Accent Bar -->
        <path d="M 0 16 C 0 7.16 7.16 0 16 0 L ${el.width - 16} 0 C ${el.width - 7.16} 0 ${el.width} 7.16 ${el.width} 16 L ${el.width} 5 L 0 5 Z" fill="${categoryColor}" />

        <!-- Icon Badge -->
        <g transform="translate(24, 26)">
          ${iconSvg}
        </g>

        <!-- Column 1: Core Service Info -->
        <g transform="translate(98, 22)">
          <!-- Top Row: Category Tag Pill -->
          <rect x="0" y="0" width="${Math.min(260, categoryTag.length * 8.5 + 20)}" height="22" rx="6" fill="#F1F5F9" />
          <text x="10" y="15" fill="${categoryColor}" font-size="10.5" font-weight="800" font-family="'Google Sans Flex', -apple-system, sans-serif" letter-spacing="0.8">${categoryTag}</text>

          <!-- Primary Title -->
          <text x="0" y="52" fill="#0F172A" font-size="21" font-weight="700" font-family="'Google Sans Flex', -apple-system, sans-serif">${escapeXml(el.label)}</text>
          
          <!-- Subtitle Spec -->
          <text x="0" y="78" fill="#475569" font-size="13" font-weight="500" font-family="'Roboto Mono', monospace">${escapeXml(el.subLabel || "")}</text>

          <!-- Resource ID -->
          <text x="0" y="104" fill="#64748B" font-size="11.5" font-weight="500" font-family="'Roboto Mono', monospace">Resource: <tspan fill="#0F172A" font-weight="700">${el.id}</tspan></text>
        </g>

        <!-- Column 2: Architectural Specifications & Bullets -->
        <g transform="translate(560, 22)">
          <!-- Status Chip + TechSpec Pill -->
          <rect x="0" y="0" width="130" height="22" rx="11" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1" />
          <circle cx="12" cy="11" r="3.5" fill="#10B981" />
          <text x="70" y="15" fill="#065F46" font-size="9" font-weight="800" font-family="'Google Sans Flex', sans-serif" text-anchor="middle">${statusChip}</text>

          <rect x="140" y="0" width="220" height="22" rx="11" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1" />
          <text x="250" y="15" fill="#334155" font-size="9.5" font-weight="700" font-family="'Roboto Mono', monospace" text-anchor="middle">${escapeXml(specDetails)}</text>

          <!-- Bullets -->
          <text x="0" y="54" fill="#1E293B" font-size="13.5" font-weight="600" font-family="'Google Sans Flex', sans-serif">▸ ${escapeXml(bullet1)}</text>
          <text x="0" y="80" fill="#1E293B" font-size="13.5" font-weight="600" font-family="'Google Sans Flex', sans-serif">▸ ${escapeXml(bullet2)}</text>
          <text x="0" y="104" fill="#0284C7" font-size="12" font-weight="700" font-family="'Roboto Mono', monospace">us-central1 • Active-Active SLA</text>
        </g>
      </g>
      `;
    }

    // Standard Card Layout (Zones 1-5, width ~460-480, height 200-240)
    const detailsList = el.details || [];
    const hasBullets = detailsList.length > 0;

    return `
      <!-- Google Cloud Architecture Node: ${el.id} -->
      <g id="node-${el.id}" transform="translate(${el.x}, ${el.y})" class="whiteboard-node">
        <rect x="0" y="0" width="${el.width}" height="${el.height}" rx="16" ry="16"
              fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.8"
              filter="url(#card-shadow)" />
        
        <!-- Category Top Accent Bar -->
        <path d="M 0 16 C 0 7.16 7.16 0 16 0 L ${el.width - 16} 0 C ${el.width - 7.16} 0 ${el.width} 7.16 ${el.width} 16 L ${el.width} 5 L 0 5 Z" fill="${categoryColor}" />

        <!-- Authentic Google Cloud Service Vector Icon Badge -->
        <g transform="translate(24, 24)">
          ${iconSvg}
        </g>

        <!-- Right Content Section -->
        <g transform="translate(96, 22)">
          <!-- Top Row: Category Tag Pill + Status Chip -->
          <rect x="0" y="0" width="${Math.min(230, categoryTag.length * 8.5 + 20)}" height="22" rx="6" fill="#F1F5F9" />
          <text x="10" y="15" fill="${categoryColor}" font-size="10.5" font-weight="800" font-family="'Google Sans Flex', -apple-system, sans-serif" letter-spacing="0.6">${categoryTag}</text>
          
          <rect x="${el.width - 96 - 126}" y="0" width="116" height="22" rx="11" fill="#ECFDF5" stroke="#A7F3D0" stroke-width="1" />
          <circle cx="${el.width - 96 - 114}" cy="11" r="3.5" fill="#10B981" />
          <text x="${el.width - 96 - 63}" y="15" fill="#065F46" font-size="9" font-weight="800" font-family="'Google Sans Flex', -apple-system, sans-serif" text-anchor="middle">${statusChip}</text>

          <!-- Primary Service Name -->
          <text x="0" y="54" fill="#0F172A" font-size="20" font-weight="700" font-family="'Google Sans Flex', -apple-system, sans-serif">${escapeXml(el.label)}</text>
          
          <!-- Secondary Specification -->
          <text x="0" y="78" fill="#475569" font-size="13" font-weight="500" font-family="'Roboto Mono', monospace">${escapeXml(el.subLabel || "")}</text>
        </g>

        <!-- Technical Bullets Section -->
        ${hasBullets ? `
        <line x1="20" y1="106" x2="${el.width - 20}" y2="106" stroke="#F1F5F9" stroke-width="1.5" />
        <text x="24" y="126" fill="#334155" font-size="12" font-weight="600" font-family="'Google Sans Flex', sans-serif">▸ ${escapeXml(detailsList[0])}</text>
        ${detailsList[1] ? `<text x="24" y="148" fill="#334155" font-size="12" font-weight="600" font-family="'Google Sans Flex', sans-serif">▸ ${escapeXml(detailsList[1])}</text>` : ""}
        ` : ""}

        <!-- Enterprise High-Density Spec Container (For Scaled Cards) -->
        ${el.height >= 300 ? `
        <g transform="translate(20, 176)">
          <rect x="0" y="0" width="${el.width - 40}" height="94" rx="8" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2" />
          <text x="12" y="22" fill="#475569" font-size="10.5" font-weight="700" font-family="'Google Sans Flex', sans-serif" letter-spacing="0.5">DEPLOYMENT ARCHITECTURE SPEC</text>
          <rect x="${el.width - 40 - 140}" y="7" width="128" height="20" rx="10" fill="#EFF6FF" />
          <text x="${el.width - 40 - 76}" y="21" fill="#1D4ED8" font-size="9" font-weight="800" font-family="'Roboto Mono', monospace" text-anchor="middle">ACTIVE-ACTIVE HA</text>
          
          <text x="12" y="48" fill="#1E293B" font-size="12" font-weight="600" font-family="'Google Sans Flex', sans-serif">HA Topology: Multi-Zone Regional Redundancy</text>
          <text x="12" y="72" fill="#0284C7" font-size="11" font-weight="700" font-family="'Roboto Mono', monospace">Telemetry: OpenTelemetry Traces • SLI 99.99%</text>
        </g>
        ` : el.height >= 260 ? `
        <g transform="translate(20, 168)">
          <rect x="0" y="0" width="${el.width - 40}" height="52" rx="6" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.2" />
          <text x="12" y="20" fill="#475569" font-size="10" font-weight="700" font-family="'Google Sans Flex', sans-serif" letter-spacing="0.5">SECURITY SPECIFICATION</text>
          <text x="12" y="38" fill="#0284C7" font-size="10.5" font-weight="700" font-family="'Roboto Mono', monospace">mTLS 1.3 • Anti-DDoS Anycast VIP Ingress</text>
        </g>
        ` : ""}

        <!-- Bottom Metadata Strip -->
        <line x1="20" y1="${el.height - 38}" x2="${el.width - 20}" y2="${el.height - 38}" stroke="#F1F5F9" stroke-width="1.5" />
        <text x="24" y="${el.height - 14}" fill="#64748B" font-size="11.5" font-weight="500" font-family="'Google Sans Flex', sans-serif">Resource: <tspan fill="#0F172A" font-weight="700" font-family="'Roboto Mono', monospace">${el.id}</tspan></text>
        <text x="${el.width - 24}" y="${el.height - 14}" fill="#0284C7" font-size="11.5" font-weight="700" font-family="'Roboto Mono', monospace" text-anchor="end">${escapeXml(el.techSpec || "us-central1")}</text>
      </g>
    `;
  }).join("\n");

  // 2. Generate Authentic Google Cloud Connectors with Directional Arrowheads & Flow Classifications
  const edgePathsSvg = manifest.edges.map((edge) => {
    const sourceEl = manifest.elements.find(e => e.id === edge.sourceId);
    const targetEl = manifest.elements.find(e => e.id === edge.targetId);
    if (!sourceEl || !targetEl) return "";

    let p1 = { x: sourceEl.x + sourceEl.width, y: sourceEl.y + sourceEl.height / 2 };
    let cp1 = { x: p1.x + 60, y: p1.y };
    let cp2 = { x: targetEl.x - 60, y: targetEl.y + targetEl.height / 2 };
    let p2 = { x: targetEl.x, y: targetEl.y + targetEl.height / 2 };

    if (edge.points && edge.points.length >= 4) {
      p1 = edge.points[0];
      cp1 = edge.points[1];
      cp2 = edge.points[2];
      p2 = edge.points[3];
    } else if (edge.points && edge.points.length >= 2) {
      p1 = edge.points[0];
      p2 = edge.points[1];
      const dx = p2.x - p1.x;
      cp1 = { x: p1.x + dx * 0.5, y: p1.y };
      cp2 = { x: p1.x + dx * 0.5, y: p2.y };
    }

    const pathD = `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;

    const flowType = edge.flow || "data_flow";
    const flowTag =
      flowType === "user_flow" ? "USER FLOW" :
      flowType === "process_flow" ? "PROCESS FLOW" :
      flowType === "security_flow" ? "SECURITY" : "DATA FLOW";

    const flowStrokeDash =
      flowType === "process_flow" ? 'stroke-dasharray="8 5"' :
      flowType === "security_flow" ? 'stroke-dasharray="4 4"' : "";

    const flowStrokeWidth =
      flowType === "data_flow" ? 'stroke-width="4"' :
      flowType === "user_flow" ? 'stroke-width="3.5"' :
      flowType === "process_flow" ? 'stroke-width="3"' : 'stroke-width="2.5"';

    const markerUrl = `url(#arrow-${flowType})`;

    return `
      <!-- Edge Path: ${edge.id} (${edge.sourceId} -> ${edge.targetId}) [${flowTag}] -->
      <g id="edge-path-${edge.id}" class="whiteboard-edge-path">
        <!-- Base Path Track -->
        <path d="${pathD}" fill="none" stroke="#E2E8F0" stroke-width="2" stroke-dasharray="6 6" />
        <!-- Directional Flow Path with Arrowhead -->
        <path d="${pathD}" fill="none" stroke="${edge.color}" ${flowStrokeWidth} ${flowStrokeDash} stroke-linecap="round" marker-end="${markerUrl}" />
        
        <!-- Source Port Origin Dot -->
        <circle cx="${p1.x}" cy="${p1.y}" r="4" fill="${edge.color}" />
        <!-- Target Port Ingress Ring -->
        <circle cx="${p2.x}" cy="${p2.y}" r="6" fill="#FFFFFF" stroke="${edge.color}" stroke-width="2.5" />
        <circle cx="${p2.x}" cy="${p2.y}" r="2" fill="${edge.color}" />
      </g>
    `;
  }).join("\n");

  const edgeBadgesSvg = manifest.edges.map((edge, idx) => {
    const sourceEl = manifest.elements.find(e => e.id === edge.sourceId);
    const targetEl = manifest.elements.find(e => e.id === edge.targetId);
    if (!sourceEl || !targetEl) return "";

    let p1 = { x: sourceEl.x + sourceEl.width, y: sourceEl.y + sourceEl.height / 2 };
    let cp1 = { x: p1.x + 60, y: p1.y };
    let cp2 = { x: targetEl.x - 60, y: targetEl.y + targetEl.height / 2 };
    let p2 = { x: targetEl.x, y: targetEl.y + targetEl.height / 2 };

    if (edge.points && edge.points.length >= 4) {
      p1 = edge.points[0];
      cp1 = edge.points[1];
      cp2 = edge.points[2];
      p2 = edge.points[3];
    } else if (edge.points && edge.points.length >= 2) {
      p1 = edge.points[0];
      p2 = edge.points[1];
      const dx = p2.x - p1.x;
      cp1 = { x: p1.x + dx * 0.5, y: p1.y };
      cp2 = { x: p1.x + dx * 0.5, y: p2.y };
    }

    // True cubic bezier evaluation at t=0.5: B(0.5) = 0.125*p1 + 0.375*cp1 + 0.375*cp2 + 0.125*p2
    const midX = 0.125 * p1.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * p2.x;
    const midY = 0.125 * p1.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * p2.y;

    const badgeW = Math.max(105, Math.min(138, edge.protocol.length * 6.8 + 36));
    const badgeH = 28;

    return `
      <!-- Edge Badge: ${edge.id} (${edge.protocol}) -->
      <g id="edge-badge-${edge.id}" class="whiteboard-edge-badge" transform="translate(${midX - badgeW / 2}, ${midY - badgeH / 2})">
        <rect width="${badgeW}" height="${badgeH}" rx="7" fill="#FFFFFF" stroke="${edge.color}" stroke-width="1.6" filter="url(#badge-shadow)" />
        <!-- Step Icon -->
        <circle cx="14" cy="14" r="8" fill="${edge.color}" />
        <text x="14" y="17" fill="#FFFFFF" font-size="9" font-weight="900" font-family="'Google Sans Flex', sans-serif" text-anchor="middle">${idx + 1}</text>
        <!-- Protocol Label -->
        <text x="28" y="17.5" fill="#0F172A" font-size="10" font-weight="800" font-family="'Roboto Mono', monospace">${escapeXml(edge.protocol)}</text>
      </g>
    `;
  }).join("\n");

  // 3. Render Boundary Enclosures (6 Symmetrical Zones or Legacy 3-Box Fallback)
  let boundariesSvg = "";

  if (hasExplicitZones) {
    boundariesSvg = `
    <!-- ZONE 1: INGRESS & EDGE GATEWAY -->
    <g id="zone-ingress-edge">
      <rect x="80" y="180" width="560" height="1570" rx="20" ry="20"
            fill="#F8FAFC" stroke="#0284C7" stroke-width="2" stroke-dasharray="8 6" />
      <rect x="80" y="180" width="560" height="46" rx="20" ry="20" fill="#F0F9FF" />
      <path d="M 80 206 L 80 226 L 640 226 L 640 206 Z" fill="#F0F9FF" />
      <text x="100" y="209" fill="#0369A1" font-size="13" font-weight="800" font-family="'Google Sans Flex', sans-serif" letter-spacing="1">ZONE 1: INGRESS &amp; EDGE GATEWAY</text>
      <rect x="470" y="191" width="150" height="24" rx="12" fill="#E0F2FE" />
      <text x="545" y="207" fill="#0284C7" font-size="10" font-weight="800" font-family="'Roboto Mono', monospace" text-anchor="middle">GLOBAL ANYCAST VIP</text>
    </g>

    <!-- ZONE 2: APPLICATION CORE MESH (REGIONAL VPC) -->
    <g id="zone-app-mesh">
      <rect x="670" y="180" width="1530" height="765" rx="20" ry="20"
            fill="#FFFFFF" stroke="#3B82F6" stroke-width="2" stroke-dasharray="6 4" />
      <rect x="670" y="180" width="1530" height="46" rx="20" ry="20" fill="#EFF6FF" />
      <path d="M 670 206 L 670 226 L 2200 226 L 2200 206 Z" fill="#EFF6FF" />
      <g transform="translate(686, 191)">
        ${renderVpcNetworkIconSvg(24)}
      </g>
      <text x="722" y="209" fill="#1D4ED8" font-size="13.5" font-weight="800" font-family="'Google Sans Flex', sans-serif">ZONE 2: APPLICATION CORE MESH (REGIONAL VPC: vpc-prod-private)</text>
      <rect x="2000" y="191" width="180" height="24" rx="12" fill="#DBEAFE" />
      <text x="2090" y="207" fill="#1D4ED8" font-size="10.5" font-weight="700" font-family="'Roboto Mono', monospace" text-anchor="middle">VPC CIDR: 10.128.0.0/16</text>
    </g>

    <!-- ZONE 3: REAL-TIME EVENT STREAMING & INGESTION -->
    <g id="zone-event-streaming">
      <rect x="670" y="975" width="1530" height="775" rx="20" ry="20"
            fill="#FFFFFF" stroke="#F97316" stroke-width="2" stroke-dasharray="6 4" />
      <rect x="670" y="975" width="1530" height="46" rx="20" ry="20" fill="#FFF7ED" />
      <path d="M 670 1001 L 670 1021 L 2200 1021 L 2200 1001 Z" fill="#FFF7ED" />
      <text x="700" y="1004" fill="#C2410C" font-size="13.5" font-weight="800" font-family="'Google Sans Flex', sans-serif" letter-spacing="0.5">ZONE 3: REAL-TIME EVENT STREAMING &amp; INGESTION (HIGH-THROUGHPUT FABRIC)</text>
      <rect x="2000" y="986" width="180" height="24" rx="12" fill="#FFEDD5" />
      <text x="2090" y="1002" fill="#C2410C" font-size="10.5" font-weight="700" font-family="'Roboto Mono', monospace" text-anchor="middle">SUBNET: 10.128.32.0/20</text>
    </g>

    <!-- ZONE 4: VERTEX AI & INTELLIGENCE HUB (PRODUCER VPC) -->
    <g id="zone-vertex-ai">
      <rect x="2230" y="180" width="1530" height="765" rx="20" ry="20"
            fill="#FAF5FF" stroke="#7C3AED" stroke-width="2" stroke-dasharray="8 6" />
      <rect x="2230" y="180" width="1530" height="46" rx="20" ry="20" fill="#F3E8FF" />
      <path d="M 2230 206 L 2230 226 L 3760 226 L 3760 206 Z" fill="#F3E8FF" />
      <g transform="translate(2246, 191)">
        ${renderVpcScLockIconSvg(24)}
      </g>
      <text x="2282" y="209" fill="#6D28D9" font-size="13.5" font-weight="800" font-family="'Google Sans Flex', sans-serif">ZONE 4: VERTEX AI &amp; INTELLIGENCE HUB (GOOGLE SERVICES NETWORK / PSC)</text>
      <rect x="3480" y="191" width="260" height="24" rx="12" fill="#FEE2E2" />
      <text x="3610" y="207" fill="#991B1B" font-size="10" font-weight="800" font-family="'Roboto Mono', monospace" text-anchor="middle">VPC-SC PERIMETER LOCK • ZERO-EGRESS</text>
    </g>

    <!-- ZONE 5: MULTI-REGION LAKEHOUSE & PERSISTENCE -->
    <g id="zone-lakehouse-db">
      <rect x="2230" y="975" width="1530" height="775" rx="20" ry="20"
            fill="#F0FDFA" stroke="#0D9488" stroke-width="2" stroke-dasharray="6 4" />
      <rect x="2230" y="975" width="1530" height="46" rx="20" ry="20" fill="#CCFBF1" />
      <path d="M 2230 1001 L 2230 1021 L 3760 1021 L 3760 1001 Z" fill="#CCFBF1" />
      <text x="2256" y="1004" fill="#0F766E" font-size="13.5" font-weight="800" font-family="'Google Sans Flex', sans-serif" letter-spacing="0.5">ZONE 5: MULTI-REGION LAKEHOUSE &amp; PERSISTENCE (nam3 DUAL-REGION STORAGE)</text>
      <rect x="3480" y="986" width="260" height="24" rx="12" fill="#E6FFFA" stroke="#99F6E4" stroke-width="1" />
      <text x="3610" y="1002" fill="#0F766E" font-size="10" font-weight="800" font-family="'Roboto Mono', monospace" text-anchor="middle">99.999% SLA • nam3 REPLICATION</text>
    </g>

    <!-- ZONE 6: ZERO-TRUST SECURITY, SRE OBSERVABILITY & GOVERNANCE BASELINE -->
    <g id="zone-zero-trust">
      <rect x="80" y="1775" width="3680" height="235" rx="18" ry="18"
            fill="#F8FAFC" stroke="#334155" stroke-width="2" />
      <rect x="80" y="1775" width="3680" height="44" rx="18" ry="18" fill="#F1F5F9" />
      <path d="M 80 1799 L 80 1819 L 3760 1819 L 3760 1799 Z" fill="#F1F5F9" />
      <text x="104" y="1803" fill="#1E293B" font-size="13" font-weight="800" font-family="'Google Sans Flex', sans-serif" letter-spacing="1">ZONE 6: ZERO-TRUST SECURITY, SRE OBSERVABILITY &amp; GOVERNANCE BASELINE</text>
      <rect x="3460" y="1785" width="280" height="24" rx="12" fill="#E2E8F0" />
      <text x="3600" y="1801" fill="#334155" font-size="10" font-weight="800" font-family="'Roboto Mono', monospace" text-anchor="middle">ENTERPRISE SRE &amp; COMPLIANCE STANDARD</text>
    </g>
    `;
  } else {
    // Unzoned fallback: 3-box container layout
    const clientEls = manifest.elements.filter(e => e.flow === "user_flow" || e.id.includes("client") || e.id.includes("actor"));
    const gcpEls = manifest.elements.filter(e => !clientEls.includes(e));
    const vpcEls = gcpEls.filter(e => !e.id.includes("vertex") && !e.id.includes("gemini") && !e.id.includes("bigquery"));
    const producerEls = gcpEls.filter(e => e.id.includes("vertex") || e.id.includes("gemini") || e.id.includes("bigquery"));

    let vpcBox = { minX: 1100, maxX: 2600, minY: 720, maxY: 1320 };
    if (vpcEls.length > 0) {
      vpcBox = {
        minX: Math.min(...vpcEls.map(e => e.x)) - 70,
        maxX: Math.max(...vpcEls.map(e => e.x + e.width)) + 70,
        minY: Math.min(...vpcEls.map(e => e.y)) - 100,
        maxY: Math.max(...vpcEls.map(e => e.y + e.height)) + 70
      };
    }

    let producerBox = { minX: 2700, maxX: 3500, minY: 720, maxY: 1320 };
    const targetProducerEls = producerEls.length > 0 ? producerEls : gcpEls.slice(-1);
    if (targetProducerEls.length > 0) {
      producerBox = {
        minX: Math.min(...targetProducerEls.map(e => e.x)) - 70,
        maxX: Math.max(...targetProducerEls.map(e => e.x + e.width)) + 70,
        minY: Math.min(...targetProducerEls.map(e => e.y)) - 100,
        maxY: Math.max(...targetProducerEls.map(e => e.y + e.height)) + 70
      };
    }

    let clientBox = { minX: 180, maxX: 920, minY: 720, maxY: 1320 };
    const targetClientEls = clientEls.length > 0 ? clientEls : manifest.elements.slice(0, 1);
    if (targetClientEls.length > 0) {
      clientBox = {
        minX: Math.min(...targetClientEls.map(e => e.x)) - 70,
        maxX: Math.max(...targetClientEls.map(e => e.x + e.width)) + 70,
        minY: Math.min(...targetClientEls.map(e => e.y)) - 100,
        maxY: Math.max(...targetClientEls.map(e => e.y + e.height)) + 70
      };
    }

    boundariesSvg = `
    <!-- External Client Network -->
    <g id="boundary-client-network">
      <rect x="${clientBox.minX}" y="${clientBox.minY}" 
            width="${clientBox.maxX - clientBox.minX}" height="${clientBox.maxY - clientBox.minY}" 
            rx="18" ry="18" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="2" stroke-dasharray="8 6" />
      <rect x="${clientBox.minX}" y="${clientBox.minY}" 
            width="${clientBox.maxX - clientBox.minX}" height="42" 
            rx="18" ry="18" fill="#F1F5F9" />
      <path d="M ${clientBox.minX} ${clientBox.minY + 24} L ${clientBox.minX} ${clientBox.minY + 42} L ${clientBox.maxX} ${clientBox.minY + 42} L ${clientBox.maxX} ${clientBox.minY + 24} Z" fill="#F1F5F9" />
      <text x="${clientBox.minX + 20}" y="${clientBox.minY + 26}" fill="#475569" font-size="12.5" font-weight="800" font-family="'Google Sans Flex', sans-serif" letter-spacing="1">EXTERNAL CLIENT NETWORK (HYBRID INGRESS)</text>
    </g>

    <!-- Regional Enterprise VPC Network -->
    <g id="boundary-enterprise-vpc">
      <rect x="${vpcBox.minX}" y="${vpcBox.minY}" 
            width="${vpcBox.maxX - vpcBox.minX}" height="${vpcBox.maxY - vpcBox.minY}" 
            rx="18" ry="18" fill="#FFFFFF" stroke="#3B82F6" stroke-width="1.8" stroke-dasharray="6 4" />
      <rect x="${vpcBox.minX}" y="${vpcBox.minY}" 
            width="${vpcBox.maxX - vpcBox.minX}" height="44" 
            rx="18" ry="18" fill="#EFF6FF" />
      <g transform="translate(${vpcBox.minX + 16}, ${vpcBox.minY + 10})">
        ${renderVpcNetworkIconSvg(24)}
      </g>
      <text x="${vpcBox.minX + 48}" y="${vpcBox.minY + 27}" fill="#1E40AF" font-size="13" font-weight="800" font-family="'Google Sans Flex', sans-serif">Regional Enterprise VPC (vpc-prod-private)</text>
    </g>

    <!-- Google Services Network (Producer VPC) -->
    <g id="boundary-producer-vpc">
      <rect x="${producerBox.minX}" y="${producerBox.minY}" 
            width="${producerBox.maxX - producerBox.minX}" height="${producerBox.maxY - producerBox.minY}" 
            rx="18" ry="18" fill="#FAF5FF" stroke="#7C3AED" stroke-width="2" stroke-dasharray="8 6" />
      <rect x="${producerBox.minX}" y="${producerBox.minY}" 
            width="${producerBox.maxX - producerBox.minX}" height="44" 
            rx="18" ry="18" fill="#F3E8FF" />
      <g transform="translate(${producerBox.minX + 16}, ${producerBox.minY + 10})">
        ${renderVpcScLockIconSvg(24)}
      </g>
      <text x="${producerBox.minX + 48}" y="${producerBox.minY + 27}" fill="#5B21B6" font-size="13" font-weight="800" font-family="'Google Sans Flex', sans-serif">Google Services Network (Producer VPC)</text>
    </g>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Light Dot Grid Pattern -->
    <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="rgba(0, 0, 0, 0.04)" />
    </pattern>

    <!-- Standard Elevation Shadow -->
    <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="rgba(15, 23, 42, 0.08)" />
      <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="rgba(15, 23, 42, 0.04)" />
    </filter>

    <filter id="badge-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="rgba(15, 23, 42, 0.12)" />
    </filter>

    <!-- Flow Type Directional Arrowheads -->
    <!-- User Flow Arrow (Blue #0284C7) -->
    <marker id="arrow-user_flow" viewBox="0 0 14 14" refX="10" refY="7" markerWidth="9" markerHeight="9" orient="auto">
      <path d="M 1 2 L 12 7 L 1 12 L 4 7 Z" fill="#0284C7" stroke="#0284C7" stroke-width="0.8" stroke-linejoin="round" />
    </marker>

    <!-- Process Flow Arrow (Indigo #6366F1) -->
    <marker id="arrow-process_flow" viewBox="0 0 14 14" refX="10" refY="7" markerWidth="9" markerHeight="9" orient="auto">
      <path d="M 1 2 L 12 7 L 1 12 L 4 7 Z" fill="#6366F1" stroke="#6366F1" stroke-width="0.8" stroke-linejoin="round" />
    </marker>

    <!-- Data Flow Arrow (Teal #0D9488) -->
    <marker id="arrow-data_flow" viewBox="0 0 14 14" refX="10" refY="7" markerWidth="9" markerHeight="9" orient="auto">
      <path d="M 1 2 L 12 7 L 1 12 L 4 7 Z" fill="#0D9488" stroke="#0D9488" stroke-width="0.8" stroke-linejoin="round" />
    </marker>

    <!-- Security Flow Arrow (Red #DC2626) -->
    <marker id="arrow-security_flow" viewBox="0 0 14 14" refX="10" refY="7" markerWidth="9" markerHeight="9" orient="auto">
      <path d="M 1 2 L 12 7 L 1 12 L 4 7 Z" fill="#DC2626" stroke="#DC2626" stroke-width="0.8" stroke-linejoin="round" />
    </marker>
  </defs>

  <!-- Canvas Background (Crisp Google Architectural Light Theme) -->
  <rect width="${width}" height="${height}" fill="#F8FAFC" />
  <rect width="${width}" height="${height}" fill="url(#dot-grid)" />

  <!-- ========================================================================= -->
  <!-- 1. OFFICIAL GOOGLE CLOUD PLATFORM MASTER HEADER BANNER                     -->
  <!-- ========================================================================= -->
  <g transform="translate(80, 40)">
    <!-- Main Header Card -->
    <rect width="${width - 160}" height="124" rx="16" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#card-shadow)" />
    
    <!-- Google Cloud 4-Color Logo & Brand Block -->
    <g transform="translate(26, 26)">
      ${renderGoogleCloudLogoSvg(56)}
    </g>

    <g transform="translate(104, 28)">
      <text x="0" y="18" fill="#1A73E8" font-size="13.5" font-weight="800" font-family="'Google Sans Flex', -apple-system, sans-serif" letter-spacing="1.5">GOOGLE CLOUD PLATFORM</text>
      <text x="214" y="18" fill="#94A3B8" font-size="13" font-family="'Roboto Mono', monospace">|</text>
      <text x="230" y="18" fill="#475569" font-size="12" font-weight="600" font-family="'Google Sans Flex', sans-serif">ENTERPRISE REFERENCE ARCHITECTURE</text>
      
      <text x="0" y="52" fill="#0F172A" font-size="26" font-weight="800" font-family="'Google Sans Flex', -apple-system, sans-serif">Deploying Private Gemini 2.0 Endpoints on Google Cloud</text>
      <text x="0" y="74" fill="#64748B" font-size="13" font-weight="500" font-family="'Roboto Mono', monospace">Zero-Egress Private Service Connect • Cloud Armor WAF • Vertex AI ScaNN • BigQuery Lakehouse</text>
    </g>

    <!-- Architecture Governance & Security Badges (Right Aligned) -->
    <g transform="translate(${width - 160 - 460}, 24)">
      <!-- Badge 1: Region -->
      <rect x="0" y="0" width="220" height="32" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1" />
      <text x="12" y="20" fill="#334155" font-size="11" font-weight="700" font-family="'Roboto Mono', monospace">REGION: <tspan fill="#0284C7">us-central1 (Iowa)</tspan></text>

      <!-- Badge 2: Project -->
      <rect x="230" y="0" width="210" height="32" rx="6" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1" />
      <text x="242" y="20" fill="#334155" font-size="11" font-weight="700" font-family="'Roboto Mono', monospace">PROJECT: <tspan fill="#10B981">vidoxis-8f2a</tspan></text>

      <!-- Badge 3: Security Perimeter (VPC-SC) -->
      <rect x="0" y="42" width="220" height="32" rx="6" fill="#FEF2F2" stroke="#FECACA" stroke-width="1" />
      <circle cx="16" cy="58" r="4" fill="#DC2626" />
      <text x="26" y="62" fill="#991B1B" font-size="11" font-weight="800" font-family="'Roboto Mono', monospace">VPC-SC: ZERO-EGRESS</text>

      <!-- Badge 4: Conformance Standard -->
      <rect x="230" y="42" width="210" height="32" rx="6" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1" />
      <text x="242" y="62" fill="#1D4ED8" font-size="10.5" font-weight="700" font-family="'Google Sans Flex', sans-serif">★ Google Arch Center 2026</text>
    </g>
  </g>

  <!-- ========================================================================= -->
  <!-- 2. ARCHITECTURAL BOUNDARY ENCLOSURES                                       -->
  <!-- ========================================================================= -->
  <g id="boundaries-layer">
    ${boundariesSvg}
  </g>

  <!-- ========================================================================= -->
  <!-- 3. CONNECTORS / DATA FLOW EDGES                                           -->
  <!-- ========================================================================= -->
  <g id="edges-layer">
    ${edgePathsSvg}
  </g>

  <!-- ========================================================================= -->
  <!-- 4. GOOGLE CLOUD ARCHITECTURE NODES (CARDS)                                 -->
  <!-- ========================================================================= -->
  <g id="nodes-layer">
    ${nodeElementsSvg}
  </g>

  <!-- ========================================================================= -->
  <!-- 5. FLOATING CONNECTOR PILL BADGES (Rendered above cards for 0% clipping)   -->
  <!-- ========================================================================= -->
  <g id="badges-layer">
    ${edgeBadgesSvg}
  </g>

  <!-- ========================================================================= -->
  <!-- 5. GOOGLE CLOUD ARCHITECTURE CENTER LEGEND & FOOTER BANNER                 -->
  <!-- ========================================================================= -->
  <g transform="translate(80, ${height - 125})">
    <rect width="${width - 160}" height="85" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5" filter="url(#card-shadow)" />
    
    <!-- Left Section: 6 Architectural Zones -->
    <g transform="translate(24, 28)">
      <!-- Legend Item 1: Ingress Edge -->
      <rect x="0" y="6" width="24" height="14" rx="3" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x="32" y="18" fill="#334155" font-size="12" font-weight="700" font-family="'Google Sans Flex', sans-serif">Zone 1: Ingress Edge</text>

      <!-- Legend Item 2: Regional VPC -->
      <rect x="180" y="6" width="24" height="14" rx="3" fill="#EFF6FF" stroke="#3B82F6" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x="212" y="18" fill="#334155" font-size="12" font-weight="700" font-family="'Google Sans Flex', sans-serif">Zone 2: App Mesh</text>

      <!-- Legend Item 3: Event Streaming -->
      <rect x="360" y="6" width="24" height="14" rx="3" fill="#FFF7ED" stroke="#F97316" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x="392" y="18" fill="#334155" font-size="12" font-weight="700" font-family="'Google Sans Flex', sans-serif">Zone 3: Streaming Bus</text>

      <!-- Legend Item 4: Producer VPC / Vertex AI -->
      <rect x="560" y="6" width="24" height="14" rx="3" fill="#FAF5FF" stroke="#7C3AED" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x="592" y="18" fill="#334155" font-size="12" font-weight="700" font-family="'Google Sans Flex', sans-serif">Zone 4: Vertex AI (PSC)</text>

      <!-- Legend Item 5: Lakehouse & DB -->
      <rect x="760" y="6" width="24" height="14" rx="3" fill="#F0FDFA" stroke="#0D9488" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x="792" y="18" fill="#334155" font-size="12" font-weight="700" font-family="'Google Sans Flex', sans-serif">Zone 5: Lakehouse &amp; DB</text>

      <!-- Legend Item 6: Zero-Trust Security Baseline -->
      <rect x="970" y="6" width="24" height="14" rx="3" fill="#F8FAFC" stroke="#334155" stroke-width="1.5" />
      <text x="1002" y="18" fill="#334155" font-size="12" font-weight="700" font-family="'Google Sans Flex', sans-serif">Zone 6: Zero-Trust Baseline</text>
    </g>

    <!-- Vertical Separator -->
    <line x1="1230" y1="18" x2="1230" y2="68" stroke="#E2E8F0" stroke-width="1.5" />

    <!-- Middle Section: 4 Architectural Flow Types (Directional User Flows, Process Flows, Data Flows, Security Flows) -->
    <g transform="translate(1250, 24)">
      <text x="0" y="14" fill="#0F172A" font-size="10.5" font-weight="900" font-family="'Roboto Mono', monospace" letter-spacing="1">ARCHITECTURAL FLOWS:</text>
      
      <!-- Flow 1: User Flow -->
      <g transform="translate(170, 0)">
        <line x1="0" y1="10" x2="28" y2="10" stroke="#0284C7" stroke-width="3" />
        <polygon points="28,6 36,10 28,14" fill="#0284C7" />
        <text x="44" y="14" fill="#0284C7" font-size="11" font-weight="800" font-family="'Google Sans Flex', sans-serif">User Flow <tspan fill="#64748B" font-size="9.5" font-weight="500">(Ingress / TLS 1.3)</tspan></text>
      </g>

      <!-- Flow 2: Process Flow -->
      <g transform="translate(430, 0)">
        <line x1="0" y1="10" x2="28" y2="10" stroke="#6366F1" stroke-width="3" stroke-dasharray="6 3" />
        <polygon points="28,6 36,10 28,14" fill="#6366F1" />
        <text x="44" y="14" fill="#4F46E5" font-size="11" font-weight="800" font-family="'Google Sans Flex', sans-serif">Process Flow <tspan fill="#64748B" font-size="9.5" font-weight="500">(Mesh / gRPC)</tspan></text>
      </g>

      <!-- Flow 3: Data Flow -->
      <g transform="translate(680, 0)">
        <line x1="0" y1="10" x2="28" y2="10" stroke="#0D9488" stroke-width="4" />
        <polygon points="28,6 36,10 28,14" fill="#0D9488" />
        <text x="44" y="14" fill="#0F766E" font-size="11" font-weight="800" font-family="'Google Sans Flex', sans-serif">Data Flow <tspan fill="#64748B" font-size="9.5" font-weight="500">(Streaming / Lakehouse)</tspan></text>
      </g>

      <!-- Flow 4: Security Flow -->
      <g transform="translate(980, 0)">
        <line x1="0" y1="10" x2="28" y2="10" stroke="#DC2626" stroke-width="2.5" stroke-dasharray="4 3" />
        <polygon points="28,6 36,10 28,14" fill="#DC2626" />
        <text x="44" y="14" fill="#991B1B" font-size="11" font-weight="800" font-family="'Google Sans Flex', sans-serif">Security Flow <tspan fill="#64748B" font-size="9.5" font-weight="500">(KMS CMEK)</tspan></text>
      </g>

      <!-- Sub-label description -->
      <text x="0" y="38" fill="#64748B" font-size="10" font-family="'Roboto Mono', monospace">Every connector path indicates causal direction, execution layer, and protocol telemetry</text>
    </g>

    <!-- Google Evangelist & Architecture Center Stamp -->
    <g transform="translate(${width - 160 - 440}, 26)">
      <text x="410" y="18" fill="#64748B" font-size="11.5" font-weight="600" font-family="'Roboto Mono', monospace" text-anchor="end">Google Cloud Architecture Center Standard Reference 2026</text>
      <text x="410" y="38" fill="#94A3B8" font-size="10.5" font-family="'Google Sans Flex', sans-serif" text-anchor="end">Broadcast-Grade Enterprise Topologies • Multi-Tier Zero-Trust Micro-Architecture</text>
    </g>
  </g>
</svg>`;
}
