import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  Music,
  ChevronDown,
  ChevronRight,
  Check,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import {
  AudioDucker,
  resolveAudibleAudioTarget,
  type Clip,
  type Project,
  type Track,
} from "@openreel/core";
import { Slider } from "@openreel/ui";
import { useProjectStore } from "../../../stores/project-store";
import type { AudioDuckingSettings } from "../../../stores/project";

interface AudioDuckingSectionProps {
  clipId: string;
}

const DEFAULT_SETTINGS: AudioDuckingSettings = {
  enabled: false,
  sourceTrackId: null,
  threshold: -30,
  reduction: 0.7,
  attack: 0.1,
  release: 0.3,
  holdTime: 0.2,
};

const PRESET_CONFIGS: {
  id: string;
  name: string;
  settings: Partial<AudioDuckingSettings>;
}[] = [
  {
    id: "subtle",
    name: "轻微",
    settings: { threshold: -35, reduction: 0.4, attack: 0.15, release: 0.5 },
  },
  {
    id: "moderate",
    name: "适中",
    settings: { threshold: -30, reduction: 0.6, attack: 0.1, release: 0.3 },
  },
  {
    id: "aggressive",
    name: "强力",
    settings: { threshold: -25, reduction: 0.8, attack: 0.05, release: 0.2 },
  },
  {
    id: "podcast",
    name: "播客",
    settings: {
      threshold: -28,
      reduction: 0.75,
      attack: 0.08,
      release: 0.4,
      holdTime: 0.3,
    },
  },
];

const isAudioDuckingSettings = (
  value: unknown,
): value is AudioDuckingSettings => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AudioDuckingSettings>;

  return (
    typeof candidate.enabled === "boolean" &&
    (typeof candidate.sourceTrackId === "string" ||
      candidate.sourceTrackId === null) &&
    typeof candidate.threshold === "number" &&
    typeof candidate.reduction === "number" &&
    typeof candidate.attack === "number" &&
    typeof candidate.release === "number" &&
    typeof candidate.holdTime === "number"
  );
};

const findClipById = (project: Project, clipId: string): Clip | null => {
  for (const track of project.timeline.tracks) {
    const clip = track.clips.find((candidate) => candidate.id === clipId);
    if (clip) {
      return clip;
    }
  }

  return null;
};

const getTrackLabel = (track: Track): string => {
  const prefix = track.type === "video" ? "视频" : "音频";
  return track.name || `${prefix} ${track.id.slice(-4)}`;
};

const buildTriggerTrackBuffer = async (
  project: Project,
  backgroundClip: Clip,
  sourceTrack: Track,
): Promise<AudioBuffer> => {
  const overlappingClips = sourceTrack.clips.filter((sourceClip) => {
    const sourceEnd = sourceClip.startTime + sourceClip.duration;
    const backgroundEnd = backgroundClip.startTime + backgroundClip.duration;
    return (
      sourceClip.id !== backgroundClip.id &&
      sourceClip.startTime < backgroundEnd &&
      sourceEnd > backgroundClip.startTime
    );
  });

  if (overlappingClips.length === 0) {
    throw new Error("未找到与此片段重叠的触发片段。");
  }

  const decodeContext = new AudioContext();

  try {
    const offlineContext = new OfflineAudioContext(
      Math.max(1, project.settings.channels),
      Math.max(1, Math.ceil(backgroundClip.duration * project.settings.sampleRate)),
      project.settings.sampleRate,
    );

    let scheduledSources = 0;

    for (const sourceClip of overlappingClips) {
      if (sourceClip.reversed) {
        continue;
      }

      const mediaItem = project.mediaLibrary.items.find(
        (item) => item.id === sourceClip.mediaId,
      );

      if (!mediaItem?.blob) {
        continue;
      }

      const overlapStart = Math.max(backgroundClip.startTime, sourceClip.startTime);
      const overlapEnd = Math.min(
        backgroundClip.startTime + backgroundClip.duration,
        sourceClip.startTime + sourceClip.duration,
      );

      if (overlapEnd <= overlapStart) {
        continue;
      }

      try {
        const arrayBuffer = await mediaItem.blob.arrayBuffer();
        const decodedBuffer = await decodeContext.decodeAudioData(arrayBuffer.slice(0));
        const source = offlineContext.createBufferSource();
        const gainNode = offlineContext.createGain();
        const playbackRate = Math.max(0.1, sourceClip.speed ?? 1);
        const timelineOffset = overlapStart - backgroundClip.startTime;
        const mediaOffset =
          sourceClip.inPoint +
          Math.max(0, overlapStart - sourceClip.startTime) * playbackRate;
        const renderDuration = overlapEnd - overlapStart;

        source.buffer = decodedBuffer;
        source.playbackRate.value = playbackRate;
        gainNode.gain.value = sourceClip.volume;

        source.connect(gainNode);
        gainNode.connect(offlineContext.destination);
        source.start(timelineOffset, mediaOffset, renderDuration * playbackRate);
        scheduledSources += 1;
      } catch {
        continue;
      }
    }

    if (scheduledSources === 0) {
      throw new Error("所选源轨道上无可解码的触发音频。");
    }

    return offlineContext.startRendering();
  } finally {
    await decodeContext.close();
  }
};

