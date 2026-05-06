<template>
  <div v-if="inv" class="page">
    <div class="back-bar">
      <n-button text @click="$router.push('/investigators')">
        <template #icon>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </template>
        返回角色卡列表
      </n-button>
    </div>

    <!-- Header with Portrait -->
    <div class="header">
      <div class="header-left">
        <div class="portrait-wrapper" @mouseenter="portraitHover = true" @mouseleave="portraitHover = false">
          <div class="portrait" :class="{ 'has-image': inv.avatarUrl }">
            <img v-if="inv.avatarUrl" :src="inv.avatarUrl" alt="角色形象" />
            <div v-else class="portrait-placeholder">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>上传形象</span>
            </div>
          </div>
          <transition name="fade">
            <div v-if="portraitHover" class="portrait-overlay">
              <label class="portrait-action upload-label">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" @change="onPortraitSelect" hidden />
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {{ inv.avatarUrl ? '更换' : '上传' }}
              </label>
              <div v-if="inv.avatarUrl" class="portrait-action delete-btn" @click="deletePortrait">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                删除
              </div>
            </div>
          </transition>
          <n-spin v-if="uploading" class="portrait-loading" size="large" />
        </div>
        <div class="header-info">
          <h2>{{ inv.name }}</h2>
          <div class="header-meta">
            <n-tag :type="statusType(inv.status)">{{ statusText(inv.status) }}</n-tag>
            <span v-if="inv.occupation" class="occupation-tag">{{ inv.occupation.name }}</span>
          </div>
        </div>
      </div>
      <n-space>
        <n-button size="small" @click="printSheet">🖨️ 打印</n-button>
      </n-space>
    </div>

    <n-tabs type="line">
      <n-tab-pane name="attr" tab="属性">
        <div class="info-bar">
          <span>{{ eraText(inv.era) }}</span>
          <span v-if="inv.age">{{ inv.age }}岁</span>
          <span v-if="inv.gender">{{ inv.gender }}</span>
          <span v-if="inv.occupation">{{ inv.occupation.name }}</span>
        </div>
        <div class="attr-grid">
          <div class="attr-box"><label>{{ attrMap.str }}</label><span>{{ inv.str }}</span></div>
          <div class="attr-box"><label>{{ attrMap.con }}</label><span>{{ inv.con }}</span></div>
          <div class="attr-box"><label>{{ attrMap.siz }}</label><span>{{ inv.siz }}</span></div>
          <div class="attr-box"><label>{{ attrMap.dex }}</label><span>{{ inv.dex }}</span></div>
          <div class="attr-box"><label>{{ attrMap.app }}</label><span>{{ inv.app }}</span></div>
          <div class="attr-box"><label>{{ attrMap.int }}</label><span>{{ inv.int }}</span></div>
          <div class="attr-box"><label>{{ attrMap.pow }}</label><span>{{ inv.pow }}</span></div>
          <div class="attr-box"><label>{{ attrMap.edu }}</label><span>{{ inv.edu }}</span></div>
          <div class="attr-box luck"><label>幸运</label><span>{{ inv.luck }}</span></div>
        </div>
        <div class="derived">
          <div>HP: {{ inv.hp }}/{{ inv.maxHp }}</div>
          <div>SAN: {{ inv.san }}/{{ inv.maxSan }}</div>
          <div>MP: {{ inv.mp }}/{{ inv.maxMp }}</div>
          <div>MOV: {{ inv.mov }}</div>
          <div>DB: {{ inv.db }}</div>
          <div>Build: {{ inv.build }}</div>
          <div>重伤: {{ inv.majorWoundValue }}</div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="skills" tab="技能">
        <div v-if="inv.skills && inv.skills.length > 0">
          <n-collapse :default-expanded-names="expandedSkillCategories">
            <n-collapse-item v-for="cat in skillCategories" :key="cat.name" :name="cat.name" :title="cat.name + ' (' + cat.skills.length + ')'">
              <div class="skill-list">
                <div v-for="s in cat.skills" :key="s.id" class="skill-item">
                  <n-tooltip trigger="hover">
                    <template #trigger>
                      <span class="skill-name">{{ s.skill?.name || s.customName }}</span>
                    </template>
                    <div>基础值: {{ s.skill?.baseValue || 0 }}%</div>
                    <div v-if="s.skill?.description">{{ s.skill.description }}</div>
                  </n-tooltip>
                  <span class="skill-val">{{ (s.initial || 0) + (s.occupational || 0) + (s.interest || 0) + (s.growth || 0) }}</span>
                </div>
              </div>
            </n-collapse-item>
          </n-collapse>
        </div>
        <n-empty v-else description="暂无技能" />
      </n-tab-pane>

      <n-tab-pane name="assets" tab="资产">
        <div class="assets-grid">
          <div class="asset-box">
            <label>信用等级</label>
            <span>{{ inv.creditRating ?? 0 }}</span>
          </div>
          <div class="asset-box">
            <label>现金 ($)</label>
            <span>{{ inv.cash ?? 0 }}</span>
          </div>
          <div class="asset-box">
            <label>资产 ($)</label>
            <span>{{ inv.assets ?? 0 }}</span>
          </div>
          <div class="asset-box">
            <label>消费水平</label>
            <span>{{ inv.spendingLevel ?? 0 }}</span>
          </div>
          <div class="asset-box wide">
            <label>生活水平</label>
            <span>{{ livingStandardText(inv.livingStandard) }}</span>
          </div>
        </div>
        <div v-if="inv.items && inv.items.length > 0" class="items-section">
          <h4>随身物品</h4>
          <div class="item-list">
            <div v-for="item in inv.items" :key="item.id" class="item-row">
              <span>{{ item.customName || item.itemTemplate?.name || '未命名物品' }}</span>
              <n-tag size="small" :type="item.location === 'hand' ? 'success' : 'default'">
                {{ item.location === 'hand' ? '手持' : '储存' }}
              </n-tag>
            </div>
          </div>
        </div>
        <n-empty v-else description="暂无物品" />
      </n-tab-pane>

      <!-- MMO-style Equipment Panel -->
      <n-tab-pane name="gear" tab="装备">
        <div class="equip-panel">
          <!-- Left: Weapon Slots -->
          <div class="equip-left">
            <div class="equip-slot weapon-slot" :class="{ equipped: rightHandWeapon }">
              <div class="slot-label">主手</div>
              <div class="slot-icon">
                <svg v-if="!rightHandWeapon" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>
              </div>
              <div v-if="rightHandWeapon" class="slot-item">
                <div class="slot-item-name">{{ rightHandWeapon.customName || rightHandWeapon.weapon?.name }}</div>
                <div class="slot-item-stat">{{ rightHandWeapon.weapon?.damageFormula }}</div>
              </div>
              <div v-else class="slot-empty">空</div>
            </div>
            <div class="equip-slot weapon-slot" :class="{ equipped: leftHandWeapon }">
              <div class="slot-label">副手</div>
              <div class="slot-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
              </div>
              <div v-if="leftHandWeapon" class="slot-item">
                <div class="slot-item-name">{{ leftHandWeapon.customName || leftHandWeapon.weapon?.name }}</div>
                <div class="slot-item-stat">{{ leftHandWeapon.weapon?.damageFormula }}</div>
              </div>
              <div v-else class="slot-empty">空</div>
            </div>
          </div>

          <!-- Center: Character Figure -->
          <div class="equip-center">
            <div class="character-figure">
              <!-- Head slot -->
              <div class="figure-slot head-slot" :class="{ equipped: headArmor }">
                <div class="figure-slot-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
                </div>
                <div v-if="headArmor" class="figure-slot-item">
                  <span>{{ headArmor.armor?.name }}</span>
                  <span class="armor-val">+{{ headArmor.armor?.armorValue }}</span>
                </div>
              </div>
              <!-- Body slot -->
              <div class="figure-slot body-slot" :class="{ equipped: bodyArmor }">
                <div class="figure-slot-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 4h12l2 6v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10l2-6z"/><path d="M10 4v2a2 2 0 0 0 4 0V4"/></svg>
                </div>
                <div v-if="bodyArmor" class="figure-slot-item">
                  <span>{{ bodyArmor.armor?.name }}</span>
                  <span class="armor-val">+{{ bodyArmor.armor?.armorValue }}</span>
                </div>
              </div>
              <!-- Stats bar below figure -->
              <div class="figure-stats">
                <div class="stat-pill"><span class="stat-label">HP</span><span class="stat-val">{{ inv.hp }}/{{ inv.maxHp }}</span></div>
                <div class="stat-pill"><span class="stat-label">SAN</span><span class="stat-val">{{ inv.san }}/{{ inv.maxSan }}</span></div>
                <div class="stat-pill"><span class="stat-label">MOV</span><span class="stat-val">{{ inv.mov }}</span></div>
              </div>
            </div>
          </div>

          <!-- Right: Armor Slots -->
          <div class="equip-right">
            <div class="equip-slot armor-slot" :class="{ equipped: headArmor }">
              <div class="slot-label">头部</div>
              <div class="slot-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              </div>
              <div v-if="headArmor" class="slot-item">
                <div class="slot-item-name">{{ headArmor.armor?.name }}</div>
                <div class="slot-item-stat">护甲 +{{ headArmor.armor?.armorValue }}</div>
              </div>
              <div v-else class="slot-empty">无</div>
            </div>
            <div class="equip-slot armor-slot" :class="{ equipped: bodyArmor }">
              <div class="slot-label">躯干</div>
              <div class="slot-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div v-if="bodyArmor" class="slot-item">
                <div class="slot-item-name">{{ bodyArmor.armor?.name }}</div>
                <div class="slot-item-stat">护甲 +{{ bodyArmor.armor?.armorValue }}</div>
              </div>
              <div v-else class="slot-empty">无</div>
            </div>
          </div>
        </div>

        <!-- Equipment List below the visual panel -->
        <div class="equip-lists">
          <div v-if="inv.weapons && inv.weapons.length" class="equip-list-section">
            <h4>武器</h4>
            <div class="equip-list">
              <div v-for="w in inv.weapons" :key="w.id" class="equip-list-item">
                <div class="equip-list-main">
                  <span class="equip-list-name">{{ w.customName || w.weapon?.name || '未知' }}</span>
                  <span class="equip-list-detail">{{ w.weapon?.damageFormula }} | {{ w.weapon?.baseRange || '近战' }} | 成功率 {{ w.successRate }}%</span>
                </div>
                <div class="equip-list-ammo" v-if="w.weapon?.ammoCapacity">
                  弹药: {{ w.currentAmmo ?? 0 }}/{{ w.weapon.ammoCapacity }}
                </div>
              </div>
            </div>
          </div>

          <div v-if="inv.armors && inv.armors.length" class="equip-list-section">
            <h4>防具</h4>
            <div class="equip-list">
              <div v-for="a in inv.armors" :key="a.id" class="equip-list-item">
                <div class="equip-list-main">
                  <span class="equip-list-name">{{ a.armor?.name || '未知' }}</span>
                  <span class="equip-list-detail">护甲 +{{ a.armor?.armorValue }} | 覆盖: {{ a.armor?.coverage || '全身' }}</span>
                </div>
                <n-tag size="small" :type="a.isEquipped ? 'success' : 'default'">
                  {{ a.isEquipped ? '已装备' : '未装备' }}
                </n-tag>
              </div>
            </div>
          </div>

          <div v-if="inv.vehicles && inv.vehicles.length" class="equip-list-section">
            <h4>载具</h4>
            <div class="equip-list">
              <div v-for="v in inv.vehicles" :key="v.id" class="equip-list-item">
                <span class="equip-list-name">{{ v.customName || v.vehicle?.name || '未知' }}</span>
                <span class="equip-list-detail">{{ v.vehicle?.skill }} | MOV {{ v.vehicle?.mov }}</span>
              </div>
            </div>
          </div>

          <div v-if="inv.otherAssets && inv.otherAssets.length" class="equip-list-section">
            <h4>其他资产</h4>
            <div class="equip-list">
              <div v-for="a in inv.otherAssets" :key="a.id" class="equip-list-item">
                <span class="equip-list-name">{{ a.name }}</span>
                <span class="equip-list-detail">{{ assetCategoryText(a.category) }} | ${{ a.value?.toLocaleString?.() || a.value }}</span>
              </div>
            </div>
          </div>

          <n-empty v-if="!inv.weapons?.length && !inv.armors?.length && !inv.vehicles?.length && !inv.otherAssets?.length" description="暂无装备" />
        </div>
      </n-tab-pane>

      <n-tab-pane name="story" tab="背景">
        <div class="story">
          <div v-if="inv.description"><h4>形象描述</h4><p>{{ inv.description }}</p></div>
          <div v-if="inv.belief"><h4>信仰/信念</h4><p>{{ inv.belief }}</p></div>
          <div v-if="inv.significantPeople"><h4>重要之人</h4><p>{{ inv.significantPeople }}</p></div>
          <div v-if="inv.meaningfulLocations"><h4>意义非凡之地</h4><p>{{ inv.meaningfulLocations }}</p></div>
          <div v-if="inv.treasuredPossessions"><h4>珍贵之物</h4><p>{{ inv.treasuredPossessions }}</p></div>
          <div v-if="inv.traits"><h4>特质</h4><p>{{ inv.traits }}</p></div>
          <div v-if="inv.injuriesAndScars"><h4>伤痕与疤痕</h4><p>{{ inv.injuriesAndScars }}</p></div>
          <div v-if="inv.phobiasAndManias"><h4>恐惧症与躁狂症</h4><p>{{ inv.phobiasAndManias }}</p></div>
          <div v-if="inv.tomesSpellsArtifacts"><h4>典籍、法术与奇物</h4><p>{{ inv.tomesSpellsArtifacts }}</p></div>
          <div v-if="inv.encountersWithStrange"><h4>与怪奇遭遇</h4><p>{{ inv.encountersWithStrange }}</p></div>
          <div v-if="inv.alliesAndOrganizations"><h4>盟友与组织</h4><p>{{ inv.alliesAndOrganizations }}</p></div>
          <div v-if="inv.spells"><h4>掌握的法术</h4><p>{{ inv.spells }}</p></div>
          <div v-if="inv.notes"><h4>笔记</h4><p>{{ inv.notes }}</p></div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <div class="actions">
      <n-space>
        <n-button v-if="inv.status === 'DRAFT'" @click="goEdit">编辑</n-button>
        <n-button v-if="inv.status === 'DRAFT'" type="primary" @click="submit">提交审核</n-button>
        <n-button type="error" @click="confirmDelete">删除</n-button>
      </n-space>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessage, useDialog } from 'naive-ui'
