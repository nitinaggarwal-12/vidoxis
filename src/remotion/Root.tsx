import React from "react";
import { Composition } from "remotion";
import { VidoxisMasterComposition, TrainexMasterComposition } from "./VidoxisMasterComposition.js";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="VidoxisMasterComposition"
        component={VidoxisMasterComposition}
        durationInFrames={2212}
        fps={60}
        width={3840}
        height={2160}
        defaultProps={{
          title: "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
          topicId: "vertex_gemini_private_endpoint",
          whiteboardDurationFrames: 840,
          screencastDurationFrames: 1372,
          enableWatermark: false,
          enableDisclaimer: true
        }}
      />
      <Composition
        id="TrainexMasterComposition"
        component={TrainexMasterComposition}
        durationInFrames={2212}
        fps={60}
        width={3840}
        height={2160}
        defaultProps={{
          title: "Deploying Private Gemini 2.0 Endpoints on Google Cloud",
          topicId: "vertex_gemini_private_endpoint",
          whiteboardDurationFrames: 840,
          screencastDurationFrames: 1372,
          enableWatermark: false,
          enableDisclaimer: true
        }}
      />
    </>
  );
};
