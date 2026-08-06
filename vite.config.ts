import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeManifestIcons: false,
      manifest: {
        name: '心桥',
        short_name: '心桥',
        description: '心桥 · 客户关怀系统——心的桥梁。面向银行客户经理，生日提醒、祝福辅助、维护记录一站式完成。',
        lang: 'zh-CN',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#fff7ed',
        theme_color: '#c2410c',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['index.html', 'icons/**', 'website/index.html'],
        navigateFallback: 'index.html',
        // 关键修复：SW 的 navigateFallback 只应兜底 SPA 自身。
        // 禁止对 /website/ 等独立静态子页面使用根 index.html 兜底，
        // 否则根 SPA 会劫持 /website/ 的导航请求（Safari 下尤甚，
        // 表现为 /website/ 渲染出主站首页内容、地址栏路径丢失）。
        navigateFallbackDenylist: [/^\/website\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: { enabled: false },
    }),
    viteSingleFile({ deleteInlinedFiles: true }),
  ],
  base: './',
});
