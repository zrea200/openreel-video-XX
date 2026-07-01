/** 将 core / store 英文键映射为界面显示文案（不改程序 id / type） */

const STATIC_ACTION_LABELS: Record<string, string> = {
  "Add clip": "添加片段",
  "Delete clip": "删除片段",
  "Move clip": "移动片段",
  "Trim clip": "修剪片段",
  "Split clip": "分割片段",
  "Ripple delete": "波纹删除",
  "Duplicate clip": "复制片段",
  "Remove track": "删除轨道",
  "Remove effect": "移除效果",
  "Update effect": "更新效果",
  "Transform clip": "变换片段",
  "Remove keyframe": "删除关键帧",
  "Remove transition": "删除转场",
  "Adjust volume": "调整音量",
  "Adjust fade": "调整淡入淡出",
  "Add subtitle": "添加字幕",
  "Remove subtitle": "删除字幕",
  "Rename project": "重命名项目",
  "Update settings": "更新设置",
  "Import media": "导入媒体",
  "Delete media": "删除媒体",
  "Close gap": "闭合间隙",
  "Remove gaps": "移除间隙",
  "Restore positions": "恢复位置",
  "Move clips": "移动片段",
};

const TRACK_TYPE_LABELS: Record<string, string> = {
  video: "视频",
  audio: "音频",
  image: "图像",
  text: "文字",
  graphics: "图形",
};

export function formatActionHistoryDescription(description: string): string {
  const exact = STATIC_ACTION_LABELS[description];
  if (exact) return exact;

  let match = description.match(/^Add (\w+) track$/);
  if (match) {
    const type = TRACK_TYPE_LABELS[match[1]] ?? match[1];
    return `添加${type}轨道`;
  }

  match = description.match(/^Add (\S+) effect$/);
  if (match) return `添加 ${match[1]} 效果`;

  match = description.match(/^Add (.+) keyframe$/);
  if (match) return `添加 ${match[1]} 关键帧`;

  match = description.match(/^Add (\S+) transition$/);
  if (match) return `添加 ${match[1]} 转场`;

  match = description.match(/^Apply (.+)$/);
  if (match) return `应用「${match[1]}」`;

  match = description.match(/^Update (.+)$/);
  if (match) return `更新「${match[1]}」`;

  match = description.match(/^(\w+): (\w+)$/);
  if (match) return `${match[1]}：${match[2]}`;

  return description;
}

export const MUSIC_GENRE_LABELS: Record<string, string> = {
  electronic: "电子",
  cinematic: "电影",
  pop: "流行",
  rock: "摇滚",
  "hip-hop": "嘻哈",
  jazz: "爵士",
  classical: "古典",
  ambient: "氛围",
  lofi: "低保真",
  corporate: "商务",
  upbeat: "轻快",
  dramatic: "戏剧",
};

export const SFX_CATEGORY_LABELS: Record<string, string> = {
  transitions: "转场",
  whoosh: "嗖声",
  impacts: "撞击",
  ui: "界面音效",
  nature: "自然",
  human: "人声",
  mechanical: "机械",
  musical: "音乐性",
  cartoon: "卡通",
  horror: "恐怖",
  "sci-fi": "科幻",
};

export const MOOD_TAG_LABELS: Record<string, string> = {
  happy: "欢快",
  sad: "悲伤",
  energetic: "活力",
  calm: "平静",
  tense: "紧张",
  romantic: "浪漫",
  inspiring: "励志",
  mysterious: "神秘",
  playful: "俏皮",
  dark: "阴暗",
  bright: "明亮",
  nostalgic: "怀旧",
};

export const FILTER_PRESET_LABELS: Record<
  string,
  { name: string; description: string }
