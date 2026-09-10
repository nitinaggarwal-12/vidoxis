import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export interface PromptCanvasSlideTrackProps {
  title?: string;
  subtitle?: string;
  bullets?: string[];
  architectureTag?: string;
}

export const PromptCanvasSlideTrack: React.FC<PromptCanvasSlideTrackProps> = ({
  title = "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
  subtitle = "Zero-Egress Enterprise Architectures with Private Service Connect & Vertex AI",
  bullets = [
    "Eliminate Public Internet Transit with VPC Service Controls",
    "Sub-15ms Latency Gemini 2.0 Flash Inference via Dedicated PSC Endpoints",
    "Enforce Google Cloud Armor WAF & Cloud Audit Logging at Layer 7"
  ],
  architectureTag = "ENTERPRISE REFERENCE ARCHITECTURE • PRODUCTION V2.4"
}) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const titleY = interpolate(frame, [0, 20], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div
      style={{
        width: 3840,
        height: 2160,
        backgroundColor: "#0F1115",
        padding: "160px 240px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxSizing: "border-box",
        position: "relative"
      }}
    >
      {/* Background Subtle Gradient */}
      <div
        style={{
          position: "absolute",
          top: -300,
          right: -300,
          width: 1200,
          height: 1200,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(66, 133, 244, 0.12) 0%, transparent 70%)",
          filter: "blur(80px)"
        }}
      />

      {/* Header Section */}
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)` }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            backgroundColor: "rgba(66, 133, 244, 0.15)",
            border: "1px solid rgba(66, 133, 244, 0.4)",
            borderRadius: 30,
            padding: "10px 28px",
            marginBottom: 32
          }}
        >
          <span
            style={{
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 20,
              fontWeight: 700,
              color: "#8AB4F8",
              letterSpacing: "0.08em"
            }}
          >
            {architectureTag}
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
            fontSize: 84,
            fontWeight: 800,
            color: "#FFFFFF",
            lineHeight: 1.15,
            margin: "0 0 24px 0",
            letterSpacing: "-0.02em"
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
            fontSize: 36,
            fontWeight: 400,
            color: "#9AA0A6",
            maxWidth: 2400,
            lineHeight: 1.4,
            margin: 0
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Structured Key Value Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 40,
          marginTop: 60
        }}
      >
        {bullets.map((bullet, idx) => {
          const cardOpacity = interpolate(frame, [15 + idx * 10, 35 + idx * 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });
          const cardY = interpolate(frame, [15 + idx * 10, 35 + idx * 10], [30, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });

          return (
            <div
              key={idx}
              style={{
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                backgroundColor: "rgba(26, 32, 44, 0.7)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 24,
                padding: "48px 40px",
                backdropFilter: "blur(16px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div
                style={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#4285F4",
                  marginBottom: 24
                }}
              >
                0{idx + 1}
              </div>
              <div
                style={{
                  fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
                  fontSize: 32,
                  fontWeight: 500,
                  color: "#E8EAED",
                  lineHeight: 1.35
                }}
              >
                {bullet}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Branding */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          paddingTop: 32
        }}
      >
        <span
          style={{
            fontFamily: "'Google Sans Flex', sans-serif",
            fontSize: 22,
            color: "#5F6368"
          }}
        >
          Google Cloud • Technical Enablement Studio
        </span>
        <span
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 22,
            color: "#5F6368"
          }}
        >
          CONFIDENTIAL • ALPHABET ENTERPRISE
        </span>
      </div>
    </div>
  );
};
