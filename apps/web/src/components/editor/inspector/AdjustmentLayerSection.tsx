import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Palette,
  Droplet,
  Copy,
} from "lucide-react";
import { Slider } from "@openreel/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@openreel/ui/components/popover";
import { useEngineStore } from "../../../stores/engine-store";
import { useProjectStore } from "../../../stores/project-store";
import type { AdjustmentLayer, BlendMode, Effect } from "@openreel/core";

interface AdjustmentLayerSectionProps {
  clipId: string;
}

const EFFECT_PRESETS: Array<{
  id: string;
  name: string;
  effect: Omit<Effect, "id">;
}> = [
  {
    id: "brightness",
    name: "亮度",
    effect: { type: "brightness", params: { value: 0 }, enabled: true },
  },
  {
    id: "contrast",
    name: "对比度",
    effect: { type: "contrast", params: { value: 1 }, enabled: true },
  },
  {
    id: "saturation",
    name: "饱和度",
    effect: { type: "saturation", params: { value: 1 }, enabled: true },
  },
  {
    id: "exposure",
    name: "曝光",
    effect: { type: "exposure", params: { value: 0 }, enabled: true },
  },
  {
    id: "blur",
    name: "模糊",
    effect: { type: "blur", params: { radius: 0 }, enabled: true },
  },
  {
    id: "sharpen",
    name: "锐化",
    effect: { type: "sharpen", params: { amount: 0 }, enabled: true },
  },
  {
    id: "vignette",
    name: "暗角",
    effect: { type: "vignette", params: { intensity: 0 }, enabled: true },
  },
  {
    id: "tint",
    name: "色调",
    effect: {
      type: "tint",
      params: { color: "#ffffff", strength: 0 },
      enabled: true,
    },
  },
];

const BLEND_MODES: Array<{ id: BlendMode; name: string; group: string }> = [
  { id: "normal", name: "正常", group: "Basic" },
  { id: "multiply", name: "正片叠底", group: "Darken" },
  { id: "screen", name: "滤色", group: "Lighten" },
  { id: "overlay", name: "叠加", group: "Contrast" },
  { id: "darken", name: "变暗", group: "Darken" },
  { id: "lighten", name: "变亮", group: "Lighten" },
  { id: "color-dodge", name: "颜色减淡", group: "Lighten" },
  { id: "color-burn", name: "颜色加深", group: "Darken" },
  { id: "hard-light", name: "强光", group: "Contrast" },
  { id: "soft-light", name: "柔光", group: "Contrast" },
  { id: "difference", name: "差值", group: "Inversion" },
  { id: "exclusion", name: "排除", group: "Inversion" },
  { id: "hue", name: "色相", group: "Component" },
  { id: "saturation", name: "饱和度", group: "Component" },
  { id: "color", name: "颜色", group: "Component" },
  { id: "luminosity", name: "明度", group: "Component" },
];

const EFFECT_TYPE_LABELS: Record<string, string> = {
  brightness: "亮度",
  contrast: "对比度",
  saturation: "饱和度",
  exposure: "曝光",
  blur: "模糊",
  sharpen: "锐化",
  vignette: "暗角",
  tint: "色调",
};

