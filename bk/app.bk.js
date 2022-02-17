const { Client, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fs = require('fs');
const { phoneNumberFormatter } = require('./helpers/formatter');
const fileUpload = require('express-fileupload');
const axios = require('axios');
const mime = require('mime-types');

const port = process.env.PORT || 8000;

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));


app.use(fileUpload({
  debug: true
}));


// const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;

// if (fs.existsSync(SESSION_FILE_PATH)) {
//   sessionCfg = require(SESSION_FILE_PATH);
// }

const client = new Client({
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

  client.initialize();

  
// Socket IO
io.on('connection', function(socket) {
    socket.emit('message', 'Connecting...');
  
    client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit('qr', url);
        socket.emit('message', 'QR Code received, scan please!');
      });
    });
  
    client.on('ready', () => {
      socket.emit('ready', 'Whatsapp is ready!');
      socket.emit('message', 'Whatsapp is ready!');
    });
  
    client.on('authenticated', (session) => {
      socket.emit('authenticated', 'Whatsapp is authenticated!');
      socket.emit('message', 'Whatsapp is authenticated!');
      socket.emit('session', session);
      console.log('AUTHENTICATED', session);
      sessionCfg = session;
      // fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function(err) {
      //   if (err) {
      //     console.error(err);
      //   }
      // });
    });
  
    client.on('auth_failure', function(session) {
      socket.emit('message', 'Auth failure, restarting...');
    });
  
    // client.on('disconnected', (reason) => {
    //   socket.emit('message', 'Whatsapp is disconnected!');
    //   // fs.unlinkSync(SESSION_FILE_PATH, function(err) {
    //   //     if(err) return console.log(err);
    //   //     console.log('Session file deleted!');
    //   // });
    //   client.destroy();
    //   client.initialize();
    // });
  });
  

  app.get('/', (req, res) => {
    res.sendFile('index.html', {
      root: __dirname
    });
  });

  
server.listen(port, function() {
  console.log('App running on *: ' + port);
});
