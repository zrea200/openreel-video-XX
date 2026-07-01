/** Shared constants and helpers for KieAI model forms */

export const ASPECT_RATIO_OPTIONS = [
  { value: "1:1", label: "1:1  方形" },
  { value: "4:3", label: "4:3  横向" },
  { value: "3:4", label: "3:4  竖向" },
  { value: "16:9", label: "16:9 宽屏" },
  { value: "9:16", label: "9:16 竖屏" },
  { value: "2:3", label: "2:3  竖向" },
  { value: "3:2", label: "3:2  横向" },
  { value: "21:9", label: "21:9 电影" },
] as const;

export const ASPECT_RATIO_OPTIONS_AUTO = [
  { value: "auto", label: "自动" },
  ...ASPECT_RATIO_OPTIONS,
  { value: "1:4", label: "1:4  超高" },
  { value: "4:1", label: "4:1  超宽" },
  { value: "1:8", label: "1:8  极窄" },
  { value: "8:1", label: "8:1  极宽" },
  { value: "4:5", label: "4:5  竖向" },
  { value: "5:4", label: "5:4  横向" },
] as const;

export const ASPECT_RATIO_OPTIONS_BASIC = [
  { value: "1:1", label: "1:1  方形" },
  { value: "4:3", label: "4:3  横向" },
  { value: "3:4", label: "3:4  竖向" },
  { value: "16:9", label: "16:9 宽屏" },
  { value: "9:16", label: "9:16 竖屏" },
] as const;
