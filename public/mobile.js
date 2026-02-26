const socket = io();

function getPlayerId() {
  let id = localStorage.getItem("playerId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("playerId", id);
  }
  return id;
}

function joinGame() {
  const name = document.getElementById("nameInput").value;

  socket.emit("join-game", {
    playerId: getPlayerId(),
    name,
    role: "player"
  });

  document.getElementById("gameArea").style.display = "block";
}

function submitAnswers() {
  const answers = {
    nombre: document.getElementById("nombre").value,
    ciudad: document.getElementById("ciudad").value,
    animal: document.getElementById("animal").value
  };

  socket.emit("submit-answers", answers);
}

socket.on("update-state", state => {
  document.getElementById("letter").innerText =
    state.currentLetter || "-";
});
