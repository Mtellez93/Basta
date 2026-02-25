const { LETTER_SETS, DEFAULT_CONFIG } = require("./constants");

class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.players = new Map();
    this.socketMap = new Map();
    this.hostId = null;
    this.usedLetters = new Set();
    this.currentLetter = null;
    this.config = { ...DEFAULT_CONFIG };
    this.gameStarted = false;
  }

  addOrReconnectPlayer({ playerId, socketId, name }) {
    if (!playerId || !socketId) return false;

    if (this.players.has(playerId)) {
      const player = this.players.get(playerId);
      player.socketId = socketId;
      player.connected = true;
      this.socketMap.set(socketId, playerId);
      return true;
    }

    const player = {
      playerId,
      socketId,
      name: name?.trim() || "Jugador",
      score: 0,
      connected: true
    };

    this.players.set(playerId, player);
    this.socketMap.set(socketId, playerId);

    if (!this.hostId) this.hostId = playerId;

    return true;
  }

  markDisconnected(socketId) {
    const playerId = this.socketMap.get(socketId);
    if (!playerId) return;

    const player = this.players.get(playerId);
    if (player) player.connected = false;

    this.socketMap.delete(socketId);
  }

  removePlayer(playerId) {
    this.players.delete(playerId);

    if (this.hostId === playerId) {
      const next = this.players.keys().next();
      this.hostId = next.done ? null : next.value;
    }
  }

  startGame(config = {}) {
    if (this.players.size === 0) return false;

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.gameStarted = true;
    this.usedLetters.clear();
    this.nextLetter();
    return true;
  }

  nextLetter() {
    const letters = LETTER_SETS[this.config.language] || LETTER_SETS.es;
    const available = letters
      .split("")
      .filter(letter => !this.usedLetters.has(letter));

    if (available.length === 0) {
      this.currentLetter = null;
      return null;
    }

    const random = available[Math.floor(Math.random() * available.length)];

    this.usedLetters.add(random);
    this.currentLetter = random;
    return random;
  }

  addScore(playerId, points) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.score += points;
  }

  getPlayerIdBySocket(socketId) {
    return this.socketMap.get(socketId);
  }

  getState() {
    return {
      players: Array.from(this.players.values()),
      hostId: this.hostId,
      currentLetter: this.currentLetter,
      gameStarted: this.gameStarted,
      config: this.config
    };
  }
}

module.exports = GameState;
