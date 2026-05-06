const { io } = require('socket.io-client');

const TOKEN = process.env.WS_TOKEN;
const CAMPAIGN_ID = process.env.CAMPAIGN_ID;
if (!TOKEN || !CAMPAIGN_ID) {
  console.error('Usage: WS_TOKEN=xxx CAMPAIGN_ID=xxx node ws-test.cjs');
  process.exit(1);
}

const socket = io('http://localhost:3000/campaign', {
  auth: { token: TOKEN },
  transports: ['websocket'],
});

const tests = [];
let testIndex = 0;

function nextTest() {
  if (testIndex >= tests.length) {
    console.log('\n✅ 所有WebSocket测试完成');
    socket.disconnect();
    process.exit(0);
  }
  const t = tests[testIndex++];
  console.log(`\n▶️ 测试: ${t.name}`);
  t.fn();
}

socket.on('connect', () => {
  console.log('🔌 WebSocket 已连接, socket id:', socket.id);
  nextTest();
});

socket.on('connect_error', (err) => {
  console.error('❌ 连接失败:', err.message);
  process.exit(1);
});

socket.on('new_message', (msg) => {
  console.log('📨 new_message:', msg.content?.slice(0, 60) || msg);
  setTimeout(nextTest, 200);
});

socket.on('check_result', (msg) => {
  console.log('🎲 check_result:', msg.content);
  setTimeout(nextTest, 200);
});

socket.on('combat_updated', (msg) => {
  console.log('⚔️ combat_updated:', msg ? `round ${msg.roundNumber}, turn ${msg.turnIndex}, combatants=${msg.combatants?.length}` : 'null');
  setTimeout(nextTest, 200);
});

socket.on('combat_ended', (msg) => {
  console.log('🏁 combat_ended');
  setTimeout(nextTest, 200);
});

socket.on('user_joined', (msg) => console.log('👤 user_joined:', msg.username));
socket.on('user_left', (msg) => console.log('👋 user_left:', msg.username));
socket.on('ai_stream', (msg) => console.log('🤖 ai_stream chunk:', msg.chunk?.slice(0, 40)));
socket.on('scene_changed', (msg) => console.log('🎬 scene_changed:', msg.sceneName));

// Test 1: join campaign
tests.push({
  name: 'join_campaign',
  fn: () => {
    socket.emit('join_campaign', { campaignId: CAMPAIGN_ID }, (res) => {
      console.log('join_campaign ack:', res);
      setTimeout(nextTest, 200);
    });
  },
});

// Test 2: send text message
tests.push({
  name: 'send_message (TEXT)',
  fn: () => {
    socket.emit('send_message', { content: 'WebSocket端到端测试消息', messageType: 'TEXT' }, (res) => {
      console.log('send_message ack success:', res.success);
    });
  },
});

// Test 3: skill check via WS
tests.push({
  name: 'request_check (侦查)',
  fn: () => {
    socket.emit('request_check', {
      skillName: '侦查',
      targetValue: 55,
      bonusDice: 0,
      penaltyDice: 0,
    }, (res) => {
      console.log('request_check ack success:', res.success);
    });
  },
});

// Test 4: send system message
tests.push({
  name: 'send_system_message',
  fn: () => {
    socket.emit('send_system_message', {
      content: '【系统广播】WebSocket测试进行中',
      metadata: { test: true },
    }, (res) => {
      console.log('send_system_message ack success:', res.success);
    });
  },
});

// Test 5: presence update
tests.push({
  name: 'presence_update',
  fn: () => {
    socket.emit('presence_update', { status: 'online' }, (res) => {
      console.log('presence_update ack:', res);
      setTimeout(nextTest, 200);
    });
  },
});

// Test 6: scene change
tests.push({
  name: 'scene_change',
  fn: () => {
    socket.emit('scene_change', { sceneId: 'test-scene-1', sceneName: '测试场景切换' }, (res) => {
      console.log('scene_change ack:', res);
      setTimeout(nextTest, 200);
    });
  },
});

// Test 7: combat start via WS
tests.push({
  name: 'combat_start (NPC only)',
  fn: () => {
    socket.emit('combat_start', {
      investigatorIds: [],
      npcs: [{ name: '深潜者侦察兵', dex: 14, hp: 12 }],
    }, (res) => {
      console.log('combat_start ack:', res.success, 'error:', res.error);
    });
  },
});

// Test 8: combat next turn
tests.push({
  name: 'combat_next_turn',
  fn: () => {
    socket.emit('combat_next_turn', {}, (res) => {
      console.log('combat_next_turn ack:', res.success, 'error:', res.error);
    });
  },
});

// Test 9: combat end
tests.push({
  name: 'combat_end',
  fn: () => {
    socket.emit('combat_end', {}, (res) => {
      console.log('combat_end ack:', res.success, 'error:', res.error);
    });
  },
});

// Test 10: AI generate
tests.push({
  name: 'ai_generate',
  fn: () => {
    socket.emit('ai_generate', {
      type: 'scene',
      prompt: '描述一个潮湿的地下洞穴，光线昏暗',
    }, (res) => {
      console.log('ai_generate ack:', res);
      setTimeout(nextTest, 4000);
    });
  },
});

// Timeout safety
setTimeout(() => {
  console.error('\n⚠️ 测试超时，强制退出');
  process.exit(1);
}, 25000);
