<template>
  <n-config-provider :theme-overrides="themeOverrides">
    <n-dialog-provider>
      <n-message-provider>
        <router-view />
        <QuickLogin />
      </n-message-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import type { GlobalThemeOverrides } from 'naive-ui'
import QuickLogin from '@/components/QuickLogin.vue'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#8B4513',
    primaryColorHover: '#A0522D',
    primaryColorPressed: '#654321',
  },
}
</script>

<style>
:root {
  --color-bg-page: #f5f5f0;
  --color-bg-card: #ffffff;
  --color-bg-elevated: #fafafa;
  --color-text-main: #333333;
  --color-text-secondary: #666666;
  --color-border: #e0e0dc;
  --color-primary: #8B4513;
  --color-primary-hover: #A0522D;
  --color-primary-pressed: #654321;
  --color-success: #18a058;
  --color-warning: #f0a020;
  --color-error: #d9534f;
  --color-info: #5bc0de;
}

[data-theme="dark"] {
  --color-bg-page: #1a1a2e;
  --color-bg-card: #16213e;
  --color-bg-elevated: #0f3460;
  --color-text-main: #e0e0e0;
  --color-text-secondary: #a0a0a0;
  --color-border: #2a2a4a;
  --color-primary: #c49a6c;
  --color-primary-hover: #d4a574;
  --color-primary-pressed: #a07850;
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  --color-error: #f87171;
  --color-info: #38bdf8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Global transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from { opacity: 0; transform: translateY(6px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-6px); }

.zoom-in-enter-active, .zoom-in-leave-active { transition: all 0.2s ease; }
.zoom-in-enter-from { opacity: 0; transform: scale(0.96); }
.zoom-in-leave-to { opacity: 0; transform: scale(0.96); }
body {
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--color-bg-page);
  color: var(--color-text-main);
  transition: background 0.3s, color 0.3s;
}

h1, h2, h3, h4, h5, h6, .serif {
  font-family: 'Noto Serif SC', 'Noto Sans SC', serif;
}
</style>
