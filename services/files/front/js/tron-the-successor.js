const moves = ["KEEP_GOING", "LIGHT_RIGHT", "HEAVY_RIGHT", "NONE", "HEAVY_LEFT", "LIGHT_LEFT"];
const number_of_games = 4000;
let direction = 0;
let gameBoard = Array.from(Array(9), (_, i) => Array(i % 2 === 0 ? 16 : 15).fill(0));
let allAdjacent = [];
const memo = new Map();
let depth = 0;

function get(list, x, y) {
    return list[y][x];
}

function set(list, x, y, v) {
    list[y][x] = v;
}

async function setup(playersState) {
    direction = 0;
    set(gameBoard, playersState.playerPosition.column - 1, playersState.playerPosition.row - 1, 1);
    set(gameBoard, playersState.opponentPosition.column - 1, playersState.opponentPosition.row - 1, 1);
    allAdjacent = getAllAdjacentForGrid();
    return true;
}

async function nextMove(playersState) {
    set(gameBoard, playersState.playerPosition.column - 1, playersState.playerPosition.row - 1, 1);
    set(gameBoard, playersState.opponentPosition.column - 1, playersState.opponentPosition.row - 1, 1);
    const coord = depth++ < 10 ? determineNextBestMoveCenter(playersState) : maximizeConnectedEmptySquares(playersState);
    const move = (coord - direction + 6) % 6;
    console.log("current_direction: ", direction, "next_hex: ", coord, "move_to_hex: ", moves[move]);
    if (moves[move] === "NONE") {
        console.error("Wrong move");
        console.error("adjacent_hexagons: ", get(allAdjacent, playersState.playerPosition.column - 1, playersState.playerPosition.row - 1));
        return moves[0];
    }
    direction = coord;
    return moves[move];
}

function determineNextBestMoveMonte(playersState) {
    const possibleMoves = getPossibleMovesArray([playersState.playerPosition.column - 1, playersState.playerPosition.row - 1], gameBoard);
    const winRates = possibleMoves.map(move => simulateGames(playersState, move));
    const bestMoveIndex = winRates.indexOf(Math.max(...winRates));
    console.log("win_rates: ", winRates);
    return get(allAdjacent, playersState.playerPosition.column - 1, playersState.playerPosition.row - 1)
        .indexOf(possibleMoves[bestMoveIndex]);
}

function determineNextBestMoveCenter(playersState) {
    const playerPosition = [playersState.playerPosition.column - 1, playersState.playerPosition.row - 1];
    const opponentPosition = [playersState.opponentPosition.column - 1, playersState.opponentPosition.row - 1];
    const possibleMoves = getPossibleMovesArray(playerPosition, gameBoard);

    const heuristicScores = possibleMoves.map(move => {
        set(gameBoard, move[0], move[1], 1);

        const playerArea = floodFill(move);
        const opponentArea = floodFill(opponentPosition);

        set(gameBoard, move[0], move[1], 0);

        const center = [Math.floor(gameBoard[0].length / 2), Math.floor(gameBoard.length / 2)];
        const distanceToCenter = Math.abs(move[0] - center[0]) + Math.abs(move[1] - center[1]);
        return 0.7 * (playerArea - opponentArea) - 0.3 * distanceToCenter;
    });

    const bestMoveIndex = heuristicScores.indexOf(Math.max(...heuristicScores));
    return get(allAdjacent, playerPosition[0], playerPosition[1]).indexOf(possibleMoves[bestMoveIndex]);
}

function floodFill(start) {
    const visited = new Set();
    const stack = [start];
    let count = 0;

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const posKey = `${x},${y}`;

        if (!visited.has(posKey) && gameBoard[y]?.[x] === 0) {
            visited.add(posKey);
            count++;
            stack.push(...getAdjacent(x, y));
        }
    }
    return count;
}

function maximizeConnectedEmptySquares(playersState) {
    let tempBoard = structuredClone(gameBoard);
    const playerPosition = [playersState.playerPosition.column - 1, playersState.playerPosition.row - 1];
    const possibleMoves = getPossibleMovesArray(playerPosition, tempBoard);

    let bestMove = null;
    let maxCovered = 0;

    possibleMoves.forEach(move => {
        set(tempBoard, move[0], move[1], 1);

        const covered = floodFill(move);

        set(tempBoard, move[0], move[1], 0);

        if (covered > maxCovered) {
            maxCovered = covered;
            bestMove = move;
        }
    });
    return get(allAdjacent, playerPosition[0], playerPosition[1]).indexOf(bestMove);
}

function simulateGames(playersState, move) {
    const key = JSON.stringify({playersState, move});
    if (memo.has(key)) return memo.get(key);
    let wins = 0;
    for (let i = 0; i < number_of_games; i++) {
        if (simulateGame(playersState, move)) wins++;
    }
    const winRate = wins / number_of_games;
    memo.set(key, winRate);
    return winRate;
}

function simulateGame(playersState, move) {
    let tempBoard = structuredClone(gameBoard);
    let tempMove = move;
    let opponentMove = getPossibleMovesArray(
        [playersState.opponentPosition.column - 1, playersState.opponentPosition.row - 1], tempBoard)[0];
    for (let i = 0; i < 144; i++) {
        const possibleMoves = getPossibleMovesArray(tempMove, tempBoard);
        if (possibleMoves.length === 0) return false;
        tempMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

        const opponentMoves = getPossibleMovesArray(opponentMove, tempBoard);
        if (opponentMoves.length === 0) return true;
        opponentMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];

        set(tempBoard, tempMove[0], tempMove[1], 1);
        set(tempBoard, opponentMove[0], opponentMove[1], 1);
    }
    return false;
}

export {setup, nextMove}; // ES6
if (typeof exports !== "undefined") { // CommonJS
    exports.setup = setup;
    exports.nextMove = nextMove;
}

function getPossibleMovesArray(playerPosition, board) {
    let adjacentHex = get(allAdjacent, playerPosition[0], playerPosition[1]);
    return adjacentHex.filter(([x, y]) => y >= 1 && y <= 9 && x >= 1 && x <= (y % 2 === 1 ? 16 : 15) && !get(board, x, y));
}

function getAdjacent(x, y) {
    let adjacent = [];
    if (y % 2 === 0) {
        adjacent.push([x - 1, y]); // left
        adjacent.push([x - 1, y - 1]); // up_left
        adjacent.push([x, y - 1]); // up_right
        adjacent.push([x + 1, y]); // right
        adjacent.push([x, y + 1]); // down_right
        adjacent.push([x - 1, y + 1]); // down_left
    } else {
        adjacent.push([x - 1, y]); // left
        adjacent.push([x, y - 1]); // up_left
        adjacent.push([x + 1, y - 1]); // up_right
        adjacent.push([x + 1, y]); // right
        adjacent.push([x + 1, y + 1]); // down_right
        adjacent.push([x, y + 1]); // down_left
    }
    return adjacent;
}

function getAllAdjacentForGrid() {
    allAdjacent = Array.from(Array(9), (_, i) => Array(i % 2 === 0 ? 16 : 15).fill([]));
    for (let y = 0; y < gameBoard.length; y++)
        for (let x = 0; x < gameBoard[y].length; x++)
            set(allAdjacent, x, y, getAdjacent(x, y));
    return allAdjacent;
}
