import React from "react";
import { Sequence, interpolate, useCurrentFrame, Audio } from "remotion";
import { WhiteboardTrack } from "./tracks/WhiteboardTrack.js";
import { ConsoleScreencastTrack } from "./tracks/ConsoleScreencastTrack.js";
import { LegalPreviewDisclaimerSlate } from "./tracks/LegalPreviewDisclaimerSlate.js";
import { ConfidentialNDAWatermark } from "./tracks/ConfidentialNDAWatermark.js";
import { PresenterAvatarCapsule } from "./tracks/PresenterAvatarCapsule.js";
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
  enableWatermark?: boolean;
  enableDisclaimer?: boolean;
  enableAvatar?: boolean;
  enableSubtitles?: boolean;
}

export type TrainexMasterCompositionProps = VidoxisMasterCompositionProps;

export const VidoxisMasterComposition: React.FC<VidoxisMasterCompositionProps> = ({
  title = "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
  subtitle = "Zero-Egress Enterprise Architectures with Private Service Connect & Vertex AI",
  topicId = "vertex_gemini_private_endpoint",
  slideDurationFrames = 0,
  whiteboardDurationFrames = 840, // 14.0 seconds @ 60fps (Act 1 hook + Act 2 progressive whiteboard)
  screencastDurationFrames = 1372, // 22.87 seconds @ 60fps (Act 3, 4, 5 GCP Console step-by-step walkthrough)
  screenshots = {},
  audioSrc,
  segments,
  enableWatermark = true,
  enableDisclaimer = true,
  enableAvatar = true,
  enableSubtitles = true
}) => {
  const frame = useCurrentFrame();

  // Cross-dissolve transition window between Whiteboard and Screencast (20 frames)
  const transitionStart = whiteboardDurationFrames - 20;
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
        backgroundColor: "#F8FAFC",
        overflow: "hidden"
      }}
    >
      {/* Audio Layer (Narration + Ducked Lyria Music Bed + SFX) */}
      {audioSrc && <Audio src={audioSrc} />}

      {/* Optional Stage 1: Keynote Slide Track */}
      {slideDurationFrames > 0 && (
        <Sequence from={0} durationInFrames={slideDurationFrames}>
          <PromptCanvasSlideTrack title={title} subtitle={subtitle} />
        </Sequence>
      )}

      {/* Sequence 1: Progressive Whiteboard Engine (Act 1 & 2: Frames 0 - 840) */}
      <Sequence from={slideDurationFrames} durationInFrames={whiteboardDurationFrames}>
        <div style={{ opacity: whiteboardOpacity, width: "100%", height: "100%" }}>
          <WhiteboardTrack />
        </div>
      </Sequence>

      {/* Sequence 2: Live Console Deterministic Screencast (Act 3, 4, 5: Frames 820 - 2212) */}
      <Sequence
        from={slideDurationFrames + transitionStart}
        durationInFrames={screencastDurationFrames + 20}
      >
        <div style={{ opacity: screencastOpacity, width: "100%", height: "100%" }}>
          <ConsoleScreencastTrack screenshots={screenshots} />
        </div>
      </Sequence>

      {/* Dynamic Gold Karaoke Subtitles */}
      {enableSubtitles && <KaraokeSubtitleTrack segments={segments} />}

      {/* Veo 2 / Imagen 3 PiP Presenter Avatar */}
      {enableAvatar && <PresenterAvatarCapsule />}

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

export const TrainexMasterComposition = VidoxisMasterComposition;
