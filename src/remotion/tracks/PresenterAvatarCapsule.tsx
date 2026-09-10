import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export interface PresenterAvatarCapsuleProps {
  presenterName?: string;
  roleTitle?: string;
  avatarUrl?: string;
  position?: "bottom-right" | "bottom-left";
  activeGazeTarget?: { x: number; y: number };
}

export const PresenterAvatarCapsule: React.FC<PresenterAvatarCapsuleProps> = ({
  presenterName = "Dr. Maya Lin",
  roleTitle = "Google Cloud AI Evangelist",
  avatarUrl,
  position = "bottom-right",
  activeGazeTarget
}) => {
  const frame = useCurrentFrame();

  // Subtle breathing motion
  const breathY = Math.sin(frame / 20) * 3;
  const pulseScale = 1 + Math.sin(frame / 15) * 0.015;

  // Audio wave visualization heights
  const wave1 = 8 + Math.abs(Math.sin(frame * 0.2)) * 18;
  const wave2 = 6 + Math.abs(Math.sin(frame * 0.28 + 1.2)) * 22;
  const wave3 = 10 + Math.abs(Math.sin(frame * 0.16 + 2.4)) * 16;
  const wave4 = 7 + Math.abs(Math.sin(frame * 0.24 + 0.8)) * 20;

  const posX = position === "bottom-right" ? 3840 - 580 : 120;
  const posY = 2160 - 460 + breathY;

  return (
    <div
      style={{
        position: "absolute",
        left: posX,
        top: posY,
        width: 460,
        height: 340,
        zIndex: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      {/* Outer Glow Capsule */}
      <div
        style={{
          position: "relative",
          width: 440,
          height: 260,
          borderRadius: 28,
          background: "linear-gradient(145deg, #FFFFFF, #F8FAFC)",
          border: "2px solid #93C5FD",
          boxShadow: "0 20px 45px rgba(0,0,0,0.08), 0 0 25px rgba(66, 133, 244, 0.15)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${pulseScale})`
        }}
      >
        {/* Background Grid Accent */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 50% 30%, rgba(66, 133, 244, 0.15) 0%, transparent 70%)"
          }}
        />

        {/* Presenter Avatar SVG Hologram */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1A73E8, #8AB4F8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 35px rgba(66, 133, 244, 0.6)",
            border: "3px solid #E8F0FE"
          }}
        >
          <svg width="84" height="84" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4.5" fill="#FFFFFF" />
            <path
              d="M4 20C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 20"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Live "ON AIR" Pill */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 18,
            display: "flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "#FCE8E6",
            border: "1px solid #F28B82",
            borderRadius: 12,
            padding: "4px 10px"
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#EA4335",
              boxShadow: "0 0 8px #EA4335"
            }}
          />
          <span
            style={{
              fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
              fontSize: 11,
              fontWeight: 800,
              color: "#C5221F",
              letterSpacing: "0.08em"
            }}
          >
            LIVE AVATAR
          </span>
        </div>

        {/* Real-time Voice Audio Bars */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 18,
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
            height: 24
          }}
        >
          <div style={{ width: 4, height: wave1, backgroundColor: "#34A853", borderRadius: 2 }} />
          <div style={{ width: 4, height: wave2, backgroundColor: "#4285F4", borderRadius: 2 }} />
          <div style={{ width: 4, height: wave3, backgroundColor: "#D97706", borderRadius: 2 }} />
          <div style={{ width: 4, height: wave4, backgroundColor: "#EA4335", borderRadius: 2 }} />
        </div>
      </div>

      {/* Nameplate Pill */}
      <div
        style={{
          marginTop: -18,
          zIndex: 90,
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid #CBD5E1",
          backdropFilter: "blur(12px)",
          borderRadius: 16,
          padding: "8px 24px",
          textAlign: "center",
          boxShadow: "0 10px 25px rgba(0,0,0,0.08)"
        }}
      >
        <div
          style={{
            fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#0F172A",
            letterSpacing: "0.02em"
          }}
        >
          {presenterName}
        </div>
        <div
          style={{
            fontFamily: "'Roboto Mono', monospace",
            fontSize: 11,
            fontWeight: 600,
            color: "#1A73E8"
          }}
        >
          {roleTitle}
        </div>
      </div>
    </div>
  );
};
