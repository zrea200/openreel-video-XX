import React, { useCallback, useMemo, useState } from "react";
import { Route, Trash2, Plus, Eye, EyeOff } from "lucide-react";
import { useProjectStore } from "../../../stores/project-store";
import { useUIStore } from "../../../stores/ui-store";
import { useEngineStore } from "../../../stores/engine-store";
import {
  getGSAPEngine,
  generateDefaultControlPoints,
  type GSAPMotionPathPoint,
} from "@openreel/core";
import { Button, Switch } from "@openreel/ui";

interface MotionPathSectionProps {
  clipId: string;
}

export const MotionPathSection: React.FC<MotionPathSectionProps> = ({
  clipId,
}) => {
  const { getClip, project } = useProjectStore();
  const { motionPathMode, motionPathClipId, setMotionPathMode } = useUIStore();
  const getGraphicsEngine = useEngineStore((state) => state.getGraphicsEngine);
  const getTitleEngine = useEngineStore((state) => state.getTitleEngine);
  const [forceUpdate, setForceUpdate] = useState(0);

  const clip = useMemo(() => {
    const timelineClip = getClip(clipId);
    if (timelineClip) return timelineClip;

    const graphicsEngine = getGraphicsEngine();
    const svgClip = graphicsEngine?.getSVGClip(clipId);
    if (svgClip) return svgClip;

    const shapeClip = graphicsEngine?.getShapeClip(clipId);
    if (shapeClip) return shapeClip;

    const stickerClip = graphicsEngine?.getStickerClip(clipId);
    if (stickerClip) return stickerClip;

    const titleEngine = getTitleEngine();
    const textClip = titleEngine?.getTextClip(clipId);
    if (textClip) return textClip;

    return undefined;
  }, [clipId, getClip, getGraphicsEngine, getTitleEngine, project.modifiedAt]);

  const gsapEngine = useMemo(() => getGSAPEngine(), []);

  const motionPath = useMemo(() => {
    return gsapEngine.getMotionPath(clipId);
  }, [clipId, gsapEngine, forceUpdate]);

  const isEditing = motionPathMode && motionPathClipId === clipId;

  const handleEnableToggle = useCallback(
    (enabled: boolean) => {
      if (enabled) {
        const existingPath = gsapEngine.getMotionPath(clipId);
        if (!existingPath) {
          const defaultPoints: GSAPMotionPathPoint[] = [
            { x: 0, y: 0, time: 0 },
            { x: 100, y: 0, time: 1 },
          ];
          gsapEngine.setMotionPath(clipId, {
            enabled: true,
            pathType: "bezier",
            points: generateDefaultControlPoints(defaultPoints),
            showPath: true,
            autoOrient: false,
            alignOrigin: [0.5, 0.5],
          });
        } else {
          gsapEngine.setMotionPath(clipId, { ...existingPath, enabled: true });
        }
      } else {
        const existingPath = gsapEngine.getMotionPath(clipId);
        if (existingPath) {
          gsapEngine.setMotionPath(clipId, { ...existingPath, enabled: false });
        }
      }
      setForceUpdate((v) => v + 1);
    },
    [clipId, gsapEngine]
  );

  const handleShowPathToggle = useCallback(
    (show: boolean) => {
      const path = gsapEngine.getMotionPath(clipId);
      if (path) {
        gsapEngine.setMotionPath(clipId, { ...path, showPath: show });
        setForceUpdate((v) => v + 1);
      }
    },
    [clipId, gsapEngine]
  );

  const handleAutoOrientToggle = useCallback(
    (autoOrient: boolean) => {
      const path = gsapEngine.getMotionPath(clipId);
      if (path) {
        gsapEngine.setMotionPath(clipId, { ...path, autoOrient });
        setForceUpdate((v) => v + 1);
      }
    },
    [clipId, gsapEngine]
  );

  const handlePathTypeChange = useCallback(
    (pathType: "linear" | "bezier" | "catmull-rom") => {
      const path = gsapEngine.getMotionPath(clipId);
      if (path) {
        gsapEngine.setMotionPath(clipId, { ...path, pathType });
        setForceUpdate((v) => v + 1);
      }
    },
    [clipId, gsapEngine]
  );

  const handleEditMode = useCallback(() => {
    if (isEditing) {
      setMotionPathMode(false);
    } else {
      setMotionPathMode(true, clipId);
    }
  }, [isEditing, clipId, setMotionPathMode]);

  const handleAddPoint = useCallback(() => {
    const path = gsapEngine.getMotionPath(clipId);
    if (!path) return;

    const lastPoint = path.points[path.points.length - 1];
    const newPoint: GSAPMotionPathPoint = {
      x: lastPoint.x + 50,
      y: lastPoint.y,
      time: Math.min(1, lastPoint.time + 0.2),
    };

    gsapEngine.addGSAPMotionPathPoint(clipId, newPoint);
    setForceUpdate((v) => v + 1);
  }, [clipId, gsapEngine]);

  const handleClearPath = useCallback(() => {
    gsapEngine.removeMotionPath(clipId);
    setMotionPathMode(false);
    setForceUpdate((v) => v + 1);
  }, [clipId, gsapEngine, setMotionPathMode]);

  if (!clip) {
    return (
      <div className="text-center py-8 text-text-muted text-xs">
        未选中片段
      </div>
    );
  }

  const isEnabled = motionPath?.enabled ?? false;
  const showPath = motionPath?.showPath ?? true;
  const autoOrient = motionPath?.autoOrient ?? false;
  const pathType = motionPath?.pathType ?? "bezier";
  const pointCount = motionPath?.points.length ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Route size={14} className="text-primary" />
          <span className="text-xs font-medium text-text-primary">
            运动路径
          </span>
        </div>
        <Switch checked={isEnabled} onCheckedChange={handleEnableToggle} />
      </div>

      {isEnabled && (
        <>
          <div className="p-3 bg-background-tertiary rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-secondary">显示路径</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShowPathToggle(!showPath)}
                  className={`p-1.5 rounded transition-colors ${
                    showPath
                      ? "bg-primary/20 text-primary"
                      : "bg-background-elevated text-text-muted"
                  }`}
                >
                  {showPath ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-text-secondary">
                自动朝向
              </span>
              <Switch
                checked={autoOrient}
                onCheckedChange={handleAutoOrientToggle}
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-text-secondary">路径类型</span>
              <div className="grid grid-cols-3 gap-1">
                {(["linear", "bezier", "catmull-rom"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => handlePathTypeChange(type)}
                    className={`py-1.5 rounded text-[9px] capitalize transition-colors ${
                      pathType === type
                        ? "bg-primary text-white"
                        : "bg-background-elevated border border-border text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    {type === "catmull-rom"
                      ? "平滑"
                      : type === "linear"
                        ? "线性"
                        : "贝塞尔"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
            <div>
              <span className="text-[10px] text-text-secondary">
                路径点
              </span>
              <p className="text-sm font-medium text-text-primary">
                {pointCount} 个点
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleAddPoint}
                className="p-1.5 rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                title="添加点"
              >
                <Plus size={12} />
              </button>
              <button
                onClick={handleClearPath}
                className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="清除路径"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          <Button
            onClick={handleEditMode}
            className={`w-full ${
              isEditing
                ? "bg-primary text-white"
                : "bg-background-tertiary text-text-primary border border-border hover:bg-background-elevated"
            }`}
            size="sm"
          >
            <Route size={14} className="mr-2" />
            {isEditing ? "退出编辑" : "在画布上编辑路径"}
          </Button>

          {isEditing && (
            <div className="p-2 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-[9px] text-primary">
                <span className="font-medium">编辑中：</span>
                点击路径添加点，拖动移动点，右键删除，拖动手柄调整曲线。
              </p>
            </div>
          )}

          <div className="p-2 bg-background-tertiary/50 border border-border rounded-lg">
            <p className="text-[9px] text-text-muted">
              <span className="text-text-secondary font-medium">提示：</span>
              运动路径让片段沿曲线随时间移动，可用贝塞尔手柄获得平滑曲线。
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default MotionPathSection;
