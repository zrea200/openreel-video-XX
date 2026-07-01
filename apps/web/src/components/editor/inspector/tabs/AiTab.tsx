import React from "react";
import { Zap, Captions, Loader2, Upload } from "lucide-react";
import {
  type WhisperTranscriptionProgress,
  type CaptionAnimationStyle,
  CAPTION_ANIMATION_STYLES,
  getAnimationStyleDisplayName,
} from "@openreel/core";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "@openreel/ui";
import { AutoReframeSection } from "../";
import { AutoEditPanel } from "../../panels/AutoEditPanel";
import { HighlightExtractorPanel } from "../../panels/HighlightExtractorPanel";
import { InspectorSection } from "../shell/InspectorSection";

const CAPTION_STYLE_LABELS: Partial<Record<CaptionAnimationStyle, string>> = {
  none: "无",
  fade: "淡入淡出",
  pop: "弹出",
  slide: "滑入",
  typewriter: "打字机",
  karaoke: "卡拉 OK",
  bounce: "弹跳",
  scale: "缩放",
};

const getCaptionStyleLabel = (style: CaptionAnimationStyle): string =>
  CAPTION_STYLE_LABELS[style] ?? getAnimationStyleDisplayName(style);

const LANGUAGE_LABELS: Record<string, string> = {
  none: "原文（不翻译）",
  en: "英语",
  es: "西班牙语",
  fr: "法语",
  de: "德语",
  pt: "葡萄牙语",
  it: "意大利语",
  nl: "荷兰语",
  ru: "俄语",
  zh: "中文",
  ja: "日语",
  ko: "韩语",
  ar: "阿拉伯语",
  hi: "印地语",
  tr: "土耳其语",
  pl: "波兰语",
  sv: "瑞典语",
};

export interface AiTabProps {
  clipId: string;
  clipType: string | null;
  showVideoControls: boolean;
  showAudioEffects: boolean;
  showVideoEffects: boolean;
  transcriptionProgress: WhisperTranscriptionProgress | null;
  isTranscribing: boolean;
  targetLanguage: string;
  setTargetLanguage: React.Dispatch<React.SetStateAction<string>>;
  defaultAnimationStyle: CaptionAnimationStyle;
  setDefaultAnimationStyle: React.Dispatch<
    React.SetStateAction<CaptionAnimationStyle>
  >;
  handleGenerateSubtitles: () => Promise<void>;
  handleSRTImport: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  srtInputRef: React.RefObject<HTMLInputElement>;
  handleRemoveBackground: () => void;
  handleEnhanceAudio: () => Promise<void>;
  handleAutoColor: () => Promise<void>;
  isEnhancingAudio: boolean;
  audioEnhanced: boolean;
  isApplyingSelectedClipEffect: boolean;
}

