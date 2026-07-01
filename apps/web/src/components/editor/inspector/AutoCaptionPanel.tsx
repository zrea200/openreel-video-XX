import React, { useState, useCallback, useMemo } from "react";
import { Mic, MicOff, Languages, AlertCircle } from "lucide-react";
import { useEngineStore } from "../../../stores/engine-store";
import { useProjectStore } from "../../../stores/project-store";
import { SpeechToTextEngine } from "@openreel/core";
import type {
  TranscriptionProgress,
  TranscriptionSegment,
} from "@openreel/core";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@openreel/ui";

const CAPTION_STYLE_PRESETS = [
  {
    id: "default",
    name: "默认",
    description: "深色背景上的白色文字",
  },
  { id: "modern", name: "现代", description: "简洁、极简风格" },
  { id: "bold", name: "粗体", description: "大号、醒目文字" },
  { id: "cinematic", name: "电影", description: "电影风格字幕" },
  { id: "minimal", name: "极简", description: "低调、含蓄" },
];

const LANGUAGE_LABELS: Record<string, string> = {
  "en-US": "英语（美国）",
  "en-GB": "英语（英国）",
  "zh-CN": "中文（简体）",
  "zh-TW": "中文（繁体）",
  "ja-JP": "日语",
  "ko-KR": "韩语",
  "fr-FR": "法语",
  "de-DE": "德语",
  "es-ES": "西班牙语",
  "it-IT": "意大利语",
  "pt-BR": "葡萄牙语（巴西）",
  "ru-RU": "俄语",
};

export const AutoCaptionPanel: React.FC = () => {
  const getSpeechToTextEngine = useEngineStore(
    (state) => state.getSpeechToTextEngine,
  );
  const addSubtitle = useProjectStore((state) => state.addSubtitle);
  const applySubtitleStylePreset = useProjectStore(
    (state) => state.applySubtitleStylePreset,
  );

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState<TranscriptionProgress | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [selectedStyle, setSelectedStyle] = useState("default");
  const [segments, setSegments] = useState<TranscriptionSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isSupported = useMemo(() => SpeechToTextEngine.isSupported(), []);
  const languages = useMemo(
    () => SpeechToTextEngine.getSupportedLanguages(),
    [],
  );

  const handleStartTranscription = useCallback(async () => {
    setError(null);
    setSegments([]);
    setIsTranscribing(true);

    try {
      const speechEngine = await getSpeechToTextEngine();

      speechEngine.setOptions({ language: selectedLanguage });

      speechEngine.onProgress((prog) => {
        setProgress(prog);
      });

      speechEngine.onSegment((segment) => {
        setSegments((prev) => [...prev, segment]);
      });

      await speechEngine.startLiveTranscription();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "无法开始转写",
      );
      setIsTranscribing(false);
    }
  }, [getSpeechToTextEngine, selectedLanguage]);

  const handleStopTranscription = useCallback(async () => {
    const speechEngine = await getSpeechToTextEngine();

    const result = speechEngine.stopTranscription();
    setIsTranscribing(false);
    setProgress(null);

    if (result.success && result.segments.length > 0) {
      const subtitles = speechEngine.segmentsToSubtitles(result.segments);
      subtitles.forEach((subtitle) => {
        addSubtitle(subtitle);
      });

      if (selectedStyle !== "default") {
        await applySubtitleStylePreset(selectedStyle);
      }
    }
  }, [
    getSpeechToTextEngine,
    addSubtitle,
    applySubtitleStylePreset,
    selectedStyle,
  ]);

  const handleApplySegments = useCallback(async () => {
    if (segments.length === 0) return;

    const speechEngine = await getSpeechToTextEngine();

    const subtitles = speechEngine.segmentsToSubtitles(segments);
    subtitles.forEach((subtitle) => {
      addSubtitle(subtitle);
    });

    if (selectedStyle !== "default") {
      await applySubtitleStylePreset(selectedStyle);
    }

    setSegments([]);
  }, [
    getSpeechToTextEngine,
    addSubtitle,
    applySubtitleStylePreset,
    segments,
    selectedStyle,
  ]);

  if (!isSupported) {
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-status-warning">
          <AlertCircle size={16} />
          <span className="text-[11px] font-medium">浏览器不支持</span>
        </div>
        <p className="text-[10px] text-text-muted">
          自动字幕需要 Chrome 或 Edge 浏览器，且支持语音识别 API。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full">
      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/30">
        <Mic size={16} className="text-primary" />
        <div>
          <span className="text-[11px] font-medium text-text-primary">
            自动字幕
          </span>
          <p className="text-[9px] text-text-muted">
            从语音生成字幕
          </p>
        </div>
      </div>

      <div className="space-y-3 p-3 bg-background-tertiary rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Languages size={14} className="text-text-secondary" />
            <span className="text-[10px] text-text-secondary">语言</span>
          </div>
          <Select
            value={selectedLanguage}
            onValueChange={setSelectedLanguage}
            disabled={isTranscribing}
          >
            <SelectTrigger className="w-auto min-w-[100px] bg-background-secondary border-border text-text-primary text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background-secondary border-border">
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {LANGUAGE_LABELS[lang.code] ?? lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-text-secondary">字幕样式</span>
          <Select
            value={selectedStyle}
            onValueChange={setSelectedStyle}
            disabled={isTranscribing}
          >
            <SelectTrigger className="w-auto min-w-[100px] bg-background-secondary border-border text-text-primary text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background-secondary border-border">
              {CAPTION_STYLE_PRESETS.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  {preset.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-[10px] text-red-400">{error}</span>
        </div>
      )}

      {isTranscribing && progress && (
        <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">状态</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-red-400">录制中</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">
              已识别片段
            </span>
            <span className="text-[10px] text-text-primary font-mono">
              {progress.segmentsFound}
            </span>
          </div>
        </div>
      )}

      {segments.length > 0 && !isTranscribing && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-secondary">
              已识别 {segments.length} 条字幕
            </span>
            <button
              onClick={handleApplySegments}
              className="px-2 py-1 text-[10px] bg-primary text-white rounded hover:bg-primary/80 transition-colors"
            >
              添加到时间轴
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {segments.map((segment, index) => (
              <div
                key={index}
                className="p-2 bg-background-secondary rounded text-[10px] text-text-primary"
              >
                <span className="text-text-muted font-mono">
                  [{segment.startTime.toFixed(1)}s -{" "}
                  {segment.endTime.toFixed(1)}s]
                </span>
                <span className="ml-2">{segment.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {!isTranscribing ? (
          <button
            onClick={handleStartTranscription}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            <Mic size={16} />
            <span className="text-[11px] font-medium">开始录制</span>
          </button>
        ) : (
          <button
            onClick={handleStopTranscription}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <MicOff size={16} />
            <span className="text-[11px] font-medium">停止录制</span>
          </button>
        )}
      </div>

      <p className="text-[9px] text-text-muted text-center">
        请对着麦克风清晰说话，字幕将实时生成。
      </p>
    </div>
  );
};

export default AutoCaptionPanel;
