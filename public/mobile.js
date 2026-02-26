const socket = io();
let currentRoom = null;

function getPlayerId() {
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("playerId", id);
  }
  return id;
}

function saveRoom(roomCode) {
  localStorage.setItem("roomCode", roomCode);
}

function getSavedRoom() {
  return localStorage.getItem("roomCode");
}

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const roomFromQR = params.get("room");
  const savedRoom = getSavedRoom();
  const savedName = localStorage.getItem("playerName");

  const roomCode = roomFromQR || savedRoom;

  if (roomCode) {
    document.getElementById("roomInput").value = roomCode;
    currentRoom = roomCode;
  }

  // 👇 ESTA ES LA PARTE QUE NO SABÍAS DÓNDE PONER
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

  saveRoom(roomCode);

  // 👇 ESTA ES LA OTRA PARTE IMPORTANTE
  localStorage.setItem("playerName", name);

  socket.emit("join-room", {
    roomCode,
    playerId: getPlayerId(),
    name
  });

  document.getElementById("lobby").style.display =
    "block";
}

function submitAnswers() {
  const answers = {
    nombre: document.getElementById("nombre").value,
    ciudad: document.getElementById("ciudad").value,
    animal: document.getElementById("animal").value
  };

  socket.emit("submit-answers", {
    roomCode: currentRoom,
    answers
  });
}

socket.on("update-state", state => {
  if (state.gameStarted) {
    document.getElementById("lobby").style.display =
      "none";
    document.getElementById("gameArea").style.display =
      "block";

    document.getElementById("letter").innerText =
      state.currentLetter || "-";
  }
});

socket.on("connect", () => {
  const savedRoom = getSavedRoom();
  const playerId = getPlayerId();
  const savedName = localStorage.getItem("playerName");

  if (savedRoom && playerId && savedName) {
    socket.emit("join-room", {
      roomCode: savedRoom,
      playerId,
      name: savedName
    });
  }
});
