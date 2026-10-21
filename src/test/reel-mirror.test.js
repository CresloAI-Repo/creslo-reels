// The reel mirror (October audit RL-01, 7 Oct 2026).
//
// The app's reel preview (creslo-frontend/src/remotion) and this export draw the same reel from
// copies of the same code. Three copies had drifted, so the preview could show what the video
// would not: the hook on beat 1's clip instead of its own, about a second of black at the end
// (the cut overlaps were not taken off the length), and Pop for a caption style the video
// would have picked by hash. This test fails the moment those parts drift again.
//
// It compares, after turning Windows line endings into plain ones:
//   1. lib/types.ts from "Frames each cross-scene transition overlaps" to the end - the cut
//      overlap, the beat list and the length - with the same part of the app's reelTypes.ts;
//   2. the caption-style fallback in ReelVideo.tsx with the app's ReelVideo.tsx;
//   3. the music mix and the caption safe area (8 Oct 2026);
//   4. the spoken captions and each beat's spoken words (reels premium pass P1, 8 Oct 2026);
//   5. the look: tone, film finish, still grounds and the cut rules (P2, 8 Oct 2026; no zooms since P2b);
//   6. the sped-up tag (B2); 7. a character on a card (C1) and the loop ending (C2), 21 Oct 2026.
//
// Usage:  node src/test/reel-mirror.test.js      (exit 0 = pass, 1 = fail)
// The app's folder: CRESLO_FRONTEND_DIR if set, else creslo-frontend beside this folder.
// Without it the test skips on your computer, and FAILS on GitHub (CI is set there), so the
// deploy can never pass by not looking.
const fs = require('fs');
const path = require('path');

const FRONT = process.env.CRESLO_FRONTEND_DIR
  ? path.resolve(process.env.CRESLO_FRONTEND_DIR)
  : path.join(__dirname, '..', '..', '..', 'creslo-frontend');
const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

if (!fs.existsSync(path.join(FRONT, 'src', 'remotion'))) {
  if (process.env.CI) {
    console.log('  FAIL creslo-frontend was not checked out beside this repo - the reel mirror cannot be compared');
    process.exit(1);
  }
  console.log('  skip  creslo-frontend is not beside this folder - reel mirror not compared');
  process.exit(0);
}

let fail = 0;
const same = (label, a, b) => {
  if (a === null || b === null) { console.log('  FAIL ' + label + ' - could not find it in both files'); fail++; return; }
  if (a !== b) { console.log('  FAIL ' + label + ' differs between the export and the app preview'); fail++; return; }
  console.log('  ok   ' + label);
};

// 1. The timeline.
const MARK = '// Frames each cross-scene transition overlaps';
const fromMark = (s) => { const i = s.indexOf(MARK); return i < 0 ? null : s.slice(i); };
same('beat list, cut overlap and length (types.ts / reelTypes.ts)',
  fromMark(read(path.join(__dirname, '..', 'lib', 'types.ts'))),
  fromMark(read(path.join(FRONT, 'src', 'remotion', 'reelTypes.ts'))));

