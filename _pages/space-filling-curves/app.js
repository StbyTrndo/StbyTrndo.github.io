// Space-Filling Curve Background Generator - browser UI.
//
// The live preview and the "Animate" walkthrough are drawn as vectors directly
// on a <canvas> (fast, with rounded caps/joins); distance-mode preview and every
// export reuse render.js so what you see matches what you get.  All computation
// runs client-side.

import {
  CURVE_LABELS, MAX_ORDER, MIN_ORDER, curvePointCount,
} from "./curves.js";
import {
  defaultParams, basePath, roundPath, densify, lerpColor, thicknessAt,
  maxThickness, maxCornerRadius, renderToCanvas, hexToRgb, encodeBmp,
} from "./render.js";

const PREVIEW_MAX = 620;     // max preview size in px (the canvas fits the image here)
const MAX_RESOLUTION = 6016; // max image width/height in px
const DEBOUNCE_MS = 70;

const $ = (id) => document.getElementById(id);

// --- elements -------------------------------------------------------------- //
const els = {
  curve: $("curve"),
  order: $("order"),
  size: $("size"),
  thickness: $("thickness"),
  thicknessName: $("thickness-name"),
  mode: $("mode"),
  thicknessMin: $("thickness-min"),
  falloff: $("falloff"),
  focusHint: $("focus-hint"),
  radius: $("radius"),
  curveColor: $("curve-color"),
  gradient: $("gradient"),
  curveColor2: $("curve-color2"),
  bgColor: $("bg-color"),
  animate: $("animate"),
  format: $("format"),
  save: $("save"),
  status: $("status"),
  canvas: $("preview"),
  canvasWrap: $("canvas-wrap"),
};

const ctx = els.canvas.getContext("2d");

// --- state ----------------------------------------------------------------- //
const state = {
  redrawTimer: null,
  animating: false,
  animRaf: null,
  previewScale: 1.0,
  previewOff: [0.0, 0.0],
  focusX: 0.5, // focal point for "distance" mode, as fractions of the image
  focusY: 0.5,
  anim: null,
};

// --------------------------------------------------------------------------- //
// Parameters
// --------------------------------------------------------------------------- //
function params() {
  const p = defaultParams();
  p.curveType = els.curve.value;
  p.order = parseInt(els.order.value, 10);
  const size = parseInt(els.size.value, 10);
  p.width = size;
  p.height = size;
  p.thickness = parseFloat(els.thickness.value);
  p.cornerRadius = parseFloat(els.radius.value);
  p.curveColor = hexToRgb(els.curveColor.value);
  p.curveColor2 = hexToRgb(els.curveColor2.value);
  p.gradient = els.gradient.checked;
  p.background = hexToRgb(els.bgColor.value);
  p.thicknessMode = els.mode.value;
  p.thicknessMin = parseFloat(els.thicknessMin.value);
  p.focusX = state.focusX;
  p.focusY = state.focusY;
  p.falloff = els.falloff.value;
  return p;
}

// Each slider shows its value next to the label; format per the data-fmt attr.
function setSliderLabel(input) {
  const slider = input.closest(".slider");
  const valEl = slider.querySelector(".slider-val");
  const v = parseFloat(input.value);
  valEl.textContent = slider.dataset.fmt === "int"
    ? String(Math.round(v)) : v.toFixed(1);
}

// Update thickness/radius slider bounds from order + image size.
function refreshDynamicRanges() {
  const p = params();
  const maxT = maxThickness(p);
  for (const input of [els.thickness, els.thicknessMin]) {
    input.max = maxT;
    if (parseFloat(input.value) > maxT) input.value = maxT.toFixed(1);
    setSliderLabel(input);
  }
  const maxR = maxCornerRadius(p);
  els.radius.max = maxR;
  if (parseFloat(els.radius.value) > maxR) els.radius.value = maxR.toFixed(1);
  setSliderLabel(els.radius);
}

function distanceMode() {
  return els.mode.value === "distance";
}

function onModeChange() {
  const distance = distanceMode();
  els.thicknessMin.closest(".slider").classList.toggle("disabled", !distance);
  els.thicknessMin.disabled = !distance;
  els.falloff.closest(".row").classList.toggle("disabled", !distance);
  els.falloff.disabled = !distance;
  els.thicknessName.textContent = distance ? "Max thickness (px)" : "Line thickness (px)";
  els.focusHint.classList.toggle("off", !distance);
  onParamChange();
}

