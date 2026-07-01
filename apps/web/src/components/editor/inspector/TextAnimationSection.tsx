import React, { useCallback } from "react";
import { Type, Clock, Play } from "lucide-react";
import { useProjectStore } from "../../../stores/project-store";
import type { TextAnimationPreset, TextAnimationParams } from "@openreel/core";
import {
  LabeledSlider,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@openreel/ui";

interface PresetInfo {
  value: TextAnimationPreset;
  label: string;
  description: string;
}

const ANIMATION_PRESETS: PresetInfo[] = [
  { value: "none", label: "无", description: "无动画" },
  {
    value: "typewriter",
    label: "打字机",
    description: "逐字出现",
  },
  { value: "fade", label: "淡入淡出", description: "淡入并淡出" },
  {
    value: "slide-left",
    label: "左滑",
    description: "从右侧滑入",
  },
  {
    value: "slide-right",
    label: "右滑",
    description: "从左侧滑入",
  },
  {
    value: "slide-up",
    label: "上滑",
    description: "从下方滑入",
  },
  {
    value: "slide-down",
    label: "下滑",
    description: "从上方滑入",
  },
  { value: "scale", label: "缩放", description: "由小放大" },
  { value: "bounce", label: "弹跳", description: "弹跳式入场" },
  { value: "rotate", label: "旋转", description: "旋转进入画面" },
  { value: "wave", label: "波浪", description: "字符上下波浪" },
  { value: "shake", label: "抖动", description: "文字震动效果" },
  { value: "pop", label: "弹出", description: "带过冲的弹出入场" },
  { value: "glitch", label: "故障", description: "数字故障效果" },
  { value: "split", label: "分裂", description: "从中心向两侧展开" },
  { value: "flip", label: "翻转", description: "3D 翻转动画" },
  {
    value: "word-by-word",
    label: "逐词",
    description: "按词依次出现",
  },
  {
    value: "rainbow",
    label: "彩虹",
    description: "颜色在光谱中循环",
  },
];

const Slider = LabeledSlider;

const PresetSelector: React.FC<{
  value: TextAnimationPreset;
  onChange: (preset: TextAnimationPreset) => void;
}> = ({ value, onChange }) => (
  <div className="space-y-2">
    <span className="text-[10px] text-text-secondary">动画预设</span>
    <Select value={value} onValueChange={(v) => onChange(v as TextAnimationPreset)}>
      <SelectTrigger className="w-full bg-background-tertiary border-border text-text-primary">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-background-secondary border-border max-h-60">
        {ANIMATION_PRESETS.map((preset) => (
          <SelectItem key={preset.value} value={preset.value}>
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    <p className="text-[9px] text-text-muted">
      {ANIMATION_PRESETS.find((p) => p.value === value)?.description}
    </p>
  </div>
);

const EasingSelector: React.FC<{
  value: string;
  onChange: (easing: string) => void;
}> = ({ value, onChange }) => {
  const easingOptions = [
    { value: "linear", label: "线性" },
    { value: "ease-in", label: "缓入" },
    { value: "ease-out", label: "缓出" },
    { value: "ease-in-out", label: "缓入缓出" },
  ];

  return (
    <div className="space-y-1">
      <span className="text-[10px] text-text-secondary">缓动</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-background-tertiary border-border text-text-primary text-[10px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background-secondary border-border">
          {easingOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface TextAnimationSectionProps {
  clipId: string;
}

export const TextAnimationSection: React.FC<TextAnimationSectionProps> = ({
  clipId,
}) => {
  const getTextClip = useProjectStore((state) => state.getTextClip);
  const applyTextAnimationPreset = useProjectStore(
    (state) => state.applyTextAnimationPreset,
  );
  useProjectStore((state) => state.project);

  const textClip = getTextClip(clipId);

  const currentPreset: TextAnimationPreset =
    textClip?.animation?.preset || "none";
  const inDuration = textClip?.animation?.inDuration ?? 0.5;
  const outDuration = textClip?.animation?.outDuration ?? 0.5;
  const easing = textClip?.animation?.params?.easing ?? "ease-out";

  const handlePresetChange = useCallback(
    (preset: TextAnimationPreset) => {
      applyTextAnimationPreset(clipId, preset, inDuration, outDuration);
    },
    [clipId, applyTextAnimationPreset, inDuration, outDuration],
  );

  const handleInDurationChange = useCallback(
    (newInDuration: number) => {
      applyTextAnimationPreset(
        clipId,
        currentPreset,
        newInDuration,
        outDuration,
      );
    },
    [clipId, applyTextAnimationPreset, currentPreset, outDuration],
  );

  const handleOutDurationChange = useCallback(
    (newOutDuration: number) => {
      applyTextAnimationPreset(
        clipId,
        currentPreset,
        inDuration,
        newOutDuration,
      );
    },
    [clipId, applyTextAnimationPreset, currentPreset, inDuration],
  );

  const handleEasingChange = useCallback(
    (newEasing: string) => {
      applyTextAnimationPreset(clipId, currentPreset, inDuration, outDuration, {
        easing: newEasing as TextAnimationParams["easing"],
      });
    },
    [clipId, applyTextAnimationPreset, currentPreset, inDuration, outDuration],
  );

  if (!textClip) {
    return (
      <div className="p-4 text-center">
        <Type size={24} className="mx-auto mb-2 text-text-muted" />
        <p className="text-[10px] text-text-muted">未选中文字片段</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PresetSelector value={currentPreset} onChange={handlePresetChange} />

      {currentPreset !== "none" && (
        <>
          <div className="space-y-3 p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} className="text-text-muted" />
              <span className="text-[10px] text-text-secondary font-medium">
                时间
              </span>
            </div>

            <Slider
              label="入点时长"
              value={inDuration}
              onChange={handleInDurationChange}
              min={0}
              max={5}
              step={0.1}
              unit="s"
            />

            <Slider
              label="出点时长"
              value={outDuration}
              onChange={handleOutDurationChange}
              min={0}
              max={5}
              step={0.1}
              unit="s"
            />
          </div>

          <div className="p-3 bg-background-tertiary rounded-lg">
            <EasingSelector value={easing} onChange={handleEasingChange} />
          </div>

          <div className="p-3 bg-background-secondary rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Play size={12} className="text-text-muted" />
              <span className="text-[10px] text-text-secondary font-medium">
                预览
              </span>
            </div>
            <p className="text-[9px] text-text-muted">
              动画在预览和导出时播放。总动画时长：
              {(inDuration + outDuration).toFixed(1)}s
            </p>
          </div>
        </>
      )}

      {currentPreset === "fade" && (
        <FadeParams clipId={clipId} animation={textClip.animation} />
      )}

      {(currentPreset === "slide-left" ||
        currentPreset === "slide-right" ||
        currentPreset === "slide-up" ||
        currentPreset === "slide-down") && (
        <SlideParams clipId={clipId} animation={textClip.animation} />
      )}

      {currentPreset === "scale" && (
        <ScaleParams clipId={clipId} animation={textClip.animation} />
      )}

      {currentPreset === "bounce" && (
        <BounceParams clipId={clipId} animation={textClip.animation} />
      )}

      {currentPreset === "rotate" && (
        <RotateParams clipId={clipId} animation={textClip.animation} />
      )}

      {currentPreset === "wave" && (
        <WaveParams clipId={clipId} animation={textClip.animation} />
      )}

      {currentPreset === "shake" && (
        <ShakeParams clipId={clipId} animation={textClip.animation} />
      )}

      {currentPreset === "pop" && (
        <PopParams clipId={clipId} animation={textClip.animation} />
      )}

      {currentPreset === "glitch" && (
        <GlitchParams clipId={clipId} animation={textClip.animation} />
      )}
    </div>
  );
};

const FadeParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const startOpacity = animation?.params?.fadeOpacity?.start ?? 0;
  const endOpacity = animation?.params?.fadeOpacity?.end ?? 1;

  const handleChange = (start: number, end: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      "fade",
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { fadeOpacity: { start, end } },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        淡入淡出设置
      </span>
      <Slider
        label="起始不透明度"
        value={startOpacity}
        onChange={(v) => handleChange(v, endOpacity)}
        min={0}
        max={1}
        step={0.1}
        unit=""
      />
      <Slider
        label="结束不透明度"
        value={endOpacity}
        onChange={(v) => handleChange(startOpacity, v)}
        min={0}
        max={1}
        step={0.1}
        unit=""
      />
    </div>
  );
};

const SlideParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams; preset?: TextAnimationPreset };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const slideDistance = animation?.params?.slideDistance ?? 0.2;

  const handleChange = (distance: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      textClip.animation.preset,
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { slideDistance: distance },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        滑动设置
      </span>
      <Slider
        label="距离"
        value={slideDistance}
        onChange={handleChange}
        min={0.05}
        max={1}
        step={0.05}
        unit=""
      />
    </div>
  );
};

const ScaleParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const scaleFrom = animation?.params?.scaleFrom ?? 0;
  const scaleTo = animation?.params?.scaleTo ?? 1;

  const handleChange = (from: number, to: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      "scale",
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { scaleFrom: from, scaleTo: to },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        缩放设置
      </span>
      <Slider
        label="起始缩放"
        value={scaleFrom}
        onChange={(v) => handleChange(v, scaleTo)}
        min={0}
        max={2}
        step={0.1}
        unit="x"
      />
      <Slider
        label="结束缩放"
        value={scaleTo}
        onChange={(v) => handleChange(scaleFrom, v)}
        min={0}
        max={2}
        step={0.1}
        unit="x"
      />
    </div>
  );
};

const BounceParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const bounceHeight = animation?.params?.bounceHeight ?? 0.1;
  const bounceCount = animation?.params?.bounceCount ?? 3;

  const handleChange = (height: number, count: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      "bounce",
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { bounceHeight: height, bounceCount: count },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        弹跳设置
      </span>
      <Slider
        label="高度"
        value={bounceHeight}
        onChange={(v) => handleChange(v, bounceCount)}
        min={0.01}
        max={0.5}
        step={0.01}
        unit=""
      />
      <Slider
        label="弹跳次数"
        value={bounceCount}
        onChange={(v) => handleChange(bounceHeight, Math.round(v))}
        min={1}
        max={10}
        step={1}
        unit=""
      />
    </div>
  );
};

const RotateParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const rotateAngle = animation?.params?.rotateAngle ?? 360;

  const handleChange = (angle: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      "rotate",
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { rotateAngle: angle },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        旋转设置
      </span>
      <Slider
        label="角度"
        value={rotateAngle}
        onChange={handleChange}
        min={-720}
        max={720}
        step={15}
        unit="°"
      />
    </div>
  );
};

const WaveParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const waveAmplitude = animation?.params?.waveAmplitude ?? 0.02;
  const waveFrequency = animation?.params?.waveFrequency ?? 2;

  const handleChange = (amplitude: number, frequency: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      "wave",
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { waveAmplitude: amplitude, waveFrequency: frequency },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        波浪设置
      </span>
      <Slider
        label="振幅"
        value={waveAmplitude}
        onChange={(v) => handleChange(v, waveFrequency)}
        min={0.005}
        max={0.1}
        step={0.005}
        unit=""
      />
      <Slider
        label="频率"
        value={waveFrequency}
        onChange={(v) => handleChange(waveAmplitude, v)}
        min={0.5}
        max={5}
        step={0.5}
        unit=""
      />
    </div>
  );
};

const ShakeParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const shakeIntensity = animation?.params?.shakeIntensity ?? 0.01;
  const shakeSpeed = animation?.params?.shakeSpeed ?? 20;

  const handleChange = (intensity: number, speed: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      "shake",
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { shakeIntensity: intensity, shakeSpeed: speed },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        抖动设置
      </span>
      <Slider
        label="强度"
        value={shakeIntensity}
        onChange={(v) => handleChange(v, shakeSpeed)}
        min={0.001}
        max={0.05}
        step={0.001}
        unit=""
      />
      <Slider
        label="速度"
        value={shakeSpeed}
        onChange={(v) => handleChange(shakeIntensity, v)}
        min={5}
        max={50}
        step={5}
        unit=""
      />
    </div>
  );
};

const PopParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const popOvershoot = animation?.params?.popOvershoot ?? 1.2;

  const handleChange = (overshoot: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      "pop",
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { popOvershoot: overshoot },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        弹出设置
      </span>
      <Slider
        label="过冲量"
        value={popOvershoot}
        onChange={handleChange}
        min={1}
        max={2}
        step={0.05}
        unit="x"
      />
    </div>
  );
};

