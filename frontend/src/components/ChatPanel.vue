<template>
  <div class="chat-panel">
    <div ref="messageListRef" class="message-list" @scroll="onScroll">
      <div v-if="loadingMore" class="loading-more">加载中...</div>
      <div v-for="msg in displayMessages" :key="msg.id" class="message-row" :class="msg.senderType">
        <div class="message-header">
          <span class="sender">{{ msg.senderName }}</span>
          <span class="time">{{ formatTime(msg.createdAt) }}</span>
        </div>
        <div v-if="msg.messageType === 'TEXT' || msg.messageType === 'SYSTEM'" class="message-content">
          <span v-if="msg._typing" class="typing-text">{{ msg.content }}<span class="typing-cursor">|</span></span>
          <template v-else>{{ msg.content }}</template>
        </div>
        <div v-else-if="msg.messageType === 'CHECK' || (msg.metadata && msg.metadata.skillName)" class="check-card">
          <div class="check-title">{{ msg.metadata?.skillName || '检定' }}</div>
          <div class="check-result" :class="msg.metadata?.successLevel">
            <span class="roll">{{ msg.metadata?.rollResult ?? msg.content }}</span>
            <span class="sep">/</span>
            <span class="target">{{ msg.metadata?.targetValue }}</span>
            <span class="level">{{ levelText(msg.metadata?.successLevel) }}</span>
          </div>
          <div v-if="msg.metadata?.rawDice" class="raw-dice">
            <span v-for="(t, i) in msg.metadata.rawDice.tensDigits" :key="i" class="dice-tens" :class="{ kept: i === msg.metadata.rawDice.keptTensIndex, discarded: i !== msg.metadata.rawDice.keptTensIndex }">{{ t }}0</span>
            <span class="dice-ones">+{{ msg.metadata.rawDice.onesDigit }}</span>
          </div>
        </div>
        <div v-else-if="msg.senderType === 'AI' || msg.messageType === 'AI_DECISION'">
          <AiDecisionCard
            :level="msg.metadata?.level || 'L1'"
            :title="msg.metadata?.action || 'AI生成'"
            :detail="msg.content"
            :created-at="msg.createdAt"
          />
        </div>
        <div v-else class="message-content">{{ msg.content }}</div>
      </div>
    </div>

    <!-- Mention Suggestions -->
    <div v-if="showMentions" class="mention-dropdown">
      <div class="mention-header">
        <span>输入 @ 引用线索或技能</span>
        <n-button text size="tiny" @click="showMentions = false">关闭</n-button>
      </div>
      <div class="mention-list">
        <div
          v-for="item in filteredMentions"
          :key="item.id"
          class="mention-item"
          :class="{ active: activeMentionIndex === filteredMentions.indexOf(item) }"
          @click="insertMention(item)"
          @mouseenter="activeMentionIndex = filteredMentions.indexOf(item)"
        >
          <span class="mention-tag" :class="item.type">{{ item.type === 'clue' ? '线索' : '技能' }}</span>
          <span class="mention-label">{{ item.label }}</span>
        </div>
        <div v-if="filteredMentions.length === 0" class="mention-empty">无匹配项</div>
      </div>
    </div>

    <div class="input-area">
      <n-input
        ref="inputRef"
        v-model:value="inputText"
        type="textarea"
        :rows="2"
        placeholder="输入消息... 输入 @ 引用线索或技能（Shift+Enter换行）"
        @keydown="onKeydown"
        @input="onInput"
      />
      <n-space vertical align="center" :size="4">
        <n-button type="primary" size="small" :disabled="!inputText.trim()" @click="send">发送</n-button>
        <n-button text size="tiny" @click="showMentions = true">@</n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import AiDecisionCard from './AiDecisionCard.vue';

interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  senderType: string;
  content: string;
  messageType: string;
  metadata?: any;
  createdAt: string;
  _typing?: boolean;
}

interface Mentionable {
  id: string;
  type: 'clue' | 'skill';
  label: string;
}

