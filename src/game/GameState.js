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
      .filter(l => !this.usedLetters.has(l));

    if (!available.length) return null;

    const random =
      available[Math.floor(Math.random() * available.length)];

    this.usedLetters.add(random);
    this.currentLetter = random;

    this.currentRound = {
      letter: random,
      submissions: new Map(),
      validations: new Map(),
      decisions: new Map()
    };

    return random;
  }

  submitAnswers(playerId, answers) {
    if (!this.currentRound) return;

    this.currentRound.submissions.set(playerId, answers);

    const flagged = this.validateAnswers(answers);
    this.currentRound.validations.set(playerId, flagged);
  }

  validateAnswers(answers) {
    const flagged = {};
    const letter = this.currentLetter;

    Object.entries(answers).forEach(([category, word]) => {
      if (!word || word.trim() === "") {
        flagged[category] = "Vacío";
        return;
      }

      if (
        word[0].toUpperCase() !== letter.toUpperCase()
      ) {
        flagged[category] = "Letra incorrecta";
      }
    });

    return flagged;
  }

  hostDecision(playerId, approvedCategories) {
    this.currentRound.decisions.set(
      playerId,
      approvedCategories
    );
  }

  finalizeRound() {
    for (const [playerId, approved] of this.currentRound.decisions.entries()) {
      const points = approved.length * 10;
      const player = this.players.get(playerId);
      if (player) player.score += points;
    }

    this.currentRound = null;
  }

  getState() {
    return {
      players: Array.from(this.players.values()),
      hostId: this.hostId,
      currentLetter: this.currentLetter,
      currentRound: this.serializeRound(),
      gameStarted: this.gameStarted
    };
  }

  serializeRound() {
    if (!this.currentRound) return null;

    return {
      letter: this.currentRound.letter,
      submissions: Object.fromEntries(this.currentRound.submissions),
      validations: Object.fromEntries(this.currentRound.validations),
      decisions: Object.fromEntries(this.currentRound.decisions)
    };
  }
}

module.exports = GameState;
