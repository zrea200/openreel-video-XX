export interface TourStep {
  id: string;
  target: string | null;
  title: string;
  description: string;
  tips?: string[];
  position: "center" | "top" | "bottom" | "left" | "right";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    target: null,
    title: "欢迎使用 OpenReel",
    description: "我们快速带你了解一下这个编辑器",
    position: "center",
  },
  {
    id: "assets",
    target: "[data-tour='assets']",
    title: "素材面板",
    description: "你的创作工具箱。导入媒体、用 AI 生成内容、添加形状、贴纸和自定义 SVG。",
    tips: [
      "拖拽视频、音频、图片到这里",
      "AI 生成标签页：用 AI 生成图片和背景",
      "形状与自定义 SVG 导入",
      "贴纸、背景与叠加层",
    ],
    position: "right",
  },
  {
    id: "timeline",
    target: "[data-tour='timeline']",
    title: "时间轴",
    description: "排列和剪辑你的片段。拖动可移动，拖动边缘可裁剪。",
    tips: ["按 S 键分割片段", "空格键播放/暂停", "滚动以缩放"],
    position: "top",
  },
  {
    id: "preview",
    target: "[data-tour='preview']",
    title: "预览",
    description: "编辑时实时观看你的视频。",
    tips: [
      "方向键逐帧浏览",
      "点击可拖动播放进度",
      "支持全屏",
    ],
    position: "left",
  },
  {
    id: "inspector",
    target: "[data-tour='inspector']",
    title: "属性检查器",
    description:
      "选中片段查看其属性。添加特效、调整颜色、制作动画。",
    tips: [
      "变换、特效、调色",
      "为任意属性打关键帧",
      "AI 智能工具",
    ],
    position: "left",
  },
  {
    id: "complete",
    target: null,
    title: "准备就绪！",
    description: "开始创作吧！随时按 ? 查看快捷键。",
    position: "center",
  },
];

// 文案改为中文后变更 key，使此前已看过英文引导的用户能重新看到中文版引导。
export const ONBOARDING_KEY = "openreel-onboarding-complete-zh-v1";
