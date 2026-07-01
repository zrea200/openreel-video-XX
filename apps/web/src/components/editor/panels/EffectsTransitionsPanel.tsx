import React, { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input, ScrollArea } from "@openreel/ui";
import { useProjectStore } from "../../../stores/project-store";
import { useUIStore } from "../../../stores/ui-store";
import { toast } from "../../../stores/notification-store";
import type {
  VideoEffectType,
} from "../../../bridges/effects-bridge";
import type { TransitionType } from "@openreel/core";

// ─── Effect & Transition catalogs ──────────────────────────────────
// Each item ships with a small CSS recipe used to animate the live
// preview thumbnail. The thumbnail itself comes from the user's
// currently-selected clip when available, falling back to a gradient.

type EffectCategory =
  | "Basic"
  | "Color"
  | "Blur"
  | "Creative"
  | "Stylize";

interface EffectDef {
  type: VideoEffectType;
  label: string;
  description: string;
  category: EffectCategory;
  /** Returns a CSS filter / transform / opacity string for the preview
   *  given an animation progress p in [0, 1] (or a paused 0.5 hover state). */
  previewStyle: (p: number) => React.CSSProperties;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const EFFECT_CATEGORY_LABELS: Record<EffectCategory, string> = {
  Basic: "基础",
  Color: "色彩",
  Blur: "模糊",
  Creative: "创意",
  Stylize: "风格化",
};

const EFFECTS: EffectDef[] = [
  {
    type: "brightness",
    label: "亮度",
    description: "提升中间调与高光",
    category: "Basic",
    previewStyle: (p) => ({ filter: `brightness(${lerp(0.9, 1.6, p)})` }),
  },
  {
    type: "contrast",
    label: "对比度",
    description: "增强阴影与高光层次",
    category: "Basic",
    previewStyle: (p) => ({ filter: `contrast(${lerp(0.8, 1.8, p)})` }),
  },
  {
    type: "saturation",
    label: "饱和度",
    description: "增强或降低色彩强度",
    category: "Basic",
    previewStyle: (p) => ({ filter: `saturate(${lerp(0.5, 2.0, p)})` }),
  },
  {
    type: "temperature",
    label: "色温",
    description: "暖色 / 冷色偏移",
    category: "Color",
    previewStyle: (p) => ({
      filter: `sepia(${lerp(0, 0.6, p)}) hue-rotate(${lerp(-12, 12, p)}deg)`,
    }),
  },
  {
    type: "tint",
    label: "色调",
    description: "洋红 / 绿色偏移",
    category: "Color",
    previewStyle: (p) => ({
      filter: `hue-rotate(${lerp(0, 60, p)}deg)`,
    }),
  },
  {
    type: "hue",
    label: "色相",
    description: "旋转色轮",
    category: "Color",
    previewStyle: (p) => ({
      filter: `hue-rotate(${lerp(0, 360, p)}deg)`,
    }),
  },
  {
    type: "blur",
    label: "模糊",
    description: "高斯柔焦",
    category: "Blur",
    previewStyle: (p) => ({ filter: `blur(${lerp(0, 6, p)}px)` }),
  },
  {
    type: "motion-blur",
    label: "动态模糊",
    description: "方向性拖影",
    category: "Blur",
    previewStyle: (p) => ({
      filter: `blur(${lerp(0, 3, p)}px)`,
      transform: `translateX(${lerp(0, 6, p)}px)`,
    }),
  },
  {
    type: "radial-blur",
    label: "径向模糊",
    description: "缩放式径向动态模糊",
    category: "Blur",
    previewStyle: (p) => ({
      filter: `blur(${lerp(0, 4, p)}px)`,
      transform: `scale(${lerp(1, 1.12, p)})`,
    }),
  },
  {
    type: "sharpen",
    label: "锐化",
    description: "反遮罩边缘增强",
    category: "Creative",
    previewStyle: (p) => ({
      filter: `contrast(${lerp(1, 1.4, p)}) brightness(${lerp(1, 1.05, p)})`,
    }),
  },
  {
    type: "vignette",
    label: "暗角",
    description: "边缘压暗以突出主体",
    category: "Creative",
    previewStyle: (p) => ({
      boxShadow: `inset 0 0 ${lerp(0, 50, p)}px ${lerp(0, 25, p)}px rgba(0,0,0,0.65)`,
    }),
  },
  {
    type: "grain",
    label: "胶片颗粒",
    description: "模拟胶片质感",
    category: "Creative",
    previewStyle: (p) => ({
      filter: `contrast(${lerp(1, 1.1, p)})`,
      opacity: lerp(1, 0.92, p),
    }),
  },
  {
    type: "shadow",
    label: "投影",
    description: "添加柔和阴影",
    category: "Stylize",
    previewStyle: (p) => ({
      filter: `drop-shadow(${lerp(0, 4, p)}px ${lerp(0, 4, p)}px ${lerp(0, 8, p)}px rgba(0,0,0,0.6))`,
    }),
  },
  {
    type: "glow",
    label: "发光",
    description: "明亮外沿光晕",
    category: "Stylize",
    previewStyle: (p) => ({
      filter: `brightness(${lerp(1, 1.15, p)}) drop-shadow(0 0 ${lerp(0, 12, p)}px var(--accent))`,
    }),
  },
  {
    type: "chromatic-aberration",
    label: "色差",
    description: "RGB 通道分离偏移",
    category: "Stylize",
    previewStyle: (p) => ({
      filter: `hue-rotate(${lerp(0, 6, p)}deg)`,
      textShadow: `${lerp(0, 2, p)}px 0 red, ${lerp(0, -2, p)}px 0 cyan`,
    }),
  },
];

const EFFECT_CATEGORIES: EffectCategory[] = [
  "Basic",
  "Color",
  "Blur",
  "Creative",
  "Stylize",
];

interface TransitionDef {
  type: TransitionType;
  label: string;
  description: string;
  /** Render the preview as two colored panels animated according to
   *  this transition's progress p in [0, 1]. */
  renderPreview: (
    p: number,
    thumbUrl: string | null,
  ) => React.ReactElement;
}

const renderThumb = (
  thumbUrl: string | null,
  style: React.CSSProperties,
  tint: string,
): React.ReactElement => (
  <div className="absolute inset-0 overflow-hidden" style={style}>
    {thumbUrl ? (
      <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
    ) : (
      <div
        className="w-full h-full"
        style={{
          background: `linear-gradient(135deg, ${tint}, oklch(0.45 0.12 200))`,
        }}
      />
    )}
  </div>
);

const TRANSITIONS: TransitionDef[] = [
  {
    type: "crossfade",
    label: "交叉淡化",
    description: "平滑透明度过渡",
    renderPreview: (p, thumb) => (
      <>
        {renderThumb(thumb, { opacity: 1 - p }, "oklch(0.55 0.14 295)")}
        {renderThumb(thumb, { opacity: p }, "oklch(0.72 0.16 162)")}
      </>
    ),
  },
  {
    type: "dipToBlack",
    label: "淡入黑场",
    description: "经黑场过渡",
    renderPreview: (p, thumb) => (
      <>
        {renderThumb(thumb, { opacity: p < 0.5 ? 1 - p * 2 : 0 }, "oklch(0.55 0.14 295)")}
        {renderThumb(thumb, { opacity: p >= 0.5 ? (p - 0.5) * 2 : 0 }, "oklch(0.72 0.16 162)")}
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: p < 0.5 ? p * 2 : (1 - p) * 2 }}
        />
      </>
    ),
  },
  {
    type: "dipToWhite",
    label: "淡入白场",
    description: "经白场过渡",
    renderPreview: (p, thumb) => (
      <>
        {renderThumb(thumb, { opacity: p < 0.5 ? 1 - p * 2 : 0 }, "oklch(0.55 0.14 295)")}
        {renderThumb(thumb, { opacity: p >= 0.5 ? (p - 0.5) * 2 : 0 }, "oklch(0.72 0.16 162)")}
        <div
          className="absolute inset-0 bg-white pointer-events-none"
          style={{ opacity: p < 0.5 ? p * 2 : (1 - p) * 2 }}
        />
      </>
    ),
  },
  {
    type: "wipe",
    label: "划像",
    description: "硬边扫过切换",
    renderPreview: (p, thumb) => (
      <>
        {renderThumb(thumb, { clipPath: `inset(0 ${p * 100}% 0 0)` }, "oklch(0.55 0.14 295)")}
        {renderThumb(thumb, { clipPath: `inset(0 0 0 ${(1 - p) * 100}%)` }, "oklch(0.72 0.16 162)")}
      </>
    ),
  },
  {
    type: "slide",
    label: "滑入",
    description: "新片段滑入画面",
    renderPreview: (p, thumb) => (
      <>
        {renderThumb(thumb, { transform: `translateX(${-p * 100}%)` }, "oklch(0.55 0.14 295)")}
        {renderThumb(thumb, { transform: `translateX(${(1 - p) * 100}%)` }, "oklch(0.72 0.16 162)")}
      </>
    ),
  },
  {
    type: "push",
    label: "推挤",
    description: "旧片段被推出画面",
    renderPreview: (p, thumb) => (
      <>
        {renderThumb(thumb, { transform: `translateX(${-p * 100}%)` }, "oklch(0.55 0.14 295)")}
        {renderThumb(thumb, { transform: `translateX(${(1 - p) * 100}%)` }, "oklch(0.72 0.16 162)")}
      </>
    ),
  },
  {
    type: "zoom",
    label: "缩放",
    description: "放大并溶解切换",
    renderPreview: (p, thumb) => (
      <>
        {renderThumb(
          thumb,
          { transform: `scale(${1 + p * 1.5})`, opacity: 1 - p },
          "oklch(0.55 0.14 295)",
        )}
        {renderThumb(
          thumb,
          { transform: `scale(${1.5 - p * 0.5})`, opacity: p },
          "oklch(0.72 0.16 162)",
        )}
      </>
    ),
  },
];