export const AudioDuckingSection: React.FC<AudioDuckingSectionProps> = ({
  clipId,
}) => {
  const project = useProjectStore((state) => state.project);
  const setClipAudioDucking = useProjectStore(
    (state) => state.setClipAudioDucking,
  );
  const clearClipAudioDucking = useProjectStore(
    (state) => state.clearClipAudioDucking,
  );
  const [settings, setSettings] = useState<AudioDuckingSettings>(DEFAULT_SETTINGS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedClip = useMemo(() => findClipById(project, clipId), [project, clipId]);
  const audioTargetClip = useMemo(
    () =>
      selectedClip
        ? resolveAudibleAudioTarget(selectedClip, project.timeline)
        : null,
    [project.timeline, selectedClip],
  );

  const availableSourceTracks = useMemo(() => {
    const excludedClipIds = new Set(
      [clipId, audioTargetClip?.id].filter(Boolean) as string[],
    );

    return project.timeline.tracks.filter(
      (track): track is Track =>
        (track.type === "audio" || track.type === "video") &&
        !track.clips.every((clip) => excludedClipIds.has(clip.id)),
    );
  }, [audioTargetClip?.id, clipId, project.timeline.tracks]);

  const currentTrack = useMemo(() => {
    for (const track of project.timeline.tracks) {
      for (const clip of track.clips) {
        if (clip.id === (audioTargetClip?.id ?? clipId)) {
          return track;
        }
      }
    }
    return null;
  }, [audioTargetClip?.id, project.timeline.tracks, clipId]);

  const persistedSettings = useMemo(() => {
    const candidate = audioTargetClip?.metadata?.audioDucking;
    return isAudioDuckingSettings(candidate) ? candidate : null;
  }, [audioTargetClip]);

  const hasAppliedDucking = Boolean(
    persistedSettings?.enabled &&
      (audioTargetClip?.automation?.volume?.length ?? 0) > 0,
  );
  const showControls = settings.enabled || hasAppliedDucking;

  useEffect(() => {
    if (persistedSettings) {
      setSettings({ ...DEFAULT_SETTINGS, ...persistedSettings });
    } else {
      setSettings(DEFAULT_SETTINGS);
    }

    setErrorMessage(null);
  }, [clipId, persistedSettings]);

  const updateSetting = useCallback(
    <K extends keyof AudioDuckingSettings>(
      key: K,
      value: AudioDuckingSettings[K],
    ) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setErrorMessage(null);
    },
    [],
  );

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESET_CONFIGS.find((p) => p.id === presetId);
    if (preset) {
      setSettings((prev) => ({ ...prev, ...preset.settings }));
      setErrorMessage(null);
    }
  }, []);

  const handleApplyDucking = useCallback(async () => {
    if (!audioTargetClip || !settings.sourceTrackId) {
      return;
    }

    const sourceTrack = project.timeline.tracks.find(
      (track) => track.id === settings.sourceTrackId,
    );

    if (!sourceTrack) {
      setErrorMessage("请选择有效的触发源轨道。");
      return;
    }

    setIsApplying(true);
    setErrorMessage(null);

    try {
      const triggerBuffer = await buildTriggerTrackBuffer(
        project,
        audioTargetClip,
        sourceTrack,
      );
      const ducker = new AudioDucker();
      const keyframes = ducker.generateDuckingKeyframes(
        triggerBuffer,
        settings,
        audioTargetClip.volume > 0 ? audioTargetClip.volume : 1,
      );

      if (keyframes.length === 0) {
        throw new Error(
          "没有语音超过触发阈值。请降低阈值或选择音量更大的源轨道。",
        );
      }

      const persisted = { ...settings, enabled: true };
      const applied = setClipAudioDucking(audioTargetClip.id, persisted, keyframes);

      if (!applied) {
        throw new Error("无法在此片段上持久化闪避效果。");
      }

      window.dispatchEvent(new CustomEvent("openreel:preview-invalidate"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "应用闪避失败。",
      );
    } finally {
      setIsApplying(false);
    }
  }, [audioTargetClip, project, setClipAudioDucking, settings]);

  const handleRemoveDucking = useCallback(() => {
    const cleared = clearClipAudioDucking(audioTargetClip?.id ?? clipId);

    if (!cleared) {
      setErrorMessage("无法从此片段移除闪避效果。");
      return;
    }

    setSettings(DEFAULT_SETTINGS);
    setErrorMessage(null);
    window.dispatchEvent(new CustomEvent("openreel:preview-invalidate"));
  }, [audioTargetClip?.id, clearClipAudioDucking, clipId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/30">
        <VolumeX size={16} className="text-primary" />
        <div className="flex-1">
          <span className="text-[11px] font-medium text-text-primary">
            音频闪避
          </span>
          <p className="text-[9px] text-text-muted">
            有人声时自动压低背景音乐
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between p-2 bg-background-tertiary rounded-lg">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              showControls ? "bg-green-400" : "bg-gray-500"
            }`}
          />
          <span className="text-[10px] font-medium text-text-primary">
            {showControls ? "闪避已启用" : "闪避已关闭"}
          </span>
        </div>
        <button
          onClick={() => updateSetting("enabled", !settings.enabled)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            showControls ? "bg-primary" : "bg-background-secondary"
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
              showControls ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {showControls && (
        <>
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-text-secondary flex items-center gap-2">
              <Mic size={12} />
              触发源（人声轨道）
            </label>
            {availableSourceTracks.length > 0 ? (
              <div className="space-y-1">
                {availableSourceTracks
                  .filter((track) => track.id !== currentTrack?.id)
                  .map((track) => (
                  <button
                    key={track.id}
                    onClick={() => updateSetting("sourceTrackId", track.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      settings.sourceTrackId === track.id
                        ? "bg-primary/20 border border-primary"
                        : "bg-background-tertiary border border-transparent hover:border-border"
                    }`}
                  >
                    <Volume2 size={12} className="text-text-muted" />
                    <span className="flex-1 text-[10px] text-text-primary">
                      {getTrackLabel(track)}
                    </span>
                    {settings.sourceTrackId === track.id && (
                      <Check size={12} className="text-primary" />
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-background-tertiary rounded-lg text-center">
                <Mic
                  size={16}
                  className="mx-auto mb-1 text-text-muted opacity-50"
                />
                <p className="text-[10px] text-text-muted">
                  添加另一条含对白的音频或视频轨道作为触发源
                </p>
              </div>
            )}
          </div>

          {settings.sourceTrackId && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-text-secondary flex items-center gap-2">
                  <Music size={12} />
                  闪避预设
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {PRESET_CONFIGS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset.id)}
                      className="p-2 text-[9px] text-text-secondary bg-background-tertiary rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-text-secondary">
                      检测阈值
                    </label>
                    <span className="text-[10px] font-mono text-text-primary">
                      {settings.threshold} dB
                    </span>
                  </div>
                  <Slider
                    min={-50}
                    max={-10}
                    step={1}
                    value={[settings.threshold]}
                    onValueChange={(value) =>
                      updateSetting("threshold", value[0])
                    }
                  />
                  <p className="text-[8px] text-text-muted">
                    触发闪避的人声音量
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-text-secondary">
                      音量衰减
                    </label>
                    <span className="text-[10px] font-mono text-text-primary">
                      {Math.round(settings.reduction * 100)}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[settings.reduction * 100]}
                    onValueChange={(value) =>
                      updateSetting("reduction", value[0] / 100)
                    }
                  />
                  <p className="text-[8px] text-text-muted">
                    背景音乐压低幅度
                  </p>
                </div>
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
                时序控制
              </button>

              {showAdvanced && (
                <div className="space-y-3 p-2 bg-background-tertiary rounded-lg">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-text-secondary">
                        起音
                      </label>
                      <span className="text-[10px] font-mono text-text-primary">
                        {settings.attack.toFixed(2)}s
                      </span>
                    </div>
                    <Slider
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      value={[settings.attack]}
                      onValueChange={(value) =>
                        updateSetting("attack", value[0])
                      }
                    />
                    <p className="text-[8px] text-text-muted">
                      人声开始时音量下降速度
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-text-secondary">
                        释音
                      </label>
                      <span className="text-[10px] font-mono text-text-primary">
                        {settings.release.toFixed(2)}s
                      </span>
                    </div>
                    <Slider
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={[settings.release]}
                      onValueChange={(value) =>
                        updateSetting("release", value[0])
                      }
                    />
                    <p className="text-[8px] text-text-muted">
                      人声结束后音量恢复速度
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-text-secondary">
                        保持时间
                      </label>
                      <span className="text-[10px] font-mono text-text-primary">
                        {settings.holdTime.toFixed(2)}s
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={0.5}
                      step={0.05}
                      value={[settings.holdTime]}
                      onValueChange={(value) =>
                        updateSetting("holdTime", value[0])
                      }
                    />
                    <p className="text-[8px] text-text-muted">
                      字与字之间保持闪避的最短时间
                    </p>
                  </div>
                </div>
              )}

              {!hasAppliedDucking ? (
                <button
                  onClick={handleApplyDucking}
                  disabled={isApplying}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover rounded-lg text-[11px] font-medium text-white flex items-center justify-center gap-2 transition-colors disabled:cursor-wait disabled:opacity-60"
                >
                  {isApplying ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      正在分析…
                    </>
                  ) : (
                    <>
                      <VolumeX size={14} />
                      应用闪避
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <Check size={12} className="text-green-400" />
                    <span className="text-[10px] text-green-400">
                      闪避已应用
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleApplyDucking}
                      disabled={isApplying}
                      className="flex items-center justify-center gap-1 py-2 bg-background-tertiary rounded-lg text-[10px] text-text-secondary hover:text-text-primary transition-colors disabled:cursor-wait disabled:opacity-60"
                    >
                      <RefreshCw
                        size={10}
                        className={isApplying ? "animate-spin" : undefined}
                      />
                      {isApplying ? "更新中…" : "更新"}
                    </button>
                    <button
                      onClick={handleRemoveDucking}
                      disabled={isApplying}
                      className="py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      移除
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-2 text-[9px] text-red-400">
          <AlertCircle size={12} />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <p className="text-[9px] text-text-muted text-center">
          检测到人声时自动降低背景音乐音量
        </p>
      </div>
    </div>
  );
};

export default AudioDuckingSection;
