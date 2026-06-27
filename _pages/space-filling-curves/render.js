// Geometry + raster rendering for the space-filling curve background.
//
// The same geometry helpers feed both the live <canvas> preview (drawn as
// vectors) and the final exported image (drawn at supersampled resolution then
// downscaled), so preview and export match.
//
// Paths are kept as flat numeric arrays [x0, y0, x1, y1, ...] for speed, since
// high orders reach ~10^6 points.  Read vertex i as path[2*i], path[2*i+1].

import { curveGeometry } from "./curves.js";

// --------------------------------------------------------------------------- //
// Colors
// --------------------------------------------------------------------------- //
export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function rgbToHex([r, g, b]) {
  const h = (v) => v.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function lerpColor(c1, c2, t) {
  t = Math.max(0.0, Math.min(1.0, t));
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

const rgbCss = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

// --------------------------------------------------------------------------- //
// Render parameters (the single bag of render knobs)
// --------------------------------------------------------------------------- //
// Thickness modes:
//   "uniform"  - constant stroke width (= thickness)
//   "distance" - width tapers from `thickness` at the focus point down to
//                `thicknessMin` at the image point furthest from the focus.
export function defaultParams() {
  return {
    curveType: "hilbert",
    order: 5,
    width: 800,
    height: 800,
    marginFrac: 0.0,
    thickness: 6.0, // stroke width in image px (max, in distance mode)
    cornerRadius: 0.0,
    curveColor: [40, 70, 160],
    curveColor2: [200, 60, 120],
    gradient: false,
    background: [245, 245, 248],
    thicknessMode: "uniform",
    thicknessMin: 1.0,
    focusX: 0.5, // focus point as a fraction of width (0..1)
    focusY: 0.5,
    falloff: "linear",
  };
}

export function drawableSize(p) {
  const short = Math.min(p.width, p.height);
  return short - 2 * p.marginFrac * short;
}

// Pixel spacing between two adjacent (parallel) curve segments.
export function cellSize(p) {
  const geo = curveGeometry(p.curveType, p.order);
  const drawable = drawableSize(p);
  if (geo.span <= 0) return drawable;
  return (drawable / geo.span) * geo.unit;
}

// The full gap between two parallel curve segments (minus a 1px sliver).
export function maxThickness(p) {
  return Math.max(1.0, cellSize(p) + 1.0);
}

export function maxCornerRadius(p) {
  return cellSize(p) / 2.0;
}

// --------------------------------------------------------------------------- //
// Geometry
// --------------------------------------------------------------------------- //
// Curve vertices mapped into centered image-pixel coordinates.  The curve's
// bounding box is fitted into the drawable area (preserving aspect ratio) and
// centered, so square grids and the hexagonal Gosper island are handled alike.
export function basePath(p) {
  const geo = curveGeometry(p.curveType, p.order);
  const drawable = drawableSize(p);
  const span = geo.span > 0 ? geo.span : 1.0;
  const scale = drawable / span;

  const contentW = geo.spanX * scale;
  const contentH = geo.spanY * scale;
  const offX = (p.width - contentW) / 2.0 - geo.minX * scale;
  const offY = (p.height - contentH) / 2.0 - geo.minY * scale;

  const src = geo.points;
  const out = new Float64Array(src.length);
  for (let i = 0; i < src.length; i += 2) {
    out[i] = offX + src[i] * scale;
    out[i + 1] = offY + src[i + 1] * scale;
  }
  return out;
}

// Replace each sharp interior corner with a rounded quadratic fillet.  The
// corner at vertex v is cut back by `radius` along both neighbouring segments
// (clamped to half of each so fillets never overlap) and reconnected with a
// quadratic curve through v.  `arcSteps` scales with the radius so large corners
// stay smooth while tiny ones don't explode the point count.
export function roundPath(path, radius, arcSteps = null) {
  const n = path.length / 2;
  if (radius <= 0 || n < 3) return path;
  if (arcSteps === null) arcSteps = Math.max(4, Math.min(24, Math.round(radius)));

  const out = [path[0], path[1]];
  for (let i = 1; i < n - 1; i++) {
    const px = path[2 * (i - 1)], py = path[2 * (i - 1) + 1];
    const vx = path[2 * i], vy = path[2 * i + 1];
    const qx = path[2 * (i + 1)], qy = path[2 * (i + 1) + 1];
    const vinx = vx - px, viny = vy - py;
    const voutx = qx - vx, vouty = qy - vy;
    const lin = Math.hypot(vinx, viny);
    const lout = Math.hypot(voutx, vouty);
    if (lin === 0 || lout === 0) {
      out.push(vx, vy);
      continue;
    }
    const dinx = vinx / lin, diny = viny / lin;
    const doutx = voutx / lout, douty = vouty / lout;
    const cross = dinx * douty - diny * doutx;
    if (Math.abs(cross) < 1e-9) {
      // straight through - no corner to round
      out.push(vx, vy);
      continue;
    }
    const cut = Math.min(radius, lin / 2.0, lout / 2.0);
    const ax = vx - dinx * cut, ay = vy - diny * cut;
    const bx = vx + doutx * cut, by = vy + douty * cut;
    out.push(ax, ay);
    for (let s = 1; s < arcSteps; s++) {
      const t = s / arcSteps;
      const mt = 1 - t;
      out.push(
        mt * mt * ax + 2 * mt * t * vx + t * t * bx,
        mt * mt * ay + 2 * mt * t * vy + t * t * by,
      );
    }
    out.push(bx, by);
  }
  out.push(path[2 * (n - 1)], path[2 * (n - 1) + 1]);
  return out;
}

// Subdivide `path` so no segment is longer than `maxStep`.  Used for
// distance-driven thickness so the width follows the true radial falloff instead
// of a coarse straight-line interpolation between grid vertices.
export function densify(path, maxStep) {
  const n = path.length / 2;
  if (maxStep <= 0 || n < 2) return path;
  const out = [path[0], path[1]];
  for (let i = 1; i < n; i++) {
    const ax = path[2 * (i - 1)], ay = path[2 * (i - 1) + 1];
    const bx = path[2 * i], by = path[2 * i + 1];
    const d = Math.hypot(bx - ax, by - ay);
    if (d > maxStep) {
      const k = Math.ceil(d / maxStep);
      for (let j = 1; j < k; j++) {
        const t = j / k;
        out.push(ax + (bx - ax) * t, ay + (by - ay) * t);
      }
    }
    out.push(bx, by);
  }
  return out;
}

// --------------------------------------------------------------------------- //
// Falloff shapes
// --------------------------------------------------------------------------- //
// Ordered list of falloff shapes offered to the UI.
export const FALLOFFS = ["linear", "ease-in", "ease-out", "smoothstep", "sqrt",
  "exponential", "logarithmic"];

const EXP_K = 4.0;
const LOG_K = 9.0;

// Remap a normalised distance d in [0, 1] through a falloff shape, with
// f(0) == 0 (full thickness at the focus) and f(1) == 1 (min thickness far out).
export function applyFalloff(d, mode) {
  switch (mode) {
    case "ease-in": return d * d;
    case "ease-out": return d * (2.0 - d);
    case "smoothstep": return d * d * (3.0 - 2.0 * d);
    case "sqrt": return Math.sqrt(d);
    case "exponential": return (Math.exp(EXP_K * d) - 1.0) / (Math.exp(EXP_K) - 1.0);
    case "logarithmic": return Math.log(1.0 + LOG_K * d) / Math.log(1.0 + LOG_K);
    default: return d; // linear / unknown
  }
}

// Return a function f(x, y) -> width (in image px) for `params`.  In "distance"
// mode the width is `thickness` at the focus and falls off to `thicknessMin` at
// the image corner furthest from it, following the `falloff` shape.
export function thicknessAt(p) {
  if (p.thicknessMode !== "distance") {
    const t = p.thickness;
    return () => t;
  }
  const fx = p.focusX * p.width;
  const fy = p.focusY * p.height;
  const corners = [[0, 0], [p.width, 0], [0, p.height], [p.width, p.height]];
  let maxD = 0;
  for (const [cx, cy] of corners) maxD = Math.max(maxD, Math.hypot(cx - fx, cy - fy));
  maxD = maxD || 1.0;
  const tMax = p.thickness, tMin = p.thicknessMin, mode = p.falloff;
  return (x, y) => {
    const d = Math.min(1.0, Math.hypot(x - fx, y - fy) / maxD);
    return tMax + (tMin - tMax) * applyFalloff(d, mode);
  };
}

// --------------------------------------------------------------------------- //
// Raster (canvas) rendering for export / distance-mode preview
// --------------------------------------------------------------------------- //
// Largest intermediate (supersampled) edge we are willing to allocate.
export const MAX_SUPERSAMPLED_EDGE = 12500;

function newCanvas(w, h) {
  // OffscreenCanvas when available (workers / modern browsers), else a detached
  // <canvas>.  Either exposes the same 2D context API.
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Render the curve to an offscreen canvas at params.width x params.height.
// The scene is drawn at `supersample`x then downscaled with a high-quality
// filter for clean anti-aliased edges.  When `supersample` is null the factor is
// chosen automatically: smaller images get a higher factor, larger ones are
// capped so the buffer stays manageable.
export function renderToCanvas(p, supersample = null) {
  const longest = Math.max(p.width, p.height);
  if (supersample === null) {
    supersample = longest <= 1600 ? 4 : longest <= 3200 ? 3 : 2;
  }
  while (supersample > 1 && longest * supersample > MAX_SUPERSAMPLED_EDGE) supersample--;
  const ss = Math.max(1, supersample);

  if (p.thicknessMode === "distance") {
    return renderDistanceField(p, ss);
  }

  const W = p.width * ss, H = p.height * ss;
  const big = newCanvas(W, H);
  const ctx = big.getContext("2d");
  ctx.fillStyle = rgbCss(p.background);
  ctx.fillRect(0, 0, W, H);

  const pts = scalePath(basePath(p), ss);
  const sharp = p.cornerRadius <= 0;
  const path = sharp ? pts : roundPath(pts, p.cornerRadius * ss);
  const n = path.length / 2;
  const width = Math.max(1, Math.round(p.thickness * ss));

  ctx.lineJoin = sharp ? "miter" : "round";
  ctx.lineCap = sharp ? "butt" : "round";
  ctx.lineWidth = width;

  const colorAt = (i) =>
    p.gradient ? lerpColor(p.curveColor, p.curveColor2, n > 1 ? i / (n - 1) : 0.0)
      : p.curveColor;

  if (!p.gradient) {
    strokePath(ctx, path, 0, n, p.curveColor);
  } else {
    // Colour the path in a few hundred runs - smooth, cheap to draw.
    const runs = Math.min(n - 1, 360);
    const per = (n - 1) / runs;
    let prevEnd = 0;
    for (let r = 0; r < runs; r++) {
      const start = prevEnd;
      const end = Math.min(n - 1, Math.round((r + 1) * per));
      prevEnd = end;
      if (end - start < 1) continue;
      strokePath(ctx, path, start, end + 1, colorAt((start + end) >> 1));
    }
  }

  // Sharp mode: square off every interior corner so thick strokes meet in crisp
  // right angles (stroke joins are butt-capped above).
  if (sharp && width > 1) {
    const r = width / 2.0;
    for (let i = 1; i < n - 1; i++) {
      const x = path[2 * i], y = path[2 * i + 1];
      ctx.fillStyle = rgbCss(colorAt(i));
      ctx.fillRect(x - r, y - r, width, width);
    }
  }

  if (ss === 1) return big;
  return downscale(big, p.width, p.height);
}

function strokePath(ctx, path, start, end, color) {
  if (end - start < 2) return;
  ctx.strokeStyle = rgbCss(color);
  ctx.beginPath();
  ctx.moveTo(path[2 * start], path[2 * start + 1]);
  for (let i = start + 1; i < end; i++) ctx.lineTo(path[2 * i], path[2 * i + 1]);
  ctx.stroke();
}

function scalePath(path, ss) {
  if (ss === 1) return path;
  const out = new Float64Array(path.length);
  for (let i = 0; i < path.length; i++) out[i] = path[i] * ss;
  return out;
}

function downscale(srcCanvas, w, h) {
  const out = newCanvas(w, h);
  const ctx = out.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(srcCanvas, 0, 0, w, h);
  return out;
}

// --------------------------------------------------------------------------- //
// Distance-field rendering (exact Euclidean distance transform)
// --------------------------------------------------------------------------- //
// Render distance-driven thickness as a true per-pixel distance field.  Every
// pixel's distance to the curve is computed exactly (Euclidean distance
// transform of the rasterised centre-line), then the pixel is painted when that
// distance is within the locally-varying half-thickness.  Anti-aliasing comes
// from a 1px soft edge on the coverage, so the taper is perfectly smooth.
function renderDistanceField(p, ss) {
  const longest = Math.max(p.width, p.height);
  while (ss > 1 && longest * ss > 8000) ss--;
  const W = p.width * ss, H = p.height * ss;

  const pts = scalePath(basePath(p), ss);
  const path = p.cornerRadius <= 0 ? pts : roundPath(pts, p.cornerRadius * ss);
  const n = path.length / 2;

  // Rasterise the 1px centre-line as the seed for the distance transform.
  // Bresenham gives a crisp 1px seed (no anti-alias halo to inflate distances).
  // For the gradient we record, at *every* seed pixel, its fraction along the
  // curve (tLine), interpolated across each segment -- the nearest-seed lookup
  // below then yields a smooth along-curve colour. (Marking only the vertices
  // leaves most seed pixels at t=0, so the gradient collapses to the start
  // colour with sparse speckles where a vertex happens to be the nearest seed.)
  const mask = new Uint8Array(W * H);
  const tLine = p.gradient ? new Float32Array(W * H) : null;
  let any = false;
  for (let i = 1; i < n; i++) {
    const tStart = n > 1 ? (i - 1) / (n - 1) : 0.0;
    const tEnd = n > 1 ? i / (n - 1) : 0.0;
    if (rasterLine(mask, tLine, W, H, path[2 * (i - 1)], path[2 * (i - 1) + 1],
      path[2 * i], path[2 * i + 1], tStart, tEnd)) any = true;
  }
  const bg = newCanvas(p.width, p.height);
  if (!any) {
    const c = bg.getContext("2d");
    c.fillStyle = rgbCss(p.background);
    c.fillRect(0, 0, p.width, p.height);
    return bg;
  }

  const wantIndices = p.gradient;
  const { dist, iy, ix } = edt(mask, W, H, wantIndices);

  // Local half-thickness per pixel (same radial falloff as thicknessAt, scaled
  // into super-sampled space).
  const fx = p.focusX * W, fy = p.focusY * H;
  const corners = [[0, 0], [W, 0], [0, H], [W, H]];
  let maxD = 0;
  for (const [cx, cy] of corners) maxD = Math.max(maxD, Math.hypot(cx - fx, cy - fy));
  maxD = maxD || 1.0;
  const tMax = p.thickness * ss, tMin = p.thicknessMin * ss, mode = p.falloff;

  const c1 = p.curveColor, c2 = p.curveColor2, bgc = p.background;
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    const dyf = (y - fy);
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      const dFocus = Math.min(1.0, Math.hypot(x - fx, dyf) / maxD);
      const shaped = applyFalloff(dFocus, mode);
      const half = 0.5 * (tMax + (tMin - tMax) * shaped);
      const coverage = Math.max(0.0, Math.min(1.0, half - dist[idx] + 0.5));

      let sr, sg, sb;
      if (p.gradient) {
        const seed = iy[idx] * W + ix[idx];
        const t = tLine[seed];
        sr = c1[0] + (c2[0] - c1[0]) * t;
        sg = c1[1] + (c2[1] - c1[1]) * t;
        sb = c1[2] + (c2[2] - c1[2]) * t;
      } else {
        sr = c1[0]; sg = c1[1]; sb = c1[2];
      }
      const o = idx * 4;
      out[o] = bgc[0] * (1.0 - coverage) + sr * coverage + 0.5;
      out[o + 1] = bgc[1] * (1.0 - coverage) + sg * coverage + 0.5;
      out[o + 2] = bgc[2] * (1.0 - coverage) + sb * coverage + 0.5;
      out[o + 3] = 255;
    }
  }

  const big = newCanvas(W, H);
  big.getContext("2d").putImageData(new ImageData(out, W, H), 0, 0);
  if (ss === 1) return big;
  return downscale(big, p.width, p.height);
}

// Bresenham 1px line into a Uint8 mask.  Returns true if any pixel was set.
// When `tLine` is non-null, each drawn pixel also records its fraction along the
// curve, interpolated from `tStart` to `tEnd` across the segment.
function rasterLine(mask, tLine, W, H, x0, y0, x1, y1, tStart, tEnd) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const adx = Math.abs(x1 - x0), ady = Math.abs(y1 - y0);
  const dx = adx, dy = -ady;
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  const steps = Math.max(adx, ady); // Bresenham visits steps + 1 pixels
  let err = dx + dy, set = false, k = 0;
  for (;;) {
    if (x0 >= 0 && x0 < W && y0 >= 0 && y0 < H) {
      const idx = y0 * W + x0;
      mask[idx] = 1;
      if (tLine) tLine[idx] = steps > 0 ? tStart + (tEnd - tStart) * (k / steps) : tStart;
      set = true;
    }
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
    k++;
  }
  return set;
}

