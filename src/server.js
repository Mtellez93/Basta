const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const registerHandlers = require("./sockets/registerHandlers");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const rooms = new Map();

function generateRoomCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", socket => {
  registerHandlers(io, socket, rooms, generateRoomCode);
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});
