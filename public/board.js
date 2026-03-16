const socket = io();
let currentRoom = null;

function createRoom() {
  socket.emit("create-room");
}

function startGame() {
  const totalRounds = Number(
    document.getElementById("totalRounds").value
  );

  socket.emit("start-game", {
    roomCode: currentRoom,
    totalRounds
  });
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
    text: window.location.origin + "/mobil.html?room=" + code,
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

  const roundNumber = Math.min(
    state.roundsPlayed + 1,
    state.totalRounds
  );

  const roundInfo = document.getElementById("roundInfo");
  if (state.currentRound) {
    roundInfo.innerText = `Ronda ${roundNumber}/${state.totalRounds}`;
  } else {
    roundInfo.innerText = `Juego terminado (${state.totalRounds} rondas)`;
  }

  renderReview(state);
}

function renderReview(state) {
  const section = document.getElementById("reviewSection");
  section.innerHTML = "";

  if (!state.currentRound) {
    const ranking = [...state.players]
      .filter(player => player.playerId !== state.hostId)
      .sort((a, b) => b.score - a.score);

    const title = document.createElement("h3");
    title.innerText = "Resultados finales";
    section.appendChild(title);

    ranking.forEach(player => {
      const row = document.createElement("div");
      row.innerText = `${player.name}: ${player.score} pts`;
      section.appendChild(row);
    });
    return;
  }

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
