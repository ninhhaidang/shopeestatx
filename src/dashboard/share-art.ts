// The share image's artworks: colours, how figures sit, and the doodles each one is decorated with.
// Doodles are drawn as shapes (never emoji or text), so every artwork looks the same on every computer
// and the image keeps to its few aggregate strings.

export type ShareTemplate =
  | 'label' | 'bold' | 'night' | 'sale' | 'voucher' | 'coins' | 'parcel'
  | 'candy' | 'sky' | 'cat' | 'matcha' | 'tet' | 'receipt' | 'neon' | 'minimal';

export const SHARE_TEMPLATES: ShareTemplate[] = [
  'label', 'bold', 'night', 'sale', 'voucher', 'coins', 'parcel', 'candy', 'sky', 'cat', 'matcha', 'tet', 'receipt', 'neon', 'minimal',
];

export const ORANGE = '#ee4d2d';

type Ctx = CanvasRenderingContext2D;

export interface Look {
  bg: string;
  fg: string;
  muted: string;
  brand: string;
  bars: string;
  rule: string;
  /**
   * How a figure sits: an outlined box, a rule (solid or dashed) above it, or a filled card,
   * optionally with a dashed border and voucher notches (circles in the background colour) on its sides.
   */
  cell: 'box' | 'rule' | 'dashed' | { fill: string; radius: number; border?: string; notch?: string };
  /** A glow behind the net spend. */
  glow?: string;
  /** Painted over the plain background, before the content: gradients, paper, doodles in the margins. */
  backdrop?: (ctx: Ctx, W: number, H: number, u: number) => void;
  /** A doodle for the free square at the right end of the QR footer. */
  mascot?: (ctx: Ctx, x: number, y: number, s: number) => void;
}

// ---- Doodles. (x, y) is the centre unless a name says otherwise; s or r is the size. ----

function heart(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.4);
  ctx.bezierCurveTo(x - s * 0.7, y - s * 0.05, x - s * 0.35, y - s * 0.62, x, y - s * 0.22);
  ctx.bezierCurveTo(x + s * 0.35, y - s * 0.62, x + s * 0.7, y - s * 0.05, x, y + s * 0.4);
  ctx.fill();
}

/** A four-point twinkle. */
function sparkle(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function circle(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function cloud(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  circle(ctx, x, y, s * 0.42, color);
  circle(ctx, x + s * 0.42, y + s * 0.12, s * 0.32, color);
  circle(ctx, x - s * 0.42, y + s * 0.14, s * 0.28, color);
  ctx.beginPath();
  ctx.roundRect(x - s * 0.7, y + s * 0.05, s * 1.4, s * 0.38, s * 0.19);
  ctx.fill();
}

function paw(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y + s * 0.15, s * 0.32, s * 0.26, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const [dx, dy] of [[-0.36, -0.16], [-0.13, -0.38], [0.13, -0.38], [0.36, -0.16]]) circle(ctx, x + dx * s, y + dy * s, s * 0.12, color);
}

function leaf(ctx: Ctx, x: number, y: number, len: number, angle: number, color: string, vein: string): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, len / 2, len / 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = vein;
  ctx.lineWidth = Math.max(1, len / 30);
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2.4, 0);
  ctx.stroke();
  ctx.restore();
}

/** Hoa mai: five round petals and a centre. */
function blossom(ctx: Ctx, x: number, y: number, r: number, petal: string, centre: string): void {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    circle(ctx, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.48, petal);
  }
  circle(ctx, x, y, r * 0.3, centre);
}

