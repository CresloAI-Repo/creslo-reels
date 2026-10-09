# creslo-reels — agent guide

## PRIME DIRECTIVE: NEVER DESIGN BLIND
Full doctrine: `C:\Users\HP User\iCloudDrive\Creslo\02 Product\Creslo-Creative-Doctrine.md`.
Any visual change to compositions in this repo MUST be verified by looking at rendered
frames before it is reported as done. The deployed interactive Remotion Studio (last
deployed bundle) is at:
https://remotionlambda-useast1-anxcjdkwnh.s3.us-east-1.amazonaws.com/sites/creslo-reels/index.html
(compositions ReelVideo + CresloPromo; props editable — exercise beat_type text/cta/mockup,
brandColor/brandName/brandLogo). For uncommitted changes: `npm run studio` locally, or flag
"needs visual verification after redeploy" explicitly in your report.

## Mirror discipline
Captions.tsx / Beat.tsx / ReelVideo.tsx / lib/types.ts shared sections MUST stay
byte-identical with creslo-frontend/src/remotion/* (the live preview). Every composition
change requires a Lambda site redeploy to affect customer renders:
`npx remotion lambda sites create src/index.ts --site-name=creslo-reels`

**Checked, not just asked (October audit RL-01/RL-02, 7 Oct 2026).** The app's preview had drifted:
the hook played beat 1's clip instead of its own, the preview ran about a second long (black at the
end - the cut overlaps were not taken off), and an unknown caption style showed as Pop. `npm test`
now runs `src/test/reel-mirror.test.js`, which fails if `lib/types.ts` (from "Frames each
cross-scene transition overlaps" to the end) or ReelVideo's caption-style fallback differs from the
app's copy. Change one, copy it to the other in the same sitting.
Since the October reels audit R1 (8 Oct 2026) it also compares the MUSIC MIX block in ReelVideo.tsx and the
`const SAFE` line (the caption safe area, the apps' own buttons kept clear) in Captions.tsx / the app's ReelVideo.tsx.
The GitHub deploy checks the app out read-only (secret `FRONTEND_READ_TOKEN`) and runs `npm test`;
on GitHub a missing app is a FAIL, never a skip. On your computer the app must sit beside this
folder (C:\dev\creslo-frontend), or set `CRESLO_FRONTEND_DIR`.

Since the reels premium passes (8 Oct 2026, project doc `claude/reels-premium-audit-2026-10-08.md`) it also compares
SPOKEN CAPTIONS (Captions.tsx), THE LOOK (Beat.tsx: tone, film finish, still ground), the TEXT POCKET behind the words,
the plain cut, the dissolve, the reel's mood and which cut goes where, and the still per beat (ReelVideo.tsx).
No cut and no beat zooms since P2b (Daniel: "the jumpy zoom transitions") - keep it that way unless he asks. Every one of these
needs the Lambda site redeployed before customer renders change.

## Moving adverts mirror (3 Oct 2026)
`src/lib/ad/` (adStudioEngine.ts, brandFonts.ts, adMotion.ts) are byte-identical copies of
creslo-frontend/src/lib. `AdMotion.tsx` builds the advert from them out of PLAIN DATA only - never
HTML or CSS from a request - and escapes every word itself. `npm test` (run by `npm run deploy`)
fails if the copies drift: copy the frontend files over, never edit these by hand.

## Brand rule
The Creslo logo is ALWAYS the rounded-square OUTLINE containing the serif "C." mark.

## PROOF CONSTANT (Daniel's standing order, 2026-07-10)
Nothing is handed to Daniel or shipped to users unproofed. Full law: Creslo/02
Product/Creslo-Creative-Doctrine.md sections 1.5-1.8 (§1.7 Ad Charter + §1.8 Agency
Design Spec are LAW for every composition and export in this repo). The short version:
1. BEFORE presenting any artifact: run the mechanical lint (markup balance, defined
   animations, rotate-flatten, smart-layer content zone) AND look at it.
2. AFTER any deploy (Vercel UI / Lambda site): the AGENT verifies the deployed result
   in the browser first - screenshots, self-critique, fix - THEN hands over. Daniel's
   eyes are for taste verdicts, never for catching defects.
3. Readability law: text always on a contrasting ground, never across a contrast
   boundary; angles under type <= 15 degrees; shadows must actually contrast.
