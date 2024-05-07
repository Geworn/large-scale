import { SerialPort } from "serialport";

const serialport = new SerialPort({ path: "COM7", baudRate: 115200 });

async function main() {
  while (true) {
    const bufferInput = serialport.read();
    await new Promise((reslove, reject) =>
      setTimeout(() => {
        reslove();
      }, 250)
    );
    const weight = bufferInput ? parseFloat(Buffer.from(bufferInput).toString()) : 0.0;
    console.log({ weight });
  }
}

main();
