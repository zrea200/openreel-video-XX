/**
 * VF 浏览器端导出（OpenReel 子侧）。
 *
 * 用 OpenReel 的 ExportEngine 在浏览器内（WebCodecs/WebGPU）把当前工程导出为 MP4 Blob，
 * 再直接 POST 到 sidecar（同源经 BFF，带 cookie 鉴权）落盘为项目 export 产物。
 * 大 Blob 不走 postMessage。
 */

import { getExportEngine, type ExportResult, type VideoExportSettings } from "@openreel/core";
import { useProjectStore } from "../stores/project-store";

export type ExportResolution = "720p" | "1080p";

export interface ExportProgressInfo extends Record<string, unknown> {
  progress: number;
  phase?: string;
}

export interface ExportOutput {
  id: string;
  url: string;
  resolution: string;
  createdAt: string;
  sizeBytes?: number;
  durationSec?: number;
}

const RES_DIMS: Record<ExportResolution, { width: number; height: number }> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
};

async function uploadExportBlob(
  projectId: string,
  blob: Blob,
  resolution: ExportResolution,
  durationSec: number,
): Promise<ExportOutput> {
  const form = new FormData();
  form.append("file", new File([blob], `openreel-${resolution}.mp4`, { type: "video/mp4" }));
  form.append("resolution", resolution);
  form.append("durationSec", String(durationSec));
  const res = await fetch(`/api/video-factory/projects/${projectId}/editor/export-blob`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      const j = await res.json();
      detail = j.detail || j.error || detail;
    } catch {
      /* ignore */
    }
    throw new Error(`导出上传失败：${detail}`);
  }
  const json = (await res.json()) as { output: ExportOutput };
  return json.output;
}

/** 浏览器端导出当前工程为 MP4 并回传 sidecar，返回落盘后的 export 产物。 */
export async function exportOpenReelAndUpload(opts: {
  projectId: string;
  resolution: ExportResolution;
  onProgress?: (info: ExportProgressInfo) => void;
}): Promise<ExportOutput> {
  const engine = getExportEngine();
  await engine.initialize();

  const project = useProjectStore.getState().project;
  const dims = RES_DIMS[opts.resolution];
  const settings: Partial<VideoExportSettings> = {
    format: "mp4",
    codec: "h264",
    bitrate: 12000,
    quality: 85,
    width: dims.width,
    height: dims.height,
    frameRate: project.settings.frameRate || 30,
  };

  // OpenReel 视频导出必须写入 FileSystemWritableFileStream（不返回 Blob）。
  // 用 OPFS（源私有文件系统）做内存级目的地：导出后读回为 Blob 上传，再清理。无需用户手势、隔离环境可用。
  const root = await navigator.storage.getDirectory();
  const tmpName = `vf-export-${Date.now()}.mp4`;
  const handle = await root.getFileHandle(tmpName, { create: true });
  const writable = await handle.createWritable();

  let result: ExportResult | undefined;
  try {
    const generator = engine.exportVideo(project, settings, writable);
    while (true) {
      const step = await generator.next();
      if (step.done) {
        result = step.value;
        break;
      }
      opts.onProgress?.({ progress: step.value.progress, phase: step.value.phase });
    }
  } catch (err) {
    await root.removeEntry(tmpName).catch(() => undefined);
    throw err;
  }

  if (!result || !result.success) {
    await root.removeEntry(tmpName).catch(() => undefined);
    const message = result && "error" in result && result.error ? result.error.message : "导出失败";
    throw new Error(message);
  }

  try {
    const file = await handle.getFile();
    return await uploadExportBlob(opts.projectId, file, opts.resolution, project.timeline.duration || 0);
  } finally {
    await root.removeEntry(tmpName).catch(() => undefined);
  }
}
