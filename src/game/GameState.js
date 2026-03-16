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
    this.roundsPlayed = 0;
  }

  addOrReconnectPlayer({ playerId, socketId, name }) {
    if (!playerId || !socketId) return false;

    if (this.players.has(playerId)) {
      const player = this.players.get(playerId);
      player.socketId = socketId;
      this.socketMap.set(socketId, playerId);
      return true;
    }

    const player = {
      playerId,
      socketId,
      name: name?.trim() || "Jugador",
      score: 0
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
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const rounds = Number.parseInt(mergedConfig.totalRounds, 10);

    this.config = {
      ...mergedConfig,
      totalRounds: Number.isFinite(rounds) && rounds > 0 ? rounds : DEFAULT_CONFIG.totalRounds
    };
    this.gameStarted = true;
    this.usedLetters.clear();
    this.roundsPlayed = 0;
    return this.nextLetter();
  }

  nextLetter() {
    const letters = LETTER_SETS[this.config.language];
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
      overrides: {},
      submittedPlayers: new Set(),
      phase: "playing"
    };

    return random;
  }

  submitAnswers(playerId, answers) {
    if (!this.currentRound) return;

    const filtered = {};
    CATEGORIES.forEach(cat => {
      filtered[cat] = (answers[cat] || "").trim();
    });

    this.currentRound.submissions.set(playerId, filtered);
    this.currentRound.submittedPlayers.add(playerId);
  }

  toggleOverride(playerId, category, approved) {
    if (!this.currentRound) return;

    if (!this.currentRound.overrides[playerId]) {
      this.currentRound.overrides[playerId] = {};
    }

    this.currentRound.overrides[playerId][category] =
      approved;
  }

  calculateScores() {
    const submissions = this.currentRound.submissions;
    const letter = this.currentLetter;
    const overrides = this.currentRound.overrides;

    const categoryMap = {};

    for (const answers of submissions.values()) {
      for (const cat of CATEGORIES) {
        const word = answers[cat]?.toLowerCase();
        if (!word) continue;

        if (!categoryMap[cat]) categoryMap[cat] = {};
        if (!categoryMap[cat][word]) categoryMap[cat][word] = 0;

        categoryMap[cat][word]++;
      }
    }

    for (const [pid, answers] of submissions.entries()) {
      let points = 0;

      for (const cat of CATEGORIES) {
        const word = answers[cat];
        if (!word) continue;

        if (overrides[pid] &&
            overrides[pid][cat] !== undefined) {
          if (overrides[pid][cat]) points += 10;
          continue;
        }

        if (word[0].toUpperCase() !== letter) continue;

        const count =
          categoryMap[cat][word.toLowerCase()];

        points += count === 1 ? 10 : 5;
      }

      const player = this.players.get(pid);
      if (player) player.score = points;
    }
  }

  areAllPlayersSubmitted() {
    if (!this.currentRound) return false;

    const activePlayers = Array.from(this.players.values()).filter(
      player => player.playerId !== this.hostId
    );

    if (!activePlayers.length) return false;

    return activePlayers.every(player =>
      this.currentRound.submittedPlayers.has(player.playerId)
    );
  }

  finalizeRound() {
    if (!this.currentRound) return this.getState();

    this.currentRound.phase = "review";
    this.calculateScores();

    return this.getState();
  }

  closeReview() {
    if (!this.currentRound) return;

    this.currentRound = null;
    this.roundsPlayed += 1;

    if (this.roundsPlayed >= this.config.totalRounds) {
      return;
    }

    this.nextLetter();
  }

  getState() {
    return {
      players: Array.from(this.players.values()),
      hostId: this.hostId,
      currentLetter: this.currentLetter,
      currentRound: this.serializeRound(),
      gameStarted: this.gameStarted,
      categories: CATEGORIES,
      roundsPlayed: this.roundsPlayed,
      totalRounds: this.config.totalRounds
    };
  }

  serializeRound() {
    if (!this.currentRound) return null;

    return {
      letter: this.currentRound.letter,
      submissions: Object.fromEntries(
        this.currentRound.submissions
      ),
      overrides: this.currentRound.overrides,
      phase: this.currentRound.phase,
      submittedPlayers: Array.from(this.currentRound.submittedPlayers)
    };
  }
}

module.exports = GameState;
