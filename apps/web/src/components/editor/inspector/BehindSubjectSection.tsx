import React, { useCallback, useState, useEffect } from "react";
import { Switch } from "@openreel/ui";
import { Loader2 } from "lucide-react";
import { useEngineStore } from "../../../stores/engine-store";
import { useProjectStore } from "../../../stores/project-store";
import { getPersonSegmentationEngine } from "@openreel/core";

interface BehindSubjectSectionProps {
  clipId: string;
}

export const BehindSubjectSection: React.FC<BehindSubjectSectionProps> = ({
  clipId,
}) => {
  const getTitleEngine = useEngineStore((state) => state.getTitleEngine);
  const updateTextBehindSubject = useProjectStore(
    (state) => state.updateTextBehindSubject,
  );
  const modifiedAt = useProjectStore((state) => state.project.modifiedAt);
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const engine = getTitleEngine();
    const textClip = engine?.getTextClip(clipId);
    setEnabled(textClip?.behindSubject ?? false);
  }, [clipId, getTitleEngine, modifiedAt]);

  const handleToggle = useCallback(
    async (checked: boolean) => {
      const engine = getTitleEngine();
      if (!engine) return;

      setError(null);
      setEnabled(checked);

      if (!checked) {
        updateTextBehindSubject(clipId, false);
        return;
      }

      const segEngine = getPersonSegmentationEngine();
      if (!segEngine.isInitialized()) {
        setIsLoading(true);
        try {
          await segEngine.initialize();
        } catch {
          setError("无法加载 AI 模型，请检查网络连接。");
          updateTextBehindSubject(clipId, false);
          setEnabled(false);
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
      }

      updateTextBehindSubject(clipId, true);
    },
    [clipId, getTitleEngine, updateTextBehindSubject],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[11px] text-text-primary">置于主体后方</p>
          <p className="text-[9px] text-text-muted">
            文字显示在视频中人物背后
          </p>
        </div>
        {isLoading ? (
          <Loader2 size={14} className="animate-spin text-primary" />
        ) : (
          <Switch checked={enabled} onCheckedChange={handleToggle} />
        )}
      </div>
      {isLoading && (
        <p className="text-[9px] text-text-muted">正在加载 AI 模型…</p>
      )}
      {error && (
        <p className="text-[9px] text-red-400">{error}</p>
      )}
    </div>
  );
};
