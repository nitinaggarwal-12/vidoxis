import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export interface SlideDefinition {
  tag: string;
  title: string;
  subtitle: string;
  codeSnippetTitle: string;
  codeSnippet: string;
  cards: { badge: string; title: string; detail: string }[];
}

const A2UI_SLIDES: SlideDefinition[] = [
  {
    tag: "ACT 1 · SLIDE 01/04 • THE GENERATIVE UI SECURITY BOUNDARY",
    title: "A2UI Protocol: Safe Like Data, Expressive Like Code",
    subtitle:
      "Why Enterprise Agentic AI Replaces Arbitrary LLM HTML/JS Execution with Declarative JSON Envelopes & Pre-Approved Component Catalogs",
    codeSnippetTitle: "specification/v1_0/json/agent_to_renderer.json (Envelope Structure)",
    codeSnippet: `{
  "protocolVersion": "1.0-rc",
  "envelopeType": "agent_to_renderer",
  "surfaceId": "enterprise-agent-surface-01",
  "catalogId": "https://a2ui.org/catalogs/enterprise-core/v1.0",
  "components": [
    { "id": "card_root", "type": "SurfaceCard", "props": { "elevation": 2 } }
  ]
}`,
    cards: [
      {
        badge: "ZERO TRUST",
        title: "No Executable Code from LLMs",
        detail:
          "Agents emit strictly typed JSON payloads validated against JSON Schema Draft 2020-12 before crossing the client trust boundary."
      },
      {
        badge: "CATALOG GOVERNANCE",
        title: "Client-Side Component Registry",
        detail:
          "The browser renderer holds a curated catalog of native React, Lit, or Angular widgets. Unregistered components are rejected."
      },
      {
        badge: "MULTI-AGENT A2A",
        title: "Seamless Agent-to-Agent UI Handoff",
        detail:
          "Downstream specialist agents contribute UI surfaces directly through the A2A Protocol without tight frontend coupling."
      }
    ]
  },
  {
    tag: "ACT 1 · SLIDE 02/04 • A2A EXTENSION SPECIFICATION",
    title: "Negotiating A2UI Over the Agent-to-Agent (A2A) Protocol",
    subtitle:
      "Standardized Capability Advertisement, HTTP Extension Headers, and DataPart Payload Encapsulation Across Distributed Agents",
    codeSnippetTitle: "HTTP Request & AgentCard Capability Negotiation",
    codeSnippet: `POST /a2a/v1/tasks/send HTTP/1.1
Host: a2a-gateway-638420508320.us-central1.run.app
X-A2A-Extensions: https://a2ui.org/a2a-extension/a2ui/v1.0
Content-Type: application/json

{
  "message": {
    "metadata": {
      "a2uiRendererCapabilities": { "supportedCatalogIds": ["v0_9", "v1_0"] }
    }
  }
}`,
    cards: [
      {
        badge: "EXTENSION URI",
        title: "https://a2ui.org/a2a-extension/a2ui/v1.0",
        detail:
          "Declared in AgentCapabilities.extensions with params.supportedCatalogIds and params.acceptsInlineCatalogs."
      },
      {
        badge: "PAYLOAD MIME",
        title: "application/a2ui+json Encapsulation",
        detail:
          "A2UI surface updates travel inside standard A2A DataPart messages with metadata.mimeType = 'application/a2ui+json'."
      },
      {
        badge: "STRICT SPEC COMPLIANCE",
        title: "Standard Capabilities Over Custom Modes",
        detail:
          "Uses message.metadata['a2uiRendererCapabilities'] negotiation rather than non-standard accepted_output_modes."
      }
    ]
  },
  {
    tag: "ACT 1 · SLIDE 03/04 • WHAT'S NEW IN A2UI v1.0 RELEASE CANDIDATE",
    title: "A2UI v1.0 RC Architecture & Bidirectional RPC Evolution",
    subtitle:
      "Key Specification Enhancements from Production v0.9.1 to v1.0 RC: Explicit Call Permissions, Mixable Catalogs & Layout Purity",
    codeSnippetTitle: "v1.0 RC Bidirectional RPC & User Activation Guard",
    codeSnippet: `{
  "callRendererFunction": {
    "functionName": "confirmHighRiskAction",
    "allowedCallers": "agentOnly",
    "requiresUserActivation": true,
    "arguments": { "transactionId": "TX-98412", "impactLevel": "CRITICAL" }
  }
}`,
    cards: [
      {
        badge: "ENVELOPE CLARITY",
        title: "agent_to_renderer & renderer_to_agent",
        detail:
          "Replaces legacy server_to_client terminology to reflect peer-to-peer multi-agent and client-renderer topologies."
      },
      {
        badge: "BIDIRECTIONAL RPC",
        title: "Guarded Function Invocations",
        detail:
          "New callRendererFunction & callAgentFunction primitives enforce allowedCallers and requiresUserActivation for HITL safety."
      },
      {
        badge: "LAYOUT PURITY",
        title: "Mixable Catalogs & Theme Decoupling",
        detail:
          "Removes hardcoded theme/primaryColor from payloads so enterprise design systems control branding; supports per-node catalogId."
      }
    ]
  },
  {
    tag: "ACT 1 · SLIDE 04/04 • LIVE CLOUD ARCHITECTURE ON NITINAGGA-GE-2",
    title: "Live Production Demo: Multi-Agent A2UI on Google Cloud",
    subtitle:
      "Deploying Vertex AI Agent Engine (ADK) + Cloud Run a2a-gateway on Project nitinagga-ge-2 with Live v0.9.1 Card Rendering",
    codeSnippetTitle: "Live Google Cloud Deployment Topology (Project: nitinagga-ge-2)",
    codeSnippet: `Project        : nitinagga-ge-2 (Argolis Enterprise Sandbox)
A2A Gateway    : https://a2a-gateway-638420508320.us-central1.run.app
Agent Runtime  : Vertex AI Agent Engine (ADK / Gemini 2.5 Pro)
Renderer Core  : @a2ui/web_core 0.11.0 + @a2ui/react 0.11.1 (v0.9.1 spec)
Live Primitives: surfaceUpdate -> dataModelUpdate -> beginRendering`,
    cards: [
      {
        badge: "VERTEX AI ADK",
        title: "Specialist Reasoning Agents",
        detail:
          "Orchestrator and Domain Agents running on Vertex AI Agent Engine synthesize structured surfaceUpdate JSON envelopes."
      },
      {
        badge: "CLOUD RUN A2A",
        title: "Live a2a-gateway Service",
        detail:
          "Routes inter-agent A2A tasks on us-central1 and streams validated A2UI DataPart messages to the web client."
      },
      {
        badge: "LIVE UI CARDS",
        title: "Real-Time Interactive Card Surface",
        detail:
          "Watch live A2UI v0.9.1 cards hydrate on screen, bind reactive data models, and trigger bidirectional agent actions."
      }
    ]
  }
];

