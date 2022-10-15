const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
let freshCode = "";

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({username }) => {
        userSocketMap[socket.id] = username;
            io.emit(ACTIONS.JOINED, {
                username,
            });
            socket.emit(ACTIONS.CODE_CHANGE, {code: freshCode})
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ code }) => {
        io.emit(ACTIONS.CODE_CHANGE, { code });
        freshCode = code;
    });


    socket.on('disconnecting', () => {
        io.emit(ACTIONS.DISCONNECTED, {
                username: userSocketMap[socket.id],
            });
        delete userSocketMap[socket.id];
        socket.leave();
        console.log("socket disconnected", socket.id);
        });

});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