function onCurveChange() {
  // Each curve fills the grid at a different rate, so cap the order to keep the
  // vertex count manageable, clamping the current value if needed.
  const maxOrder = MAX_ORDER[els.curve.value];
  els.order.max = maxOrder;
  if (parseInt(els.order.value, 10) > maxOrder) els.order.value = maxOrder;
  setSliderLabel(els.order);
  refreshDynamicRanges();
  onParamChange();
}

function onParamChange() {
  if (state.animating) stopAnimation();
  if (state.redrawTimer !== null) clearTimeout(state.redrawTimer);
  state.redrawTimer = setTimeout(renderPreview, DEBOUNCE_MS);
}

// --------------------------------------------------------------------------- //
// Preview transform + rendering
// --------------------------------------------------------------------------- //
function computeTransform(p) {
  const cw = Math.max(els.canvas.width, 1);
  const ch = Math.max(els.canvas.height, 1);
  const avail = Math.min(cw, ch, PREVIEW_MAX);
  const scale = avail / Math.max(p.width, p.height);
  const dispW = p.width * scale, dispH = p.height * scale;
  const offX = (cw - dispW) / 2.0, offY = (ch - dispH) / 2.0;
  state.previewScale = scale;
  state.previewOff = [offX, offY];
  return { scale, offX, offY, dispW, dispH };
}

// Curve vertices in preview-canvas coordinates (offset + scaled image coords).
function previewPath(p) {
  const scale = state.previewScale;
  const [ox, oy] = state.previewOff;
  const base = basePath(p);
  const pts = new Float64Array(base.length);
  for (let i = 0; i < base.length; i += 2) {
    pts[i] = ox + base[i] * scale;
    pts[i + 1] = oy + base[i + 1] * scale;
  }
  let path = roundPath(pts, p.cornerRadius * scale);
  if (p.thicknessMode === "distance") path = densify(path, 1.0); // smooth taper
  return path;
}

function clearCanvas() {
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
}

function renderPreview() {
  state.redrawTimer = null;
  if (state.animating) return;
  const p = params();
  clearCanvas();
  const { scale, offX, offY, dispW, dispH } = computeTransform(p);
  ctx.fillStyle = rgb(p.background);
  ctx.fillRect(offX, offY, dispW, dispH);

  if (p.thicknessMode === "distance") {
    // Render the true per-pixel distance field at preview resolution so the
    // preview matches the (smooth) exported image exactly.
    const pw = Math.max(1, Math.round(dispW));
    const ph = Math.max(1, Math.round(dispH));
    const pp = { ...p, width: pw, height: ph,
      thickness: p.thickness * scale,
      thicknessMin: p.thicknessMin * scale,
      cornerRadius: p.cornerRadius * scale };
    const img = renderToCanvas(pp, 1);
    ctx.drawImage(img, offX, offY);
    drawFocusMarker(p);
  } else {
    const path = previewPath(p);
    const width = Math.max(1, p.thickness * scale);
    withImageClip(p, () => drawCurve(path, width, p));
  }

  const npts = curvePointCount(p.curveType, p.order);
  els.status.textContent =
    `${CURVE_LABELS[p.curveType]} · order ${p.order} · ${npts} points · ` +
    `${p.width}×${p.height}px · thickness ${p.thickness.toFixed(1)}px · ` +
    `radius ${p.cornerRadius.toFixed(1)}px`;
}

