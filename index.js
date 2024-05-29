import { SerialPort } from "serialport";
import express from "express";
import { Server } from "socket.io";
import { createServer } from "node:http";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const serialPortPath = process.env.SERIAL_PORT_PATH || "/dev/ttyUSB0";
let serialport;
let reconnectTimeout;

async function connectToSerialPort() {
  clearTimeout(reconnectTimeout); // Clear any existing reconnect attempts
  try {
    serialport = new SerialPort({ path: serialPortPath, baudRate: 1200 });
    console.log("Connected to serial port:", serialPortPath);

    serialport.on("error", (err) => {
      console.error("Serial Port Error:", err);
      retryConnection();
    });

    serialport.on("close", () => {
      console.log("Serial port disconnected. Attempting to reconnect...");
      retryConnection();
    });

    handleSocketConnections();
  } catch (error) {
    console.error("Error connecting to serial port:", error);
    retryConnection();
  }
}

function retryConnection() {
  reconnectTimeout = setTimeout(connectToSerialPort, 5000); // Reconnect after 5 seconds
}

function readFromSerialPort() {
  return new Promise((resolve, reject) => {
    serialport.on("data", (data) => {
      resolve(data.toString());
    });
    serialport.once("error", (err) => {
      reject(err);
    });
  });
}

function handleSocketConnections() {
  io.on("connection", (socket) => {
    console.log("a user connected");

    const sendWeightData = async () => {
      try {
        const bufferInput = serialport.read();
        await new Promise((resolve, reject) =>
          setTimeout(() => {
            resolve();
          }, 1000)
        );
        if (bufferInput) {
          const rawData = Buffer.from(bufferInput).toString();
          const dataArray = rawData.split("("); // แยกข้อมูลด้วย "("
          if (dataArray.length > 2) {
            const targetString = dataArray[2].trim(); // เลือกส่วนที่ 3 ของอาเรย์และตัดช่องว่างส่วนเกินออก
            const targetArray = targetString.split(/\s+/); // แยกสตริงด้วยช่องว่างหลายๆตัว
            if (targetArray.length > 1) {
              const secondData = targetArray[1]; // เลือกข้อมูลตำแหน่งที่ 2
              console.log({ weight: secondData });
              socket.emit("weight", secondData);
            } else {
              console.log("ไม่พบข้อมูลตำแหน่งที่ 2");
            }
          } else {
            console.log("ไม่พบข้อมูลที่ต้องการ");
          }
        }
      } catch (error) {
        console.error("Error parsing weight data:", error);
        socket.emit("error", "Invalid weight data received");
      }
    };

    // Read data repeatedly
    const intervalId = setInterval(sendWeightData, 2000);

    socket.on("disconnect", () => {
      console.log("user disconnected");
      clearInterval(intervalId);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });
}

async function main() {
  try {
    server.listen(3250, () => {
      console.log("Server running at http://localhost:3250");
    });
    await connectToSerialPort();
  } catch (error) {
    console.error("An error occurred:", error);
    retryConnection();
  }
}

main();