// Exact Euclidean distance transform (Felzenszwalb & Huttenlocher two-pass).
// `mask` marks seed pixels (1).  Returns per-pixel distance to the nearest seed,
// and -- when `withIndices` -- the nearest seed's (ix, iy) for gradient lookup.
function edt(mask, W, H, withIndices) {
  const INF = 1e20;
  // Squared distance, transformed first down columns then across rows.
  const g = new Float32Array(W * H); // column-pass squared distance
  const ny = withIndices ? new Int32Array(W * H) : null; // nearest seed row per column

  // --- column pass --- //
  {
    const f = new Float64Array(H);
    const d = new Float64Array(H);
    const arg = new Int32Array(H);
    const v = new Int32Array(H);
    const z = new Float64Array(H + 1);
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) f[y] = mask[y * W + x] ? 0 : INF;
      dt1d(f, H, d, arg, v, z);
      for (let y = 0; y < H; y++) {
        g[y * W + x] = d[y];
        if (withIndices) ny[y * W + x] = arg[y];
      }
    }
  }

  // --- row pass --- //
  const dist = new Float32Array(W * H);
  const iy = withIndices ? new Int32Array(W * H) : null;
  const ix = withIndices ? new Int32Array(W * H) : null;
  {
    const f = new Float64Array(W);
    const d = new Float64Array(W);
    const arg = new Int32Array(W);
    const v = new Int32Array(W);
    const z = new Float64Array(W + 1);
    for (let y = 0; y < H; y++) {
      const row = y * W;
      for (let x = 0; x < W; x++) f[x] = g[row + x];
      dt1d(f, W, d, arg, v, z);
      for (let x = 0; x < W; x++) {
        dist[row + x] = Math.sqrt(d[x]);
        if (withIndices) {
          const c = arg[x]; // nearest column
          ix[row + x] = c;
          iy[row + x] = ny[row + c];
        }
      }
    }
  }
  return { dist, iy, ix };
}

