<template>
  <div class="chat-panel">
    <div ref="messageListRef" class="message-list" @scroll="onScroll">
      <div v-if="loadingMore" class="loading-more">加载中...</div>
      <div v-for="msg in messages" :key="msg.id" class="message-row" :class="msg.senderType">
        <div class="message-header">
          <span class="sender">{{ msg.senderName }}</span>
          <span class="time">{{ formatTime(msg.createdAt) }}</span>
        </div>
        <div v-if="msg.messageType === 'TEXT' || msg.messageType === 'SYSTEM'" class="message-content">
          {{ msg.content }}
        </div>
        <div v-else-if="msg.messageType === 'CHECK' || (msg.metadata && msg.metadata.skillName)" class="check-card">
          <div class="check-title">{{ msg.metadata?.skillName || '检定' }}</div>
          <div class="check-result" :class="msg.metadata?.successLevel">
            <span class="roll">{{ msg.metadata?.rollResult ?? msg.content }}</span>
            <span class="sep">/</span>
            <span class="target">{{ msg.metadata?.targetValue }}</span>
            <span class="level">{{ levelText(msg.metadata?.successLevel) }}</span>
          </div>
        </div>
        <div v-else class="message-content">{{ msg.content }}</div>
      </div>
    </div>
    <div class="input-area">
      <n-input v-model:value="inputText" type="textarea" :rows="2" placeholder="输入消息..." @keyup.enter.prevent="send" />
      <n-button type="primary" size="small" :disabled="!inputText.trim()" @click="send">发送</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  senderType: string;
  content: string;
  messageType: string;
  metadata?: any;
  createdAt: string;
}

const props = defineProps<{
  messages: ChatMessage[];
  loadingMore?: boolean;
}>();
const emit = defineEmits<{
  (e: 'send', content: string): void;
  (e: 'loadMore'): void;
}>();

const inputText = ref('');
const messageListRef = ref<HTMLDivElement>();

function send() {
  const text = inputText.value.trim();
  if (!text) return;
  emit('send', text);
  inputText.value = '';
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
function onScroll() {
  const el = messageListRef.value;
  if (!el) return;
  if (el.scrollTop < 30) {
    emit('loadMore');
  }
  userScrolled = el.scrollTop + el.clientHeight < el.scrollHeight - 50;
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
.message-list { flex: 1; overflow-y: auto; padding: 1rem; background: #fafaf8; }
.loading-more { text-align: center; color: #999; font-size: 0.8rem; padding: 0.5rem; }
.message-row { margin-bottom: 0.75rem; }
.message-header { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.2rem; }
.sender { font-weight: 500; font-size: 0.85rem; }
.time { font-size: 0.7rem; color: #aaa; }
.message-content { background: #fff; padding: 0.5rem 0.75rem; border-radius: 8px; display: inline-block; font-size: 0.9rem; line-height: 1.4; }
.SYSTEM .message-content { background: #f0f0ec; color: #888; font-style: italic; }
.check-card { background: #fff; border: 1px solid #e8e8e3; border-radius: 8px; padding: 0.6rem 0.8rem; display: inline-block; }
.check-title { font-size: 0.8rem; color: #666; margin-bottom: 0.2rem; }
.check-result { display: flex; align-items: center; gap: 0.4rem; font-weight: 600; }
.check-result .roll { font-size: 1.1rem; }
.check-result .sep { color: #ccc; }
.check-result .target { color: #666; }
.check-result .level { font-size: 0.8rem; padding: 0.1rem 0.4rem; border-radius: 4px; }
.check-result.critical .level { background: #d4edda; color: #155724; }
.check-result.success .level { background: #d1ecf1; color: #0c5460; }
.check-result.failure .level { background: #f8d7da; color: #721c24; }
.check-result.fumble .level { background: #f5c6cb; color: #721c24; }
.input-area { display: flex; gap: 0.5rem; padding: 0.75rem; border-top: 1px solid #e8e8e3; background: #fff; }
.input-area .n-input { flex: 1; }
</style>
