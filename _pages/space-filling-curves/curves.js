// Space-filling (and space-traversing) curve generation.
//
// Every curve the app can draw is exposed behind one uniform interface:
// `curveGeometry(type, order)`, which returns the ordered vertices for a curve
// together with the bounding box / spacing metadata the renderer needs to place
// and scale it.
//
// Each curve lives in its own coordinate space (square grids for Hilbert /
// Peano / Morton, a hexagonal lattice for Gosper).  The renderer never has to
// know the difference: it simply fits the returned bounding box into the image.
// Adding a new curve only means returning its points here.

// --------------------------------------------------------------------------- //
// Public registry
// --------------------------------------------------------------------------- //
// Curve keys in display order, mapped to friendly labels for the UI.
export const CURVE_LABELS = {
  hilbert: "Hilbert",
  peano: "Peano",
  gosper: "Gosper (flowsnake)",
  morton: "Morton (Z-order)",
};
export const CURVE_TYPES = Object.keys(CURVE_LABELS);

// A sensible maximum order per curve, chosen so the vertex count stays in the
// same ballpark (~10^6 points) for each.  Higher-branching curves fill the grid
// far faster, so they top out at a lower order.
//   hilbert / morton : 4**order points
//   gosper           : 7**order segments
//   peano            : 9**order points
export const MAX_ORDER = {
  hilbert: 10,
  peano: 6,
  gosper: 7,
  morton: 9,
};

// Smallest meaningful order for each curve (all start at 1).
export const MIN_ORDER = 1;

// --------------------------------------------------------------------------- //
// Geometry container
// --------------------------------------------------------------------------- //
// `points` are flat [x0, y0, x1, y1, ...] in the curve's own (arbitrary,
// un-centered) coordinate space.  `unit` is the spacing between two adjacent
// parallel strands in that same space -- the renderer multiplies it by the fit
// scale to know how thick a stroke can get before neighbouring strands touch.
// `span` is the larger bounding-box dimension, i.e. what gets fitted.

function makeGeometry(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i], y = points[i + 1];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  return {
    points,
    unit: 1.0, // every curve here is built with unit strand spacing.
    minX,
    minY,
    spanX,
    spanY,
    span: Math.max(spanX, spanY),
  };
}

export function curveGeometry(curveType, order) {
  if (order < MIN_ORDER) throw new Error("order must be >= 1");
  return makeGeometry(curvePoints(curveType, order));
}

export function curvePointCount(curveType, order) {
  if (curveType === "peano") return 9 ** order;
  if (curveType === "gosper") return 7 ** order + 1;
  // hilbert / morton both fill a 2**order grid.
  return 4 ** order;
}

// --------------------------------------------------------------------------- //
// Dispatch + caching (a small most-recently-used cache, max 8 entries)
// --------------------------------------------------------------------------- //
const _cache = new Map();

export function curvePoints(curveType, order) {
  const key = `${curveType}:${order}`;
  const hit = _cache.get(key);
  if (hit) return hit;

  let pts;
  if (curveType === "hilbert") pts = hilbertPoints(order);
  else if (curveType === "peano") pts = peanoPoints(order);
  else if (curveType === "gosper") pts = gosperPoints(order);
  else if (curveType === "morton") pts = mortonPoints(order);
  else throw new Error(`unknown curve type: ${curveType}`);

  if (_cache.size >= 8) _cache.delete(_cache.keys().next().value);
  _cache.set(key, pts);
  return pts;
}

// --------------------------------------------------------------------------- //
// Hilbert curve
// --------------------------------------------------------------------------- //
// Classic iterative distance->(x, y) mapping from the Wikipedia article.
function hilbertD2XY(n, d) {
  let x = 0, y = 0, t = d;
  for (let s = 1; s < n; s *= 2) {
    const rx = 1 & Math.floor(t / 2);
    const ry = 1 & (t ^ rx);
    if (ry === 0) {
      if (rx === 1) {
        x = s - 1 - x;
        y = s - 1 - y;
      }
      const tmp = x; x = y; y = tmp;
    }
    x += s * rx;
    y += s * ry;
    t = Math.floor(t / 4);
  }
  return [x, y];
}

