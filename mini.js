import { SerialPort } from "serialport";

const serialport = new SerialPort({ path: "/dev/ttyUSB0", baudRate: 1200 });

async function main() {
  while (true) {
    const bufferInput = serialport.read();
    await new Promise((resolve, reject) =>
      setTimeout(() => {
        resolve();
      }, 1000)
    );
    if (bufferInput) {
      const rawData = Buffer.from(bufferInput).toString();
      const dataArray = rawData.split("(");  // แยกข้อมูลด้วย "("
      if (dataArray.length > 2) {
        const targetString = dataArray[2].trim(); // เลือกส่วนที่ 3 ของอาเรย์และตัดช่องว่างส่วนเกินออก
        const targetArray = targetString.split(/\s+/);  // แยกสตริงด้วยช่องว่างหลายๆตัว
        if (targetArray.length > 1) {
          const secondData = targetArray[1];  // เลือกข้อมูลตำแหน่งที่ 2
          console.log({secondData});
        } else {
          console.log("ไม่พบข้อมูลตำแหน่งที่ 2");
        }
      } else {
        console.log("ไม่พบข้อมูลที่ต้องการ");
      }
    }
  }
}

main();
