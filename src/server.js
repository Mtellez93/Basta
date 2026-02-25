const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const GameState = require("./game/GameState");
const registerHandlers = require("./sockets/registerHandlers");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const game = new GameState();

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", socket => {
  registerHandlers(io, socket, game);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
