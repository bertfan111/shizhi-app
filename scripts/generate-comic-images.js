const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const DATA_PATH = path.join(ROOT, 'assets/data/characters.json');
const IMAGES_DIR = path.join(ROOT, 'assets/images');
const IMAGE_MAP_PATH = path.join(ROOT, 'src/data/imageMap.ts');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const COMICS = {
  天: [
    { bg: '#DBEAFE', figure: 'kid', prop: 'jetpack', mood: 'fly' },
    { bg: '#FDE68A', figure: 'storm', prop: 'lightning', mood: 'danger' },
    { bg: '#DCFCE7', figure: 'kid', prop: 'drone', mood: 'save' },
    { bg: '#E0F2FE', figure: 'sky', prop: 'drone_top', mood: 'word' },
  ],
  地: [
    { bg: '#FDE68A', figure: 'soil', prop: 'moonbase', mood: 'farm' },
    { bg: '#FCA5A5', figure: 'alarm', prop: 'oxygen', mood: 'danger' },
    { bg: '#BBF7D0', figure: 'robotdog', prop: 'patch', mood: 'save' },
    { bg: '#FEF3C7', figure: 'soil_robotdog', prop: 'ground', mood: 'word' },
  ],
  人: [
    { bg: '#E0E7FF', figure: 'dino', prop: 'hoverboard', mood: 'play' },
    { bg: '#FECACA', figure: 'dino', prop: 'fall', mood: 'danger' },
    { bg: '#BFDBFE', figure: 'robot', prop: 'coach', mood: 'save' },
    { bg: '#DCFCE7', figure: 'legs', prop: 'finish', mood: 'word' },
  ],
  你: [
    { bg: '#EDE9FE', figure: 'astronaut', prop: 'maze', mood: 'lost' },
    { bg: '#DBEAFE', figure: 'glowfriend', prop: 'point', mood: 'meet' },
    { bg: '#FDE68A', figure: 'twofriends', prop: 'highfive', mood: 'happy' },
    { bg: '#FCE7F3', figure: 'left_right', prop: 'sparkle', mood: 'word' },
  ],
  我: [
    { bg: '#FEE2E2', figure: 'meteor', prop: 'spaceship', mood: 'danger' },
    { bg: '#DBEAFE', figure: 'hero', prop: 'shield', mood: 'ready' },
    { bg: '#FDE68A', figure: 'hero', prop: 'halberd', mood: 'attack' },
    { bg: '#DCFCE7', figure: 'hero', prop: 'safe_ship', mood: 'word' },
  ],
  他: [
    { bg: '#FFE4E6', figure: 'camper', prop: 'mars', mood: 'search' },
    { bg: '#FDE68A', figure: 'friend', prop: 'crater', mood: 'appear' },
    { bg: '#DBEAFE', figure: 'twofriends', prop: 'teacher', mood: 'team' },
    { bg: '#DCFCE7', figure: 'left_right', prop: 'badge', mood: 'word' },
  ],
  一: [
    { bg: '#E0F2FE', figure: 'timemachine', prop: 'broken', mood: 'oops' },
    { bg: '#FEF3C7', figure: 'stick', prop: 'gold', mood: 'fall' },
    { bg: '#DCFCE7', figure: 'girl', prop: 'hologram', mood: 'wonder' },
    { bg: '#FDE68A', figure: 'single_stick', prop: 'glow', mood: 'word' },
  ],
  二: [
    { bg: '#FEF3C7', figure: 'stick', prop: 'charge', mood: 'start' },
    { bg: '#DBEAFE', figure: 'twosticks', prop: 'portal', mood: 'open' },
    { bg: '#EDE9FE', figure: 'girl', prop: 'count_two', mood: 'happy' },
    { bg: '#FDE68A', figure: 'two_sticks', prop: 'glow', mood: 'word' },
  ],
  三: [
    { bg: '#FDE68A', figure: 'twosticks', prop: 'portal', mood: 'open' },
    { bg: '#DBEAFE', figure: 'thirdstick', prop: 'fall', mood: 'surprise' },
    { bg: '#E0E7FF', figure: 'ladder', prop: 'stars', mood: 'fly' },
    { bg: '#FEF3C7', figure: 'three_sticks', prop: 'glow', mood: 'word' },
  ],
  四: [
    { bg: '#E0F2FE', figure: 'box', prop: 'hover', mood: 'start' },
    { bg: '#FDE68A', figure: 'baby', prop: 'spacesuit', mood: 'jump' },
    { bg: '#DBEAFE', figure: 'box_baby', prop: 'launch', mood: 'fly' },
    { bg: '#DCFCE7', figure: 'four_corners', prop: 'glow', mood: 'word' },
  ],
};

