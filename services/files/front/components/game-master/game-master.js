import {Game} from "/js/game.js";
import {HumanPlayer} from "/js/human-player.js";
import {HTMLComponent} from "/js/component.js";
import {FlowBird} from "/js/flowbird.js";

export class GameMaster extends HTMLComponent {
    gridSize = [16, 9];

    constructor() {
        super();
        this.gameBoard = document.createElement("app-game-board");
        this.shadowRoot.appendChild(this.gameBoard);
    }

    onVisible = () => {
        this.game = new Game(this.gridSize[0], this.gridSize[1], new HumanPlayer("Player 1"), new FlowBird(), 500);
        this.game.addEventListener("game-turn", (e) => {
            if (e.detail.ended) alert(e.detail.draw ? "Draw" : e.detail.winner.name + " won");
            this.gameBoard.draw(this.game);
        });
        this.game.init();
        this.game.start();
        this.gameBoard.draw(this.game);
    }

    onHidden = () => {
        if (this.game) this.game.stop();
        this.game = undefined;
    }
}