function cat(ctx: Ctx, x: number, y: number, s: number): void {
  const fur = '#f4a259';
  const dark = '#3b2a1e';
  const pink = '#f7a1b5';
  const cx = x + s / 2;
  const cy = y + s * 0.6;
  const r = s * 0.36;
  // Ears, then the head over them.
  ctx.fillStyle = fur;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * r * 0.95, cy - r * 0.2);
    ctx.lineTo(cx + side * r * 0.75, cy - r * 1.25);
    ctx.lineTo(cx + side * r * 0.15, cy - r * 0.75);
    ctx.fill();
  }
  ctx.fillStyle = pink;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + side * r * 0.78, cy - r * 0.45);
    ctx.lineTo(cx + side * r * 0.7, cy - r * 1.02);
    ctx.lineTo(cx + side * r * 0.35, cy - r * 0.72);
    ctx.fill();
  }
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 1.05, r * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
  for (const side of [-1, 1]) {
    circle(ctx, cx + side * r * 0.4, cy - r * 0.08, r * 0.13, dark);
    circle(ctx, cx + side * r * 0.36, cy - r * 0.13, r * 0.045, '#ffffff');
    circle(ctx, cx + side * r * 0.62, cy + r * 0.25, r * 0.13, 'rgba(247,120,150,0.55)');
  }
  ctx.fillStyle = pink;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.09, cy + r * 0.12);
  ctx.lineTo(cx + r * 0.09, cy + r * 0.12);
  ctx.lineTo(cx, cy + r * 0.23);
  ctx.fill();
  ctx.strokeStyle = dark;
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx - r * 0.1, cy + r * 0.26, r * 0.1, 0, Math.PI);
  ctx.arc(cx + r * 0.1, cy + r * 0.26, r * 0.1, 0, Math.PI);
  ctx.stroke();
  for (const side of [-1, 1]) {
    for (const dy of [0.12, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(cx + side * r * 0.55, cy + r * dy);
      ctx.lineTo(cx + side * r * 1.3, cy + r * (dy * 1.6 - 0.12));
      ctx.stroke();
    }
  }
}

function sun(ctx: Ctx, x: number, y: number, s: number): void {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const r = s * 0.27;
  ctx.strokeStyle = '#ffc93c';
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 1.3, cy + Math.sin(a) * r * 1.3);
    ctx.lineTo(cx + Math.cos(a) * r * 1.65, cy + Math.sin(a) * r * 1.65);
    ctx.stroke();
  }
  circle(ctx, cx, cy, r, '#ffd84d');
  circle(ctx, cx - r * 0.35, cy - r * 0.1, r * 0.1, '#5b3a1a');
  circle(ctx, cx + r * 0.35, cy - r * 0.1, r * 0.1, '#5b3a1a');
  circle(ctx, cx - r * 0.55, cy + r * 0.25, r * 0.13, 'rgba(255,130,110,0.6)');
  circle(ctx, cx + r * 0.55, cy + r * 0.25, r * 0.13, 'rgba(255,130,110,0.6)');
  ctx.strokeStyle = '#5b3a1a';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.arc(cx, cy + r * 0.12, r * 0.28, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
}

/** A tea bowl of matcha with latte-art heart and steam. */
function matchaCup(ctx: Ctx, x: number, y: number, s: number): void {
  const cx = x + s / 2;
  const top = y + s * 0.42;
  const w = s * 0.86;
  ctx.strokeStyle = '#9db88a';
  ctx.lineWidth = s * 0.04;
  ctx.lineCap = 'round';
  for (const dx of [-0.14, 0.02, 0.18]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx * s, top - s * 0.08);
    ctx.bezierCurveTo(cx + dx * s - s * 0.07, top - s * 0.17, cx + dx * s + s * 0.07, top - s * 0.25, cx + dx * s, top - s * 0.36);
    ctx.stroke();
  }
  // Bowl, then a foot under it.
  ctx.fillStyle = '#d9b48f';
  ctx.beginPath();
  ctx.roundRect(cx - w * 0.2, top + s * 0.42, w * 0.4, s * 0.08, s * 0.03);
  ctx.fill();
  ctx.fillStyle = '#e8c9a6';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, top);
  ctx.bezierCurveTo(cx - w / 2, top + s * 0.55, cx + w / 2, top + s * 0.55, cx + w / 2, top);
  ctx.fill();
  ctx.fillStyle = '#6fa046';
  ctx.beginPath();
  ctx.ellipse(cx, top, w / 2, s * 0.09, 0, 0, Math.PI * 2);
  ctx.fill();
  heart(ctx, cx, top + s * 0.01, s * 0.16, '#e3f1d3');
}

/** A red "đã thanh toán" style stamp: two rings and a tick, slightly turned. */
function stamp(ctx: Ctx, x: number, y: number, s: number): void {
  const cx = x + s / 2;
  const cy = y + s / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.25);
  ctx.strokeStyle = 'rgba(214,40,40,0.85)';
  ctx.lineWidth = s * 0.05;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = s * 0.02;
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.34, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = s * 0.07;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-s * 0.16, 0);
  ctx.lineTo(-s * 0.04, s * 0.12);
  ctx.lineTo(s * 0.18, -s * 0.12);
  ctx.stroke();
  ctx.restore();
}

