const socket = io();
let currentRoom = null;

function createRoom() {
  socket.emit("create-room");
}

socket.on("room-created", code => {
  currentRoom = code;
  document.getElementById("roomCode").innerText =
    "Código: " + code;
});

socket.on("update-state", state => {
  document.getElementById("letter").innerText =
    state.currentLetter || "-";

  const list = document.getElementById("playersList");
  list.innerHTML = "";

  state.players
    .sort((a,b)=>b.score-a.score)
    .forEach(p => {
      const li = document.createElement("li");
      li.innerText = `${p.name} - ${p.score}`;
      list.appendChild(li);
    });
});
