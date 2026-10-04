// MOVING ADVERTS (step 4 of the premium adverts, Daniel 3 Oct 2026: "Match the look", free with a cap,
// and a Still / Motion switch so a still version is always there).
//
// The same finished advert, brought in over six seconds: the photo pushes in slowly while the words
// arrive in order - logo, eyebrow, headline, line, tags, badge, button, web address. Three styles:
//   settle  a calm rise and fade (light, editorial looks)
//   reveal  the words wipe in from the left (looks built from type, with no photo)
//   pop     springy, with a nudge on the button near the end (bold and dark photo looks)
//
// Pure DOM and arithmetic, no React and no timers, so it is frame-exact: applyMotion(root, style, ms)
// puts the advert in the state it has at that moment, whatever moment it was in before. Ad Studio
// plays it in the card for free (requestAnimationFrame); the video renderer (creslo-reels
// AdMotion.tsx) calls it once per frame. MIRRORED byte for byte in creslo-reels/src/lib/ad/adMotion.ts
// - change both or neither (creslo-reels `npm test` compares them).
//
// Parts are found by the same class names Reposition uses (lib/adParts ROLES), so every look moves
// with no per-look code.

export type MotionStyle = 'settle' | 'reveal' | 'pop'
export const MOTION_STYLES: { key: MotionStyle; label: string }[] = [
  { key: 'settle', label: 'Settle' },
  { key: 'reveal', label: 'Reveal' },
  { key: 'pop', label: 'Pop' },
]
export const MOTION_SECONDS = 6
export const MOTION_FPS = 30
// the card replays it after a short hold on the finished advert
export const MOTION_HOLD_MS = 1500

// ---- easing ------------------------------------------------------------------------------------
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1, b = (p1: number, p2: number) => 3 * p2 - 6 * p1, c = (p1: number) => 3 * p1
  const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t
  const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1)
  return (x: number) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) { const s = slope(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (at(t, x1, x2) - x) / s }
    return at(Math.min(1, Math.max(0, t)), y1, y2)
  }
}
export const EASE = {
  out: bezier(0.2, 0.7, 0.2, 1),
  inOut: bezier(0.65, 0, 0.35, 1),
  spring: bezier(0.34, 1.56, 0.64, 1),
  linear: (x: number) => Math.min(1, Math.max(0, x)),
}
// progress of one part's entrance at time ms: 0 before it starts, 1 once it has arrived
export function progress(ms: number, delay: number, dur: number, ease: (x: number) => number) {
  return ease((ms - delay) / dur)
}

// ---- which style suits a look --------------------------------------------------------------------
// A look with no photo is built from type: its words wipe in. A light look settles; a dark or loud
// one pops. The owner can always pick another on the card.
export function motionStyleFor(root: HTMLElement, mood?: string): MotionStyle {
  if (!photoFrames(root).length) return 'reveal'
  return mood === 'light' ? 'settle' : 'pop'
}