// 1D squared-distance transform of a sampled function f (length n).  Writes the
// transformed distances into d and the index of the minimising sample into arg.
// v/z are reusable scratch buffers (lower-envelope locations and boundaries).
function dt1d(f, n, d, arg, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k--;
      s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const dx = q - v[k];
    d[q] = dx * dx + f[v[k]];
    arg[q] = v[k];
  }
}

// --------------------------------------------------------------------------- //
// BMP export (24-bit uncompressed; canvas can't produce BMP natively)
// --------------------------------------------------------------------------- //
export function encodeBmp(imageData) {
  const { width: w, height: h, data } = imageData;
  const rowSize = (w * 3 + 3) & ~3; // padded to a 4-byte boundary
  const pixelArraySize = rowSize * h;
  const fileSize = 54 + pixelArraySize;
  const buf = new ArrayBuffer(fileSize);
  const dv = new DataView(buf);

  // BITMAPFILEHEADER
  dv.setUint8(0, 0x42); // 'B'
  dv.setUint8(1, 0x4d); // 'M'
  dv.setUint32(2, fileSize, true);
  dv.setUint32(6, 0, true); // reserved
  dv.setUint32(10, 54, true); // pixel data offset
  // BITMAPINFOHEADER
  dv.setUint32(14, 40, true); // header size
  dv.setInt32(18, w, true);
  dv.setInt32(22, h, true); // positive -> bottom-up rows
  dv.setUint16(26, 1, true); // planes
  dv.setUint16(28, 24, true); // bpp
  dv.setUint32(30, 0, true); // BI_RGB, no compression
  dv.setUint32(34, pixelArraySize, true);
  dv.setInt32(38, 2835, true); // ~72 DPI x
  dv.setInt32(42, 2835, true); // ~72 DPI y
  dv.setUint32(46, 0, true); // colours used
  dv.setUint32(50, 0, true); // colours important

  let off = 54;
  for (let y = h - 1; y >= 0; y--) { // BMP rows are bottom-up
    let rowOff = off;
    const src = y * w * 4;
    for (let x = 0; x < w; x++) {
      const s = src + x * 4;
      dv.setUint8(rowOff++, data[s + 2]); // B
      dv.setUint8(rowOff++, data[s + 1]); // G
      dv.setUint8(rowOff++, data[s]); // R
    }
    off += rowSize;
  }
  return new Blob([buf], { type: "image/bmp" });
}
