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
      <h2>注册</h2>
      <div>
        <n-form-item label="用户名">
          <n-input v-model:value="form.username" placeholder="请输入用户名" @keyup.enter="handleRegister" />
        </n-form-item>
        <n-form-item label="邮箱">
          <n-input v-model:value="form.email" placeholder="请输入邮箱（可选）" />
        </n-form-item>
        <n-form-item label="昵称">
          <n-input v-model:value="form.nickname" placeholder="请输入昵称（可选）" />
        </n-form-item>
        <n-form-item label="密码">
          <n-input v-model:value="form.password" type="password" placeholder="至少6位" @keyup.enter="handleRegister" />
        </n-form-item>
        <n-form-item label="邀请码">
          <n-input v-model:value="form.inviteCode" placeholder="邀请码（可选）" @blur="validateInviteCode" />
          <span v-if="inviteValid" class="invite-valid">✓ 有效</span>
          <span v-else-if="inviteInvalid" class="invite-invalid">✗ 无效</span>
        </n-form-item>
        <n-form-item>
          <n-button type="primary" :loading="loading" block @click="handleRegister">注册</n-button>
        </n-form-item>
      </div>
      <p class="tip">已有账号？<router-link to="/login">立即登录</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessage } from 'naive-ui'
import api from '@/api/client'

const router = useRouter()
const auth = useAuthStore()
const message = useMessage()
const loading = ref(false)
const inviteValid = ref(false)
const inviteInvalid = ref(false)

const form = ref({ username: '', email: '', nickname: '', password: '', inviteCode: '' })

async function validateInviteCode() {
  if (!form.value.inviteCode) {
    inviteValid.value = false
    inviteInvalid.value = false
    return
  }
  try {
    await api.post('/invite-codes/validate', { code: form.value.inviteCode })
    inviteValid.value = true
    inviteInvalid.value = false
  } catch {
    inviteValid.value = false
    inviteInvalid.value = true
  }
}

async function handleRegister() {
  if (!form.value.username || !form.value.password) {
    message.error('请填写用户名和密码')
    return
  }
  loading.value = true
  try {
    const data: any = {
      username: form.value.username,
      password: form.value.password,
    }
    if (form.value.email) data.email = form.value.email
    if (form.value.nickname) data.nickname = form.value.nickname
    if (form.value.inviteCode) data.inviteCode = form.value.inviteCode
    await auth.register(data)
    message.success('注册成功，请登录')
    router.push('/login')
  } catch (e: any) {
    message.error(e.response?.data?.message || '注册失败')
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
.invite-valid { color: #18a058; font-size: 0.85rem; margin-left: 0.5rem; }
.invite-invalid { color: #d03050; font-size: 0.85rem; margin-left: 0.5rem; }
</style>