// ─── Drag payload helpers ──────────────────────────────────────────
export const EFFECT_DRAG_MIME = "application/x-openreel-effect";
export const TRANSITION_DRAG_MIME = "application/x-openreel-transition";

const PREVIEW_CYCLE_MS = 1800;

// ─── Cards ────────────────────────────────────────────────────────

const EffectCard: React.FC<{
  def: EffectDef;
  thumbUrl: string | null;
  onApply: () => void;
}> = ({ def, thumbUrl, onApply }) => {
  const [progress, setProgress] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!isHover) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setProgress(0);
      return;
    }
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startRef.current) % PREVIEW_CYCLE_MS;
      const t = elapsed / PREVIEW_CYCLE_MS;
      // Ping-pong so the effect intensifies then relaxes
      const eased = t < 0.5 ? t * 2 : (1 - t) * 2;
      setProgress(eased);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHover]);

  const previewStyle = def.previewStyle(progress);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.dataTransfer.effectAllowed = "copy";
      const payload = JSON.stringify({ effectType: def.type });
      e.dataTransfer.setData(EFFECT_DRAG_MIME, payload);
      // Fallback for browsers that don't surface custom MIME types
      e.dataTransfer.setData("text/plain", `effect:${def.type}`);
    },
    [def.type],
  );

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={onApply}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      title={`拖到片段上应用 • 双击应用到选中片段`}
      className="group relative flex flex-col items-stretch rounded-lg border border-border bg-bg-2 overflow-hidden text-left cursor-grab active:cursor-grabbing hover:border-accent transition-colors"
    >
      <div className="relative aspect-video bg-bg-3 overflow-hidden">
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={previewStyle}
            draggable={false}
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.55 0.14 295), oklch(0.72 0.16 162))",
              ...previewStyle,
            }}
          />
        )}
        <span className="absolute bottom-1 right-1 text-[8.5px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/55 text-white/85 backdrop-blur-sm">
          {EFFECT_CATEGORY_LABELS[def.category]}
        </span>
      </div>
      <div className="px-2 py-1.5 border-t border-border">
        <div className="text-[10.5px] font-medium text-fg leading-tight">
          {def.label}
        </div>
        <div className="text-[9.5px] text-fg-muted leading-tight mt-0.5 line-clamp-1">
          {def.description}
        </div>
      </div>
    </button>
  );
};

