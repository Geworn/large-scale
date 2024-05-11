import { SerialPort } from "serialport";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "node:http";

const app = express();
const server = createServer(app);
const io = new Server(server , {
  cors : {
    origin : "*"
  }
});

const serialport = new SerialPort({ path: "/dev/ttyUSB0", baudRate: 115200 });

async function main() {
  let weight = 0.0;
  try {
    serialport.on("data", (chunk) => {
      const _weight = chunk ? parseFloat(Buffer.from(chunk).toString()) : 0.0;
      weight = _weight;
      console.log({ weight });

    io.on("connection", (socket) => {
        console.log("a user connected");
        setInterval(() => {
          socket.emit("weight", weight);
        }, 100);
      });
    });

    server.listen(3250, () => {
      console.log("server running at http://localhost:3250");
    });
  } catch (error) {
    console.error(error);
  }
}

main();
