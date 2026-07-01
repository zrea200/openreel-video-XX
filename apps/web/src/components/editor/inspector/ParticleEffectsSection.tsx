import React, { useState, useCallback, useRef } from "react";
import {
  PARTICLE_PRESETS,
  type ParticlePreset,
  type ParticleEffect,
  type ParticleConfig,
  createEffectFromPreset,
} from "@openreel/core";
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Play,
} from "lucide-react";
import {
  Button,
  Slider,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  ScrollArea,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@openreel/ui";

interface ParticleEffectsSectionProps {
  clipId: string;
  clipDuration: number;
  clipStartTime: number;
  effects: ParticleEffect[];
  onAddEffect: (effect: ParticleEffect) => void;
  onUpdateEffect: (effectId: string, config: Partial<ParticleConfig>) => void;
  onRemoveEffect: (effectId: string) => void;
  onToggleEffect: (effectId: string, enabled: boolean) => void;
  onUpdateTiming: (effectId: string, startTime: number, duration: number) => void;
  onPreviewEffect?: (effectId: string) => void;
}

const PARTICLE_TYPE_LABELS: Record<string, string> = {
  ambient: "环境",
  weather: "天气",
  celebration: "庆祝",
  fire: "火焰",
  magic: "魔法",
  nature: "自然",
};

const EFFECT_TYPE_LABELS: Record<string, string> = {
  snow: "雪花",
  rain: "雨",
  confetti: "彩纸",
  sparkles: "闪光",
  smoke: "烟雾",
  fire: "火焰",
  bubbles: "气泡",
  dust: "灰尘",
  stars: "星星",
};

const BLEND_MODE_LABELS: Record<string, string> = {
  normal: "正常",
  add: "相加",
  multiply: "正片叠底",
  screen: "滤色",
};

export const ParticleEffectsSection: React.FC<ParticleEffectsSectionProps> = ({
  clipId,
  clipDuration,
  clipStartTime,
  effects,
  onAddEffect,
  onUpdateEffect,
  onRemoveEffect,
  onToggleEffect,
  onUpdateTiming,
  onPreviewEffect,
}) => {
  const [expandedEffects, setExpandedEffects] = useState<Set<string>>(new Set());
  const [selectedPreset, setSelectedPreset] = useState<string>("");

  const toggleExpanded = useCallback((effectId: string) => {
    setExpandedEffects((prev) => {
      const next = new Set(prev);
      if (next.has(effectId)) {
        next.delete(effectId);
      } else {
        next.add(effectId);
      }
      return next;
    });
  }, []);

  const handleAddEffect = useCallback(() => {
    if (!selectedPreset) return;

    const effectId = `particle-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const effect = createEffectFromPreset(selectedPreset, effectId, clipId, clipStartTime, clipDuration);

    if (effect) {
      onAddEffect(effect);
      setExpandedEffects((prev) => new Set(prev).add(effectId));
    }
  }, [selectedPreset, clipId, clipStartTime, clipDuration, onAddEffect]);

  const handleConfigChange = useCallback(
    (effectId: string, key: keyof ParticleConfig, value: unknown) => {
      onUpdateEffect(effectId, { [key]: value });
    },
    [onUpdateEffect]
  );

  const handleStartTimeChange = useCallback(
    (effectId: string, effect: ParticleEffect, newRelativeStartTime: number) => {
      const absoluteStartTime = clipStartTime + newRelativeStartTime;
      onUpdateTiming(effectId, absoluteStartTime, effect.duration);
    },
    [clipStartTime, onUpdateTiming]
  );

  const handleDurationChange = useCallback(
    (effectId: string, effect: ParticleEffect, newDuration: number) => {
      onUpdateTiming(effectId, effect.startTime, newDuration);
    },
    [onUpdateTiming]
  );

  const groupedPresets = PARTICLE_PRESETS.reduce(
    (acc, preset) => {
      if (!acc[preset.type]) {
        acc[preset.type] = [];
      }
      acc[preset.type].push(preset);
      return acc;
    },
    {} as Record<string, ParticlePreset[]>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedPreset} onValueChange={setSelectedPreset}>
          <SelectTrigger className="flex-1 h-8 text-xs min-w-0 [&>span]:truncate">
            <SelectValue placeholder="选择效果预设…" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(groupedPresets).map(([type, presets]) => (
              <div key={type}>
                <div className="px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {PARTICLE_TYPE_LABELS[type] ?? type}
                </div>
                {presets.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id} textValue={preset.name}>
                    {preset.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="default"
          size="sm"
          onClick={handleAddEffect}
          disabled={!selectedPreset}
          className="h-8 px-3"
        >
          <Plus size={14} className="mr-1" />
          添加
        </Button>
      </div>

      {effects.length === 0 ? (
        <div className="text-center py-6 text-text-muted text-xs">
          <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
          <p>尚未添加粒子效果</p>
          <p className="mt-1 text-[10px]">在上方选择预设以添加效果</p>
        </div>
      ) : (
        <ScrollArea className="max-h-[400px]">
          <div className="space-y-2 pr-2">
            {effects.map((effect) => {
              const relativeStartTime = effect.startTime - clipStartTime;
              return (
                <div
                  key={effect.id}
                  className="bg-background-tertiary rounded-lg border border-border overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      onClick={() => toggleExpanded(effect.id)}
                      className="p-0.5 rounded hover:bg-background-elevated text-text-muted"
                    >
                      {expandedEffects.has(effect.id) ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                    </button>

                    <span className="flex-1 text-xs font-medium text-text-primary">
                      {EFFECT_TYPE_LABELS[effect.type] ?? effect.type}
                    </span>

                    {onPreviewEffect && (
                      <button
                        onClick={() => onPreviewEffect(effect.id)}
                        className="p-1 rounded hover:bg-background-elevated text-text-muted hover:text-primary transition-colors"
                        title="预览效果"
                      >
                        <Play size={12} />
                      </button>
                    )}

                    <button
                      onClick={() => onToggleEffect(effect.id, !effect.enabled)}
                      className={`p-1 rounded transition-colors ${
                        effect.enabled
                          ? "text-primary hover:bg-primary/20"
                          : "text-text-muted hover:bg-background-elevated"
                      }`}
                      title={effect.enabled ? "禁用" : "启用"}
                    >
                      {effect.enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>

                    <button
                      onClick={() => onRemoveEffect(effect.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
                      title="移除效果"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {expandedEffects.has(effect.id) && (
                    <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-[10px] text-text-muted mb-1">
                            开始时间 (s)
                          </Label>
                          <Input
                            type="number"
                            value={relativeStartTime.toFixed(1)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0 && val < clipDuration) {
                                handleStartTimeChange(effect.id, effect, val);
                              }
                            }}
                            className="h-7 text-xs"
                            step={0.1}
                            min={0}
                            max={clipDuration}
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-text-muted mb-1">
                            时长 (s)
                          </Label>
                          <Input
                            type="number"
                            value={effect.duration.toFixed(1)}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val >= 0.1) {
                                handleDurationChange(effect.id, effect, val);
                              }
                            }}
                            className="h-7 text-xs"
                            step={0.1}
                            min={0.1}
                          />
                        </div>
                      </div>

                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary">
                          <ChevronRight size={10} className="transition-transform data-[state=open]:rotate-90" />
                          粒子设置
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 space-y-3">
                          <div>
                            <Label className="text-[10px] text-text-muted mb-1">
                              粒子数量：{effect.config.particleCount}
                            </Label>
                            <Slider
                              value={[effect.config.particleCount]}
                              onValueChange={([v]) =>
                                handleConfigChange(effect.id, "particleCount", v)
                              }
                              min={10}
                              max={500}
                              step={10}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] text-text-muted mb-1">
                              速度：{effect.config.speed}
                            </Label>
                            <Slider
                              value={[effect.config.speed]}
                              onValueChange={([v]) =>
                                handleConfigChange(effect.id, "speed", v)
                              }
                              min={10}
                              max={500}
                              step={10}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] text-text-muted mb-1">
                              重力：{effect.config.gravity}
                            </Label>
                            <Slider
                              value={[effect.config.gravity]}
                              onValueChange={([v]) =>
                                handleConfigChange(effect.id, "gravity", v)
                              }
                              min={-500}
                              max={500}
                              step={10}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] text-text-muted mb-1">
                              发射率：{effect.config.emissionRate}
                            </Label>
                            <Slider
                              value={[effect.config.emissionRate]}
                              onValueChange={([v]) =>
                                handleConfigChange(effect.id, "emissionRate", v)
                              }
                              min={1}
                              max={200}
                              step={1}
                              className="w-full"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-[10px] text-text-muted mb-1">
                                最小尺寸：{effect.config.size.min}
                              </Label>
                              <Slider
                                value={[effect.config.size.min]}
                                onValueChange={([v]) =>
                                  handleConfigChange(effect.id, "size", {
                                    ...effect.config.size,
                                    min: v,
                                  })
                                }
                                min={1}
                                max={20}
                                step={1}
                                className="w-full"
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-text-muted mb-1">
                                最大尺寸：{effect.config.size.max}
                              </Label>
                              <Slider
                                value={[effect.config.size.max]}
                                onValueChange={([v]) =>
                                  handleConfigChange(effect.id, "size", {
                                    ...effect.config.size,
                                    max: v,
                                  })
                                }
                                min={1}
                                max={30}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-[10px] text-text-muted mb-1">
                              湍流：{effect.config.turbulence}
                            </Label>
                            <Slider
                              value={[effect.config.turbulence]}
                              onValueChange={([v]) =>
                                handleConfigChange(effect.id, "turbulence", v)
                              }
                              min={0}
                              max={100}
                              step={5}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <Label className="text-[10px] text-text-muted mb-1">
                              混合模式
                            </Label>
                            <Select
                              value={effect.config.blendMode}
                              onValueChange={(v) =>
                                handleConfigChange(effect.id, "blendMode", v)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">{BLEND_MODE_LABELS.normal}</SelectItem>
                                <SelectItem value="add">{BLEND_MODE_LABELS.add}</SelectItem>
                                <SelectItem value="multiply">{BLEND_MODE_LABELS.multiply}</SelectItem>
                                <SelectItem value="screen">{BLEND_MODE_LABELS.screen}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center gap-1 text-[10px] text-text-muted hover:text-text-primary">
                          <ChevronRight size={10} className="transition-transform data-[state=open]:rotate-90" />
                          颜色 ({effect.config.colors.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <div className="flex flex-wrap gap-1">
                            {effect.config.colors.map((color, idx) => (
                              <ColorSwatch
                                key={idx}
                                color={color}
                                onChange={(newColor) => {
                                  const newColors = [...effect.config.colors];
                                  newColors[idx] = newColor;
                                  handleConfigChange(effect.id, "colors", newColors);
                                }}
                                onRemove={
                                  effect.config.colors.length > 1
                                    ? () => {
                                        const newColors = effect.config.colors.filter((_, i) => i !== idx);
                                        handleConfigChange(effect.id, "colors", newColors);
                                      }
                                    : undefined
                                }
                              />
                            ))}
                            <button
                              onClick={() => {
                                const newColors = [...effect.config.colors, "#ffffff"];
                                handleConfigChange(effect.id, "colors", newColors);
                              }}
                              className="w-6 h-6 rounded border border-dashed border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-primary transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

interface ColorSwatchProps {
  color: string;
  onChange: (color: string) => void;
  onRemove?: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, onChange, onRemove }) => {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-6 h-6 rounded border border-border cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
          style={{ backgroundColor: color }}
        />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-auto p-2">
        <div className="space-y-2">
          <input
            ref={inputRef}
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-32 h-24 cursor-pointer border-0 p-0"
          />
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={color}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                  onChange(val);
                }
              }}
              className="h-7 text-xs font-mono flex-1"
              placeholder="#ffffff"
            />
            {onRemove && (
              <button
                onClick={() => {
                  onRemove();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded hover:bg-red-500/20 text-text-muted hover:text-red-400 transition-colors"
                title="移除颜色"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ParticleEffectsSection;
