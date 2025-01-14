import {directions, Player} from "/js/player.js";

export class Game extends EventTarget {
    gridSize;
    players;
    grid;
    #turnDuration;
    #gameLife;

    /**
     * @param {number} w Width of the game map
     * @param {number} h Height of the game map
     * @param {Player} player1 The first player of the game
     * @param {Player} player2 The second player of the game
     * @param {number} turnDuration The duration of a game turn
     */
    constructor(w, h, player1, player2, turnDuration = 500) {
        super();
        this.gridSize = [w, h];
        this.players = [player1, player2];
        this.grid = Array.from(Array(h), (_, i) => Array(i % 2 === 0 ? w : w - 1).fill(0));
        this.#turnDuration = turnDuration;
    }

    start() {
        this.players[0].pos = [0, Math.round(Math.random() * this.gridSize[1] / 4) * 2];
        this.players[1].pos = [this.gridSize[0] - 1, this.gridSize[1] - 1 - this.players[0].pos[1]];
        this.#gameLife = setInterval(() => this.#gameTurn(), this.#turnDuration);
    }

    stop() {
        clearInterval(this.#gameLife);
    }

    #gameTurn() {
        this.players.forEach((player) => {
            player.direction = player.nextDirection;
            player.pos = player.pos.map((item, index) => item - directions[player.direction][index]);
        });
        this.dispatchEvent(new CustomEvent("game-turn", {
            detail: {}
        }));
    }
}