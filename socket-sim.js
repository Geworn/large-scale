import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

function handleSocketConnections() {
  io.on('connection', (socket) => {
    console.log('a user connected');

    const sendRandomWeightData = () => {
      const weight = parseFloat((18500).toFixed(2))
      console.log({weight , time : Date.now()});
      socket.emit('weight', {weight , time : Date.now()});
    };

    const intervalId = setInterval(sendRandomWeightData, 1000); // Send data every second

    socket.on('disconnect', () => {
      console.log('user disconnected');
      clearInterval(intervalId);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}

async function main() {
  try {
    server.listen(3250, () => {
      console.log('Server running at http://localhost:3250');
    });
    handleSocketConnections();
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
