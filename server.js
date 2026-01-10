const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {};
let gameState = 'LOBBY'; // LOBBY, PLAYING, VALIDATING

io.on('connection', (socket) => {
    // Registro de jugador
    socket.on('join-game', (name) => {
        players[socket.id] = { name, answers: {}, score: 0, ready: false };
        io.emit('update-player-list', Object.values(players));
    });

    // Iniciar juego (desde la TV)
    socket.on('start-game', () => {
        gameState = 'PLAYING';
        const letter = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ"[Math.floor(Math.random() * 27)];
        io.emit('game-started', letter);
    });

    // Alguien grita ¡BASTA!
    socket.on('basta', (answers) => {
        if (gameState === 'PLAYING') {
            gameState = 'VALIDATING';
            players[socket.id].answers = answers;
            io.emit('stop-game', players);
        }
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('update-player-list', Object.values(players));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
