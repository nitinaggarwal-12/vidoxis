import React from "react";

export interface ConfidentialNDAWatermarkProps {
  partnerName?: string;
  opacity?: number;
}

/**
 * Compliance marking for NDA briefings (GEMINI.md §3.3).
 *
 * Renders a SINGLE flat bottom-left badge. The previous implementation tiled a
 * 12x4 grid of text rotated -22deg across the full 4K canvas, which produced
 * diagonal stripes that dominated every frame and obscured console content.
 * Diagonal/tiled striping is explicitly banned.
 */
export const ConfidentialNDAWatermark: React.FC<ConfidentialNDAWatermarkProps> = ({
  partnerName = "Enterprise Cloud Partner",
  opacity = 0.5
}) => {
  const text = `CONFIDENTIAL · UNDER NDA · ${partnerName.toUpperCase()} · DO NOT DISTRIBUTE`;

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        bottom: 48,
        pointerEvents: "none",
        zIndex: 45,
        opacity,
        fontFamily: "'Roboto Mono', 'Google Sans Flex', monospace",
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: "1.5px",
        color: "#475569",
        backgroundColor: "rgba(255, 255, 255, 0.72)",
        border: "1px solid #CBD5E1",
        borderRadius: 8,
        padding: "8px 18px",
        whiteSpace: "nowrap"
      }}
    >
      {text}
    </div>
  );
};
