// The moving-advert mirror (Ad Studio step 4, 3 Oct 2026).
//
// AdMotion.tsx builds every advert from the look library, the brand fonts and the motion that
// creslo-frontend uses in Ad Studio. They are copied here byte for byte (src/lib/ad), so the video
// is exactly what the owner saw in the card. A copy that drifts would quietly make videos that no
// longer match - so `npm test` (which runs before every `npm run deploy`) compares them with the
// frontend's own files when the frontend folder sits beside this one (C:\dev\creslo-frontend).
//
// Usage:  node src/test/ad-mirror.test.js      (exit 0 = pass, 1 = fail)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HERE = path.join(__dirname, '..', 'lib', 'ad');
const FRONT = path.join(__dirname, '..', '..', '..', 'creslo-frontend', 'src', 'lib');
const FILES = ['adStudioEngine.ts', 'brandFonts.ts', 'adMotion.ts'];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

let fail = 0;
if (!fs.existsSync(FRONT)) {
  console.log('  skip  creslo-frontend is not beside this folder - mirror not compared');
  process.exit(0);
}
for (const f of FILES) {
  const a = path.join(HERE, f), b = path.join(FRONT, f);
  if (!fs.existsSync(a)) { console.log('  FAIL ' + f + ' is missing from src/lib/ad'); fail++; continue; }
  if (!fs.existsSync(b)) { console.log('  FAIL ' + f + ' is missing from creslo-frontend/src/lib'); fail++; continue; }
  if (sha(a) !== sha(b)) { console.log('  FAIL ' + f + ' differs from creslo-frontend - copy the frontend file over this one'); fail++; }
  else console.log('  ok   ' + f + ' matches creslo-frontend');
}
console.log(fail ? `\n${fail} mirror file(s) out of step. Do not deploy.` : '\nThe advert mirror matches.');
process.exit(fail ? 1 : 0);
