const {Player} = require("./player.js");

const player1_keys = {
    "up-left": ["Q", "Z"],
    "up-right": ["Z", "D"],
    "down-left": ["Q", "S"],
    "down-right": ["S", "D"],
    "left": ["Q"],
    "right": ["D"]
};
const player2_keys = {
    "up-left": ["ArrowLeft", "ArrowUp"],
    "up-right": ["ArrowUp", "ArrowRight"],
    "down-left": ["ArrowLeft", "ArrowDown"],
    "down-right": ["ArrowDown", "ArrowRight"],
    "left": ["ArrowLeft"],
    "right": ["ArrowRight"]
};

exports.HumanPlayer = class HumanPlayer extends Player {
    #keypressed;

    /**
     * @param {string} name The player's name
     * @param {number} number The "number" of the player
     * @param {[number, number]} pos The player's position on the grid
     * @param {string} color The player's color
     * @param {string} avatar The player's avatar
     */
    constructor(name, number, pos = [0, 0], color = undefined, avatar = undefined) {
        super(name, number, pos, color, avatar);
        this.keys = number === 1 ? player1_keys : player2_keys;
    }
}