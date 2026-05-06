<template>
  <div>
    <div class="toolbar">
      <n-button type="primary" @click="openCreate">新增</n-button>
      <n-input v-model:value="search" placeholder="搜索名称" clearable style="width: 240px" />
    </div>

    <n-data-table
      :columns="tableColumns"
      :data="filteredList"
      :pagination="{ pageSize: 20 }"
      :loading="loading"
      size="small"
      bordered
    />

    <n-modal v-model:show="showModal" :title="isEdit ? '编辑' : '新增'" preset="card" style="width: 560px">
      <n-form :model="form" label-placement="left" label-width="120">
        <n-form-item v-for="f in fields" :key="f.key" :label="f.label" :required="f.required">
          <n-input v-if="!f.type || f.type === 'text'" v-model:value="form[f.key]" />
          <n-input-number v-else-if="f.type === 'number'" v-model:value="form[f.key]" />
          <n-input v-else-if="f.type === 'textarea'" v-model:value="form[f.key]" type="textarea" :rows="3" />
          <n-switch v-else-if="f.type === 'switch'" v-model:value="form[f.key]" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showModal = false">取消</n-button>
          <n-button type="primary" :loading="saving" @click="save">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showDescModal" title="术语解释" preset="card" style="width: 600px">
      <p style="white-space: pre-wrap; line-height: 1.6; color: #555;">{{ descContent }}</p>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue'
import { NButton, NSpace, NPopconfirm, useMessage } from 'naive-ui'

const props = defineProps<{
  type: string
  columns: any[]
  fields: any[]
  listApi: () => Promise<any>
  createApi: (data: any) => Promise<any>
  updateApi: (id: number, data: any) => Promise<any>
  deleteApi: (id: number) => Promise<any>
}>()

const message = useMessage()
const list = ref<any[]>([])
const loading = ref(false)
const search = ref('')
const showModal = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const form = ref<Record<string, any>>({})
const showDescModal = ref(false)
const descContent = ref('')

const filteredList = computed(() => {
  if (!search.value) return list.value
  const q = search.value.toLowerCase()
  return list.value.filter((item) => (item.name || '').toLowerCase().includes(q))
})

const tableColumns = computed(() => [
  ...props.columns,
  {
    title: '操作',
    key: 'actions',
    width: 140,
    render(row: any) {
      return h(NSpace, { size: 'small' }, () => [
        h(NButton, { size: 'tiny', onClick: () => { descContent.value = row.description || '暂无术语解释'; showDescModal.value = true } }, () => '术语'),
        h(NButton, { size: 'tiny', onClick: () => openEdit(row) }, () => '编辑'),
        h(NPopconfirm, { onPositiveClick: () => remove(row.id) }, {
          trigger: () => h(NButton, { size: 'tiny', type: 'error' }, () => '删除'),
          default: () => '确定删除吗？',
        }),
      ])
    },
  },
])

function resetForm() {
  const obj: Record<string, any> = {}
  for (const f of props.fields) {
    if (f.type === 'switch') obj[f.key] = false
    else if (f.type === 'number') obj[f.key] = undefined
    else obj[f.key] = ''
  }
  form.value = obj
}

function openCreate() {
  isEdit.value = false
  resetForm()
  showModal.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  form.value = { ...row }
  showModal.value = true
}

async function save() {
  const required = props.fields.filter((f) => f.required && !form.value[f.key])
  if (required.length) {
    message.error(`请填写${required[0].label}`)
    return
  }
  saving.value = true
  try {
    const payload: any = {}
    for (const f of props.fields) {
      const v = form.value[f.key]
      if (v !== undefined && v !== '') payload[f.key] = v
    }
    if (isEdit.value) {
      await props.updateApi(form.value.id, payload)
      message.success('更新成功')
    } else {
      await props.createApi(payload)
      message.success('创建成功')
    }
    showModal.value = false
    await load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '操作失败')
  } finally {
    saving.value = false
  }
}

async function remove(id: number) {
  try {
    await props.deleteApi(id)
    message.success('删除成功')
    await load()
  } catch (e: any) {
    message.error(e.response?.data?.message || '删除失败')
  }
}

async function load() {
  loading.value = true
  try {
    const res = await props.listApi()
    list.value = res.data || []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; margin-bottom: 1rem; }
</style>
