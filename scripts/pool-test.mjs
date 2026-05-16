import { RELATIONSHIP_CATEGORIES } from '../src/lib/gameConstants.js';
import { createGameState, generateNextStimulus, advanceRound } from '../src/lib/gameEngine.js';

const cases = [
  ['Only SPATIAL_3D + alien_cube',                  RELATIONSHIP_CATEGORIES.SPATIAL_3D, ['alien_cube']],
  ['Only SPATIAL_3D + alien_square',                RELATIONSHIP_CATEGORIES.SPATIAL_3D, ['alien_square']],
  ['Only SPATIAL_3D + alien_tesseract',             RELATIONSHIP_CATEGORIES.SPATIAL_3D, ['alien_tesseract']],
  ['Only TRAIT + alien_cube',                       RELATIONSHIP_CATEGORIES.TRAIT, ['alien_cube']],
  ['Only COMPLEX + alien_cube',                     RELATIONSHIP_CATEGORIES.COMPLEX, ['alien_cube']],
  ['Only SPATIAL_3D + alien_cube + type_nback',     RELATIONSHIP_CATEGORIES.SPATIAL_3D, ['alien_cube', 'type_nback']],
  ['Only SPATIAL_3D + alien_cube + distractors',    RELATIONSHIP_CATEGORIES.SPATIAL_3D, ['alien_cube', 'distractors']],
  ['Only SPATIAL_3D + alien_cube + 2 streams',      RELATIONSHIP_CATEGORIES.SPATIAL_3D, ['alien_cube']],
];

for (const [label, pool, modes] of cases) {
  const extraStreams = label.includes('2 streams') ? [{ key: 'KeyA', keyDisplay: 'A' }] : [];
  let state = createGameState({ nLevel: 2, modes, relationshipPool: pool, totalRounds: 200, extraStreams });
  const seen = new Map();
  const seenExtra = new Map();
  let leaks = 0;
  let leaksExtra = 0;
  for (let i = 0; i < 200; i++) {
    const s = generateNextStimulus(state);
    state = advanceRound(state, s);
    seen.set(state.currentRelationship, (seen.get(state.currentRelationship) || 0) + 1);
    if (!pool.includes(state.currentRelationship)) leaks++;
    (state.extraCurrentRels || []).forEach(r => {
      seenExtra.set(r, (seenExtra.get(r) || 0) + 1);
      if (r && !pool.includes(r)) leaksExtra++;
    });
  }
  const verdict = (leaks === 0 && leaksExtra === 0) ? 'OK    ' : `LEAK A=${leaks} B=${leaksExtra}`;
  console.log(`${verdict} | ${label}`);
  console.log('   A seen:', [...seen.entries()].map(([r, c]) => `${r}=${c}`).join(' '));
  if (seenExtra.size > 0) console.log('   B seen:', [...seenExtra.entries()].map(([r, c]) => `${r}=${c}`).join(' '));
}
