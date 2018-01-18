const Socket = require("socket.io");

class SocketManager {
    constructor(appSvr) {
        if(SocketManager.instance !== undefined) {
            throw new Error("SocketManager already initialized");
        }

        SocketManager.instance = this;

        this.socketManager = new Socket(appSvr, {path: "/api/socket.io"});
    }
}

module.exports = SocketManager;
