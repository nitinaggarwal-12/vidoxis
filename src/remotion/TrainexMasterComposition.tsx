import React from "react";
import { Sequence, interpolate, useCurrentFrame } from "remotion";
import { WhiteboardTrack } from "./tracks/WhiteboardTrack.js";
import { ConsoleScreencastTrack } from "./tracks/ConsoleScreencastTrack.js";
import { LegalPreviewDisclaimerSlate } from "./tracks/LegalPreviewDisclaimerSlate.js";
import { ConfidentialNDAWatermark } from "./tracks/ConfidentialNDAWatermark.js";

export interface TrainexMasterCompositionProps {
  title?: string;
  topicId?: string;
  whiteboardDurationFrames?: number;
  screencastDurationFrames?: number;
  screenshots?: {
    overview?: string;
    drawerOpened?: string;
    configEntered?: string;
    activeVerified?: string;
    cloudRun?: string;
    bigquery?: string;
  };
  enableWatermark?: boolean;
  enableDisclaimer?: boolean;
}

export const TrainexMasterComposition: React.FC<TrainexMasterCompositionProps> = ({
  title = "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
  topicId = "vertex_gemini_private_endpoint",
  whiteboardDurationFrames = 180, // 3 seconds @ 60fps
  screencastDurationFrames = 300, // 5 seconds @ 60fps
  screenshots = {},
  enableWatermark = true,
  enableDisclaimer = true
}) => {
  const frame = useCurrentFrame();

  // Cross-dissolve transition window between Whiteboard and Screencast (15 frames)
  const transitionStart = whiteboardDurationFrames - 15;
  const whiteboardOpacity = interpolate(
    frame,
    [transitionStart, whiteboardDurationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const screencastOpacity = interpolate(
    frame,
    [transitionStart, whiteboardDurationFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "relative",
        width: 3840,
        height: 2160,
        backgroundColor: "#0F1115",
        overflow: "hidden"
      }}
    >
      {/* Sequence 1: Progressive Whiteboard Engine (Act 1 & 2) */}
      <Sequence from={0} durationInFrames={whiteboardDurationFrames}>
        <div style={{ opacity: whiteboardOpacity, width: "100%", height: "100%" }}>
          <WhiteboardTrack />
        </div>
      </Sequence>

      {/* Sequence 2: Live Console Deterministic Screencast (Act 3) */}
      <Sequence from={transitionStart} durationInFrames={screencastDurationFrames + 15}>
        <div style={{ opacity: screencastOpacity, width: "100%", height: "100%" }}>
          <ConsoleScreencastTrack screenshots={screenshots} />
        </div>
      </Sequence>

      {/* Compliance & Legal Disclaimers (Act 4) */}
      {enableDisclaimer && (
        <LegalPreviewDisclaimerSlate startFrame={120} durationFrames={180} />
      )}

      {/* Dynamic Security Watermarking */}
      {enableWatermark && (
        <ConfidentialNDAWatermark partnerName="Alphabet Partner Briefing" opacity={0.07} />
      )}
    </div>
  );
};
