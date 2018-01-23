const Socket = require("socket.io");

class SocketManager {
    constructor(appSvr) {
        if(SocketManager.instance !== undefined) {
            throw new Error("SocketManager already initialized");
        }

        SocketManager.instance = this;
        this.socketManager = new Socket(appSvr, {path: "/api/socket.io"});
        this.socketManager.on('connection', this.roomQuery);
        console.log("enabled socketmanager");

    }

    roomQuery(socket) {
        var query = socket.handshake.query;
        var roomName = query.roomName;
        if(!roomName) {
            socket.emit("svrerror", "Must provide a room to join");
            socket.disconnect(true);
            return;
        }
        socket.join(roomName);
        socket.emit("roomjoin", "joined room " + roomName);
    }
}

module.exports = SocketManager;
