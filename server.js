// Función para calcular puntos automáticamente
function calculateScores() {
    const categories = ['nombre', 'color', 'fruto'];
    const allPlayers = Object.values(players);

    categories.forEach(cat => {
        const counts = {};
        // Contar cuántas veces aparece cada palabra en esta categoría
        allPlayers.forEach(p => {
            const val = (p.answers[cat] || "").toLowerCase().trim();
            if (val) counts[val] = (counts[val] || 0) + 1;
        });

        // Asignar puntos base
        allPlayers.forEach(p => {
            const val = (p.answers[cat] || "").toLowerCase().trim();
            if (!val) {
                p.pointsDetail[cat] = 0;
            } else if (counts[val] > 1) {
                p.pointsDetail[cat] = 5; // Repetida
            } else {
                p.pointsDetail[cat] = 10; // Única
            }
        });
    });
}

socket.on('basta', (answers) => {
    if (gameState === 'PLAYING') {
        gameState = 'VALIDATING';
        players[socket.id].answers = answers; // Guardar respuestas del que terminó
        
        // En un escenario real, aquí pedirías las respuestas a los demás
        // Por ahora, calculamos con lo que llegó y mandamos a validar
        calculateScores(); 
        io.emit('show-validation', players);
    }
});

// Evento para invalidar palabra manualmente desde la TV
socket.on('invalidate-word', ({ playerId, category }) => {
    if (players[playerId]) {
        players[playerId].pointsDetail[category] = 0;
        io.emit('update-validation-screen', players);
    }
});
