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

function joinRoom() {
  const roomCode = document
    .getElementById("roomInput").value
    .toUpperCase();

  const name = document.getElementById("nameInput").value;

  currentRoom = roomCode;

  socket.emit("join-room", {
    roomCode,
    playerId: getPlayerId(),
    name
  });

  document.getElementById("gameArea").style.display = "block";
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
  document.getElementById("letter").innerText =
    state.currentLetter || "-";
});
