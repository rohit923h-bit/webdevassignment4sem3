const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token1 = jwt.sign({ id: 'user1', role: 'user' }, process.env.JWT_SECRET);
const token2 = jwt.sign({ id: 'user2', role: 'user' }, process.env.JWT_SECRET);

const client1 = io('http://localhost:5000', { auth: { token: token1 } });
const client2 = io('http://localhost:5000', { auth: { token: token2 } });

client1.on('chatMessage', (m) => console.log('Client1 received:', m.text));
client2.on('chatMessage', (m) => console.log('Client2 received:', m.text));

setTimeout(() => {
  client1.emit('chatMessage', { room: 'general', text: 'Aditi: Hey team, backend is ready' });
}, 1000);

setTimeout(() => {
  client2.emit('chatMessage', { room: 'general', text: 'Victor: Great, tokens are working' });
}, 2000);

setTimeout(() => process.exit(), 4000);