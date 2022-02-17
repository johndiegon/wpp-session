const qrcode = require('qrcode');
const { logger } = require('./logger.js');

class SocketTransactions {

    address = '';
    socket;
    clientWhatsApp;

    constructor({ io, clientWhatsApp }) {
        this.clientWhatsApp = clientWhatsApp;
        this.io = io;
    }

    initializeSocket() {
        this.io.on('connection', this.tryCatchFunction((socket) => {
            this.socket = socket;
            this.address = socket.handshake.address;
            logger.log('info', `[${this.address}] - connected on socket`);
            this.socket.emit('message', 'Conctando...');
            this.initializeTransactions();
        }));
    }

    initializeTransactions() {
        this.socket.on('initialize', this.tryCatchFunction(() => {
            this.clientWhatsApp.initialize();
            logger.log('info', `[${this.address}] WhatsApp oppend on server browser`);
            this.socket.emit('message', 'Abrindo Whats...');
            this.tryCatchFunction(this.registerMessagesSocketWhats());
        }));

        this.socket.on('disconnectBrowser', this.tryCatchFunction(() => {
            logger.log('info', `[${this.address}] - disconnecting socket`);
            if(this.clientWhatsApp.pupBrowser){
                this.clientWhatsApp.destroy();
            }
            this.clientWhatsApp.removeAllListeners();
            logger.log('info', `[${this.address}] - ServerBrowser disconnected`);
            this.socket.emit('disconnectedServerBrowser');
        }));
    }


    registerMessagesSocketWhats() {
        this.clientWhatsApp.on('qr', (qr) => {

            qrcode.toDataURL(qr, this.tryCatchFunction((err, url) => {
                this.socket.emit('qr', url);
                logger.log('info', `[${this.address}] - QR Code Code received,`);
                this.socket.emit('message', 'QR Code received.');
            }));
        });

        this.clientWhatsApp.on('ready', this.tryCatchFunction(() => {
            this.socket.emit('ready');
            logger.log('info', `[${this.address}] - Whatsapp is ready!`);
            this.socket.emit('message', 'Whatsapp is ready!');
        }));

        this.clientWhatsApp.on('authenticated', this.tryCatchFunction((session) => {
            this.socket.emit('message', 'Whatsapp is authenticated!');
            logger.log('info', `[${this.address}] - Whatsapp is authenticated!`);
            this.socket.emit('session', session);
        }));

        this.clientWhatsApp.on('auth_failure', this.tryCatchFunction((session) => {
            logger.log('info', `[${this.address}] - Whatsapp is Auth failure!`);
            this.socket.emit('message', 'Auth failure!');
        }));

        this.clientWhatsApp.on('disconnected', this.tryCatchFunction((reason) => {
            logger.log('info', `[${this.address}] - ServerBrowser is disconnected!`);

            this.socket.emit('message', 'ServerBrowser is disconnected!');
            this.socket.emit('disconnectedServerBrowser');
            this.clientWhatsApp.destroy();
            this.clientWhatsApp.initialize();
        }));
    }

    /**
     * Try a Function and capture a Catch and send to logFile
     * @param {function} cb 
     */
    tryCatchFunction(cb) {
        const addressIp = this.address;
        const _this = this;
        return function () {
            try {
                return cb.apply(_this, arguments);
            }
            catch (e) {
                if (e instanceof ReferenceError) {
                    return logger.log('error', `[${addressIp}] - ${e.stack}`);
                }

                logger.log('error', `[${addressIp}] - ${e}`);
            }
        }
    }
}

exports.SocketTransactions = SocketTransactions;