function registerHandlers(io, socket, game) {

  socket.on("join-game", ({ playerId, name }) => {
    game.addOrReconnectPlayer({
      playerId,
      socketId: socket.id,
      name
    });

    io.emit("update-state", game.getState());
  });

  socket.on("start-game", () => {
    const pid = game.getPlayerIdBySocket(socket.id);
    if (pid !== game.hostId) return;

    game.startGame();
    io.emit("update-state", game.getState());
  });

  socket.on("submit-answers", answers => {
    const pid = game.getPlayerIdBySocket(socket.id);
    if (!pid) return;

    game.submitAnswers(pid, answers);
  });

  socket.on("start-voting", () => {
    const pid = game.getPlayerIdBySocket(socket.id);
    if (pid !== game.hostId) return;

    game.startVoting();
    io.emit("update-state", game.getState());
  });

  socket.on("vote", ({ targetId, category, approve }) => {
    const voterId = game.getPlayerIdBySocket(socket.id);
    if (!voterId) return;

    game.vote(voterId, targetId, category, approve);
  });

  socket.on("finalize-round", () => {
    const pid = game.getPlayerIdBySocket(socket.id);
    if (pid !== game.hostId) return;

    const state = game.finalizeRound();

    io.emit("show-results", state);  // 🔥 muestra pantalla animada
    io.emit("update-state", state);
  });

}

module.exports = registerHandlers;