const GlitchParams: React.FC<{
  clipId: string;
  animation?: { params?: TextAnimationParams };
}> = ({ clipId, animation }) => {
  const { applyTextAnimationPreset, getTextClip } = useProjectStore();
  const textClip = getTextClip(clipId);

  const glitchIntensity = animation?.params?.glitchIntensity ?? 0.02;
  const glitchSpeed = animation?.params?.glitchSpeed ?? 10;

  const handleChange = (intensity: number, speed: number) => {
    if (!textClip?.animation) return;
    applyTextAnimationPreset(
      clipId,
      "glitch",
      textClip.animation.inDuration,
      textClip.animation.outDuration,
      { glitchIntensity: intensity, glitchSpeed: speed },
    );
  };

  return (
    <div className="space-y-2 p-3 bg-background-tertiary rounded-lg">
      <span className="text-[10px] text-text-secondary font-medium">
        故障设置
      </span>
      <Slider
        label="强度"
        value={glitchIntensity}
        onChange={(v) => handleChange(v, glitchSpeed)}
        min={0.005}
        max={0.1}
        step={0.005}
        unit=""
      />
      <Slider
        label="速度"
        value={glitchSpeed}
        onChange={(v) => handleChange(glitchIntensity, v)}
        min={1}
        max={30}
        step={1}
        unit=""
      />
    </div>
  );
};

export default TextAnimationSection;
