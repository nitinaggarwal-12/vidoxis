import ELK, { ElkNode, ElkExtendedEdge } from "elkjs";
import { CanonicalTopologyContract } from "../types/contract.js";
import { WhiteboardManifest, WhiteboardElement, WhiteboardEdge } from "../types/whiteboard.js";

const elk = new (ELK as any)();

export interface WhiteboardCompilerOptions {
  canvasWidth?: number;  // 3840 (4K UHD)
  canvasHeight?: number; // 2160 (4K UHD)
  fps?: number;          // 60fps
  theme?: "digital_glassboard" | "studio_blueprint";
}

export async function compileWhiteboardManifest(
  contract: CanonicalTopologyContract,
  options: WhiteboardCompilerOptions = {}
): Promise<WhiteboardManifest> {
  const width = options.canvasWidth ?? 3840;
  const height = options.canvasHeight ?? 2160;
  const fps = options.fps ?? 60;
  const theme = options.theme ?? "digital_glassboard";

  // Build ElkJS Graph Definition with 30px collision safety padding
  const elkNodes: ElkNode[] = contract.architectureGraph.nodes.map(node => ({
    id: node.id,
    width: 380,
    height: 180,
    layoutOptions: {
      "elk.padding": "[top=30,left=30,bottom=30,right=30]",
      "elk.spacing.nodeNode": "80",
      "elk.direction": "RIGHT"
    }
  }));

  const elkEdges: ElkExtendedEdge[] = contract.architectureGraph.edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target]
  }));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "100",
      "elk.layered.spacing.nodeNodeBetweenLayers": "140",
      "elk.padding": "[top=120,left=120,bottom=120,right=120]"
    },
    children: elkNodes,
    edges: elkEdges
  };

  const layoutedGraph = await elk.layout(graph);

  // Center the diagram in the 3840x2160 canvas
  const graphWidth = layoutedGraph.width || 2000;
  const graphHeight = layoutedGraph.height || 1200;
  const offsetX = Math.max(120, (width - graphWidth) / 2);
  const offsetY = Math.max(120, (height - graphHeight) / 2);

  // Colors based on theme
  const colorMap: Record<string, string> = {
    client: "#38BDF8",      // Vibrant Sky Cyan
    ingress: "#FBBF24",     // Amber Gold
    compute: "#818CF8",     // Royal Indigo
    ai: "#A78BFA",          // Purple
    storage: "#34D399",     // Emerald Green
    security: "#F43F5E"      // Crimson Red
  };

  let currentDrawFrame = 30; // Start after 0.5s cold open hook
  const nodeDurationFrames = 45; // 0.75s per node unwinding

  const elements: WhiteboardElement[] = (layoutedGraph.children || []).map((child, idx) => {
    const rawNode = contract.architectureGraph.nodes.find(n => n.id === child.id)!;
    const category = rawNode.category;
    const flow = category === "client" ? "user_flow" : (category === "storage" || category === "ai" ? "data_flow" : "process_flow");

    const element: WhiteboardElement = {
      id: child.id,
      label: rawNode.label,
      subLabel: rawNode.description,
      type: category === "client" ? "client_app" : (category === "ai" ? "ai_endpoint" : "microservice"),
      flow,
      x: Math.round(offsetX + (child.x || 0)),
      y: Math.round(offsetY + (child.y || 0)),
      width: child.width || 380,
      height: child.height || 180,
      drawStartFrame: currentDrawFrame,
      drawDurationFrames: nodeDurationFrames,
      color: colorMap[category] || "#38BDF8",
      accentGlow: colorMap[category] ? `rgba(${category === "client" ? "56,189,248" : "129,140,248"},0.4)` : undefined,
      cloudIcon: rawNode.cloudIcon
    };

    currentDrawFrame += nodeDurationFrames + 15; // 250ms cadence between nodes
    return element;
  });

  // Calculate edges and kinetic data flows
  const edgeDurationFrames = 30;
  const edges: WhiteboardEdge[] = contract.architectureGraph.edges.map(edge => {
    const sourceEl = elements.find(e => e.id === edge.source);
    const targetEl = elements.find(e => e.id === edge.target);

    const startFrame = (sourceEl ? sourceEl.drawStartFrame + sourceEl.drawDurationFrames : currentDrawFrame);

    return {
      id: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      flow: edge.flowType === "control_plane" ? "process_flow" : "data_flow",
      protocol: edge.protocol,
      ratePps: edge.ratePps,
      color: edge.flowType === "control_plane" ? "#FBBF24" : "#38BDF8",
      drawStartFrame: startFrame,
      drawDurationFrames: edgeDurationFrames,
      points: [
        { x: (sourceEl ? sourceEl.x + sourceEl.width : 0), y: (sourceEl ? sourceEl.y + sourceEl.height / 2 : 0) },
        { x: (targetEl ? targetEl.x : 0), y: (targetEl ? targetEl.y + targetEl.height / 2 : 0) }
      ]
    };
  });

  // Select primary target node for spatial hand-off into console demo
  const targetNode = elements.find(e => e.type === "ai_endpoint" || e.flow === "data_flow") || elements[elements.length - 1];

  const totalFrames = currentDrawFrame + 180; // 3 seconds settle and focus

  return {
    whiteboardId: `wb_${contract.topicId}`,
    topicId: contract.topicId,
    theme,
    canvas: { width, height },
    totalFrames,
    elements,
    edges,
    spatialHandoff: {
      targetElementId: targetNode ? targetNode.id : elements[0].id,
      zoomFactor: 2.0,
      transitionStartFrame: totalFrames - 48,
      transitionDurationFrames: 36
    }
  };
}