const TransitionCard: React.FC<{
  def: TransitionDef;
  thumbUrl: string | null;
}> = ({ def, thumbUrl }) => {
  const [progress, setProgress] = useState(0);
  const [isHover, setIsHover] = useState(false);
  const rafRef = React.useRef<number | null>(null);
  const startRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!isHover) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setProgress(0);
      return;
    }
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startRef.current) % PREVIEW_CYCLE_MS;
      setProgress(elapsed / PREVIEW_CYCLE_MS);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHover]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.dataTransfer.effectAllowed = "copy";
      const payload = JSON.stringify({ transitionType: def.type });
      e.dataTransfer.setData(TRANSITION_DRAG_MIME, payload);
      e.dataTransfer.setData("text/plain", `transition:${def.type}`);
    },
    [def.type],
  );

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      title="拖到片段边缘（或两片段之间）应用"
      className="group relative flex flex-col items-stretch rounded-lg border border-border bg-bg-2 overflow-hidden text-left cursor-grab active:cursor-grabbing hover:border-accent transition-colors"
    >
      <div className="relative aspect-video bg-bg-3 overflow-hidden">
        {def.renderPreview(progress, thumbUrl)}
      </div>
      <div className="px-2 py-1.5 border-t border-border">
        <div className="text-[10.5px] font-medium text-fg leading-tight">
          {def.label}
        </div>
        <div className="text-[9.5px] text-fg-muted leading-tight mt-0.5 line-clamp-1">
          {def.description}
        </div>
      </div>
    </button>
  );
};

