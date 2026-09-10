import React from "react";
import { Composition } from "remotion";
import { TrainexMasterComposition } from "./TrainexMasterComposition.js";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TrainexMasterComposition"
      component={TrainexMasterComposition}
      durationInFrames={480}
      fps={60}
      width={3840}
      height={2160}
      defaultProps={{
        title: "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
        topicId: "vertex_gemini_private_endpoint",
        whiteboardDurationFrames: 180,
        screencastDurationFrames: 300,
        enableWatermark: true,
        enableDisclaimer: true
      }}
    />
  );
};
