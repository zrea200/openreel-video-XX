export interface MoGraphTourStep {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  position: "top" | "bottom" | "left" | "right";
  tips?: string[];
}

export const MOGRAPH_TOUR_STEPS: MoGraphTourStep[] = [
  {
    id: "welcome",
    title: "欢迎使用动效编辑",
    description:
      "OpenReel 的动效工具可让您为视频添加专业级动态图形。本引导将带您了解核心功能。",
    targetSelector: "[data-tour='preview']",
    position: "bottom",
    tips: [
      "动效片段可叠加在视频上",
      "支持关键帧动画",
      "实时预览效果",
    ],
  },
  {
    id: "add-graphics",
    title: "添加图形与文字",
    description:
      "使用时间轴工具栏添加形状、文字、贴纸和 SVG 图形。点击 + 按钮选择要添加的图形类型。",
    targetSelector: "[data-tour='add-clip']",
    position: "top",
    tips: [
      "形状：矩形、圆形、三角形等",
      "文字：可自定义字体与样式",
      "贴纸：表情与装饰元素",
    ],
  },
  {
    id: "transform",
    title: "变换属性",
    description:
      "选中图形片段后，在检查器的「变换」标签中调整位置、缩放、旋转与不透明度。",
    targetSelector: "[data-tour='inspector']",
    position: "left",
    tips: [
      "拖动预览中的控制点可快速变换",
      "按住 Shift 可等比缩放",
      "数值可精确输入",
    ],
  },
  {
    id: "keyframes",
    title: "关键帧动画",
    description:
      "在「动画」标签中为任意属性添加关键帧。在时间轴上移动播放头并修改属性，即可创建流畅动画。",
    targetSelector: "[data-tour='timeline']",
    position: "top",
    tips: [
      "点击菱形按钮添加关键帧",
      "右键关键帧可调整缓动",
      "支持复制与粘贴关键帧",
    ],
  },
  {
    id: "text-styling",
    title: "文字样式",
    description:
      "文字片段拥有丰富的样式选项：字体、颜色、描边、阴影与背景。在检查器的「样式」标签中自定义外观。",
    targetSelector: "[data-tour='inspector']",
    position: "left",
    tips: [
      "从 Google Fonts 选择字体",
      "添加描边增强可读性",
      "使用阴影营造层次感",
    ],
  },
  {
    id: "effects",
    title: "特效与混合",
    description:
      "为图形片段应用模糊、发光等特效。混合模式可控制图层与下方内容的叠加方式。",
    targetSelector: "[data-tour='inspector']",
    position: "left",
    tips: [
      "模糊适合景深效果",
      "发光可突出重要元素",
      "尝试不同混合模式",
    ],
  },
  {
    id: "complete",
    title: "准备开拍！",
    description:
      "您已掌握动效编辑基础。尽情尝试，打造精彩动态图形吧！",
    targetSelector: "[data-tour='preview']",
    position: "bottom",
    tips: [
      "按 ? 查看键盘快捷键",
      "导出时动效会一并渲染",
      "有问题可查阅文档",
    ],
  },
];

export const MOGRAPH_TOUR_KEY = "openreel-mograph-onboarding-complete-zh-v1";
