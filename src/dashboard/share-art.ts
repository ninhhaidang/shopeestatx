// The share image's artworks: colours, how figures sit, and the doodles each one is decorated with.
// Doodles are drawn as shapes (never emoji or text), so every artwork looks the same on every computer
// and the image keeps to its few aggregate strings.

export type ShareTemplate = 'label' | 'bold' | 'night' | 'candy' | 'sky' | 'cat' | 'matcha' | 'tet' | 'receipt' | 'neon' | 'minimal';

export const SHARE_TEMPLATES: ShareTemplate[] = ['label', 'bold', 'night', 'candy', 'sky', 'cat', 'matcha', 'tet', 'receipt', 'neon', 'minimal'];

export const ORANGE = '#ee4d2d';

type Ctx = CanvasRenderingContext2D;

export interface Look {
  bg: string;
  fg: string;
  muted: string;
  brand: string;
  bars: string;
  rule: string;
  /** How a figure sits: an outlined box, a filled card, or a rule (solid or dashed) above it. */
  cell: 'box' | 'rule' | 'dashed' | { fill: string; radius: number };
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