import api from '@/api/client'

const attrMap: Record<string, string> = {
  str: '力量', con: '体质', siz: '体型', dex: '敏捷',
  app: '外貌', int: '智力', pow: '意志', edu: '教育',
}

const route = useRoute()
const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const inv = ref<any>(null)
const portraitHover = ref(false)
const uploading = ref(false)

const skillCategories = computed(() => {
  if (!inv.value?.skills) return []
  const map = new Map<string, any[]>()
  for (const s of inv.value.skills) {
    const cat = s.skill?.category || '其他'
    if (!map.has(cat)) map.set(cat, [])
    map.get(cat)!.push(s)
  }
  return Array.from(map.entries()).map(([name, skills]) => ({ name, skills }))
})

const expandedSkillCategories = computed(() => {
  return skillCategories.value
    .filter((cat: any) => cat.skills.some((s: any) => (s.occupational || 0) + (s.interest || 0) + (s.growth || 0) > 0))
    .map((cat: any) => cat.name)
})

// Equipment computed
const rightHandWeapon = computed(() => inv.value?.weapons?.[0] || null)
const leftHandWeapon = computed(() => inv.value?.weapons?.[1] || null)
const headArmor = computed(() => inv.value?.armors?.find((a: any) => a.armor?.coverage?.includes('头')) || null)
const bodyArmor = computed(() => inv.value?.armors?.find((a: any) => !a.armor?.coverage?.includes('头')) || null)

