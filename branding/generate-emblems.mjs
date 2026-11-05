// Génère les emblèmes des bâtiments (src/assets/emblems/{id}.svg, viewBox 64×64), style « matières + liseré ».
// Usage : node branding/generate-emblems.mjs
// Le cadre (forme et couleur) indique la rareté ; l'intérieur utilise la palette de matières ci-dessous.
// Chaque forme est doublée d'un liseré sombre (passe « halo ») pour rester lisible à 28 px.
// Nom et rareté recopiés du catalogue de l'API (the-black-hour-api/src/game/catalog/buildings.ts) :
// à tenir à jour quand un bâtiment est ajouté ou change de rareté.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'assets', 'emblems');

const O = '#0b0718'; // liseré, fond du jeu
const Y = '#ffd60a'; // lumière, laiton, petits détails

// Palette de matières : [remplissage, contour]
const M = {
  wood: ['#b47a42', '#ecb57a'],
  woodAlt: ['#9a6436', '#ecb57a'],
  bark: ['#7a4a22', '#c98a4b'],
  metal: ['#66788e', '#cfdaea'],
  steel: ['#7d8ea6', '#d6e0ee'],
  rust: ['#c25e2e', '#ffa86a'],
  stone: ['#6a7290', '#d2d8e8'],
  stoneAlt: ['#8a7660', '#e2cfb4'],
  dirt: ['#64421f', '#c98a4b'],
  water: ['#1f6ac0', '#8ff3ff'],
  tarp: ['#2f7fd6', '#8fc3ff'],
  fabric: ['#5d72b0', '#c9d6ff'],
  cloak: ['#3a4a6a', '#9fb3c8'],
  fire: ['#ff9f5a', '#ffc79e'],
  plant: ['#2fa85a', '#8dffb8'],
  cloth: ['#a88a5a', '#ead4a8'],
  paper: ['#e8e0c8', '#fff8e6'],
  danger: ['#ff5c8a', '#ffb0cc'],
  flower: ['#e8508a', '#ffb0cc'],
  gold: [Y, '#ffe97a'],
  bus: ['#d9a21a', '#ffe97a'],
  ink: ['#2350b0', '#8ff3ff'],
  hole: ['#140c08', '#c98a4b'],
  glass: ['#1f6ac0', '#8ff3ff'],
  dark: ['#2a3140', '#cfdaea'],
};
// Joints et gravures (teinte sombre de la matière, jamais noir pur)
const J = { stone: '#454c66', wood: '#7a4a22', metal: '#2c3646', rust: '#6a2a10', tarp: '#1a4f9a' };
const LIGHT = '#eaf6ff';

const n = (v) => Math.round(v * 100) / 100;
const P = (d, f, fo, s, sw = 2.2) =>
  `<path d="${d}" fill="${f}" fill-opacity="${fo}" stroke="${s}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const L = (d, s, sw = 2.2) => P(d, 'none', 1, s, sw);
const C = (x, y, r, f, fo, s, sw = 2.2) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${f}" fill-opacity="${fo}" stroke="${s}" stroke-width="${sw}"/>`;
const m = (k, d, sw) => P(d, M[k][0], 1, M[k][1], sw);
const mc = (k, x, y, r, sw) => C(x, y, r, M[k][0], 1, M[k][1], sw);
const fillOnly = (k, d) => P(d, M[k][0], 1, 'none', 0);
const dot = (x, y, r, col) => C(x, y, r, col, 1, 'none', 0);
const dots = (pts, r, col) => pts.map(([x, y]) => dot(x, y, r, col)).join('');
const fl = (x, y, s) => `M${n(x)} ${n(y)}q${n(-4 * s)} ${n(-3 * s)} 0 ${n(-8 * s)}q${n(4 * s)} ${n(5 * s)} 0 ${n(8 * s)}z`;
const flame = (x, y, s) => m('fire', fl(x, y, s), 1) + P(fl(x, y - 0.5 * s, 0.55 * s), Y, 1, 'none', 0);

// Liseré : même tracé, en couleur de fond, plus épais ; les points sans contour n'en ont pas
const halo = (str) =>
  str
    .replace(
      /fill="([^"]*)" fill-opacity="[^"]*" stroke="(#[0-9a-f]+)" stroke-width="([\d.]+)"/g,
      (_, f, s, w) => `fill="${f === 'none' ? 'none' : O}" fill-opacity="1" stroke="${O}" stroke-width="${n(+w + 2.6)}"`,
    )
    .replace(/ fill="[^"]*" fill-opacity="1" stroke="none" stroke-width="0"\/>/g, ' fill="none" stroke="none"/>');

// Cadres par rareté (fond plein sombre teinté)
const FRAMES = {
  common: () => C(32, 32, 29, '#0f3a26', 1, '#3dff8f', 2.5),
  rare: () =>
    P('M32 3l25 14v30L32 61 7 47V17z', '#0c3a48', 1, '#22e6ff', 2.5) +
    L('M32 8.5l20.5 11.5v24L32 55.5 11.5 44V20z', '#22e6ff', 1),
  epic: (id) =>
    `<defs><linearGradient id="p${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8b3dff" stop-opacity=".7"/><stop offset="1" stop-color="#ff2ec4" stop-opacity=".45"/></linearGradient></defs>` +
    P('M21 2h22l6 5 8 8 5 6v22l-5 6-8 8-6 5H21l-6-5-8-8-5-6V21l5-6 8-8z', `url(#p${id})`, 1, '#b98bff', 2.5) +
    C(32, 32, 24, '#2a1450', 1, '#b98bff', 1.5),
  base: () =>
    P('M11 5h42a6 6 0 0 1 6 6v42a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6V11a6 6 0 0 1 6-6z', '#1c2850', 1, '#c9d6ff', 2.5) +
    L('M5 15h8M5 25h4M5 39h4M5 49h8', '#c9d6ff', 1.5),
};

