import React from "react";
import { Sequence, interpolate, useCurrentFrame, Audio } from "remotion";
import { WhiteboardTrack } from "./tracks/WhiteboardTrack.js";
import { ConsoleScreencastTrack } from "./tracks/ConsoleScreencastTrack.js";
import { LegalPreviewDisclaimerSlate } from "./tracks/LegalPreviewDisclaimerSlate.js";
import { ConfidentialNDAWatermark } from "./tracks/ConfidentialNDAWatermark.js";
import { KaraokeSubtitleTrack, SubtitleSegment } from "./tracks/KaraokeSubtitleTrack.js";
import { PromptCanvasSlideTrack } from "./tracks/PromptCanvasSlideTrack.js";

export interface VidoxisMasterCompositionProps {
  title?: string;
  subtitle?: string;
  topicId?: string;
  slideDurationFrames?: number;
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
  audioSrc?: string;
  segments?: SubtitleSegment[];
  /** NDA compliance badge (flat bottom-left label). Off by default. */
  enableWatermark?: boolean;
  enableDisclaimer?: boolean;
  enableSubtitles?: boolean;
}

export type TrainexMasterCompositionProps = VidoxisMasterCompositionProps;

export const VidoxisMasterComposition: React.FC<VidoxisMasterCompositionProps> = ({
  title = "A2UI Protocol Architecture & Multi-Agent Live Demo on Google Cloud",
  subtitle = "Declarative Agent-to-Renderer UI • Trust Boundary • Cloud Run a2a-gateway on nitinagga-ge-2",
  topicId = "a2ui_v1_0_rc_architecture_and_demo",
  slideDurationFrames = 3600,
  whiteboardDurationFrames = 7200,
  screencastDurationFrames = 7200,
  screenshots = {},
  audioSrc,
  segments,
  enableWatermark = false,
  enableDisclaimer = true,
  enableSubtitles = true
}) => {
  const frame = useCurrentFrame();

  const whiteboardEndGlobal = slideDurationFrames + whiteboardDurationFrames;
  const transitionStartGlobal = whiteboardEndGlobal - 20;
  const whiteboardOpacity = interpolate(
    frame,
    [transitionStartGlobal, whiteboardEndGlobal],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const screencastOpacity = interpolate(
    frame,
    [transitionStartGlobal, whiteboardEndGlobal],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "relative",
        width: 3840,
        height: 2160,
        backgroundColor: "#F8FAFC",
        overflow: "hidden"
      }}
    >
      {audioSrc && <Audio src={audioSrc} />}

      {slideDurationFrames > 0 && (
        <Sequence from={0} durationInFrames={slideDurationFrames}>
          <PromptCanvasSlideTrack title={title} subtitle={subtitle} />
        </Sequence>
      )}

      <Sequence from={slideDurationFrames} durationInFrames={whiteboardDurationFrames}>
        <div style={{ opacity: whiteboardOpacity, width: "100%", height: "100%" }}>
          <WhiteboardTrack title={title} subtitle={subtitle} />
        </div>
      </Sequence>

      <Sequence
        from={transitionStartGlobal}
        durationInFrames={screencastDurationFrames + 20}
      >
        <div style={{ opacity: screencastOpacity, width: "100%", height: "100%" }}>
          <ConsoleScreencastTrack screenshots={screenshots} />
        </div>
      </Sequence>

      {/* Dynamic Gold Karaoke Subtitles */}
      {enableSubtitles && <KaraokeSubtitleTrack segments={segments} />}

      {/* Compliance & Legal Disclaimers (Act 4) */}
      {enableDisclaimer && (
        <LegalPreviewDisclaimerSlate startFrame={120} durationFrames={180} />
      )}

      {/* NDA compliance badge — opt-in, flat bottom-left label (no diagonal striping) */}
      {enableWatermark && (
        <ConfidentialNDAWatermark partnerName="Alphabet Partner Briefing" />
      )}
    </div>
  );
};

export const TrainexMasterComposition = VidoxisMasterComposition;
