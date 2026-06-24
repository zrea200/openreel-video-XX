/**
 * VF 种子注入：把父侧 VF_INIT_PROJECT 的种子描述符组装成 OpenReel 原生工程并载入。
 *
 * 路径：逐个 fetch 同源媒体 URL → File → store.importMedia（mediabunny 探测元数据、持久化到 IndexedDB）
 * → 读取导入后的 MediaItem id → 手工组装 tracks/clips/subtitles → loadProject 一次性载入。
 *
 * 仅用于嵌入模式（vf-bridge 调用）；不改 OpenReel 既有逻辑。
 */

import { v4 as uuidv4 } from "uuid";
import type { Clip, Subtitle, Track, Transform } from "@openreel/core";
import { useProjectStore } from "../stores/project-store";
import { useUIStore } from "../stores/ui-store";

export interface VfSeedScene {
  sceneId: string;
  name: string;
  videoUrl: string | null;
  audioUrl: string | null;
  durationSec: number;
  trimStart: number;
  trimEnd: number | null;
  audioDurationSec: number | null;
  voiceVolume: number | null;
}

export interface VfSeedSubtitle {
  id: string;
  text: string;
  start: number;
  end: number;
  lang: "zh" | "en";
}

export interface VfSeed {
  settings: { width: number; height: number; frameRate: number };
  scenes: VfSeedScene[];
  subtitles: VfSeedSubtitle[];
  bgm: { url: string; name: string; volume: number } | null;
}

/**
 * mediaId → 源同源 URL 注册表。
 * 用于在序列化快照时回填 originalUrl —— OpenReel 的 replaceMediaAsset 会丢弃 originalUrl，
 * 若不回填，自动保存会存下无 originalUrl 的媒体，导致下次 restore 无法按 URL 重新水化。
 */
export const mediaOriginalUrlRegistry = new Map<string, string>();

function defaultTransform(): Transform {
  return {
    position: { x: 0, y: 0 },
    scale: { x: 1, y: 1 },
    rotation: 0,
    anchor: { x: 0.5, y: 0.5 },
    opacity: 1,
  };
}

function makeClip(params: {
  mediaId: string;
  trackId: string;
  startTime: number;
  duration: number;
  inPoint: number;
  outPoint: number;
  volume: number;
}): Clip {
  return {
    id: uuidv4(),
    mediaId: params.mediaId,
    trackId: params.trackId,
    startTime: round(params.startTime),
    duration: round(params.duration),
    inPoint: round(params.inPoint),
    outPoint: round(params.outPoint),
    effects: [],
    audioEffects: [],
    transform: defaultTransform(),
    volume: params.volume,
    keyframes: [],
  };
}

function makeTrack(id: string, type: Track["type"], name: string, clips: Clip[]): Track {
  return {
    id,
    type,
    name,
    clips,
    transitions: [],
    locked: false,
    hidden: false,
    muted: false,
    solo: false,
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export async function fetchAsFile(url: string, name: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`媒体拉取失败 ${res.status}: ${url}`);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "application/octet-stream" });
}

/** 导入一个媒体并返回新建 MediaItem 的 id（importMedia 追加到 mediaLibrary 末尾）。 */
export async function importAndGetId(url: string, name: string): Promise<string> {
  const file = await fetchAsFile(url, name);
  const before = useProjectStore.getState().project.mediaLibrary.items.length;
  const result = await useProjectStore.getState().importMedia(file);
  if (!result.success) {
    const message = "error" in result && result.error ? result.error.message : "导入失败";
    throw new Error(`${name}: ${message}`);
  }
  const items = useProjectStore.getState().project.mediaLibrary.items;
  if (items.length <= before) throw new Error(`${name}: 导入后未找到媒体`);
  return items[items.length - 1].id;
}

