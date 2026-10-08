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
//   2. the caption-style fallback in ReelVideo.tsx with the app's ReelVideo.tsx.
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

console.log(fail ? `\n${fail} reel mirror part(s) out of step. Do not deploy.` : '\nThe reel mirror matches.');
process.exit(fail ? 1 : 0);
