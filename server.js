// ... (resto del código anterior igual)

let hostId = null; // Variable para rastrear al primer jugador

io.on('connection', (socket) => {
    
    socket.on('join-game', (name) => {
        // Si no hay host, el primero que entra es el host
        if (!hostId) {
            hostId = socket.id;
        }

        players[socket.id] = { 
            id: socket.id, 
            name: name, 
            answers: {}, 
            pointsDetail: {}, 
            totalScore: 0,
            isHost: (socket.id === hostId) 
        };

        // Avisamos a este jugador específico si es el host
        socket.emit('assign-role', { isHost: players[socket.id].isHost });
        
        io.emit('update-player-list', Object.values(players));
    });

    // El evento start-game ahora se recibe desde un móvil
    socket.on('start-game', () => {
        if (socket.id === hostId) { // Verificación de seguridad
            const ids = Object.keys(players);
            gameQueue = [...ids, ...ids]; 
            totalRounds = gameQueue.length;
            currentRound = 1;
            startNewRound();
        }
    });

    // Al desconectarse, si era el host, pasamos el mando al siguiente
    socket.on('disconnect', () => {
        if (socket.id === hostId) {
            delete players[socket.id];
            const remainingIds = Object.keys(players);
            hostId = remainingIds.length > 0 ? remainingIds[0] : null;
            if (hostId) {
                players[hostId].isHost = true;
                io.to(hostId).emit('assign-role', { isHost: true });
            }
        } else {
            delete players[socket.id];
        }
        io.emit('update-player-list', Object.values(players));
    });

    // ... (resto de funciones de cálculo e invalidación iguales)
});
