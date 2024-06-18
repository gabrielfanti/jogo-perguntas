const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

let players = [];

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join') {
            const player = { name: data.name, score: 0, ws };
            players.push(player);
            broadcastScoreboard();
        } else if (data.type === 'updateScore') {
            const player = players.find(p => p.name === data.name);
            if (player) {
                player.score = data.score;
                broadcastScoreboard();
            }
        }
    });

    ws.on('close', () => {
        players = players.filter(p => p.ws !== ws);
        broadcastScoreboard();
    });
});

function broadcastScoreboard() {
    const scoreboard = players.map(p => ({ name: p.name, score: p.score }));
    const message = JSON.stringify({ type: 'scoreboard', scoreboard });
    players.forEach(p => p.ws.send(message));
}

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});