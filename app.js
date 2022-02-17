const { Client } = require('whatsapp-web.js');
const { Server } = require("socket.io");
const { SocketTransactions } = require("./SocketTransations.js");

const io = new Server('3000', {
  cors: {
    origin: '*'
  }
});

let sessionCfg;
const clientWhatsApp = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ],
  },
  session: sessionCfg
});

const socketConect = new SocketTransactions({ io, clientWhatsApp });
socketConect.initializeSocket();
