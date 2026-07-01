export type ShortcutCategory =
  | "playback"
  | "editing"
  | "selection"
  | "timeline"
  | "view"
  | "file"
  | "tools";

export interface ShortcutDefinition {
  id: string;
  name: string;
  description: string;
  category: ShortcutCategory;
  defaultKey: string;
  currentKey: string;
  action: string;
  enabled: boolean;
}

export interface ShortcutPreset {
  id: string;
  name: string;
  description: string;
  shortcuts: Record<string, string>;
}

export type ShortcutHandler = (e: KeyboardEvent) => void;

const STORAGE_KEY = "openreel_shortcuts";
const PRESET_KEY = "openreel_shortcut_preset";

function parseKeyCombo(key: string): {
  key: string;
  meta: boolean;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
} {
  const parts = key.toLowerCase().split("+");
  return {
    key: parts[parts.length - 1],
    meta: parts.includes("cmd") || parts.includes("meta"),
    ctrl: parts.includes("ctrl"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt") || parts.includes("option"),
  };
}

function formatKeyCombo(combo: {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}): string {
  const parts: string[] = [];
  if (combo.meta || combo.ctrl) parts.push("⌘");
  if (combo.shift) parts.push("⇧");
  if (combo.alt) parts.push("⌥");

  const keyMap: Record<string, string> = {
    space: "Space",
    arrowleft: "←",
    arrowright: "→",
    arrowup: "↑",
    arrowdown: "↓",
    delete: "⌫",
    backspace: "⌫",
    escape: "Esc",
    enter: "↵",
    tab: "⇥",
    home: "Home",
    end: "End",
  };

  parts.push(keyMap[combo.key] || combo.key.toUpperCase());
  return parts.join("");
}

const DEFAULT_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: "playback.playPause",
    name: "播放/暂停",
    description: "切换播放状态",
    category: "playback",
    defaultKey: "space",
    currentKey: "space",
    action: "playback.playPause",
    enabled: true,
  },
  {
    id: "playback.frameBack",
    name: "后退一帧",
    description: "向后移动一帧",
    category: "playback",
    defaultKey: "arrowleft",
    currentKey: "arrowleft",
    action: "playback.frameBack",
    enabled: true,
  },
  {
    id: "playback.frameForward",
    name: "前进一帧",
    description: "向前移动一帧",
    category: "playback",
    defaultKey: "arrowright",
    currentKey: "arrowright",
    action: "playback.frameForward",
    enabled: true,
  },
  {
    id: "playback.secondBack",
    name: "后退一秒",
    description: "向后移动一秒",
    category: "playback",
    defaultKey: "shift+arrowleft",
    currentKey: "shift+arrowleft",
    action: "playback.secondBack",
    enabled: true,
  },
  {
    id: "playback.secondForward",
    name: "前进一秒",
    description: "向前移动一秒",
    category: "playback",
    defaultKey: "shift+arrowright",
    currentKey: "shift+arrowright",
    action: "playback.secondForward",
    enabled: true,
  },
  {
    id: "playback.jump5Back",
    name: "后退 5 秒",
    description: "向后跳转 5 秒",
    category: "playback",
    defaultKey: "arrowup",
    currentKey: "arrowup",
    action: "playback.jump5Back",
    enabled: true,
  },
  {
    id: "playback.jump5Forward",
    name: "前进 5 秒",
    description: "向前跳转 5 秒",
    category: "playback",
    defaultKey: "arrowdown",
    currentKey: "arrowdown",
    action: "playback.jump5Forward",
    enabled: true,
  },
  {
    id: "playback.goToStart",
    name: "跳到开头",
    description: "跳转到时间轴起点",
    category: "playback",
    defaultKey: "home",
    currentKey: "home",
    action: "playback.goToStart",
    enabled: true,
  },
  {
    id: "playback.goToEnd",
    name: "跳到结尾",
    description: "跳转到时间轴终点",
    category: "playback",
    defaultKey: "end",
    currentKey: "end",
    action: "playback.goToEnd",
    enabled: true,
  },
  {
    id: "playback.prevClip",
    name: "上一个片段",
    description: "跳转到上一个片段边缘",
    category: "playback",
    defaultKey: "[",
    currentKey: "[",
    action: "playback.prevClip",
    enabled: true,
  },
  {
    id: "playback.nextClip",
    name: "下一个片段",
    description: "跳转到下一个片段边缘",
    category: "playback",
    defaultKey: "]",
    currentKey: "]",
    action: "playback.nextClip",
    enabled: true,
  },
  {
    id: "editing.undo",
    name: "撤销",
    description: "撤销上一步操作",
    category: "editing",
    defaultKey: "cmd+z",
    currentKey: "cmd+z",
    action: "editing.undo",
    enabled: true,
  },
  {
    id: "editing.redo",
    name: "重做",
    description: "重做已撤销的操作",
    category: "editing",
    defaultKey: "cmd+shift+z",
    currentKey: "cmd+shift+z",
    action: "editing.redo",
    enabled: true,
  },
  {
    id: "editing.cut",
    name: "剪切",
    description: "剪切选中的片段",
    category: "editing",
    defaultKey: "cmd+x",
    currentKey: "cmd+x",
    action: "editing.cut",
    enabled: true,
  },
  {
    id: "editing.copy",
    name: "复制",
    description: "复制选中的片段",
    category: "editing",
    defaultKey: "cmd+c",
    currentKey: "cmd+c",
    action: "editing.copy",
    enabled: true,
  },
  {
    id: "editing.paste",
    name: "粘贴",
    description: "在播放头位置粘贴片段",
    category: "editing",
    defaultKey: "cmd+v",
    currentKey: "cmd+v",
    action: "editing.paste",
    enabled: true,
  },
  {
    id: "editing.duplicate",
    name: "复制片段",
    description: "复制选中的片段",
    category: "editing",
    defaultKey: "cmd+d",
    currentKey: "cmd+d",
    action: "editing.duplicate",
    enabled: true,
  },
  {
    id: "editing.delete",
    name: "删除",
    description: "删除选中的片段",
    category: "editing",
    defaultKey: "delete",
    currentKey: "delete",
    action: "editing.delete",
    enabled: true,
  },
  {
    id: "editing.rippleDelete",
    name: "波纹删除",
    description: "删除并闭合间隙",
    category: "editing",
    defaultKey: "shift+delete",
    currentKey: "shift+delete",
    action: "editing.rippleDelete",
    enabled: true,
  },
  {
    id: "editing.split",
    name: "分割",
    description: "在播放头处分割片段",
    category: "editing",
    defaultKey: "s",
    currentKey: "s",
    action: "editing.split",
    enabled: true,
  },
  {
    id: "editing.trimStart",
    name: "修剪开头",
    description: "将片段开头修剪到播放头",
    category: "editing",
    defaultKey: "q",
    currentKey: "q",
    action: "editing.trimStart",
    enabled: true,
  },
  {
    id: "editing.trimEnd",
    name: "修剪结尾",
    description: "将片段结尾修剪到播放头",
    category: "editing",
    defaultKey: "w",
    currentKey: "w",
    action: "editing.trimEnd",
    enabled: true,
  },
  {
    id: "selection.selectAll",
    name: "全选",
    description: "选中所有片段",
    category: "selection",
    defaultKey: "cmd+a",
    currentKey: "cmd+a",
    action: "selection.selectAll",
    enabled: true,
  },
  {
    id: "selection.deselect",
    name: "取消选择",
    description: "清除当前选择",
    category: "selection",
    defaultKey: "escape",
    currentKey: "escape",
    action: "selection.deselect",
    enabled: true,
  },
  {
    id: "timeline.toggleSnap",
    name: "切换吸附",
    description: "开启或关闭吸附",
    category: "timeline",
    defaultKey: "n",
    currentKey: "n",
    action: "timeline.toggleSnap",
    enabled: true,
  },
  {
    id: "timeline.zoomIn",
    name: "放大时间轴",
    description: "放大时间轴视图",
    category: "timeline",
    defaultKey: "cmd+=",
    currentKey: "cmd+=",
    action: "timeline.zoomIn",
    enabled: true,
  },
  {
    id: "timeline.zoomOut",
    name: "缩小时间轴",
    description: "缩小时间轴视图",
    category: "timeline",
    defaultKey: "cmd+-",
    currentKey: "cmd+-",
    action: "timeline.zoomOut",
    enabled: true,
  },
  {
    id: "timeline.fitTimeline",
    name: "适应时间轴",
    description: "将时间轴缩放至适合窗口",
    category: "timeline",
    defaultKey: "cmd+0",
    currentKey: "cmd+0",
    action: "timeline.fitTimeline",
    enabled: true,
  },
  {
    id: "view.showShortcuts",
    name: "显示快捷键",
    description: "打开快捷键帮助",
    category: "view",
    defaultKey: "?",
    currentKey: "?",
    action: "view.showShortcuts",
    enabled: true,
  },
  {
    id: "file.save",
    name: "保存",
    description: "保存项目",
    category: "file",
    defaultKey: "cmd+s",
    currentKey: "cmd+s",
    action: "file.save",
    enabled: true,
  },
  {
    id: "file.export",
    name: "导出",
    description: "导出视频",
    category: "file",
    defaultKey: "cmd+e",
    currentKey: "cmd+e",
    action: "file.export",
    enabled: true,
  },
  {
    id: "tools.addText",
    name: "添加文字",
    description: "添加文字片段",
    category: "tools",
    defaultKey: "t",
    currentKey: "t",
    action: "tools.addText",
    enabled: true,
  },
  {
    id: "tools.addMarker",
    name: "添加标记",
    description: "在播放头处添加标记",
    category: "tools",
    defaultKey: "m",
    currentKey: "m",
    action: "tools.addMarker",
    enabled: true,
  },
];

