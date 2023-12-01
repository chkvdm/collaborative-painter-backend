import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import makeStoppable from 'stoppable';
import cors from 'cors';

import config from './config.js';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [config.client],
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

const rooms = {};

io.on('connection', (socket) => {
  socket.on('join', (roomId) => {
    socket.join(roomId);
    rooms[roomId] = rooms[roomId] || [];
    io.to(roomId).emit('boardData', rooms[roomId]);
  });

  socket.on('draw', (data) => {
    const { roomId, drawing } = data;
    rooms[roomId].push(drawing);
    io.to(roomId).emit('draw', drawing);
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3001;

const server = makeStoppable(httpServer);

function startServer() {
  const stopServer = () => {
    return new Promise((resolve) => {
      server.stop(resolve);
    });
  };

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`Server is running on ${server._connectionKey}`);
      resolve(stopServer);
    });
  });
}

startServer();