/** A gold coin with a square hole, the kind hung on a Tết tree. */
function coin(ctx: Ctx, x: number, y: number, s: number): void {
  const cx = x + s * 0.42;
  const cy = y + s * 0.55;
  const r = s * 0.3;
  circle(ctx, cx, cy, r, '#ffd15c');
  ctx.strokeStyle = '#c98a12';
  ctx.lineWidth = r * 0.08;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#b8121e';
  ctx.fillRect(cx - r * 0.22, cy - r * 0.22, r * 0.44, r * 0.44);
  blossom(ctx, x + s * 0.78, y + s * 0.25, s * 0.17, '#ffd15c', '#e8590c');
}

function twinkles(ctx: Ctx, x: number, y: number, s: number): void {
  sparkle(ctx, x + s * 0.45, y + s * 0.5, s * 0.36, '#3ee8ff');
  sparkle(ctx, x + s * 0.82, y + s * 0.2, s * 0.14, '#ff4fd8');
  sparkle(ctx, x + s * 0.85, y + s * 0.82, s * 0.1, '#ffffff');
}

/** A five-point star. */
function star(ctx: Ctx, x: number, y: number, r: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const d = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}

function bolt(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [dx, dy] of [[0.12, -0.5], [-0.28, 0.06], [-0.02, 0.06], [-0.14, 0.5], [0.28, -0.1], [0.02, -0.1]]) ctx.lineTo(x + dx * s, y + dy * s);
  ctx.closePath();
  ctx.fill();
}

function confetti(ctx: Ctx, x: number, y: number, s: number, color: string, turn: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle = color;
  ctx.fillRect(-s * 0.4, -s * 0.15, s * 0.8, s * 0.3);
  ctx.restore();
}

/** A plain shopping bag (no logo). */
function bag(ctx: Ctx, x: number, y: number, s: number, body: string, handle: string): void {
  ctx.strokeStyle = handle;
  ctx.lineWidth = s * 0.07;
  ctx.beginPath();
  ctx.arc(x, y - s * 0.18, s * 0.2, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - s * 0.4, y - s * 0.2);
  ctx.lineTo(x + s * 0.4, y - s * 0.2);
  ctx.lineTo(x + s * 0.46, y + s * 0.45);
  ctx.lineTo(x - s * 0.46, y + s * 0.45);
  ctx.closePath();
  ctx.fill();
}