function shape(kind, x, y, scale = 1) {
  const c = {
    skin: '#FDBA74',
    hair: '#7C2D12',
    body: '#60A5FA',
    accent: '#F59E0B',
    red: '#EF4444',
    green: '#22C55E',
    purple: '#8B5CF6',
    line: '#374151',
  };
  const s = scale;
  const person = `
    <circle cx="${x}" cy="${y - 42*s}" r="${22*s}" fill="${c.skin}" stroke="${c.line}" stroke-width="${3*s}"/>
    <path d="M${x - 16*s} ${y - 52*s} Q${x} ${y - 78*s} ${x + 16*s} ${y - 52*s}" fill="${c.hair}"/>
    <rect x="${x - 20*s}" y="${y - 18*s}" width="${40*s}" height="${48*s}" rx="${14*s}" fill="${c.body}" stroke="${c.line}" stroke-width="${3*s}"/>
    <line x1="${x - 20*s}" y1="${y - 4*s}" x2="${x - 46*s}" y2="${y + 14*s}" stroke="${c.line}" stroke-width="${5*s}" stroke-linecap="round"/>
    <line x1="${x + 20*s}" y1="${y - 4*s}" x2="${x + 46*s}" y2="${y + 14*s}" stroke="${c.line}" stroke-width="${5*s}" stroke-linecap="round"/>
    <line x1="${x - 10*s}" y1="${y + 30*s}" x2="${x - 28*s}" y2="${y + 68*s}" stroke="${c.line}" stroke-width="${6*s}" stroke-linecap="round"/>
    <line x1="${x + 10*s}" y1="${y + 30*s}" x2="${x + 28*s}" y2="${y + 68*s}" stroke="${c.line}" stroke-width="${6*s}" stroke-linecap="round"/>
    <circle cx="${x - 7*s}" cy="${y - 45*s}" r="${2.5*s}" fill="${c.line}"/><circle cx="${x + 7*s}" cy="${y - 45*s}" r="${2.5*s}" fill="${c.line}"/>
    <path d="M${x - 8*s} ${y - 34*s} Q${x} ${y - 26*s} ${x + 8*s} ${y - 34*s}" fill="none" stroke="${c.line}" stroke-width="${2.5*s}" stroke-linecap="round"/>
  `;
  const drone = `
    <rect x="${x - 34*s}" y="${y - 12*s}" width="${68*s}" height="${24*s}" rx="${12*s}" fill="#93C5FD" stroke="${c.line}" stroke-width="${3*s}"/>
    <circle cx="${x - 54*s}" cy="${y}" r="${16*s}" fill="#BFDBFE" stroke="${c.line}" stroke-width="${3*s}"/>
    <circle cx="${x + 54*s}" cy="${y}" r="${16*s}" fill="#BFDBFE" stroke="${c.line}" stroke-width="${3*s}"/>
    <line x1="${x - 54*s}" y1="${y - 16*s}" x2="${x - 54*s}" y2="${y + 16*s}" stroke="${c.line}" stroke-width="${2*s}"/>
    <line x1="${x + 54*s}" y1="${y - 16*s}" x2="${x + 54*s}" y2="${y + 16*s}" stroke="${c.line}" stroke-width="${2*s}"/>
  `;
  if (kind.includes('kid') || kind.includes('astronaut') || kind.includes('girl') || kind.includes('hero') || kind.includes('camper')) return person;
  if (kind.includes('drone') || kind.includes('bird')) return drone;
  if (kind.includes('storm') || kind.includes('meteor') || kind.includes('alarm')) return `
    <path d="M${x-40*s} ${y-60*s} L${x+5*s} ${y-10*s} L${x-10*s} ${y-5*s} L${x+45*s} ${y+60*s} L${x-5*s} ${y+10*s} L${x+10*s} ${y+5*s} Z" fill="#FBBF24" stroke="${c.red}" stroke-width="${4*s}"/>
    <circle cx="${x+42*s}" cy="${y-28*s}" r="${18*s}" fill="${c.red}" opacity=".85"/>
  `;
  if (kind.includes('soil')) return `
    <ellipse cx="${x}" cy="${y+38*s}" rx="${72*s}" ry="${28*s}" fill="#A16207"/>
    <circle cx="${x-28*s}" cy="${y}" r="${34*s}" fill="#D97706" stroke="${c.line}" stroke-width="${3*s}"/>
    <circle cx="${x-40*s}" cy="${y-8*s}" r="${4*s}" fill="${c.line}"/><circle cx="${x-16*s}" cy="${y-8*s}" r="${4*s}" fill="${c.line}"/>
    <path d="M${x-42*s} ${y+14*s} Q${x-28*s} ${y+24*s} ${x-14*s} ${y+14*s}" fill="none" stroke="${c.line}" stroke-width="${3*s}"/>
  `;
  if (kind.includes('robotdog')) return `
    <rect x="${x-55*s}" y="${y-8*s}" width="${80*s}" height="${40*s}" rx="${16*s}" fill="#A7F3D0" stroke="${c.line}" stroke-width="${3*s}"/>
    <circle cx="${x+44*s}" cy="${y-16*s}" r="${22*s}" fill="#BBF7D0" stroke="${c.line}" stroke-width="${3*s}"/>
    <line x1="${x-38*s}" y1="${y+32*s}" x2="${x-52*s}" y2="${y+62*s}" stroke="${c.line}" stroke-width="${5*s}" stroke-linecap="round"/>
    <line x1="${x+12*s}" y1="${y+32*s}" x2="${x+26*s}" y2="${y+62*s}" stroke="${c.line}" stroke-width="${5*s}" stroke-linecap="round"/>
  `;
  if (kind.includes('dino')) return `
    <ellipse cx="${x}" cy="${y}" rx="${62*s}" ry="${42*s}" fill="#86EFAC" stroke="${c.line}" stroke-width="${3*s}"/>
    <circle cx="${x+54*s}" cy="${y-24*s}" r="${28*s}" fill="#BBF7D0" stroke="${c.line}" stroke-width="${3*s}"/>
    <path d="M${x-56*s} ${y-18*s} L${x-92*s} ${y-42*s} L${x-78*s} ${y+8*s} Z" fill="#86EFAC" stroke="${c.line}" stroke-width="${3*s}"/>
  `;
  if (kind.includes('stick') || kind.includes('ladder')) return `
    <rect x="${x-76*s}" y="${y-36*s}" width="${152*s}" height="${18*s}" rx="${9*s}" fill="#FBBF24" stroke="${c.line}" stroke-width="${3*s}"/>
    ${kind.includes('two') || kind.includes('ladder') || kind.includes('three') ? `<rect x="${x-66*s}" y="${y}" width="${132*s}" height="${18*s}" rx="${9*s}" fill="#60A5FA" stroke="${c.line}" stroke-width="${3*s}"/>` : ''}
    ${kind.includes('third') || kind.includes('ladder') || kind.includes('three') ? `<rect x="${x-56*s}" y="${y+36*s}" width="${112*s}" height="${18*s}" rx="${9*s}" fill="#FB7185" stroke="${c.line}" stroke-width="${3*s}"/>` : ''}
  `;
  if (kind.includes('box') || kind.includes('four')) return `
    <rect x="${x-70*s}" y="${y-70*s}" width="${140*s}" height="${140*s}" rx="${20*s}" fill="#BFDBFE" stroke="${c.line}" stroke-width="${4*s}"/>
    <line x1="${x}" y1="${y-70*s}" x2="${x}" y2="${y+70*s}" stroke="#60A5FA" stroke-width="${4*s}"/>
    <line x1="${x-70*s}" y1="${y}" x2="${x+70*s}" y2="${y}" stroke="#60A5FA" stroke-width="${4*s}"/>
    ${person.replaceAll(String(x), String(x)).replaceAll(String(y), String(y+20*s)).replace(/scale\\(1\\)/g, '')}
  `;
  if (kind.includes('left_right') || kind.includes('twofriends')) return `
    ${shape('kid', x-44*s, y+10*s, 0.55)}
    ${shape('kid', x+44*s, y+10*s, 0.55)}
  `;
  return person;
}

