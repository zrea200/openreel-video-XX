import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  RetouchingSection,
  type BrushConfig,
  type RetouchingTool,
} from "./RetouchingSection";

const brushConfig: BrushConfig = {
  size: 48,
  hardness: 0.6,
  opacity: 0.8,
  flow: 0.5,
};

function renderSection(activeTool: RetouchingTool) {
  render(
    <RetouchingSection
      activeTool={activeTool}
      brushConfig={brushConfig}
      cloneSource={null}
      onToolChange={vi.fn()}
      onBrushSizeChange={vi.fn()}
      onBrushHardnessChange={vi.fn()}
      onBrushOpacityChange={vi.fn()}
      onBrushFlowChange={vi.fn()}
      onClearCloneSource={vi.fn()}
    />,
  );
}

describe("RetouchingSection", () => {
  it("renders localized usage instructions for spot healing", () => {
    renderSection("spotHeal");

    expect(screen.getByText("使用说明")).toBeInTheDocument();
    expect(
      screen.getByText(
        "在瑕疵区域点击并拖动即可移除；工具会采样周围像素并自然融合。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "在瑕疵区域点击并拖动即可移除；工具会采样周围像素并自然融合。",
      ),
    ).toHaveClass("break-words");
  });

  it("renders localized usage instructions for clone stamp", () => {
    renderSection("cloneStamp");

    expect(
      screen.getByText("按 Alt 并点击设置取样点，然后涂抹目标区域以复制像素。"),
    ).toBeInTheDocument();
  });

  it("renders localized usage instructions for red-eye removal", () => {
    renderSection("redEyeRemoval");

    expect(
      screen.getByText("点击红眼位置，自动检测并移除红眼效果。"),
    ).toBeInTheDocument();
  });
});