// ─── Hook: thumbnail of the user's currently selected clip ────────

/**
 * Resolve the best available thumbnail URL from the user's current
 * selection. Falls back to the first video clip in the project, then
 * the first imported video, otherwise null (cards show gradients).
 */
const useCurrentClipThumbnail = (): string | null => {
  const project = useProjectStore((s) => s.project);
  const getSelectedClipIds = useUIStore((s) => s.getSelectedClipIds);

  return useMemo(() => {
    const selectedIds = getSelectedClipIds();
    const tracks = project.timeline.tracks;
    const mediaItems = project.mediaLibrary.items;

    const findMediaForClipId = (clipId: string): string | null => {
      for (const track of tracks) {
        const clip = track.clips.find((c) => c.id === clipId);
        if (clip) {
          const item = mediaItems.find((m) => m.id === clip.mediaId);
          if (item?.thumbnailUrl) return item.thumbnailUrl;
        }
      }
      return null;
    };

    for (const id of selectedIds) {
      const thumb = findMediaForClipId(id);
      if (thumb) return thumb;
    }

    // Fallback 1: first clip with a thumbnail
    for (const track of tracks) {
      for (const clip of track.clips) {
        const item = mediaItems.find((m) => m.id === clip.mediaId);
        if (item?.thumbnailUrl) return item.thumbnailUrl;
      }
    }

    // Fallback 2: any media item with a thumbnail
    const firstWithThumb = mediaItems.find((m) => m.thumbnailUrl);
    return firstWithThumb?.thumbnailUrl ?? null;
  }, [project, getSelectedClipIds]);
};

// ─── Main panel ───────────────────────────────────────────────────

export const EffectsPanel: React.FC = () => {
  const thumbUrl = useCurrentClipThumbnail();
  const getSelectedClipIds = useUIStore((s) => s.getSelectedClipIds);
  const addVideoEffect = useProjectStore((s) => s.addVideoEffect);

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EFFECTS;
    return EFFECTS.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        EFFECT_CATEGORY_LABELS[e.category].includes(query.trim()),
    );
  }, [query]);

  const applyToSelection = useCallback(
    (type: VideoEffectType) => {
      const selectedIds = getSelectedClipIds();
      if (selectedIds.length === 0) {
        toast.warning(
          "未选中片段",
          "请将特效拖到时间轴片段上，或先选中片段后双击。",
        );
        return;
      }
      for (const id of selectedIds) {
        addVideoEffect(id, type);
      }
      toast.success(
        "特效已应用",
        `已为 ${selectedIds.length} 个片段添加 ${type}`,
      );
    },
    [getSelectedClipIds, addVideoEffect],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索特效"
            className="pl-8 h-8 text-[11px] bg-bg-2 border-border"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 pb-3 space-y-3">
          {EFFECT_CATEGORIES.map((cat) => {
            const items = filtered.filter((e) => e.category === cat);
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <div className="text-[9.5px] uppercase tracking-wider text-fg-muted mb-1.5">
                  {EFFECT_CATEGORY_LABELS[cat]}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((def) => (
                    <EffectCard
                      key={def.type}
                      def={def}
                      thumbUrl={thumbUrl}
                      onApply={() => applyToSelection(def.type)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center text-[10.5px] text-fg-muted py-6">
              没有与「{query}」匹配的特效。
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export const TransitionsPanel: React.FC = () => {
  const thumbUrl = useCurrentClipThumbnail();

  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TRANSITIONS;
    return TRANSITIONS.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-muted"
          />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索转场"
            className="pl-8 h-8 text-[11px] bg-bg-2 border-border"
          />
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((def) => (
              <TransitionCard key={def.type} def={def} thumbUrl={thumbUrl} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center text-[10.5px] text-fg-muted py-6">
              没有与「{query}」匹配的转场。
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