const PRESETS: ShortcutPreset[] = [
  {
    id: "openreel",
    name: "OpenReel 默认",
    description: "OpenReel 默认快捷键",
    shortcuts: {},
  },
  {
    id: "capcut",
    name: "CapCut",
    description: "剪映风格快捷键",
    shortcuts: {
      "editing.split": "ctrl+b",
      "playback.playPause": "space",
      "editing.delete": "delete",
    },
  },
  {
    id: "premiere",
    name: "Adobe Premiere",
    description: "Premiere Pro 风格快捷键",
    shortcuts: {
      "editing.split": "cmd+k",
      "playback.playPause": "space",
      "playback.frameBack": "arrowleft",
      "playback.frameForward": "arrowright",
      "editing.rippleDelete": "shift+delete",
    },
  },
  {
    id: "finalcut",
    name: "Final Cut Pro",
    description: "Final Cut Pro 风格快捷键",
    shortcuts: {
      "editing.split": "cmd+b",
      "playback.playPause": "space",
      "editing.trimStart": "[",
      "editing.trimEnd": "]",
    },
  },
  {
    id: "davinci",
    name: "DaVinci Resolve",
    description: "DaVinci Resolve 风格快捷键",
    shortcuts: {
      "editing.split": "cmd+\\",
      "playback.playPause": "space",
      "editing.rippleDelete": "shift+backspace",
    },
  },
];

