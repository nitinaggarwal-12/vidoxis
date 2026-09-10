import React from "react";

export interface RedactionBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  scaleFactor?: number;
}

export interface ComplianceRedactionLayerProps {
  redactions?: RedactionBox[];
  blurRadiusPx?: number;
}

/**
 * Standard Google Cloud Pantheon PII locations at 1920x1080:
 * - Billing Account badge at top-right (x: 1650, y: 12, w: 140, h: 26)
 * - User LDAP at top-right (x: 1795, y: 12, w: 110, h: 26)
 */
const DEFAULT_REDACTIONS: RedactionBox[] = [
  { id: "billing_account", x: 1640, y: 10, width: 155, height: 28, label: "REDACTED BILLING", scaleFactor: 2 },
  { id: "user_ldap", x: 1800, y: 10, width: 115, height: 28, label: "REDACTED LDAP", scaleFactor: 2 }
];

export const ComplianceRedactionLayer: React.FC<ComplianceRedactionLayerProps> = ({
  redactions = DEFAULT_REDACTIONS,
  blurRadiusPx = 16
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 30
      }}
    >
      {redactions.map(box => {
        const factor = box.scaleFactor || 1;
        // Apply 12px Dilation Kernel formula
        const dilatedX = Math.max(0, (box.x - 12) * factor);
        const dilatedY = Math.max(0, (box.y - 12) * factor);
        const dilatedWidth = (box.width + 24) * factor;
        const dilatedHeight = (box.height + 24) * factor;

        return (
          <div
            key={box.id}
            style={{
              position: "absolute",
              left: dilatedX,
              top: dilatedY,
              width: dilatedWidth,
              height: dilatedHeight,
              backdropFilter: `blur(${blurRadiusPx * factor}px)`,
              WebkitBackdropFilter: `blur(${blurRadiusPx * factor}px)`,
              backgroundColor: "rgba(24, 27, 34, 0.45)",
              borderRadius: 8 * factor,
              border: `${1 * factor}px solid rgba(255, 255, 255, 0.1)`,
              boxShadow: `0 ${4 * factor}px ${12 * factor}px rgba(0, 0, 0, 0.35)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden"
            }}
          >
            {box.label && (
              <span
                style={{
                  fontSize: 10 * factor,
                  fontWeight: 700,
                  color: "rgba(255, 255, 255, 0.65)",
                  letterSpacing: `${0.8 * factor}px`,
                  textTransform: "uppercase",
                  fontFamily: "'Roboto Mono', monospace"
                }}
              >
                🔒 {box.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
