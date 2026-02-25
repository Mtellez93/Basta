const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = {};
let hostId = null;

let currentRound = 0;
let totalRounds = 10;
let currentLetter = null;
let usedLetters = [];

function getRandomLetter() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const available = letters.filter(l => !usedLetters.includes(l));

    if (available.length === 0) return null;

    const letter = available[Math.floor(Math.random() * available.length)];
    usedLetters.push(letter);
    return letter;
}

function startRound() {
    if (currentRound > totalRounds) {
        io.emit("game-over", {
            players: Object.values(players)
        });
        return;
    }

    currentLetter = getRandomLetter();

    io.emit("new-round", {
        round: currentRound,
        totalRounds,
        letter: currentLetter
    });

    io.emit("score-update", {
        round: currentRound,
        totalRounds,
        players: Object.values(players)
    });
}

io.on("connection", (socket) => {

    socket.on("join-game", (name) => {

        players[socket.id] = {
            id: socket.id,
            name,
            totalScore: 0,
            isHost: false
        };

        io.emit("update-player-list", Object.values(players));
    });

    socket.on("set-host", (id) => {
        Object.values(players).forEach(p => p.isHost = false);

        if (players[id]) {
            players[id].isHost = true;
            hostId = id;
        }

        io.emit("update-player-list", Object.values(players));
    });

    socket.on("start-game", (config) => {

        if (socket.id !== hostId) return;

        const allowed = [5,10,15,20];
        totalRounds = allowed.includes(config.rounds) ? config.rounds : 10;

        usedLetters = [];
        currentRound = 1;

        startRound();
    });

    socket.on("next-round", () => {

        currentRound++;
        startRound();
    });

    socket.on("add-score", ({playerId, points}) => {
        if (players[playerId]) {
            players[playerId].totalScore += points;
        }

        io.emit("score-update", {
            round: currentRound,
            totalRounds,
            players: Object.values(players)
        });
    });

    socket.on("disconnect", () => {
        delete players[socket.id];
        io.emit("update-player-list", Object.values(players));
    });

});

server.listen(3000, () => {
    console.log("Server running on port 3000");
});