> = {
  "cinematic-teal-orange": {
    name: "青橙电影",
    description: "经典好莱坞调色",
  },
  "cinematic-noir": {
    name: "黑色电影",
    description: "高对比黑白",
  },
  "cinematic-blockbuster": {
    name: "大片风格",
    description: "鲜明有力的好莱坞观感",
  },
  "vintage-70s": {
    name: "70 年代复古",
    description: "温暖褪色的 70 年代美学",
  },
  "vintage-polaroid": {
    name: "宝丽来",
    description: "经典即时成像观感",
  },
  "vintage-vhs": {
    name: "VHS 录像带",
    description: "怀旧录像带效果",
  },
  "vintage-sepia": {
    name: "复古棕褐",
    description: "经典棕褐色调",
  },
  "mood-dreamy": {
    name: "梦幻",
    description: "柔和空灵的氛围",
  },
  "mood-moody": {
    name: "阴郁",
    description: "暗沉压抑的氛围",
  },
  "mood-golden-hour": {
    name: "黄金时刻",
    description: "温暖日落光线",
  },
  "mood-cold": {
    name: "冷调",
    description: "清冷氛围",
  },
  "color-vibrant": {
    name: "鲜艳",
    description: "饱和有力的色彩",
  },
  "color-muted": {
    name: "柔和",
    description: "低饱和柔和色调",
  },
  "color-bw-classic": {
    name: "经典黑白",
    description: "永恒黑白影像",
  },
  "color-bw-high-contrast": {
    name: "高对比黑白",
    description: "戏剧感黑白",
  },
  "stylized-cyberpunk": {
    name: "赛博朋克",
    description: "霓虹未来感",
  },
  "stylized-comic": {
    name: "漫画",
    description: "鲜明漫画风格",
  },
  "stylized-soft-glow": {
    name: "柔光",
    description: "浪漫柔焦效果",
  },
};

export function getFilterPresetDisplayName(id: string, fallback: string): string {
  return FILTER_PRESET_LABELS[id]?.name ?? fallback;
}

export function getFilterPresetDisplayDescription(
  id: string,
  fallback: string,
): string {
  return FILTER_PRESET_LABELS[id]?.description ?? fallback;
}

export const EASING_CATEGORY_LABELS: Record<string, string> = {
  Basic: "基础",
  Quad: "二次",
  Cubic: "三次",
  Quart: "四次",
  Quint: "五次",
  Sine: "正弦",
  Expo: "指数",
  Circ: "圆形",
  Back: "回弹",
  Elastic: "弹性",
  Bounce: "弹跳",
};

export const EASING_LABELS: Record<string, string> = {
  linear: "线性",
  easeInQuad: "二次缓入",
  easeOutQuad: "二次缓出",
  easeInOutQuad: "二次缓入缓出",
  easeInCubic: "三次缓入",
  easeOutCubic: "三次缓出",
  easeInOutCubic: "三次缓入缓出",
  easeInQuart: "四次缓入",
  easeOutQuart: "四次缓出",
  easeInOutQuart: "四次缓入缓出",
  easeInQuint: "五次缓入",
  easeOutQuint: "五次缓出",
  easeInOutQuint: "五次缓入缓出",
  easeInSine: "正弦缓入",
  easeOutSine: "正弦缓出",
  easeInOutSine: "正弦缓入缓出",
  easeInExpo: "指数缓入",
  easeOutExpo: "指数缓出",
  easeInOutExpo: "指数缓入缓出",
  easeInCirc: "圆形缓入",
  easeOutCirc: "圆形缓出",
  easeInOutCirc: "圆形缓入缓出",
  easeInBack: "回弹缓入",
  easeOutBack: "回弹缓出",
  easeInOutBack: "回弹缓入缓出",
  easeInElastic: "弹性缓入",
  easeOutElastic: "弹性缓出",
  easeInOutElastic: "弹性缓入缓出",
  easeInBounce: "弹跳缓入",
  easeOutBounce: "弹跳缓出",
  easeInOutBounce: "弹跳缓入缓出",
};

export function formatEasingLabel(easing: string): string {
  return EASING_LABELS[easing] ?? easing;
}
