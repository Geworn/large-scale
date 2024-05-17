import { SerialPort } from 'serialport';
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import dotenv from 'dotenv';
import { Writable } from 'stream';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const serialPortPath = process.env.SERIAL_PORT_PATH || '/dev/ttyUSB0';
let serialport;
let reconnectTimeout;

// Custom writable stream for processing incoming serial data
class WeightStream extends Writable {
  constructor(options) {
    super(options);
  }
  
  _write(chunk, encoding, callback) {
    const data = chunk.toString();
    this.emit('data', data);
    callback();
  }
}

async function connectToSerialPort() {
  clearTimeout(reconnectTimeout); // Clear any existing reconnect attempts
  try {
    serialport = new SerialPort({ path: serialPortPath, baudRate: 115200 });
    console.log('Connected to serial port:', serialPortPath);

    const weightStream = new WeightStream();
    serialport.pipe(weightStream);

    serialport.on('error', (err) => {
      console.error('Serial Port Error:', err);
      retryConnection();
    });

    serialport.on('close', () => {
      console.log('Serial port disconnected. Attempting to reconnect...');
      retryConnection();
    });

    handleSocketConnections(weightStream);

  } catch (error) {
    console.error('Error connecting to serial port:', error);
    retryConnection();
  }
}

function retryConnection() {
  reconnectTimeout = setTimeout(connectToSerialPort, 5000); // Reconnect after 5 seconds
}

function handleSocketConnections(weightStream) {
  io.on('connection', (socket) => {
    console.log('a user connected');

    const weightDataHandler = (data) => {
      try {
        const weight = parseFloat(data) || 0.0;
        console.log({ weight });
        socket.emit('weight', weight);
      } catch (error) {
        console.error('Error parsing weight data:', error);
        socket.emit('error', 'Invalid weight data received');
      }
    };

    weightStream.on('data', weightDataHandler);

    socket.on('disconnect', () => {
      console.log('user disconnected');
      weightStream.removeListener('data', weightDataHandler);
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
    await connectToSerialPort();
  } catch (error) {
    console.error('An error occurred:', error);
    retryConnection();
  }
}

main();