export interface PromptCanvasSlideTrackProps {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  architectureTag?: string;
}

export const PromptCanvasSlideTrack: React.FC<PromptCanvasSlideTrackProps> = () => {
  const frame = useCurrentFrame();
  // 3600 total frames across 4 slides -> 900 frames (15.0s) per slide
  const framesPerSlide = 900;
  const slideIndex = Math.min(
    A2UI_SLIDES.length - 1,
    Math.floor(frame / framesPerSlide)
  );
  const localFrame = frame - slideIndex * framesPerSlide;
  const slide = A2UI_SLIDES[slideIndex];

  const enterOpacity = interpolate(localFrame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const exitOpacity = interpolate(localFrame, [framesPerSlide - 18, framesPerSlide], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const slideOpacity = Math.min(enterOpacity, exitOpacity);

  const headerY = interpolate(localFrame, [0, 24], [32, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  const progressPct = ((frame / 3600) * 100).toFixed(1);

  return (
    <div
      style={{
        width: 3840,
        height: 2160,
        backgroundColor: "#F8FAFC",
        padding: "130px 200px 100px 200px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "relative",
        opacity: slideOpacity
      }}
    >
      {/* Subtle Top Progress Bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 10,
          width: `${progressPct}%`,
          background: "linear-gradient(90deg, #1A73E8 0%, #7C3AED 100%)"
        }}
      />

      {/* Top Header & Slide Indicator */}
      <div style={{ transform: `translateY(${headerY}px)` }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              backgroundColor: "#EFF6FF",
              border: "2px solid #BFDBFE",
              borderRadius: 30,
              padding: "12px 32px"
            }}
          >
            <span
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 22,
                fontWeight: 700,
                color: "#1D4ED8",
                letterSpacing: "0.08em"
              }}
            >
              {slide.tag}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center"
            }}
          >
            {A2UI_SLIDES.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: idx === slideIndex ? 72 : 24,
                  height: 14,
                  borderRadius: 8,
                  backgroundColor: idx === slideIndex ? "#1A73E8" : "#CBD5E1"
                }}
              />
            ))}
          </div>
        </div>

        <h1
          style={{
            fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
            fontSize: 78,
            fontWeight: 800,
            color: "#0F172A",
            lineHeight: 1.14,
            margin: "0 0 20px 0",
            letterSpacing: "-0.02em"
          }}
        >
          {slide.title}
        </h1>

        <p
          style={{
            fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
            fontSize: 34,
            fontWeight: 500,
            color: "#334155",
            maxWidth: 3400,
            lineHeight: 1.38,
            margin: 0
          }}
        >
          {slide.subtitle}
        </p>
      </div>

      {/* Middle Section: Protocol Code Box + 3 Architectural Pillars */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 1.75fr",
          gap: 44,
          alignItems: "stretch",
          marginTop: 36,
          marginBottom: 36
        }}
      >
        {/* Left: Dark Studio Code & JSON Inspector */}
        <div
          style={{
            backgroundColor: "#0F172A",
            borderRadius: 24,
            border: "2px solid #1E293B",
            padding: "38px 44px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            boxShadow: "0 20px 45px rgba(15, 23, 42, 0.12)"
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #334155",
                paddingBottom: 18,
                marginBottom: 24
              }}
            >
              <span
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#38BDF8"
                }}
              >
                {slide.codeSnippetTitle}
              </span>
              <span
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 18,
                  color: "#94A3B8",
                  backgroundColor: "#1E293B",
                  padding: "6px 14px",
                  borderRadius: 8
                }}
              >
                A2UI JSON SCHEMA
              </span>
            </div>

            <pre
              style={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 25,
                lineHeight: 1.55,
                color: "#E2E8F0",
                margin: 0,
                whiteSpace: "pre-wrap"
              }}
            >
              {slide.codeSnippet}
            </pre>
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: "1px solid #1E293B",
              display: "flex",
              justifyContent: "space-between",
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 20,
              color: "#64748B"
            }}
          >
            <span>REPO: github.com/a2ui-project/a2ui</span>
            <span>SHA: 1c45c809 (Pinned)</span>
          </div>
        </div>

        {/* Right: 3 Structured Pillar Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 32
          }}
        >
          {slide.cards.map((card, idx) => {
            const cardOpacity = interpolate(localFrame, [10 + idx * 8, 28 + idx * 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });
            const cardY = interpolate(localFrame, [10 + idx * 8, 28 + idx * 8], [28, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });

            return (
              <div
                key={idx}
                style={{
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #E2E8F0",
                  borderRadius: 24,
                  padding: "42px 36px",
                  boxShadow: "0 12px 32px rgba(15, 23, 42, 0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div
                    style={{
                      display: "inline-block",
                      fontFamily: "'Roboto Mono', monospace",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#7C3AED",
                      backgroundColor: "#F3E8FF",
                      padding: "8px 18px",
                      borderRadius: 12,
                      marginBottom: 24
                    }}
                  >
                    {card.badge}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
                      fontSize: 34,
                      fontWeight: 700,
                      color: "#0F172A",
                      margin: "0 0 18px 0",
                      lineHeight: 1.25
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
                      fontSize: 26,
                      fontWeight: 400,
                      color: "#475569",
                      lineHeight: 1.48,
                      margin: 0
                    }}
                  >
                    {card.detail}
                  </p>
                </div>

                <div
                  style={{
                    fontFamily: "'Roboto Mono', monospace",
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#1A73E8",
                    marginTop: 24
                  }}
                >
                  PILLAR 0{idx + 1} →
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Branding */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "2px solid #E2E8F0",
          paddingTop: 26
        }}
      >
        <span
          style={{
            fontFamily: "'Google Sans Flex', sans-serif",
            fontSize: 24,
            fontWeight: 600,
            color: "#475569"
          }}
        >
          Google Cloud Technical Enablement • A2UI Protocol Architecture & Live Demo
        </span>
        <span
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 22,
            fontWeight: 700,
            color: "#1D4ED8"
          }}
        >
          PROJECT: NITINAGGA-GE-2 • ACT 1 OF 3 (SLIDES: 0:00 – 1:00)
        </span>
      </div>
    </div>
  );
};
