import React, { useCallback } from "react";
import { Switch } from "@openreel/ui";
import { Label } from "@openreel/ui";
import { useSettingsStore, SERVICE_REGISTRY, type TtsProvider, type LlmProvider, type AggregatorProvider } from "../../../stores/settings-store";
import { useProjectStore } from "../../../stores/project-store";

const ASPECT_PRESETS: Array<{ label: string; width: number; height: number }> = [
  { label: "16:9 横屏 (1080p)", width: 1920, height: 1080 },
  { label: "9:16 竖屏 (TikTok/Reels)", width: 1080, height: 1920 },
  { label: "1:1 方形", width: 1080, height: 1080 },
  { label: "4:5 竖版", width: 1080, height: 1350 },
  { label: "4:3 标准", width: 1440, height: 1080 },
  { label: "21:9 电影宽屏", width: 2560, height: 1080 },
  { label: "4K 横屏", width: 3840, height: 2160 },
];

export const GeneralPanel: React.FC = () => {
  const {
    autoSave,
    autoSaveInterval,
    defaultTtsProvider,
    defaultLlmProvider,
    defaultAggregator,
    configuredServices,
    setAutoSave,
    setAutoSaveInterval,
    setDefaultTtsProvider,
    setDefaultLlmProvider,
    setDefaultAggregator,
  } = useSettingsStore();

  const projectWidth = useProjectStore((s) => s.project.settings.width);
  const projectHeight = useProjectStore((s) => s.project.settings.height);
  const updateProjectSettings = useProjectStore((s) => s.updateSettings);

  const [draftWidth, setDraftWidth] = React.useState(String(projectWidth));
  const [draftHeight, setDraftHeight] = React.useState(String(projectHeight));

  React.useEffect(() => {
    setDraftWidth(String(projectWidth));
    setDraftHeight(String(projectHeight));
  }, [projectWidth, projectHeight]);

  const applyDimensions = useCallback(
    async (width: number, height: number) => {
      const w = Math.max(16, Math.min(7680, Math.round(width)));
      const h = Math.max(16, Math.min(7680, Math.round(height)));
      await updateProjectSettings({ width: w, height: h });
    },
    [updateProjectSettings],
  );

  const handleApplyCustom = useCallback(() => {
    const w = Number(draftWidth);
    const h = Number(draftHeight);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      applyDimensions(w, h);
    }
  }, [draftWidth, draftHeight, applyDimensions]);

  const ttsProviders = [
    { id: "piper", label: "Piper（免费 / 内置）" },
    ...SERVICE_REGISTRY.filter(
      (s) => s.id === "elevenlabs" || configuredServices.includes(s.id),
    ),
  ];

  const llmProviders = SERVICE_REGISTRY.filter(
    (s) =>
      s.id === "openai" ||
      s.id === "anthropic" ||
      configuredServices.includes(s.id),
  );

  const aggregatorProviders = SERVICE_REGISTRY.filter(
    (s) =>
      s.id === "kie-ai" ||
      s.id === "freepik" ||
      configuredServices.includes(s.id),
  );

  return (
    <div className="space-y-6 pb-4">
      {/* Project Composition */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-text-primary">
            项目画幅
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            设置项目画布尺寸。可选择 TikTok、Reels、YouTube 等预设，或输入自定义数值。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ASPECT_PRESETS.map((preset) => {
            const isActive =
              preset.width === projectWidth && preset.height === projectHeight;
            return (
              <button
                key={preset.label}
                onClick={() => applyDimensions(preset.width, preset.height)}
                className={`text-left px-3 py-2 rounded-md text-xs transition-colors border ${
                  isActive
                    ? "border-primary bg-primary/10 text-text-primary"
                    : "border-border bg-background-tertiary text-text-secondary hover:text-text-primary hover:border-primary/40"
                }`}
              >
                <div className="font-medium">{preset.label}</div>
                <div className="text-text-muted text-[10px] mt-0.5">
                  {preset.width} × {preset.height}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs text-text-secondary">宽度</Label>
            <input
              type="number"
              min={16}
              max={7680}
              value={draftWidth}
              onChange={(e) => setDraftWidth(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-text-secondary">高度</Label>
            <input
              type="number"
              min={16}
              max={7680}
              value={draftHeight}
              onChange={(e) => setDraftHeight(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            />
          </div>
          <button
            onClick={handleApplyCustom}
            className="h-9 px-3 rounded-md bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            应用
          </button>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Auto-save */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-text-primary">自动保存</h3>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm text-text-secondary">启用自动保存</Label>
            <p className="text-xs text-text-muted mt-0.5">
              按固定间隔自动保存项目
            </p>
          </div>
          <Switch checked={autoSave} onCheckedChange={setAutoSave} />
        </div>

        {autoSave && (
          <div className="flex items-center gap-3">
            <Label className="text-sm text-text-secondary whitespace-nowrap">
              每
            </Label>
            <select
              value={autoSaveInterval}
              onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value={1}>1 分钟</option>
              <option value={2}>2 分钟</option>
              <option value={5}>5 分钟</option>
              <option value={10}>10 分钟</option>
              <option value={15}>15 分钟</option>
              <option value={30}>30 分钟</option>
            </select>
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      {/* Default providers */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-text-primary">
          默认 AI 服务
        </h3>
        <p className="text-xs text-text-muted">
          选择 AI 功能的默认服务提供商。请先在「API 密钥」标签页中配置密钥。
        </p>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-text-secondary">
              文字转语音 / 变声 / 音效
            </Label>
            <select
              value={defaultTtsProvider}
              onChange={(e) => setDefaultTtsProvider(e.target.value as TtsProvider)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]"
            >
              {ttsProviders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-text-secondary">
              AI 助手 (LLM)
            </Label>
            <select
              value={defaultLlmProvider}
              onChange={(e) => setDefaultLlmProvider(e.target.value as LlmProvider)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]"
            >
              {llmProviders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm text-text-secondary">
                AI 聚合平台
              </Label>
              <p className="text-xs text-text-muted mt-0.5">
                视频/图像生成、超分及创意 AI 工具
              </p>
            </div>
            <select
              value={defaultAggregator}
              onChange={(e) => setDefaultAggregator(e.target.value as AggregatorProvider)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]"
            >
              {aggregatorProviders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
