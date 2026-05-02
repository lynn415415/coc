<template>
  <div class="home">
    <nav class="navbar">
      <div class="logo">COC跑团平台</div>
      <div class="nav-links">
        <template v-if="auth.isLoggedIn">
          <router-link to="/investigators">我的角色卡</router-link>
          <router-link to="/campaigns">跑团</router-link>
          <span class="user-info">{{ auth.user?.nickname }}</span>
          <n-button size="small" @click="auth.logout()">退出</n-button>
        </template>
        <template v-else>
          <router-link to="/login">登录</router-link>
          <router-link to="/register">注册</router-link>
        </template>
      </div>
    </nav>

    <div class="hero">
      <h1>克苏鲁的呼唤</h1>
      <p>在线跑团平台 — 与朋友一起探索未知的恐怖</p>
      <div class="actions">
        <router-link v-if="auth.isLoggedIn" to="/investigators">
          <n-button type="primary" size="large">创建调查员</n-button>
        </router-link>
        <router-link v-else to="/register">
          <n-button type="primary" size="large">立即开始</n-button>
        </router-link>
      </div>
    </div>

    <div class="features">
      <div class="feature-card">
        <h3>角色卡管理</h3>
        <p>完整的COC七版角色卡，支持属性Roll点、技能分配、装备管理</p>
      </div>
      <div class="feature-card">
        <h3>AI辅助KP</h3>
        <p>模组智能解析、动作意图识别、自动线索发放、NPC对话辅助</p>
      </div>
      <div class="feature-card">
        <h3>在线跑团</h3>
        <p>实时聊天、骰子检定、战斗轮、地图系统、线索共享</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<style scoped>
.home { min-height: 100vh; }
.navbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1rem 2rem; background: #2c1810; color: #f5f5f0;
}
.logo { font-size: 1.5rem; font-weight: bold; color: #d4a574; }
.nav-links { display: flex; gap: 1.5rem; align-items: center; }
.nav-links a { color: #f5f5f0; text-decoration: none; }
.nav-links a:hover { color: #d4a574; }
.user-info { color: #d4a574; }

.hero {
  text-align: center; padding: 6rem 2rem;
  background: linear-gradient(135deg, #2c1810 0%, #4a2c17 100%);
  color: #f5f5f0;
}
.hero h1 { font-size: 3rem; margin-bottom: 1rem; color: #d4a574; }
.hero p { font-size: 1.25rem; margin-bottom: 2rem; opacity: 0.9; }
.actions { display: flex; gap: 1rem; justify-content: center; }

.features {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem; padding: 4rem 2rem; max-width: 1200px; margin: 0 auto;
}
.feature-card {
  background: white; padding: 2rem; border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
.feature-card h3 { color: #8B4513; margin-bottom: 0.75rem; }
.feature-card p { color: #666; line-height: 1.6; }
</style>
