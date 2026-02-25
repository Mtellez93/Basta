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
    this.timer = null;
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
      validations: new Map(),
      votes: new Map(),
      phase: "playing",
      endTime: Date.now() + this.config.roundTime * 1000
    };

    return random;
  }

  isRoundActive() {
    return this.currentRound && this.currentRound.phase === "playing";
  }

  submitAnswers(playerId, answers) {
    if (!this.isRoundActive()) return;

    this.currentRound.submissions.set(playerId, answers);
    this.validateAll();
  }

  validateAll() {
    const letter = this.currentLetter;
    const validations = new Map();

    const categoryMap = {};

    for (const [pid, answers] of this.currentRound.submissions.entries()) {
      for (const [cat, word] of Object.entries(answers)) {
        if (!categoryMap[cat]) categoryMap[cat] = {};
        const key = word?.toLowerCase();
        if (!categoryMap[cat][key]) categoryMap[cat][key] = [];
        categoryMap[cat][key].push(pid);
      }
    }

    for (const [pid, answers] of this.currentRound.submissions.entries()) {
      const flagged = {};

      for (const [cat, word] of Object.entries(answers)) {
        if (!word || word.trim() === "") {
          flagged[cat] = "Vacío";
          continue;
        }

        if (word[0].toUpperCase() !== letter) {
          flagged[cat] = "Letra incorrecta";
          continue;
        }

        if (categoryMap[cat][word.toLowerCase()].length > 1) {
          flagged[cat] = "Duplicado";
        }
      }

      validations.set(pid, flagged);
    }

    this.currentRound.validations = validations;
  }

  startVoting() {
    if (!this.currentRound) return;
    this.currentRound.phase = "voting";
  }

  vote(voterId, targetId, category, approve) {
    if (!this.currentRound) return;

    const key = `${targetId}:${category}`;
    if (!this.currentRound.votes.has(key))
      this.currentRound.votes.set(key, []);

    this.currentRound.votes.get(key).push({
      voterId,
      approve
    });
  }

  finalizeRound() {
    const totalPlayers = this.players.size;

    for (const [pid, answers] of this.currentRound.submissions.entries()) {
      let points = 0;

      for (const [cat, word] of Object.entries(answers)) {
        const key = `${pid}:${cat}`;
        const votes = this.currentRound.votes.get(key) || [];

        const approves = votes.filter(v => v.approve).length;

        if (approves > totalPlayers / 2) {
          const flag = this.currentRound.validations.get(pid)?.[cat];
          points += flag === "Duplicado" ? 5 : 10;
        }
      }

      this.players.get(pid).score += points;
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
      phase: this.currentRound.phase,
      timeLeft: Math.max(
        0,
        Math.floor((this.currentRound.endTime - Date.now()) / 1000)
      )
    };
  }
}

module.exports = GameState;
