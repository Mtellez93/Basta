function registerHandlers(io, socket, game) {
  socket.on("join-game", ({ playerId, name }) => {
    if (!playerId || typeof playerId !== "string") return;

    game.addOrReconnectPlayer({
      playerId,
      socketId: socket.id,
      name
    });

    io.emit("update-state", game.getState());
  });

  socket.on("start-game", config => {
    const playerId = game.getPlayerIdBySocket(socket.id);
    if (playerId !== game.hostId) return;

    if (!game.startGame(config)) return;

    io.emit("update-state", game.getState());
  });

  socket.on("next-letter", () => {
    const playerId = game.getPlayerIdBySocket(socket.id);
    if (playerId !== game.hostId) return;

    const letter = game.nextLetter();
    if (!letter) {
      io.emit("game-ended");
      return;
    }

    io.emit("update-state", game.getState());
  });

  socket.on("add-score", points => {
    if (typeof points !== "number") return;

    const playerId = game.getPlayerIdBySocket(socket.id);
    if (!playerId) return;

    game.addScore(playerId, points);
    io.emit("update-state", game.getState());
  });

  socket.on("disconnect", () => {
    game.markDisconnected(socket.id);

    setTimeout(() => {
      for (const [playerId, player] of game.players.entries()) {
        if (!player.connected) {
          game.removePlayer(playerId);
        }
      }

      io.emit("update-state", game.getState());
    }, 30000);
  });
}

module.exports = registerHandlers;
