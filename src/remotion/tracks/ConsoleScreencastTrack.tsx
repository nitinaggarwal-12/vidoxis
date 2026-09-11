import React, { useMemo } from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ComplianceRedactionLayer, RedactionBox } from "./ComplianceRedactionLayer.js";

export interface ConsoleStepKeyframe {
  frameStart: number;
  frameEnd: number;
  imageSrc: string;
  cursorStart: { x: number; y: number };
  cursorEnd: { x: number; y: number };
  cameraTarget: { x: number; y: number; scale: number };
  clickFrame?: number;
  stageBadge: string;
  label: string;
  showRedactions?: boolean;
}

export interface ConsoleScreencastTrackProps {
  screenshots?: {
    geminiPrompt?: string;
    geminiTrace?: string;
    geminiResults?: string;
    consoleOverview?: string;
    consoleDrawer?: string;
    consoleActive?: string;
    overview?: string;
    drawerOpened?: string;
    configEntered?: string;
    activeVerified?: string;
    cloudRun?: string;
    bigquery?: string;
  };
  redactions?: RedactionBox[];
}

export const ConsoleScreencastTrack: React.FC<ConsoleScreencastTrackProps> = ({
  screenshots = {},
  redactions
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Step-by-Step Google Cloud Console End-to-End Walkthrough (Relative Frames 0 - 1392, Global 820 - 2212):
  // Synchronized 1:1 with scratch/phonemes.json Audio Segments:
  // Step 1: Vertex AI Model Garden - Foundation Model Discovery (Rel 0 - 450, Global 820 - 1270) -> Segment 3
  // Step 2: Cloud Run Fleet & Ingress Gateway Selection (Rel 450 - 650, Global 1270 - 1470) -> Segment 4 (start)
  // Step 3: Security, CMEK & Cloud KMS Autokey Configuration (Rel 650 - 830, Global 1470 - 1650) -> Segment 4 (mid)
  // Step 4: Observability, Active Endpoint & Latency Telemetry (Rel 830 - 990, Global 1650 - 1810) -> Segment 4 (end)
  // Step 5: BigQuery Studio Lakehouse Grounding & Checklist (Rel 990 - 1392, Global 1810 - 2212) -> Segment 5
  const keyframes: ConsoleStepKeyframe[] = useMemo(() => {
    return [
      // Step 1: Google Cloud Console - Vertex AI Model Garden (Rel 0 - 450, Global 820 - 1270)
      {
        frameStart: 0,
        frameEnd: 450,
        imageSrc: screenshots.consoleOverview || screenshots.overview || "04_gcp_console_vertex_model_garden.png",
        cursorStart: { x: 550, y: 260 },
        cursorEnd: { x: 440, y: 780 },
        cameraTarget: { x: 440, y: 760, scale: 1.25 },
        clickFrame: 320,
        stageBadge: "Act 3 • Step 1: Google Cloud Console • Vertex AI Model Garden",
        label: "Discover Foundation Models: Select Gemini 3.1 Pro for Enterprise Inference",
        showRedactions: true
      },
      // Step 2: Google Cloud Console - Service Management & Ingress Target (Rel 450 - 650, Global 1270 - 1470)
      {
        frameStart: 450,
        frameEnd: 650,
        imageSrc: screenshots.cloudRun || "05_cloud_run_services.png",
        cursorStart: { x: 440, y: 780 },
        cursorEnd: { x: 230, y: 310 },
        cameraTarget: { x: 300, y: 320, scale: 1.22 },
        clickFrame: 560,
        stageBadge: "Act 3 • Step 2: Google Cloud Console • Service Fleet Architecture",
        label: "Select Ingress Target: a2a-gateway deployed in us-central1",
        showRedactions: true
      },
      // Step 3: Google Cloud Console - Security, CMEK & Cloud KMS Autokey (Rel 650 - 830, Global 1470 - 1650)
      {
        frameStart: 650,
        frameEnd: 830,
        imageSrc: screenshots.consoleDrawer || screenshots.drawerOpened || "05_gcp_console_deploy_drawer_opened.png",
        cursorStart: { x: 230, y: 310 },
        cursorEnd: { x: 650, y: 405 },
        cameraTarget: { x: 680, y: 430, scale: 1.3 },
        clickFrame: 770,
        stageBadge: "Act 3 • Step 3: Google Cloud Console • Zero-Egress Security",
        label: "Configure Customer-Managed Encryption Key (CMEK) via Cloud KMS Autokey",
        showRedactions: true
      },
      // Step 4: Google Cloud Console - Active Verified Endpoint & Telemetry (Rel 830 - 990, Global 1650 - 1810)
      {
        frameStart: 830,
        frameEnd: 990,
        imageSrc: screenshots.consoleActive || screenshots.activeVerified || "06_gcp_console_endpoint_active_verified.png",
        cursorStart: { x: 650, y: 405 },
        cursorEnd: { x: 750, y: 450 },
        cameraTarget: { x: 600, y: 380, scale: 1.15 },
        clickFrame: 920,
        stageBadge: "Act 3 • Step 4: Google Cloud Console • Active Telemetry & Observability",
        label: "Verify Active Endpoint Health: Sub-15ms Latency & Zero Public IP Exposure",
        showRedactions: true
      },
      // Step 5: Google Cloud Console - BigQuery Studio Lakehouse Grounding (Rel 990 - 1392, Global 1810 - 2212)
      {
        frameStart: 990,
        frameEnd: 1392,
        imageSrc: screenshots.bigquery || "06_bigquery_studio_editor.png",
        cursorStart: { x: 750, y: 450 },
        cursorEnd: { x: 270, y: 675 },
        cameraTarget: { x: 450, y: 480, scale: 1.18 },
        clickFrame: 1150,
        stageBadge: "Act 5: Google Cloud Console • BigQuery Studio Lakehouse & Production Checklist",
        label: "Ground & Query Clinical Lakehouse: Zero-Egress SQL over Private VPC",
        showRedactions: true
      }
    ];
  }, [screenshots]);

  // Find active keyframe based on current relative frame
  const currentKeyframe = useMemo(() => {
    return keyframes.find(kf => frame >= kf.frameStart && frame < kf.frameEnd) || keyframes[keyframes.length - 1];
  }, [keyframes, frame]);

  // Compute Minimum-Jerk interpolation for cursor (tau = 10*t^3 - 15*t^4 + 6*t^5)
  const cursor = useMemo(() => {
    const kfDuration = Math.max(1, currentKeyframe.frameEnd - currentKeyframe.frameStart);
    const rawProgress = Math.min(Math.max((frame - currentKeyframe.frameStart) / kfDuration, 0), 1);
    // Minimum-Jerk polynomial
    const tau = 10 * Math.pow(rawProgress, 3) - 15 * Math.pow(rawProgress, 4) + 6 * Math.pow(rawProgress, 5);

    const curX = currentKeyframe.cursorStart.x + (currentKeyframe.cursorEnd.x - currentKeyframe.cursorStart.x) * tau;
    const curY = currentKeyframe.cursorStart.y + (currentKeyframe.cursorEnd.y - currentKeyframe.cursorStart.y) * tau;

    // Check if clicking in this frame window (within 18 frames after clickFrame)
    let isClicking = false;
    let clickProgress = 0;
    if (currentKeyframe.clickFrame && frame >= currentKeyframe.clickFrame && frame <= currentKeyframe.clickFrame + 18) {
      isClicking = true;
      clickProgress = (frame - currentKeyframe.clickFrame) / 18;
    }

    return { x: curX * 2, y: curY * 2, isClicking, clickProgress };
  }, [currentKeyframe, frame]);

  // Critically damped spring camera zoom-and-pan
  const camera = useMemo(() => {
    const targetScale = currentKeyframe.cameraTarget.scale;
    const targetX = currentKeyframe.cameraTarget.x * 2;
    const targetY = currentKeyframe.cameraTarget.y * 2;

    const scaleSpring = spring({
      frame: frame - currentKeyframe.frameStart,
      fps,
      config: { damping: 18, stiffness: 180 }
    });

    const scale = interpolate(scaleSpring, [0, 1], [1.0, targetScale]);
    // Offset translation to center the camera target
    const translateX = (1920 - targetX) * (scale - 1);
    const translateY = (1080 - targetY) * (scale - 1);

    return { scale, translateX, translateY };
  }, [currentKeyframe, frame, fps]);

  return (
    <div
      style={{
        position: "absolute",
        width: 3840,
        height: 2160,
        backgroundColor: "#F8FAFC",
        overflow: "hidden",
        fontFamily: "'Google Sans Flex', 'Google Sans', system-ui, sans-serif"
      }}
    >
      {/* Zoomable & Pannable Console Canvas */}
      <div
        style={{
          width: 3840,
          height: 2160,
          transform: `translate(${camera.translateX}px, ${camera.translateY}px) scale(${camera.scale})`,
          transformOrigin: "center center",
          transition: "transform 0.1s linear"
        }}
      >
        {/* Screencast Image */}
        <Img
          src={currentKeyframe.imageSrc}
          style={{
            width: 3840,
            height: 2160,
            objectFit: "contain",
            display: "block"
          }}
        />

        {/* 12px Dilated Compliance Redaction Layer (on GCP Console views) */}
        {currentKeyframe.showRedactions && (
          <ComplianceRedactionLayer redactions={redactions} />
        )}

        {/* Synthetic Minimum-Jerk Spline Cursor */}
        <div
          style={{
            position: "absolute",
            left: cursor.x,
            top: cursor.y,
            pointerEvents: "none",
            transform: "translate(-6px, -4px)",
            zIndex: 40
          }}
        >
          {/* Frosted Halo Ring */}
          <div
            style={{
              position: "absolute",
              left: -16,
              top: -16,
              width: 52,
              height: 52,
              borderRadius: "50%",
              backgroundColor: "rgba(66, 133, 244, 0.2)",
              border: "2px solid rgba(66, 133, 244, 0.5)",
              boxShadow: "0 0 16px rgba(66, 133, 244, 0.4)"
            }}
          />

          {/* Click Ripple Wave */}
          {cursor.isClicking && (
            <div
              style={{
                position: "absolute",
                left: -16 - cursor.clickProgress * 24,
                top: -16 - cursor.clickProgress * 24,
                width: 52 + cursor.clickProgress * 48,
                height: 52 + cursor.clickProgress * 48,
                borderRadius: "50%",
                border: "3px solid #1A73E8",
                opacity: 1 - cursor.clickProgress,
                boxShadow: "0 0 20px #1A73E8"
              }}
            />
          )}

          {/* Precision SVG Cursor Pointer */}
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 3L10.07 20.97L13.58 13.58L20.97 10.07L3 3Z"
              fill="#1A73E8"
              stroke="#FFFFFF"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Broadcast Lower-Third Action Banner */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          left: 64,
          padding: "18px 36px",
          backgroundColor: "rgba(255, 255, 255, 0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRadius: 16,
          border: "1px solid #CBD5E1",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          zIndex: 60
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#188038",
            boxShadow: "0 0 10px #188038"
          }}
        />
        <div>
          <div style={{ fontSize: 13, color: "#475569", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
            {currentKeyframe.stageBadge}
          </div>
          <div style={{ fontSize: 23, color: "#0F172A", fontWeight: 700, marginTop: 4 }}>
            {currentKeyframe.label}
          </div>
        </div>
      </div>
    </div>
  );
};
