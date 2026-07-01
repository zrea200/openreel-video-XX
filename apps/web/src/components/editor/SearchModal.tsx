import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import {
  Search,
  X,
  Video,
  Music2,
  Type,
  Palette,
  Wand2,
  Layers,
  Zap,
  Square,
  Move,
  Focus,
  Clock,
  Eye,
  Sliders,
} from "lucide-react";
import { Dialog, DialogContent, Input } from "@openreel/ui";
import { useUIStore } from "../../stores/ui-store";

interface SearchItem {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  icon: React.ElementType;
  description: string;
  sectionId: string;
  clipTypes: Array<"video" | "audio" | "text" | "shape" | "image">;
}

const CATEGORY_LABELS: Record<string, string> = {
  "Position & Size": "位置与大小",
  Time: "时间",
  Video: "视频",
  Animation: "动画",
  Audio: "音频",
  Text: "文字",
  Shapes: "形状",
};

const SEARCHABLE_EFFECTS: SearchItem[] = [
  {
    id: "transform",
    name: "变换",
    category: "Position & Size",
    keywords: ["position", "scale", "rotate", "move", "resize", "transform", "位置", "缩放", "旋转", "移动"],
    icon: Move,
    description: "调整片段的位置、缩放与旋转",
    sectionId: "transform",
    clipTypes: ["video", "image", "text", "shape"],
  },
  {
    id: "crop",
    name: "裁剪",
    category: "Position & Size",
    keywords: ["crop", "cut", "trim", "frame", "aspect", "裁剪", "裁切", "画面"],
    icon: Focus,
    description: "裁剪并调整画面构图",
    sectionId: "crop",
    clipTypes: ["video", "image"],
  },
  {
    id: "speed",
    name: "速度控制",
    category: "Time",
    keywords: ["speed", "slow", "fast", "time", "duration", "playback", "速度", "慢动作", "快进"],
    icon: Clock,
    description: "控制播放速度与时间重映射",
    sectionId: "speed",
    clipTypes: ["video", "audio"],
  },
  {
    id: "video-effects",
    name: "视频特效",
    category: "Video",
    keywords: ["brightness", "contrast", "saturation", "blur", "sharpen", "vignette", "effects", "亮度", "对比度", "模糊"],
    icon: Sliders,
    description: "亮度、对比度、饱和度、模糊、锐化等",
    sectionId: "video-effects",
    clipTypes: ["video", "image"],
  },
  {
    id: "color-grading",
    name: "调色",
    category: "Video",
    keywords: ["color", "grade", "wheels", "curves", "lut", "hsl", "exposure", "temperature", "调色", "色轮", "曲线"],
    icon: Palette,
    description: "色轮、曲线、LUT 与 HSL 调整",
    sectionId: "color-grading",
    clipTypes: ["video", "image"],
  },
  {
    id: "green-screen",
    name: "绿幕抠像",
    category: "Video",
    keywords: ["green", "screen", "chroma", "key", "background", "remove", "绿幕", "抠像", "蓝幕"],
    icon: Eye,
    description: "绿幕/蓝幕色度键抠像",
    sectionId: "green-screen",
    clipTypes: ["video", "image"],
  },
  {
    id: "background-removal",
    name: "背景移除",
    category: "Video",
    keywords: ["background", "remove", "ai", "mask", "cutout", "person", "背景", "移除", "抠图"],
    icon: Wand2,
    description: "AI 智能背景移除",
    sectionId: "background-removal",
    clipTypes: ["video", "image"],
  },
  {
    id: "masking",
    name: "遮罩",
    category: "Video",
    keywords: ["mask", "shape", "feather", "reveal", "hide", "vignette", "遮罩", "羽化"],
    icon: Layers,
    description: "形状遮罩以显示或隐藏区域",
    sectionId: "masking",
    clipTypes: ["video", "image"],
  },
  {
    id: "motion-tracking",
    name: "运动跟踪",
    category: "Video",
    keywords: ["motion", "track", "follow", "pin", "stabilize", "跟踪", "运动", "稳定"],
    icon: Move,
    description: "跟踪运动并附着元素",
    sectionId: "motion-tracking",
    clipTypes: ["video"],
  },
  {
    id: "pip",
    name: "画中画",
    category: "Video",
    keywords: ["pip", "picture", "overlay", "corner", "position", "画中画", "叠加"],
    icon: Square,
    description: "将片段作为画中画叠加",
    sectionId: "pip",
    clipTypes: ["video", "image"],
  },
  {
    id: "blending",
    name: "混合模式",
    category: "Video",
    keywords: ["blend", "mode", "multiply", "screen", "overlay", "opacity", "混合", "透明度"],
    icon: Layers,
    description: "混合模式与不透明度控制",
    sectionId: "blending",
    clipTypes: ["video", "image"],
  },
  {
    id: "transform-3d",
    name: "3D 变换",
    category: "Video",
    keywords: ["3d", "perspective", "rotate", "flip", "tilt", "三维", "透视"],
    icon: Move,
    description: "3D 旋转与透视效果",
    sectionId: "transform-3d",
    clipTypes: ["video", "image"],
  },
  {
    id: "keyframes",
    name: "关键帧",
    category: "Animation",
    keywords: ["keyframe", "animate", "animation", "ease", "interpolate", "关键帧", "动画"],
    icon: Zap,
    description: "随时间动画化属性",
    sectionId: "keyframes",
    clipTypes: ["video", "image", "text", "shape"],
  },
  {
    id: "transitions",
    name: "转场",
    category: "Animation",
    keywords: ["transition", "fade", "dissolve", "wipe", "slide", "转场", "淡化", "划像"],
    icon: Zap,
    description: "片段之间的转场效果",
    sectionId: "transitions",
    clipTypes: ["video", "image"],
  },
  {
    id: "motion-presets",
    name: "运动预设",
    category: "Animation",
    keywords: ["motion", "preset", "zoom", "pan", "shake", "bounce", "预设", "缩放", "平移"],
    icon: Zap,
    description: "预置的运动动画效果",
    sectionId: "motion-presets",
    clipTypes: ["video", "image"],
  },
  {
    id: "audio-effects",
    name: "音频特效",
    category: "Audio",
    keywords: ["audio", "eq", "equalizer", "compressor", "reverb", "delay", "sound", "均衡", "压缩", "混响"],
    icon: Music2,
    description: "均衡器、压缩器、混响等",
    sectionId: "audio-effects",
    clipTypes: ["audio", "video"],
  },
  {
    id: "audio-ducking",
    name: "音频闪避",
    category: "Audio",
    keywords: ["duck", "ducking", "voice", "music", "fade", "auto", "闪避", "人声", "音乐"],
    icon: Music2,
    description: "人声出现时自动压低背景音乐",
    sectionId: "audio-ducking",
    clipTypes: ["audio", "video"],
  },
  {
    id: "text-properties",
    name: "文字属性",
    category: "Text",
    keywords: ["text", "font", "size", "color", "style", "typography", "文字", "字体", "字号"],
    icon: Type,
    description: "字体、字号、颜色与文字样式",
    sectionId: "text-properties",
    clipTypes: ["text"],
  },
  {
    id: "text-animation",
    name: "文字动画",
    category: "Text",
    keywords: ["text", "animate", "typewriter", "fade", "slide", "bounce", "打字机", "动画"],
    icon: Type,
    description: "使用预设为文字添加动画",
    sectionId: "text-animation",
    clipTypes: ["text"],
  },
  {
    id: "shape-properties",
    name: "形状属性",
    category: "Shapes",
    keywords: ["shape", "fill", "stroke", "corner", "radius", "shadow", "形状", "填充", "描边"],
    icon: Square,
    description: "形状填充、描边与效果",
    sectionId: "shape-properties",
    clipTypes: ["shape"],
  },
];

