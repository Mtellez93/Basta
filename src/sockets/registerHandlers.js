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
    const playerId = game.getPlayerIdBySocket(socket.id);
    if (playerId !== game.hostId) return;

    game.startGame();
    io.emit("update-state", game.getState());
  });

  socket.on("next-letter", () => {
    const playerId = game.getPlayerIdBySocket(socket.id);
    if (playerId !== game.hostId) return;

    game.nextLetter();
    io.emit("update-state", game.getState());
  });

  socket.on("submit-answers", answers => {
    const playerId = game.getPlayerIdBySocket(socket.id);
    game.submitAnswers(playerId, answers);

    io.emit("update-state", game.getState());
  });

  socket.on("host-decision", ({ playerId, approved }) => {
    const senderId = game.getPlayerIdBySocket(socket.id);
    if (senderId !== game.hostId) return;

    game.hostDecision(playerId, approved);
    io.emit("update-state", game.getState());
  });

  socket.on("finalize-round", () => {
    const senderId = game.getPlayerIdBySocket(socket.id);
    if (senderId !== game.hostId) return;

    game.finalizeRound();
    io.emit("update-state", game.getState());
  });
}

module.exports = registerHandlers;
