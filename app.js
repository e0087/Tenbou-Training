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

// drillからランダムに牌姿を選択
const randomCategory =
  window.tenbouCategories[
    Math.floor(Math.random() * window.tenbouCategories.length)
  ];

// 問題集の読み込み
const randomPattern = randomCategory.variants;
// プレイヤーの手牌
const playerHand = randomPattern.hand;
// アガリ牌
const playerWinningTiles = randomPattern.winningTiles;
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
let lastDiscardedTile = null;
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

claimButton.addEventListener("click", () => {
  const isTsumo = drawnTile !== null;
  const targetTile = isTsumo ? drawnTile : lastDiscardedTile;

  // アガリ牌かどうか判定
  const winningIndex = playerWinningTiles.indexOf(targetTile);

  if (winningIndex !== -1) {
    // 正解
    const han = isTsumo
      ? randomPattern.winningTsumoHan[winningIndex]
      : randomPattern.winningRonHan[winningIndex];

    const fu = isTsumo
      ? randomPattern.winningTsumoFu[winningIndex]
      : randomPattern.winningRonFu[winningIndex];

    showResultDialog(
      isTsumo ? "ツモ" : "ロン",
      targetTile,
      han,
      fu
    );

  } else {
    // チョンボ
    showChonboDialog(playerWinningTiles);
  }
});

turnButton.addEventListener("click", () => {
  // 東→南→西は摸打、北は自摸表示後に次の押下で打牌する。
  if (phase === 0) {
    lastDiscardedTile = nextDraw();
    discards.east.push(lastDiscardedTile);
  } else if (phase === 1) {
    lastDiscardedTile = nextDraw();
    discards.south.push(lastDiscardedTile);
  } else if (phase === 2) {
    lastDiscardedTile = nextDraw();
    discards.west.push(lastDiscardedTile);
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

const showResultDialog = (type, winningTile, han, fu) => {
  alert(
    `${type}\n\n` +
    `アガリ牌：${winningTile}\n` +
    `${han}翻 ${fu}符`
  );
};

const showChonboDialog = (winningTiles) => {
  alert(
    `チョンボ\n\n` +
    `アガリ牌：${winningTiles.join("、")}`
  );
};

render();