/** 按种子描述符组装并载入 OpenReel 原生工程。 */
export async function seedOpenReelFromVf(seed: VfSeed): Promise<void> {
  const store = useProjectStore.getState();
  store.createNewProject("Video Factory", {
    width: seed.settings.width,
    height: seed.settings.height,
    frameRate: seed.settings.frameRate,
  });

  // 记录 mediaId → 源 URL，用于给 MediaItem 打 originalUrl（快照跨会话重新水化的依据）。
  const urlById = new Map<string, string>();
  const imported: Array<{ scene: VfSeedScene; videoMediaId?: string; audioMediaId?: string }> = [];
  for (const scene of seed.scenes) {
    const entry: { scene: VfSeedScene; videoMediaId?: string; audioMediaId?: string } = { scene };
    if (scene.videoUrl) {
      entry.videoMediaId = await importAndGetId(scene.videoUrl, `${scene.name}-video`);
      urlById.set(entry.videoMediaId, scene.videoUrl);
    }
    if (scene.audioUrl) {
      entry.audioMediaId = await importAndGetId(scene.audioUrl, `${scene.name}-audio`);
      urlById.set(entry.audioMediaId, scene.audioUrl);
    }
    imported.push(entry);
  }
  let bgmMediaId: string | undefined;
  if (seed.bgm) {
    bgmMediaId = await importAndGetId(seed.bgm.url, seed.bgm.name);
    urlById.set(bgmMediaId, seed.bgm.url);
  }

  const videoTrackId = uuidv4();
  const voiceTrackId = uuidv4();
  const bgmTrackId = uuidv4();
  const videoClips: Clip[] = [];
  const voiceClips: Clip[] = [];
  const bgmClips: Clip[] = [];

  let cursor = 0;
  for (const { scene, videoMediaId, audioMediaId } of imported) {
    const inPoint = Math.max(0, scene.trimStart || 0);
    const sourceDuration = scene.durationSec > 0 ? scene.durationSec : 5;
    const outPoint = scene.trimEnd ?? sourceDuration;
    const duration = Math.max(0.1, outPoint - inPoint);

    if (videoMediaId) {
      videoClips.push(makeClip({ mediaId: videoMediaId, trackId: videoTrackId, startTime: cursor, duration, inPoint, outPoint, volume: 1 }));
    }
    if (audioMediaId) {
      const audioOut = scene.audioDurationSec && scene.audioDurationSec > 0 ? Math.min(scene.audioDurationSec, duration) : duration;
      voiceClips.push(
        makeClip({
          mediaId: audioMediaId,
          trackId: voiceTrackId,
          startTime: cursor,
          duration,
          inPoint: 0,
          outPoint: audioOut,
          volume: scene.voiceVolume ?? 1,
        })
      );
    }
    cursor += duration;
  }

  const totalDuration = round(cursor);
  if (bgmMediaId && seed.bgm) {
    bgmClips.push(
      makeClip({ mediaId: bgmMediaId, trackId: bgmTrackId, startTime: 0, duration: totalDuration, inPoint: 0, outPoint: totalDuration, volume: seed.bgm.volume })
    );
  }

  const tracks: Track[] = [];
  if (videoClips.length) tracks.push(makeTrack(videoTrackId, "video", "Video", videoClips));
  if (voiceClips.length) tracks.push(makeTrack(voiceTrackId, "audio", "Voice", voiceClips));
  if (bgmClips.length) tracks.push(makeTrack(bgmTrackId, "audio", "BGM", bgmClips));

  const subtitles: Subtitle[] = seed.subtitles.map((s) => ({
    id: s.id,
    text: s.text,
    startTime: round(s.start),
    endTime: round(s.end),
  }));

  const base = useProjectStore.getState().project;
  for (const [id, url] of urlById) mediaOriginalUrlRegistry.set(id, url);
  const items = base.mediaLibrary.items.map((it) =>
    urlById.has(it.id) ? { ...it, originalUrl: urlById.get(it.id) } : it
  );
  const assembled = {
    ...base,
    mediaLibrary: { items },
    timeline: { ...base.timeline, tracks, subtitles, duration: totalDuration },
    modifiedAt: Date.now(),
  };
  useProjectStore.getState().loadProject(assembled);

  // 跳过 OpenReel 欢迎/选格式落地页，直接进入编辑器视图展示已种子的工程。
  useUIStore.getState().setSkipWelcomeScreen(true);
}
