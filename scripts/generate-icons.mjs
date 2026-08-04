import { deflateSync } from 'node:zlib';
import * as fs from 'node:fs';
import * as path from 'node:path';

const OUT = path.resolve('public/icons');
fs.mkdirSync(OUT, { recursive: true });

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function clamp01(x) {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
}

function sdCircle(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const top = hexToRgb('#f97316');
  const bottom = hexToRgb('#c2410c');
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size;
      const v = (y + 0.5) / size;
      let r = top[0] + (bottom[0] - top[0]) * v;
      let g = top[1] + (bottom[1] - top[1]) * v;
      let b = top[2] + (bottom[2] - top[2]) * v;
      const blend = (cr, cg, cb, coverage) => {
        const a = clamp01(coverage);
        if (a <= 0) return;
        r = r + (cr - r) * a;
        g = g + (cg - g) * a;
        b = b + (cb - b) * a;
      };
      const cake = sdRoundRect(u, v, 0.5, 0.6, 0.27, 0.16, 0.055);
      blend(...hexToRgb('#ffffff'), 0.5 - cake);
      const stripe = sdRoundRect(u, v, 0.5, 0.6, 0.27, 0.045, 0.05);
      blend(...hexToRgb('#fdba74'), 0.5 - stripe);
      for (const cx of [0.38, 0.5, 0.62]) {
        const candle = sdRoundRect(u, v, cx, 0.41, 0.018, 0.075, 0.012);
        blend(...hexToRgb('#fff7ed'), 0.5 - candle);
        const flame = sdCircle(u, v, cx, 0.315, 0.028);
        blend(...hexToRgb('#fde68a'), 0.5 - flame);
      }
      const idx = (y * size + x) * 4;
      rgba[idx] = Math.round(r);
      rgba[idx + 1] = Math.round(g);
      rgba[idx + 2] = Math.round(b);
      rgba[idx + 3] = 255;
    }
  }
  return rgba;
}

const targets = {
  'icon-192.png': 192,
  'icon-512.png': 512,
  'maskable-192.png': 192,
  'maskable-512.png': 512,
  'apple-touch-icon.png': 180,
};

for (const [name, size] of Object.entries(targets)) {
  fs.writeFileSync(path.join(OUT, name), encodePng(size, render(size)));
}

console.log('icons generated:', Object.keys(targets).join(', '));
