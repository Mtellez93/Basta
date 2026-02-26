const socket = io();
let currentRoom = null;
let qrInstance = null;

function createRoom() {
  socket.emit("create-room");
}

function startGame() {
  socket.emit("start-game", { roomCode: currentRoom });
}

socket.on("room-created", code => {
  currentRoom = code;

  document.getElementById("roomCode").innerText =
    "Código: " + code;

  const qrContainer = document.getElementById("qr");
  qrContainer.innerHTML = "";

  const joinURL =
    window.location.origin +
    "/mobile.html?room=" +
    code;

  qrInstance = new QRCode(qrContainer, {
    text: joinURL,
    width: 180,
    height: 180
  });
});

socket.on("update-state", state => {
  const list = document.getElementById("playersList");
  list.innerHTML = "";

  state.players.forEach(p => {
    const li = document.createElement("li");
    li.innerText = p.name;
    list.appendChild(li);
  });

  if (state.players.length > 0) {
    document.getElementById("startBtn").style.display =
      "inline-block";
  }

  if (state.gameStarted) {
    document.getElementById("lobby").style.display = "none";
    document.getElementById("gameArea").style.display =
      "block";

    document.getElementById("letter").innerText =
      state.currentLetter || "-";

    document.getElementById("timer").innerText =
      state.currentRound?.timeLeft || 0;
  }
});
