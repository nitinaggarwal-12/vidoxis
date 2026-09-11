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

export function computeEdgePathEndpoints(
  sourceEl: WhiteboardElement,
  targetEl: WhiteboardElement
): { p1: { x: number; y: number }; cp1: { x: number; y: number }; cp2: { x: number; y: number }; p2: { x: number; y: number } } {
  const sourceCenter = { x: sourceEl.x + sourceEl.width / 2, y: sourceEl.y + sourceEl.height / 2 };
  const targetCenter = { x: targetEl.x + targetEl.width / 2, y: targetEl.y + targetEl.height / 2 };
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  // Case 1: Stacked vertically in the same zone/column (e.g. Zone 1 client -> cdn -> armor -> alb)
  if (Math.abs(dx) < 180 && dy > 0) {
    const p1 = { x: sourceCenter.x, y: sourceEl.y + sourceEl.height };
    const p2 = { x: targetCenter.x, y: targetEl.y };
    const distY = (p2.y - p1.y) * 0.5;
    return {
      p1,
      cp1: { x: p1.x, y: p1.y + distY },
      cp2: { x: p2.x, y: p2.y - distY },
      p2
    };
  }

  // Case 2: Ingress to Compute upward routing (e.g. external_alb up to gke_autopilot or api_gateway)
  // Routes up the inter-zone corridor (x=640..670) and inflects into Zone 2's open channel (y=780..820),
  // completely avoiding Zone 3's title bar and cards
  if ((sourceEl.zone === "ingress_edge" || sourceEl.x < 650) && (targetEl.zone === "app_mesh" || targetEl.y < sourceEl.y - 80)) {
    const p1 = { x: sourceEl.x + sourceEl.width, y: sourceEl.y + 35 };
    const p2 = { x: targetEl.x, y: targetEl.y + targetEl.height / 2 };
    const corridorX = 645;
    const channelY = Math.min(800, targetEl.y + targetEl.height + 40);
    return {
      p1,
      cp1: { x: corridorX, y: channelY + 60 },
      cp2: { x: corridorX + (targetEl.x - corridorX) * 0.35, y: channelY },
      p2
    };
  }

  // Case 3: Downward cross-tier flow (e.g. api_gateway down to pubsub, or gke_autopilot down to spanner)
  // Places the horizontal inflection in Zone 2's lower channel (y=820) so the badge does not straddle the zone border
  if (dy > sourceEl.height * 0.8) {
    const p1 = { x: sourceEl.x + sourceEl.width * (dx < 0 ? 0.35 : 0.65), y: sourceEl.y + sourceEl.height };
    const p2 = { x: targetEl.x + targetEl.width * (dx < 0 ? 0.65 : 0.35), y: targetEl.y };
    const channelY = 820; // Safe horizontal channel inside Zone 2
    return {
      p1,
      cp1: { x: p1.x, y: channelY },
      cp2: { x: p2.x, y: channelY + 120 },
      p2
    };
  }

  // Case 4: Adjacent horizontal flow in same tier (e.g. api_gateway -> memorystore, model_armor -> vertex_endpoint)
  const p1 = { x: sourceEl.x + sourceEl.width, y: sourceCenter.y };
  const p2 = { x: targetEl.x, y: targetCenter.y };
  const distX = Math.max(30, Math.abs(p2.x - p1.x) * 0.5);
  return {
    p1,
    cp1: { x: p1.x + distX, y: p1.y },
    cp2: { x: p2.x - distX, y: p2.y },
    p2
  };
}

