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

    <h2 class="page-title">配置库管理</h2>

    <n-tabs type="line" v-model:value="activeTab">
      <n-tab-pane name="weapons" tab="武器">
        <config-table
          type="weapons"
          :columns="weaponColumns"
          :fields="weaponFields"
          :list-api="() => api.get('/weapons')"
          :create-api="(d) => api.post('/weapons', d)"
          :update-api="(id, d) => api.patch(`/weapons/${id}`, d)"
          :delete-api="(id) => api.delete(`/weapons/${id}`)"
        />
      </n-tab-pane>
      <n-tab-pane name="armors" tab="防具">
        <config-table
          type="armors"
          :columns="armorColumns"
          :fields="armorFields"
          :list-api="() => api.get('/armors')"
          :create-api="(d) => api.post('/armors', d)"
          :update-api="(id, d) => api.patch(`/armors/${id}`, d)"
          :delete-api="(id) => api.delete(`/armors/${id}`)"
        />
      </n-tab-pane>
      <n-tab-pane name="vehicles" tab="载具">
        <config-table
          type="vehicles"
          :columns="vehicleColumns"
          :fields="vehicleFields"
          :list-api="() => api.get('/vehicles')"
          :create-api="(d) => api.post('/vehicles', d)"
          :update-api="(id, d) => api.patch(`/vehicles/${id}`, d)"
          :delete-api="(id) => api.delete(`/vehicles/${id}`)"
        />
      </n-tab-pane>
      <n-tab-pane name="assetReferences" tab="资产参考">
        <config-table
          type="assetReferences"
          :columns="assetRefColumns"
          :fields="assetRefFields"
          :list-api="() => api.get('/asset-references')"
          :create-api="(d) => api.post('/asset-references', d)"
          :update-api="(id, d) => api.patch(`/asset-references/${id}`, d)"
          :delete-api="(id) => api.delete(`/asset-references/${id}`)"
        />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api/client'
import ConfigTable from '@/components/ConfigTable.vue'

const activeTab = ref('weapons')

const weaponColumns = [
  { title: '名称', key: 'name' },
  { title: '分类', key: 'category' },
  { title: '伤害公式', key: 'damageFormula' },
  { title: '基础射程', key: 'baseRange' },
  { title: '时代', key: 'era' },
  { title: '价格', key: 'price' },
]
const weaponFields = [
  { key: 'name', label: '名称', required: true },
  { key: 'category', label: '分类' },
  { key: 'skillName', label: '关联技能名' },
  { key: 'damageFormula', label: '伤害公式', required: true },
  { key: 'baseRange', label: '基础射程' },
  { key: 'attacksPerRound', label: '每轮攻击' },
  { key: 'ammoCapacity', label: '弹药容量' },
  { key: 'malfunction', label: '故障值', type: 'number' },
  { key: 'era', label: '时代' },
  { key: 'price', label: '价格' },
  { key: 'inventionYear', label: '发明年份' },
  { key: 'description', label: '描述', type: 'textarea' },
  { key: 'impale', label: '贯穿', type: 'switch' },
]

const armorColumns = [
  { title: '名称', key: 'name' },
  { title: '护甲值', key: 'armorValue' },
  { title: 'MOV惩罚', key: 'movPenalty' },
  { title: '覆盖部位', key: 'coverage' },
  { title: '时代', key: 'era' },
  { title: '价格', key: 'price' },
]
const armorFields = [
  { key: 'name', label: '名称', required: true },
  { key: 'armorValue', label: '护甲值', type: 'number' },
  { key: 'movPenalty', label: 'MOV惩罚', type: 'number' },
  { key: 'coverage', label: '覆盖部位' },
  { key: 'applicableTo', label: '适用对象' },
  { key: 'era', label: '时代' },
  { key: 'price', label: '价格' },
  { key: 'category', label: '分类' },
  { key: 'description', label: '描述', type: 'textarea' },
  { key: 'resistPuncture', label: '抗穿刺', type: 'switch' },
]

const vehicleColumns = [
  { title: '名称', key: 'name' },
  { title: '所需技能', key: 'skill' },
  { title: 'MOV', key: 'mov' },
  { title: '时代', key: 'era' },
  { title: '分类', key: 'category' },
]
const vehicleFields = [
  { key: 'name', label: '名称', required: true },
  { key: 'skill', label: '所需技能' },
  { key: 'mov', label: 'MOV', type: 'number' },
  { key: 'build', label: '体格' },
  { key: 'passengerArmor', label: '乘员护甲', type: 'number' },
  { key: 'passengers', label: '乘员数' },
  { key: 'driverBuild', label: '驾驶员体格要求' },
  { key: 'riderBuild', label: '骑手体格要求' },
  { key: 'era', label: '时代' },
  { key: 'category', label: '分类' },
  { key: 'description', label: '描述', type: 'textarea' },
]

const assetRefColumns = [
  { title: '时代', key: 'era' },
  { title: '生活水平', key: 'level' },
  { title: 'CR范围', key: 'crRange', render(row: any) { return `${row.crMin ?? 0}-${row.crMax ?? 0}` } },
  { title: '现金倍数', key: 'cashMultiplier' },
  { title: '资产倍数', key: 'assetMultiplier' },
]
const assetRefFields = [
  { key: 'era', label: '时代', required: true },
  { key: 'level', label: '生活水平', required: true },
  { key: 'crMin', label: 'CR最小值', type: 'number' },
  { key: 'crMax', label: 'CR最大值', type: 'number' },
  { key: 'cashMultiplier', label: '现金倍数', type: 'number' },
  { key: 'assetMultiplier', label: '资产倍数', type: 'number' },
  { key: 'description', label: '描述', type: 'textarea' },
]
</script>

<style scoped>
.page { max-width: 1200px; margin: 0 auto; padding: 2rem; }
.back-bar { margin-bottom: 1rem; }
.page-title { margin-bottom: 1.5rem; font-size: 1.5rem; }
</style>
