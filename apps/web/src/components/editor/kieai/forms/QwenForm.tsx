import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button } from "@openreel/ui";
import type { QwenInput } from "../../../../services/kieai/image-generation";

interface Props {
  value: QwenInput;
  onChange: (v: QwenInput) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function QwenForm({ value, onChange, onSubmit, isLoading }: Props) {
  const strength = value.strength ?? 0.8;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">提示词 *</label>
        <textarea
          value={value.prompt}
          onChange={(e) => onChange({ ...value, prompt: e.target.value })}
          placeholder="描述你想生成的图像…"
          maxLength={2000}
          rows={4}
          className="w-full rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-primary"
        />
        <p className="text-[10px] text-text-muted text-right">{value.prompt.length}/2000</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">
          强度 — {strength.toFixed(1)}
          <span className="ml-2 text-text-muted font-normal">（0 = 保留原图，1 = 完全重绘）</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={strength}
          onChange={(e) => onChange({ ...value, strength: parseFloat(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-text-muted">
          <span>保留</span>
          <span>重绘</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">格式</label>
          <Select
            value={value.output_format ?? "png"}
            onValueChange={(v) => onChange({ ...value, output_format: v as QwenInput["output_format"] })}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">加速</label>
          <Select
            value={value.acceleration ?? "regular"}
            onValueChange={(v) => onChange({ ...value, acceleration: v as QwenInput["acceleration"] })}
          >
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">无（最佳画质）</SelectItem>
              <SelectItem value="regular">常规</SelectItem>
              <SelectItem value="high">高（最快）</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-text-secondary">反向提示词（可选）</label>
        <textarea
          value={value.negative_prompt ?? ""}
          onChange={(e) => onChange({ ...value, negative_prompt: e.target.value || undefined })}
          placeholder="描述你不希望出现在结果中的内容…"
          maxLength={500}
          rows={2}
          className="w-full rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-primary"
        />
      </div>

      <Button onClick={onSubmit} disabled={isLoading || !value.prompt.trim()} className="w-full">
        {isLoading ? "生成中…" : "使用 Qwen 生成"}
      </Button>
    </div>
  );
}
