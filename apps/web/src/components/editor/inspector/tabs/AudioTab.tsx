import React from "react";
import {
  AutoCutSilenceSection,
  AudioTextSyncPanel,
  NoiseReductionSection,
  AudioEffectsSection,
  AudioDuckingSection,
} from "../";
import { InspectorSection } from "../shell/InspectorSection";

export interface AudioTabProps {
  clipId: string;
  clipType: string | null;
  showAudioEffects: boolean;
  noiseReductionSectionTitle: string;
  selectedNoiseReductionEffect: unknown;
}

export const AudioTab: React.FC<AudioTabProps> = ({
  clipId,
  clipType,
  showAudioEffects,
  noiseReductionSectionTitle,
  selectedNoiseReductionEffect,
}) => {
  return (
    <>
      {showAudioEffects && (
        <InspectorSection
          title="自动剪除静音"
          sectionId="auto-cut-silence"
          defaultOpen={false}
        >
          <AutoCutSilenceSection clipId={clipId} />
        </InspectorSection>
      )}
      {clipType === "audio" && (
        <InspectorSection title="节拍同步" sectionId="beat-sync" defaultOpen={false}>
          <AudioTextSyncPanel clipId={clipId} />
        </InspectorSection>
      )}
      {showAudioEffects && (
        <InspectorSection
          title={noiseReductionSectionTitle}
          sectionId="background-noise-removal"
          defaultOpen={Boolean(selectedNoiseReductionEffect)}
        >
          <NoiseReductionSection clipId={clipId} />
        </InspectorSection>
      )}
      {showAudioEffects && (
        <>
          <InspectorSection
            title="音频特效"
            sectionId="audio-effects"
            defaultOpen={false}
          >
            <AudioEffectsSection clipId={clipId} />
          </InspectorSection>
        </>
      )}
      {showAudioEffects && (
        <InspectorSection
          title="音频闪避"
          sectionId="audio-ducking"
          defaultOpen={false}
        >
          <AudioDuckingSection clipId={clipId} />
        </InspectorSection>
      )}
    </>
  );
};
