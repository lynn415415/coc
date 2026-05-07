<template>
  <div class="page">
    <div class="back-bar">
      <n-button text @click="$router.push('/')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </template>
        返回首页
      </n-button>
    </div>

    <div class="header">
      <h2>用户管理</h2>
      <n-space>
        <n-select v-model:value="roleFilter" :options="roleFilterOptions" placeholder="筛选角色" clearable style="width: 140px" @update:value="loadUsers" />
      </n-space>
    </div>

    <n-spin :show="loading">
      <n-data-table
        :columns="columns"
        :data="users"
        :pagination="pagination"
        :row-key="(row: any) => row.id"
        @update:page="onPageChange"
        @update:page-size="onPageSizeChange"
      />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { NButton, NTag, NSpace, NSelect, useMessage, useDialog } from 'naive-ui'
import { usersApi } from '@/api/users'
import { useAuthStore } from '@/stores/auth'

const message = useMessage()
const dialog = useDialog()
const auth = useAuthStore()

const users = ref<any[]>([])
const loading = ref(false)
const roleFilter = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const roleFilterOptions = [
  { label: '玩家', value: 'PLAYER' },
  { label: 'KP', value: 'KP' },
  { label: '管理员', value: 'ADMIN' },
]

const pagination = ref({
  page: 1,
  pageSize: 20,
  pageCount: 1,
  itemCount: 0,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  prefix: ({ itemCount }: any) => `共 ${itemCount} 个用户`,
})

const roleOptions = [
  { label: '玩家 (PLAYER)', value: 'PLAYER' },
  { label: 'KP', value: 'KP' },
  { label: '管理员 (ADMIN)', value: 'ADMIN' },
]

const columns = [
  { title: '用户名', key: 'username', width: 120 },
  { title: '昵称', key: 'nickname', width: 120, render: (row: any) => row.nickname || '-' },
  { title: '邮箱', key: 'email', width: 180, render: (row: any) => row.email || '-' },
  {
    title: '角色',
    key: 'role',
    width: 100,
    render: (row: any) => {
      const typeMap: Record<string, 'default' | 'warning' | 'error'> = { PLAYER: 'default', KP: 'warning', ADMIN: 'error' }
      const textMap: Record<string, string> = { PLAYER: '玩家', KP: 'KP', ADMIN: '管理员' }
      return h(NTag, { type: typeMap[row.role] || 'default', size: 'small' }, () => textMap[row.role] || row.role)
    },
  },
  {
    title: '注册时间',
    key: 'createdAt',
    width: 160,
    render: (row: any) => new Date(row.createdAt).toLocaleString('zh-CN'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row: any) => {
      if (row.id === auth.user?.id) return h('span', { style: 'color: #999; font-size: 0.85rem' }, '当前用户')
      return h(NSpace, { size: 'small' }, () => [
        h(NSelect, {
          value: row.role,
          options: roleOptions,
          size: 'tiny',
          style: 'width: 130px',
          onUpdateValue: (val: string) => changeRole(row, val),
        }),
        h(NButton, {
          size: 'tiny',
          type: 'error',
          quaternary: true,
          onClick: () => deleteUser(row),
        }, () => '删除'),
      ])
    },
  },
]

async function loadUsers() {
  loading.value = true
  try {
    const res = await usersApi.findAll(page.value, pageSize.value, roleFilter.value || undefined)
    users.value = res.data.items
    total.value = res.data.total
    pagination.value.page = res.data.page
    pagination.value.itemCount = res.data.total
    pagination.value.pageCount = Math.ceil(res.data.total / pageSize.value)
  } catch (e: any) {
    message.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function changeRole(user: any, newRole: string) {
  try {
    await usersApi.updateRole(user.id, newRole)
    user.role = newRole
    message.success(`${user.username} 角色已更新为 ${newRole}`)
  } catch (e: any) {
    message.error(e.response?.data?.message || '修改失败')
  }
}

function deleteUser(user: any) {
  dialog.warning({
    title: '确认删除',
    content: `确定要删除用户 ${user.username} 吗？此操作不可恢复。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await usersApi.delete(user.id)
        message.success('已删除')
        loadUsers()
      } catch (e: any) {
        message.error(e.response?.data?.message || '删除失败')
      }
    },
  })
}

function onPageChange(p: number) {
  page.value = p
  loadUsers()
}

function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  loadUsers()
}

onMounted(() => loadUsers())
</script>

<style scoped>
.page { max-width: 1000px; margin: 0 auto; padding: 2rem; }
.back-bar { margin-bottom: 1rem; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.header h2 { margin: 0; }
</style>