onMounted(async () => {
  await load()
})

async function load() {
  const res = await api.get(`/investigators/${route.params.id}`)
  inv.value = res.data
}

// Portrait upload
async function onPortraitSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    message.error('图片大小不能超过 5MB')
    return
  }
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await api.post(`/investigators/${inv.value.id}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    inv.value.avatarUrl = res.data.url
    message.success('形象已更新')
  } catch (err: any) {
    message.error(err.response?.data?.message || '上传失败')
  } finally {
    uploading.value = false
    // Reset input so same file can be re-selected
    const input = document.querySelector('.portrait-overlay input[type="file"]') as HTMLInputElement
    if (input) input.value = ''
  }
}

async function deletePortrait() {
  try {
    await api.delete(`/investigators/${inv.value.id}/avatar`)
    inv.value.avatarUrl = null
    message.success('形象已删除')
  } catch (err: any) {
    message.error(err.response?.data?.message || '删除失败')
  }
}

function goEdit() {
  router.push(`/investigator/${inv.value.id}/edit`)
}

async function submit() {
  try {
    await api.post(`/investigators/${inv.value.id}/submit`)
    message.success('已提交审核')
    inv.value.status = 'PENDING'
  } catch (e: any) {
    message.error(e.response?.data?.message || '提交失败')
  }
}

function confirmDelete() {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这个角色卡吗？此操作不可恢复。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await api.delete(`/investigators/${inv.value.id}`)
        message.success('已删除')
        router.push('/investigators')
      } catch (e: any) {
        message.error(e.response?.data?.message || '删除失败')
      }
    },
  })
}

function statusType(status: string) {
  const map: Record<string, string> = { DRAFT: 'default', PENDING: 'warning', APPROVED: 'success', ARCHIVED: 'error' }
  return map[status] || 'default'
}
function statusText(status: string) {
  const map: Record<string, string> = { DRAFT: '草稿', PENDING: '待审核', APPROVED: '已通过', ARCHIVED: '已归档' }
  return map[status] || status
}
function eraText(era: string) {
  const map: Record<string, string> = { MODERN: '现代', Y1920S: '1920s', GASLIGHT: '煤气灯', PULP: 'Pulp' }
  return map[era] || era
}
function livingStandardText(ls: string) {
  const map: Record<string, string> = {
    DESTITUTE: '身无分文', POOR: '拮据', AVERAGE: '标准', COMFORTABLE: '小康', WEALTHY: '富裕', RICH: '富豪',
  }
  return map[ls] || ls || '-'
}
function assetCategoryText(c: string) {
  const map: Record<string, string> = {
    vehicle: '车辆', residence: '住所', luxury: '奢侈品', stock: '股票', other: '其他',
  }
  return map[c] || c || '-'
}

function printSheet() {
  window.print()
}
</script>

<style scoped>
.page { max-width: 800px; margin: 0 auto; padding: 2rem; }
.back-bar { margin-bottom: 1rem; }

/* Header with Portrait */
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
.header-left { display: flex; gap: 1.25rem; align-items: flex-start; }
.header-info { display: flex; flex-direction: column; gap: 0.5rem; }
.header-info h2 { margin: 0; font-size: 1.5rem; }
.header-meta { display: flex; gap: 0.5rem; align-items: center; }
.occupation-tag { font-size: 0.85rem; color: #8B4513; background: #fff8f0; padding: 2px 8px; border-radius: 4px; }

/* Portrait */
.portrait-wrapper { position: relative; width: 100px; height: 100px; flex-shrink: 0; cursor: pointer; }
.portrait { width: 100px; height: 100px; border-radius: 12px; overflow: hidden; border: 2px solid #e8e8e3; background: #f9f9f5; display: flex; align-items: center; justify-content: center; }
.portrait.has-image { border-color: #d4a574; }
.portrait img { width: 100%; height: 100%; object-fit: cover; }
.portrait-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; color: #bbb; }
.portrait-placeholder span { font-size: 0.75rem; }
.portrait-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; }
.portrait-action { color: #fff; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 0.25rem; padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.15); transition: background 0.2s; }
.portrait-action:hover { background: rgba(255,255,255,0.3); }
.upload-label { cursor: pointer; }
.delete-btn { color: #ff6b6b; }
.portrait-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); border-radius: 12px; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Attr / Skills / Assets (unchanged) */
.attr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.attr-box { background: #f9f9f5; padding: 1rem; border-radius: 8px; text-align: center; }
.attr-box label { display: block; font-size: 0.8rem; color: #999; margin-bottom: 0.25rem; }
.attr-box span { font-size: 1.5rem; font-weight: bold; color: #8B4513; }
.derived { display: flex; gap: 1.5rem; background: #fff8f0; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
.info-bar { display: flex; gap: 1rem; margin-bottom: 1rem; font-size: 0.9rem; color: #666; }
.attr-box.luck { background: #fff8f0; }
.attr-box.luck span { color: #d4a574; }
.skill-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
.skill-item { display: flex; justify-content: space-between; padding: 0.5rem 0.75rem; background: #f9f9f5; border-radius: 6px; }
.skill-name { color: #555; font-size: 0.9rem; }
.skill-val { font-weight: 600; color: #333; }
.assets-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.asset-box { background: #f0f5ff; padding: 1rem; border-radius: 8px; text-align: center; }
.asset-box.wide { grid-column: span 2; }
.asset-box label { display: block; font-size: 0.8rem; color: #888; margin-bottom: 0.25rem; }
.asset-box span { font-size: 1.25rem; font-weight: bold; color: #333; }
.items-section { margin-top: 1rem; }
.items-section h4 { color: #8B4513; margin-bottom: 0.75rem; }
.item-list { display: flex; flex-direction: column; gap: 0.5rem; }
.item-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: #f9f9f5; border-radius: 6px; }
.story h4 { color: #8B4513; margin-bottom: 0.5rem; }
.story p { color: #555; line-height: 1.6; margin-bottom: 1rem; }
.actions { margin-top: 1.5rem; }

/* MMO Equipment Panel */
.equip-panel { display: flex; gap: 2rem; align-items: flex-start; justify-content: center; padding: 1.5rem; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 12px; margin-bottom: 1.5rem; min-height: 320px; }
.equip-left, .equip-right { display: flex; flex-direction: column; gap: 1rem; width: 160px; }
.equip-center { flex: 0 0 200px; display: flex; flex-direction: column; align-items: center; }

.equip-slot { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0.75rem; text-align: center; transition: all 0.3s; min-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; }
.equip-slot.equipped { border-color: #d4a574; background: rgba(212,165,116,0.1); box-shadow: 0 0 12px rgba(212,165,116,0.15); }
.slot-label { font-size: 0.7rem; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
.slot-icon { color: #555; }
.equip-slot.equipped .slot-icon { color: #d4a574; }
.slot-item { margin-top: 0.25rem; }
.slot-item-name { font-size: 0.8rem; color: #e0d5c5; font-weight: 500; }
.slot-item-stat { font-size: 0.7rem; color: #d4a574; }
.slot-empty { font-size: 0.75rem; color: #555; }

/* Character Figure */
.character-figure { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; position: relative; }
.figure-slot { position: relative; display: flex; flex-direction: column; align-items: center; padding: 0.5rem; border-radius: 8px; transition: all 0.3s; }
.figure-slot.equipped { background: rgba(212,165,116,0.15); }
.figure-slot-icon { color: #666; }
.figure-slot.equipped .figure-slot-icon { color: #d4a574; }
.figure-slot-item { text-align: center; margin-top: 0.25rem; }
.figure-slot-item span { display: block; font-size: 0.75rem; color: #ccc; }
.armor-val { color: #5bc0de; font-weight: 600; }
.figure-stats { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
.stat-pill { display: flex; gap: 0.25rem; align-items: center; padding: 2px 8px; border-radius: 10px; background: rgba(255,255,255,0.08); font-size: 0.7rem; }
.stat-label { color: #888; }
.stat-val { color: #e0d5c5; font-weight: 500; }

/* Equipment Lists */
.equip-lists { display: flex; flex-direction: column; gap: 1.5rem; }
.equip-list-section h4 { color: #8B4513; margin-bottom: 0.75rem; font-size: 1rem; }
.equip-list { display: flex; flex-direction: column; gap: 0.5rem; }
.equip-list-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: #f9f9f5; border-radius: 8px; border-left: 3px solid #d4a574; }
.equip-list-main { display: flex; flex-direction: column; gap: 0.15rem; }
.equip-list-name { font-weight: 500; color: #333; font-size: 0.9rem; }
.equip-list-detail { font-size: 0.8rem; color: #888; }
.equip-list-ammo { font-size: 0.8rem; color: #666; background: #fff8f0; padding: 2px 8px; border-radius: 4px; }

@media print {
  .back-bar,
  .header .n-space .n-button,
  .portrait-overlay { display: none !important; }
  .page { padding: 0; max-width: 100%; }
  .equip-panel { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .attr-box { background: #f9f9f5 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .derived { background: #fff8f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
</style>
