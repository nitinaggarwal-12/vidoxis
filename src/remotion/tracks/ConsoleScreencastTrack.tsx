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
  label: string;
}

export interface ConsoleScreencastTrackProps {
  screenshots?: {
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

  // Keyframed actions matching our CDP replayer and E2E capture sequence
  const keyframes: ConsoleStepKeyframe[] = useMemo(() => {
    return [
      {
        frameStart: 0,
        frameEnd: 70,
        imageSrc: screenshots.overview || "01_model_garden_overview.png",
        cursorStart: { x: 960, y: 540 },
        cursorEnd: { x: 1540, y: 140 },
        cameraTarget: { x: 1400, y: 200, scale: 1.2 },
        clickFrame: 65,
        label: "Click 'Deploy Model' Button"
      },
      {
        frameStart: 70,
        frameEnd: 140,
        imageSrc: screenshots.drawerOpened || "02_deploy_model_drawer_opened.png",
        cursorStart: { x: 1540, y: 140 },
        cursorEnd: { x: 1650, y: 220 },
        cameraTarget: { x: 1600, y: 300, scale: 1.35 },
        clickFrame: 130,
        label: "Focus Endpoint Name Input"
      },
      {
        frameStart: 140,
        frameEnd: 210,
        imageSrc: screenshots.configEntered || "03_endpoint_name_and_config_entered.png",
        cursorStart: { x: 1650, y: 220 },
        cursorEnd: { x: 1510, y: 480 },
        cameraTarget: { x: 1550, y: 400, scale: 1.3 },
        clickFrame: 200,
        label: "Specify Endpoint Parameters & Click Deploy"
      },
      {
        frameStart: 210,
        frameEnd: 280,
        imageSrc: screenshots.activeVerified || "04_deployment_active_verified.png",
        cursorStart: { x: 1510, y: 480 },
        cursorEnd: { x: 1100, y: 350 },
        cameraTarget: { x: 960, y: 540, scale: 1.05 },
        label: "Endpoint Deployed & Status Verified: Active"
      },
      {
        frameStart: 280,
        frameEnd: 350,
        imageSrc: screenshots.cloudRun || "05_cloud_run_services.png",
        cursorStart: { x: 1100, y: 350 },
        cursorEnd: { x: 400, y: 290 },
        cameraTarget: { x: 800, y: 400, scale: 1.15 },
        label: "Inspect Cloud Run Serverless Gateway"
      },
      {
        frameStart: 350,
        frameEnd: 420,
        imageSrc: screenshots.bigquery || "06_bigquery_studio_editor.png",
        cursorStart: { x: 400, y: 290 },
        cursorEnd: { x: 600, y: 450 },
        cameraTarget: { x: 960, y: 540, scale: 1.0 },
        label: "BigQuery Grounding & Audit Telemetry"
      }
    ];
  }, [screenshots]);

  // Find active keyframe based on current relative frame
  const currentKeyframe = useMemo(() => {
    return keyframes.find(kf => frame >= kf.frameStart && frame < kf.frameEnd) || keyframes[keyframes.length - 1];
  }, [keyframes, frame]);

  // Compute Minimum-Jerk interpolation for cursor (tau = 10*t^3 - 15*t^4 + 6*t^5)
  const cursor = useMemo(() => {
    const kfDuration = currentKeyframe.frameEnd - currentKeyframe.frameStart;
    const rawProgress = Math.min(Math.max((frame - currentKeyframe.frameStart) / kfDuration, 0), 1);
    // Minimum-Jerk polynomial
    const tau = 10 * Math.pow(rawProgress, 3) - 15 * Math.pow(rawProgress, 4) + 6 * Math.pow(rawProgress, 5);

    const curX = currentKeyframe.cursorStart.x + (currentKeyframe.cursorEnd.x - currentKeyframe.cursorStart.x) * tau;
    const curY = currentKeyframe.cursorStart.y + (currentKeyframe.cursorEnd.y - currentKeyframe.cursorStart.y) * tau;

    // Check if clicking in this frame window (within 15 frames after clickFrame)
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
        fontFamily: "'Google Sans', system-ui, sans-serif"
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
        {/* Console Screencast Image */}
        <Img
          src={currentKeyframe.imageSrc}
          style={{
            width: 3840,
            height: 2160,
            objectFit: "contain",
            display: "block"
          }}
        />

        {/* 12px Dilated Compliance Redaction Layer */}
        <ComplianceRedactionLayer redactions={redactions} />

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
          padding: "16px 32px",
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
          <div style={{ fontSize: 14, color: "#475569", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase" }}>
            Deterministic CDP Execution • Act 3: Live Console
          </div>
          <div style={{ fontSize: 24, color: "#0F172A", fontWeight: 700, marginTop: 4 }}>
            {currentKeyframe.label}
          </div>
        </div>
      </div>
    </div>
  );
};
