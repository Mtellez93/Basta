const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let players = {};
let gameQueue = []; 
let currentRound = 0;
let totalRounds = 0;
let gameState = 'LOBBY'; 
let hostId = null;

io.on('connection', (socket) => {
    
    socket.on('join-game', (name) => {
        if (!hostId) hostId = socket.id;

        players[socket.id] = { 
            id: socket.id, 
            name: name, 
            answers: {}, 
            pointsDetail: {}, 
            totalScore: 0,
            isHost: (socket.id === hostId)
        };
        
        socket.emit('assign-role', { isHost: players[socket.id].isHost });
        io.emit('update-player-list', Object.values(players));
    });

    socket.on('start-game', () => {
        if (socket.id !== hostId) return;
        const ids = Object.keys(players);
        if (ids.length === 0) return;

        gameQueue = [...ids, ...ids]; 
        totalRounds = gameQueue.length;
        currentRound = 1;
        startNewRound();
    });

    function startNewRound() {
        gameState = 'PLAYING';
        const currentPickerId = gameQueue[currentRound - 1];
        const alphabet = "ABCDEFGHIJKLMNPRSTUV";
        const letter = alphabet[Math.floor(Math.random() * alphabet.length)];
        
        io.emit('round-started', {
            letter: letter,
            round: currentRound,
            totalRounds: totalRounds,
            pickerName: players[currentPickerId].name
        });
    }

    socket.on('basta', (answers) => {
        if (gameState === 'PLAYING') {
            gameState = 'VALIDATING';
            players[socket.id].answers = answers;
            socket.broadcast.emit('force-submit');
            
            setTimeout(() => {
                calculateScores();
                io.emit('show-validation', Object.values(players));
            }, 1200);
        }
    });

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
        Object.values(players).forEach(p => {
            const roundSum = Object.values(p.pointsDetail).reduce((a, b) => a + b, 0);
            p.totalScore += roundSum;
            p.answers = {};
            p.pointsDetail = {};
        });

        if (currentRound < totalRounds) {
            currentRound++;
            startNewRound();
        } else {
            gameState = 'ENDED';
            io.emit('game-over', Object.values(players).sort((a,b) => b.totalScore - a.totalScore));
        }
    });

    // Nueva lógica para reiniciar el juego completamente
    socket.on('reset-game', () => {
        if (socket.id !== hostId) return;
        // Reiniciar puntajes de jugadores existentes
        Object.values(players).forEach(p => {
            p.totalScore = 0;
            p.answers = {};
            p.pointsDetail = {};
        });
        gameState = 'LOBBY';
        io.emit('game-reset-complete', Object.values(players));
    });

    socket.on('disconnect', () => {
        if (socket.id === hostId) {
            delete players[socket.id];
            const remaining = Object.keys(players);
            hostId = remaining.length > 0 ? remaining[0] : null;
            if (hostId) {
                players[hostId].isHost = true;
                io.to(hostId).emit('assign-role', { isHost: true });
            }
        } else {
            delete players[socket.id];
        }
        io.emit('update-player-list', Object.values(players));
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
