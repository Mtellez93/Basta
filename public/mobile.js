const socket = io();
let currentRoom = null;
let categories = [];
let submittedThisRound = false;

function getPlayerId() {
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("playerId", id);
  }
  return id;
}

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const room = params.get("room");

  const savedName = localStorage.getItem("playerName");

  if (room) {
    document.getElementById("roomInput").value = room.toUpperCase();
  }

  if (savedName) {
    document.getElementById("nameInput").value = savedName;
  }
};

function joinRoom() {
  const roomCode = document
    .getElementById("roomInput").value
    .toUpperCase();

  const name = document.getElementById("nameInput").value;

  if (!roomCode || !name) return;

  currentRoom = roomCode;

  localStorage.setItem("playerName", name);

  socket.emit("join-room", {
    roomCode,
    playerId: getPlayerId(),
    name
  });

  document.getElementById("roomPlayerInfo").innerText =
    `${roomCode} · ${name}`;

  document.getElementById("lobby").style.display =
    "block";
}

function renderCategories() {
  const container = document.getElementById("inputs");
  container.innerHTML = "";

  categories.forEach(cat => {
    const input = document.createElement("input");
    input.placeholder = cat;
    input.id = "cat_" + cat;
    input.className = "answer-input";
    input.autocomplete = "off";
    input.autocapitalize = "words";
    input.spellcheck = true;
    input.enterKeyHint = "next";
    container.appendChild(input);
  });
}

function submitAnswers() {
  const answers = {};

  categories.forEach(cat => {
    answers[cat] =
      document.getElementById("cat_" + cat).value;
  });

  socket.emit("submit-answers", {
    roomCode: currentRoom,
    answers
  });

  submittedThisRound = true;
  updateSubmitState();
}

function updateSubmitState(isReviewPhase = false) {
  const submitBtn = document.querySelector(".basta-btn");
  const inputs = document.querySelectorAll(".answer-input");
  const locked = submittedThisRound || isReviewPhase;

  submitBtn.disabled = locked;

  if (isReviewPhase && !submittedThisRound) {
    submitBtn.innerText = "Otro jugador dijo Basta";
  } else if (submittedThisRound) {
    submitBtn.innerText = "Esperando revisión...";
  } else {
    submitBtn.innerText = "Basta";
  }

  inputs.forEach(input => {
    input.disabled = locked;
  });
}

function updateSubmitState() {
  const submitBtn = document.querySelector(".basta-btn");
  const inputs = document.querySelectorAll(".answer-input");

  submitBtn.disabled = submittedThisRound;
  submitBtn.innerText = submittedThisRound
    ? "Esperando revisión..."
    : "Basta";

  inputs.forEach(input => {
    input.disabled = submittedThisRound;
  });
}

socket.on("update-state", state => {
  categories = state.categories || [];

  if (state.gameStarted) {
    document.getElementById("joinHeader").style.display =
      "none";
    document.getElementById("joinForm").style.display =
      "none";
    document.getElementById("lobby").style.display =
      "none";
    document.getElementById("gameArea").style.display =
      "block";

    document.getElementById("letter").innerText =
      state.currentLetter || "-";

    if (!state.currentRound) {
      document.getElementById("inputs").innerHTML =
        "<p>Partida finalizada.</p>";
      const submitBtn = document.querySelector(".basta-btn");
      submitBtn.disabled = true;
      submitBtn.innerText = "Juego terminado";
      return;
    }

    const alreadySubmitted =
      (state.currentRound.submittedPlayers || []).includes(
        getPlayerId()
      );

    if (
      !document.getElementById("inputs").children.length ||
      (state.currentRound.phase === "playing" &&
        !alreadySubmitted &&
        submittedThisRound)
    ) {
      renderCategories();
    }

    submittedThisRound = alreadySubmitted;
    updateSubmitState(state.currentRound.phase !== "playing");
    updateSubmitState();
  }
});