// 2. The caption-style fallback.
const fallback = (s) => {
  const list = s.match(/^const FALLBACK_STYLES = .*$/m);
  const pick = s.match(/^ {2}const captionStyle = CAPTION_STYLE_KEYS\.includes[\s\S]*?FALLBACK_STYLES\.length\]$/m);
  return list && pick ? list[0] + '\n' + pick[0] : null;
};
same('caption-style fallback (ReelVideo.tsx)',
  fallback(read(path.join(__dirname, '..', 'ReelVideo.tsx'))),
  fallback(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx'))));

// 3. The music mix and the caption safe area (October reels audit R1, 8 Oct 2026).
const block = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b); return i < 0 || j < 0 ? null : s.slice(i, j); };
same('music mix (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '// ---- MUSIC MIX', '// ---- end MUSIC MIX'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '// ---- MUSIC MIX', '// ---- end MUSIC MIX'));
const safe = (s) => { const m = s.match(/^const SAFE = .*$/m); return m ? m[0] : null; };
same('caption safe area (Captions.tsx / ReelVideo.tsx)',
  safe(read(path.join(__dirname, '..', 'components', 'Captions.tsx'))),
  safe(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx'))));

// 4. Spoken captions and the spoken words per beat (reels premium pass P1, 8 Oct 2026).
same('spoken captions (Captions.tsx / ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'components', 'Captions.tsx')), '// ===== SPOKEN CAPTIONS', '// ===== END SPOKEN CAPTIONS'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '// ===== SPOKEN CAPTIONS', '// ===== END SPOKEN CAPTIONS'));
same('spoken words per beat (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '  // Spoken captions (reels premium pass P1, 8 Oct 2026): the beat', '\n  // ---- MUSIC MIX'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '  // Spoken captions (reels premium pass P1, 8 Oct 2026): the beat', '\n  // ---- MUSIC MIX'));

// 5. The look: tone, film finish, still grounds, and the cut rules (reels premium pass P2; P2b took the zooms out).
same('the look (Beat.tsx / ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'components', 'Beat.tsx')), '// ===== THE LOOK', '// ===== END THE LOOK'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '// ===== THE LOOK', '// ===== END THE LOOK'));
same('plain cut (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '// A plain cut (reels premium pass P2', '// A dissolve and nothing else'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '// A plain cut (reels premium pass P2', '// A dissolve and nothing else'));
same('each clip starts at its chosen point (Beat.tsx)',
  block(read(path.join(__dirname, '..', 'components', 'Beat.tsx')), '          // Starts a moment in when the backend chose', "objectFit: 'cover' }} />\n        ) : poster"),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '          // Starts a moment in when the backend chose', "objectFit: 'cover' }} />\n        ) : poster"));
same('dissolve, no zoom (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '// A dissolve and nothing else', 'export const ReelVideo'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '// A dissolve and nothing else', 'export const ReelVideo'));
same('the reel\'s mood and its cuts (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '  const whipPan = (dir', '  const seqFrames'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '  const whipPan = (dir', '  const seqFrames'));
same('which cut goes where (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '        // CUTS (reels premium pass P2', '        cuts.push({ at: s, cut })'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '        // CUTS (reels premium pass P2', '        cuts.push({ at: s, cut })'));
same('still per beat (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '  // The look, per beat (reels premium pass P2', '\n  // ---- MUSIC MIX'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '  // The look, per beat (reels premium pass P2', '\n  // ---- MUSIC MIX'));

same('text pocket behind the words (Beat.tsx)',
  block(read(path.join(__dirname, '..', 'components', 'Beat.tsx')), '      {/* TEXT POCKET (P2)', '\n      <FilmFinish frame={frame} />'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '      {/* TEXT POCKET (P2)', '\n      <FilmFinish frame={frame} />'));

// 6. Own clips sped up (reels brief B2, 21 Oct 2026): the speed and the "Sped up" tag draw the same in both.
same('sped-up tag (Beat.tsx / ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'components', 'Beat.tsx')), '      {/* ---- SPED UP TAG', '      {/* ---- end SPED UP TAG */}'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '      {/* ---- SPED UP TAG', '      {/* ---- end SPED UP TAG */}'));

// 7. A character on a card (reels brief C1) and the loop ending (C2), 21 Oct 2026.
same('character on a card (Beat.tsx / ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'components', 'Beat.tsx')), '// ---- CHARACTER ON A CARD', '// ---- end CHARACTER ON A CARD'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '// ---- CHARACTER ON A CARD', '// ---- end CHARACTER ON A CARD'));
same('one beat as drawn (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '  // One beat as drawn:', 'character={b.character} />'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '  // One beat as drawn:', 'character={b.character} />'));
same('loop ending (ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'ReelVideo.tsx')), '      {/* ---- LOOP ENDING', '      {/* ---- end LOOP ENDING */}'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '      {/* ---- LOOP ENDING', '      {/* ---- end LOOP ENDING */}'));

// 8. The opening words already there on frame 0 (Daniel, 21 Oct 2026, decision 3 A).
same('opening words on frame 0 (Beat.tsx / ReelVideo.tsx)',
  block(read(path.join(__dirname, '..', 'components', 'Beat.tsx')), '          // ---- OPENING WORDS ON FRAME 0', '          // ---- end OPENING WORDS ON FRAME 0'),
  block(read(path.join(FRONT, 'src', 'remotion', 'ReelVideo.tsx')), '          // ---- OPENING WORDS ON FRAME 0', '          // ---- end OPENING WORDS ON FRAME 0'));

console.log(fail ? `\n${fail} reel mirror part(s) out of step. Do not deploy.` : '\nThe reel mirror matches.');
process.exit(fail ? 1 : 0);
