<template>
  <div class="quick-login">
    <!-- 触发按钮 -->
    <button class="fab" @click="showPanel = !showPanel" :title="currentUser ? `当前: ${currentUser.nickname || currentUser.username}` : '快速登录'">
      <span v-if="currentUser" class="fab-avatar">{{ (currentUser.nickname || currentUser.username)[0] }}</span>
      <span v-else class="fab-icon">&#128100;</span>
    </button>

    <!-- 面板 -->
    <transition name="fade">
      <div v-if="showPanel" class="panel-overlay" @click.self="showPanel = false">
        <div class="panel">
          <div class="panel-title">快速登录（测试账号）</div>
          <div v-if="currentUser" class="current-user">
            当前: <strong>{{ currentUser.nickname || currentUser.username }}</strong>
          </div>
          <div class="account-list">
            <div
              v-for="account in accounts"
              :key="account.username"
              class="account-item"
              :class="{ active: currentUser?.username === account.username }"
              @click="loginAs(account)"
            >
              <span class="account-icon">{{ account.icon }}</span>
              <div class="account-info">
                <span class="account-name">{{ account.nickname }}</span>
                <span class="account-user">{{ account.username }}</span>
              </div>
              <n-spin v-if="loadingAccount === account.username" size="small" />
            </div>
          </div>
          <div v-if="error" class="error-msg">{{ error }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const showPanel = ref(false)
const loadingAccount = ref('')
const error = ref('')
const currentUser = ref<any>(null)

interface TestAccount {
  username: string
  nickname: string
  password: string
  icon: string
}

const accounts: TestAccount[] = [
  { username: 'kp_test', nickname: '守秘人测试', password: '123456', icon: '🎩' },
  { username: 'player1', nickname: '调查员亨利', password: '123456', icon: '🔍' },
  { username: 'kp_tester', nickname: '测试守秘人', password: '123456', icon: '📖' },
  { username: 'pl_tester', nickname: '测试调查员', password: '123456', icon: '🎲' },
  { username: 'ws_test_kp', nickname: 'WS测试KP', password: '123456', icon: '⚡' },
]

// All test accounts use password: 123456

async function loginAs(account: TestAccount) {
  if (loadingAccount.value) return
  loadingAccount.value = account.username
  error.value = ''
  try {
    await authStore.login(account.username, account.password)
    currentUser.value = authStore.user
    showPanel.value = false
    window.location.reload()
  } catch (e: any) {
    error.value = e.response?.data?.message || '登录失败'
  } finally {
    loadingAccount.value = ''
  }
}

async function loadCurrentUser() {
  if (authStore.isLoggedIn) {
    try {
      await authStore.fetchMe()
      currentUser.value = authStore.user
    } catch { /* ignore */ }
  }
}

onMounted(loadCurrentUser)
</script>

<style scoped>
.quick-login { position: fixed; bottom: 0; right: 0; z-index: 10000; pointer-events: none; }
.fab {
  pointer-events: auto;
  position: fixed; bottom: 20px; right: 20px;
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, #c49a6c, #8B4513);
  border: 2px solid rgba(255,255,255,0.2);
  color: white; font-size: 20px;
  cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.2s, box-shadow 0.2s;
}
.fab:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(0,0,0,0.5); }
.fab-avatar { font-size: 18px; font-weight: 700; }
.fab-icon { line-height: 1; }
.panel-overlay {
  pointer-events: auto;
  position: fixed; inset: 0; z-index: 10001;
  background: rgba(0,0,0,0.4);
  display: flex; align-items: flex-end; justify-content: flex-end;
  padding: 80px 24px 24px;
}
.panel {
  background: #1e1e32; border: 1px solid #2a2a3e; border-radius: 12px;
  width: 300px; padding: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  color: #c0c0c8;
}
.panel-title { font-size: 0.85rem; font-weight: 600; color: #e0e0e8; margin-bottom: 8px; }
.current-user { font-size: 0.75rem; color: #8a8a9a; margin-bottom: 12px; }
.account-list { display: flex; flex-direction: column; gap: 2px; }
.account-item {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-radius: 8px;
  cursor: pointer; transition: background 0.15s;
}
.account-item:hover { background: rgba(255,255,255,0.06); }
.account-item.active { background: rgba(196,154,108,0.2); }
.account-icon { font-size: 1.3rem; }
.account-info { flex: 1; display: flex; flex-direction: column; }
.account-name { font-size: 0.85rem; color: #e0e0e8; }
.account-user { font-size: 0.7rem; color: #666; font-family: monospace; }
.error-msg { font-size: 0.75rem; color: #e04040; margin-top: 8px; text-align: center; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