/** A % sign made of shapes. */
function percent(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + s * 0.32, y - s * 0.38);
  ctx.lineTo(x - s * 0.32, y + s * 0.38);
  ctx.stroke();
  ctx.lineWidth = s * 0.1;
  for (const [dx, dy] of [[-0.24, -0.24], [0.24, 0.24]]) {
    ctx.beginPath();
    ctx.arc(x + dx * s, y + dy * s, s * 0.14, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** A voucher ticket: notched sides, a dashed tear line, a % on the stub. */
function ticket(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, ink: string, ground: string, turn = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, h * 0.12);
  ctx.fill();
  circle(ctx, -w / 2, 0, h * 0.16, ground);
  circle(ctx, w / 2, 0, h * 0.16, ground);
  ctx.strokeStyle = ink;
  ctx.lineWidth = h * 0.04;
  ctx.setLineDash([h * 0.08, h * 0.07]);
  ctx.beginPath();
  ctx.moveTo(-w / 2 + w * 0.36, -h * 0.38);
  ctx.lineTo(-w / 2 + w * 0.36, h * 0.38);
  ctx.stroke();
  ctx.setLineDash([]);
  percent(ctx, -w / 2 + w * 0.18, 0, h * 0.42, ink);
  ctx.fillStyle = ink;
  for (const [dy, len] of [[-0.14, 0.42], [0.1, 0.3]]) ctx.fillRect(-w / 2 + w * 0.46, dy * h, w * len, h * 0.09);
  ctx.restore();
}

/** A gold coin with a star, the in-app kind. */
function starCoin(ctx: Ctx, x: number, y: number, r: number): void {
  circle(ctx, x, y, r, '#ffc233');
  ctx.strokeStyle = '#e09a00';
  ctx.lineWidth = r * 0.12;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  star(ctx, x, y, r * 0.48, '#fff1b8');
}

function coinStack(ctx: Ctx, x: number, y: number, s: number): void {
  const cx = x + s * 0.38;
  for (let i = 0; i < 4; i++) {
    const cy = y + s * (0.8 - i * 0.11);
    ctx.fillStyle = '#e09a00';
    ctx.beginPath();
    ctx.ellipse(cx, cy + s * 0.04, s * 0.28, s * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffc233';
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.28, s * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  starCoin(ctx, x + s * 0.74, y + s * 0.5, s * 0.22);
}

/** A cardboard parcel, taped, with a heart sticker. */
function parcel(ctx: Ctx, x: number, y: number, s: number): void {
  const l = x + s * 0.1;
  const t = y + s * 0.3;
  const w = s * 0.62;
  const h = s * 0.55;
  const d = s * 0.2;
  ctx.fillStyle = '#c48b52';
  ctx.beginPath();
  ctx.moveTo(l, t);
  ctx.lineTo(l + d, t - d * 0.7);
  ctx.lineTo(l + w + d, t - d * 0.7);
  ctx.lineTo(l + w, t);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a8713d';
  ctx.beginPath();
  ctx.moveTo(l + w, t);
  ctx.lineTo(l + w + d, t - d * 0.7);
  ctx.lineTo(l + w + d, t + h - d * 0.7);
  ctx.lineTo(l + w, t + h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d9a066';
  ctx.fillRect(l, t, w, h);
  ctx.fillStyle = 'rgba(255,248,230,0.75)';
  ctx.fillRect(l + w * 0.42, t, w * 0.16, h);
  heart(ctx, l + w * 0.22, t + h * 0.62, s * 0.16, ORANGE);
}

/** "This side up": two arrows over a bar. */
function upArrows(ctx: Ctx, x: number, y: number, s: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const dx of [-0.2, 0.2]) {
    ctx.beginPath();
    ctx.moveTo(x + dx * s, y + s * 0.3);
    ctx.lineTo(x + dx * s, y - s * 0.3);
    ctx.moveTo(x + dx * s - s * 0.14, y - s * 0.14);
    ctx.lineTo(x + dx * s, y - s * 0.3);
    ctx.lineTo(x + dx * s + s * 0.14, y - s * 0.14);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.fillRect(x - s * 0.36, y + s * 0.38, s * 0.72, s * 0.08);
}

/** Doodles scattered round the edges, clear of the content column. */
function corners(W: number, H: number, u: number, draw: (x: number, y: number, s: number, i: number) => void): void {
  const m = 34 * u;
  [[m, m * 1.1, 40], [W - m, H * 0.36, 34], [m * 0.9, H * 0.62, 30], [W - m * 1.1, H - m * 1.2, 40], [W * 0.55, m * 0.8, 26]].forEach(([x, y, s], i) =>
    draw(x, y, s * u, i),
  );
}

export const LOOKS: Record<ShareTemplate, Look> = {
  // "Vận đơn": the parcel label every Shopee order arrives with (its frame is drawn by the layout).
  label: { bg: '#ffffff', fg: '#14171c', muted: '#5b6470', brand: '#ffffff', bars: '#14171c', rule: '#14171c', cell: 'box' },
  bold: { bg: ORANGE, fg: '#ffffff', muted: 'rgba(255,255,255,0.82)', brand: '#ffffff', bars: 'rgba(255,255,255,0.34)', rule: 'rgba(255,255,255,0.45)', cell: 'rule' },
  night: { bg: '#14171c', fg: '#f5f6f8', muted: '#9aa3af', brand: '#ff6a4d', bars: '#ff6a4d', rule: '#2b3038', cell: { fill: '#1e2229', radius: 22 } },
  // Shopee-flavoured artworks: sale days, vouchers, coins, parcels. Generic shapes only, never Shopee's logo or marks.
  sale: {
    bg: '#ff5722', fg: '#ffffff', muted: 'rgba(255,255,255,0.86)', brand: '#fff3b0', bars: '#fff3b0', rule: 'rgba(255,255,255,0.4)', cell: { fill: 'rgba(255,255,255,0.16)', radius: 22 },
    backdrop: (ctx, W, H, u) => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#ff3d1f');
      g.addColorStop(1, '#ff9a1f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      const colors = ['#fff3b0', '#ffffff', '#ffd23f', '#ffb3a1'];
      corners(W, H, u, (x, y, s, i) => (i % 2 ? bolt(ctx, x, y, s * 1.6, '#fff3b0') : confetti(ctx, x, y, s, colors[i % 4], i)));
      for (let i = 0; i < 6; i++) confetti(ctx, W * (0.1 + i * 0.16), (i % 2 ? 14 : 30) * u, 18 * u, colors[i % 4], i * 0.9);
    },
    mascot: (ctx, x, y, s) => {
      bag(ctx, x + s * 0.45, y + s * 0.5, s * 0.8, '#ffffff', '#fff3b0');
      bolt(ctx, x + s * 0.47, y + s * 0.62, s * 0.38, '#ff5722');
      star(ctx, x + s * 0.88, y + s * 0.18, s * 0.1, '#fff3b0');
    },
  },
  voucher: {
    bg: '#fff1e8', fg: '#3d1f12', muted: '#a0603f', brand: ORANGE, bars: '#ff8a65', rule: '#ffd3c2',
    cell: { fill: '#ffffff', radius: 16, border: '#ffb59a', notch: '#fff1e8' },
    backdrop: (ctx, W, H, u) => corners(W, H, u, (x, y, s, i) => ticket(ctx, x, y, s * 2.2, s * 1.1, '#ffd9c7', '#ff8a65', '#fff1e8', (i - 2) * 0.35)),
    mascot: (ctx, x, y, s) => ticket(ctx, x + s * 0.5, y + s * 0.5, s * 0.95, s * 0.5, ORANGE, '#ffffff', '#fff1e8', -0.18),
  },
  coins: {
    bg: '#fff6d8', fg: '#4a3200', muted: '#9a7a2e', brand: '#e08a00', bars: '#ffc233', rule: '#f3dc9a', cell: { fill: '#ffffff', radius: 26, border: '#ffd36b' },
    backdrop: (ctx, W, H, u) => corners(W, H, u, (x, y, s) => starCoin(ctx, x, y, s * 0.75)),
    mascot: coinStack,
  },
  parcel: {
    bg: '#d8b48a', fg: '#3b2614', muted: '#6e4f30', brand: '#3b2614', bars: '#8a5a2b', rule: '#b98f62', cell: { fill: '#efdcc2', radius: 6 },
    backdrop: (ctx, W, H, u) => {
      // Packing tape over the top and bottom edges, and "this side up" marks.
      ctx.fillStyle = 'rgba(255,248,230,0.55)';
      ctx.fillRect(W / 2 - 70 * u, 0, 140 * u, 40 * u);
      ctx.fillRect(W / 2 - 70 * u, H - 40 * u, 140 * u, 40 * u);
      corners(W, H, u, (x, y, s, i) => (i === 0 || i === 2) && upArrows(ctx, x, y, s * 1.2, 'rgba(59,38,20,0.45)'));
    },
    mascot: parcel,
  },
  candy: {
    bg: '#ffe4ee', fg: '#4a1f33', muted: '#a35d7b', brand: '#ff4f8b', bars: '#ff9cbf', rule: '#ffc2d6', cell: { fill: '#ffffff', radius: 36 },
    backdrop: (ctx, W, H, u) => corners(W, H, u, (x, y, s, i) => (i % 2 ? sparkle(ctx, x, y, s, '#ffb3cd') : heart(ctx, x, y, s * 1.6, '#ff8fb5'))),
    mascot: (ctx, x, y, s) => {
      heart(ctx, x + s * 0.5, y + s * 0.55, s * 0.7, '#ff4f8b');
      sparkle(ctx, x + s * 0.82, y + s * 0.2, s * 0.14, '#ffb3cd');
      sparkle(ctx, x + s * 0.15, y + s * 0.25, s * 0.09, '#ff8fb5');
    },
  },
  sky: {
    bg: '#cfeaff', fg: '#14304f', muted: '#4d6a88', brand: '#1f7ae0', bars: '#5fb2ff', rule: 'rgba(20,48,79,0.15)', cell: { fill: 'rgba(255,255,255,0.9)', radius: 28 },
    backdrop: (ctx, W, H, u) => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#9fd6ff');
      g.addColorStop(1, '#eef8ff');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Clouds peek in at the top and bottom edges, clear of the text.
      cloud(ctx, W * 0.72, 4 * u, 170 * u, 'rgba(255,255,255,0.9)');
      cloud(ctx, W * 0.92, 18 * u, 110 * u, 'rgba(255,255,255,0.75)');
      cloud(ctx, W * 0.18, H - 4 * u, 160 * u, 'rgba(255,255,255,0.9)');
    },
    mascot: sun,
  },
  cat: {
    bg: '#fff3d9', fg: '#4a3322', muted: '#8c6d52', brand: '#f08a24', bars: '#f6b26b', rule: '#f1d9b0', cell: { fill: '#ffffff', radius: 30 },
    backdrop: (ctx, W, H, u) => corners(W, H, u, (x, y, s) => paw(ctx, x, y, s * 1.8, '#f6dcae')),
    mascot: cat,
  },
  matcha: {
    bg: '#e9f2df', fg: '#2c3a20', muted: '#6a7b57', brand: '#4f8a2e', bars: '#8fbf6a', rule: '#cfe0bd', cell: { fill: '#f9f7ef', radius: 26 },
    backdrop: (ctx, W, H, u) => corners(W, H, u, (x, y, s, i) => leaf(ctx, x, y, s * 2.6, i * 1.1 - 0.6, '#b9d69c', '#e9f2df')),
    mascot: matchaCup,
  },
  tet: {
    bg: '#b8121e', fg: '#fff4dc', muted: '#f7c9a3', brand: '#ffd15c', bars: '#ffd15c', rule: 'rgba(255,209,92,0.5)', cell: { fill: 'rgba(0,0,0,0.18)', radius: 18 },
    backdrop: (ctx, W, H, u) => {
      ctx.strokeStyle = 'rgba(255,209,92,0.75)';
      ctx.lineWidth = 3 * u;
      ctx.strokeRect(18 * u, 18 * u, W - 36 * u, H - 36 * u);
      ctx.lineWidth = 1.5 * u;
      ctx.strokeRect(28 * u, 28 * u, W - 56 * u, H - 56 * u);
      for (const [x, y] of [[28, 28], [W / u - 28, 28], [28, H / u - 28], [W / u - 28, H / u - 28]]) blossom(ctx, x * u, y * u, 20 * u, '#ffd15c', '#e8590c');
    },
    mascot: coin,
  },
  receipt: {
    bg: '#e9e3d6', fg: '#1d1d1b', muted: '#6e6a62', brand: '#1d1d1b', bars: '#1d1d1b', rule: '#1d1d1b', cell: 'dashed',
    backdrop: (ctx, W, H, u) => {
      // Paper with torn, zigzag ends.
      const x0 = 26 * u;
      const x1 = W - 26 * u;
      const tooth = 18 * u;
      const top = 22 * u;
      const bottom = H - 22 * u;
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(x0 + 6 * u, top + 8 * u, x1 - x0, bottom - top);
      ctx.fillStyle = '#fffdf6';
      ctx.beginPath();
      ctx.moveTo(x0, top);
      for (let x = x0; x < x1; x += tooth) {
        ctx.lineTo(Math.min(x + tooth / 2, x1), top - tooth / 2);
        ctx.lineTo(Math.min(x + tooth, x1), top);
      }
      ctx.lineTo(x1, bottom);
      for (let x = x1; x > x0; x -= tooth) {
        ctx.lineTo(Math.max(x - tooth / 2, x0), bottom + tooth / 2);
        ctx.lineTo(Math.max(x - tooth, x0), bottom);
      }
      ctx.closePath();
      ctx.fill();
    },
    mascot: stamp,
  },
  neon: {
    bg: '#1a0833', fg: '#ffffff', muted: '#c4b5fd', brand: '#ff4fd8', bars: '#3ee8ff', rule: 'rgba(255,255,255,0.18)', cell: { fill: 'rgba(255,255,255,0.07)', radius: 20 },
    glow: 'rgba(255,79,216,0.75)',
    backdrop: (ctx, W, H, u) => {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#12052a');
      g.addColorStop(1, '#43106b');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      corners(W, H, u, (x, y, s, i) => sparkle(ctx, x, y, s, i % 2 ? '#3ee8ff' : '#ff4fd8'));
    },
    mascot: twinkles,
  },
  minimal: { bg: '#fbfaf7', fg: '#111111', muted: '#7a7a7a', brand: ORANGE, bars: '#111111', rule: '#e2e0da', cell: 'rule' },
};
