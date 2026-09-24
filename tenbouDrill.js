// 牌姿パターン
const categories = [
    {
        id: "pattern1",
        variants: { 
            hand: ["7m", "7m", "2p", "3p", "4p", "1s", "2s", "4s", "5s", "6s", "7s", "8s", "9s"],
            winningTiles: ["3s"],
            winningTsumoHan: [3],
            winningTsumoFu: [30],
            winningRonHan: [2],
            winningRonFu: [40],
        }
    },
    {
        id: "pattern2",
        variants: { 
            hand: ["5p", "5p", "5p", "2s", "2s", "2s", "3s", "4s", "7s", "7s", "7s", "7z", "7z"],
            winningTiles: ["2s", "5s", "5rs", "7z"],
            winningTsumoHan: [3, 3, 4, 4],
            winningTsumoFu: [40, 40, 40, 40],
            winningRonHan: [2, 2, 3, 3, 1],
            winningRonFu: [50, 50, 50, 50],
        }
    }
]