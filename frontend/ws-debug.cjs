const { io } = require('socket.io-client');

const TOKEN = process.env.WS_TOKEN;
const CAMPAIGN_ID = process.env.CAMPAIGN_ID;

const socket = io('http://localhost:3000/campaign', {
  auth: { token: TOKEN },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('Connected', socket.id);

  // Test 1: join_campaign with timeout
  console.log('Emitting join_campaign...');
  const start = Date.now();
  socket.emit('join_campaign', { campaignId: CAMPAIGN_ID }, (res) => {
    console.log('join_campaign ack received in', Date.now() - start, 'ms:', res);
  });

  // Safety timeout
  setTimeout(() => {
    console.log('No ack after 3s, trying send_message anyway...');
    socket.emit('send_message', { content: 'test msg', messageType: 'TEXT' }, (res2) => {
      console.log('send_message ack:', res2);
    });
  }, 3000);
});

socket.on('connect_error', (err) => console.error('connect_error:', err.message));
socket.on('disconnect', (reason) => console.log('disconnect:', reason));
socket.on('error', (err) => console.error('error:', err));

// Catch-all listener
socket.onAny((event, ...args) => {
  console.log('📡 onAny:', event, JSON.stringify(args).slice(0, 200));
});

setTimeout(() => {
  console.log('Closing...');
  socket.disconnect();
  process.exit(0);
}, 10000);
