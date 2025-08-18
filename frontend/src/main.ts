import type { Component } from 'vue';
import { createApp } from 'vue';
import App from './App.vue';

// 引入Pinia状态管理
import { createPinia } from 'pinia';

// 引入Element Plus及样式
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

// 引入Element Plus图标
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

// 引入自定义样式
import './assets/styles/responsive.css';
import './assets/styles/variables.css';

// 引入移动端优化
import { initMobileOptimizations } from './utils/mobileUtils';

const app = createApp(App);
const pinia = createPinia();

// 注册Pinia
app.use(pinia);

// 注册Element Plus
app.use(ElementPlus);

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component as Component);
}

// 初始化移动端优化
initMobileOptimizations();

app.mount('#app');
