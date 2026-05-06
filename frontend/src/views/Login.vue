<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="back-link">
        <n-button text size="small" @click="router.push('/')">
          <template #icon>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </template>
          返回首页
        </n-button>
      </div>
      <h2>登录</h2>
      <div>
        <n-form-item label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" @keyup.enter="handleLogin" />
        </n-form-item>
        <n-form-item label="密码">
          <n-input v-model:value="form.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin" />
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="loading" block @click="handleLogin">登录</n-button>
        </n-form-item>
      </div>
      <p class="tip">还没有账号？<router-link to="/register">立即注册</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessage } from 'naive-ui'

const router = useRouter()
const auth = useAuthStore()
const message = useMessage()
const loading = ref(false)

const form = ref({ username: '', password: '' })

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    message.error('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    await auth.login(form.value.username, form.value.password)
    message.success('登录成功')
    router.push('/')
  } catch (e: any) {
    message.error(e.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #2c1810 0%, #4a2c17 100%);
}
.auth-card {
  background: white; padding: 2.5rem; border-radius: 16px;
  width: 100%; max-width: 400px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}
.back-link { margin-bottom: 0.5rem; }
.auth-card h2 { text-align: center; margin-bottom: 1.5rem; color: #8B4513; }
.tip { text-align: center; margin-top: 1rem; color: #666; }
.tip a { color: #8B4513; }
</style>
