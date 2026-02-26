function registerHandlers(io, socket, rooms, generateRoomCode) {

  socket.on("create-room", () => {
    const code = generateRoomCode();
    const GameState = require("../game/GameState");
    const game = new GameState();

    rooms.set(code, game);

    socket.join(code);

    // 🔥 REGISTRAR BOARD COMO HOST
    game.addOrReconnectPlayer({
      playerId: "BOARD",
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

  socket.on("start-game", ({ roomCode }) => {
    const game = rooms.get(roomCode);
    if (!game) return;

    const pid = game.getPlayerIdBySocket(socket.id);

    // 🔥 ahora sí será el BOARD
    if (pid !== game.hostId) return;

    game.startGame();

    io.to(roomCode).emit("update-state", game.getState());
  });

  socket.on("submit-answers", ({ roomCode, answers }) => {
    const game = rooms.get(roomCode);
    if (!game) return;

    const pid = game.getPlayerIdBySocket(socket.id);
    if (!pid) return;

    game.submitAnswers(pid, answers);
  });

  socket.on("finalize-round", ({ roomCode }) => {
    const game = rooms.get(roomCode);
    if (!game) return;

    const pid = game.getPlayerIdBySocket(socket.id);
    if (pid !== game.hostId) return;

    const state = game.finalizeRound();

    io.to(roomCode).emit("show-results", state);
    io.to(roomCode).emit("update-state", state);
  });

}

module.exports = registerHandlers;
