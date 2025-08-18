// 全局类型定义

// Element Plus 图标类型
declare module '@element-plus/icons-vue' {
  import type { Component } from 'vue';
  const icons: Record<string, Component>;
  export = icons;
}

// 移动端工具类型
declare module './utils/mobileUtils' {
  export function initMobileOptimizations(): void;
}

// 扩展 Window 接口
declare global {
  interface Window {
    // 可以在这里添加全局的 window 属性
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: unknown;
  }
}

export {};
