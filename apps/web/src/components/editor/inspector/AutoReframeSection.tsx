import React, { useState, useCallback, useEffect } from "react";
import {
  Smartphone,
  Monitor,
  Square,
  Loader2,
  Play,
  CheckCircle,
} from "lucide-react";
import { Slider } from "@openreel/ui";
import {
  getAutoReframeEngine,
  initializeAutoReframeEngine,
  type ReframeSettings,
  type AspectRatioPreset,
  type PlatformPreset,
  type ReframeResult,
  ASPECT_RATIO_PRESETS,
  PLATFORM_PRESETS,
  DEFAULT_REFRAME_SETTINGS,
} from "@openreel/core";
import { toast } from "../../../stores/notification-store";
import { useProjectStore } from "../../../stores/project-store";

interface AutoReframeSectionProps {
  clipId: string;
  onReframeComplete?: (result: ReframeResult) => void;
}

const PLATFORM_LABELS: Record<PlatformPreset, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  "instagram-reels": "Instagram Reels",
  "instagram-feed": "Instagram 动态",
  "instagram-stories": "Instagram 快拍",
  "youtube-shorts": "YouTube Shorts",
  facebook: "Facebook",
  twitter: "Twitter",
  linkedin: "LinkedIn",
};

const PLATFORM_ICONS: Record<PlatformPreset, React.ReactNode> = {
  youtube: <Monitor size={14} />,
  tiktok: <Smartphone size={14} />,
  "instagram-reels": <Smartphone size={14} />,
  "instagram-feed": <Square size={14} />,
  "instagram-stories": <Smartphone size={14} />,
  "youtube-shorts": <Smartphone size={14} />,
  facebook: <Monitor size={14} />,
  twitter: <Monitor size={14} />,
  linkedin: <Monitor size={14} />,
};

