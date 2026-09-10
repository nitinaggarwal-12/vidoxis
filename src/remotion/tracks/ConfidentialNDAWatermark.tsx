import React from "react";
import { useCurrentFrame } from "remotion";

export interface ConfidentialNDAWatermarkProps {
  partnerName?: string;
  opacity?: number;
}

export const ConfidentialNDAWatermark: React.FC<ConfidentialNDAWatermarkProps> = ({
  partnerName = "Enterprise Cloud Partner",
  opacity = 0.05
}) => {
  const frame = useCurrentFrame();
  const text = `CONFIDENTIAL • UNDER NDA • PREPARED FOR ${partnerName.toUpperCase()} • DO NOT DISTRIBUTE`;

  // Gentle drift across time to prevent clean watermark cloning/removal
  const offsetX = (frame * 0.5) % 400;
  const offsetY = (frame * 0.25) % 250;

  return (
    <div
      style={{
        position: "absolute",
        top: -200,
        left: -400,
        width: 4640,
        height: 2560,
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(-22deg)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        pointerEvents: "none",
        zIndex: 45,
        overflow: "hidden"
      }}
    >
      {Array.from({ length: 12 }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: "flex",
            justifyContent: "space-around",
            whiteSpace: "nowrap",
            opacity,
            fontFamily: "'Google Sans Flex', 'Roboto Mono', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "2px",
            color: "#0F172A",
            textTransform: "uppercase"
          }}
        >
          {Array.from({ length: 4 }).map((_, colIdx) => (
            <span key={colIdx} style={{ margin: "0 60px" }}>
              {text}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};
