import { WhiteboardManifest, WhiteboardElement, WhiteboardEdge } from "../types/whiteboard.js";

export function exportWhiteboardToSvg(manifest: WhiteboardManifest): string {
  const { width, height } = manifest.canvas;

  const nodeElementsSvg = manifest.elements.map(el => {
    const flowBadgeColor = el.flow === "user_flow" ? "#38BDF8" : (el.flow === "process_flow" ? "#818CF8" : "#34D399");
    const flowBadgeText = el.flow.replace("_", " ").toUpperCase();

    return `
      <!-- Node: ${el.id} -->
      <g id="node-${el.id}" transform="translate(${el.x}, ${el.y})" class="whiteboard-node">
        <!-- Glassmorphism Card Backing -->
        <rect x="0" y="0" width="${el.width}" height="${el.height}" rx="16" ry="16"
              fill="rgba(15, 23, 42, 0.75)" stroke="${el.color}" stroke-width="2.5"
              filter="url(#neon-glow-${el.id})" />
        
        <!-- Flow Type Pill -->
        <rect x="18" y="16" width="96" height="22" rx="11" fill="rgba(255,255,255,0.08)" />
        <text x="66" y="31" fill="${flowBadgeColor}" font-size="10" font-weight="700" font-family="'Google Sans Flex', -apple-system, sans-serif" text-anchor="middle" letter-spacing="0.5">${flowBadgeText}</text>
        
        <!-- Primary Label -->
        <text x="18" y="74" fill="#F8FAFC" font-size="20" font-weight="600" font-family="'Google Sans Flex', -apple-system, sans-serif">${escapeXml(el.label)}</text>
        
        <!-- Secondary Description / Type -->
        <text x="18" y="104" fill="#94A3B8" font-size="13" font-family="'Roboto Mono', monospace">${escapeXml(el.subLabel || el.type)}</text>

        <!-- Status Light -->
        <circle cx="${el.width - 24}" cy="24" r="5" fill="${el.color}" filter="drop-shadow(0 0 4px ${el.color})" />
      </g>
    `;
  }).join("\n");

  const edgeElementsSvg = manifest.edges.map(edge => {
    const sourceEl = manifest.elements.find(e => e.id === edge.sourceId);
    const targetEl = manifest.elements.find(e => e.id === edge.targetId);
    if (!sourceEl || !targetEl) return "";

    const x1 = sourceEl.x + sourceEl.width;
    const y1 = sourceEl.y + sourceEl.height / 2;
    const x2 = targetEl.x;
    const y2 = targetEl.y + targetEl.height / 2;

    const dx = x2 - x1;
    const cx1 = x1 + dx * 0.5;
    const cy1 = y1;
    const cx2 = x1 + dx * 0.5;
    const cy2 = y2;

    const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

    return `
      <!-- Edge: ${edge.id} (${edge.sourceId} -> ${edge.targetId}) -->
      <g id="edge-${edge.id}" class="whiteboard-edge">
        <!-- Base Path Track -->
        <path d="${pathD}" fill="none" stroke="rgba(255, 255, 255, 0.15)" stroke-width="2" stroke-dasharray="6 6" />
        <!-- Glowing Data Stream Path -->
        <path d="${pathD}" fill="none" stroke="${edge.color}" stroke-width="3" stroke-linecap="round" filter="url(#line-glow)" />
        <!-- Edge Label Pill -->
        <rect x="${(x1 + x2) / 2 - 40}" y="${(y1 + y2) / 2 - 12}" width="80" height="24" rx="12" fill="#0F172A" stroke="${edge.color}" stroke-width="1.5" />
        <text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 + 4}" fill="#F8FAFC" font-size="11" font-weight="600" font-family="'Roboto Mono', monospace" text-anchor="middle">${edge.protocol}</text>
      </g>
    `;
  }).join("\n");

  const filterDefs = manifest.elements.map(el => `
    <filter id="neon-glow-${el.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feFlood flood-color="${el.color}" flood-opacity="0.3" result="glow" />
      <feComposite in="glow" in2="blur" operator="in" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  `).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <!-- Background Grid Pattern -->
    <pattern id="dot-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="rgba(255, 255, 255, 0.08)" />
    </pattern>

    <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    ${filterDefs}
  </defs>

  <!-- Canvas Background (Obsidian Glass) -->
  <rect width="${width}" height="${height}" fill="#080C14" />
  <rect width="${width}" height="${height}" fill="url(#dot-grid)" />

  <!-- Act 2 Whiteboard Header Slate -->
  <g transform="translate(120, 90)">
    <text x="0" y="0" fill="#38BDF8" font-size="14" font-weight="700" font-family="'Google Sans Flex', -apple-system, sans-serif" letter-spacing="2">TRAINEX ARCHITECTURE MASTER</text>
    <text x="0" y="42" fill="#F8FAFC" font-size="36" font-weight="600" font-family="'Google Sans Flex', -apple-system, sans-serif">${escapeXml(manifest.topicId.replace(/_/g, " ").toUpperCase())}</text>
    <text x="0" y="74" fill="#94A3B8" font-size="16" font-family="'Roboto Mono', monospace">User Flow • Process Flow • Data Flow Topology</text>
  </g>

  <!-- Edges & Streams Layer -->
  <g id="whiteboard-edges-layer">
    ${edgeElementsSvg}
  </g>

  <!-- Nodes Layer -->
  <g id="whiteboard-nodes-layer">
    ${nodeElementsSvg}
  </g>

  <!-- Watermark & Compliance Slate -->
  <g transform="translate(120, ${height - 60})">
    <text fill="rgba(148, 163, 184, 0.6)" font-size="14" font-family="'Google Sans Flex', sans-serif">Trainex Studio • Broadcast 4K UHD 60fps • Single-Source Canonical Topology</text>
  </g>
</svg>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
