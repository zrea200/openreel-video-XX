import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // 绝对 base = 编辑器在浏览器侧的公开挂载路径（经 XixingPlatform BFF）。
  // 编辑器以 iframe 嵌入 Step5，src = `/api/video-factory/openreel-editor/`。
  // 不能用相对 './'：Next.js 默认 trailingSlash=false 会把 iframe 文档 URL 的尾
  // 斜杠去掉（→ `/api/video-factory/openreel-editor`），相对资源随之解析成
  // `/api/video-factory/assets/...`（少一层）→ 404 → 主 bundle 不加载 →
  // vf-bridge 发不出 OPENREEL_READY → 父侧握手超时。绝对 base 与尾斜杠无关，稳。
  // 注意：此值与前端 BFF 路由 `src/app/api/video-factory/[...path]` 绑定，改路由需同步。
  base: "/api/video-factory/openreel-editor/",
  plugins: [react()],
  assetsInclude: ["**/*.wasm"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@openreel/core": path.resolve(__dirname, "../../packages/core/src"),
    },
  },
  worker: {
    format: "es",
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util", "@ffmpeg/core", "@ffmpeg/core-mt"],
  },
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }
          if (id.includes("node_modules/zustand")) {
            return "zustand";
          }
          if (id.includes("node_modules/three")) {
            return "three";
          }
          if (id.includes("node_modules/@radix-ui")) {
            return "radix";
          }
        },
      },
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
