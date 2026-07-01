import React, { useState, useEffect, useCallback } from "react";
import {
  Target,
  X,
  Check,
  AlertTriangle,
  Move,
  RotateCcw,
  Maximize2,
  ChevronDown,
  ChevronRight,
  Settings2,
  RefreshCw,
} from "lucide-react";
import { Slider, Checkbox, Label } from "@openreel/ui";
import {
  getMotionTrackingBridge,
  type MotionTrackingState,
} from "../../../bridges/motion-tracking-bridge";
import type { Rectangle } from "@openreel/core";

interface MotionTrackingSectionProps {
  clipId: string;
}

type TrackingAlgorithm = "correlation" | "optical-flow" | "feature";

const ALGORITHMS: {
  id: TrackingAlgorithm;
  name: string;
  description: string;
}[] = [
  {
    id: "correlation",
    name: "相关匹配",
    description: "适合高对比度物体",
  },
  {
    id: "optical-flow",
    name: "光流",
    description: "适合平滑运动",
  },
  {
    id: "feature",
    name: "特征匹配",
    description: "适合复杂纹理",
  },
];

export const MotionTrackingSection: React.FC<MotionTrackingSectionProps> = ({
  clipId,
}) => {
  const [state, setState] = useState<MotionTrackingState>({
    isTracking: false,
    progress: 0,
    currentJob: null,
    trackingData: null,
    lostFrames: [],
    error: null,
  });

  const [region, setRegion] = useState<Rectangle>({
    x: 100,
    y: 100,
    width: 200,
    height: 200,
  });

  const [algorithm, setAlgorithm] = useState<TrackingAlgorithm>("correlation");
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [applyScale, setApplyScale] = useState(true);
  const [applyRotation, setApplyRotation] = useState(true);
  const [smoothing, setSmoothing] = useState(0);
  const [isApplied, setIsApplied] = useState(false);

  const bridge = getMotionTrackingBridge();

  useEffect(() => {
    const unsubscribe = bridge.subscribe(setState);
    const existingData = bridge.getTrackingDataForClip(clipId);
    if (existingData.length > 0) {
      setState((prev) => ({
        ...prev,
        trackingData: existingData[existingData.length - 1],
      }));
    }
    return unsubscribe;
  }, [bridge, clipId]);

  const handleStartTracking = useCallback(async () => {
    try {
      await bridge.startTracking(clipId, region, {
        frameRate: 30,
        startFrame: 0,
        endFrame: 150,
        algorithm,
        confidenceThreshold: confidenceThreshold / 100,
      });
    } catch (error) {
      console.error("Failed to start tracking:", error);
    }
  }, [bridge, clipId, region, algorithm, confidenceThreshold]);

  const handleCancelTracking = useCallback(() => {
    if (state.currentJob) {
      bridge.cancelTracking(state.currentJob.id);
    }
  }, [bridge, state.currentJob]);

  const handleApplyTracking = useCallback(() => {
    const success = bridge.applyTrackingToClip(clipId, {
      x: offsetX,
      y: offsetY,
    });
    if (success) {
      bridge.setApplyScale(clipId, applyScale);
      bridge.setApplyRotation(clipId, applyRotation);
      setIsApplied(true);
    }
  }, [bridge, clipId, offsetX, offsetY, applyScale, applyRotation]);

  const handleRemoveTracking = useCallback(() => {
    bridge.removeAttachment(clipId);
    setIsApplied(false);
  }, [bridge, clipId]);

  const handleOffsetChange = useCallback(
    (axis: "x" | "y", value: number) => {
      if (axis === "x") {
        setOffsetX(value);
      } else {
        setOffsetY(value);
      }
      if (isApplied) {
        bridge.setTrackingOffset(clipId, {
          x: axis === "x" ? value : offsetX,
          y: axis === "y" ? value : offsetY,
        });
      }
    },
    [bridge, clipId, isApplied, offsetX, offsetY],
  );

  const hasTrackingData =
    state.trackingData !== null || bridge.hasTrackingData(clipId);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/30">
        <Target size={16} className="text-primary" />
        <div className="flex-1">
          <span className="text-[11px] font-medium text-text-primary">
            运动跟踪
          </span>
          <p className="text-[9px] text-text-muted">
            跟踪物体以附着元素
          </p>
        </div>
      </div>

      {!state.isTracking && !hasTrackingData && (
        <>
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-text-secondary">
              跟踪区域
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[9px] text-text-muted">X 位置</label>
                <input
                  type="number"
                  value={region.x}
                  onChange={(e) =>
                    setRegion({ ...region, x: Number(e.target.value) })
                  }
                  className="w-full px-2 py-1.5 text-[10px] bg-background-secondary border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-text-muted">Y 位置</label>
                <input
                  type="number"
                  value={region.y}
                  onChange={(e) =>
                    setRegion({ ...region, y: Number(e.target.value) })
                  }
                  className="w-full px-2 py-1.5 text-[10px] bg-background-secondary border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-text-muted">宽度</label>
                <input
                  type="number"
                  value={region.width}
                  onChange={(e) =>
                    setRegion({ ...region, width: Number(e.target.value) })
                  }
                  className="w-full px-2 py-1.5 text-[10px] bg-background-secondary border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-text-muted">高度</label>
                <input
                  type="number"
                  value={region.height}
                  onChange={(e) =>
                    setRegion({ ...region, height: Number(e.target.value) })
                  }
                  className="w-full px-2 py-1.5 text-[10px] bg-background-secondary border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <p className="text-[9px] text-text-muted text-center">
              在预览中绘制区域或输入坐标
            </p>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center gap-2 py-1.5 text-[10px] text-text-secondary hover:text-text-primary transition-colors"
          >
            {showAdvanced ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            <Settings2 size={12} />
            高级选项
          </button>

          {showAdvanced && (
            <div className="space-y-3 p-2 bg-background-tertiary rounded-lg">
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium text-text-secondary">
                  算法
                </label>
                <div className="space-y-1">
                  {ALGORITHMS.map((algo) => (
                    <button
                      key={algo.id}
                      onClick={() => setAlgorithm(algo.id)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                        algorithm === algo.id
                          ? "bg-primary/20 border border-primary"
                          : "bg-background-secondary border border-transparent hover:border-border"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                          algorithm === algo.id
                            ? "border-primary"
                            : "border-border"
                        }`}
                      >
                        {algorithm === algo.id && (
                          <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] font-medium text-text-primary">
                          {algo.name}
                        </span>
                        <p className="text-[8px] text-text-muted">
                          {algo.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-text-secondary">
                    置信度阈值
                  </label>
                  <span className="text-[10px] font-mono text-text-primary">
                    {confidenceThreshold}%
                  </span>
                </div>
                <Slider
                  min={30}
                  max={95}
                  step={5}
                  value={[confidenceThreshold]}
                  onValueChange={(value) => setConfidenceThreshold(value[0])}
                />
                <p className="text-[8px] text-text-muted">
                  越高越准确，但更容易丢失跟踪
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-text-secondary">
                    路径平滑
                  </label>
                  <span className="text-[10px] font-mono text-text-primary">
                    {smoothing}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={10}
                  step={1}
                  value={[smoothing]}
                  onValueChange={(value) => setSmoothing(value[0])}
                />
                <p className="text-[8px] text-text-muted">
                  减少跟踪路径抖动
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleStartTracking}
            className="w-full py-2.5 bg-primary hover:bg-primary-hover rounded-lg text-[11px] font-medium text-white flex items-center justify-center gap-2 transition-colors"
          >
            <Target size={14} />
            开始跟踪
          </button>
        </>
      )}

      {state.isTracking && (
        <div className="space-y-3 p-3 bg-background-tertiary rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-[11px] font-medium text-primary">
                正在跟踪
              </span>
            </div>
            <button
              onClick={handleCancelTracking}
              className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
              title="取消跟踪"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-text-muted">正在分析帧…</span>
              <span className="font-mono text-text-primary">
                {Math.round(state.progress)}%
              </span>
            </div>
            <div className="w-full h-2 bg-background-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </div>

          {state.lostFrames.length > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-400">
              <AlertTriangle size={12} />
              在 {state.lostFrames.length} 帧丢失跟踪
            </div>
          )}
        </div>
      )}

      {state.error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400">
          <div className="flex items-center gap-2 font-medium mb-1">
            <AlertTriangle size={12} />
            跟踪失败
          </div>
          <p className="text-[9px] text-red-300/80">{state.error}</p>
        </div>
      )}

      {hasTrackingData && !state.isTracking && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Check size={14} className="text-green-400" />
            <div className="flex-1">
              <span className="text-[10px] font-medium text-green-400">
                跟踪完成
              </span>
              {state.trackingData && (
                <p className="text-[9px] text-green-300/70">
                  已捕获 {state.trackingData.keyframes.length} 个关键帧
                  {state.trackingData.lostFrames.length > 0 &&
                    ` • 丢失 ${state.trackingData.lostFrames.length} 帧`}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-medium text-text-secondary flex items-center gap-2">
              <Move size={12} />
              位置偏移
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <label className="text-[9px] text-text-muted">X 偏移</label>
                <input
                  type="number"
                  value={offsetX}
                  onChange={(e) =>
                    handleOffsetChange("x", Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 text-[10px] bg-background-secondary border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-0.5">
                <label className="text-[9px] text-text-muted">Y 偏移</label>
                <input
                  type="number"
                  value={offsetY}
                  onChange={(e) =>
                    handleOffsetChange("y", Number(e.target.value))
                  }
                  className="w-full px-2 py-1.5 text-[10px] bg-background-secondary border border-border rounded focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-medium text-text-secondary">
              变换选项
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-background-tertiary rounded-lg">
                <Checkbox
                  id="apply-scale"
                  checked={applyScale}
                  onCheckedChange={(checked) => {
                    const value = checked === true;
                    setApplyScale(value);
                    if (isApplied) {
                      bridge.setApplyScale(clipId, value);
                    }
                  }}
                />
                <Label
                  htmlFor="apply-scale"
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 size={10} className="text-text-muted" />
                  <span className="text-[10px] text-text-secondary">缩放</span>
                </Label>
              </div>
              <div className="flex items-center gap-2 p-2 bg-background-tertiary rounded-lg">
                <Checkbox
                  id="apply-rotation"
                  checked={applyRotation}
                  onCheckedChange={(checked) => {
                    const value = checked === true;
                    setApplyRotation(value);
                    if (isApplied) {
                      bridge.setApplyRotation(clipId, value);
                    }
                  }}
                />
                <Label
                  htmlFor="apply-rotation"
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw size={10} className="text-text-muted" />
                  <span className="text-[10px] text-text-secondary">
                    旋转
                  </span>
                </Label>
              </div>
            </div>
          </div>

          {!isApplied ? (
            <button
              onClick={handleApplyTracking}
              className="w-full py-2.5 bg-primary/20 border border-primary/30 rounded-lg text-[11px] font-medium text-primary hover:bg-primary/30 transition-colors"
            >
              应用跟踪到片段
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                <Check size={12} className="text-primary" />
                <span className="text-[10px] text-primary">
                  已应用跟踪
                </span>
              </div>
              <button
                onClick={handleRemoveTracking}
                className="w-full py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-[10px] text-red-400 hover:bg-red-500/20 transition-colors"
              >
                移除跟踪
              </button>
            </div>
          )}

          <button
            onClick={handleStartTracking}
            className="w-full flex items-center justify-center gap-2 py-1.5 text-[9px] text-text-muted hover:text-text-secondary transition-colors"
          >
            <RefreshCw size={10} />
            用不同设置重新跟踪
          </button>
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <p className="text-[9px] text-text-muted text-center">
          跟踪物体以固定图形、文字或特效
        </p>
      </div>
    </div>
  );
};

export default MotionTrackingSection;