function panelSvg(panel, i, char) {
  const x = 128;
  const y = 150;
  const cloud = `<ellipse cx="52" cy="48" rx="32" ry="18" fill="#fff" opacity=".75"/><ellipse cx="86" cy="42" rx="38" ry="22" fill="#fff" opacity=".75"/>`;
  const stars = `<circle cx="210" cy="52" r="5" fill="#FBBF24"/><circle cx="198" cy="84" r="3" fill="#FBBF24"/><circle cx="225" cy="105" r="4" fill="#FBBF24"/>`;
  return `
    <g transform="translate(${(i % 2) * 256}, ${Math.floor(i / 2) * 256})">
      <rect x="10" y="10" width="236" height="236" rx="22" fill="${panel.bg}" stroke="#fff" stroke-width="8"/>
      ${cloud}${stars}
      ${shape(panel.figure, x, y, 0.8)}
      <circle cx="220" cy="220" r="14" fill="#fff" opacity=".8"/>
      <circle cx="220" cy="220" r="8" fill="#F59E0B" opacity=".85"/>
    </g>
  `;
}

async function createComic(char, panels) {
  const svg = `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="34" fill="#FFFBEB"/>
      ${panels.map((p, i) => panelSvg(p, i, char)).join('')}
      <line x1="256" y1="18" x2="256" y2="494" stroke="#fff" stroke-width="10"/>
      <line x1="18" y1="256" x2="494" y2="256" stroke="#fff" stroke-width="10"/>
    </svg>
  `;
  await sharp(Buffer.from(svg)).png().toFile(path.join(IMAGES_DIR, `${char}.png`));
  console.log(`✅ Comic generated: ${char}.png`);
}

function writeImageMap(ds) {
  const lines = [
    '/** * 自动生成映射表 */',
    '// eslint-disable-next-line @typescript-eslint/no-explicit-any',
    'const map: Record<string, any> = {',
  ];
  ds.characters.forEach((c) => {
    const imagePath = path.join(IMAGES_DIR, c.image || '');
    if (c.image && fs.existsSync(imagePath) && fs.statSync(imagePath).size > 1000) {
      lines.push(`  '${c.char}': require('../../assets/images/${c.image}'),`);
    }
  });
  lines.push('};');
  lines.push('export function getImageFor(char: string): any | null { return map[char] ?? null; }');
  lines.push('export function hasImageFor(char: string): boolean { return Boolean(map[char]); }');
  fs.writeFileSync(IMAGE_MAP_PATH, lines.join('\\n'), 'utf8');
}

async function main() {
  const ds = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  for (const [char, panels] of Object.entries(COMICS)) {
    await createComic(char, panels);
    const item = ds.characters.find((c) => c.char === char);
    if (item) item.image = `${char}.png`;
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(ds, null, 2), 'utf8');
  writeImageMap(ds);
  console.log('🎉 前 10 个四宫格连环画已生成并集成。');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
