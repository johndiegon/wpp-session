const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { Server } = require("socket.io");

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

// Socket IO
io.on('connection', function (socket) {
  console.log('Conectou');

  socket.emit('message', 'Conctando...');

  socket.on('initialize', () => {
    clientWhatsApp.initialize();
    socket.emit('message', 'Abrindo Whats...');

    
    registerMessagesSocketWhats(socket);
  });
    
  socket.on('disconnect', () => {
    console.log('Desconectado');
    clientWhatsApp.destroy();
  });
});



const registerMessagesSocketWhats = (socket) => {
  clientWhatsApp.on('qr', (qr) => {
    // console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'QR Code received, scan please!');
    });
  });

  clientWhatsApp.on('ready', () => {
    socket.emit('ready');
    socket.emit('message', 'Whatsapp is ready!');
  });

  clientWhatsApp.on('authenticated', (session) => {
    socket.emit('message', 'Whatsapp is authenticated!');
    socket.emit('session', session);
  });

  clientWhatsApp.on('auth_failure', function (session) {
    socket.emit('message', 'Auth failure, restarting...');
  });

  clientWhatsApp.on('disconnected', (reason) => {
    console.log('finalisou');
    socket.emit('message', 'Whatsapp is disconnected!');
    socket.emit('disconnectedWhats');
    clientWhatsApp.destroy();
    clientWhatsApp.initialize();
  });
}