// ---- the parts -----------------------------------------------------------------------------------
const shown = (e: Element) => getComputedStyle(e).display !== 'none'
const hasWords = (e: Element) => !!((e.textContent || '').trim()) || !!e.querySelector('img')
function photoFrames(root: HTMLElement): HTMLElement[] {
  const R = root.getBoundingClientRect()
  return (Array.from(root.querySelectorAll('*')) as HTMLElement[]).filter(e => {
    if (!shown(e) || !/url\(/.test(getComputedStyle(e).backgroundImage)) return false
    const r = e.getBoundingClientRect()
    return r.width > R.width * 0.18 && r.height > R.height * 0.18
  })
}
function fullBleed(root: HTMLElement): HTMLElement[] {
  const R = root.getBoundingClientRect()
  return photoFrames(root).filter(e => { const r = e.getBoundingClientRect(); return r.width >= R.width * 0.9 && r.height >= R.height * 0.9 })
}
function find(root: HTMLElement, sel: string): HTMLElement[] {
  const all = (Array.from(root.querySelectorAll(sel)) as HTMLElement[]).filter(e => shown(e) && hasWords(e))
  // never a part inside another found part (the headline's own <em>, a chip inside the chips)
  return all.filter(e => !all.some(o => o !== e && o.contains(e)))
}
const SELECTORS = {
  logo: '.brandrow,.brand,.masthead,.blogo,.bamark,.bmark,.mono',
  eyebrow: '.eyebrow,.kicker,.pin,.date,.count,.day,.cap,.stars',
  head: '.headline,.title,.quote,.msg,.big',
  sub: '.sub,.who,.dates,.credits,.bsub,.sig',
  chips: '.chips,.taglist,.strip,.pills,.specs,.trust,.facts,.list,.rows,.items',
  badge: '.badge,.tagbadge,.stamp,.pbadge,.savebadge,.stick,.flag',
  cta: '.cta,.send',
  url: '.url',
}

// The resting state is what the advert looked like before any motion: kept once per element, so a
// part's own tilt or offset (a sticker turned 6 degrees, a Reposition move) is kept underneath.
const REST = new WeakMap<HTMLElement, { transform: string; opacity: string; clip: string }>()
function rest(e: HTMLElement) {
  let r = REST.get(e)
  if (!r) {
    const cs = getComputedStyle(e)
    r = { transform: cs.transform === 'none' ? '' : cs.transform, opacity: e.style.opacity, clip: e.style.clipPath }
    REST.set(e, r)
  }
  return r
}
function put(e: HTMLElement, o: { opacity?: number; dy?: number; scale?: number; rot?: number; clipRight?: number }) {
  const r = rest(e)
  const t = [r.transform, o.dy ? `translateY(${o.dy.toFixed(2)}px)` : '', o.scale !== undefined && o.scale !== 1 ? `scale(${o.scale.toFixed(4)})` : '', o.rot ? `rotate(${o.rot.toFixed(2)}deg)` : ''].filter(Boolean).join(' ')
  e.style.transform = t
  e.style.opacity = o.opacity === undefined || o.opacity >= 1 ? r.opacity : String(Math.max(0, o.opacity))
  e.style.clipPath = o.clipRight ? `inset(-20px ${o.clipRight.toFixed(2)}% -20px -20px)` : r.clip
}

// ---- the film ------------------------------------------------------------------------------------
export function applyMotion(root: HTMLElement, style: MotionStyle, ms: number) {
  const total = MOTION_SECONDS * 1000
  ms = Math.max(0, Math.min(total, ms))
  // the photo: a slow push-in across the whole film, in every style - on a full-bleed photo only.
  // A framed photo (a card, a postcard, a split) would grow out of its own frame, so it holds still.
  for (const e of fullBleed(root)) put(e, { scale: 1 + 0.08 * EASE.linear(ms / total) })
  const P: Record<keyof typeof SELECTORS, HTMLElement[]> = {} as any
  for (const k of Object.keys(SELECTORS) as (keyof typeof SELECTORS)[]) P[k] = find(root, SELECTORS[k])
  const each = (els: HTMLElement[], delay: number, fn: (e: HTMLElement, p: number) => void, step = 90) =>
    els.forEach((e, i) => fn(e, delay + i * step))

  if (style === 'settle') {
    const rise = (dist: number, dur: number) => (e: HTMLElement, d: number) => { const p = progress(ms, d, dur, EASE.out); put(e, { opacity: p, dy: (1 - p) * dist }) }
    each(P.logo, 200, (e, d) => { put(e, { opacity: progress(ms, d, 600, EASE.out) }) })
    each(P.eyebrow, 450, rise(14, 700))
    each(P.head, 650, rise(34, 900))
    each(P.sub, 1250, rise(18, 700))
    each(P.chips, 1500, (e, d) => put(e, { opacity: progress(ms, d, 600, EASE.out) }))
    each(P.badge, 1700, (e, d) => { const p = progress(ms, d, 500, EASE.out); put(e, { opacity: p, scale: 0.85 + 0.15 * p }) })
    each(P.cta, 1900, rise(16, 700))
    each(P.url, 2200, (e, d) => put(e, { opacity: progress(ms, d, 600, EASE.out) }))
  }
  if (style === 'reveal') {
    const wipe = (dur: number) => (e: HTMLElement, d: number) => { const p = progress(ms, d, dur, EASE.inOut); put(e, { clipRight: (1 - p) * 100, opacity: p > 0 ? 1 : 0 }) }
    each(P.logo, 200, (e, d) => put(e, { opacity: progress(ms, d, 500, EASE.out) }))
    each(P.eyebrow, 350, wipe(600))
    each(P.head, 600, wipe(1100))
    each(P.sub, 1400, wipe(800))
    each(P.chips, 1900, (e, d) => put(e, { opacity: progress(ms, d, 500, EASE.out) }))
    each(P.badge, 2000, (e, d) => put(e, { opacity: progress(ms, d, 500, EASE.out) }))
    each(P.cta, 2100, wipe(600))
    each(P.url, 2500, (e, d) => put(e, { opacity: progress(ms, d, 500, EASE.out) }))
  }
  if (style === 'pop') {
    const sp = (from: number, dur: number) => (e: HTMLElement, d: number) => {
      const p = progress(ms, d, dur, EASE.spring), o = progress(ms, d, dur * 0.6, EASE.out)
      put(e, { opacity: o, scale: from + (1 - from) * p })
    }
    each(P.logo, 150, sp(0.9, 500))
    each(P.badge, 350, (e, d) => { const p = progress(ms, d, 550, EASE.spring), o = progress(ms, d, 330, EASE.out); put(e, { opacity: o, scale: 0.4 + 0.6 * p, rot: -8 * (1 - p) }) })
    each(P.eyebrow, 450, (e, d) => { const p = progress(ms, d, 450, EASE.out); put(e, { opacity: p, dy: (1 - p) * 10 }) })
    each(P.head, 600, sp(0.92, 650))
    each(P.sub, 1150, (e, d) => put(e, { opacity: progress(ms, d, 500, EASE.out) }))
    each(P.chips, 1350, (e, d) => { const p = progress(ms, d, 450, EASE.spring), o = progress(ms, d, 270, EASE.out); put(e, { opacity: o, dy: (1 - p) * 10 }) })
    each(P.cta, 1600, (e, d) => {
      const p = progress(ms, d, 600, EASE.spring), o = progress(ms, d, 360, EASE.out)
      // a gentle nudge on the button near the end, to draw the eye
      const n = ms >= 4300 && ms <= 5000 ? Math.sin(Math.PI * (ms - 4300) / 700) * 0.06 : 0
      put(e, { opacity: o, scale: 0.7 + 0.3 * p + n })
    })
    each(P.url, 1900, (e, d) => put(e, { opacity: progress(ms, d, 500, EASE.out) }))
  }
}

// Back to the still advert exactly as it was.
export function clearMotion(root: HTMLElement) {
  for (const e of Array.from(root.querySelectorAll('*')) as HTMLElement[]) {
    const r = REST.get(e)
    if (!r) continue
    e.style.transform = ''; e.style.opacity = r.opacity; e.style.clipPath = r.clip
    REST.delete(e)
  }
}
