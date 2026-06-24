/**
 * VF 嵌入式桥接（OpenReel 子侧 overlay）。
 *
 * 这是为在 XixingPlatform Step5 以 iframe 嵌入 OpenReel 而加的最小 overlay，
 * 不改 OpenReel 既有逻辑：仅在 URL 带 `projectId` + `parentOrigin` 且处于 iframe 中时启用。
 *
 * Phase 2：仅完成 READY / VF_INIT_PROJECT 握手（回 OPENREEL_INIT_ACK / OPENREEL_INIT_ERROR）。
 * Phase 3 将在收到 VF_INIT_PROJECT 时把项目种子注入 OpenReel store；Phase 4 处理导出回传。
 *
 * 协议与父侧 `XixingPlatform/src/features/video-factory/openreel-bridge` 对齐（大版本 vf-openreel-bridge/1）。
 */

import { seedOpenReelFromVf, type VfSeed } from "./seed-openreel";
import {
  restoreOpenReelFromSnapshot,
  serializeOpenReelSnapshot,
  startOpenReelAutoSave,
} from "./persist-openreel";
import { exportOpenReelAndUpload, type ExportResolution } from "./export-openreel";

const BRIDGE_VERSION = "vf-openreel-bridge/1";
const PARENT_SOURCE = "xixing-platform";
const CHILD_SOURCE = "openreel-editor";

type BridgeType =
  | "OPENREEL_READY"
  | "VF_INIT_PROJECT"
  | "OPENREEL_INIT_ACK"
  | "OPENREEL_INIT_ERROR"
  | "OPENREEL_SAVE_REQUEST"
  | "VF_SAVE_RESULT"
  | "VF_EXPORT_REQUEST"
  | "OPENREEL_EXPORT_PROGRESS"
  | "OPENREEL_EXPORT_DONE"
  | "OPENREEL_EXPORT_ERROR";

interface BridgeEnvelope<TPayload = Record<string, unknown>> {
  version: typeof BRIDGE_VERSION;
  type: BridgeType;
  requestId: string;
  source: typeof PARENT_SOURCE | typeof CHILD_SOURCE;
  projectId: string;
  sentAt: string;
  payload: TPayload;
}

function makeRequestId(reason: string): string {
  return `openreel-${reason}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeChildEnvelope<TPayload extends Record<string, unknown>>(
  type: BridgeType,
  projectId: string,
  requestId: string,
  payload: TPayload,
): BridgeEnvelope<TPayload> {
  return {
    version: BRIDGE_VERSION,
    type,
    requestId,
    source: CHILD_SOURCE,
    projectId,
    sentAt: new Date().toISOString(),
    payload,
  };
}

function isParentEnvelope(value: unknown): value is BridgeEnvelope {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    c.version === BRIDGE_VERSION &&
    typeof c.type === "string" &&
    typeof c.requestId === "string" &&
    (c.requestId as string).length > 0 &&
    c.source === PARENT_SOURCE &&
    typeof c.projectId === "string" &&
    (c.projectId as string).length > 0 &&
    !!c.payload &&
    typeof c.payload === "object"
  );
}

function initVfBridge(): void {
  if (typeof window === "undefined") return;
  if (window.parent === window) return; // 非 iframe，独立打开

  const params = new URLSearchParams(window.location.search);
  const projectId = params.get("projectId");
  const parentOrigin = params.get("parentOrigin");
  if (!projectId || !parentOrigin) return; // 非 VF 嵌入模式

  let connected = false;

  const reply = (type: BridgeType, requestId: string, payload: Record<string, unknown>) => {
    window.parent.postMessage(makeChildEnvelope(type, projectId, requestId, payload), parentOrigin);
  };

  let autosaveStarted = false;
  const startAutosaveOnce = () => {
    if (autosaveStarted) return;
    autosaveStarted = true;
    startOpenReelAutoSave((snapshot) => {
      reply("OPENREEL_SAVE_REQUEST", makeRequestId("save"), { snapshot });
    });
  };

  const handleInit = async (
    requestId: string,
    payload: { mode?: string; seed?: VfSeed; snapshot?: unknown },
  ) => {
    try {
      if (payload.mode === "restore" && payload.snapshot != null) {
        await restoreOpenReelFromSnapshot(payload.snapshot);
      } else if (payload.seed) {
        await seedOpenReelFromVf(payload.seed);
        // 种子完成后立即落库基线：替换旧格式遗留数据，并使下次重入走 restore（不再重复种子）。
        reply("OPENREEL_SAVE_REQUEST", makeRequestId("save"), {
          snapshot: serializeOpenReelSnapshot(),
        });
      }
      reply("OPENREEL_INIT_ACK", requestId, { accepted: true });
      startAutosaveOnce();
    } catch (err) {
      reply("OPENREEL_INIT_ERROR", requestId, {
        message: err instanceof Error ? err.message : "OpenReel 初始化失败",
      });
    }
  };

  window.addEventListener("message", (event: MessageEvent) => {
    if (event.origin !== parentOrigin) return;
    if (!isParentEnvelope(event.data)) return;
    if (event.data.projectId !== projectId) return;

    if (event.data.type === "VF_INIT_PROJECT") {
      connected = true;
      void handleInit(
        event.data.requestId,
        event.data.payload as { mode?: string; seed?: VfSeed; snapshot?: unknown },
      );
    }

    if (event.data.type === "VF_EXPORT_REQUEST") {
      const reqId = event.data.requestId;
      const resolution =
        ((event.data.payload as { resolution?: ExportResolution }).resolution as ExportResolution) ||
        "1080p";
      void (async () => {
        try {
          const output = await exportOpenReelAndUpload({
            projectId,
            resolution,
            onProgress: (info) => reply("OPENREEL_EXPORT_PROGRESS", reqId, info),
          });
          reply("OPENREEL_EXPORT_DONE", reqId, { output });
        } catch (err) {
          reply("OPENREEL_EXPORT_ERROR", reqId, {
            message: err instanceof Error ? err.message : "导出失败",
          });
        }
      })();
    }
  });

  // 向父发送 READY 并持续重发直到收到 INIT。父页（重 bundle）监听器可能较晚挂载，
  // 仅几次重试会全部错过导致父侧误报"连接失败"，故延长重发窗口（~30s）。
  let attempts = 0;
  const sendReady = () => {
    if (connected || attempts >= 60) return;
    attempts += 1;
    const ready = makeChildEnvelope("OPENREEL_READY", projectId, makeRequestId("ready"), {});
    window.parent.postMessage(ready, parentOrigin);
    window.setTimeout(sendReady, 500);
  };
  sendReady();
}

initVfBridge();
