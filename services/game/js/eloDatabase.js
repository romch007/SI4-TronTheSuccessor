const {MongoClient} = require("mongodb");

const client = new MongoClient(process.env.MONGO_DB_URL ?? 'mongodb://mongodb:27017');
const database = client.db("Tron-the-successor");
const statsCollection = database.collection("stats");
const eloToRank = {
    0: "Line III",
    100: "Line II",
    200: "Line I",
    300: "Triangle III",
    400: "Triangle II",
    500: "Triangle I",
    600: "Square III",
    700: "Square II",
    800: "Square I",
    900: "Pentagon III",
    1000: "Pentagon II",
    1100: "Pentagon I",
    1200: "Hexagon",
};
exports.BASE_ELO = 300;

/**
 * Get the ELO of a player.
 * @param {string} playerId
 * @returns {Promise<number|null>}
 */
exports.getElo = async function (playerId) {
    const elo = await statsCollection.findOne({playerId});
    return elo?.elo ?? null;
}

/**
 * Update the ELO of a player.
 * @param playerId
 * @param newElo
 * @returns {Promise<number>}
 */
exports.updateElo = async function (playerId, newElo) {
    await statsCollection.updateOne(
        {playerId},
        {$set: {elo: newElo}},
        {upsert: true}
    );
    return newElo;
}

/**
 * Get all ELOs.
 * @returns {Promise<[]>}
 */
exports.getAllElo = async function () {
    return await statsCollection.find({}).toArray();
}

/**
 * Add a game to the player's stats.
 * @param {string} playerId The id of the player.
 * @returns {Promise<number>} The number of games.
 */
exports.addGame = async function (playerId) {
    const result = await statsCollection.findOneAndUpdate(
        {playerId},
        {$inc: {games: 1}},
        {returnDocument: "after", upsert: true}
    );
    return result.value?.games ?? 1;
}

/**
 * Add a win to the player's stats.
 * @param {string} playerId The id of the player.
 * @returns {Promise<number>} The number of wins.
 */
exports.addLoss = async function (playerId) {
    const result = await statsCollection.findOneAndUpdate(
        {playerId},
        {$inc: {losses: 1}},
        {returnDocument: "after", upsert: true}
    );
    return result.value?.losses ?? 1;
}

/**
 * Add a draw to the player's stats.
 * @param {string} playerId The id of the player.
 * @returns {Promise<number>} The number of draws.
 */
exports.addDraw = async function (playerId) {
    const result = await statsCollection.findOneAndUpdate(
        {playerId},
        {$inc: {draws: 1}},
        {returnDocument: "after", upsert: true}
    );
    return result.value?.draws ?? 1;
}

/**
 * Add a win streak to the player's stats.
 * @param playerId
 * @returns {Promise<number|*>}
 */
exports.addWin = async function (playerId) {
    const result = await statsCollection.findOneAndUpdate(
        {playerId},
        {$inc: {wins: 1}},
        {returnDocument: "after", upsert: true}
    );
    return result.value?.wins ?? 1;
}

exports.addWinStreak = async function (playerId) {
    const result = await statsCollection.findOneAndUpdate(
        {playerId},
        {$inc: {winStreak: 1}},
        {returnDocument: "after", upsert: true}
    );
    return result.value?.winStreak ?? 1;
}

/**
 * Reset the win streak of the player.
 * @param playerId
 * @returns {Promise<number|*>}
 */
exports.resetWinStreak = async function (playerId) {
    const result = await statsCollection.findOneAndUpdate(
        {playerId},
        {$set: {winStreak: 0}},
        {returnDocument: "after", upsert: true}
    );
    return result.value?.winStreak ?? 0;
}

/**
 * Calculate the rank of a player based on their ELO.
 * @param elo The ELO of the player.
 * @returns {{rank: string, eloInRank: number}} The rank of the player and the ELO in that rank.
 */
function getRank(elo) {
    for (let rankElo of Object.keys(eloToRank).reverse())
        if (elo >= rankElo) return {rank: eloToRank[rankElo], eloInRank: elo - rankElo};
    return {rank: "Triangle III", eloInRank: elo};
}

/**
 * Update the play time of a player.
 * @param playerId
 * @param time
 * @returns {Promise<void>}
 */
exports.updatePlayTime = async function (playerId, time) {
    await statsCollection.updateOne(
        {playerId},
        {$inc: {timePlayed: time}},
        {upsert: true}
    );
}

/**
 * Get all stats of a player.
 * @param playerId
 * @returns {Promise<{wins: number, losses: number, draws: number, games: number, winStreak: number, rank: string, eloInRank: number, timePlayed: number}>}
 */
exports.getAllStats = async function (playerId) {
    const stats = await statsCollection.findOne({playerId}) ?? {};

    const updatedStats = {
        wins: stats.wins ?? 0,
        losses: stats.losses ?? 0,
        draws: stats.draws ?? 0,
        games: stats.games ?? 0,
        winStreak: stats.winStreak ?? 0,
        timePlayed: stats.timePlayed ?? 0,
        elo: stats.elo ?? exports.BASE_ELO
    };

    await statsCollection.updateOne(
        {playerId},
        {$set: updatedStats}
    );

    const {rank, eloInRank} = getRank(updatedStats.elo);
    return {...updatedStats, rank, eloInRank};
}
