const { LETTER_SETS, DEFAULT_CONFIG } = require("./constants");

const CATEGORIES = [
  "Nombre",
  "Apellido",
  "Ciudad/Pais",
  "Animal",
  "Color",
  "Planta/Flor/Fruto",
  "Cosa"
];

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
    this.currentRound = null;
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

  getPlayerIdBySocket(socketId) {
    return this.socketMap.get(socketId);
  }

  startGame(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.gameStarted = true;
    this.usedLetters.clear();
    return this.nextLetter();
  }

  nextLetter() {
    const letters = LETTER_SETS[this.config.language];
    const available = letters.split("").filter(l => !this.usedLetters.has(l));
    if (!available.length) return null;

    const random = available[Math.floor(Math.random() * available.length)];
    this.usedLetters.add(random);
    this.currentLetter = random;

    this.currentRound = {
      letter: random,
      submissions: new Map(),
      votes: new Map(),
      phase: "playing",
      endTime: Date.now() + this.config.roundTime * 1000
    };

    return random;
  }

  submitAnswers(playerId, answers) {
    if (!this.currentRound || this.currentRound.phase !== "playing") return;

    const filtered = {};

    CATEGORIES.forEach(cat => {
      filtered[cat] = answers[cat] || "";
    });

    this.currentRound.submissions.set(playerId, filtered);
  }

  finalizeRound() {
    if (!this.currentRound) return this.getState();

    for (const [pid, answers] of this.currentRound.submissions.entries()) {
      let points = 0;

      CATEGORIES.forEach(cat => {
        const word = answers[cat];
        if (
          word &&
          word[0]?.toUpperCase() === this.currentLetter
        ) {
          points += 10;
        }
      });

      const player = this.players.get(pid);
      if (player) player.score += points;
    }

    this.currentRound = null;

    return this.getState();
  }

  getState() {
    return {
      players: Array.from(this.players.values()),
      hostId: this.hostId,
      currentLetter: this.currentLetter,
      currentRound: this.serializeRound(),
      gameStarted: this.gameStarted,
      categories: CATEGORIES
    };
  }

  serializeRound() {
    if (!this.currentRound) return null;

    return {
      letter: this.currentRound.letter,
      phase: this.currentRound.phase,
      timeLeft: Math.max(
        0,
        Math.floor((this.currentRound.endTime - Date.now()) / 1000)
      )
    };
  }
}

module.exports = GameState;