function drawFocusMarker(p) {
  const scale = state.previewScale;
  const [ox, oy] = state.previewOff;
  const cx = ox + state.focusX * p.width * scale;
  const cy = oy + state.focusY * p.height * scale;
  const r = 7;
  for (const [w, col] of [[3, "#000000"], [1, "#ffffff"]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Run `fn` with drawing clipped to the image rectangle, so strokes on the outer
// strands don't spill past the background into the surrounding canvas frame.
// (The export has no such overflow: its canvas is exactly the image size, so the
// boundary clips the overhang for free.)
function withImageClip(p, fn) {
  const scale = state.previewScale;
  const [ox, oy] = state.previewOff;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox, oy, p.width * scale, p.height * scale);
  ctx.clip();
  fn();
  ctx.restore();
}

// Draw the curve as vectors.  `upto` (in vertices) limits the drawn length for
// animation; null draws the whole path.
function drawCurve(path, width, p, upto = null) {
  const total = path.length / 2;
  if (total < 2) return;
  const end = upto === null ? total : Math.min(upto, total);
  if (end < 2) return;
  const sharp = p.cornerRadius <= 0;

  if (p.thicknessMode === "distance") {
    drawVariableRange(path, p, 0, end, sharp);
    return;
  }

  ctx.lineJoin = sharp ? "miter" : "round";
  ctx.lineCap = sharp ? "butt" : "round";
  ctx.lineWidth = width;

  if (!p.gradient) {
    strokeRange(path, 0, end, rgb(p.curveColor));
    return;
  }
  const runs = Math.min(end - 1, 360);
  const per = (end - 1) / runs;
  let prev = 0;
  for (let r = 0; r < runs; r++) {
    const s = prev;
    const e = Math.min(end - 1, Math.round((r + 1) * per));
    prev = e;
    if (e - s < 1) continue;
    const t = ((s + e) / 2.0) / (total - 1);
    const col = lerpColor(p.curveColor, p.curveColor2, t);
    strokeRange(path, s, e + 1, rgb(col));
    // In sharp mode neighbouring chunks are separate strokes, so the corner
    // where they meet has no miter - fill it with a square.
    if (sharp && s > 0) cornerSquare(path, s, width, rgb(col));
  }
}

function strokeRange(path, start, end, css) {
  if (end - start < 2) return;
  ctx.strokeStyle = css;
  ctx.beginPath();
  ctx.moveTo(path[2 * start], path[2 * start + 1]);
  for (let i = start + 1; i < end; i++) ctx.lineTo(path[2 * i], path[2 * i + 1]);
  ctx.stroke();
}

function cornerSquare(path, i, width, css) {
  if (width <= 1) return;
  const r = width / 2.0;
  ctx.fillStyle = css;
  ctx.fillRect(path[2 * i] - r, path[2 * i + 1] - r, width, width);
}

// Draw path vertices [lo, hi) with per-point, distance-driven width.
function drawVariableRange(path, p, lo, hi, sharp) {
  const scale = state.previewScale;
  const [ox, oy] = state.previewOff;
  if (scale <= 0) return;
  const tf = thicknessAt(p); // width in image px, keyed by image coords
  const n = path.length / 2;
  hi = Math.min(hi, n);
  ctx.lineCap = sharp ? "square" : "round";

  const widthAt = (i) => {
    const px = path[2 * i], py = path[2 * i + 1];
    return Math.max(1.0, tf((px - ox) / scale, (py - oy) / scale) * scale);
  };

  for (let i = Math.max(lo, 0); i < hi - 1; i++) {
    const w = (widthAt(i) + widthAt(i + 1)) / 2.0;
    const col = p.gradient
      ? lerpColor(p.curveColor, p.curveColor2, n > 1 ? (i + 0.5) / (n - 1) : 0.0)
      : p.curveColor;
    ctx.strokeStyle = rgb(col);
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(path[2 * i], path[2 * i + 1]);
    ctx.lineTo(path[2 * (i + 1)], path[2 * (i + 1) + 1]);
    ctx.stroke();
  }
}

const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

// --------------------------------------------------------------------------- //
// Click-to-focus (distance mode)
// --------------------------------------------------------------------------- //
function onCanvasPointer(event) {
  if (!distanceMode()) return;
  const p = params();
  const scale = state.previewScale;
  const [ox, oy] = state.previewOff;
  if (scale <= 0) return;
  const rect = els.canvas.getBoundingClientRect();
  const cx = (event.clientX - rect.left) * (els.canvas.width / rect.width);
  const cy = (event.clientY - rect.top) * (els.canvas.height / rect.height);
  state.focusX = Math.min(1.0, Math.max(0.0, (cx - ox) / (p.width * scale)));
  state.focusY = Math.min(1.0, Math.max(0.0, (cy - oy) / (p.height * scale)));
  if (state.animating) stopAnimation();
  renderPreview();
}

// --------------------------------------------------------------------------- //
// Animation
// --------------------------------------------------------------------------- //
function toggleAnimate() {
  if (state.animating) stopAnimation();
  else startAnimation();
}

function startAnimation() {
  const p = params();
  clearCanvas();
  const { offX, offY, dispW, dispH, scale } = computeTransform(p);
  ctx.fillStyle = rgb(p.background);
  ctx.fillRect(offX, offY, dispW, dispH);
  const path = previewPath(p);
  const n = path.length / 2;
  state.anim = {
    path, p,
    width: Math.max(1, p.thickness * scale),
    index: 1,
    step: Math.max(1, Math.floor(n / 240)), // ~240 frames regardless of size
    n,
  };
  state.animating = true;
  els.animate.textContent = "Stop";
  state.animRaf = requestAnimationFrame(animateFrame);
}

function animateFrame() {
  if (!state.animating) return;
  const a = state.anim;
  const { path, p, n } = a;
  const start = a.index;
  const end = Math.min(n, start + a.step);
  const sharp = p.cornerRadius <= 0;

  withImageClip(p, () => {
    if (p.thicknessMode === "distance") {
      drawVariableRange(path, p, start - 1, end, sharp);
    } else {
      ctx.lineJoin = sharp ? "miter" : "round";
      ctx.lineCap = sharp ? "butt" : "round";
      ctx.lineWidth = a.width;
      let col = p.curveColor;
      if (p.gradient) col = lerpColor(p.curveColor, p.curveColor2, ((start + end) / 2.0) / n);
      strokeRange(path, start - 1, end, rgb(col));
      if (sharp && start > 1) cornerSquare(path, start - 1, a.width, rgb(col));
    }
  });

  a.index = end;
  els.status.textContent = `Animating… ${Math.round((100 * end) / n)}%`;
  if (end >= n) stopAnimation(true);
  else state.animRaf = requestAnimationFrame(animateFrame);
}

function stopAnimation(finished = false) {
  state.animating = false;
  if (state.animRaf !== null) {
    cancelAnimationFrame(state.animRaf);
    state.animRaf = null;
  }
  els.animate.textContent = "Animate";
  if (finished) {
    els.status.textContent = "Animation complete.";
    // Replace the vector walkthrough with the smooth pixel render.
    if (distanceMode()) renderPreview();
  } else {
    renderPreview();
  }
}

// --------------------------------------------------------------------------- //
// Saving
// --------------------------------------------------------------------------- //
const MIME = { png: "image/png", jpeg: "image/jpeg", webp: "image/webp" };

async function save() {
  if (state.animating) stopAnimation();
  const p = params();
  const fmt = els.format.value;
  els.status.textContent = "Rendering full-resolution image…";
  els.save.disabled = true;
  // Let the status paint before the (possibly heavy) synchronous render.
  await new Promise((r) => setTimeout(r, 0));

  let blob;
  try {
    const canvas = renderToCanvas(p); // supersample chosen automatically
    if (fmt === "bmp") {
      const c2d = canvas.getContext("2d");
      const imgData = c2d.getImageData(0, 0, p.width, p.height);
      blob = encodeBmp(imgData);
    } else {
      blob = await canvasToBlob(canvas, MIME[fmt], 1.0);
    }
  } catch (err) {
    els.status.textContent = `Save failed: ${err.message}`;
    els.save.disabled = false;
    return;
  }

  const ext = fmt === "jpeg" ? "jpg" : fmt;
  downloadBlob(blob, `${p.curveType}_order${p.order}.${ext}`);
  els.status.textContent = `Saved ${p.width}×${p.height}px → ${p.curveType}_order${p.order}.${ext}`;
  els.save.disabled = false;
}

function canvasToBlob(canvas, type, quality) {
  if (typeof canvas.convertToBlob === "function") {
    // OffscreenCanvas
    return canvas.convertToBlob({ type, quality });
  }
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// --------------------------------------------------------------------------- //
// Wiring
// --------------------------------------------------------------------------- //
function resizeCanvas() {
  const w = Math.max(1, Math.floor(els.canvasWrap.clientWidth));
  const h = Math.max(1, Math.floor(els.canvasWrap.clientHeight));
  if (els.canvas.width !== w || els.canvas.height !== h) {
    els.canvas.width = w;
    els.canvas.height = h;
  }
  if (!state.animating) renderPreview();
}

function init() {
  // Sliders: update label live + re-render.
  for (const input of [els.order, els.size]) {
    input.addEventListener("input", () => { setSliderLabel(input); refreshDynamicRanges(); onParamChange(); });
  }
  for (const input of [els.thickness, els.thicknessMin, els.radius]) {
    input.addEventListener("input", () => { setSliderLabel(input); onParamChange(); });
  }
  els.curve.addEventListener("change", onCurveChange);
  els.mode.addEventListener("change", onModeChange);
  els.falloff.addEventListener("change", onParamChange);
  els.gradient.addEventListener("change", onParamChange);
  for (const c of [els.curveColor, els.curveColor2, els.bgColor]) {
    c.addEventListener("input", onParamChange);
  }
  els.animate.addEventListener("click", toggleAnimate);
  els.save.addEventListener("click", save);
  els.canvas.addEventListener("pointerdown", onCanvasPointer);
  els.canvas.addEventListener("pointermove", (e) => { if (e.buttons & 1) onCanvasPointer(e); });

  // Initial labels.
  for (const input of [els.order, els.size, els.thickness, els.thicknessMin, els.radius]) {
    setSliderLabel(input);
  }

  new ResizeObserver(resizeCanvas).observe(els.canvasWrap);
  onModeChange();
  refreshDynamicRanges();
  resizeCanvas();
}

init();
