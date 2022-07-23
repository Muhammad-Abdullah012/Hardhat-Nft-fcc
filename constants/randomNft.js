const path = require("path");

const randomNft = path.join(__dirname, "..", "images", "randomNft");

const RANDOM_NFT = [
    {
        imagePath: path.join(randomNft, "pug.png"),
        name: "PUG",
        description: "Random dog NFT, rare",
    },
    {
        imagePath: path.join(randomNft, "shiba-inu.png"),
        name: "SHIBA-INU",
        description: "Random dog NFT, somewhat rare",
    },
    {
        imagePath: path.join(randomNft, "st-bernard.png"),
        name: "ST-BERNARD",
        description: "Random dog NFT, most common",
    },
];

module.exports = {
    RANDOM_NFT,
};
