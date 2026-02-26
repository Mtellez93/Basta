const socket = io();

socket.emit("join-game", {
  playerId: "BOARD",
  name: "BOARD",
  role: "board"
});

new QRCode(document.getElementById("qr"), {
  text: window.location.origin + "/mobile.html",
  width: 150,
  height: 150
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

  state.players
    .sort((a,b) => b.score - a.score)
    .forEach(p => {
      const li = document.createElement("li");
      li.innerText = `${p.name} - ${p.score} pts`;
      list.appendChild(li);
    });
});

socket.on("show-results", state => {
  const div = document.createElement("div");
  div.className = "result-screen";

  const sorted = [...state.players].sort((a,b)=>b.score-a.score);

  div.innerHTML = `
    <h1>RESULTADOS</h1>
    <h2>${sorted[0]?.name} gana 🏆</h2>
  `;

  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 5000);
});