const props = defineProps<{
  messages: ChatMessage[];
  loadingMore?: boolean;
  mentionables?: { skills?: any[]; clues?: any[] };
}>();
const emit = defineEmits<{
  (e: 'send', content: string): void;
  (e: 'loadMore'): void;
}>();

const inputText = ref('');
const messageListRef = ref<HTMLDivElement>();
const inputRef = ref<any>();
const showMentions = ref(false);
const activeMentionIndex = ref(0);
const mentionQuery = ref('');

// 响应式透传消息列表，_typing 由 CampaignRoom 的 ai_stream 事件驱动
const displayMessages = computed(() => props.messages);

// 构建可引用列表
const allMentions = computed<Mentionable[]>(() => {
  const list: Mentionable[] = [];
  const skills = props.mentionables?.skills || [];
  const clues = props.mentionables?.clues || [];

  skills.forEach((s: any) => {
    list.push({ id: `skill-${s.id}`, type: 'skill', label: s.name || s.nameZh || `技能#${s.id}` });
  });
  clues.forEach((c: any) => {
    list.push({ id: `clue-${c.id}`, type: 'clue', label: c.title || `线索#${c.id}` });
  });
  return list;
});

const filteredMentions = computed(() => {
  if (!mentionQuery.value) return allMentions.value.slice(0, 20);
  const q = mentionQuery.value.toLowerCase();
  return allMentions.value.filter(m => m.label.toLowerCase().includes(q)).slice(0, 20);
});

function onInput() {
  const text = inputText.value;
  const match = text.match(/@([^\s@]*)$/);
  if (match) {
    showMentions.value = true;
    mentionQuery.value = match[1];
    activeMentionIndex.value = 0;
  } else {
    showMentions.value = false;
    mentionQuery.value = '';
  }
}

function onKeydown(e: KeyboardEvent) {
  if (showMentions.value) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredMentions.value.length === 0) return;
      activeMentionIndex.value = (activeMentionIndex.value + 1) % filteredMentions.value.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredMentions.value.length === 0) return;
      activeMentionIndex.value = (activeMentionIndex.value - 1 + filteredMentions.value.length) % filteredMentions.value.length;
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredMentions.value.length === 0) { showMentions.value = false; return; }
      const item = filteredMentions.value[activeMentionIndex.value];
      if (item) insertMention(item);
    } else if (e.key === 'Escape') {
      showMentions.value = false;
    }
    return;
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
}


function insertMention(item: Mentionable) {
  const text = inputText.value;
  const newText = text.replace(/@[^\s@]*$/, `@${item.label} `);
  inputText.value = newText;
  showMentions.value = false;
  mentionQuery.value = '';
  nextTick(() => {
    inputRef.value?.focus?.();
  });
}

function send() {
  const text = inputText.value.trim();
  if (!text) return;
  emit('send', text);
  inputText.value = '';
  showMentions.value = false;
}

function levelText(level?: string) {
  const map: Record<string, string> = {
    critical: '大成功',
    success: '成功',
    failure: '失败',
    fumble: '大失败',
  };
  return map[level || ''] || level || '';
}

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

let userScrolled = false;
let scrollTimer: ReturnType<typeof setTimeout> | null = null;
function onScroll() {
  const el = messageListRef.value;
  if (!el) return;
  userScrolled = el.scrollTop + el.clientHeight < el.scrollHeight - 50;
  if (el.scrollTop < 30) {
    if (scrollTimer) return;
    scrollTimer = setTimeout(() => {
      scrollTimer = null;
      emit('loadMore');
    }, 300);
  }
}

watch(() => props.messages.length, async () => {
  await nextTick();
  const el = messageListRef.value;
  if (el && !userScrolled) {
    el.scrollTop = el.scrollHeight;
  }
});
</script>

