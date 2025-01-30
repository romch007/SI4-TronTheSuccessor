import {Game} from "/js/game.js";
import {HumanPlayer} from "/js/human-player.js";
import {HTMLComponent} from "/js/component.js";
import {FlowBird} from "/js/flowbird.js";
import "/js/socket.io.js"

export class GameMaster extends HTMLComponent {
    gridSize = [16, 9];
    against = "local";
    paused = false;
    socket;

    static get observedAttributes() {
        return ["gridSize", "against"];
    }

    constructor() {
        super("game-master", ["html", "css"]);

        document.addEventListener("keyup", (event) => {
            if (event.code === "Escape" && this.against === "local" && this.checkVisibility()) {
                if (this.game.isPaused()) this.resume();
                else this.pause();
            }
        });
    }

    onSetupCompleted = () => {
        this.gameBoard = this.shadowRoot.getElementById("board");
        this.popupWindow = this.shadowRoot.getElementById("popup-container");

        this.popupTitle = this.shadowRoot.getElementById("title");
        this.popupTime = this.shadowRoot.getElementById("time");
        this.popupDescription = this.shadowRoot.getElementById("description");

        this.resumeButton = this.shadowRoot.getElementById("resume");
        this.resumeButton.addEventListener("click", () => this.resume());
        this.popupWindow.style.display = "none";
        this.shadowRoot.getElementById("restart").addEventListener("click", () => this.#launchGame());
        this.shadowRoot.getElementById("home").addEventListener("click", () => {
            document.dispatchEvent(new CustomEvent("menu-selection", {detail: "home"}));
        });
    };

    attributeChangedCallback(name, oldValue, newValue) {
        this[name] = newValue;
    }

    onVisible = () => this.#launchGame();
    onHidden = () => this.stopGame();

    #launchGame() {
        this.against === "local" ? this.newGame() : this.#gameWithServer()
    }

    newGame() {
        this.popupWindow.style.display = "none";
        this.stopGame();
        const opponent = this.against === "computer" ? new FlowBird() : new HumanPlayer("Player 2", 2);
        this.game = new Game(this.gridSize[0], this.gridSize[1], new HumanPlayer("Player 1", 1), opponent, 500);
        if (opponent.setGame) opponent.setGame(this.game);
        this.game.addEventListener("game-turn", (e) => {
            if (e.detail.ended) this.endScreen(e.detail);
            this.gameBoard.draw(this.game);
        });
        this.game.start();
        this.gameBoard.draw(this.game);
    }

    stopGame() {
        if (this.game) this.game.stop();
        this.game = undefined;
    }

    endScreen(details) {
        this.popupWindow.style.display = "block";
        this.resumeButton.style.display = "none";
        this.popupTitle.innerText = details.draw ? "Draw" : details.winner + " won";
        this.popupTime.innerText = this.#timeToString(details.elapsed);
        this.popupDescription.innerText = "";
    }

    pause() {
        const details = this.game.stop();
        if (!details) return;
        this.popupWindow.style.display = "block";
        this.resumeButton.style.display = this.against === "local" ? "block" : "none";
        this.popupTitle.innerText = "Pause";
        this.popupTime.innerText = this.#timeToString(details.elapsed);
        this.popupDescription.innerText = "";
    }

    #timeToString(time) {
        return `${String(Math.floor((time / 1000) / 60)).padStart(2, "0")}'${String(Math.floor((time / 1000) % 60)).padStart(2, "0")}"`;
    }

    resume() {
        this.popupWindow.style.display = "none";
        this.game.resume();
    }

    #gameWithServer() {
        this.popupWindow.style.display = "none";
        this.stopGame();
        if (!this.socket) this.socket = io('http://localhost:8002');
        this.gameBoard.draw(new Game(this.gridSize[0], this.gridSize[1], null, null, 500));

        this.socket.emit("game-start", {
            playerName: "Player 1",
            playerNumber: 1,
        });
        this.socket.on('game-start', (msg) => {
            this.game = new Game(this.gridSize[0], this.gridSize[1], new HumanPlayer(msg.player1.name, msg.player1.number, msg.player1.pos), msg.player2, 500);
            this.game.players.forEach(player => this.game.grid[player.pos[1]][player.pos[0]] = player.number);
            this.gameBoard.draw(this.game);
        });

        this.socket.on('game-turn', (msg) => {
            this.game.players = msg.playerStates.map((player, i) => {
                return {
                    ...this.game.players[i],
                    pos: player.pos,
                    direction: player.direction,
                    dead: player.dead
                };
            });
            this.game.grid = msg.grid;
            this.gameBoard.draw(this.game);
        });

        this.socket.on('game-end', (msg) => {
            this.endScreen(msg);
        });

        document.addEventListener("player-direction", (event) => {
            this.socket.emit("game-action", {direction: event.detail.direction, number: event.detail.number})
        });
    }
}
