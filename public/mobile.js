const socket = io();
let currentRoom = null;
let categories = [];

function getPlayerId() {
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("playerId", id);
  }
  return id;
}

window.onload = () => {
  const savedName = localStorage.getItem("playerName");
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
  localStorage.setItem("roomCode", roomCode);
  localStorage.setItem("playerName", name);

  socket.emit("join-room", {
    roomCode,
    playerId: getPlayerId(),
    name
  });

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
}

socket.on("update-state", state => {
  categories = state.categories || [];

  if (state.gameStarted) {
    document.getElementById("lobby").style.display =
      "none";
    document.getElementById("gameArea").style.display =
      "block";

    document.getElementById("letter").innerText =
      state.currentLetter || "-";

    renderCategories();
  }
});