class KeyboardShortcutsManager {
  private shortcuts: Map<string, ShortcutDefinition> = new Map();
  private handlers: Map<string, Set<ShortcutHandler>> = new Map();
  private activePreset: string = "openreel";
  private isListening: boolean = false;

  constructor() {
    this.loadShortcuts();
    this.loadPreset();
  }

  private loadShortcuts(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    const customizations: Record<string, string> = saved
      ? JSON.parse(saved)
      : {};

    DEFAULT_SHORTCUTS.forEach((shortcut) => {
      const customKey = customizations[shortcut.id];
      this.shortcuts.set(shortcut.id, {
        ...shortcut,
        currentKey: customKey || shortcut.defaultKey,
      });
    });
  }

  private loadPreset(): void {
    const saved = localStorage.getItem(PRESET_KEY);
    if (saved) {
      this.activePreset = saved;
    }
  }

  private saveShortcuts(): void {
    const customizations: Record<string, string> = {};
    this.shortcuts.forEach((shortcut, id) => {
      if (shortcut.currentKey !== shortcut.defaultKey) {
        customizations[id] = shortcut.currentKey;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customizations));
  }

  private savePreset(): void {
    localStorage.setItem(PRESET_KEY, this.activePreset);
  }

  startListening(): void {
    if (this.isListening) return;
    this.isListening = true;
    window.addEventListener("keydown", this.handleKeyDown);
  }

  stopListening(): void {
    if (!this.isListening) return;
    this.isListening = false;
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    const matchedShortcut = this.findMatchingShortcut(e);
    if (matchedShortcut) {
      e.preventDefault();
      e.stopPropagation();
      this.executeAction(matchedShortcut.action, e);
    }
  };

  private findMatchingShortcut(e: KeyboardEvent): ShortcutDefinition | null {
    const isMeta = e.metaKey || e.ctrlKey;

    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue;

      const combo = parseKeyCombo(shortcut.currentKey);
      const keyMatches =
        e.key.toLowerCase() === combo.key || e.code.toLowerCase() === combo.key;
      const metaMatches = (combo.meta || combo.ctrl) === isMeta;
      const shiftMatches = combo.shift === e.shiftKey;
      const altMatches = combo.alt === e.altKey;

      if (keyMatches && metaMatches && shiftMatches && altMatches) {
        return shortcut;
      }
    }

    return null;
  }

