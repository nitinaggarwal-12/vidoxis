import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface LegalPreviewDisclaimerSlateProps {
  text?: string;
  startFrame?: number;
  durationFrames?: number;
}

export const LegalPreviewDisclaimerSlate: React.FC<LegalPreviewDisclaimerSlateProps> = ({
  text = "Features shown are in Private Preview and subject to change prior to General Availability.",
  startFrame = 120, // 00:00:02 at 60fps
  durationFrames = 180 // 3 seconds at 60fps
}) => {
  const frame = useCurrentFrame();

  if (frame < startFrame || frame > startFrame + durationFrames) {
    return null;
  }

  const progress = frame - startFrame;
  const opacity = interpolate(
    progress,
    [0, 15, durationFrames - 15, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        zIndex: 50,
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "14px 28px",
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1.5px solid #F59E0B",
          borderRadius: 40,
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.1)"
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "50%",
            backgroundColor: "#F59E0B",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: 16
          }}
        >
          !
        </span>
        <span
          style={{
            fontFamily: "'Google Sans', system-ui, sans-serif",
            fontSize: 20,
            fontWeight: 600,
            color: "#1E293B",
            letterSpacing: "0.2px"
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
