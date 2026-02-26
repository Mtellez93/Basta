const socket = io();
let currentRoom = null;

function createRoom() {
  socket.emit("create-room");
}

function startGame() {
  socket.emit("start-game", { roomCode: currentRoom });
}

function closeReview() {
  socket.emit("close-review", { roomCode: currentRoom });
}

socket.on("room-created", code => {
  currentRoom = code;
  document.getElementById("roomCode").innerText =
    "Código: " + code;

  const qr = document.getElementById("qr");
  qr.innerHTML = "";

  new QRCode(qr, {
    text: window.location.origin + "/mobile.html?room=" + code,
    width: 150,
    height: 150
  });
});

socket.on("update-state", state => {

  if (!state.gameStarted) {
    renderLobby(state);
    return;
  }

  renderGame(state);
});

function renderLobby(state) {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  state.players.forEach(p => {
    if (p.name === "Host") return;
    const li = document.createElement("li");
    li.innerText = p.name;
    list.appendChild(li);
  });

  if (state.players.length > 1) {
    document.getElementById("startBtn").style.display =
      "inline-block";
  }
}

function renderGame(state) {
  document.getElementById("lobby").style.display = "none";
  document.getElementById("gameArea").style.display = "block";

  document.getElementById("letter").innerText =
    state.currentLetter || "-";

  renderReview(state);
}

function renderReview(state) {
  const section = document.getElementById("reviewSection");
  section.innerHTML = "";

  if (!state.currentRound) return;

  if (state.currentRound.phase !== "review") return;

  for (const [playerId, answers] of Object.entries(
    state.currentRound.submissions || {}
  )) {
    const player = state.players.find(p => p.playerId === playerId);
    if (!player) continue;

    const card = document.createElement("div");
    card.className = "review-card";

    const title = document.createElement("h3");
    title.innerText = player.name + " (" + player.score + " pts)";
    card.appendChild(title);

    for (const [cat, word] of Object.entries(answers)) {
      const row = document.createElement("div");
      row.innerHTML = `
        ${cat}: ${word}
        <button onclick="approve('${playerId}','${cat}')">✅</button>
        <button onclick="reject('${playerId}','${cat}')">❌</button>
      `;
      card.appendChild(row);
    }

    section.appendChild(card);
  }

  const btn = document.createElement("button");
  btn.innerText = "Cerrar revisión";
  btn.onclick = closeReview;
  section.appendChild(btn);
}

function approve(pid, cat) {
  socket.emit("toggle-override", {
    roomCode: currentRoom,
    playerId: pid,
    category: cat,
    approved: true
  });
}

function reject(pid, cat) {
  socket.emit("toggle-override", {
    roomCode: currentRoom,
    playerId: pid,
    category: cat,
    approved: false
  });
}