  private executeAction(action: string, e: KeyboardEvent): void {
    const handlers = this.handlers.get(action);
    if (handlers) {
      handlers.forEach((handler) => handler(e));
    }
  }

  registerHandler(action: string, handler: ShortcutHandler): () => void {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, new Set());
    }
    this.handlers.get(action)!.add(handler);

    return () => {
      this.handlers.get(action)?.delete(handler);
    };
  }

  getShortcut(id: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(id);
  }

  getAllShortcuts(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutsByCategory(category: ShortcutCategory): ShortcutDefinition[] {
    return this.getAllShortcuts().filter((s) => s.category === category);
  }

  setShortcut(id: string, key: string): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    const conflict = this.findConflict(key, id);
    if (conflict) return false;

    this.shortcuts.set(id, { ...shortcut, currentKey: key });
    this.saveShortcuts();
    return true;
  }

  resetShortcut(id: string): void {
    const shortcut = this.shortcuts.get(id);
    if (shortcut) {
      this.shortcuts.set(id, { ...shortcut, currentKey: shortcut.defaultKey });
      this.saveShortcuts();
    }
  }

  resetAllShortcuts(): void {
    this.shortcuts.forEach((shortcut, id) => {
      this.shortcuts.set(id, { ...shortcut, currentKey: shortcut.defaultKey });
    });
    this.saveShortcuts();
  }

  findConflict(key: string, excludeId?: string): ShortcutDefinition | null {
    for (const [id, shortcut] of this.shortcuts) {
      if (id === excludeId) continue;
      if (shortcut.currentKey.toLowerCase() === key.toLowerCase()) {
        return shortcut;
      }
    }
    return null;
  }

  getPresets(): ShortcutPreset[] {
    return PRESETS;
  }

  getActivePreset(): string {
    return this.activePreset;
  }

  applyPreset(presetId: string): void {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    this.resetAllShortcuts();

    Object.entries(preset.shortcuts).forEach(([id, key]) => {
      const shortcut = this.shortcuts.get(id);
      if (shortcut) {
        this.shortcuts.set(id, { ...shortcut, currentKey: key });
      }
    });

    this.activePreset = presetId;
    this.saveShortcuts();
    this.savePreset();
  }

  formatShortcut(id: string): string {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return "";
    const combo = parseKeyCombo(shortcut.currentKey);
    return formatKeyCombo(combo);
  }

  getCategories(): ShortcutCategory[] {
    return [
      "playback",
      "editing",
      "selection",
      "timeline",
      "view",
      "file",
      "tools",
    ];
  }

  getCategoryName(category: ShortcutCategory): string {
    const names: Record<ShortcutCategory, string> = {
      playback: "播放",
      editing: "编辑",
      selection: "选择",
      timeline: "时间轴",
      view: "视图",
      file: "文件",
      tools: "工具",
    };
    return names[category];
  }
}

export const keyboardShortcuts = new KeyboardShortcutsManager();

export function formatKeyComboDisplay(key: string): string {
  const combo = parseKeyCombo(key);
  return formatKeyCombo(combo);
}
