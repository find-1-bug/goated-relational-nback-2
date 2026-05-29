// Reasoning Snapshot — assessment-only item generators.
//
// CRITICAL: this module is deliberately SEPARATE from gameEngine. A pre/post
// measure is only valid if it tests formats the user does NOT train. So we use
// matrix completion + number/letter series — none of which any GOATED training
// mode uses — and our own generators here, never the training stimulus code.
// (Verbal analogy / odd-one-out are intentionally excluded: the Insight mode
// trains them, which would make them near-transfer.)

// ── Seeded RNG (mulberry32) ─────────────────────────────────────────────────
// Deterministic so a given (form, seed) reproduces a battery, and so the smoke
// test can assert Form A / Form B are disjoint.
export function makeRng(seed) {
  let a = (seed >>> 0) || 1;
  return function rng() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Matrix Reasoning ────────────────────────────────────────────────────────
// A 3×3 grid of cells. Each cell = { shape, count, rot, fill }. One or two
// feature dimensions progress systematically (across columns and/or rows); the
// rest are held constant. The bottom-right cell is hidden; the player picks it
// from 6 options. Distractors are the correct spec with exactly one feature
// changed, so the correct answer is always unique by construction.
export const MATRIX_SHAPES = ['circle', 'square', 'triangle', 'diamond'];
const COUNTS = [1, 2, 3];
const FILLS = ['solid', 'hollow'];

function cellKey(c) { return `${c.shape}|${c.count}|${c.rot}|${c.fill}`; }

// VISUAL key — rotation is only perceptible on a triangle (circle/square/
// diamond are ~symmetric under 90° steps), so normalize rot to 0 for those.
// Used to dedup OPTIONS so no two answer tiles look identical.
function visualKey(c) {
  const rot = c.shape === 'triangle' ? (((c.rot % 4) + 4) % 4) : 0;
  return `${c.shape}|${c.count}|${rot}|${c.fill}`;
}

// Returns a function value(index) for a dimension given a rule + a base.
function dimSequence(rng, dim) {
  if (dim === 'count') {
    const order = shuffle(rng, COUNTS);                  // e.g. [1,2,3] in some order
    return (i) => order[i];
  }
  if (dim === 'shape') {
    const triple = shuffle(rng, MATRIX_SHAPES).slice(0, 3);
    return (i) => triple[i];
  }
  if (dim === 'fill') {
    const start = randInt(rng, 0, 1);
    return (i) => FILLS[(start + i) % 2];                // alternates
  }
  if (dim === 'rot') {
    const start = randInt(rng, 0, 3);
    const step = pick(rng, [1, 1, 2, 3]);
    return (i) => (start + step * i) % 4;
  }
  return () => 0;
}

// hardness: 2 → two rules (col + row), 3 → three rules (col + row + a diagonal
// trap on a third dimension). Distractors are "rule violations" — the cell you
// land on if you misread exactly one rule — so they can't be eliminated by
// surface features alone.
function makeMatrixItem(rng, id, hardness) {
  const dims = shuffle(rng, ['count', 'shape', 'fill', 'rot']);
  // If 'rot' is a varying rule, the varying shape can't also be 'shape'
  // (rotating different shapes is unreadable). Drop 'shape' when 'rot' is used.
  let ruleDims = dims.slice(0, hardness >= 3 ? 3 : 2);
  if (ruleDims.includes('rot') && ruleDims.includes('shape')) {
    ruleDims = ruleDims.filter(d => d !== 'shape');
    if (ruleDims.length < (hardness >= 3 ? 3 : 2)) {
      for (const d of ['count', 'fill']) if (!ruleDims.includes(d)) { ruleDims.push(d); break; }
    }
  }
  const [colDim, rowDim, diagDim] = ruleDims;
  const colSeq = dimSequence(rng, colDim);
  const rowSeq = dimSequence(rng, rowDim);
  const diagSeq = diagDim ? dimSequence(rng, diagDim) : null;

  const usesRot = ruleDims.includes('rot');
  const base = {
    shape: usesRot ? 'triangle' : pick(rng, MATRIX_SHAPES),
    count: randInt(rng, 1, 3),
    rot: 0,
    fill: pick(rng, FILLS),
  };
  const cellAt = (r, c) => {
    const cell = { ...base };
    cell[colDim] = colSeq(c);
    cell[rowDim] = rowSeq(r);
    if (diagDim) cell[diagDim] = diagSeq((r + c) % 3); // diagonal/third rule
    return cell;
  };

  const grid = [0, 1, 2].map(r => [0, 1, 2].map(c => cellAt(r, c)));
  const correct = grid[2][2];
  grid[2][2] = null;

  // Rule-violation distractors: rebuild the target cell but read ONE rule from
  // the wrong index (a neighbouring row/col), which is the classic near-miss.
  const opts = [{ ...correct }];
  const seen = new Set([visualKey(correct)]);
  const violations = [
    () => { const c = cellAt(2, 2); c[colDim] = colSeq(1); return c; }, // wrong column read
    () => { const c = cellAt(2, 2); c[rowDim] = rowSeq(1); return c; }, // wrong row read
    () => { const c = cellAt(2, 2); c[colDim] = colSeq(0); return c; },
    () => { const c = cellAt(2, 2); c[rowDim] = rowSeq(0); return c; },
    () => ({ ...correct, count: pick(rng, COUNTS.filter(v => v !== correct.count)) }),
    () => ({ ...correct, fill: FILLS.find(v => v !== correct.fill) }),
    () => ({ ...correct, shape: pick(rng, MATRIX_SHAPES.filter(v => v !== correct.shape && !usesRot || v === 'triangle')) || pick(rng, MATRIX_SHAPES.filter(v => v !== correct.shape)) }),
  ];
  const order0 = shuffle(rng, violations);
  let gi = 0, guard = 0;
  while (opts.length < 6 && guard++ < 80) {
    const cand = order0[gi % order0.length](); gi++;
    const vk = visualKey(cand);
    if (!seen.has(vk)) { seen.add(vk); opts.push(cand); }
  }
  // Safety top-up with always-visible feature combos.
  while (opts.length < 6) {
    const cand = { ...correct, count: ((correct.count + opts.length) % 3) + 1, fill: pick(rng, FILLS), shape: usesRot ? 'triangle' : pick(rng, MATRIX_SHAPES) };
    const vk = visualKey(cand);
    if (!seen.has(vk)) { seen.add(vk); opts.push(cand); }
  }
  const order = shuffle(rng, opts.slice(0, 6));
  const correctIndex = order.findIndex(o => visualKey(o) === visualKey(correct));
  return {
    id, subtest: 'matrix', grid, options: order, correctIndex,
    timeMs: 34000,
    key: `m:${grid.map(row => row.map(c => c ? cellKey(c) : '_').join(',')).join(';')}`,
  };
}

// ── Number Series ────────────────────────────────────────────────────────────
function makeNumberSeriesItem(rng, id) {
  const type = pick(rng, ['geom', 'alt', 'fib', 'sqstep', 'muladd', 'seconddiff']);
  let terms = [];
  if (type === 'geom') {
    const start = randInt(rng, 2, 5), ratio = randInt(rng, 2, 3);
    for (let i = 0; i < 5; i++) terms.push(start * Math.pow(ratio, i));
  } else if (type === 'alt') {
    // two interleaved arithmetic sequences (one ascending, one descending)
    const s1 = randInt(rng, 1, 6), d1 = randInt(rng, 3, 8);
    const s2 = randInt(rng, 30, 50), d2 = randInt(rng, 3, 8);
    for (let i = 0; i < 3; i++) { terms.push(s1 + d1 * i); terms.push(s2 - d2 * i); }
    terms = terms.slice(0, 6);
  } else if (type === 'fib') {
    let a = randInt(rng, 2, 6), b = randInt(rng, 3, 8);
    terms = [a, b];
    for (let i = 0; i < 4; i++) { const n = a + b; terms.push(n); a = b; b = n; }
  } else if (type === 'sqstep') { // increasing step (+s,+(s+1),...)
    let v = randInt(rng, 2, 7), step = randInt(rng, 2, 4);
    terms = [v];
    for (let i = 0; i < 5; i++) { v += step; terms.push(v); step++; }
  } else if (type === 'muladd') { // xK then +M
    const k = randInt(rng, 2, 3), m = randInt(rng, 1, 5);
    let v = randInt(rng, 1, 4); terms = [v];
    for (let i = 0; i < 4; i++) { v = v * k + m; terms.push(v); }
  } else { // seconddiff: differences grow by a constant (e.g. +2,+5,+8 → diff of diffs = 3)
    const d0 = randInt(rng, 2, 5), dd = randInt(rng, 2, 4);
    let v = randInt(rng, 1, 6), d = d0; terms = [v];
    for (let i = 0; i < 5; i++) { v += d; terms.push(v); d += dd; }
  }
  const answer = terms[terms.length - 1];
  const shown = terms.slice(0, terms.length - 1);
  const distracts = new Set([answer]);
  const opts = [answer];
  let guard = 0;
  while (opts.length < 5 && guard++ < 40) {
    const delta = pick(rng, [-3, -2, -1, 1, 2, 3, answer > 10 ? Math.round(answer / 2) : 5, -Math.round(answer / 3) || -4]);
    const cand = answer + delta;
    if (cand > 0 && !distracts.has(cand)) { distracts.add(cand); opts.push(cand); }
  }
  while (opts.length < 5) { const c = answer + opts.length + 1; if (!distracts.has(c)) { distracts.add(c); opts.push(c); } }
  const order = shuffle(rng, opts);
  return {
    id, subtest: 'number',
    prompt: `${shown.join(',  ')},  ?`,
    options: order.map(String),
    correctIndex: order.indexOf(answer),
    timeMs: 22000,
    key: `n:${shown.join(',')}=${answer}`,
  };
}

// ── Letter Series ─────────────────────────────────────────────────────────────
const A = 'A'.charCodeAt(0);
const toL = (n) => String.fromCharCode(A + (((n % 26) + 26) % 26));
function makeLetterSeriesItem(rng, id) {
  const type = pick(rng, ['arith', 'alt', 'accel']);
  let nums = [];
  if (type === 'arith') {
    const start = randInt(rng, 0, 12), step = randInt(rng, 1, 4);
    for (let i = 0; i < 6; i++) nums.push(start + step * i);
  } else if (type === 'alt') {
    const s1 = randInt(rng, 0, 8), d1 = randInt(rng, 1, 3);
    const s2 = randInt(rng, 14, 22), d2 = randInt(rng, 1, 3);
    for (let i = 0; i < 3; i++) { nums.push(s1 + d1 * i); nums.push(s2 - d2 * i); }
    nums = nums.slice(0, 6);
  } else { // accelerating step
    let v = randInt(rng, 0, 6), step = 1;
    nums = [v];
    for (let i = 0; i < 5; i++) { v += step; nums.push(v); step++; }
  }
  const answer = toL(nums[nums.length - 1]);
  const shown = nums.slice(0, nums.length - 1).map(toL);
  const opts = [answer];
  const seen = new Set([answer]);
  let guard = 0;
  while (opts.length < 5 && guard++ < 40) {
    const cand = toL(nums[nums.length - 1] + pick(rng, [-2, -1, 1, 2, 3, -3]));
    if (!seen.has(cand)) { seen.add(cand); opts.push(cand); }
  }
  while (opts.length < 5) { const c = toL(nums[nums.length - 1] + opts.length + 1); if (!seen.has(c)) { seen.add(c); opts.push(c); } }
  const order = shuffle(rng, opts);
  return {
    id, subtest: 'letter',
    prompt: `${shown.join(',  ')},  ?`,
    options: order,
    correctIndex: order.indexOf(answer),
    timeMs: 22000,
    key: `l:${shown.join(',')}=${answer}`,
  };
}

// ── Battery builder ───────────────────────────────────────────────────────────
// 12 items: 6 matrix (mix of 1- and 2-rule), 3 number, 3 letter. excludeKeys
// lets the caller guarantee Form B is disjoint from Form A.
export const FORM_SEED_OFFSET = { A: 0, B: 0x9e3779b9 };

export function buildForm(form = 'A', seed = 1, excludeKeys = new Set()) {
  const rng = makeRng((seed >>> 0) ^ (FORM_SEED_OFFSET[form] || 0));
  const items = [];
  const used = new Set(excludeKeys);
  const addUnique = (factory) => {
    for (let attempt = 0; attempt < 30; attempt++) {
      const it = factory(items.length + 1);
      if (!used.has(it.key)) { used.add(it.key); items.push(it); return; }
    }
    // give up uniqueness after retries (astronomically rare) — still push
    items.push(factory(items.length + 1));
  };
  // All matrices use ≥2 rules; the last two use 3 rules (harder).
  for (let i = 0; i < 6; i++) addUnique((id) => makeMatrixItem(rng, id, i >= 4 ? 3 : 2));
  for (let i = 0; i < 3; i++) addUnique((id) => makeNumberSeriesItem(rng, id));
  for (let i = 0; i < 3; i++) addUnique((id) => makeLetterSeriesItem(rng, id));
  return { form, seed, items };
}

export const SUBTEST_LABELS = {
  matrix: 'Matrix Reasoning',
  number: 'Number Series',
  letter: 'Letter Series',
};
