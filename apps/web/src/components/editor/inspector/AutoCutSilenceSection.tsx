import React, { useState, useCallback } from "react";
import { Scissors, Search, Loader2, Volume2 } from "lucide-react";
import { Slider } from "@openreel/ui";
import { useProjectStore } from "../../../stores/project-store";
import {
  getSilenceCutBridge,
  DEFAULT_SILENCE_SETTINGS,
  type SilenceSettings,
  type SilenceAnalysisResult,
} from "../../../bridges/silence-cut-bridge";
import { toast } from "../../../stores/notification-store";

interface AutoCutSilenceSectionProps {
  clipId: string;
}

export const AutoCutSilenceSection: React.FC<AutoCutSilenceSectionProps> = ({
  clipId,
}) => {
  const { getClip, getMediaItem } = useProjectStore();
  const [settings, setSettings] = useState<SilenceSettings>(
    DEFAULT_SILENCE_SETTINGS,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCutting, setIsCutting] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<SilenceAnalysisResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const clip = getClip(clipId);
  const mediaItem = clip ? getMediaItem(clip.mediaId) : undefined;
  const hasAudio = mediaItem?.type === "audio" || mediaItem?.type === "video";

  const updateSettings = useCallback((updates: Partial<SilenceSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    setAnalysisResult(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!clipId) return;

    setIsAnalyzing(true);
    setProgress(0);
    setProgressMessage("初始化…");

    try {
      const bridge = getSilenceCutBridge();
      const result = await bridge.analyzeClip(clipId, settings, (prog, msg) => {
        setProgress(prog);
        setProgressMessage(msg);
      });

      setAnalysisResult(result);

      if (result.silentRegions.length === 0) {
        toast.info(
          "未检测到静音",
          "当前设置下未发现静音片段，可尝试降低阈值。",
        );
      }
    } catch (error) {
      console.error("Silence analysis failed:", error);
      toast.error(
        "分析失败",
        error instanceof Error ? error.message : "未知错误",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [clipId, settings]);

  const handleCutSilence = useCallback(async () => {
    if (!analysisResult || analysisResult.silentRegions.length === 0) return;

    setIsCutting(true);
    setProgress(0);
    setProgressMessage("准备中…");

    try {
      const bridge = getSilenceCutBridge();
      const result = await bridge.cutSilence(
        clipId,
        analysisResult.silentRegions,
        (prog, msg) => {
          setProgress(prog);
          setProgressMessage(msg);
        },
      );

      if (result.success) {
        const count = analysisResult.silentRegions.length;
        toast.success(
          "静音已移除",
          `已移除 ${count} 段静音`,
        );
        setAnalysisResult(null);
      } else {
        toast.error("剪切失败", result.error ?? "未知错误");
      }
    } catch (error) {
      console.error("Cut silence failed:", error);
      toast.error(
        "剪切失败",
        error instanceof Error ? error.message : "未知错误",
      );
    } finally {
      setIsCutting(false);
    }
  }, [clipId, analysisResult]);

  if (!hasAudio) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-text-secondary flex items-center gap-1">
              <Volume2 size={10} />
              静音阈值
            </label>
            <span className="text-[10px] text-text-muted font-mono">
              {settings.threshold} dB
            </span>
          </div>
          <Slider
            min={-80}
            max={-20}
            step={1}
            value={[settings.threshold]}
            onValueChange={(value) => updateSettings({ threshold: value[0] })}
          />
          <p className="text-[8px] text-text-muted mt-1">
            数值越低，检测到的静音越多
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-text-secondary">
              最短时长
            </label>
            <span className="text-[10px] text-text-muted font-mono">
              {settings.minSilenceDuration.toFixed(1)}s
            </span>
          </div>
          <Slider
            min={0.1}
            max={2.0}
            step={0.1}
            value={[settings.minSilenceDuration]}
            onValueChange={(value) =>
              updateSettings({ minSilenceDuration: value[0] })
            }
          />
          <p className="text-[8px] text-text-muted mt-1">
            判定为静音的最短时长
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-text-secondary">
                前留白
              </label>
              <span className="text-[10px] text-text-muted font-mono">
                {settings.paddingBefore.toFixed(1)}s
              </span>
            </div>
            <Slider
              min={0}
              max={2}
              step={0.05}
              value={[settings.paddingBefore]}
              onValueChange={(value) =>
                updateSettings({ paddingBefore: value[0] })
              }
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-text-secondary">
                后留白
              </label>
              <span className="text-[10px] text-text-muted font-mono">
                {settings.paddingAfter.toFixed(1)}s
              </span>
            </div>
            <Slider
              min={0}
              max={2}
              step={0.05}
              value={[settings.paddingAfter]}
              onValueChange={(value) =>
                updateSettings({ paddingAfter: value[0] })
              }
            />
          </div>
        </div>

        {analysisResult && (
          <div className="p-2 bg-background-secondary rounded border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-text-secondary">
                检测到静音段
              </span>
              <span className="text-sm font-bold text-primary">
                {analysisResult.silentRegions.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-secondary">
                静音总时长
              </span>
              <span className="text-[10px] text-text-primary">
                {analysisResult.totalSilenceDuration.toFixed(1)}s /{" "}
                {analysisResult.clipDuration.toFixed(1)}s（
                {Math.round(
                  (analysisResult.totalSilenceDuration /
                    analysisResult.clipDuration) *
                    100,
                )}
                %）
              </span>
            </div>
          </div>
        )}

        {(isAnalyzing || isCutting) && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-text-muted">
                {progressMessage}
              </span>
              <span className="text-[9px] text-text-muted">{progress}%</span>
            </div>
            <div className="h-1 bg-background-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isCutting}
            className={`flex-1 py-2 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-2 ${
              analysisResult
                ? "bg-background-secondary hover:bg-background-primary border border-border text-text-primary"
                : "bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white"
            }`}
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                分析中…
              </>
            ) : (
              <>
                <Search size={14} />
                {analysisResult ? "重新分析" : "分析"}
              </>
            )}
          </button>

          {analysisResult && analysisResult.silentRegions.length > 0 && (
            <button
              onClick={handleCutSilence}
              disabled={isCutting}
              className="flex-1 py-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isCutting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  剪切中…
                </>
              ) : (
                <>
                  <Scissors size={14} />
                  剪切 {analysisResult.silentRegions.length} 段
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-[9px] text-text-muted text-center">
          提示：可用 Ctrl+Z 一次性撤销全部剪切
        </p>
      </div>
    </div>
  );
};

export default AutoCutSilenceSection;
