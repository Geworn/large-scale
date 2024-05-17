/**
 * Pizza delivery prompt example
 * run example by writing `node pizza.js` in your console
 */

import inquirer from "inquirer";
import { SerialPort } from "serialport";

const portsList = SerialPort.list();

console.log("Hi, welcome to Node Pizza");

portsList.then(console.log)