<style scoped>
.chat-panel { display: flex; flex-direction: column; height: 100%; }
.message-list { flex: 1; overflow-y: auto; padding: 1rem; background: #1e1e32; }
.loading-more { text-align: center; color: #999; font-size: 0.8rem; padding: 0.5rem; }
.message-row { margin-bottom: 0.75rem; }
.message-header { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.2rem; }
.sender { font-weight: 500; font-size: 0.85rem; color: #e0e0e8; }
.time { font-size: 0.7rem; color: #888; }
.message-content { background: var(--color-bg-card, #fff); padding: 0.5rem 0.75rem; border-radius: 8px; display: block; width: fit-content; max-width: 100%; font-size: 0.9rem; line-height: 1.4; word-break: break-word; }
.SYSTEM .message-content { background: var(--color-bg-elevated, #f0f0ec); color: #888; font-style: italic; }
.check-card { background: #fff; border: 1px solid #e8e8e3; border-radius: 8px; padding: 0.6rem 0.8rem; display: inline-block; }
.check-title { font-size: 0.8rem; color: #666; margin-bottom: 0.2rem; }
.check-result { display: flex; align-items: center; gap: 0.4rem; font-weight: 600; }
.check-result .roll { font-size: 1.1rem; }
.check-result .sep { color: #ccc; }
.check-result .target { color: #666; }
.check-result .level { font-size: 0.8rem; padding: 0.1rem 0.4rem; border-radius: 4px; }
.check-result.critical .level { background: #d4edda; color: #155724; animation: pulse-gold 1.5s infinite; }
.check-result.success .level { background: #d1ecf1; color: #0c5460; }
.check-result.failure .level { background: #f8d7da; color: #721c24; }
.check-result.fumble .level { background: #f5c6cb; color: #721c24; animation: shake 0.5s; }

@keyframes pulse-gold {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 215, 0, 0); }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

.raw-dice { display: flex; gap: 0.3rem; margin-top: 0.3rem; font-size: 0.75rem; }
.dice-tens { padding: 0.1rem 0.3rem; border-radius: 4px; background: #f0f0ec; color: #999; }
.dice-tens.kept { background: #e6f7ff; color: #1890ff; font-weight: 600; }
.dice-tens.discarded { text-decoration: line-through; opacity: 0.5; }
.dice-ones { padding: 0.1rem 0.3rem; border-radius: 4px; background: #fff7e6; color: #fa8c16; font-weight: 600; }
.input-area { display: flex; gap: 0.5rem; padding: 0.75rem; border-top: 1px solid #2a2a3e; background: #1a1a2e; position: relative; }
.input-area .n-input { flex: 1; }

/* Mention Dropdown */
.mention-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0.75rem;
  right: 0.75rem;
  background: #222233;
  border: 1px solid #2a2a3e;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  margin-bottom: 4px;
  max-height: 220px;
  display: flex;
  flex-direction: column;
  z-index: 100;
}
.mention-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid #2a2a3e;
  font-size: 0.75rem;
  color: #888;
}
.mention-list {
  overflow-y: auto;
  padding: 4px;
}
.mention-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s;
  color: #c0c0c8;
}
.mention-item:hover,
.mention-item.active {
  background: #2a2a3e;
}
.mention-tag {
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 4px;
  font-weight: 500;
  flex-shrink: 0;
}
.mention-tag.clue {
  background: #1a3a4a;
  color: #5bc0de;
}
.mention-tag.skill {
  background: #1a3a2a;
  color: #4ade80;
}
.mention-label {
  color: #e0e0e8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mention-empty {
  padding: 12px;
  text-align: center;
  color: #666;
  font-size: 0.8rem;
}

/* Typing Effect */
.typing-text {
  position: relative;
}
.typing-cursor {
  display: inline-block;
  width: 2px;
  background: #c49a6c;
  animation: blink 1s step-end infinite;
  margin-left: 1px;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* AI Message styling */
.message-row.AI .message-content {
  background: #2a1f15;
  border-left: 3px solid #c49a6c;
  color: #e8ddd0;
}
</style>
