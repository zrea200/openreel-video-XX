import React, { useCallback, useMemo } from "react";
import { RotateCcw, Target, Zap, Clock } from "lucide-react";
import { Slider } from "@openreel/ui";
import { useProjectStore } from "../../../stores/project-store";
import { useEngineStore } from "../../../stores/engine-store";
import type { EmphasisAnimation, EmphasisAnimationType } from "@openreel/core";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  return mins > 0 ? `${mins}:${secs.padStart(4, "0")}` : `${secs}s`;
};

interface EmphasisAnimationSectionProps {
  clipId: string;
}

const EMPHASIS_CATEGORY_LABELS: Record<string, string> = {
  Attention: "吸引注意",
  Movement: "位移",
  Rotation: "旋转",
  Distortion: "变形",
  "Zoom & Pan": "缩放与平移",
};

const EMPHASIS_ANIMATIONS: {
  category: string;
  animations: {
    type: EmphasisAnimationType;
    label: string;
    description: string;
  }[];
}[] = [
  {
    category: "Attention",
    animations: [
      {
        type: "pulse",
        label: "脉冲",
        description: "轻柔的缩放呼吸效果",
      },
      {
        type: "heartbeat",
        label: "心跳",
        description: "类似心跳的双拍脉冲",
      },
      { type: "flash", label: "闪烁", description: "不透明度脉冲效果" },
      { type: "glow", label: "发光", description: "缩放与不透明度脉冲" },
      {
        type: "breathe",
        label: "呼吸",
        description: "缓慢舒缓的缩放效果",
      },
    ],
  },
  {
    category: "Movement",
    animations: [
      {
        type: "shake",
        label: "抖动",
        description: "快速左右摇晃",
      },
      { type: "bounce", label: "弹跳", description: "上下弹跳" },
      { type: "float", label: "漂浮", description: "轻柔漂浮运动" },
      {
        type: "vibrate",
        label: "震动",
        description: "随机小幅位移",
      },
      { type: "wave", label: "波浪", description: "波浪式运动" },
    ],
  },
  {
    category: "Rotation",
    animations: [
      { type: "spin", label: "旋转", description: "持续旋转" },
      { type: "swing", label: "摇摆", description: "钟摆式旋转" },
      {
        type: "wobble",
        label: "晃动",
        description: "带旋转的摇摆",
      },
      { type: "tilt", label: "倾斜", description: "缓慢倾斜运动" },
      { type: "tada", label: "庆祝", description: "吸引注意的摆动" },
    ],
  },
  {
    category: "Distortion",
    animations: [
      {
        type: "jello",
        label: "果冻",
        description: "果冻般挤压效果",
      },
      {
        type: "rubber-band",
        label: "橡皮筋",
        description: "弹性拉伸效果",
      },
      {
        type: "flicker",
        label: "频闪",
        description: "随机可见性闪烁",
      },
    ],
  },
  {
    category: "Zoom & Pan",
    animations: [
      {
        type: "zoom-pulse",
        label: "缩放脉冲",
        description: "放大缩小循环",
      },
      {
        type: "focus-zoom",
        label: "焦点缩放",
        description: "缩放至焦点后恢复",
      },
      {
        type: "ken-burns",
        label: "肯·伯恩斯",
        description: "缓慢缩放并平移",
      },
      {
        type: "pan-left",
        label: "向左平移",
        description: "缓慢向左平移",
      },
      {
        type: "pan-right",
        label: "向右平移",
        description: "缓慢向右平移",
      },
      { type: "pan-up", label: "向上平移", description: "缓慢向上平移" },
      { type: "pan-down", label: "向下平移", description: "缓慢向下平移" },
    ],
  },
];

const DEFAULT_EMPHASIS: EmphasisAnimation = {
  type: "none",
  speed: 1,
  intensity: 1,
  loop: true,
};

export const EmphasisAnimationSection: React.FC<
  EmphasisAnimationSectionProps
