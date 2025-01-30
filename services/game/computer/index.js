const http = require('http');
const {Server} = require("socket.io");
const {Game} = require("./js/game.js");
const {FlowBird} = require("./js/flowbird.js");
const {Player} = require("./js/player.js");

let server = http.createServer();
const io = new Server(server, {
    cors: {
        origin: "*",
    }
});
server.listen(8003);

const games = {};

io.on('connection', (socket) => {
    socket.on('game-start', (msg) => {
        startGame(socket, msg);
    });

    socket.on('game-action', (msg) => {
        if (games[socket.id]?.players[msg.number - 1]) {
            games[socket.id].players[msg.number - 1].setNextDirection(msg.direction);
        }
    });

    socket.on('disconnect', () => {
        delete games[socket.id];
    });
});

function startGame(socket, msg) {
    let flowBird = new FlowBird();
    let game = new Game(16, 9, new Player(msg.playerName, msg.playerNumber), flowBird, 500);
    games[socket.id] = game;

    game.addEventListener("game-turn", (event) => {
        if (event.detail.ended) {
            socket.emit('game-end', event.detail);
        }
        socket.emit('game-turn', {
            grid: game.grid,
            playerStates: game.players.map(player => ({
                pos: player.pos,
                direction: player.direction,
                dead: player.dead
            })),
        });
    });
    flowBird.setGame(game);
    game.start();

    socket.emit('game-start', {
        player1: game.getCopyOfPlayer(0),
        player2: game.getCopyOfPlayer(1),
    });
}
