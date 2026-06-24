/**
 * VF 单向持久化（OpenReel 子侧）。
 *
 * - serializeOpenReelSnapshot：把当前原生工程序列化为 JSON 安全快照（剥离 blob/handle/波形/缩略图，
 *   保留结构 + 元数据 + originalUrl）。父侧存入 timeline.openReel。
 * - restoreOpenReelFromSnapshot：按 originalUrl 重新 import 媒体（保证可解码），重映射 clip.mediaId，
 *   载入快照的轨道/字幕/文本等编辑结果。
 * - startOpenReelAutoSave：订阅工程变更，防抖回调快照（由 vf-bridge 发 OPENREEL_SAVE_REQUEST）。
 */

import type { Project } from "@openreel/core";
import { useProjectStore } from "../stores/project-store";
import { useUIStore } from "../stores/ui-store";
import { fetchAsFile, mediaOriginalUrlRegistry } from "./seed-openreel";

interface SnapshotMedia {
  id: string;
  name?: string;
  originalUrl?: string;
  [key: string]: unknown;
}
interface SnapshotProject {
  mediaLibrary?: { items?: SnapshotMedia[] };
  [key: string]: unknown;
}

/** 当前原生工程 → JSON 安全快照（剥离二进制/会话态字段）。 */
export function serializeOpenReelSnapshot(): unknown {
  const project = useProjectStore.getState().project;
  const items = project.mediaLibrary.items.map((it) => ({
    ...it,
    blob: null,
    fileHandle: null,
    waveformData: null,
    filmstripThumbnails: undefined,
    // blob: URL 缩略图跨会话失效，丢弃（重入会重建）
    thumbnailUrl: null,
    // 回填 originalUrl：replaceMediaAsset 会丢弃它，从注册表恢复以保证下次可按 URL 水化
    originalUrl: it.originalUrl ?? mediaOriginalUrlRegistry.get(it.id),
  }));
  return { ...project, mediaLibrary: { items } };
}

/**
 * 用后端快照恢复：直接 loadProject 载入快照结构（id/clip 不变），再按 originalUrl 用
 * replaceMediaAsset 把 blob 挂回（保持媒体 id）。不重映射、不重 import，避免 OpenReel 对新媒体做
 * 时长重整导致的状态漂移。
 */
export async function restoreOpenReelFromSnapshot(snapshot: unknown): Promise<void> {
  const snap = snapshot as SnapshotProject;

  // 直接载入快照（此时媒体无 blob，为占位态）；保持轨道/片段/媒体 id 与编辑结果原样。
  useProjectStore.getState().loadProject(snap as unknown as Project);

  // 逐个按 originalUrl 重新挂回 blob（保持媒体 id 不变 → 片段引用不变）。
  for (const item of snap.mediaLibrary?.items ?? []) {
    if (!item.originalUrl) continue; // 无源 URL（如用户本地导入）无法跨会话恢复，跳过
    // 记入注册表：replaceMediaAsset 会丢弃 originalUrl，后续自动保存需从注册表回填。
    mediaOriginalUrlRegistry.set(item.id, item.originalUrl);
    try {
      const file = await fetchAsFile(item.originalUrl, item.name || "media");
      await useProjectStore.getState().replaceMediaAsset(item.id, file);
    } catch {
      // 单个媒体水化失败不阻断整体恢复
    }
  }

  useUIStore.getState().setSkipWelcomeScreen(true);
}

/** 订阅工程变更，防抖回调快照。返回取消订阅函数。 */
export function startOpenReelAutoSave(onSnapshot: (snapshot: unknown) => void, debounceMs = 1500): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastProject = useProjectStore.getState().project;

  const unsubscribe = useProjectStore.subscribe((state) => {
    if (state.project === lastProject) return;
    lastProject = state.project;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const project = useProjectStore.getState().project;
        // 护栏：不持久化空工程（避免误存空快照覆盖有效种子/编辑结果）。
        const hasMedia = project.mediaLibrary.items.length > 0;
        const hasClips = project.timeline.tracks.some((t) => t.clips.length > 0);
        if (!hasMedia && !hasClips) return;
        onSnapshot(serializeOpenReelSnapshot());
      } catch {
        // 自动保存失败不阻断编辑
      }
    }, debounceMs);
  });

  return () => {
    if (timer) clearTimeout(timer);
    unsubscribe();
  };
}