export function hilbertPoints(order) {
  if (order < 1) throw new Error("order must be >= 1");
  const n = 1 << order; // 2**order
  const total = n * n;
  const out = new Float64Array(total * 2);
  for (let d = 0; d < total; d++) {
    const [x, y] = hilbertD2XY(n, d);
    out[2 * d] = x;
    out[2 * d + 1] = y;
  }
  return out;
}

// --------------------------------------------------------------------------- //
// Morton / Z-order curve
// --------------------------------------------------------------------------- //
// Visit cells of a 2**order grid by bit-interleaving.  Unlike the others this
// curve is *not* continuous -- consecutive points can be far apart -- which
// gives it its characteristic recursive `Z` shape.
function mortonPoints(order) {
  const n2 = 4 ** order;
  const out = new Float64Array(n2 * 2);
  for (let d = 0; d < n2; d++) {
    let x = 0, y = 0, bit = 0, t = d;
    while (t) {
      x |= (t & 1) << bit;
      t >>= 1;
      y |= (t & 1) << bit;
      t >>= 1;
      bit += 1;
    }
    out[2 * d] = x;
    out[2 * d + 1] = y;
  }
  return out;
}

// --------------------------------------------------------------------------- //
// L-system curves (Peano, Gosper)
// --------------------------------------------------------------------------- //
// Traced with an integer turtle so the vertices never drift, no matter how many
// steps the curve takes.  Headings index into a `directions` table of integer
// lattice steps; '+' turns one step counter-clockwise, '-' clockwise.  A final
// `basis` maps the integer lattice coordinates to (x, y).
//
// Recursion depth equals `order` (each level decrements depth), and drawing
// symbols are only emitted once fully expanded.  Some curves (e.g. Gosper) use
// the same letters for variables and moves, so expansion order matters.
function traceLSystem(rules, axiom, order, directions, forward, basis, startDir = 0) {
  const nd = directions.length;
  const state = { a: 0, b: 0, h: ((startDir % nd) + nd) % nd };
  const verts = [[0, 0]];

  // Iterative expansion via an explicit stack to avoid deep recursion for high
  // orders (matches the natural recursive expansion order).
  const stack = [];
  for (let i = axiom.length - 1; i >= 0; i--) {
    stack.push([axiom[i], order]);
  }
  while (stack.length) {
    const [sym, depth] = stack.pop();
    if (sym === "+") {
      state.h = (state.h + 1) % nd;
      continue;
    }
    if (sym === "-") {
      state.h = (state.h - 1 + nd) % nd;
      continue;
    }
    if (depth > 0 && rules[sym] !== undefined) {
      const rep = rules[sym];
      for (let i = rep.length - 1; i >= 0; i--) {
        stack.push([rep[i], depth - 1]);
      }
      continue;
    }
    if (forward.has(sym)) {
      const [da, db] = directions[state.h];
      state.a += da;
      state.b += db;
      verts.push([state.a, state.b]);
    }
  }

  const out = new Float64Array(verts.length * 2);
  for (let i = 0; i < verts.length; i++) {
    const [x, y] = basis(verts[i][0], verts[i][1]);
    out[2 * i] = x;
    out[2 * i + 1] = y;
  }
  return out;
}

// Square lattice, counter-clockwise from +x.
const SQUARE_DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const squareBasis = (a, b) => [a, b];

// Hex lattice in axial integer coordinates, counter-clockwise from +x.  Each of
// the six steps has unit length once mapped to (x, y) by hexBasis.
const HEX_DIRS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
const SQRT3_2 = Math.sqrt(3.0) / 2.0;
const hexBasis = (a, b) => [a + 0.5 * b, SQRT3_2 * b];

// Peano curve: classic 90-degree L-system filling a 3**order square grid.
const PEANO_RULES = {
  X: "XFYFX+F+YFXFY-F-XFYFX",
  Y: "YFXFY-F-XFYFX+F+YFXFY",
};

function peanoPoints(order) {
  return traceLSystem(PEANO_RULES, "X", order, SQUARE_DIRS,
    new Set(["F"]), squareBasis);
}

// Gosper curve (flowsnake): 60-degree L-system filling a fractal hexagon.
const GOSPER_RULES = {
  A: "A-B--B+A++AA+B-",
  B: "+A-BB--B-A++A+B",
};

function gosperPoints(order) {
  return traceLSystem(GOSPER_RULES, "A", order, HEX_DIRS,
    new Set(["A", "B"]), hexBasis);
}