// Pointes (Spike Field)
const spike = ([x, t, w]) => `M${x - w} 45L${x} ${t}L${x + w} 45z`;
const spikeTip = ([x, t, w]) => {
  const f = 0.32;
  const y = n(t + f * (45 - t));
  return `M${n(x - w * f)} ${y}L${x} ${t}L${n(x + w * f)} ${y}z`;
};

const B = [
  { id: 16, name: 'Blueprint Workshop', rarity: 'base',
    d: m('ink', 'M16 20h32v24H16z') + L('M16 28h32M16 36h32M24 20v24M32 20v24M40 20v24', '#4f84d8', 0.8) +
      L('M22 38l8-10 6 6 6-8', '#ffffff') + m('gold', 'M38 46L48 30l3 2-10 16z', 1.2) +
      m('danger', 'M46.5 32.4L48 30l3 2-1.5 2.4z', 1.2) + P('M38 46l3 2-4 1z', '#ffc79e', 1, '#ffc79e', 1) },
  { id: 17, name: 'Archives', rarity: 'base',
    d: m('paper', 'M24 17v-5h10v5', 1.4) + m('wood', 'M18 16h28v32H18z') + L('M18 27h28M18 38h28', J.wood, 2) +
      L('M29 21.5h6M29 32.5h6M29 43.5h6', Y, 2.6) },
  { id: 1, name: 'Scrap Fence', rarity: 'common',
    d: m('wood', 'M15 46V26l9-3v23z') + m('steel', 'M26 46V20l8 2v24z') + m('rust', 'M36 46V24l10-2 2 24z') +
      L('M12 34h40M13 46h38', '#a9bbd0', 2.6) + dots([[19.5, 29], [30, 26], [41, 28]], 1.4, Y) },
  { id: 2, name: 'Sinkhole', rarity: 'common',
    d: m('dirt', 'M15 34a17 9 0 1 0 34 0a17 9 0 1 0 -34 0z') + m('hole', 'M22 36a10 5 0 1 0 20 0a10 5 0 1 0 -20 0z', 1.6) +
      m('steel', 'M26 38l2-6 2 6z', 1.2) + m('steel', 'M31 39l2-7 2 7z', 1.2) + m('steel', 'M36 38l2-5 2 5z', 1.2) +
      L('M15 23l6 4M49 23l-6 4M32 44v6', '#c98a4b') + dots([[29, 32.6], [34, 32.4]], 0.9, '#ff5c8a') },
  { id: 3, name: 'Rampart', rarity: 'common',
    d: m('stone', 'M14 48V22h7v6h7v-6h8v6h7v-6h7v26z') +
      L('M15 38h34M24 38v9M40 38v9M32 29v9M15 30h6M43 30h6', J.stone, 1.8) +
      L('M32 22V12', '#ecb57a', 2) + m('danger', 'M32.5 12.5l7 2.5-7 2.5z', 1.4) },
  { id: 4, name: 'Manhole Cover Wall', rarity: 'rare',
    d: mc('metal', 22, 24, 9) + mc('rust', 42, 24, 9) + mc('metal', 32, 41, 9) +
      L('M16 21h12M16 27h12M26 38h12M26 44h12', J.metal, 2) + L('M36 21h12M36 27h12', J.rust, 2) +
      dots([[32, 24], [26.5, 33], [37.5, 33]], 1.6, Y) },
  { id: 5, name: 'Roadblock', rarity: 'common',
    d: L('M20 37v11M44 37v11M15 48h10M39 48h10', '#ecb57a', 2.6) + m('paper', 'M13 26h38v11H13z', 2) +
      L('M22 26l-6 11M34 26l-6 11M46 26l-6 11', '#ff5c8a', 3.4) + L('M13 26h38v11H13z', '#fff8e6', 2) +
      mc('gold', 20, 21, 2.8, 1.4) + mc('gold', 44, 21, 2.8, 1.4) },
  { id: 6, name: 'Decoy Camp', rarity: 'epic',
    d: m('cloth', 'M14 47l18-27 18 27z') + L('M23 33.5l-3 4.5M41 33.5l3 4.5', '#7a5a30', 1.6) +
      P('M26 47l6-13 6 13z', '#2a1a10', 1, '#ead4a8', 1.8) + flame(32, 47, 0.7) +
      L('M32 20v-8', '#ecb57a', 2) + m('danger', 'M32.5 12.5l7 3-7 3z', 1.4) },
  { id: 7, name: 'Ditch Network', rarity: 'rare',
    d: m('dirt', 'M14 19h12v12h12V19h12v7H44v12H32v12h-7V38H20V26h-6z') +
      L('M15 22.5h8v12h18v-12h8M28.5 34.5V49', '#2f7fd6', 3) + L('M17 22.5h3M33 34.5h4M28.5 42v3', '#8ff3ff', 1.2) },
  { id: 8, name: 'Snare Holes', rarity: 'common',
    d: m('dirt', 'M12 46a20 6 0 1 0 40 0a20 6 0 1 0 -40 0z', 1.8) + m('hole', 'M20 46a12 3.5 0 1 0 24 0a12 3.5 0 1 0 -24 0z', 1.6) +
      [25, 31, 37].map((x) => m('steel', `M${x} 46.5l1.5-5 1.5 5z`, 1)).join('') +
      L('M14 44c0-18 8-28 22-28', '#ecb57a', 3) + m('plant', 'M36 16c2-3 6-3 8-1-3 2-6 2-8 1z', 1.2) +
      L('M34 17v8.5', '#ead4a8', 1.8) + C(34, 31, 5.5, 'none', 1, '#ead4a8', 2.2) + dot(34, 25.5, 1.8, '#ff5c8a') },
  { id: 9, name: 'Blockhouse', rarity: 'rare',
    d: m('stone', 'M14 46V26l6-6h24l6 6v20z') + P('M22 29h20v5H22z', '#1a1410', 1, '#d2d8e8', 1.6) +
      L('M24.5 31.5h15', Y, 1.4) + L('M14 40h12M38 40h12', J.stone, 1.6) + m('wood', 'M26 46v-6h12v6z') },
  { id: 10, name: 'Rubble Mound', rarity: 'common',
    d: m('dirt', 'M12 48c4-16 14-26 20-26s16 10 20 26z') + L('M38 28l4-9', '#ffa86a', 2.4) +
      m('stone', 'M21 38h9v4h-9z', 1.4) + m('stoneAlt', 'M33 42h10v4H33z', 1.4) + m('stone', 'M27 30h9v4h-9z', 1.4) },
  { id: 11, name: 'Spike Field', rarity: 'rare',
    d: P('M12 45h40l-4 6H16z', '#64421f', 1, '#c98a4b', 1.6) +
      [[15.5, 33, 3.5], [48.5, 33, 3.5], [23.5, 24, 3.5], [40.5, 24, 3.5], [32, 14, 4]]
        .map((k) => m('steel', spike(k), 2) + m('danger', spikeTip(k), 1.2)).join('') },
  { id: 12, name: 'Bracing Struts', rarity: 'epic',
    d: L('M14 48h36', '#c98a4b', 2.6) + L('M23 20l23 28M23 34l12 14', '#cfdaea', 2.8) + m('wood', 'M16 15h7v33h-7z') +
      dots([[46, 48], [35, 48], [23, 20], [23, 34]], 2, Y) },
  { id: 13, name: 'Outer Curtain', rarity: 'common',
    d: m('stone', 'M12 46V24h9v5h22v-5h9v22z') + L('M21 29v17M43 29v17M13 37h8M43 37h8', J.stone, 1.8) +
      m('wood', 'M27 46v-7a5 5 0 0 1 10 0v7z') + L('M32 35v11', J.wood, 1.4) },
  { id: 14, name: 'Shredder Gate', rarity: 'epic',
    d: L('M15 48V18h34v30', '#cfdaea', 3) + mc('metal', 25, 35, 7) + mc('metal', 39, 35, 7) +
      L('M25 28v14M18 35h14M39 28v14M32 35h14', '#ff5c8a', 2.4) + L('M19 18l3 5 3-5 3 5 3-5 3 5 3-5 3 5 3-5', Y, 2.4) },
  { id: 15, name: 'Razor Coils', rarity: 'epic',
    d: L('M11 50h42', '#c98a4b', 2.6) + m('wood', 'M13 22h5v28h-5z', 1.8) + m('wood', 'M46 22h5v28h-5z', 1.8) +
      [22, 29, 36, 43].map((x, i) =>
        P(`M${x - 6} 34a6 10 0 1 0 12 0a6 10 0 1 0 -12 0z`, 'none', 1, i % 2 ? '#8a9bb2' : '#d6e0ee', 2.6)).join('') +
      [22, 29, 36, 43].map((x) => P(`M${x - 2} 24l2-2 2 2-2 2zM${x - 2} 44l2-2 2 2-2 2z`, '#ff5c8a', 1, '#ffb0cc', 1)).join('') +
      dots([[15.5, 26], [48.5, 26]], 1.4, Y) },
  { id: 18, name: 'Scrapyard Keep', rarity: 'epic',
    d: m('rust', 'M21 48V24h22v24z') + m('metal', 'M18 24v-8h6v3h5v-3h6v3h5v-3h6v8z') +
      L('M21 34l8 3 6-4 8 3', J.rust, 2) + m('gold', 'M30 48v-8h4v8z', 1.4) },
  { id: 19, name: 'Log Redoubt', rarity: 'epic',
    d: [[26, 31], [38, 31], [32, 20], [20, 42], [32, 42], [44, 42]]
      .map(([x, y]) => C(x, y, 6, '#c08345', 1, '#ffc79e') + C(x, y, 3.2, 'none', 1, J.wood, 1.4) + dot(x, y, 1.3, Y)).join('') },
  { id: 20, name: 'Quarry Tower', rarity: 'epic',
    d: m('dirt', 'M14 48l6-12h24l6 12z') + m('stone', 'M25 36V18h14v18z') + L('M22 18h20', '#ecb57a', 2.6) +
      L('M28 25h8M28 30h8', J.stone, 1.8) + L('M32 18v-5', Y, 2.4) + dot(32, 12, 1.8, Y) },
  { id: 21, name: 'Meccano Fort', rarity: 'epic',
    d: fillOnly('dark', 'M18 18h28v30H18z') + L('M18 18l28 15M46 18L18 33M18 48l28-15M46 48L18 33', '#cfdaea', 1.8) +
      L('M18 48V18h28v30M18 33h28', '#ffa86a', 2.6) +
      dots([[18, 18], [46, 18], [18, 33], [46, 33], [18, 48], [46, 48]], 2, Y) },
  { id: 22, name: 'Mattress Wall', rarity: 'epic',
    d: m('cloth', 'M19 17h26a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5v-4a5 5 0 0 1 5-5z') +
      m('fabric', 'M19 33h26a5 5 0 0 1 5 5v4a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5v-4a5 5 0 0 1 5-5z') +
      dots([[22, 24], [32, 24], [42, 24]], 1.5, '#5a3418') + dots([[22, 40], [32, 40], [42, 40]], 1.5, '#23306a') +
      L('M27 16v32', '#ffa86a', 2) },
  { id: 23, name: 'Hubcap Wall', rarity: 'common',
    d: mc('steel', 32, 32, 17) + L('M32 15v12M32 37v12M15 32h12M37 32h12', J.metal, 2) + mc('metal', 32, 32, 5) +
      L('M21 19a17 17 0 0 0-4 6', '#ffa86a', 2.4) + dots([[22, 22], [42, 22], [22, 42], [42, 42]], 2, Y) },
  { id: 24, name: 'Pallet Stack', rarity: 'common',
    d: L('M18 21v5M32 21v5M46 21v5M18 33v5M32 33v5M46 33v5M18 45v5M32 45v5M46 45v5', '#ecb57a', 3) +
      L('M14 26h36M14 38h36M14 50h36', '#c98a4b', 2) +
      m('wood', 'M14 17h36v4H14z', 1.8) + m('rust', 'M14 29h36v4H14z', 1.8) + m('woodAlt', 'M14 41h36v4H14z', 1.8) },
  { id: 25, name: 'Cobble Heap', rarity: 'common',
    d: m('stone', 'M12 49l2-8 8-3 6 4v7z', 1.8) + m('stoneAlt', 'M28 49v-6l7-5 8 3 2 8z', 1.8) +
      m('stone', 'M45 49v-6l5-4 3 3 1 7z', 1.8) + m('stoneAlt', 'M19 38l2-7 8-3 6 4-2 7-5 3-6-1z', 1.8) +
      m('stone', 'M36 38l-1-6 6-5 7 4v7l-6 2z', 1.8) + m('stoneAlt', 'M27 27l3-8 8-2 4 6-3 5-6 3z', 1.8) +
      m('plant', 'M17 41c1-2 4-3 6-2-1 2-4 3-6 2z', 1) },
  { id: 26, name: 'Flooded Moat', rarity: 'rare',
    d: fillOnly('water', 'M13 38q5-5 10 0t10 0 10 0 10 0V49H13z') + m('stone', 'M20 30V18h5v4h5v-4h4v4h5v-4h5v12z') +
      P('M29.5 30v-4a2.5 2.5 0 0 1 5 0v4z', O, 1, '#d2d8e8', 1.6) +
      L('M13 38q5-5 10 0t10 0 10 0 10 0M13 46q5-5 10 0t10 0 10 0 10 0', '#8ff3ff') },
  { id: 27, name: 'Corrugated Shack', rarity: 'rare',
    d: m('metal', 'M18 28h28v20H18z') + L('M22 29v18M26 29v18M42 29v18', '#a9bbd0', 1.4) +
      m('wood', 'M30 48V37h8v11z', 1.8) + m('rust', 'M13 30L32 16l19 14z') },
  { id: 28, name: 'Canvas Stockade', rarity: 'rare',
    d: m('cloth', 'M18 26h28v18H18z') + L('M20 26l10 18M34 26l10 18', '#7a5a30', 1.4) +
      m('wood', 'M16 47V20l2-4 2 4v27z', 1.8) + m('wood', 'M30 47V20l2-4 2 4v27z', 1.8) +
      m('wood', 'M44 47V20l2-4 2 4v27z', 1.8) + L('M15 30h6M29 30h6M43 30h6M15 40h6M29 40h6M43 40h6', '#ff5c8a', 1.6) },
  { id: 29, name: 'Drystone Crib', rarity: 'rare',
    d: fillOnly('stone', 'M16 18h10v10H16z') + fillOnly('stoneAlt', 'M26 18h22v10H26z') +
      fillOnly('stoneAlt', 'M16 28h22v10H16z') + fillOnly('stone', 'M38 28h10v10H38z') +
      fillOnly('stone', 'M16 38h12v10H16z') + fillOnly('stoneAlt', 'M28 38h20v10H28z') +
      L('M16 28h32M16 38h32M26 18v10M38 28v10M28 38v10', J.stone, 1.8) +
      L('M19 18h26a3 3 0 0 1 3 3v24a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V21a3 3 0 0 1 3-3z', '#d2d8e8') +
      m('plant', 'M40 18c1-3 5-4 7-2-2 2-5 3-7 2z', 1) },
  { id: 30, name: 'Nailed Trellis', rarity: 'rare',
    d: L('M14 32l18-18 18 18-18 18zM23 23l18 18M41 23L23 41', '#ecb57a', 2.6) +
      m('plant', 'M17 42c1-3 4-4 7-3-1 3-4 4-7 3z', 1.2) + m('plant', 'M40 21c1-3 4-4 7-3-1 3-4 4-7 3z', 1.2) +
      dots([[32, 32], [23, 23], [41, 23], [23, 41], [41, 41]], 2, Y) },
  { id: 31, name: 'Rebar Berm', rarity: 'rare',
    d: L('M22 34l-4-16M32 32V14M42 34l4-16', '#ffa86a', 2.6) + m('dirt', 'M12 48c6-12 14-16 20-16s14 4 20 16z') +
      L('M15 19l6-2M29 15h6M43 17l6 2', '#ff5c8a', 3) + m('stone', 'M24 42h7v3h-7z', 1.2) },
  { id: 32, name: 'Girder Knot', rarity: 'rare',
    d: m('rust', 'M16 22l6-6 26 26-6 6z') + m('steel', 'M42 16l6 6-26 26-6-6z') +
      L('M21 23l3-3M40 44l3-3', J.rust, 1.6) + mc('gold', 32, 32, 3, 1.2) },
  { id: 33, name: 'Boilerplate Screen', rarity: 'rare',
    d: m('metal', 'M18 16h28a3 3 0 0 1 3 3v26a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V19a3 3 0 0 1 3-3z') +
      C(32, 32, 8, '#1a1f2a', 1, '#fff8e6') + L('M32 32l5-5', '#ff5c8a', 2.4) + dot(32, 32, 1.4, '#ff5c8a') +
      dots([[20, 21], [44, 21], [20, 43], [44, 43]], 2, Y) },
  { id: 34, name: 'Anchored Boulders', rarity: 'rare',
    d: m('stone', 'M17 40l3-13 12-7 12 5 4 13-9 8H25z') + m('plant', 'M22 29c2-3 6-4 9-3-2 3-6 4-9 3z', 1) +
      L('M14 34c10-5 26-5 36 0', '#d6e0ee', 2.4) + L('M14 34l-1 13M50 34l1 13', '#ecb57a', 3) +
      dots([[14, 34], [50, 34]], 1.8, Y) },
  { id: 35, name: 'Gabion Nets', rarity: 'rare',
    d: fillOnly('dark', 'M15 18h34v30H15z') + m('stoneAlt', 'M18 26l2-5 6-1 3 4-2 5-6 1z', 1.6) +
      m('stone', 'M21 44l2-7 7-2 5 4-1 6z', 1.6) + m('stone', 'M33 33l1-6 6-2 4 4-2 6-6 1z', 1.6) +
      L('M15 28l10-10M15 38l20-20M15 48l30-30M25 48l24-24M35 48l14-14', '#cfdaea', 1.4) +
      L('M17 18h30a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H17a2 2 0 0 1-2-2V20a2 2 0 0 1 2-2z', '#d6e0ee') },
  { id: 36, name: 'Tripwire Web', rarity: 'epic',
    d: L('M14 18l36 28M50 18L14 46M32 14v36', '#d6e0ee', 1.8) + L('M23 25h18l5 7-5 7H23l-5-7z', '#ff5c8a', 2.4) +
      mc('gold', 32, 32, 3, 1.2) + [[14, 18], [50, 18], [14, 46], [50, 46]].map(([x, y]) => mc('metal', x, y, 2.6, 1.4)).join('') },
  { id: 67, name: 'Fence Post Row', rarity: 'common',
    d: m('wood', 'M15 48V24l3-5 3 5v24z', 1.8) + m('woodAlt', 'M25 48V24l3-5 3 5v24z', 1.8) +
      m('wood', 'M35 48V24l3-5 3 5v24z', 1.8) + m('woodAlt', 'M45 48V24l3-5 3 5v24z', 1.8) +
      L('M13 30h38M13 41h38', '#d6e0ee', 1.8) + dots([[23, 30], [33, 30], [43, 30], [23, 41], [33, 41], [43, 41]], 1.3, '#ff5c8a') },
  { id: 68, name: 'Car Door Line', rarity: 'common',
    d: m('rust', 'M16 30l8-12h20l4 12v18H16z') + m('glass', 'M21 30l6-8h13l3 8z', 1.6) +
      L('M16 38h32', J.rust, 1.6) + L('M31 37h8', '#d6e0ee', 2.6) },
  { id: 69, name: 'Headstone Line', rarity: 'rare',
    d: m('stone', 'M13 48V33a6 6 0 0 1 12 0v15z') + m('stoneAlt', 'M26 48V25a6 6 0 0 1 12 0v23z') +
      m('stone', 'M39 48V33a6 6 0 0 1 12 0v15z') + L('M32 26v9M28 29.5h8M16 37h6M42 37h6', '#5a4a3a', 1.8) +
      m('dirt', 'M10 48h44l-2 3H12z', 1.6) + m('plant', 'M13 47c0-3 2-5 4-5 0 3-2 5-4 5z', 1) },
  { id: 70, name: 'Bolted Panel', rarity: 'epic',
    d: m('metal', 'M20 16h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4z') +
      fillOnly('rust', 'M33 17h11a3 3 0 0 1 3 3v11H33z') + fillOnly('rust', 'M17 33h14v14H20a3 3 0 0 1-3-3z') +
      L('M16 32h32M32 16v32', J.metal, 2) +
      [[24, 24], [40, 24], [24, 40], [40, 40]].map(([x, y]) => mc('gold', x, y, 3, 1.2)).join('') },
  { id: 71, name: 'Patchwork Screen', rarity: 'rare',
    d: m('metal', 'M15 17h16v14H15z', 1.8) + m('rust', 'M31 17h18v22H31z', 1.8) +
      m('wood', 'M15 31h16v17H15z', 1.8) + m('cloth', 'M31 39h18v9H31z', 1.8) +
      L('M18 35h10M18 40h10M18 45h10', J.wood, 1.2) + dots([[18, 20], [28, 20], [34, 20], [46, 20]], 1.3, Y) },
  { id: 72, name: 'Felled Tree Line', rarity: 'epic',
    d: L('M25 36l-6-14M35 32l2-13M31 25l6-3', '#ecb57a', 2.4) +
      m('plant', 'M15 23c0-4 3-6 6-5 0 4-3 6-6 5z', 1.2) + m('plant', 'M34 18c0-4 3-6 6-5 0 4-3 6-6 5z', 1.2) +
      m('wood', 'M13 40l33-12 4 9-33 12z') + C(48, 32.5, 2.5, '#ecb57a', 1, '#ffd9a8', 1.6) + L('M48 31.5v2', J.wood, 1.2) },
  { id: 73, name: 'Wrecked Bus Wall', rarity: 'epic',
    d: m('bus', 'M16 21h32a3 3 0 0 1 3 3v15a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V24a3 3 0 0 1 3-3z') +
      m('glass', 'M18 26h7v7h-7z', 1.4) + m('glass', 'M28 26h7v7h-7z', 1.4) + m('glass', 'M39 26h7v7h-7z', 1.4) +
      L('M36 21l-3 8 4 4-3 9', '#3a2a10', 2) + L('M14 37h36', '#a87810', 1.4) +
      mc('dark', 22, 44, 4, 1.8) + mc('dark', 42, 44, 4, 1.8) + dots([[22, 44], [42, 44]], 1.3, Y) },
  { id: 97, name: 'Rivet Strip', rarity: 'common',
    d: L('M18 39v5M32 39v7M46 39v4', '#ffa86a', 1.8) + m('metal', 'M12 25h40v14H12z') + L('M12 29h40', '#a9bbd0', 1.4) +
      [18, 25, 32, 39, 46].map((x) => mc('steel', x, 34, 2.2, 1.2)).join('') },
  { id: 98, name: 'Tarp Curtain', rarity: 'common',
    d: m('tarp', 'M16 18v28q4 4 8 0t8 0 8 0 8 0V18z') + L('M24 18v22M32 18v24M40 18v22', J.tarp, 1.8) +
      L('M13 18h38', '#d6e0ee', 2.6) + dots([[16, 18], [24, 18], [32, 18], [40, 18], [48, 18]], 1.6, Y) },
  { id: 99, name: 'Seedling Palisade', rarity: 'epic',
    d: m('wood', 'M13 48V24l3-5 3 5v24z', 1.8) + m('wood', 'M45 48V24l3-5 3 5v24z', 1.8) +
      L('M32 47V28', '#8dffb8', 2.4) + m('plant', 'M32 35c-6 0-9-4-9-10 6 0 9 4 9 10z', 1.6) +
      m('plant', 'M32 30c0-7 3-11 9-11 0 7-3 11-9 11z', 1.6) + m('dirt', 'M22 49c2-4 18-4 20 0z', 1.6) },
  { id: 100, name: 'Late Bloomer', rarity: 'epic',
    d: L('M32 50V34', '#8dffb8', 2.4) + m('plant', 'M32 45c-4 0-7-2-8-6 4 0 7 2 8 6z', 1.4) +
      m('plant', 'M32 45c4 0 7-2 8-6-4 0-7 2-8 6z', 1.4) +
      [[24, 24], [40, 24], [32, 16], [32, 32]].map(([x, y]) => mc('flower', x, y, 6, 1.8)).join('') + mc('gold', 32, 24, 3.5, 1.2) },
  { id: 101, name: 'School', rarity: 'rare',
    d: m('rust', 'M13 23v25c6-2 13-1 19 3 6-4 13-5 19-3V23', 2) +
      m('paper', 'M32 24c-6-5-12-5-17-3v24c5-2 11-2 17 3z', 1.8) + m('paper', 'M32 24c6-5 12-5 17-3v24c-5-2-11-2-17 3z', 1.8) +
      L('M19 28c3-1 6 0 9 1M19 33c3-1 6 0 9 1M19 38c3-1 6 0 9 1M45 28c-3-1-6 0-9 1M45 33c-3-1-6 0-9 1', '#2350b0', 1.6) +
      P('M39 22.5v10l2-1.6 2 1.6V22', '#ff5c8a', 1, '#ffb0cc', 1.2) },
  { id: 102, name: 'Armory', rarity: 'common',
    d: m('metal', 'M32 15l14 5v12c0 9-7 14-14 17-7-3-14-8-14-17V20z') + L('M32 20.5v14', LIGHT, 3.2) +
      L('M26 35h12', Y, 3) + L('M32 36.5v6', '#b47a42', 3) + dot(32, 45, 1.8, Y) },
  { id: 103, name: 'Compound Vault', rarity: 'epic',
    d: mc('metal', 32, 32, 15.5) + C(32, 32, 11.5, 'none', 1, J.metal, 1.6) +
      L('M32 21v22M21 32h22M24.2 24.2l15.6 15.6M39.8 24.2L24.2 39.8', LIGHT, 2.4) + mc('gold', 32, 32, 4, 1.4) +
      [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180;
        return dot(32 + 17.5 * Math.sin(r), 32 - 17.5 * Math.cos(r), 1.7, Y);
      }).join('') },
  { id: 104, name: "Gambler's Gate", rarity: 'common',
    d: m('paper', 'M32 15l16 9-16 9-16-9z', 1.8) + P('M16 24l16 9v18l-16-9z', '#cfc5aa', 1, '#fff8e6', 1.8) +
      P('M48 24l-16 9v18l16-9z', '#b0a68c', 1, '#fff8e6', 1.8) +
      dots([[32, 24], [21, 34], [27, 41], [37, 37], [43, 34], [37, 44], [43, 41]], 1.8, '#ff5c8a') },
  { id: 105, name: 'Militia Drill Yard', rarity: 'epic',
    d: mc('paper', 30, 34, 15) + C(30, 34, 9, '#ff5c8a', 1, '#ffb0cc', 1.6) + mc('gold', 30, 34, 3, 1.2) +
      L('M31 33l17-17', '#ecb57a', 2.4) + L('M43 15h6v6', '#d6e0ee', 2.6) },
  { id: 106, name: 'Night Owl Perch', rarity: 'common',
    d: L('M13 50h38', '#ecb57a', 2.6) + P('M18 18l7 6h14l7-6v20c0 7-7 12-14 12s-14-5-14-12z', '#8a5a2e', 1, '#ecb57a') +
      mc('gold', 25.5, 33, 5, 1.6) + mc('gold', 38.5, 33, 5, 1.6) + dots([[25.5, 33], [38.5, 33]], 2, '#1a0f08') +
      m('fire', 'M32 37l-2 3h4z', 1.2) },
  { id: 107, name: 'Quarry Rig', rarity: 'epic',
    d: m('dirt', 'M14 44h36v4H14z', 1.6) + L('M22 44l10-30 10 30M25 35h14M28 25h8', '#ffa86a', 2.6) +
      L('M32 14v28', LIGHT, 2.4) + m('gold', 'M28 42l4 8 4-8z', 1.4) },
  { id: 108, name: 'Roastery', rarity: 'rare',
    d: `<g transform="translate(0 -3)">${m('rust', 'M16 28h24v14a6 6 0 0 1-6 6H22a6 6 0 0 1-6-6z') +
      P('M17 28h22v4H17z', '#5a3418', 1, '#ffa86a', 1.4) + L('M40 31h4a4 4 0 0 1 0 9h-4', '#ffa86a', 2.6) +
      L('M23 23c-2-3 2-4 0-8M32 23c-2-3 2-4 0-8', LIGHT) + [22, 28, 34].map((x) => flame(x, 56, 1)).join('')}</g>` },
  { id: 109, name: 'Dormitory', rarity: 'common',
    d: L('M14 20v28M50 34v14', '#ecb57a', 3) + m('fabric', 'M14 36h36v8H14z') + m('paper', 'M18 28h13v8H18z', 1.8) +
      L('M36 36v8', '#23306a', 1.4) },
  { id: 110, name: 'Drafting Table', rarity: 'common',
    d: L('M22 36v12M42 30v18', '#ecb57a', 2.6) + m('wood', 'M14 33l36-12v6L14 39z') +
      P('M22 33.6l14-4.7v3.4l-14 4.7z', '#e8e0c8', 1, '#fff8e6', 1.2) +
      m('gold', 'M26 28L36 16l3 2-10 12z', 1.2) + m('danger', 'M34.5 17.8L36 16l3 2-1.5 1.8z', 1.2) +
      P('M26 28l3 2-4 1z', '#ffc79e', 1, '#ffc79e', 1) },
  { id: 111, name: 'Trophy Rack', rarity: 'epic',
    d: L('M22 20h-6v4c0 5 3 7 6 7M42 20h6v4c0 5-3 7-6 7', '#ffe97a', 2.4) + L('M32 39v6', Y, 3) +
      m('gold', 'M22 16h20v12c0 7-4 11-10 11s-10-4-10-11z') + m('wood', 'M24 45h16v4H24z', 1.6) +
      dot(32, 25, 2.4, '#ff5c8a') },
  { id: 112, name: 'Scrap Recycler', rarity: 'epic',
    d: L('M20 22a16 16 0 0 1 24 0', '#d6e0ee', 2.6) + L('M45 15l-1 7h-7', '#d6e0ee', 2.6) +
      L('M49 36a16 16 0 0 1-12 12', '#ffa86a', 2.6) + L('M51 44l-2-8-7 3', '#ffa86a', 2.6) +
      L('M27 48a16 16 0 0 1-12-12', '#8dffb8', 2.6) + L('M13 44l2-8 7 3', '#8dffb8', 2.6) +
      mc('metal', 32, 33, 6) + dot(32, 33, 2, Y) },
  { id: 113, name: 'Carrion Heap', rarity: 'rare',
    d: m('paper', 'M18 28c0-8 6-13 14-13s14 5 14 13c0 5-3 8-5 10v8H23v-8c-2-2-5-5-5-10z') +
      C(26, 30, 4, '#1a0f08', 1, '#fff8e6', 1.4) + C(38, 30, 4, '#1a0f08', 1, '#fff8e6', 1.4) +
      L('M29 46v-6M35 46v-6', '#5a4a3a', 1.8) + m('plant', 'M17 49c0-3 4-4 6-3 2-2 7-2 9 0 2-1 9-2 11 0 2 0 4 1 4 3z', 1.4) },
  { id: 114, name: 'Siege Larder', rarity: 'epic',
    d: m('metal', 'M20 24h24v22a3 3 0 0 1-3 3H23a3 3 0 0 1-3-3z') + m('steel', 'M18 16h28v8H18z') +
      m('paper', 'M20 30h24v13H20z', 1.6) + L('M26 34h12M26 39h12', '#ff5c8a', 2.2) },
  { id: 115, name: 'Siren Decoy', rarity: 'epic',
    d: m('metal', 'M14 27h8v10h-8z') + m('danger', 'M22 27l12-9v28l-12-9z') +
      L('M40 26c3 3 3 9 0 12', Y, 2.6) + L('M45 20c6 6 6 18 0 24', '#ff9f5a', 2.6) },
  { id: 116, name: 'Scavenger Kennel', rarity: 'rare',
    d: m('wood', 'M16 30l16-13 16 13v18H16z') + L('M16 38h10M38 38h10M16 44h10M38 44h10', J.wood, 1.4) +
      P('M26 48V36a6 6 0 0 1 12 0v12z', '#1a0f08', 1, '#ecb57a', 1.8) + L('M13 32l19-16 19 16', '#ffa86a', 3) +
      L('M28.5 26h7', '#fff8e6', 2.2) + dots([[28, 25], [28, 27], [36, 25], [36, 27]], 1.1, '#fff8e6') },
  { id: 117, name: 'Salvage Crane', rarity: 'rare',
    d: L('M12 48h12', '#cfdaea', 3) + L('M18 48V16h29M18 27l11-11', Y, 2.6) + L('M47 16v18', '#d6e0ee', 1.8) +
      m('wood', 'M41 34h12v11H41z', 1.8) + L('M41 34l12 11M53 34L41 45', J.wood, 1.4) },
  { id: 118, name: 'Night Scavengers', rarity: 'epic',
    d: m('gold', 'M44 13a9 9 0 1 0 6 15 8 8 0 0 1-6-15z', 1.6) + mc('cloth', 41, 40, 5.5, 1.8) +
      m('cloak', 'M15 49c0-9 5-14 9-17h8c4 3 9 8 9 17z') + m('cloak', 'M23 32l-2-6h14l-2 6z', 1.8) +
      dots([[26, 29.5], [30, 29.5]], 1.1, Y) },
  { id: 119, name: 'Assembly Line', rarity: 'common',
    d: m('wood', 'M16 24h11v13H16z', 1.8) + m('cloth', 'M31 24h11v13H31z', 1.8) + L('M31 28h11', '#7a5a30', 1.2) +
      m('dark', 'M18 37h28a5 5 0 0 1 5 5a5 5 0 0 1-5 5H18a5 5 0 0 1-5-5a5 5 0 0 1 5-5z') +
      [21, 32, 43].map((x) => mc('steel', x, 42, 2, 1.2)).join('') + L('M45 19l6 6-6 6', Y, 2.6) },
  { id: 120, name: 'Hoist Tower', rarity: 'common',
    d: L('M16 48l16-30 16 30M23 36h18', '#ecb57a', 2.6) + L('M32 24v14', '#ead4a8', 1.8) +
      mc('steel', 32, 19, 5) + dot(32, 19, 1.5, Y) + m('stone', 'M28 38h8v6h-8z', 1.8) },
  { id: 121, name: 'Mentor Hall', rarity: 'common',
    d: L('M16 44h32M14 48h36', '#d2d8e8', 2.6) + L('M20 30v14M32 30v14M44 30v14', '#fff8e6', 3.4) +
      m('rust', 'M14 27l18-11 18 11z') + dot(32, 22.5, 1.8, Y) },
  { id: 122, name: 'Night Classes', rarity: 'epic',
    d: m('gold', 'M46 13a7 7 0 1 0 5 11 6 6 0 0 1-5-11z', 1.6) + m('cloak', 'M20 36v7c6 5 14 5 20 0v-7') +
      m('cloak', 'M30 24L12 32l18 8 18-8z') + L('M30 32l14 3v7', Y, 1.8) + dot(44, 43, 1.8, Y) },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');

for (const b of B) {
  const body = halo(b.d) + b.d;
  const inner = b.rarity === 'epic' ? `<g transform="translate(32 32) scale(0.86) translate(-32 -32)">${body}</g>` : body;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${esc(b.name)}">${FRAMES[b.rarity](b.id)}${inner}</svg>\n`;
  writeFileSync(join(OUT, `${b.id}.svg`), svg);
}
console.log(`${B.length} emblèmes générés dans ${OUT}`);