export const AdjustmentLayerSection: React.FC<AdjustmentLayerSectionProps> = ({
  clipId,
}) => {
  const getAdjustmentLayerEngine = useEngineStore(
    (state) => state.getAdjustmentLayerEngine,
  );
  const project = useProjectStore((state) => state.project);

  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [showBlendModes, setShowBlendModes] = useState(false);
  const [adjustmentLayerEngine, setAdjustmentLayerEngine] =
    useState<import("@openreel/core").AdjustmentLayerEngine | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadEngine = async () => {
      const engine = await getAdjustmentLayerEngine();
      if (!cancelled) {
        setAdjustmentLayerEngine(engine);
      }
    };
    loadEngine();
    return () => {
      cancelled = true;
    };
  }, [getAdjustmentLayerEngine]);

  const currentTrack = useMemo(() => {
    for (const track of project.timeline.tracks) {
      for (const clip of track.clips) {
        if (clip.id === clipId) {
          return track;
        }
      }
    }
    return null;
  }, [project.timeline.tracks, clipId]);

  const allLayers = useMemo(() => {
    return adjustmentLayerEngine?.getAllLayers() || [];
  }, [adjustmentLayerEngine, project.modifiedAt]);

  const trackLayers = useMemo(() => {
    if (!currentTrack) return [];
    return adjustmentLayerEngine?.getLayersForTrack(currentTrack.id) || [];
  }, [adjustmentLayerEngine, currentTrack, project.modifiedAt]);

  const handleCreateLayer = useCallback(() => {
    if (!adjustmentLayerEngine || !currentTrack) return;

    const currentClip = currentTrack.clips.find((c) => c.id === clipId);
    const startTime = currentClip?.startTime || 0;
    const duration = currentClip?.duration || 5;

    const layer = adjustmentLayerEngine.createAdjustmentLayer(
      currentTrack.id,
      startTime,
      { duration, name: `调整 ${allLayers.length + 1}` },
    );

    setExpandedLayer(layer.id);

    useProjectStore.setState((state) => ({
      project: { ...state.project, modifiedAt: Date.now() },
    }));
  }, [adjustmentLayerEngine, currentTrack, clipId, allLayers.length]);

  const handleDeleteLayer = useCallback(
    (layerId: string) => {
      if (!adjustmentLayerEngine) return;

      adjustmentLayerEngine.deleteLayer(layerId);
      if (expandedLayer === layerId) {
        setExpandedLayer(null);
      }

      useProjectStore.setState((state) => ({
        project: { ...state.project, modifiedAt: Date.now() },
      }));
    },
    [adjustmentLayerEngine, expandedLayer],
  );

  const handleToggleEnabled = useCallback(
    (layerId: string, enabled: boolean) => {
      if (!adjustmentLayerEngine) return;

      adjustmentLayerEngine.setEnabled(layerId, enabled);

      useProjectStore.setState((state) => ({
        project: { ...state.project, modifiedAt: Date.now() },
      }));
    },
    [adjustmentLayerEngine],
  );

  const handleOpacityChange = useCallback(
    (layerId: string, opacity: number) => {
      if (!adjustmentLayerEngine) return;

      adjustmentLayerEngine.setOpacity(layerId, opacity);

      useProjectStore.setState((state) => ({
        project: { ...state.project, modifiedAt: Date.now() },
      }));
    },
    [adjustmentLayerEngine],
  );

  const handleBlendModeChange = useCallback(
    (layerId: string, blendMode: BlendMode) => {
      if (!adjustmentLayerEngine) return;

      adjustmentLayerEngine.setBlendMode(layerId, blendMode);
      setShowBlendModes(false);

      useProjectStore.setState((state) => ({
        project: { ...state.project, modifiedAt: Date.now() },
      }));
    },
    [adjustmentLayerEngine],
  );

  const handleAddEffect = useCallback(
    (layerId: string, effectType: string) => {
      if (!adjustmentLayerEngine) return;

      const preset = EFFECT_PRESETS.find((p) => p.id === effectType);
      if (!preset) return;

      adjustmentLayerEngine.addEffect(layerId, {
        id: `effect_${Date.now()}`,
        ...preset.effect,
      });

      useProjectStore.setState((state) => ({
        project: { ...state.project, modifiedAt: Date.now() },
      }));
    },
    [adjustmentLayerEngine],
  );

  const handleRemoveEffect = useCallback(
    (layerId: string, effectId: string) => {
      if (!adjustmentLayerEngine) return;

      adjustmentLayerEngine.removeEffect(layerId, effectId);

      useProjectStore.setState((state) => ({
        project: { ...state.project, modifiedAt: Date.now() },
      }));
    },
    [adjustmentLayerEngine],
  );

  const handleDuplicateLayer = useCallback(
    (layerId: string) => {
      if (!adjustmentLayerEngine) return;

      const duplicate = adjustmentLayerEngine.duplicateLayer(layerId);
      if (duplicate) {
        setExpandedLayer(duplicate.id);
      }

      useProjectStore.setState((state) => ({
        project: { ...state.project, modifiedAt: Date.now() },
      }));
    },
    [adjustmentLayerEngine],
  );

  const renderLayerItem = (layer: AdjustmentLayer) => {
    const isExpanded = expandedLayer === layer.id;

    return (
      <div
        key={layer.id}
        className="bg-background-tertiary rounded-lg overflow-hidden"
      >
        <div
          className="flex items-center gap-2 p-2 cursor-pointer hover:bg-background-secondary transition-colors"
          onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
        >
          <ChevronRight
            size={12}
            className={`text-text-muted transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
          <Layers size={12} className="text-indigo-400" />
          <span className="flex-1 text-[10px] text-text-primary truncate">
            {layer.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleEnabled(layer.id, !layer.enabled);
            }}
            className={`p-1 rounded transition-colors ${
              layer.enabled ? "text-text-primary" : "text-text-muted opacity-50"
            }`}
          >
            {layer.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>

        {isExpanded && (
          <div className="px-2 pb-2 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-text-secondary">
                  不透明度
                </label>
                <span className="text-[10px] font-mono text-text-primary">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[layer.opacity * 100]}
                onValueChange={(value) =>
                  handleOpacityChange(layer.id, value[0] / 100)
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-text-secondary flex items-center gap-1">
                <Palette size={10} />
                混合模式
              </label>
              <Popover open={showBlendModes} onOpenChange={setShowBlendModes}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-2 bg-background-secondary rounded text-[10px] text-text-primary hover:bg-background-tertiary transition-colors"
                  >
                    <span>
                      {BLEND_MODES.find((m) => m.id === layer.blendMode)?.name ||
                        "正常"}
                    </span>
                    <ChevronDown size={10} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={4}
                  className="w-[var(--radix-popover-trigger-width)] min-w-[180px] p-0 bg-background-secondary border-border max-h-48 overflow-y-auto"
                >
                  {BLEND_MODES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handleBlendModeChange(layer.id, mode.id)}
                      className={`w-full text-left px-3 py-1.5 text-[10px] hover:bg-background-tertiary transition-colors ${
                        layer.blendMode === mode.id
                          ? "text-indigo-400 bg-indigo-500/10"
                          : "text-text-secondary"
                      }`}
                    >
                      {mode.name}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-text-secondary flex items-center gap-1">
                <Droplet size={10} />
                效果 ({layer.effects.length})
              </label>
              {layer.effects.length > 0 && (
                <div className="space-y-1">
                  {layer.effects.map((effect) => (
                    <div
                      key={effect.id}
                      className="flex items-center justify-between p-1.5 bg-background-secondary rounded"
                    >
                      <span className="text-[9px] text-text-primary">
                        {EFFECT_TYPE_LABELS[effect.type] ?? effect.type}
                      </span>
                      <button
                        onClick={() => handleRemoveEffect(layer.id, effect.id)}
                        className="p-0.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-1">
                {EFFECT_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleAddEffect(layer.id, preset.id)}
                    className="p-1.5 text-[9px] text-text-secondary bg-background-secondary rounded hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
                  >
                    + {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1 pt-2 border-t border-border">
              <button
                onClick={() => handleDuplicateLayer(layer.id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-background-secondary rounded text-[10px] text-text-secondary hover:text-text-primary transition-colors"
              >
                <Copy size={10} />
                复制
              </button>
              <button
                onClick={() => handleDeleteLayer(layer.id)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500/10 rounded text-[10px] text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={10} />
                删除
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 rounded-lg border border-indigo-500/30">
        <Layers size={16} className="text-indigo-400" />
        <div className="flex-1">
          <span className="text-[11px] font-medium text-text-primary">
            调整图层
          </span>
          <p className="text-[9px] text-text-muted">
            对下方片段施加非破坏性效果
          </p>
        </div>
      </div>

      <button
        onClick={handleCreateLayer}
        disabled={!currentTrack}
        className={`w-full py-2.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-2 transition-colors ${
          currentTrack
            ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30"
            : "bg-background-tertiary text-text-muted cursor-not-allowed"
        }`}
      >
        <Plus size={14} />
        添加调整图层
      </button>

      {trackLayers.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-medium text-text-secondary">
            本轨道图层 ({trackLayers.length})
          </span>
          <div className="space-y-1.5">{trackLayers.map(renderLayerItem)}</div>
        </div>
      )}

      {allLayers.length > trackLayers.length && (
        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-[10px] font-medium text-text-secondary">
            其他图层
          </span>
          <div className="space-y-1.5">
            {allLayers
              .filter((l) => !trackLayers.some((tl) => tl.id === l.id))
              .map(renderLayerItem)}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <p className="text-[9px] text-text-muted text-center">
          对下方所有片段应用调色与效果
        </p>
      </div>
    </div>
  );
};

export default AdjustmentLayerSection;
