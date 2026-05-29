// ICAR item bank — public-domain items (International Cognitive Ability
// Resource; Condon & Revelle 2014). Two parallel 12-item forms:
//   Form A = baseline (pre), Form B = follow-up (post).
// They are DISJOINT item sets, so pre/post has minimal memorization.
//
// Item shape: { id, domain, kind, prompt, imageUrl?|text via prompt,
//   options[], correctIndex, irt?:{a,b,c} }.
// `domain`: 'matrix' | 'verbal' | 'series' | 'rotation'.
// Matrix/rotation are images (under public/assets/icar/...); verbal/series are
// text. IRT params are absent for now → scoring uses the published raw-norm
// path and upgrades to EAP automatically if params are added later.

const MATRIX_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'None of these', "I don't know"];
const ROTATION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export const ICAR_DOMAIN_LABELS = {
  matrix: 'Matrix Reasoning',
  verbal: 'Verbal Reasoning',
  series: 'Letter-Number Series',
  rotation: '3-D Rotation',
};

const FORM_A = [
  { id: 'AM1', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formA/matrices/AM1.jpg', options: MATRIX_OPTIONS, correctIndex: 3 },
  { id: 'AM2', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formA/matrices/AM2.jpg', options: MATRIX_OPTIONS, correctIndex: 2 },
  { id: 'AM3', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formA/matrices/AM3.jpg', options: MATRIX_OPTIONS, correctIndex: 0 },
  { id: 'AM4', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formA/matrices/AM4.jpg', options: MATRIX_OPTIONS, correctIndex: 4 },
  { id: 'AM5', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formA/matrices/AM5.jpg', options: MATRIX_OPTIONS, correctIndex: 4 },
  { id: 'VR1', domain: 'verbal', kind: 'verbal', prompt: 'Joshua is 12 years old and his sister is three times as old as he. When Joshua is 23 years old, how old will his sister be?', options: ['35', '39', '44', '47', '53', '57', 'None of these', "I don't know"], correctIndex: 3 },
  { id: 'VR2', domain: 'verbal', kind: 'verbal', prompt: 'What number is one fifth of one fourth of one ninth of 900?', options: ['2', '3', '4', '5', '6', '7', 'None of these', "I don't know"], correctIndex: 3 },
  { id: 'VR3', domain: 'verbal', kind: 'verbal', prompt: 'Mark the word that does not match the others: (1) Sycamore (2) Buckeye (3) Elm (4) Daffodil (5) Hickory (6) Sequoia', options: ['1', '2', '3', '4', '5', '6', 'None of these', "I don't know"], correctIndex: 3 },
  { id: 'SR1', domain: 'series', kind: 'series', prompt: 'In the following number series, what number comes next?  64, 81, 100, 121, 144, …', options: ['154', '156', '162', '169', '178', '196', 'None of these', "I don't know"], correctIndex: 3 },
  { id: 'SR2', domain: 'series', kind: 'series', prompt: 'In the following alphanumeric series, what letter comes next?  Q, S, N, P, L, …', options: ['J', 'H', 'I', 'N', 'M', 'L', 'None of these', "I don't know"], correctIndex: 3 },
  { id: 'AR1', domain: 'rotation', kind: 'rotation', prompt: 'Choose the rotated shape that matches the target.', imageUrl: '/assets/icar/formA/rotation/AR1.jpg', options: ROTATION_OPTIONS, correctIndex: 5 },
  { id: 'AR2', domain: 'rotation', kind: 'rotation', prompt: 'Choose the rotated shape that matches the target.', imageUrl: '/assets/icar/formA/rotation/AR2.jpg', options: ROTATION_OPTIONS, correctIndex: 1 },
];

const FORM_B = [
  { id: 'BM1', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formB/matrices/BM1.jpg', options: MATRIX_OPTIONS, correctIndex: 1 },
  { id: 'BM2', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formB/matrices/BM2.jpg', options: MATRIX_OPTIONS, correctIndex: 2 },
  { id: 'BM3', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formB/matrices/BM3.jpg', options: MATRIX_OPTIONS, correctIndex: 4 },
  { id: 'BM4', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formB/matrices/BM4.jpg', options: MATRIX_OPTIONS, correctIndex: 3 },
  { id: 'BM5', domain: 'matrix', kind: 'matrix', prompt: 'Choose the option that best completes the matrix.', imageUrl: '/assets/icar/formB/matrices/BM5.jpg', options: MATRIX_OPTIONS, correctIndex: 3 },
  { id: 'BVR1', domain: 'verbal', kind: 'verbal', prompt: 'The opposite of a "stubborn" person is a "_____" person.', options: ['Flexible', 'Passionate', 'Mediocre', 'Reserved', 'Pigheaded', 'Persistent', 'None of these', "I don't know"], correctIndex: 0 },
  { id: 'BVR2', domain: 'verbal', kind: 'verbal', prompt: 'Adam and Melissa caught a total of 32 salmon. Melissa caught three times as many as Adam. How many did Adam catch?', options: ['7', '8', '9', '10', '11', '12', 'None of these', "I don't know"], correctIndex: 1 },
  { id: 'BVR3', domain: 'verbal', kind: 'verbal', prompt: 'Mark the one that does not match the others: (1) Buenos Aires (2) Melbourne (3) Seattle (4) Cairo (5) Morocco (6) Milan', options: ['Buenos Aires', 'Melbourne', 'Seattle', 'Cairo', 'Morocco', 'Milan', 'None of these', "I don't know"], correctIndex: 4 },
  { id: 'BSR1', domain: 'series', kind: 'series', prompt: 'In the following alphanumeric series, what letter comes next?  I, J, L, O, S, …', options: ['T', 'U', 'V', 'X', 'Y', 'Z', 'None of these', "I don't know"], correctIndex: 3 },
  { id: 'BSR2', domain: 'series', kind: 'series', prompt: 'In the following alphanumeric series, what letter comes next?  V, Q, M, J, H, …', options: ['E', 'F', 'G', 'H', 'I', 'J', 'None of these', "I don't know"], correctIndex: 2 },
  { id: 'BR1', domain: 'rotation', kind: 'rotation', prompt: 'Choose the rotated shape that matches the target.', imageUrl: '/assets/icar/formB/rotation/BR1.jpg', options: ROTATION_OPTIONS, correctIndex: 6 },
  { id: 'BR2', domain: 'rotation', kind: 'rotation', prompt: 'Choose the rotated shape that matches the target.', imageUrl: '/assets/icar/formB/rotation/BR2.jpg', options: ROTATION_OPTIONS, correctIndex: 2 },
];

// 'full' = all 24 items as one deep test (most reliable single estimate).
export const ICAR_FORMS = { A: FORM_A, B: FORM_B, full: [...FORM_A, ...FORM_B] };

// Soft per-item time caps (generous — ICAR is near-untimed). Timeout = no credit.
const TIME_CAP_MS = { matrix: 75000, rotation: 75000, verbal: 50000, series: 50000 };

export function buildIcarForm(form = 'A') {
  const items = (ICAR_FORMS[form] || FORM_A).map(it => ({ ...it, timeMs: TIME_CAP_MS[it.domain] || 60000 }));
  return { form, items };
}

// Sanity check used by tests: every item has exactly one in-range correct
// option, forms are disjoint, and 4 domains are present.
export function validateForms() {
  const issues = [];
  for (const [form, items] of Object.entries(ICAR_FORMS)) {
    items.forEach(it => {
      if (it.correctIndex < 0 || it.correctIndex >= it.options.length) issues.push(`${it.id}: bad correctIndex`);
      if (!it.imageUrl && !it.prompt) issues.push(`${it.id}: no stem`);
    });
    const domains = new Set(items.map(i => i.domain));
    if (domains.size < 4) issues.push(`form ${form}: only ${domains.size} domains`);
  }
  const idsA = new Set(FORM_A.map(i => i.id));
  if (FORM_B.some(i => idsA.has(i.id))) issues.push('forms A/B share item ids');
  return issues;
}