> = ({ clipId }) => {
  const { project, updateClipEmphasisAnimation } = useProjectStore();
  const getTitleEngine = useEngineStore((state) => state.getTitleEngine);
  const getGraphicsEngine = useEngineStore((state) => state.getGraphicsEngine);

  const clipDuration = useMemo((): number => {
    const clip = project.timeline.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === clipId);
    if (clip) return clip.duration;

    const titleEngine = getTitleEngine();
    const textClip = titleEngine?.getTextClip(clipId);
    if (textClip) return textClip.duration;

    const graphicsEngine = getGraphicsEngine();
    const shapeClip = graphicsEngine?.getShapeClip(clipId);
    if (shapeClip) return shapeClip.duration;

    const svgClip = graphicsEngine?.getSVGClip(clipId);
    if (svgClip) return svgClip.duration;

    const stickerClip = graphicsEngine?.getStickerClip(clipId);
    if (stickerClip) return stickerClip.duration;

    return 5;
  }, [
    clipId,
    project.timeline.tracks,
    getTitleEngine,
    getGraphicsEngine,
    project.modifiedAt,
  ]);

  const currentAnimation = useMemo((): EmphasisAnimation => {
    const clip = project.timeline.tracks
      .flatMap((t) => t.clips)
      .find((c) => c.id === clipId);

    if (clip?.emphasisAnimation) {
      return clip.emphasisAnimation;
    }

    const titleEngine = getTitleEngine();
    const textClip = titleEngine?.getTextClip(clipId);
    if (textClip?.emphasisAnimation) {
      return textClip.emphasisAnimation;
    }

    const graphicsEngine = getGraphicsEngine();
    const shapeClip = graphicsEngine?.getShapeClip(clipId);
    if (shapeClip?.emphasisAnimation) {
      return shapeClip.emphasisAnimation;
    }

    const svgClip = graphicsEngine?.getSVGClip(clipId);
    if (svgClip?.emphasisAnimation) {
      return svgClip.emphasisAnimation;
    }

    const stickerClip = graphicsEngine?.getStickerClip(clipId);
    if (stickerClip?.emphasisAnimation) {
      return stickerClip.emphasisAnimation;
    }

    return DEFAULT_EMPHASIS;
  }, [
    clipId,
    project.timeline.tracks,
    getTitleEngine,
    getGraphicsEngine,
    project.modifiedAt,
  ]);

  const handleAnimationChange = useCallback(
    (updates: Partial<EmphasisAnimation>) => {
      const newAnimation = { ...currentAnimation, ...updates };
      updateClipEmphasisAnimation(clipId, newAnimation);
    },
    [clipId, currentAnimation, updateClipEmphasisAnimation],
  );

  const handleTypeChange = useCallback(
    (type: EmphasisAnimationType) => {
      if (type === "focus-zoom") {
        handleAnimationChange({
          type,
          focusPoint: { x: 0.5, y: 0.5 },
          zoomScale: 1.5,
          holdDuration: 0.3,
          loop: false,
        });
      } else if (type === "ken-burns") {
        handleAnimationChange({ type, loop: false });
      } else {
        handleAnimationChange({ type });
      }
    },
    [handleAnimationChange],
  );

  const handleReset = useCallback(() => {
    handleAnimationChange(DEFAULT_EMPHASIS);
  }, [handleAnimationChange]);

  const selectedAnimation = EMPHASIS_ANIMATIONS.flatMap(
    (cat) => cat.animations,
  ).find((a) => a.type === currentAnimation.type);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleTypeChange("none")}
          className={`py-2 rounded-lg text-[10px] font-medium transition-all ${
            currentAnimation.type === "none"
              ? "bg-primary text-white"
              : "bg-background-tertiary border border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          无
        </button>
        <button
          onClick={handleReset}
          className="py-2 rounded-lg text-[10px] font-medium bg-background-tertiary border border-border text-text-secondary hover:text-text-primary transition-all flex items-center justify-center gap-1"
        >
          <RotateCcw size={10} />
          重置
        </button>
      </div>

      {EMPHASIS_ANIMATIONS.map((category) => (
        <div key={category.category}>
          <h4 className="text-[10px] font-medium text-text-muted mb-2">
            {EMPHASIS_CATEGORY_LABELS[category.category] ?? category.category}
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {category.animations.map((anim) => (
              <button
                key={anim.type}
                onClick={() => handleTypeChange(anim.type)}
                className={`py-2 px-2 rounded-lg text-[10px] transition-all text-left ${
                  currentAnimation.type === anim.type
                    ? "bg-primary text-white"
                    : "bg-background-tertiary border border-border text-text-secondary hover:text-text-primary hover:border-primary/50"
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      {currentAnimation.type !== "none" && (
        <>
          <div className="pt-3 border-t border-border space-y-3">
            {selectedAnimation && (
              <p className="text-[10px] text-text-muted italic">
                {selectedAnimation.description}
              </p>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">速度</span>
                <span className="text-[10px] font-mono text-text-primary bg-background-tertiary px-1.5 py-0.5 rounded border border-border">
                  {currentAnimation.speed.toFixed(1)}x
                </span>
              </div>
              <Slider
                min={0.1}
                max={3}
                step={0.1}
                value={[currentAnimation.speed]}
                onValueChange={(value) =>
                  handleAnimationChange({ speed: value[0] })
                }
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">
                  强度
                </span>
                <span className="text-[10px] font-mono text-text-primary bg-background-tertiary px-1.5 py-0.5 rounded border border-border">
                  {Math.round(currentAnimation.intensity * 100)}%
                </span>
              </div>
              <Slider
                min={0.1}
                max={2}
                step={0.1}
                value={[currentAnimation.intensity]}
                onValueChange={(value) =>
                  handleAnimationChange({
                    intensity: value[0],
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-secondary">
                循环播放
              </span>
              <button
                onClick={() =>
                  handleAnimationChange({ loop: !currentAnimation.loop })
                }
                className={`w-10 h-5 rounded-full transition-colors ${
                  currentAnimation.loop
                    ? "bg-primary"
                    : "bg-background-tertiary border border-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                    currentAnimation.loop ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Clock size={12} />
              <span className="text-[10px] font-medium">时间</span>
              <span className="text-[9px] text-text-muted ml-auto">
                片段：{formatTime(clipDuration)}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">
                  开始时间
                </span>
                <span className="text-[10px] font-mono text-text-primary bg-background-tertiary px-1.5 py-0.5 rounded border border-border">
                  {formatTime(currentAnimation.startTime ?? 0)}
                </span>
              </div>
              <Slider
                min={0}
                max={clipDuration}
                step={0.1}
                value={[currentAnimation.startTime ?? 0]}
                onValueChange={(value) =>
                  handleAnimationChange({
                    startTime: value[0],
                  })
                }
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-secondary">
                  时长
                </span>
                <span className="text-[10px] font-mono text-text-primary bg-background-tertiary px-1.5 py-0.5 rounded border border-border">
                  {currentAnimation.animationDuration
                    ? formatTime(currentAnimation.animationDuration)
                    : "整段片段"}
                </span>
              </div>
              <Slider
                min={0}
                max={clipDuration - (currentAnimation.startTime ?? 0)}
                step={0.1}
                value={[
                  currentAnimation.animationDuration ??
                  clipDuration - (currentAnimation.startTime ?? 0)
                ]}
                onValueChange={(value) => {
                  const val = value[0];
                  handleAnimationChange({
                    animationDuration: val > 0 ? val : undefined,
                  });
                }}
              />
              <div className="flex justify-between text-[9px] text-text-muted">
                <span>0s</span>
                <button
                  onClick={() =>
                    handleAnimationChange({
                      startTime: 0,
                      animationDuration: undefined,
                    })
                  }
                  className="text-primary hover:underline"
                >
                  恢复整段
                </button>
                <span>
                  {formatTime(clipDuration - (currentAnimation.startTime ?? 0))}
                </span>
              </div>
            </div>
          </div>

          {currentAnimation.type === "focus-zoom" && (
            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Target size={12} />
                <span className="text-[10px] font-medium">
                  焦点缩放设置
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">
                    缩放倍数
                  </span>
                  <span className="text-[10px] font-mono text-text-primary bg-background-tertiary px-1.5 py-0.5 rounded border border-border">
                    {(currentAnimation.zoomScale || 1.5).toFixed(1)}x
                  </span>
                </div>
                <Slider
                  min={1.1}
                  max={3}
                  step={0.1}
                  value={[currentAnimation.zoomScale || 1.5]}
                  onValueChange={(value) =>
                    handleAnimationChange({
                      zoomScale: value[0],
                    })
                  }
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-secondary">
                    保持时长
                  </span>
                  <span className="text-[10px] font-mono text-text-primary bg-background-tertiary px-1.5 py-0.5 rounded border border-border">
                    {((currentAnimation.holdDuration || 0.3) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={1}
                  step={0.05}
                  value={[currentAnimation.holdDuration || 0.3]}
                  onValueChange={(value) =>
                    handleAnimationChange({
                      holdDuration: value[0],
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-text-secondary">
                  焦点位置
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted">
                      X 位置
                    </span>
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[currentAnimation.focusPoint?.x || 0.5]}
                      onValueChange={(value) =>
                        handleAnimationChange({
                          focusPoint: {
                            x: value[0],
                            y: currentAnimation.focusPoint?.y || 0.5,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-text-muted">
                      Y 位置
                    </span>
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={[currentAnimation.focusPoint?.y || 0.5]}
                      onValueChange={(value) =>
                        handleAnimationChange({
                          focusPoint: {
                            x: currentAnimation.focusPoint?.x || 0.5,
                            y: value[0],
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 mt-2">
                  {[
                    { x: 0, y: 0, label: "TL" },
                    { x: 0.5, y: 0, label: "TC" },
                    { x: 1, y: 0, label: "TR" },
                    { x: 0, y: 0.5, label: "ML" },
                    { x: 0.5, y: 0.5, label: "C" },
                    { x: 1, y: 0.5, label: "MR" },
                    { x: 0, y: 1, label: "BL" },
                    { x: 0.5, y: 1, label: "BC" },
                    { x: 1, y: 1, label: "BR" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() =>
                        handleAnimationChange({
                          focusPoint: { x: preset.x, y: preset.y },
                        })
                      }
                      className={`py-1.5 rounded text-[9px] transition-all ${
                        currentAnimation.focusPoint?.x === preset.x &&
                        currentAnimation.focusPoint?.y === preset.y
                          ? "bg-primary text-white"
                          : "bg-background-tertiary border border-border text-text-muted hover:text-text-primary"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-text-muted">
          <Zap size={10} />
          <span className="text-[9px]">
            强调动画在片段可见期间播放（非入点/出点动画）
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmphasisAnimationSection;
