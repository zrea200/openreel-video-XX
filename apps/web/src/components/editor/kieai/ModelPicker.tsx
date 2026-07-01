import { IMAGE_MODELS, type ImageModelId } from "../../../services/kieai/image-generation";

interface ModelInfo {
  id: ImageModelId;
  name: string;
  description: string;
  badge?: string;
}

const MODELS: ModelInfo[] = [
  {
    id: IMAGE_MODELS.SEEDREAM,
    name: "Seedream 5 Lite",
    description: "高质量图生图，支持宽高比与画质控制，最高 4K 输出。",
    badge: "4K",
  },
  {
    id: IMAGE_MODELS.Z_IMAGE,
    name: "Z-Image",
    description: "文生图。源图仅作灵感参考。",
    badge: "文生图",
  },
  {
    id: IMAGE_MODELS.NANO_BANANA2,
    name: "Nano Banana 2",
    description: "多功能生成，支持多种宽高比与分辨率。",
    badge: "通用",
  },
  {
    id: IMAGE_MODELS.FLUX2,
    name: "Flux 2 Pro",
    description: "专业图生图，最多 8 张参考图，2K 输出。",
    badge: "Pro",
  },
  {
    id: IMAGE_MODELS.GROK,
    name: "Grok Imagine",
    description: "风格与构图迁移，可选提示词引导。",
    badge: "风格",
  },
  {
    id: IMAGE_MODELS.QWEN,
    name: "Qwen",
    description: "精细控制图像变换强度与画质。",
    badge: "可控",
  },
];

interface Props {
  onSelect: (model: ImageModelId) => void;
}

export function ModelPicker({ onSelect }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-text-muted">选择模型，基于源图生成新图像。</p>
      <div className="grid grid-cols-1 gap-2">
        {MODELS.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className="flex items-start gap-3 rounded-lg border border-border bg-background-elevated p-3 text-left hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{m.name}</span>
                {m.badge && (
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/15 text-primary">
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-text-muted leading-relaxed">{m.description}</p>
            </div>
            <svg
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
