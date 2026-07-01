import React from "react";
import {
  Copy,
  Layers,
  Trash2,
  Scissors,
  Music,
  Sparkles,
  Volume2,
  Film,
  Image,
  ArrowLeftToLine,
} from "lucide-react";
import type { Clip, Track } from "@openreel/core";
import { useProjectStore } from "../../../stores/project-store";
import { useTimelineStore } from "../../../stores/timeline-store";
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
} from "@openreel/ui";

interface ClipContextMenuProps {
  clip: Clip;
  track: Track;
  onClose?: () => void;
}

export const ClipContextMenu: React.FC<ClipContextMenuProps> = ({
  clip,
  track,
  onClose,
}) => {
  const {
    copyClips,
    duplicateClip,
    removeClip,
    rippleDeleteClip,
    splitClip,
    separateAudio,
    getMediaItem,
    copyEffects,
    pasteEffects,
    copiedEffects,
    closeGapBeforeClip,
  } = useProjectStore();
  const { playheadPosition } = useTimelineStore();

  const isPlayheadOnClip =
    playheadPosition >= clip.startTime &&
    playheadPosition <= clip.startTime + clip.duration;

  const hasGapBeforeClip = React.useMemo(() => {
    const sorted = [...track.clips].sort((a, b) => a.startTime - b.startTime);
    const idx = sorted.findIndex((c) => c.id === clip.id);
    if (idx < 0) return false;
    const prev = idx > 0 ? sorted[idx - 1] : null;
    const target = prev ? prev.startTime + prev.duration : 0;
    return clip.startTime - target > 0.0001;
  }, [track.clips, clip.id, clip.startTime]);

  const mediaItem = getMediaItem(clip.mediaId);
  const isVideo = track.type === "video";
  const isAudio = track.type === "audio";
  const isImage = track.type === "image";
  const isVideoWithAudio =
    isVideo &&
    mediaItem?.type === "video" &&
    mediaItem?.metadata?.channels &&
    mediaItem.metadata.channels > 0;

  const hasEffects = clip.effects && clip.effects.length > 0;
  const hasCopiedEffects = copiedEffects && copiedEffects.length > 0;

  const handleCopy = () => {
    copyClips([clip.id]);
    onClose?.();
  };

  const handleDuplicate = async () => {
    await duplicateClip(clip.id);
    onClose?.();
  };

  const handleDelete = async () => {
    await removeClip(clip.id);
    onClose?.();
  };

  const handleRippleDelete = async () => {
    await rippleDeleteClip(clip.id);
    onClose?.();
  };

  const handleSplit = async () => {
    if (isPlayheadOnClip) {
      await splitClip(clip.id, playheadPosition);
    }
    onClose?.();
  };

  const handleCloseGap = async () => {
    await closeGapBeforeClip(clip.id);
    onClose?.();
  };

  const handleSeparateAudio = async () => {
    await separateAudio(clip.id);
    onClose?.();
  };

  const handleCopyEffects = () => {
    copyEffects(clip.id);
    onClose?.();
  };

  const handlePasteEffects = async () => {
    await pasteEffects(clip.id);
    onClose?.();
  };

  const getClipTypeLabel = () => {
    if (isVideo) return "视频片段";
    if (isAudio) return "音频片段";
    if (isImage) return "图片片段";
    return "片段";
  };

  const getClipTypeIcon = () => {
    if (isVideo) return <Film className="mr-2 h-3 w-3 text-primary" />;
    if (isAudio) return <Volume2 className="mr-2 h-3 w-3 text-blue-400" />;
    if (isImage) return <Image className="mr-2 h-3 w-3 text-purple-400" />;
    return null;
  };

  return (
    <ContextMenuContent className="min-w-[220px]">
      <ContextMenuLabel className="flex items-center text-[10px] text-text-muted">
        {getClipTypeIcon()}
        {getClipTypeLabel()}
      </ContextMenuLabel>
      <ContextMenuSeparator />

      <ContextMenuItem onClick={handleCopy}>
        <Copy className="mr-2 h-4 w-4" />
        复制片段
        <ContextMenuShortcut>⌘C</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={handleDuplicate}>
        <Layers className="mr-2 h-4 w-4" />
        复制
        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
      </ContextMenuItem>

      <ContextMenuSeparator />

      <ContextMenuItem onClick={handleSplit} disabled={!isPlayheadOnClip}>
        <Scissors className="mr-2 h-4 w-4" />
        在播放头处分割
        <ContextMenuShortcut>S</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={handleCloseGap} disabled={!hasGapBeforeClip}>
        <ArrowLeftToLine className="mr-2 h-4 w-4" />
        闭合与前一片段的间隙
      </ContextMenuItem>

      {(isVideo || isImage) && (
        <>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Sparkles className="mr-2 h-4 w-4" />
              特效
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={handleCopyEffects} disabled={!hasEffects}>
                复制特效
              </ContextMenuItem>
              <ContextMenuItem onClick={handlePasteEffects} disabled={!hasCopiedEffects}>
                粘贴特效
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </>
      )}

      {isVideoWithAudio && (
        <>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleSeparateAudio}>
            <Music className="mr-2 h-4 w-4" />
            分离音频
          </ContextMenuItem>
        </>
      )}

      {isAudio && (
        <>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Volume2 className="mr-2 h-4 w-4" />
              音频
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onClick={handleCopyEffects} disabled={!hasEffects}>
                复制音频特效
              </ContextMenuItem>
              <ContextMenuItem onClick={handlePasteEffects} disabled={!hasCopiedEffects}>
                粘贴音频特效
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </>
      )}

      <ContextMenuSeparator />
      <ContextMenuItem onClick={handleRippleDelete} className="text-red-400">
        <Trash2 className="mr-2 h-4 w-4" />
        波纹删除
        <ContextMenuShortcut>⌫</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={handleDelete} className="text-red-400">
        <Trash2 className="mr-2 h-4 w-4" />
        删除
      </ContextMenuItem>
    </ContextMenuContent>
  );
};
