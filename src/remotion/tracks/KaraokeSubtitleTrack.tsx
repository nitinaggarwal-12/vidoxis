import React from "react";
import { useCurrentFrame } from "remotion";

export interface SubtitleWord {
  word: string;
  startFrame: number;
  endFrame: number;
}

export interface SubtitleSegment {
  startFrame: number;
  endFrame: number;
  words: SubtitleWord[];
}

export interface KaraokeSubtitleTrackProps {
  segments?: SubtitleSegment[];
}

const DEFAULT_SEGMENTS: SubtitleSegment[] = [
  {
    startFrame: 0,
    endFrame: 90,
    words: [
      { word: "Welcome", startFrame: 0, endFrame: 15 },
      { word: "to", startFrame: 15, endFrame: 25 },
      { word: "Vidoxis.", startFrame: 25, endFrame: 45 },
      { word: "Today", startFrame: 45, endFrame: 60 },
      { word: "we", startFrame: 60, endFrame: 70 },
      { word: "architect", startFrame: 70, endFrame: 90 }
    ]
  },
  {
    startFrame: 90,
    endFrame: 180,
    words: [
      { word: "zero-egress", startFrame: 90, endFrame: 115 },
      { word: "Gemini", startFrame: 115, endFrame: 135 },
      { word: "2.0", startFrame: 135, endFrame: 150 },
      { word: "private", startFrame: 150, endFrame: 165 },
      { word: "endpoints.", startFrame: 165, endFrame: 180 }
    ]
  },
  {
    startFrame: 180,
    endFrame: 300,
    words: [
      { word: "Notice", startFrame: 180, endFrame: 200 },
      { word: "the", startFrame: 200, endFrame: 215 },
      { word: "deployment", startFrame: 215, endFrame: 240 },
      { word: "drawer", startFrame: 240, endFrame: 260 },
      { word: "sliding", startFrame: 260, endFrame: 280 },
      { word: "into", startFrame: 280, endFrame: 290 },
      { word: "place.", startFrame: 290, endFrame: 300 }
    ]
  },
  {
    startFrame: 300,
    endFrame: 480,
    words: [
      { word: "Zero", startFrame: 300, endFrame: 325 },
      { word: "public", startFrame: 325, endFrame: 350 },
      { word: "IPs,", startFrame: 350, endFrame: 375 },
      { word: "pure", startFrame: 375, endFrame: 400 },
      { word: "Private", startFrame: 400, endFrame: 425 },
      { word: "Service", startFrame: 425, endFrame: 450 },
      { word: "Connect.", startFrame: 450, endFrame: 480 }
    ]
  }
];

export const KaraokeSubtitleTrack: React.FC<KaraokeSubtitleTrackProps> = ({
  segments = DEFAULT_SEGMENTS
}) => {
  const frame = useCurrentFrame();

  const activeSegment = segments.find(
    s => frame >= s.startFrame && frame <= s.endFrame
  );

  if (!activeSegment) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 120,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        zIndex: 95,
        pointerEvents: "none"
      }}
    >
      <div
        style={{
          display: "inline-flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 12,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          border: "2px solid #FCD34D",
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          padding: "16px 36px",
          boxShadow: "0 15px 40px rgba(0, 0, 0, 0.12)"
        }}
      >
        {activeSegment.words.map((w, idx) => {
          const isSpoken = frame >= w.startFrame;
          const isCurrentlyActive = frame >= w.startFrame && frame <= w.endFrame;

          return (
            <span
              key={idx}
              style={{
                fontFamily: "'Google Sans Flex', 'Roboto', sans-serif",
                fontSize: 34,
                fontWeight: isCurrentlyActive ? 800 : 600,
                color: isCurrentlyActive
                  ? "#92400E"
                  : isSpoken
                  ? "#0F172A"
                  : "#64748B",
                backgroundColor: isCurrentlyActive ? "#FEF3C7" : "transparent",
                borderRadius: 10,
                padding: isCurrentlyActive ? "2px 10px" : "0px",
                border: isCurrentlyActive ? "1.5px solid #F59E0B" : "none",
                transform: isCurrentlyActive ? "scale(1.05)" : "scale(1)",
                transition: "all 0.1s ease",
                letterSpacing: "0.01em"
              }}
            >
              {w.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
