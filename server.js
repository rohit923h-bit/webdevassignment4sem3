require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const EventEmitter = require('events');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json());

const emitter = new EventEmitter();
app.set('emitter', emitter);

emitter.on('userRegistered', (user) => {
  console.log('Event: new user registered ->', user.username);
});
emitter.on('noteCreated', (note) => {
  console.log('Event: note created ->', note.title);
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.query?.token;

        if (!token) {
            return next(new Error("Unauthorized"));
        }

        socket.user = jwt.verify(
          token,
          process.env.JWT_SECRET);
        next();

    } catch (err) {
    console.log("Socket Auth Error:", err.message);
    next(new Error("Unauthorized"));
    }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.join('general');
  console.log(`${socket.id} joined room general`);

  socket.on('chatMessage', ({ room = 'general', text }) => {
    io.to(room).emit('chatMessage', { user: socket.user.id, text });
    console.log(`[${room}] ${text}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT, () => {
      console.log(`[server] listening on http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log('DB error:', err.message));