export async function compileWhiteboardManifest(
  contract: CanonicalTopologyContract,
  options: WhiteboardCompilerOptions = {}
): Promise<WhiteboardManifest> {
  const width = options.canvasWidth ?? 3840;
  const height = options.canvasHeight ?? 2160;
  const fps = options.fps ?? 60;
  const theme = options.theme ?? "digital_glassboard";

  // Colors based on Google Enterprise Light Palette
  const colorMap: Record<string, string> = {
    client: "#0284C7",      // Google Sky Blue 600
    ingress: "#D97706",     // Google Amber 600
    compute: "#4F46E5",     // Indigo 600
    ai: "#7C3AED",          // Deep Purple 600
    storage: "#059669",     // Emerald Green 600
    security: "#DC2626"     // Crimson Red 600
  };

  const hasExplicitZones = contract.architectureGraph.nodes.some(n => Boolean(n.zone));

  let elements: WhiteboardElement[] = [];
  let currentDrawFrame = 20; // Fast cadence for progressive multi-tier whiteboard
  const nodeDurationFrames = 25;

  if (hasExplicitZones) {
    // 6-Zone Symmetrical Enterprise Layout Matrix (3840x2160 UHD)
    // Matches Google Cloud Architecture Center & PromptCanvas Blueprints
    const zoneCounts: Record<string, number> = {};

    elements = contract.architectureGraph.nodes.map(rawNode => {
      const zone = rawNode.zone || (
        rawNode.category === "client" || rawNode.category === "ingress" ? "ingress_edge" :
        rawNode.category === "compute" ? "app_mesh" :
        rawNode.category === "ai" ? "vertex_ai" :
        rawNode.category === "storage" ? "lakehouse_db" : "zero_trust_baseline"
      );

      const count = zoneCounts[zone] || 0;
      zoneCounts[zone] = count + 1;

      let x = 110;
      let y = 260;
      let nodeW = 460;
      let nodeH = 210;

      if (zone === "ingress_edge") {
        // Zone 1: Ingress & Edge (Left Column X=80..640, Y=180..1750)
        // 4 nodes evenly distributed to fill height without bottom void
        nodeW = 480;
        nodeH = 280;
        x = 120;
        y = 260 + count * 370; // 260, 630, 1000, 1370 (ends at 1650, 100px before zone bottom 1750)
      } else if (zone === "app_mesh") {
        // Zone 2: App Mesh (Middle Top X=670..2200, Y=180..945)
        // Proportional 340px cards with 70px inter-card gaps
        nodeW = 430;
        nodeH = 340;
        const col = count % 3;
        const row = Math.floor(count / 3);
        x = 720 + col * 500; // col 0: 720, col 1: 1220, col 2: 1720 (ends at 2150, inside 2200)
        y = 350 + row * 380; // row 0: 350 (ends at 690, leaving 255px channel below)
      } else if (zone === "event_streaming") {
        // Zone 3: Event Streaming (Middle Bottom X=670..2200, Y=975..1750)
        // Symmetrical wide cards with clean channels for streaming flow
        const totalInZone = contract.architectureGraph.nodes.filter(n => (n.zone || "") === "event_streaming").length;
        if (totalInZone === 2) {
          nodeW = 520;
          nodeH = 340;
          x = count === 0 ? 770 : 1450; // 770..1290, 1450..1970 (ends at 1970, inside 2200)
          y = 1180;
        } else {
          nodeW = 430;
          nodeH = 340;
          const col = count % 3;
          const row = Math.floor(count / 3);
          x = 720 + col * 500;
          y = 1180 + row * 380;
        }
      } else if (zone === "vertex_ai") {
        // Zone 4: Vertex AI & Intelligence Hub (Right Top X=2230..3760, Y=180..945)
        // 3 cards aligned with Zone 2 row and Zone 5 columns, zero overflow
        nodeW = 430;
        nodeH = 340;
        const col = count % 3;
        const row = Math.floor(count / 3);
        x = 2270 + col * 500; // 2270, 2770, 3270 (ends at 3700, inside 3760 and 3840 canvas)
        y = 350 + row * 380;
      } else if (zone === "lakehouse_db") {
        // Zone 5: Lakehouse & Persistence (Right Bottom X=2230..3760, Y=975..1750)
        // 3 cards vertically aligned with Zone 4 above and horizontally with Zone 3
        nodeW = 430;
        nodeH = 340;
        const col = count % 3;
        const row = Math.floor(count / 3);
        x = 2270 + col * 500; // 2270 (spanner), 2770 (bigquery), 3270 (cloud_storage)
        y = 1180 + row * 380;
      } else if (zone === "zero_trust_baseline") {
        // Zone 6: Zero-Trust Security & SRE Baseline (Bottom Spanning Rail X=80..3760, Y=1775..2005)
        nodeW = 1180;
        nodeH = 150;
        x = 115 + count * (nodeW + 35); // 115..1295, 1330..2510, 2545..3725 (ends at 3725, inside 3760)
        y = 1835;
      }

      const flow = rawNode.category === "client" ? "user_flow" : (rawNode.category === "storage" || rawNode.category === "ai" ? "data_flow" : "process_flow");

      const element: WhiteboardElement = {
        id: rawNode.id,
        label: rawNode.label,
        subLabel: rawNode.description,
        type: rawNode.category === "client" ? "client_app" : (rawNode.category === "ai" ? "ai_endpoint" : "microservice"),
        flow,
        x,
        y,
        width: nodeW,
        height: nodeH,
        drawStartFrame: currentDrawFrame,
        drawDurationFrames: nodeDurationFrames,
        color: colorMap[rawNode.category] || "#38BDF8",
        accentGlow: `rgba(${rawNode.category === "client" ? "56,189,248" : "129,140,248"},0.3)`,
        cloudIcon: rawNode.cloudIcon,
        zone: rawNode.zone,
        techSpec: rawNode.techSpec,
        badge: rawNode.badge,
        details: rawNode.details
      };

      currentDrawFrame += 12; // Smooth progressive ripple cadence
      return element;
    });
  } else {
    // Unzoned fallback: ElkJS DAG compilation
    const elkNodes: ElkNode[] = contract.architectureGraph.nodes.map(node => ({
      id: node.id,
      width: 520,
      height: 240,
      layoutOptions: {
        "elk.padding": "[top=30,left=30,bottom=30,right=30]",
        "elk.spacing.nodeNode": "100",
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
        "elk.spacing.nodeNode": "120",
        "elk.layered.spacing.nodeNodeBetweenLayers": "200",
        "elk.padding": "[top=100,left=80,bottom=100,right=80]",
        "elk.separateConnectedComponents": "true",
        "elk.spacing.componentComponent": "100"
      },
      children: elkNodes,
      edges: elkEdges
    };

    const layoutedGraph = await elk.layout(graph);
    const graphWidth = layoutedGraph.width || 2000;
    const graphHeight = layoutedGraph.height || 1200;
    const offsetX = Math.max(120, (width - graphWidth) / 2);
    const offsetY = Math.max(120, (height - graphHeight) / 2);

    elements = (layoutedGraph.children || []).map((child: ElkNode) => {
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
        width: child.width || 520,
        height: child.height || 240,
        drawStartFrame: currentDrawFrame,
        drawDurationFrames: nodeDurationFrames,
        color: colorMap[category] || "#38BDF8",
        accentGlow: `rgba(${category === "client" ? "56,189,248" : "129,140,248"},0.3)`,
        cloudIcon: rawNode.cloudIcon,
        zone: rawNode.zone,
        techSpec: rawNode.techSpec,
        badge: rawNode.badge,
        details: rawNode.details
      };

      currentDrawFrame += nodeDurationFrames + 15;
      return element;
    });
  }

  // 2D Bounding Box Visual Collision Auto-Healing (Mandatory Constitution Rule)
  // Evaluates pairs with 30px collision safety padding and pushes overlapping nodes downward or rightward
  const COLLISION_PADDING = 30;
  for (let pass = 0; pass < 10; pass++) {
    let resolvedCollision = false;
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const a = elements[i];
        const b = elements[j];

        const overlap = !(
          a.x + a.width + COLLISION_PADDING <= b.x ||
          b.x + b.width + COLLISION_PADDING <= a.x ||
          a.y + a.height + COLLISION_PADDING <= b.y ||
          b.y + b.height + COLLISION_PADDING <= a.y
        );

        if (overlap) {
          resolvedCollision = true;
          if (Math.abs(a.x - b.x) < a.width / 2) {
            b.y = a.y + a.height + COLLISION_PADDING + 40;
          } else {
            b.x = a.x + a.width + COLLISION_PADDING + 40;
          }
        }
      }
    }
    if (!resolvedCollision) break;
  }

  // Calculate edges and kinetic data flows
  const edgeDurationFrames = 30;
  const edges: WhiteboardEdge[] = contract.architectureGraph.edges.map((edge, idx) => {
    const sourceEl = elements.find(e => e.id === edge.source);
    const targetEl = elements.find(e => e.id === edge.target);

    const startFrame = (sourceEl ? sourceEl.drawStartFrame + sourceEl.drawDurationFrames : currentDrawFrame);
    
    let pathEndpoints = {
      p1: { x: (sourceEl ? sourceEl.x + sourceEl.width : 0), y: (sourceEl ? sourceEl.y + sourceEl.height / 2 : 0) },
      cp1: { x: 0, y: 0 },
      cp2: { x: 0, y: 0 },
      p2: { x: (targetEl ? targetEl.x : 0), y: (targetEl ? targetEl.y + targetEl.height / 2 : 0) }
    };

    if (sourceEl && targetEl) {
      pathEndpoints = computeEdgePathEndpoints(sourceEl, targetEl);
    }

    // Explicit Flow Classification: User Flow vs Process Flow vs Data Flow vs Security Flow
    let flowType: "user_flow" | "process_flow" | "data_flow" | "security_flow" = "data_flow";
    if (edge.flowType === "user_flow") {
      flowType = "user_flow";
    } else if (edge.flowType === "process_flow") {
      flowType = "process_flow";
    } else if (edge.flowType === "security_flow") {
      flowType = "security_flow";
    } else if (edge.flowType === "control_plane") {
      flowType = "process_flow";
    } else if (edge.source === "actor_client" || edge.source.includes("client")) {
      flowType = "user_flow";
    } else if (edge.source.includes("kms") || edge.source.includes("iam") || edge.source.includes("vpc_sc") || edge.target.includes("vpc_sc")) {
      flowType = "security_flow";
    } else if (
      edge.source === "pubsub" || edge.target === "pubsub" ||
      edge.source === "dataflow" || edge.target === "dataflow" ||
      edge.target === "bigquery" || edge.target === "spanner" ||
      edge.target === "cloud_storage" || edge.source === "spanner"
    ) {
      flowType = "data_flow";
    } else {
      flowType = "process_flow";
    }

    // Google Cloud Architecture Center Palette by Flow Type:
    // user_flow: Sky-600 (#0284C7)
    // process_flow: Indigo-500 (#6366F1)
    // data_flow: Teal-600 (#0D9488)
    // security_flow: Red-600 (#DC2626)
    const color =
      flowType === "user_flow" ? "#0284C7" :
      flowType === "process_flow" ? "#6366F1" :
      flowType === "data_flow" ? "#0D9488" :
      "#DC2626";

    return {
      id: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      flow: flowType,
      protocol: edge.protocol,
      ratePps: edge.ratePps,
      color,
      drawStartFrame: startFrame,
      drawDurationFrames: edgeDurationFrames,
      points: [
        pathEndpoints.p1,
        pathEndpoints.cp1,
        pathEndpoints.cp2,
        pathEndpoints.p2
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