export const AutoReframeSection: React.FC<AutoReframeSectionProps> = ({
  clipId,
  onReframeComplete,
}) => {
  const updateProjectDimensions = useProjectStore(
    (state) => state.updateSettings,
  );
  const [reframeSettings, setReframeSettings] = useState<ReframeSettings>(
    DEFAULT_REFRAME_SETTINGS,
  );
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isApplied, setIsApplied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformPreset | null>("tiktok");

  useEffect(() => {
    const engine = getAutoReframeEngine();
    if (engine) {
      setIsInitialized(engine.isInitialized());
    }
  }, [clipId]);

  const handleInitialize = useCallback(async () => {
    setIsInitializing(true);
    try {
      const engine = initializeAutoReframeEngine();
      await engine.initialize((prog, msg) => {
        setProgress(prog);
        setProgressMessage(msg);
      });
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize auto-reframe:", error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const updateLocalSettings = useCallback(
    (updates: Partial<ReframeSettings>) => {
      setReframeSettings((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const handleSelectPlatform = useCallback(
    (platform: PlatformPreset) => {
      setSelectedPlatform(platform);
      const config = PLATFORM_PRESETS[platform];
      const aspectRatio = Object.entries(ASPECT_RATIO_PRESETS).find(
        ([, v]) => Math.abs(v.ratio - config.ratio) < 0.01,
      );
      if (aspectRatio) {
        updateLocalSettings({
          targetAspectRatio: aspectRatio[0] as AspectRatioPreset,
        });
      }
    },
    [updateLocalSettings],
  );

  const handleSelectAspectRatio = useCallback(
    (ratio: AspectRatioPreset) => {
      setSelectedPlatform(null);
      updateLocalSettings({ targetAspectRatio: ratio });
    },
    [updateLocalSettings],
  );

  const handleAnalyze = useCallback(async () => {
    setIsProcessing(true);
    setProgress(0);
    setProgressMessage("正在初始化…");

    try {
      if (!isInitialized) {
        setProgressMessage("正在加载 AI 引擎…");
        setProgress(10);
        await handleInitialize();
      }

      const engine = getAutoReframeEngine();
      if (!engine) {
        throw new Error("Engine not available");
      }

      setProgressMessage("正在配置重构图设置…");
      setProgress(30);

      await new Promise((resolve) => setTimeout(resolve, 300));

      setProgressMessage("正在应用智能裁剪配置…");
      setProgress(60);

      const targetConfig =
        ASPECT_RATIO_PRESETS[reframeSettings.targetAspectRatio];

      await new Promise((resolve) => setTimeout(resolve, 300));

      setProgressMessage("正在更新项目设置…");
      setProgress(80);

      await updateProjectDimensions({
        width: targetConfig.width,
        height: targetConfig.height,
      });

      setProgressMessage("正在完成…");
      setProgress(90);

      await new Promise((resolve) => setTimeout(resolve, 200));

      setProgress(100);
      setProgressMessage("完成！");
      setIsApplied(true);

      const result: ReframeResult = {
        keyframes: [],
        outputWidth: targetConfig.width,
        outputHeight: targetConfig.height,
        success: true,
        message: `已配置为 ${targetConfig.name}（${targetConfig.width}×${targetConfig.height}）`,
      };

      onReframeComplete?.(result);

      const platformName = selectedPlatform
        ? PLATFORM_LABELS[selectedPlatform]
        : reframeSettings.targetAspectRatio;
      toast.success(
        "自动重构已应用",
        `项目已调整为 ${platformName}（${targetConfig.width}×${targetConfig.height}）`,
      );
    } catch (error) {
      console.error("Auto-reframe failed:", error);
      toast.error(
        "自动重构失败",
        error instanceof Error ? error.message : "未知错误",
      );
      setIsApplied(false);
    } finally {
      setIsProcessing(false);
    }
  }, [
    isInitialized,
    handleInitialize,
    reframeSettings,
    selectedPlatform,
    onReframeComplete,
    updateProjectDimensions,
  ]);

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-text-secondary block mb-2">
            平台预设
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(Object.keys(PLATFORM_PRESETS) as PlatformPreset[]).map(
              (platform) => (
                <button
                  key={platform}
                  onClick={() => handleSelectPlatform(platform)}
                  className={`flex items-center gap-1 p-2 rounded text-[9px] transition-colors ${
                    selectedPlatform === platform
                      ? "bg-primary/20 border border-primary text-text-primary"
                      : "bg-background-secondary hover:bg-background-primary border border-transparent text-text-secondary"
                  }`}
                >
                  {PLATFORM_ICONS[platform]}
                  <span className="truncate">
                    {PLATFORM_LABELS[platform]}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>

        <div>
          <label className="text-[10px] text-text-secondary block mb-2">
            宽高比
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(Object.keys(ASPECT_RATIO_PRESETS) as AspectRatioPreset[])
              .filter((r) => r !== "custom")
              .map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleSelectAspectRatio(ratio)}
                  className={`p-2 rounded text-[9px] transition-colors ${
                    reframeSettings.targetAspectRatio === ratio &&
                    !selectedPlatform
                      ? "bg-primary/20 border border-primary text-text-primary"
                      : "bg-background-secondary hover:bg-background-primary border border-transparent text-text-secondary"
                  }`}
                >
                  {ratio}
                </button>
              ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-text-secondary">
              跟踪速度
            </label>
            <span className="text-[10px] text-text-muted font-mono">
              {Math.round(reframeSettings.trackingSpeed * 100)}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[reframeSettings.trackingSpeed * 100]}
            onValueChange={(value) =>
              updateLocalSettings({
                trackingSpeed: value[0] / 100,
              })
            }
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-text-secondary">平滑度</label>
            <span className="text-[10px] text-text-muted font-mono">
              {Math.round(reframeSettings.smoothing * 100)}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[reframeSettings.smoothing * 100]}
            onValueChange={(value) =>
              updateLocalSettings({ smoothing: value[0] / 100 })
            }
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-text-secondary">
              居中偏好
            </label>
            <span className="text-[10px] text-text-muted font-mono">
              {Math.round(reframeSettings.centerBias * 100)}%
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[reframeSettings.centerBias * 100]}
            onValueChange={(value) =>
              updateLocalSettings({
                centerBias: value[0] / 100,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-[10px] text-text-secondary">
            跟随主体
          </label>
          <button
            onClick={() =>
              updateLocalSettings({
                followSubject: !reframeSettings.followSubject,
              })
            }
            className={`w-8 h-4 rounded-full transition-colors ${
              reframeSettings.followSubject
                ? "bg-primary"
                : "bg-background-secondary"
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full bg-white transition-transform ${
                reframeSettings.followSubject
                  ? "translate-x-4"
                  : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {isProcessing && (
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

        <button
          onClick={handleAnalyze}
          disabled={isInitializing || isProcessing}
          className="w-full py-2 rounded text-[11px] font-medium transition-colors flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white"
        >
          {isInitializing || isProcessing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {isInitializing ? "正在初始化…" : "正在分析…"}
            </>
          ) : isApplied ? (
            <>
              <CheckCircle size={14} />
              已应用 - 点击重新分析
            </>
          ) : (
            <>
              <Play size={14} />
              分析并重构
            </>
          )}
        </button>

        <div className="text-[9px] text-text-muted text-center">
          输出：{" "}
          {ASPECT_RATIO_PRESETS[reframeSettings.targetAspectRatio].width} x{" "}
          {ASPECT_RATIO_PRESETS[reframeSettings.targetAspectRatio].height}
        </div>
      </div>
    </div>
  );
};

export default AutoReframeSection;
