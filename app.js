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

// 山と王牌は固定表示。各家の手牌の枚数はゲーム状態として常に13枚を維持する。
fill(".wall-top", Array(14).fill("b"));
fill(".wall-left", Array(12).fill("b"));
fill(".wall-right", Array(12).fill("b"));
fill(".dead-wall-tiles", ["b", "b", "b", "b", "1s"]);

const playerHand = ["7m", "7m", "2p", "3p", "4p", "1s", "2s", "4s", "5s", "6s", "7s", "8s", "9s"];
const hands = {
  east: Array(13).fill("b"),
  south: Array(13).fill("b"),
  west: Array(13).fill("b"),
  north: playerHand,
};
const discards = { east: [], south: [], west: [], north: [] };
const drawSequence = ["5rm", "6p", "3s", "1m", "7p", "9s", "2m", "5p"];
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
  if (seat === "west") return { gridColumn: 3 - row, gridRow: 7 - position };
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
