import { SerialPort } from "serialport";

async function findPort() {
    const portsList = await SerialPort.list()
    console.log(portsList)
}

findPort()