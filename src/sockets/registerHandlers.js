function registerHandlers(io, socket, rooms, generateRoomCode) {

  socket.on("create-room", () => {
    const code = generateRoomCode();
    const GameState = require("../game/GameState");
    const game = new GameState();

    rooms.set(code, game);
    socket.join(code);

    game.addOrReconnectPlayer({
      playerId: "HOST",
      socketId: socket.id,
      name: "Host"
    });

    socket.emit("room-created", code);
    io.to(code).emit("update-state", game.getState());
  });

  socket.on("join-room", ({ roomCode, playerId, name }) => {
    const game = rooms.get(roomCode);
    if (!game) return;

    socket.join(roomCode);

    game.addOrReconnectPlayer({
      playerId,
      socketId: socket.id,
      name
    });

    io.to(roomCode).emit("update-state", game.getState());
  });

  socket.on("start-game", ({ roomCode, totalRounds }) => {
    const game = rooms.get(roomCode);
    if (!game) return;

    const pid = game.getPlayerIdBySocket(socket.id);
    if (pid !== game.hostId) return;

    game.startGame({ totalRounds });
    io.to(roomCode).emit("update-state", game.getState());
  });

  socket.on("submit-answers", ({ roomCode, answers }) => {
    const game = rooms.get(roomCode);
    if (!game) return;

    const pid = game.getPlayerIdBySocket(socket.id);
    if (!pid) return;

    game.submitAnswers(pid, answers);
    game.finalizeRound();

    io.to(roomCode).emit("update-state", game.getState());
  });

  socket.on("toggle-override", ({ roomCode, playerId, category, approved }) => {
    const game = rooms.get(roomCode);
    if (!game) return;

    const pid = game.getPlayerIdBySocket(socket.id);
    if (pid !== game.hostId) return;

    game.toggleOverride(playerId, category, approved);
    game.calculateScores();

    io.to(roomCode).emit("update-state", game.getState());
  });

  socket.on("close-review", ({ roomCode }) => {
    const game = rooms.get(roomCode);
    if (!game) return;

    const pid = game.getPlayerIdBySocket(socket.id);
    if (pid !== game.hostId) return;

    game.closeReview();
    io.to(roomCode).emit("update-state", game.getState());
  });
}

module.exports = registerHandlers;
