const tile = (code = "b", className = "") => {
  const element = document.createElement("span");
  element.className = `tile ${className}`.trim();
  const image = document.createElement("img");
  image.src = `assets/tiles/${code}.png`;
  image.alt = code === "b" ? "裏向きの牌" : code;
  element.append(image);
  return element;
};

const fill = (selector, codes) => {
  const target = document.querySelector(selector);
  target.replaceChildren(...codes.map((code) => tile(code)));
};

// 全牌のデータを生成。
const allTiles = [
  ...['m', 'p', 's'].flatMap(suit => [...Array(9)].flatMap((_, i) => i === 4 ? [`5${suit}`, `5${suit}`, `5${suit}`, `5r${suit}`] : Array(4).fill(`${i + 1}${suit}`))),
  ...[...Array(7)].flatMap((_, i) => Array(4).fill(`${i + 1}z`))
];

// プレイヤーの手牌を設定。
const playerHand = ["7m", "7m", "2p", "3p", "4p", "1s", "2s", "4s", "5s", "6s", "7s", "8s", "9s"];
// アガリ牌情報を設定。
const playerWinningTiles = ["3s"];
const hands = {
  east: Array(13).fill("b"),
  south: Array(13).fill("b"),
  west: Array(13).fill("b"),
  north: playerHand,
};
// 手牌で使用している牌を全牌データから削除
playerHand.forEach(tile => {
  const index = allTiles.indexOf(tile);
  if (index !== -1) {
    allTiles.splice(index, 1); // 見つかった位置の1枚だけを削除
  }
});

// ドラ表示牌を全牌データからランダムに1枚抽出。
const deadWallOpenTile1 = allTiles.splice(Math.floor(Math.random() * allTiles.length), 1)[0];

// 王牌、他家の手牌（すべて裏）生成。 
fill(".wall-top", Array(13).fill("b"));
fill(".wall-left", Array(13).fill("b"));
fill(".wall-right", Array(13).fill("b"));
fill(".dead-wall-tiles", ["b", "b", "b", "b", deadWallOpenTile1]);

// 自摸牌生成。
const drawSequence = allTiles
.map(tile => ({ tile, value: Math.random() })) // 各牌にランダムな数値を付与
.sort((a, b) => a.value - b.value) // その数値でソート
.map(({ tile }) => tile); // 牌の文字列だけに戻す

const discards = { east: [], south: [], west: [], north: [] };
const discardTargets = {
  east: ".opponent-right",
  south: ".opponent-top",
  west: ".opponent-left",
  north: ".player-discard",
};

let drawIndex = 0;
let phase = 0;
let drawnTile = null;
let remaining = 70;
const turnButton = document.querySelector(".turn-button");
const claimButton = document.querySelector(".claim-button");
const remainingCount = document.querySelector(".remaining-count");
const nextDraw = () => drawSequence[drawIndex++ % drawSequence.length];

const discardPosition = (seat, index) => {
  const row = Math.floor(index / 6);
  const position = (index % 6) + 1;

  // 各家から見て、手牌に近い列から6枚ずつ並べる。
  if (seat === "north") return { gridColumn: position, gridRow: row + 1 };
  if (seat === "south") return { gridColumn: 7 - position, gridRow: 3 - row };
  if (seat === "west") return { gridColumn: 3 - row, gridRow: position };
  return { gridColumn: row + 1, gridRow: 7 - position }; // 東家
};

const renderDiscards = (seat, selector) => {
  const target = document.querySelector(selector);
  const tiles = discards[seat].map((code, index) => {
    const element = tile(code);
    Object.assign(element.style, discardPosition(seat, index));
    return element;
  });
  target.replaceChildren(...tiles);
};

const render = () => {
  Object.entries(discardTargets).forEach(([seat, selector]) => renderDiscards(seat, selector));
  const hand = document.querySelector(".player-hand");
  hand.replaceChildren(...hands.north.map((code) => tile(code)));
  const drawnArea = document.querySelector(".drawn-tile-area");
  drawnArea.replaceChildren(...(drawnTile ? [tile(drawnTile)] : []));
  remainingCount.textContent = remaining;
  turnButton.disabled = remaining === 0;
  claimButton.textContent = drawnTile ? "ツモ？" : "ロン？";
  claimButton.setAttribute("aria-label", drawnTile ? "ツモを宣言する" : "ロンを宣言する");
};

turnButton.addEventListener("click", () => {
  // 東→南→西は摸打、北は自摸表示後に次の押下で打牌する。
  if (phase === 0) {
    discards.east.push(nextDraw());
  } else if (phase === 1) {
    discards.south.push(nextDraw());
  } else if (phase === 2) {
    discards.west.push(nextDraw());
  } else if (phase === 3) {
    drawnTile = nextDraw();
  } else {
    discards.north.push(drawnTile);
    drawnTile = null;
  }

  if (phase !== 3) remaining -= 1;
  phase = (phase + 1) % 5;
  render();
});

render();