export const AiTab: React.FC<AiTabProps> = ({
  clipId,
  clipType,
  showVideoControls,
  showAudioEffects,
  showVideoEffects,
  transcriptionProgress,
  isTranscribing,
  targetLanguage,
  setTargetLanguage,
  defaultAnimationStyle,
  setDefaultAnimationStyle,
  handleGenerateSubtitles,
  handleSRTImport,
  srtInputRef,
  handleRemoveBackground,
  handleEnhanceAudio,
  handleAutoColor,
  isEnhancingAudio,
  audioEnhanced,
  isApplyingSelectedClipEffect,
}) => {
  return (
    <>
      {clipType === "video" && (
        <>
          <InspectorSection
            title="AI 自动字幕"
            sectionId="auto-captions"
            defaultOpen={false}
          >
            <div className="space-y-3">
              <input
                ref={srtInputRef}
                type="file"
                accept=".srt,text/srt,text/plain"
                onChange={handleSRTImport}
                className="hidden"
              />
              <div>
                <label className="text-[10px] text-text-secondary block mb-1">
                  动画样式
                </label>
                <Select
                  value={defaultAnimationStyle}
                  onValueChange={(v) =>
                    setDefaultAnimationStyle(v as CaptionAnimationStyle)
                  }
                  disabled={isTranscribing}
                >
                  <SelectTrigger className="w-full bg-background-secondary border-border text-text-primary text-[11px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background-secondary border-border">
                    {CAPTION_ANIMATION_STYLES.map((style) => (
                      <SelectItem key={style} value={style}>
                        {getCaptionStyleLabel(style)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-[10px] text-text-secondary block mb-1">
                  目标语言
                </label>
                <Select
                  value={targetLanguage}
                  onValueChange={setTargetLanguage}
                  disabled={isTranscribing}
                >
                  <SelectTrigger className="w-full bg-background-secondary border-border text-text-primary text-[11px]">
                    <SelectValue placeholder="原文（不翻译）" />
                  </SelectTrigger>
                  <SelectContent className="bg-background-secondary border-border">
                    <SelectItem value="none">{LANGUAGE_LABELS.none}</SelectItem>
                    <SelectGroup>
                      <SelectLabel className="text-[10px]">翻译为</SelectLabel>
                      {Object.entries(LANGUAGE_LABELS)
                        .filter(([code]) => code !== "none")
                        .map(([code, label]) => (
                          <SelectItem key={code} value={code}>
                            {label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {transcriptionProgress ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2
                      size={12}
                      className="animate-spin text-primary"
                    />
                    <span className="text-[10px] text-text-primary">
                      {transcriptionProgress.message}
                    </span>
                  </div>
                  <div className="h-1.5 bg-background-tertiary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        transcriptionProgress.phase === "error"
                          ? "bg-red-500"
                          : transcriptionProgress.phase === "complete"
                            ? "bg-green-500"
                            : "bg-primary"
                      }`}
                      style={{ width: `${transcriptionProgress.progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateSubtitles}
                  disabled={isTranscribing}
                  className="w-full py-2 bg-primary hover:bg-primary/80 text-black rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Captions size={14} />
                  生成字幕
                </button>
              )}
              <button
                onClick={() => srtInputRef.current?.click()}
                disabled={isTranscribing}
                className="w-full py-2 bg-background-tertiary hover:bg-background-tertiary/80 border border-border text-text-primary rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload size={13} />
                导入 SRT 文件
              </button>
            </div>
          </InspectorSection>
        </>
      )}

      {clipType === "video" && (
        <InspectorSection
          title="自动重构画幅"
          sectionId="auto-reframe"
          defaultOpen={false}
        >
          <AutoReframeSection clipId={clipId} />
        </InspectorSection>
      )}

      {showAudioEffects && (
        <InspectorSection
          title="节拍自动剪辑"
          sectionId="auto-edit"
          defaultOpen={false}
        >
          <AutoEditPanel onClose={() => {}} />
        </InspectorSection>
      )}

      {showAudioEffects && (
        <InspectorSection
          title="AI 高光片段"
          sectionId="ai-highlights"
          defaultOpen={false}
        >
          <HighlightExtractorPanel clipId={clipId} />
        </InspectorSection>
      )}

      {(showVideoControls || showAudioEffects || showVideoEffects) && (
        <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Zap size={14} />
            <span className="text-xs font-bold">快捷操作</span>
          </div>
          <div className="space-y-2">
            {showVideoControls && (
              <button
                onClick={handleRemoveBackground}
                disabled={isApplyingSelectedClipEffect}
                className={`w-full py-2 border rounded-lg text-[10px] transition-all ${
                  isApplyingSelectedClipEffect
                    ? "bg-background-tertiary border-border text-text-muted cursor-not-allowed"
                    : "bg-background-tertiary hover:bg-primary hover:text-white border-border hover:border-primary"
                }`}
              >
                移除背景
              </button>
            )}
            {showAudioEffects && (
              <button
                onClick={handleEnhanceAudio}
                disabled={isEnhancingAudio || isApplyingSelectedClipEffect}
                className={`w-full py-2 border rounded-lg text-[10px] transition-all flex items-center justify-center gap-1.5 ${
                  audioEnhanced
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : isEnhancingAudio || isApplyingSelectedClipEffect
                      ? "bg-background-tertiary border-border text-text-muted cursor-not-allowed"
                      : "bg-background-tertiary hover:bg-primary hover:text-white border-border hover:border-primary"
                }`}
              >
                {isEnhancingAudio ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    正在清理…
                  </>
                ) : audioEnhanced ? (
                  "✓ 已降噪"
                ) : (
                  "快速对白清理"
                )}
              </button>
            )}
            {showVideoEffects && (
              <button
                onClick={handleAutoColor}
                disabled={isApplyingSelectedClipEffect}
                className={`w-full py-2 border rounded-lg text-[10px] transition-all ${
                  isApplyingSelectedClipEffect
                    ? "bg-background-tertiary border-border text-text-muted cursor-not-allowed"
                    : "bg-background-tertiary hover:bg-primary hover:text-white border-border hover:border-primary"
                }`}
              >
                {isApplyingSelectedClipEffect ? "正在应用…" : "自动调色"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
