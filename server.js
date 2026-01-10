const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {};
let gameQueue = []; // Lista de turnos
let currentRound = 0;
let totalRounds = 0;
let gameState = 'LOBBY'; 

io.on('connection', (socket) => {
    // Al conectarse desde el celular
    socket.on('join-game', (name) => {
        players[socket.id] = { 
            id: socket.id, 
            name: name, 
            answers: {}, 
            pointsDetail: {}, 
            totalScore: 0 
        };
        io.emit('update-player-list', Object.values(players));
    });

    // Iniciar el juego desde la TV
    socket.on('start-game', () => {
        const ids = Object.keys(players);
        if (ids.length === 0) return;

        // Crear cola de turnos: 2 veces cada ID de jugador
        gameQueue = [...ids, ...ids]; 
        totalRounds = gameQueue.length;
        currentRound = 1;
        startNewRound();
    });

    function startNewRound() {
        gameState = 'PLAYING';
        const currentPickerId = gameQueue[currentRound - 1];
        const letter = "ABCDEFGHIJKLMNPRSTUV"[Math.floor(Math.random() * 20)];
        
        io.emit('round-started', {
            letter: letter,
            round: currentRound,
            totalRounds: totalRounds,
            pickerName: players[currentPickerId].name
        });
    }

    // Alguien presiona ¡BASTA!
    socket.on('basta', (answers) => {
        if (gameState === 'PLAYING') {
            gameState = 'VALIDATING';
            // Guardamos las respuestas del que gritó basta
            players[socket.id].answers = answers;
            // Pedimos al resto que mande lo que tenga de inmediato
            socket.broadcast.emit('force-submit');
            
            // Esperamos un segundo para recibir todas y calculamos
            setTimeout(() => {
                calculateScores();
                io.emit('show-validation', Object.values(players));
            }, 1000);
        }
    });

    // Recibir respuestas forzadas de los demás
    socket.on('submit-final-answers', (answers) => {
        if (players[socket.id]) players[socket.id].answers = answers;
    });

    socket.on('invalidate-word', ({ playerId, category }) => {
        if (players[playerId]) {
            players[playerId].pointsDetail[category] = 0;
            io.emit('show-validation', Object.values(players));
        }
    });

    socket.on('next-round-action', () => {
        // Sumar puntos de la ronda al total
        Object.values(players).forEach(p => {
            const roundSum = Object.values(p.pointsDetail).reduce((a, b) => a + b, 0);
            p.totalScore += roundSum;
            p.answers = {}; // Limpiar para sig. ronda
            p.pointsDetail = {};
        });

        if (currentRound < totalRounds) {
            currentRound++;
            startNewRound();
        } else {
            io.emit('game-over', Object.values(players).sort((a,b) => b.totalScore - a.totalScore));
        }
    });
});

function calculateScores() {
    const categories = ['nombre', 'apellido', 'animal', 'ciudad', 'color', 'fruto'];
    const playerList = Object.values(players);

    categories.forEach(cat => {
        const counts = {};
        playerList.forEach(p => {
            const val = (p.answers[cat] || "").toLowerCase().trim();
            if (val) counts[val] = (counts[val] || 0) + 1;
        });

        playerList.forEach(p => {
            const val = (p.answers[cat] || "").toLowerCase().trim();
            if (!val) p.pointsDetail[cat] = 0;
            else if (counts[val] > 1) p.pointsDetail[cat] = 5;
            else p.pointsDetail[cat] = 10;
        });
    });
}

server.listen(process.env.PORT || 3000);
