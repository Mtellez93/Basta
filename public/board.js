const socket = io();

socket.emit("join-game", {
  playerId: "BOARD",
  name: "BOARD",
  role: "board"
});

socket.on("update-state", state => {
  document.getElementById("letter").innerText =
    state.currentLetter || "-";

  document.getElementById("phase").innerText =
    state.currentRound?.phase || "";

  document.getElementById("timer").innerText =
    state.currentRound?.timeLeft || 0;

  const list = document.getElementById("playersList");
  list.innerHTML = "";

  state.players.forEach(p => {
    const li = document.createElement("li");
    li.innerText = `${p.name} - ${p.score} pts`;
    list.appendChild(li);
  });
});
