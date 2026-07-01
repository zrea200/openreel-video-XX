import React, { useCallback, useMemo } from "react";
import { useProjectStore } from "../../../stores/project-store";
import {
  getAvailableBlendModes,
  getBlendModeName,
  type BlendMode,
} from "@openreel/core";
import {
  LabeledSlider as Slider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@openreel/ui";

interface BlendingSectionProps {
  clipId: string;
}

export const BlendingSection: React.FC<BlendingSectionProps> = ({ clipId }) => {
  const {
    getClip,
    getTextClip,
    getShapeClip,
    getSVGClip,
    getStickerClip,
    updateClipBlendMode,
    updateClipBlendOpacity,
    project,
  } = useProjectStore();

  const clip = useMemo(() => {
    const regularClip = getClip(clipId);
    if (regularClip) return regularClip;
    const textClip = getTextClip(clipId);
    if (textClip) return textClip;
    const shapeClip = getShapeClip(clipId);
    if (shapeClip) return shapeClip;
    const svgClip = getSVGClip(clipId);
    if (svgClip) return svgClip;
    const stickerClip = getStickerClip(clipId);
    if (stickerClip) return stickerClip;
    return null;
  }, [
    clipId,
    getClip,
    getTextClip,
    getShapeClip,
    getSVGClip,
    getStickerClip,
    project.modifiedAt,
  ]);

  const blendMode = clip?.blendMode || "normal";
  const blendOpacity = clip?.blendOpacity ?? 100;

  const availableBlendModes = useMemo(() => getAvailableBlendModes(), []);

  const handleBlendModeChange = useCallback(
    (mode: BlendMode) => {
      updateClipBlendMode(clipId, mode);
    },
    [clipId, updateClipBlendMode],
  );

  const handleOpacityChange = useCallback(
    (opacity: number) => {
      updateClipBlendOpacity(clipId, opacity);
    },
    [clipId, updateClipBlendOpacity],
  );

  if (!clip) {
    return (
      <div className="text-center py-8 text-text-muted text-xs">
        未选中片段
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
          <span className="text-[10px] text-text-secondary">混合模式</span>
          <Select
            value={blendMode}
            onValueChange={(v) => handleBlendModeChange(v as BlendMode)}
          >
            <SelectTrigger className="w-full bg-background-tertiary border-border text-text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background-secondary border-border">
              {availableBlendModes.map((mode) => (
                <SelectItem key={mode} value={mode}>
                  {getBlendModeName(mode)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[9px] text-text-muted">
            {blendMode === "normal" && "默认混合，无特殊效果"}
            {blendMode === "multiply" && "通过相乘使画面变暗"}
            {blendMode === "screen" && "通过滤色使画面变亮"}
            {blendMode === "overlay" && "结合正片叠底与滤色"}
            {blendMode === "darken" && "保留较暗的像素"}
            {blendMode === "lighten" && "保留较亮的像素"}
            {blendMode === "color-dodge" && "提亮基色"}
            {blendMode === "color-burn" && "加深基色"}
            {blendMode === "hard-light" && "强对比效果"}
            {blendMode === "soft-light" && "柔和对比效果"}
            {blendMode === "difference" && "颜色相减"}
            {blendMode === "exclusion" && "类似差值但更柔和"}
          </p>
        </div>

        <Slider
          label="不透明度"
          value={blendOpacity}
          onChange={handleOpacityChange}
          min={0}
          max={100}
          step={1}
          unit="%"
        />

      {blendMode !== "normal" && (
        <div className="p-2 bg-primary/5 border border-primary/20 rounded-lg">
          <p className="text-[9px] text-text-muted">
            <span className="text-primary font-medium">提示：</span>
            混合模式影响本层与下方图层的合成方式，可尝试不同模式获得创意效果。
          </p>
        </div>
      )}
    </div>
  );
};