const CLIP_TYPE_LABELS: Record<string, string> = {
  video: "视频",
  audio: "音频",
  text: "文字",
  shape: "形状",
  image: "图片",
};

const CATEGORIES = [
  { id: "all", name: "全部" },
  { id: "video", name: "视频", icon: Video },
  { id: "audio", name: "音频", icon: Music2 },
  { id: "text", name: "文字", icon: Type },
  { id: "animation", name: "动画", icon: Zap },
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { selectedItems, setPanelVisible } = useUIStore();

  const selectedClipType = useMemo(() => {
    const clipItem = selectedItems.find(
      (item) =>
        item.type === "clip" ||
        item.type === "text-clip" ||
        item.type === "shape-clip",
    );
    if (!clipItem) return null;
    if (clipItem.type === "text-clip") return "text";
    if (clipItem.type === "shape-clip") return "shape";
    return "video";
  }, [selectedItems]);

  const filteredEffects = useMemo(() => {
    let effects = SEARCHABLE_EFFECTS;

    if (selectedClipType) {
      effects = effects.filter((e) =>
        e.clipTypes.includes(
          selectedClipType as "video" | "audio" | "text" | "shape" | "image",
        ),
      );
    }

    if (selectedCategory !== "all") {
      effects = effects.filter((e) =>
        e.category.toLowerCase().includes(selectedCategory.toLowerCase()),
      );
    }

    if (query.trim()) {
      const searchTerms = query.toLowerCase().split(" ");
      effects = effects.filter((e) => {
        const searchText = [e.name, e.description, ...e.keywords, e.category]
          .join(" ")
          .toLowerCase();
        return searchTerms.every((term) => searchText.includes(term));
      });
    }

    return effects;
  }, [query, selectedCategory, selectedClipType]);

  const handleSelect = useCallback(
    (effect: SearchItem) => {
      setPanelVisible("inspector", true);

      setTimeout(() => {
        const sectionElement = document.querySelector(
          `[data-section-id="${effect.sectionId}"]`,
        );
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });

          const button = sectionElement.querySelector("button");
          if (button) {
            button.click();
          }

          sectionElement.classList.add(
            "ring-2",
            "ring-primary",
            "ring-offset-2",
          );
          setTimeout(() => {
            sectionElement.classList.remove(
              "ring-2",
              "ring-primary",
              "ring-offset-2",
            );
          }, 2000);
        }
      }, 100);

      onClose();
    },
    [onClose, setPanelVisible],
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, selectedCategory]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredEffects.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredEffects[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredEffects[selectedIndex]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filteredEffects, selectedIndex, handleSelect]);

  useEffect(() => {
    if (listRef.current && filteredEffects[selectedIndex]) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedIndex, filteredEffects]);

  if (!isOpen) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 gap-0 top-[15vh] translate-y-0 bg-background-secondary border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search size={18} className="text-text-muted" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              selectedClipType
                ? `搜索${CLIP_TYPE_LABELS[selectedClipType] ?? selectedClipType}片段的特效…`
                : "搜索所有特效与工具…"
            }
            className="flex-1 bg-transparent border-0 text-text-primary focus-visible:ring-0"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded hover:bg-background-tertiary text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-background-tertiary border border-border">
            <span className="text-[10px] text-text-muted">ESC</span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background-tertiary/50">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-primary text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-background-elevated"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {filteredEffects.length === 0 ? (
            <div className="py-12 text-center">
              <Search
                size={32}
                className="mx-auto mb-3 text-text-muted opacity-50"
              />
              <p className="text-sm text-text-muted">未找到匹配项</p>
              <p className="text-xs text-text-muted mt-1">
                试试其他关键词或分类
              </p>
            </div>
          ) : (
            <div className="py-2">
              {filteredEffects.map((effect, index) => {
                const Icon = effect.icon;
                return (
                  <button
                    key={effect.id}
                    onClick={() => handleSelect(effect)}
                    className={`w-full flex items-center gap-4 px-4 py-3 text-left transition-all ${
                      index === selectedIndex
                        ? "bg-primary/10 border-l-2 border-primary"
                        : "hover:bg-background-tertiary border-l-2 border-transparent"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        index === selectedIndex
                          ? "bg-primary text-white"
                          : "bg-background-tertiary text-text-secondary"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            index === selectedIndex
                              ? "text-primary"
                              : "text-text-primary"
                          }`}
                        >
                          {effect.name}
                        </span>
                        <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-background-tertiary">
                          {CATEGORY_LABELS[effect.category] ?? effect.category}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {effect.description}
                      </p>
                    </div>
                    <div className="text-[10px] text-text-muted">
                      ↵ 选择
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border bg-background-tertiary/50 flex items-center justify-between">
          <div className="text-[10px] text-text-muted">
            {filteredEffects.length} 项可用
          </div>
          <div className="flex items-center gap-3 text-[10px] text-text-muted">
            <span>↑↓ 导航</span>
            <span>↵ 选择</span>
            <span>ESC 关闭</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;
