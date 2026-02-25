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
    name
  });
}

function startGame() {
  socket.emit("start-game", {});
}

function nextLetter() {
  socket.emit("next-letter");
}

socket.on("update-state", state => {
  document.getElementById("letter").innerText =
    state.currentLetter || "-";

  const playersList = document.getElementById("players");
  playersList.innerHTML = "";

  state.players.forEach(player => {
    const li = document.createElement("li");
    li.innerText = `${player.name} - ${player.score} pts ${player.connected ? "" : "(Desconectado)"}`;
    playersList.appendChild(li);
  });
});
function submitAnswers() {
  const answers = {
    nombre: document.getElementById("nombre").value,
    ciudad: document.getElementById("ciudad").value,
    animal: document.getElementById("animal").value
  };

  socket.emit("submit-answers", answers);
}
