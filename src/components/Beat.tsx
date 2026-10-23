import React from 'react'
import { AbsoluteFill, Freeze, OffthreadVideo, Img, useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion'
import { loadFont as loadWordmarkSerif } from '@remotion/google-fonts/DMSerifDisplay'
import { Captions, SpokenCaptions, ensureFont, fam, type SpokenWord } from './Captions'
import type { CaptionStyle, StyleConfig, ReelLayer } from '../lib/types'

// The wordmark serif — the same face as Creslo's own "Creslo." brand mark. Every
// brand's name renders in this editorial style on the CTA end-card.
const WORDMARK_FONT = loadWordmarkSerif('normal', { weights: ['400'], subsets: ['latin'] }).fontFamily

function shade(hex: string, amt: number) {
  // lighten/darken a hex colour by amt (-1..1)
  const h = (hex || '#0F1115').replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v + 255 * amt)))
  r = f(r); g = f(g); b = f(b)
  return `rgb(${r},${g},${b})`
}

// Accent colour with alpha (mirror of the frontend's helper).
function hexA(hex: string, a: number) {
  const h = (hex || '#E8743B').replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return `rgba(${r},${g},${b},${a})`
}

// Readable text colour for a solid brand-colour field (mirror of the frontend's helper).
function idealText(hex: string) {
  const h = (hex || '#E8743B').replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#0F1115' : '#ffffff'
}

// CSS colour grades applied over the clip layer (driven by reel.grade). Absent -> no filter.
// MUST stay byte-identical to the frontend mirror src/remotion/ReelVideo.tsx.
// P2 (8 Oct 2026): gentler, so the grade unifies rather than shouts; clips are evened out first.
const GRADE_PRESETS: Record<string, string> = {
  warm: 'sepia(0.1) saturate(1.06) contrast(1.04)',
  punchy: 'contrast(1.08) saturate(1.12)',
  editorial: 'contrast(1.06) saturate(0.88) brightness(1.01)',
  clean: 'contrast(1.03) saturate(1.04)',
  neutral: 'none',
}

// ===== THE LOOK (reels premium pass P2, 8 Oct 2026) =====
// Daniel, 8 Oct: the reels look "too basic, not like a finished product... maybe the transitions or
// the treatments". The audit (claude/reels-premium-audit-2026-10-08.md) found every clip a
// different film, a blurred blob behind the text card, a 2.7 s logo-on-a-glow ending, and an effect
// on every cut. These are the shared parts of the fix. MUST stay byte-identical to the frontend
// mirror src/remotion/ReelVideo.tsx (the reel mirror test compares from "THE LOOK" to "END THE LOOK").
export type Tone = { r: number; g: number; b: number; x: number }
// One clip's colour and exposure evening (backend lib/clipTone) as a colour matrix, applied before
// the reel's grade, so stock clips shot in different light read as one film.
export const ToneFilter: React.FC<{ id: string; tone?: Tone | null }> = ({ id, tone }) => {
  if (!tone) return null
  const m = (v: number) => (Math.round(v * 1000) / 1000).toString()
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden>
      <filter id={id} colorInterpolationFilters="sRGB">
        <feColorMatrix type="matrix" values={`${m(tone.r * tone.x)} 0 0 0 0 0 ${m(tone.g * tone.x)} 0 0 0 0 0 ${m(tone.b * tone.x)} 0 0 0 0 0 1 0`} />
      </filter>
    </svg>
  )
}
// A fine moving film grain and a soft vignette over every beat: the glue that makes stock clips,
// photos and cards sit together.
export const FilmFinish: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <AbsoluteFill style={{ backgroundImage: GRAIN_URI, backgroundSize: '160px 160px', backgroundPosition: `${(frame * 37) % 160}px ${(frame * 61) % 160}px`, opacity: 0.08, mixBlendMode: 'overlay', pointerEvents: 'none' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(125% 90% at 50% 45%, transparent 58%, rgba(0,0,0,0.26) 100%)', pointerEvents: 'none' }} />
  </>
)
// The ground behind a text card or the end card: a still from the reel itself, softened and
// darkened under a wash of the brand colour - or the brand colour alone when there is none.
// (The old ground was a drifting field of blurred blobs, grids and particles.)
// A text card sits on the FROZEN FIRST FRAME OF THE NEXT SHOT (reels premium audit P2 / batch 7, 22 Oct 2026: "words over a
// darkened, frozen frame of the next shot"): the very frame that shot opens on, darkened and only lightly softened, easing back
// to its own size so the cut into it plays on from the card. If that clip cannot be read, the still (else the brand colour).
export const StillGround: React.FC<{ src?: string | null; accent: string; frame: number; durationInFrames: number; dim?: number; tint?: number; shot?: { src: string; start?: number } | null }> = ({ src, accent, frame, durationInFrames, dim = 0.5, tint = 0.22, shot }) => {
  const t = frame / Math.max(1, durationInFrames)
  const { fps } = useVideoConfig()
  const [shotFailed, setShotFailed] = React.useState(false)
  if (shot && shot.src && !shotFailed) return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Freeze frame={0}>
        <OffthreadVideo src={shot.src} muted trimBefore={shot.start ? Math.round(shot.start * fps) : undefined} onError={() => setShotFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.06 - 0.06 * t})`, filter: `blur(2px) brightness(${dim * 0.9}) saturate(0.9)` }} />
      </Freeze>
      <AbsoluteFill style={{ background: /^#[0-9a-fA-F]{6}$/.test(accent) ? hexA(accent, tint) : 'transparent', mixBlendMode: 'multiply' }} />
    </AbsoluteFill>
  )
  if (!src) return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${shade(accent, 0.05)} 0%, ${shade(accent, -0.07)} 100%)` }} />
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.1 + 0.04 * t})`, filter: `blur(9px) brightness(${dim}) saturate(0.85)` }} />
      <AbsoluteFill style={{ background: /^#[0-9a-fA-F]{6}$/.test(accent) ? hexA(accent, tint) : 'transparent', mixBlendMode: 'multiply' }} />
    </AbsoluteFill>
  )
}
// ===== END THE LOOK =====



// ===== BrandField: the premium brand-colour stage behind text/CTA beats. =====
// Layers (back to front): deep radial base -> perspective floor grid drifting toward
// the viewer -> two huge blurred glow orbs on slow orbits -> floating twinkling
// particles -> vignette -> film grain. Pure CSS/SVG, cheap per frame.
// MUST stay byte-identical in both composition mirrors.
const GRAIN_URI = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22><filter id=%22n%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%222%22/></filter><rect width=%22160%22 height=%22160%22 filter=%22url(%23n)%22 opacity=%220.5%22/></svg>')"
const BrandField: React.FC<{ accent: string; frame: number; dark?: boolean; tone?: 'light' | 'rich' | 'deep' }> = ({ accent, frame, dark, tone }) => {
  // v3 (field tones): three polarities of the SAME brand-colour stage.
  //   'light' — cream editorial ground (the brand-banner aesthetic): pale tints of the
  //             brand colour, deep-brand accents carrying the detail. For brands whose
  //             premium register is bright (cafés, salons, cream-and-brown identities).
  //   'rich'  — the saturated mid default. 'deep' — jewel tone, never murky black.
  // Chosen per reel via reel.fieldTone (mood presets + the planner set it).
  const t = tone || (dark ? 'deep' : 'rich')
  const base = t === 'light' ? shade(accent, 0.6) : (t === 'deep' ? shade(accent, -0.32) : shade(accent, -0.06))
  const deep = t === 'light' ? shade(accent, 0.38) : (t === 'deep' ? shade(accent, -0.5) : shade(accent, -0.24))
  const lift = t === 'light' ? shade(accent, 0.78) : (t === 'deep' ? shade(accent, -0.1) : shade(accent, 0.24))
  const hot = t === 'light' ? shade(accent, -0.05) : shade(accent, 0.42)
  // Deterministic particle field (no randomness - identical on every render).
  const parts = Array.from({ length: 16 }, (_, i) => {
    const px = ((i * 61) % 97) / 97 * 100
    const seed = (i * 37) % 83
    const py = ((seed / 83) * 120 - ((frame * (0.25 + (i % 5) * 0.08)) % 120) + 120) % 120 - 10
    const tw = 0.35 + 0.3 * Math.sin(frame * 0.06 + i * 1.7)
    const size = 3 + (i % 4) * 2.5
    return { px, py, tw, size }
  })
  // Large soft bokeh discs drifting through depth (deterministic).
  const bokeh = [
    { x: 14 + Math.sin(frame * 0.008) * 6, y: 26 + Math.cos(frame * 0.01) * 5, s: 150, o: 0.16 },
    { x: 80 + Math.cos(frame * 0.009) * 5, y: 14 + Math.sin(frame * 0.012) * 6, s: 100, o: 0.13 },
    { x: 68 + Math.sin(frame * 0.007) * 7, y: 74 + Math.cos(frame * 0.011) * 4, s: 190, o: 0.1 },
  ]
  // Cinematic light sweep: a soft diagonal beam panning across every ~5s.
  const sweepX = ((frame % 150) / 150) * 240 - 70
  return (
    <AbsoluteFill>
      {/* gradient-mesh base: three colour poles instead of one flat radial */}
      <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 22%, ${lift} 0%, ${base} 55%, ${deep} 100%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(70% 55% at ${22 + Math.sin(frame * 0.012) * 8}% ${20 + Math.cos(frame * 0.01) * 6}%, ${hexA(hot, 0.5)} 0%, transparent 65%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(80% 60% at ${78 + Math.cos(frame * 0.011) * 7}% ${76 + Math.sin(frame * 0.013) * 6}%, ${hexA(shade(accent, -0.6), 0.55)} 0%, transparent 60%)` }} />
      {/* perspective floor grid, accent-tinted, drifting toward the viewer */}
      <div style={{
        position: 'absolute', left: '-40%', right: '-40%', bottom: '-4%', height: '46%',
        backgroundImage: `linear-gradient(${hexA(hot, 0.2)} 1.5px, transparent 1.5px), linear-gradient(90deg, ${hexA(hot, 0.2)} 1.5px, transparent 1.5px)`,
        backgroundSize: '110px 110px',
        backgroundPosition: `0px ${(frame * 0.6) % 110}px`,
        transform: 'perspective(700px) rotateX(62deg)', transformOrigin: '50% 0%',
        maskImage: 'linear-gradient(180deg, transparent 0%, black 45%)',
        WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 45%)',
      }} />
      {/* glowing horizon line where the grid meets the field */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '42%', height: 2, background: `linear-gradient(90deg, transparent 8%, ${hexA(hot, 0.55)} 50%, transparent 92%)`, boxShadow: `0 0 26px ${hexA(hot, 0.6)}`, opacity: 0.5 + Math.sin(frame * 0.05) * 0.15 }} />
      {/* glow orbs on slow orbits */}
      <div style={{
        position: 'absolute', width: 860, height: 860, borderRadius: 860, filter: 'blur(110px)',
        background: hexA(hot, 0.5), opacity: 0.55,
        left: `calc(${18 + Math.sin(frame * 0.014) * 12}% - 430px)`, top: `calc(${16 + Math.cos(frame * 0.011) * 8}% - 430px)`,
      }} />
      <div style={{
        position: 'absolute', width: 560, height: 560, borderRadius: 560, filter: 'blur(100px)',
        background: t === 'light' ? hexA(accent, 0.3) : hexA('#FFFFFF', 0.26), opacity: 0.45,
        right: `calc(${10 + Math.cos(frame * 0.017) * 10}% - 280px)`, bottom: `calc(${20 + Math.sin(frame * 0.013) * 9}% - 280px)`,
      }} />
      {/* soft bokeh depth */}
      {bokeh.map((b, i) => (
        <div key={`b${i}`} style={{
          position: 'absolute', left: `calc(${b.x}% - ${b.s / 2}px)`, top: `calc(${b.y}% - ${b.s / 2}px)`,
          width: b.s, height: b.s, borderRadius: b.s, filter: 'blur(26px)',
          background: `radial-gradient(circle, ${hexA('#FFFFFF', b.o)} 0%, transparent 70%)`,
        }} />
      ))}
      {/* cinematic light sweep */}
      <div style={{
        position: 'absolute', top: '-25%', bottom: '-25%', width: '34%', left: `${sweepX}%`,
        transform: 'rotate(14deg)', mixBlendMode: 'screen',
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 38%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.07) 62%, transparent 100%)',
      }} />
      {/* floating particles */}
      {parts.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.px}%`, top: `${p.py}%`, width: p.size, height: p.size,
          borderRadius: 100, background: i % 3 === 0 ? hot : '#FFFFFF', opacity: p.tw,
          boxShadow: `0 0 ${p.size * 3}px ${i % 3 === 0 ? hexA(hot, 0.9) : hexA('#FFFFFF', 0.7)}`,
        }} />
      ))}
      {/* light vignette + grain (framing, not darkness; warm brown on the light tone) */}
      <AbsoluteFill style={{ background: `radial-gradient(115% 85% at 50% 45%, transparent 60%, ${t === 'light' ? 'rgba(90,58,30,0.14)' : 'rgba(0,0,0,0.28)'} 100%)` }} />
      <AbsoluteFill style={{ backgroundImage: GRAIN_URI, backgroundSize: '160px 160px', opacity: 0.05, mixBlendMode: 'overlay' }} />
    </AbsoluteFill>
  )
}

// ===== FieldStage: keyed background TREATMENTS behind text/CTA beats. =====
// Lookbook designs promoted into the composition (2026-07-10). Every style derives
// entirely from the beat hue so ANY brand colour works; light-ground styles are
// flagged in FIELD_LIGHT_STYLES so the type flips to dark ink (readability law).
// 'mesh' (default) = BrandField v3, which honours the tone. Deterministic layers
// only (sin/cos of frame) — identical on every render.
// MUST stay byte-identical in both composition mirrors.
export const FIELD_LIGHT_STYLES = new Set(['silk', 'rays', 'paper', 'marble', 'gallery', 'linen', 'dawn', 'halftone', 'leak', 'papercut'])
const FieldStage: React.FC<{ styleKey?: string | null; accent: string; frame: number; tone?: 'light' | 'rich' | 'deep' }> = ({ styleKey, accent, frame, tone }) => {
  const a = accent
  const grain = <AbsoluteFill style={{ backgroundImage: GRAIN_URI, backgroundSize: '160px 160px', opacity: 0.05, mixBlendMode: 'overlay' }} />
  const sweepX = ((frame % 150) / 150) * 240 - 70
  const sweep = (op: number) => (
    <div style={{ position: 'absolute', top: '-25%', bottom: '-25%', width: '34%', left: `${sweepX}%`, transform: 'rotate(14deg)', mixBlendMode: 'screen', background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${op * 0.5}) 38%, rgba(255,255,255,${op}) 50%, rgba(255,255,255,${op * 0.5}) 62%, transparent 100%)` }} />
  )
  switch (styleKey) {
    case 'silk': // Cream Silk — pale satin of the hue, breathing light, slow polish pass
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(152deg, ${shade(a, 0.8)} 0%, ${shade(a, 0.62)} 52%, ${shade(a, 0.42)} 100%)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(70% 50% at 78% 22%, rgba(255,255,255,${0.55 + Math.sin(frame * 0.05) * 0.2}), transparent 65%)` }} />
          {sweep(0.35)}
          {grain}
        </AbsoluteFill>
      )
    case 'espresso': // Espresso Glow — deep roast radial with one breathing ember
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 24%, ${shade(a, -0.28)} 0%, ${shade(a, -0.55)} 58%, ${shade(a, -0.75)} 100%)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(60% 44% at 50% 42%, ${hexA(shade(a, 0.3), 0.28 + Math.sin(frame * 0.06) * 0.14)}, transparent 70%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'bokeh': { // Bokeh Depth — out-of-focus lights drifting through depth
      const discs = [
        { x: 12 + Math.sin(frame * 0.012) * 10, y: 14 + Math.cos(frame * 0.01) * 8, s: 34, c: shade(a, 0.45), o: 0.5 },
        { x: 78 + Math.cos(frame * 0.011) * 8, y: 30 + Math.sin(frame * 0.013) * 9, s: 20, c: '#ffffff', o: 0.38 },
        { x: 70 + Math.sin(frame * 0.009) * 9, y: 78 + Math.cos(frame * 0.012) * 7, s: 44, c: shade(a, 0.3), o: 0.32 },
        { x: 22 + Math.cos(frame * 0.014) * 7, y: 66 + Math.sin(frame * 0.011) * 8, s: 14, c: '#ffffff', o: 0.42 },
      ]
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 30%, ${shade(a, -0.2)}, ${shade(a, -0.6)} 75%)` }} />
          {discs.map((d, i) => (
            <div key={i} style={{ position: 'absolute', left: `calc(${d.x}% - ${d.s / 2}%)`, top: `calc(${d.y}% - ${d.s / 4}%)`, width: `${d.s}%`, aspectRatio: '1', borderRadius: '50%', filter: 'blur(30px)', background: `radial-gradient(circle, ${hexA(d.c, d.o)}, transparent 70%)` }} />
          ))}
          {grain}
        </AbsoluteFill>
      )
    }
    case 'horizon': // Horizon Grid — full-length grid racing from a high glowing horizon
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${shade(a, -0.78)} 0%, ${shade(a, -0.55)} 42%, ${shade(a, -0.25)} 100%)` }} />
          <div style={{
            position: 'absolute', left: '-40%', right: '-40%', bottom: '-4%', height: '96%',
            backgroundImage: `linear-gradient(${hexA(shade(a, 0.35), 0.28)} 1.5px, transparent 1.5px), linear-gradient(90deg, ${hexA(shade(a, 0.35), 0.28)} 1.5px, transparent 1.5px)`,
            backgroundSize: '110px 110px', backgroundPosition: `0px ${(frame * 1.4) % 110}px`,
            transform: 'perspective(700px) rotateX(58deg)', transformOrigin: '50% 0%',
            maskImage: 'linear-gradient(180deg, transparent 0%, black 30%)', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 30%)',
          }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '22%', height: 1, background: `linear-gradient(90deg, transparent 14%, ${hexA(shade(a, 0.4), 0.4)} 50%, transparent 86%)` }} />
          <div style={{ position: 'absolute', width: '44%', aspectRatio: '1', left: '28%', top: '8%', borderRadius: '50%', filter: 'blur(30px)', background: `radial-gradient(circle, ${hexA(shade(a, 0.3), 0.4)}, transparent 65%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'embers': { // Ember Field — sparks rising through the dark
      const layers = [
        { size: '110px 160px', speed: 0.5, dot: 1.6, c: shade(a, 0.42), o: 0.9 },
        { size: '70px 120px', speed: 0.8, dot: 1.2, c: shade(a, 0.25), o: 0.7 },
        { size: '50px 90px', speed: 1.1, dot: 1, c: '#fffdf8', o: 0.8 },
      ]
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 28%, ${shade(a, -0.42)}, ${shade(a, -0.78)} 80%)` }} />
          {layers.map((l, i) => (
            <AbsoluteFill key={i} style={{ backgroundImage: `radial-gradient(${hexA(l.c, l.o)} ${l.dot}px, transparent ${l.dot}px)`, backgroundSize: l.size, backgroundPosition: `${10 + i * 30}px ${-(frame * l.speed) % 200}px` }} />
          ))}
          <AbsoluteFill style={{ background: `radial-gradient(55% 38% at 50% 52%, ${hexA(shade(a, 0.1), 0.25 + Math.sin(frame * 0.08) * 0.12)}, transparent 70%)` }} />
          {grain}
        </AbsoluteFill>
      )
    }
    case 'aurora': // Aurora Ribbon — slow ribbons of the hue flowing round the frame
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${shade(a, -0.75)}, ${shade(a, -0.5)})` }} />
          <div style={{ position: 'absolute', inset: '-30%', filter: 'blur(28px)', transform: `rotate(${(frame * 0.4) % 360}deg) scale(1.6)`, background: `conic-gradient(from 90deg, transparent 0deg, ${hexA(shade(a, 0.25), 0.5)} 60deg, ${hexA(shade(a, 0.5), 0.6)} 100deg, ${hexA(shade(a, 0.05), 0.4)} 150deg, transparent 210deg)` }} />
          <div style={{ position: 'absolute', inset: '-30%', filter: 'blur(34px)', transform: `rotate(${-(frame * 0.28) % 360}deg) scale(1.6)`, background: `conic-gradient(from 270deg, transparent 0deg, rgba(245,236,222,0.28) 70deg, transparent 140deg)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'rays': // Ray Fan — art-deco sunburst slowly wheeling on the pale hue
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: shade(a, 0.78) }} />
          <div style={{ position: 'absolute', inset: '-60% -60% -20% -60%', transform: `rotate(${(frame * 0.12) % 360}deg)`, background: `repeating-conic-gradient(from 0deg at 50% 50%, ${hexA(shade(a, 0.42), 0.4)} 0 9deg, transparent 9deg 18deg)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(62% 42% at 50% 46%, ${hexA(shade(a, 0.85), 0.95)}, ${hexA(shade(a, 0.8), 0.3)} 78%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'paper': { // Paper Strata — the hue's ramp as rolling layers along the base
      const wob = (i: number) => Math.sin(frame * 0.04 + i * 1.4) * 6
      const bands = [
        { top: 68, c: shade(a, 0.55) }, { top: 76, c: shade(a, 0.3) },
        { top: 84, c: shade(a, 0) }, { top: 91, c: shade(a, -0.35) },
      ]
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${shade(a, 0.82)} 0%, ${shade(a, 0.66)} 70%)` }} />
          {bands.map((b, i) => (
            <div key={i} style={{ position: 'absolute', left: '-6%', right: '-6%', top: `${b.top}%`, bottom: '-2%', background: b.c, borderRadius: `${46 + wob(i)}% ${54 - wob(i)}% 0 0 / 26px 22px 0 0`, boxShadow: '0 -8px 24px -12px rgba(60,38,18,.35)' }} />
          ))}
          {grain}
        </AbsoluteFill>
      )
    }
    case 'spot': { // Spotlight Stage — a swinging theatre beam and its pool of light
      const swing = Math.sin(frame * 0.03) * 7
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(130% 110% at 50% 110%, ${shade(a, -0.5)}, ${shade(a, -0.8)} 75%)` }} />
          <div style={{ position: 'absolute', left: '20%', right: '20%', top: '-4%', height: '78%', transformOrigin: '50% 0%', transform: `rotate(${swing}deg)`, clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)', filter: 'blur(14px)', background: 'linear-gradient(180deg, rgba(245,236,222,.38), rgba(245,236,222,.05) 80%, transparent)' }} />
          <div style={{ position: 'absolute', left: '14%', right: '14%', bottom: '14%', height: '9%', borderRadius: '50%', filter: 'blur(12px)', background: `radial-gradient(ellipse, ${hexA(shade(a, 0.35), 0.35 + Math.sin(frame * 0.05) * 0.12)}, transparent 70%)` }} />
          {grain}
        </AbsoluteFill>
      )
    }
    case 'marble': // Marble Veins — polished stone with drifting veins and a polish pass
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(150deg, ${shade(a, 0.82)} 0%, ${shade(a, 0.7)} 60%, ${shade(a, 0.56)} 100%)` }} />
          <AbsoluteFill style={{ transform: `translate(${Math.sin(frame * 0.01) * 3}%, ${Math.cos(frame * 0.012) * 2}%)`, background: `linear-gradient(118deg, transparent 42%, ${hexA(shade(a, -0.1), 0.16)} 46%, transparent 50%, transparent 66%, ${hexA(shade(a, -0.35), 0.1)} 70%, transparent 74%)`, filter: 'blur(2px)' }} />
          <AbsoluteFill style={{ transform: `translate(${Math.cos(frame * 0.009) * -3}%, ${Math.sin(frame * 0.011) * 2}%)`, background: `linear-gradient(64deg, transparent 30%, ${hexA(shade(a, 0.1), 0.14)} 34%, transparent 38%)`, filter: 'blur(3px)' }} />
          {sweep(0.3)}
          {grain}
        </AbsoluteFill>
      )
    case 'gallery': // Gallery Paper — matte paper, hairline frame, museum calm
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: shade(a, 0.8) }} />
          <AbsoluteFill style={{ background: `radial-gradient(130% 100% at 50% 50%, transparent 55%, ${hexA(shade(a, -0.4), 0.14)} 100%)` }} />
          <div style={{ position: 'absolute', left: '7%', right: '7%', top: '7%', bottom: '7%', border: `2px solid ${hexA(shade(a, -0.3), 0.3 + Math.sin(frame * 0.05) * 0.1)}`, borderRadius: 6 }} />
          {grain}
        </AbsoluteFill>
      )
    case 'linen': // Linen Bands — drifting tonal stripes, woven-fabric texture
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(90deg, ${shade(a, 0.66)} 0px, ${shade(a, 0.66)} 90px, ${shade(a, 0.76)} 90px, ${shade(a, 0.76)} 270px)`, backgroundSize: '270px 100%', backgroundPosition: `${(frame * 0.5) % 270}px 0` }} />
          <AbsoluteFill style={{ background: `radial-gradient(80% 55% at 50% 34%, rgba(255,255,255,.5), transparent 70%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'dawn': // First Light — sunrise horizon in the hue, warm start-of-day energy
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(180deg, ${shade(a, 0.8)} 0%, ${shade(a, 0.62)} 46%, ${shade(a, 0.3)} 78%, ${a} 130%)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(90% 32% at 50% 74%, ${hexA(a, 0.35 + Math.sin(frame * 0.045) * 0.12)}, transparent 70%)` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '71%', height: 2, background: `linear-gradient(90deg, transparent 10%, ${hexA(shade(a, -0.35), 0.5)} 50%, transparent 90%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'satin': // Satin Sweep — polished satin with a confident recurring light pass
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(135deg, ${shade(a, -0.08)} 0%, ${shade(a, -0.35)} 50%, ${shade(a, -0.58)} 100%)` }} />
          <AbsoluteFill style={{ background: `radial-gradient(90% 60% at 30% 20%, ${hexA(shade(a, 0.35), 0.3)}, transparent 65%)` }} />
          {sweep(0.4)}
          {grain}
        </AbsoluteFill>
      )
    case 'halftone': // Halftone Fade — drifting print dots dissolving into the pale hue
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: shade(a, 0.78) }} />
          <AbsoluteFill style={{ backgroundImage: `radial-gradient(${hexA(shade(a, -0.3), 0.4)} 2px, transparent 2px)`, backgroundSize: '22px 22px', backgroundPosition: `${(frame * 0.4) % 22}px 0`, maskImage: 'linear-gradient(200deg, black 20%, transparent 68%)', WebkitMaskImage: 'linear-gradient(200deg, black 20%, transparent 68%)' }} />
          <AbsoluteFill style={{ background: `radial-gradient(70% 45% at 50% 60%, ${hexA(shade(a, 0.85), 0.75)}, transparent 72%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'ink': { // Ink Bloom — drops blooming and dissolving in dark water
      const bloom = (off: number, x: number, y: number, s: number, c: string) => {
        const p = ((frame + off) % 200) / 200
        return <div style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${s}%`, aspectRatio: '1', borderRadius: '50%', filter: 'blur(16px)', background: `radial-gradient(circle, ${hexA(c, 0.45)}, transparent 62%)`, transform: `translate(-50%,-50%) scale(${0.3 + p * 1.4})`, opacity: (1 - p) * 0.8 }} />
      }
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 30%, ${shade(a, -0.45)}, ${shade(a, -0.78)} 80%)` }} />
          {bloom(0, 26, 24, 56, shade(a, 0.25))}
          {bloom(70, 76, 72, 48, shade(a, 0.42))}
          {bloom(140, 50, 86, 40, '#f5ecde')}
          {grain}
        </AbsoluteFill>
      )
    }
    case 'ribbon': // Ribbon Weave — crossing satin ribbons drifting on the diagonal
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(165deg, ${shade(a, -0.15)}, ${shade(a, -0.55)})` }} />
          <div style={{ position: 'absolute', left: '-30%', right: '-30%', top: '14%', height: '15%', filter: 'blur(2px)', background: `linear-gradient(90deg, ${hexA(shade(a, 0.4), 0.15)}, ${hexA(shade(a, 0.4), 0.5)}, ${hexA(shade(a, 0.4), 0.15)})`, transform: `rotate(-14deg) translateX(${Math.sin(frame * 0.02) * 4}%)` }} />
          <div style={{ position: 'absolute', left: '-30%', right: '-30%', top: '70%', height: '12%', background: `linear-gradient(90deg, rgba(245,236,222,.1), rgba(245,236,222,.35), rgba(245,236,222,.1))`, transform: `rotate(9deg) translateX(${Math.cos(frame * 0.017) * 4}%)` }} />
          <div style={{ position: 'absolute', left: '-30%', right: '-30%', bottom: '4%', height: '16%', filter: 'blur(2px)', background: `linear-gradient(90deg, ${hexA(shade(a, 0.2), 0.2)}, ${hexA(shade(a, 0.2), 0.55)}, ${hexA(shade(a, 0.2), 0.2)})`, transform: `rotate(-7deg) translateX(${Math.sin(frame * 0.014) * 5}%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'velvet': // Velvet Rim — near-black hue, one breathing rim of light
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(140% 120% at 50% 120%, ${shade(a, -0.55)}, ${shade(a, -0.82)} 70%)` }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '40%', background: `linear-gradient(180deg, ${hexA(shade(a, 0.25), 0.25 + Math.sin(frame * 0.045) * 0.12)}, transparent)` }} />
          <div style={{ position: 'absolute', left: '8%', right: '8%', top: '9%', height: 1.5, background: `linear-gradient(90deg, transparent, ${hexA(shade(a, 0.42), 0.8)}, transparent)`, boxShadow: `0 0 14px ${hexA(shade(a, 0.42), 0.6)}` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'leak': // Light Leak — warm analogue leaks drifting across pale film
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(170deg, ${shade(a, 0.8)}, ${shade(a, 0.66)})` }} />
          <div style={{ position: 'absolute', width: '60%', height: '130%', left: '-16%', top: '-16%', filter: 'blur(24px)', background: `linear-gradient(90deg, transparent, ${hexA(shade(a, 0.2), 0.5)}, transparent)`, transform: `rotate(-16deg) translateX(${Math.sin(frame * 0.02) * 10}%)` }} />
          <div style={{ position: 'absolute', width: '40%', height: '130%', right: '-10%', top: '-10%', filter: 'blur(26px)', background: `linear-gradient(90deg, transparent, ${hexA(shade(a, 0.45), 0.55)}, transparent)`, transform: `rotate(-14deg) translateX(${Math.cos(frame * 0.016) * -8}%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'starfall': { // Starfall — shooting streaks over a still starfield
      const streak = (off: number, top: number, w: number, o: number) => {
        const p = ((frame + off) % 170) / 170
        return <div style={{ position: 'absolute', width: `${w}%`, height: 2, left: `${-25 + p * 150}%`, top: `${top}%`, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${hexA('#f5ecde', o)})`, transform: 'rotate(24deg)', opacity: p < 0.08 ? p * 10 : (1 - p) }} />
      }
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(200deg, ${shade(a, -0.8)}, ${shade(a, -0.55)} 70%, ${shade(a, -0.4)})` }} />
          <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(245,236,222,.9) 1px, transparent 1px)', backgroundSize: '70px 110px', opacity: 0.5 }} />
          {streak(0, 12, 22, 0.9)}
          {streak(60, 26, 16, 0.7)}
          {streak(110, 7, 13, 0.6)}
          {streak(140, 78, 15, 0.55)}
          {grain}
        </AbsoluteFill>
      )
    }
    case 'mosaic': // Mosaic Twinkle — tiled squares twinkling round a focus pool
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: shade(a, -0.6) }} />
          <AbsoluteFill style={{ backgroundImage: `conic-gradient(${hexA(shade(a, 0.25), 0.28)} 90deg, transparent 90deg 180deg, ${hexA(shade(a, 0.25), 0.28)} 180deg 270deg, transparent 270deg)`, backgroundSize: '44px 44px', opacity: 0.35 + Math.sin(frame * 0.06) * 0.18 }} />
          <AbsoluteFill style={{ backgroundImage: `conic-gradient(transparent 90deg, ${hexA(shade(a, -0.3), 0.4)} 90deg 180deg, transparent 180deg 270deg, ${hexA(shade(a, -0.3), 0.4)} 270deg)`, backgroundSize: '44px 44px', opacity: 0.35 - Math.sin(frame * 0.06) * 0.18 }} />
          <AbsoluteFill style={{ background: `radial-gradient(70% 48% at 50% 50%, ${hexA(shade(a, -0.62), 0.92)}, ${hexA(shade(a, -0.62), 0.15)} 80%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'rings': { // Pulse Rings — sonar rings radiating from the message
      const ring = (off: number) => {
        const p = ((frame + off) % 120) / 120
        return <div style={{ position: 'absolute', left: '50%', top: '50%', width: '70%', aspectRatio: '1', borderRadius: '50%', border: `1.5px solid ${hexA(shade(a, 0.4), 0.7)}`, transform: `translate(-50%,-50%) scale(${0.2 + p * 1.5})`, opacity: (1 - p) * 0.8 }} />
      }
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 40%, ${shade(a, -0.28)}, ${shade(a, -0.6)} 70%)` }} />
          {ring(0)}{ring(40)}{ring(80)}
          <AbsoluteFill style={{ background: `radial-gradient(46% 26% at 50% 50%, ${hexA(shade(a, -0.55), 0.75)}, transparent 75%)` }} />
          {grain}
        </AbsoluteFill>
      )
    }
    case 'nebula': { // Nebula Smoke — morphing clouds with pinprick stars
      const m = (i: number) => 46 + Math.sin(frame * 0.02 + i) * 10
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(130% 100% at 50% 100%, ${shade(a, -0.5)}, ${shade(a, -0.8)} 78%)` }} />
          <div style={{ position: 'absolute', width: '90%', height: '52%', left: '-6%', top: '8%', filter: 'blur(26px)', background: `radial-gradient(closest-side, ${hexA(shade(a, 0.25), 0.5)}, transparent)`, borderRadius: `${m(0)}% ${100 - m(0)}% ${m(2)}% ${100 - m(2)}%`, transform: `translate(${Math.sin(frame * 0.014) * 5}%, ${Math.cos(frame * 0.012) * 4}%) scale(${1.1 + Math.sin(frame * 0.016) * 0.12})` }} />
          <div style={{ position: 'absolute', width: '80%', height: '46%', right: '-10%', top: '34%', filter: 'blur(28px)', background: 'radial-gradient(closest-side, rgba(245,236,222,.26), transparent)', borderRadius: `${m(3)}% ${100 - m(3)}% ${m(1)}% ${100 - m(1)}%`, transform: `translate(${Math.cos(frame * 0.011) * -5}%, ${Math.sin(frame * 0.013) * 4}%)` }} />
          <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(255,253,248,.9) 1px, transparent 1px)', backgroundSize: '60px 90px', opacity: 0.5 }} />
          {grain}
        </AbsoluteFill>
      )
    }
    case 'chrome': // Chrome Flow — molten metal swirl of the hue
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: shade(a, -0.7) }} />
          <div style={{ position: 'absolute', inset: '-40%', filter: 'blur(22px) saturate(1.1)', transform: `rotate(${(frame * 0.5) % 360}deg)`, background: `conic-gradient(${shade(a, -0.45)}, ${shade(a, 0)}, ${shade(a, 0.5)}, ${shade(a, 0.85)}, ${shade(a, 0.25)}, ${shade(a, -0.3)}, ${shade(a, -0.45)})` }} />
          <AbsoluteFill style={{ background: `radial-gradient(70% 55% at 50% 50%, transparent 40%, ${hexA(shade(a, -0.78), 0.75)} 100%)` }} />
          {grain}
        </AbsoluteFill>
      )
    case 'papercut': { // Paper Cut — cut-and-paste collage (lookbook 48, 2026-07-24): torn ramp
      // panels pasted at FIXED angles (never animated, so the tilt can't flatten) behind a
      // central cream torn panel that carries the type. Light ground -> dark ink via FIELD_LIGHT_STYLES.
      const cream = shade(a, 0.72), cream2 = shade(a, 0.58), soft = shade(a, 0.3)
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `linear-gradient(158deg, ${cream} 0%, ${cream2} 100%)` }} />
          <div style={{ position: 'absolute', left: '4%', right: '26%', top: '12%', height: '34%', background: soft, transform: 'rotate(-3deg)', boxShadow: `0 60px 120px -70px ${hexA(shade(a, -0.6), 0.5)}`, clipPath: 'polygon(0 4%,100% 0,98% 96%,2% 100%)' }} />
          <div style={{ position: 'absolute', left: '30%', right: '4%', top: '40%', height: '34%', background: a, transform: 'rotate(2.4deg)', boxShadow: `0 60px 120px -70px ${hexA(shade(a, -0.6), 0.55)}`, clipPath: 'polygon(2% 0,100% 3%,97% 100%,0 95%)' }} />
          <div style={{ position: 'absolute', left: '7%', right: '7%', top: '30%', bottom: '26%', background: cream, transform: 'rotate(-1deg)', boxShadow: `0 80px 150px -70px ${hexA(shade(a, -0.55), 0.5)}`, clipPath: 'polygon(0 6%,100% 0,99% 94%,1% 100%)' }} />
          <div style={{ position: 'absolute', left: '40%', right: '40%', top: '22%', height: '5%', background: hexA(a, 0.28), border: `2px solid ${hexA('#ffffff', 0.45)}`, transform: 'rotate(-4deg)' }} />
          <AbsoluteFill style={{ background: `radial-gradient(60% 34% at 50% 50%, ${hexA('#ffffff', 0.32)}, transparent 76%)` }} />
          {grain}
        </AbsoluteFill>
      )
    }
    case 'rotary': { // Rotary Echo (lookbook 78, 2026-10-16): rotational parallax / cel-spin echo —
      // nested rounded-square outlines of the hue spin at differing frame-driven rates (two reversed),
      // reading as layered depth while staying 2D. Each ring owns ONE computed transform per frame
      // (rotate only; size comes from inset, never scale) so nothing can flatten; a dark focus pool
      // re-darkens the centre above the busy rings so the CTA wordmark clears the gate. Deep CTA ground.
      const ring = (inset: string, tint: number, alpha: number, speed: number, w: number) => (
        <div style={{ position: 'absolute', inset, border: `${w}px solid ${hexA(shade(a, tint), alpha)}`, borderRadius: '22%', transform: `rotate(${(frame * speed) % 360}deg)` }} />
      )
      return (
        <AbsoluteFill>
          <AbsoluteFill style={{ background: `radial-gradient(120% 95% at 50% 42%, ${shade(a, -0.32)}, ${shade(a, -0.58)} 64%, ${shade(a, -0.74)})` }} />
          {ring('7%', 0.12, 0.72, 0.1, 2.5)}
          {ring('19%', 0.3, 0.6, -0.13, 2)}
          {ring('31%', 0.46, 0.5, 0.08, 2)}
          {ring('43%', 0.6, 0.4, -0.16, 1.5)}
          <AbsoluteFill style={{ background: `radial-gradient(48% 34% at 50% 50%, ${hexA(shade(a, -0.68), 0.8)}, ${hexA(shade(a, -0.68), 0.3)} 58%, transparent 74%)` }} />
          {grain}
        </AbsoluteFill>
      )
    }
    default: // 'mesh' — BrandField v3 (honours the tone)
      return <BrandField accent={a} frame={frame} tone={tone} />
  }
}

// ---- CHARACTER ON A CARD (reels brief C1, 21 Oct 2026): a saved character's cut-out (its background taken off by Bria),
// small, in the lower-left corner of the safe area - 64px in from the side, its feet on the line the apps' own captions
// start below (35% up from the bottom) - with a soft shadow, popping up a moment after the card. It NEVER sits on the
// words: the card's words are laid out once more, hidden and fully revealed (Freeze at the card's last frame), and the
// character takes the biggest size up to its own that clears every word, the logo and the name by 20px - measured on
// the layout, so it is the same size on every frame. No size from 150px up fits: no character. On a text card the words
// start at the top of the safe area to make room. MUST stay identical in both copies.
const CARD_CHARACTER = { text: 300, cta: 220 }
const CHARACTER_FEET = 1248
const CardCharacter: React.FC<{ src?: string | null; size: number; frame: number; fps: number; durationInFrames: number; avoid: React.ReactNode }> = ({ src, size, frame, fps, durationInFrames, avoid }) => {
  const ghost = React.useRef<HTMLDivElement>(null)
  const [fit, setFit] = React.useState<number | null>(null)
  React.useLayoutEffect(() => {
    const root = ghost.current
    if (!root || !src) return
    const boxes: { x: number; y: number; r: number; b: number }[] = []
    root.querySelectorAll('*').forEach((n) => {
      const el = n as HTMLElement
      if (el.tagName !== 'IMG' && (el.children.length || !(el.textContent || '').trim())) return
      let x = 0, y = 0, e: HTMLElement | null = el
      while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent as HTMLElement | null }
      if (el.offsetWidth && el.offsetHeight) boxes.push({ x, y, r: x + el.offsetWidth, b: y + el.offsetHeight })
    })
    let best: number | null = null
    for (let s = size; s >= 150; s -= 10) {
      const c = { x: 64 - 20, y: CHARACTER_FEET - s - 20, r: 64 + s + 20, b: CHARACTER_FEET + 20 }
      if (!boxes.some((w) => w.x < c.r && w.r > c.x && w.y < c.b && w.b > c.y)) { best = s; break }
    }
    if (best !== fit) setFit(best)
  })
  if (!src) return null
  const s = spring({ frame: frame - 5, fps, config: { damping: 15, mass: 0.7, stiffness: 140 } })
  return (
    <>
      <div ref={ghost} aria-hidden style={{ position: 'absolute', inset: 0, visibility: 'hidden', pointerEvents: 'none' }}>
        <Freeze frame={Math.max(0, durationInFrames - 1)}>{avoid}</Freeze>
      </div>
      {fit ? <Img src={src} style={{ position: 'absolute', left: 64, top: CHARACTER_FEET - fit, width: fit, height: fit, objectFit: 'contain', objectPosition: 'left bottom', opacity: s, transform: `translateY(${(1 - s) * 40}px)`, filter: 'drop-shadow(0 14px 24px rgba(0,0,0,.4))' }} /> : null}
    </>
  )
}
// ---- end CHARACTER ON A CARD
// ===== PUNCH LOOK (reels batch R1, 22 Oct 2026) =====
// Daniel, 22 Oct 2026, on a reference ad: "this is the kind of premium finished video I'm on about", then "use them as reference
// but dont copy them directly" and "I want this in the generations code". The rules measured from it, built in Creslo's own look
// (project doc claude/reels-reference-2026-10-22.md):
// - the words being said, one to three at a time, Title Case, white, heavy, a soft shadow and no box, centred in the upper third;
//   a group replaces the last with no animation, except the first group of a sentence and any long word, which wipe in left to
//   right out of a blur in 6 frames (0.2 s);
// - the call to action's keyword lands large at the top as it is said and stays while the last words change under it;
// - a text card is paper in the brand's colours with a fine dot grid, its words landing one by one in different places; split
//   (paper above, the next shot below) when footage follows, the paper squeezing up into it at the end;
// - the end card's logo is thrown in, lands with a squash and settles, the name typing out under it.
// MUST stay identical in both copies (the reel mirror test compares from "PUNCH LOOK" to "END PUNCH LOOK").
export type PunchWord = { t: string; s: number; e: number; k?: number }
export const PUNCH_TOP = 0.24
const PUNCH_FONT = 'Archivo Black'
const PUNCH_EM = 0.72   // Archivo Black capitals: about 0.72 of the size per letter
const punchLetters = (t: string) => t.replace(/[^A-Za-z0-9]/g, '').length
// The look of every punch word over a picture: heavy capitals, a dark outline round the letters, a hard shadow and a soft one.
const punchType = (size: number): React.CSSProperties => ({
  fontFamily: fam(PUNCH_FONT), fontWeight: 400, fontSize: size, letterSpacing: '0.005em', textTransform: 'uppercase',
})
// The key word of a group: a figure, else the longest word of 5 letters or more, else none.
export function punchKey(ws: string[]): number {
  const fig = ws.findIndex((w) => /\d/.test(w))
  if (fig >= 0) return fig
  let best = -1, len = 4
  ws.forEach((w, i) => { const n = punchLetters(w); if (n > len) { best = i; len = n } })
  return best
}
export const titleWord = (w: string) => { const i = w.search(/[A-Za-z]/); return i < 0 ? w : w.slice(0, i) + w.charAt(i).toUpperCase() + w.slice(i + 1) }
// Groups: up to three words and 12 letters; a word of 8 letters or more stands alone; a group closes at punctuation and where
// the call to action's words begin (k).
export function punchGroups(words: PunchWord[]): PunchWord[][] {
  const out: PunchWord[][] = []
  let cur: PunchWord[] = []
  let len = 0
  for (const w0 of words || []) {
    const t = String((w0 && w0.t) || '').trim()
    if (!t) continue
    const w = { ...w0, t }
    const long = punchLetters(t) >= 8
    if (cur.length && (cur.length >= 3 || len + t.length > 12 || long || !!w.k !== !!cur[0].k)) { out.push(cur); cur = []; len = 0 }
    cur.push(w)
    len += t.length + (cur.length > 1 ? 1 : 0)
    if (long || /[.,!?;:]$/.test(t)) { out.push(cur); cur = []; len = 0 }
  }
  if (cur.length) out.push(cur)
  // A group of only small joining words ("and it is", "the") never stands alone: it joins the next group, so every slip carries
  // a word that means something (read beside ManyChat frame by frame, 22 Oct 2026). Not across a full stop or comma, and never
  // past six words.
  const small = (t: string) => PUNCH_SMALL.has(t.toLowerCase().replace(/[^a-z]/g, ''))
  for (let i = out.length - 2; i >= 0; i--) {
    const g = out[i]
    if (g.every((w) => small(w.t)) && !/[.,!?;:]$/.test(g[g.length - 1].t) && g.length + out[i + 1].length <= 6) out.splice(i, 2, g.concat(out[i + 1]))
  }
  return out
}
// A line with no voice: its words paced through the beat (across the spoken span when there is one).
export function punchLineWords(text: string, dur: number, speech?: { start: number; end: number }): PunchWord[] {
  const ws = String(text || '').trim().split(/\s+/).filter(Boolean)
  if (!ws.length) return []
  const s0 = speech ? Math.max(0, speech.start) : 2
  const s1 = Math.max(s0 + ws.length * 4, Math.min(dur - 6, speech ? speech.end : dur - 6))
  const step = (s1 - s0) / ws.length
  return ws.map((t, i) => ({ t, s: Math.round(s0 + i * step), e: Math.round(s0 + (i + 1) * step) - 1 }))
}
// Big, and never wider than 80% of the frame.
const punchSize = (width: number, text: string, max = 0.104) => Math.round(Math.min(width * max, (width * 0.84) / Math.max(1, text.length * PUNCH_EM)))
const PUNCH_SHADOW = '0 6px 22px rgba(0,0,0,0.55), 0 2px 4px rgba(0,0,0,0.5)'
const pHex = (hex: string): [number, number, number] => {
  const h = (/^#[0-9a-fA-F]{3,8}$/.test(hex || '') ? hex : '#9d6a40').replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)
  const n = parseInt(f, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const pLum = (rgb: [number, number, number]) => { const c = rgb.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] }
const pMix = (a: [number, number, number], b: [number, number, number], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t)) as [number, number, number]
const pCss = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`
// The paper and its ink, from the brand colour: paper is cream with a breath of the brand; ink is the brand darkened until it
// reads at 4.5:1 on that paper (readability law).
export function punchPaper(accent: string): { paper: string; ink: string; dot: string } {
  const a = pHex(accent)
  const paper = pMix([250, 246, 239], a, 0.05)
  let ink = a
  for (let i = 0; i < 12 && (pLum(paper) + 0.05) / (pLum(ink) + 0.05) < 4.5; i++) ink = pMix(ink, [20, 14, 10], 0.25)
  return { paper: pCss(paper), ink: pCss(ink), dot: `rgba(${ink[0]},${ink[1]},${ink[2]},0.13)` }
}
// The key word's colour: the brand's own, lightened until it is bright beside the dark outline (luminance 0.4 or more).
export function punchTint(accent: string): string {
  // The brand's hue, made vivid and light (saturation at least 0.7, lightness 0.66), then lightened further only if it is
  // still dim - a pale cream tint read weak on the picture (22 Oct 2026, PUNCH LOOK 3).
  const [r, g, b] = pHex(accent).map((v) => v / 255)
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn
  let h = 0
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  h = (h * 60 + 360) % 360
  const l0 = (mx + mn) / 2, s0 = d ? d / (1 - Math.abs(2 * l0 - 1)) : 0
  const s = d ? Math.max(0.7, s0) : 0, l = 0.66
  const c2 = (1 - Math.abs(2 * l - 1)) * s, x = c2 * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c2 / 2
  const [r1, g1, b1] = h < 60 ? [c2, x, 0] : h < 120 ? [x, c2, 0] : h < 180 ? [0, c2, x] : h < 240 ? [0, x, c2] : h < 300 ? [x, 0, c2] : [c2, 0, x]
  let c: [number, number, number] = [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)]
  for (let i = 0; i < 10 && pLum(c) < 0.38; i++) c = pMix(c, [255, 250, 242], 0.12)
  return pCss(c)
}

// The words being said (or a line with no voice), and the call to action's keyword held above them.
// PUNCH LOOK 4 - THE WORDS ARE PAPER TOO (Daniel, 22 Oct 2026: "Is there a more premium way visualise these beat texts ... we
// want everything reading and bouncing off one another so it all looks like it's meant to be there because at the minute the
// beat text just look like an after thought"). The words are now made of the same things as the layers: slips of the same
// paper, the same ink, the same corner, shadow and spring as the number tile, the list header and the steps panel. Each group
// is a slip (or two, stacked, a line each) leaning a degree or two, alternately; its key word sits on a block of the brand
// colour (the approved "key word on a brand-colour block", 8 Oct 2026); each word appears in the slip as it is said; the next
// slip lands as the last one lifts away, so they hand over rather than cut. Over the big number the slip docks on the tile's
// top edge. The typeface follows the brand's headline font (punchLook). Readable on any picture: ink on paper at 4.5:1.
export type PunchLook = 'serif' | 'condensed' | 'heavy'
export const punchLook = (font?: { family: string } | null): PunchLook => {
  const f = String((font && font.family) || '')
  return f === 'Playfair Display' || f === 'Fraunces' ? 'serif' : f === 'Oswald' ? 'condensed' : 'heavy'
}
const LOOK_FONT: Record<PunchLook, string> = { serif: 'Playfair Display', condensed: 'Oswald', heavy: PUNCH_FONT }
// How wide a line of words is, in ems, MEASURED from the fonts' own widths (22 Oct 2026, fontTools on the installed files):
// Archivo Black capitals 0.72-0.76 (UNMISTAKABLY 0.755), Oswald 700 capitals up to 0.53, Playfair 700 italic capitals up to
// 0.69 and its small letters about 0.47. The old single figures under-measured long capital words, so a slip of
// "COMFORTABLE," ran to the frame's edge in the stress reel. Every slip is sized from this, with room to spare (never cut off).
const CAP_EM: Record<PunchLook, number> = { serif: 0.7, condensed: 0.55, heavy: 0.78 }
const LOW_EM: Record<PunchLook, number> = { serif: 0.5, condensed: 0.46, heavy: 0.78 }
const punchEms = (look: PunchLook, s: string) => Array.from(s).reduce((m, ch) => m + (ch === ' ' ? 0.3 : /[A-Z]/.test(ch) ? CAP_EM[look] : LOW_EM[look]), 0)
// Where the words sit, from the beat's caption zone (the band with least in it): never in the apps' top 14% or bottom 35%.
const punchTopFor = (zone?: string | null) => (zone === 'middle' ? 0.4 : zone === 'bottom' ? 0.5 : PUNCH_TOP)
// The brand-colour block a key word sits on, and the colour its letters take (4.5:1 on the block, or the ink on a light block).
export function punchBlock(accent: string): { bg: string; fg: string } {
  const a = pHex(accent)
  const paper = pMix([250, 246, 239], a, 0.05)
  const ratio = (x: [number, number, number], y: [number, number, number]) => { const l1 = pLum(x), l2 = pLum(y); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) }
  let bg = a
  for (let i = 0; i < 10 && ratio(bg, paper) < 4.5 && ratio(bg, [20, 14, 10]) < 4.5; i++) bg = pMix(bg, [20, 14, 10], 0.18)
  return { bg: pCss(bg), fg: ratio(bg, paper) >= 4.5 ? pCss(paper) : 'rgb(20,14,10)' }
}
// Words into lines of up to 12 letters (a long word alone).
const punchLines = (ws: string[]): number[][] => {
  const out: number[][] = []
  ws.forEach((w, i) => { const l = out[out.length - 1]; const len = l ? l.reduce((m, k) => m + ws[k].length + 1, -1) : 0; if (l && len + 1 + w.length <= 12) l.push(i); else out.push([i]) })
  return out
}
// The top of the big number's tile, so a slip can sit on it (PunchLayer 'number' draws the tile from the same sums).
export const punchNumberTop = (width: number, height: number, text: string) => {
  const size = Math.round(Math.min(width * 0.25, (width * 0.68) / Math.max(1, String(text).length * PUNCH_EM)))
  return height * 0.53 - (size * 1.4 + 14) / 2
}
// Small joining words set smaller and raised, as ManyChat's "THINK of ALL" (read frame by frame 22 Oct 2026).
const PUNCH_SMALL = new Set(['of', 'the', 'a', 'an', 'to', 'and', 'in', 'on', 'for', 'with', 'at', 'by', 'or', 'is', 'it', 'its', 'your', 'our', 'my'])
// One stack of slips. arrive(i): how far word i has arrived (0-1); land: the stack's own spring (0-1); lift: leaving (0-1).
// Words not yet said take no room, so the slip grows as they are said (ManyChat's block grows word by word, 22 Oct 2026).
// Every other group's slip is the brand colour with its key word on paper, so the colour changes as the groups change.
const PunchSlips: React.FC<{ ws: string[]; keyIndex: number; size: number; look: PunchLook; accent: string; seed: number; land: number; lift?: number; arrive?: (i: number) => number; style?: React.CSSProperties }> = ({ ws, keyIndex, size, look, accent, seed, land, lift = 0, arrive, style }) => {
  const pp = punchPaper(accent)
  const bb = punchBlock(accent)
  const flip = seed % 2 === 1
  const paper = flip ? bb.bg : pp.paper, ink = flip ? bb.fg : pp.ink
  const block = flip ? { bg: pp.paper, fg: pp.ink } : bb
  const face: React.CSSProperties = look === 'serif'
    ? { fontFamily: fam('Playfair Display'), fontWeight: 700, fontStyle: 'italic', letterSpacing: '-0.01em' }
    : look === 'condensed' ? { fontFamily: fam('Oswald'), fontWeight: 700, letterSpacing: '0.01em' } : { fontFamily: fam(PUNCH_FONT), fontWeight: 400, letterSpacing: '0.005em' }
  const lines = punchLines(ws)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.1, opacity: Math.min(1, land * 2.5) * Math.max(0, 1 - lift * 2.2), transform: `translateY(${-lift * size * 1.6}px) scale(${(0.7 + 0.3 * land) * (1 - lift * 0.12)})`, transformOrigin: '50% 100%', ...style }}>
      {lines.map((ln, li) => {
        const tilt = ((seed + li) % 2 ? 1.6 : -1.8) * (0.4 + 0.6 * land)
        if (arrive && ln.every((k) => arrive(k) <= 0)) return null
        return (
          <div key={li} style={{ ...face, fontSize: size, lineHeight: 1.12, color: ink, background: paper, borderRadius: Math.round(size * 0.24), padding: `${Math.round(size * 0.12)}px ${Math.round(size * 0.3)}px ${Math.round(size * 0.14)}px`, boxShadow: '0 24px 50px -22px rgba(0,0,0,0.65), 0 2px 0 rgba(0,0,0,0.08)', transform: `rotate(${tilt}deg) translateY(${(1 - land) * size * 0.3 * (li + 1)}px)`, whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums' }}>
            {ln.map((k, j) => {
              const a = arrive ? arrive(k) : 1
              if (a <= 0) return null
              const on = k === keyIndex
              const isSmall = (t: string) => PUNCH_SMALL.has(t.toLowerCase().replace(/[^a-z]/g, ''))
              const small = !on && ws.length > 1 && isSmall(ws[k]) && ws.some((w) => !isSmall(w))   // never when every word is a small one
              return (
                <span key={k} style={{ display: 'inline-block', verticalAlign: small ? '0.45em' : undefined, fontSize: small ? '0.58em' : undefined, marginLeft: j ? size * 0.22 : 0, opacity: Math.min(1, 0.25 + a), transform: a < 1 ? `translateY(${(1 - a) * size * 0.18}px) scale(${1 + (1 - a) * 0.12})` : undefined, ...(on ? { background: block.bg, color: block.fg, borderRadius: Math.round(size * 0.14), padding: `0 ${Math.round(size * 0.16)}px`, margin: `0 ${-Math.round(size * 0.06)}px 0 ${j ? Math.round(size * 0.16) : -Math.round(size * 0.06)}px` } : {}) }}>{ws[k]}</span>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
// As wide as the safe area allows (ManyChat's keyword block is most of the picture's width, read 22 Oct 2026): up to 84% of the
// width for the longest line, the font no bigger than the cap.
const punchSlipSize = (width: number, ws: string[], look: PunchLook, cap = 0.1) => {
  const longest = punchLines(ws).reduce((m, l) => Math.max(m, punchEms(look, l.map((k) => ws[k]).join(' '))), 1)
  return Math.round(Math.min(width * cap, (width * 0.84) / Math.max(1, longest + 0.8)))
}
// NOTHING SAID TWICE ON SCREEN (Daniel, 22 Oct 2026: "Why does the number come in twice? Surely you can make the code smart
// enough to never duplicate things?"). The spoken words over a layer leave out what the layer already shows: the figure itself
// (12,500 / 12500.00 / "twelve thousand five hundred"), its unit ("weeks", "pounds", "percent") and any other word on the tile.
// What is left still says the line ("Weddings from" over a GBP 12,500 tile). A joining "and" left between two dropped number words
// goes with them.
const NUM_WORDS = new Set(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'hundred', 'thousand', 'million', 'billion', 'half', 'point'])
export function punchWithout(words: PunchWord[], shown?: string | null): PunchWord[] {
  const text = String(shown || '').trim()
  if (!text || !Array.isArray(words)) return words || []
  const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9]/g, '')
  const stem = (t: string) => norm(t).replace(/s$/, '')
  const value = (t: string) => { const d = t.replace(/[^0-9.]/g, ''); return /\d/.test(d) ? parseFloat(d) : NaN }
  const onTile = new Set(text.split(/\s+/).map(stem).filter(Boolean))
  const values = text.split(/\s+/).map(value).filter((v) => Number.isFinite(v))
  if (/\u00a3/.test(text)) { onTile.add('pound'); onTile.add('quid') }
  if (/\$/.test(text)) onTile.add('dollar')
  if (/%/.test(text)) { onTile.add('percent'); onTile.add('per'); onTile.add('cent') }
  const hasFigure = values.length > 0
  const drop = words.map((w) => {
    const t = String((w && w.t) || '')
    const v = value(t)
    if (Number.isFinite(v) && values.some((x) => Math.abs(x - v) < 1e-9)) return true
    return onTile.has(stem(t))
  })
  // A number said in words goes only as a run - next to another number word, the unit or the figure - so "the one we love"
  // keeps its "one". A joining "and" inside the run goes too.
  const isNum = (i: number) => i >= 0 && i < words.length && hasFigure && NUM_WORDS.has(norm(String((words[i] && words[i].t) || '')))
  const isAnd = (i: number) => norm(String((words[i] && words[i].t) || '')) === 'and' && isNum(i - 1) && isNum(i + 1)
  for (let pass = 0; pass < 4; pass++) words.forEach((w, i) => { if (!drop[i] && (isNum(i) || isAnd(i)) && (isNum(i - 1) || isNum(i + 1) || drop[i - 1] || drop[i + 1])) drop[i] = true })
  return words.filter((_, i) => !drop[i])
}
export const PunchCaptions: React.FC<{ words: PunchWord[]; heading?: string | null; weight?: number; accent?: string; font?: { family: string } | null; zone?: string | null; dock?: number | null; shown?: string | null }> = ({ words: said, heading, accent = '#9d6a40', font, zone, dock, shown }) => {
  const words = punchWithout(said, shown)
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  const look = punchLook(font)
  ensureFont(PUNCH_FONT)
  ensureFont(LOOK_FONT[look])
  const groups = punchGroups(words)
  const kWord = (words || []).find((w) => w && w.k)
  const headOn = !!heading && !!kWord && frame >= kWord.s - 2
  const hs = headOn ? spring({ frame: frame - (kWord!.s - 2), fps, config: { damping: 11, mass: 0.7, stiffness: 160 } }) : 0
  const head = String(heading || '').toUpperCase()
  let gi = -1
  for (let i = 0; i < groups.length; i++) if (frame >= groups[i][0].s - 1) gi = i
  const caseOf = (t: string) => (look === 'serif' ? t : t.toUpperCase())
  const slip = (k: number, leaving: boolean) => {
    const g = groups[k]
    const ws = g.map((w) => caseOf(w.t))
    const land = spring({ frame: frame - (g[0].s - 1), fps, config: { damping: 11, mass: 0.7, stiffness: 160 } })
    // The last slip leaves at once as the next lands (out-easing: most of the lift in the first frame), so the two never sit
    // over each other for a frame (seen in the 15 fps strip, 22 Oct 2026).
    const lift = leaving ? interpolate(frame, [groups[k + 1][0].s - 1, groups[k + 1][0].s + 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) : 0
    const arrive = (i: number) => interpolate(frame, [g[i].s - 1, g[i].s + 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const size = punchSlipSize(width, ws, look, 0.15)
    const anchor: React.CSSProperties = dock != null
      ? { position: 'absolute', left: 0, right: 0, bottom: height - dock + 22 }
      : { position: 'absolute', left: 0, right: 0, top: headOn ? height * 0.15 + head.length * 0 + width * 0.2 : height * punchTopFor(zone) }
    return <PunchSlips key={k} ws={ws} keyIndex={punchKey(ws)} size={size} look={look} accent={accent} seed={k} land={land} lift={lift} arrive={arrive} style={anchor} />
  }
  const g = gi >= 0 ? groups[gi] : null
  const last = g ? g[g.length - 1] : null
  const nextStart = gi + 1 < groups.length ? groups[gi + 1][0].s - 1 : Infinity
  const showLine = !!g && !!last && frame <= Math.min(nextStart, last.e + 14)
  const leaving = gi >= 1 && frame <= groups[gi][0].s + 3 && frame <= groups[gi - 1][groups[gi - 1].length - 1].e + 30
  const headSize = Math.round(Math.min(width * 0.15, (width * 0.8) / Math.max(1, punchEms(look, head) + 0.8)))
  const block = punchBlock(accent)
  return (
    <>
      {headOn ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: height * 0.15, display: 'flex', justifyContent: 'center' }}>
          <div style={{ fontFamily: fam(LOOK_FONT[look]), fontWeight: look === 'heavy' ? 400 : 700, fontStyle: look === 'serif' ? 'italic' : undefined, fontSize: headSize, lineHeight: 1.1, color: block.fg, background: block.bg, borderRadius: Math.round(headSize * 0.22), padding: `${Math.round(headSize * 0.1)}px ${Math.round(headSize * 0.3)}px`, boxShadow: '0 30px 60px -24px rgba(0,0,0,0.7)', transform: `rotate(${-2 * hs}deg) scale(${0.5 + 0.5 * hs})`, opacity: Math.min(1, hs * 2.5), whiteSpace: 'nowrap' }}>{head}</div>
        </div>
      ) : null}
      {leaving ? slip(gi - 1, true) : null}
      {showLine ? slip(gi, false) : null}
    </>
  )
}

// The opening title: the hook's words, whole, from the first frame (decision 3 A), as a stack of slips - its key word on the block.
export const PunchTitle: React.FC<{ text: string; accent?: string; font?: { family: string } | null }> = ({ text, accent = '#9d6a40', font }) => {
  const { width, height } = useVideoConfig()
  const look = punchLook(font)
  ensureFont(PUNCH_FONT)
  ensureFont(LOOK_FONT[look])
  const ws = String(text || '').trim().split(/\s+/).filter(Boolean).map((w) => (look === 'serif' ? w : w.toUpperCase()))
  if (!ws.length) return null
  return <PunchSlips ws={ws} keyIndex={punchKey(ws)} size={punchSlipSize(width, ws, look, 0.125)} look={look} accent={accent} seed={0} land={1} style={{ position: 'absolute', left: 0, right: 0, top: height * (PUNCH_TOP - 0.05) }} />
}

// A text card on paper. Split (paper above, the next shot frozen below) when footage follows; the paper squeezes up into the
// shot in its last 5 frames. Full paper otherwise, the words sliding off to the right together at the end.
export const PunchPaper: React.FC<{ text: string; accent: string; durationInFrames: number; shot?: { src: string; start?: number } | null; still?: string | null }> = ({ text, accent, durationInFrames, shot, still }) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  ensureFont(PUNCH_FONT)
  const { paper, ink, dot } = punchPaper(accent)
  const split = !!(shot && shot.src)
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).map(titleWord)
  // Rows of up to 12 letters, set left, right and centre in turn.
  const rows: string[][] = []
  for (const w of words) { const r = rows[rows.length - 1]; if (r && r.join(' ').length + 1 + w.length <= 12) r.push(w); else rows.push([w]) }
  const panelH = split ? height * 0.5 : height
  const longestRow = rows.reduce((m, r) => Math.max(m, r.join(' ').length), 1)
  const size = Math.round(Math.min(width * 0.15, (width * 0.82) / (longestRow * PUNCH_EM), (panelH * 0.62) / Math.max(1, rows.length * 1.1)))
  const step = Math.max(3, Math.min(8, (durationInFrames * 0.5) / Math.max(1, words.length)))
  const squeeze = split ? interpolate(frame, [durationInFrames - 6, durationInFrames - 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1
  const slide = split ? 0 : interpolate(frame, [durationInFrames - 7, durationInFrames - 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const wash = interpolate(frame, [0, 3], [0.8, 0], { extrapolateRight: 'clamp' })
  const [ar, ag, ab] = pHex(accent)
  const aligns = ['flex-start', 'flex-end', 'center'] as const
  let wi = 0
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {split ? (
        <Freeze frame={0}>
          <OffthreadVideo src={shot!.src} muted trimBefore={shot!.start ? Math.round(shot!.start * fps) : undefined} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Freeze>
      ) : still ? <Img src={still} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: panelH * squeeze, overflow: 'hidden', background: paper, backgroundImage: `radial-gradient(${dot} 1.6px, transparent 2px)`, backgroundSize: '26px 26px' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: panelH, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: size * 0.1, padding: `${split ? height * 0.1 : 0}px ${width * 0.09}px 0`, transform: `translateX(${slide * width * 1.1}px)` }}>
          {rows.map((r, ri) => (
            <div key={ri} style={{ display: 'flex', justifyContent: rows.length === 1 ? 'center' : aligns[ri % 3], gap: size * 0.26 }}>
              {r.map((w) => {
                const at = 2 + (wi++) * step
                const s = spring({ frame: frame - at, fps, config: { damping: 15, mass: 0.5, stiffness: 190 } })
                return <span key={w + at} style={{ display: 'inline-block', fontFamily: fam(PUNCH_FONT), fontWeight: 400, fontSize: size, lineHeight: 1.05, letterSpacing: '0', color: ink, opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * size * 0.35}px) scale(${0.9 + 0.1 * s})` }}>{w}</span>
              })}
            </div>
          ))}
        </div>
        <AbsoluteFill style={{ background: `rgba(${ar},${ag},${ab},${wash})`, filter: 'blur(20px)' }} />
      </div>
    </AbsoluteFill>
  )
}

// The end card: the logo thrown in, landing with a squash and settling; the name typed out under it; the call to action under
// that. A brand with no logo gets a dot in its colour. The logo is shown as uploaded, never recoloured.
export const PunchEnd: React.FC<{ text: string; accent: string; logo?: string | null; wordmark?: string | null; name?: string; still?: string | null; nameFont: string; durationInFrames: number }> = ({ text, accent, logo, wordmark, name, still, nameFont, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  ensureFont(PUNCH_FONT)
  const T = 14
  const t = Math.min(1, frame / T)
  const ease = 1 - Math.pow(1 - t, 2)
  const x = interpolate(ease, [0, 1], [-0.2 * width, 0.5 * width])
  const y = interpolate(ease, [0, 1], [0.66 * height, 0.33 * height]) - Math.sin(Math.PI * t) * 0.12 * height
  const land = frame >= T ? spring({ frame: frame - T, fps, config: { damping: 9, mass: 0.5, stiffness: 260 } }) : 0
  const sqX = frame < T ? 1 : 1 + 0.28 * (1 - land), sqY = frame < T ? 1 : 1 - 0.28 * (1 - land)
  const spin = frame < T ? -28 * (1 - ease) : 0
  const mark = 260
  const nm = String(name || '').trim()
  const per = Math.max(1, Math.min(3, 18 / Math.max(1, nm.length)))
  const shown = Math.max(0, Math.min(nm.length, Math.floor((frame - (T + 2)) / per) + 1))
  const wm = interpolate(frame, [T + 2, T + 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cta = spring({ frame: frame - (T + 8), fps, config: { damping: 16, mass: 0.6, stiffness: 160 } })
  const ctaText = String(text || '').trim().split(/\s+/).filter(Boolean).map(titleWord).join(' ')
  const nameSize = Math.min(104, Math.max(56, Math.round(1000 / Math.max(8, nm.length))))
  return (
    <AbsoluteFill>
      <StillGround src={still} accent={accent} frame={frame} durationInFrames={durationInFrames} dim={0.4} tint={0.3} />
      <div style={{ position: 'absolute', left: x - mark / 2, top: y - mark / 2, width: mark, height: mark, transformOrigin: '50% 100%', transform: `rotate(${spin}deg) scale(${sqX}, ${sqY})` }}>
        {logo ? <Img src={logo} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 16px 30px rgba(0,0,0,.45))' }} />
          : <div style={{ width: '62%', height: '62%', margin: '19%', borderRadius: '50%', background: accent, boxShadow: '0 16px 30px rgba(0,0,0,.45)' }} />}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: height * 0.33 + mark * 0.62, display: 'flex', justifyContent: 'center' }}>
        {wordmark ? (
          <Img src={wordmark} style={{ maxWidth: 620, maxHeight: 140, objectFit: 'contain', WebkitMaskImage: `linear-gradient(90deg, #000 ${wm * 130 - 30}%, transparent ${wm * 130}%)`, maskImage: `linear-gradient(90deg, #000 ${wm * 130 - 30}%, transparent ${wm * 130}%)`, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.35))' }} />
        ) : nm ? (
          <div style={{ fontFamily: nameFont, fontWeight: 400, fontSize: nameSize, color: '#FFFFFF', whiteSpace: 'nowrap', textShadow: '0 6px 24px rgba(0,0,0,.4)' }}>
            {nm.slice(0, Math.max(0, shown - 1))}<span style={{ filter: shown < nm.length ? 'blur(3px)' : undefined }}>{shown > 0 ? nm.charAt(shown - 1) : ''}</span>
          </div>
        ) : null}
      </div>
      {ctaText ? (
        <PunchSlips ws={ctaText.toUpperCase().split(' ')} keyIndex={-1} size={punchSlipSize(width, ctaText.toUpperCase().split(' '), 'heavy', 0.085)} look="heavy" accent={accent} seed={1} land={cta} style={{ position: 'absolute', left: 0, right: 0, top: height * 0.6 }} />
      ) : null}
    </AbsoluteFill>
  )
}
// LAYERS (reels reference 2, 22 Oct 2026; Daniel: "key priority is spitting out premium products like these videos"): every
// line shown, not just said. Over a footage beat, under the words: the figure big on a paper tile, counting up; a numbered list
// point typed in as a header that stays up from point to point; the panel of numbered steps; or the owner's own picture in a
// card. LAYERS 2 (Daniel, 22 Oct 2026: "There's 1, 2, 3 but the loading stages whatever doesn't flow.. we need these reels to
// flow better", "watch the motion of them too"): the steps panel stays up from step to step (it slides in once, at step 1),
// lists every step, scrolls to the one being said, ticks the ones done, and its bar fills through each step as it plays - so
// across the cut it carries on where it left off (Native's split panel, read at 15 frames a second, 22 Oct). Nothing sits
// still: the tile and the card float, the bar fills. Paper and ink from punchPaper (4.5:1); no picture cropped.
// How far the footage moves up while the steps panel is up, so what was filmed stays in the top part.
export const punchLift = (layer: ReelLayer | null | undefined, frame: number, fps: number, height: number): number => {
  if (!layer || layer.kind !== 'steps') return 0
  const up = layer.n === 1 ? spring({ frame: frame - 2, fps, config: { damping: 18, mass: 0.8, stiffness: 120 } }) : 1
  return up * height * 0.2
}
const punchCount = (text: string, t: number): string => {
  const m = String(text).match(/^([^\d]*)(\d[\d,]*(?:\.\d+)?)(.*)$/)
  if (!m || t >= 1) return text
  const raw = m[2].replace(/,/g, '')
  const dec = (raw.split('.')[1] || '').length
  const v = Number(raw) * t
  const s = dec ? v.toFixed(dec) : String(Math.round(v))
  return m[1] + (m[2].includes(',') ? Number(s).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : s) + m[3]
}
export const PunchLayer: React.FC<{ layer: ReelLayer; accent: string; durationInFrames?: number }> = ({ layer, accent, durationInFrames = 90 }) => {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()
  ensureFont(PUNCH_FONT)
  ensureFont('Inter')
  const { paper, ink, dot } = punchPaper(accent)
  const head = fam(PUNCH_FONT)
  const body = fam('Inter')
  const float = Math.sin(frame / 17) * 7
  if (layer.kind === 'number') {
    const s = spring({ frame: frame - 3, fps, config: { damping: 11, mass: 0.7, stiffness: 160 } })
    const count = interpolate(frame, [3, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
    const size = Math.round(Math.min(width * 0.25, (width * 0.68) / Math.max(1, layer.text.length * PUNCH_EM)))
    return (
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingTop: height * 0.06 }}>
        <div style={{ transform: `translateY(${float}px) scale(${0.4 + 0.6 * s}) rotate(${(1 - s) * -4}deg)`, opacity: Math.min(1, s * 3), background: paper, borderRadius: 44, padding: `${Math.round(size * 0.14)}px ${Math.round(size * 0.3)}px ${Math.round(size * 0.16)}px`, boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: head, fontWeight: 400, fontSize: size, lineHeight: 1, color: ink, letterSpacing: '-0.01em', fontVariantNumeric: 'lining-nums tabular-nums', whiteSpace: 'nowrap' }}>{punchCount(layer.text, count)}</div>
          <div style={{ height: 14, width: `${Math.round(64 * Math.min(1, Math.max(0, (frame - 14) / 8)))}%`, background: accent, borderRadius: 100, marginTop: Math.round(size * 0.1) }} />
        </div>
      </AbsoluteFill>
    )
  }
  if (layer.kind === 'label') {
    // The header stays up from point to point: it slides in at point 1; at the next point the number turns over and the words
    // type again (ManyChat's section labels, 22 Oct).
    const full = layer.text
    const shown = full.slice(0, Math.max(0, Math.floor((frame - 2) / 1.1)))
    const typing = shown.length < full.length
    // Up to two lines, so a long header stays readable rather than shrinking to a thread (never cut off, never tiny - 22 Oct).
    const oneLine = (width * 0.62) / Math.max(1, full.length * 0.6)
    const two = oneLine < width * 0.045
    const fs = Math.round(Math.min(width * 0.06, two ? (width * 0.62 * 1.85) / Math.max(1, full.length * 0.6) : oneLine))
    const inS = layer.n === 1 ? spring({ frame, fps, config: { damping: 16, mass: 0.6, stiffness: 180 } }) : 1
    const flip = layer.n === 1 ? 1 : interpolate(frame, [0, 7], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
    const disc = fs * 1.55
    return (
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: 0, right: 0, top: height * 0.125, display: 'flex', justifyContent: 'center', opacity: Math.min(1, inS * 2), transform: `translateY(${(1 - inS) * -24}px)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, background: paper, borderRadius: two ? 40 : 100, padding: '18px 40px 18px 18px', boxShadow: '0 24px 50px -22px rgba(0,0,0,0.6)', maxWidth: width * 0.86 }}>
            <span style={{ position: 'relative', width: disc, height: disc, borderRadius: 100, background: ink, overflow: 'hidden', flexShrink: 0 }}>
              {layer.n > 1 ? <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: paper, fontFamily: head, fontSize: fs * 0.92, transform: `translateY(${-flip * disc}px)` }}>{layer.n - 1}</span> : null}
              <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: paper, fontFamily: head, fontSize: fs * 0.92, fontVariantNumeric: 'lining-nums', transform: `translateY(${(1 - flip) * disc}px)` }}>{layer.n}</span>
            </span>
            <span style={{ fontFamily: body, fontWeight: 800, fontSize: fs, lineHeight: 1.12, color: ink, whiteSpace: two ? 'normal' : 'nowrap', width: two ? width * 0.62 : undefined, textWrap: 'balance' } as React.CSSProperties}>{shown}<span style={{ opacity: typing && frame % 16 < 10 ? 1 : 0 }}>|</span></span>
          </div>
        </div>
      </AbsoluteFill>
    )
  }
  if (layer.kind === 'steps') {
    const items = layer.items && layer.items.length >= layer.n ? layer.items : Array.from({ length: layer.of }, (_, k) => (k === layer.n - 1 ? layer.text : ''))
    const up = layer.n === 1 ? spring({ frame: frame - 2, fps, config: { damping: 18, mass: 0.8, stiffness: 120 } }) : 1
    const top = height * 0.56
    // The steps move up one place from the last step to this one in the first 10 frames (at step 1 they are already there):
    // the step being said large, the next one small under it, the one before going up and out with its tick.
    const move = layer.n === 1 ? 1 : interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) })
    const at = layer.n - 1 - (1 - move)
    const longest = items.reduce((m, t) => Math.max(m, t.length), 0)
    const disc = width * 0.11
    const textW = width * 0.84 - disc - 30
    // As big as three lines allow (the panel is 44% of the picture: the step being said fills it, as the drawing does).
    // NEVER CUT OFF (Daniel, 22 Oct 2026: "this step 2 looks broken though with it being cut off ... if there's too much text
    // anywhere fade it in"): the size is brought down until the step being said and the first line of the next fit above the
    // list's bottom fade; anything below that fades out, never sliced by the frame's edge.
    const linesAt = (n: number, f: number) => Math.max(1, Math.min(3, Math.ceil((n * 0.72 * f) / (textW * 0.92))))
    const room = (height * (1 - 0.56 - 0.075)) * 0.84
    let fs = Math.round(Math.min(width * 0.095, (textW * 2.5) / Math.max(8, longest * 0.72)))
    for (let i = 0; i < 4; i++) {
      const need = fs * (0.6 + 1.1 * linesAt(longest, fs) + 0.7 + 0.6)
      if (need <= room) break
      fs = Math.floor((fs * room) / need)
    }
    const lines = linesAt(longest, fs)
    const slot = fs * (1.1 * lines + 0.7)
    // This step's part of the bar fills through the beat; the steps before are full.
    const fill = interpolate(frame, [0, Math.max(2, durationInFrames - 2)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const place = (p: number) => p <= 0
      ? { y: p * slot * 0.7, k: 1 + p * 0.5, o: Math.max(0, 1 + p * 1.3) }
      : { y: Math.min(p, 1) * slot + Math.max(0, p - 1) * slot * 0.5, k: 1 - 0.5 * Math.min(p, 1), o: p <= 1 ? 1 - 0.55 * p : Math.max(0, 0.45 - 0.45 * (p - 1)) }
    return (
      <AbsoluteFill>
        <div style={{ position: 'absolute', left: 0, right: 0, top, bottom: 0, overflow: 'hidden', transform: `translateY(${(1 - up) * (height - top)}px)`, background: paper, backgroundImage: `radial-gradient(${dot} 2.4px, transparent 2.6px)`, backgroundSize: '34px 34px', borderRadius: '48px 48px 0 0', boxShadow: '0 -24px 60px -30px rgba(0,0,0,0.6)' }}>
          <div style={{ display: 'flex', gap: 14, padding: `${height * 0.04}px ${width * 0.08}px 0` }}>
            {Array.from({ length: layer.of }).map((_, k) => (
              <span key={k} style={{ height: 12, flex: 1, borderRadius: 100, background: 'rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                <span style={{ display: 'block', height: '100%', borderRadius: 100, background: ink, width: `${(k < layer.n - 1 ? 1 : k === layer.n - 1 ? fill : 0) * 100}%` }} />
              </span>
            ))}
          </div>
          <div style={{ position: 'absolute', left: 0, right: 0, top: height * 0.075, bottom: 0, overflow: 'hidden', WebkitMaskImage: 'linear-gradient(180deg, transparent 0, #000 8%, #000 86%, transparent 100%)', maskImage: 'linear-gradient(180deg, transparent 0, #000 8%, #000 86%, transparent 100%)' }}>
            {items.map((t, k) => {
              const p = k - at
              if (p < -1.2 || p > 2.2) return null
              const { y, k: sc, o } = place(p)
              const done = k < layer.n - 1
              const now = k === layer.n - 1
              return (
                <div key={k} style={{ position: 'absolute', left: width * 0.08, width: width * 0.84, top: fs * 0.6, display: 'flex', alignItems: 'flex-start', gap: 30, opacity: o, transformOrigin: '0 0', transform: `translateY(${y}px) scale(${sc})` }}>
                  <span style={{ width: disc, height: disc, borderRadius: 100, background: done || now ? ink : 'transparent', border: done || now ? 'none' : `5px solid ${ink}`, boxSizing: 'border-box', color: paper, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: head, fontSize: disc * 0.5, fontVariantNumeric: 'lining-nums', flexShrink: 0, marginTop: fs * 0.02 }}>
                    {done ? <svg width={disc * 0.56} height={disc * 0.56} viewBox="0 0 24 24" fill="none" stroke={paper} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg> : <span style={{ color: now ? paper : ink }}>{k + 1}</span>}
                  </span>
                  <span style={{ width: textW, fontFamily: head, fontWeight: 400, fontSize: fs, lineHeight: 1.08, color: ink, textWrap: 'balance' } as React.CSSProperties}>{t}</span>
                </div>
              )
            })}
          </div>
        </div>
      </AbsoluteFill>
    )
  }
  // A card: the owner's picture, whole (never cropped), on a paper edge, floating under the words.
  const s = spring({ frame: frame - 2, fps, config: { damping: 14, mass: 0.7, stiffness: 150 } })
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: height * 0.34 }}>
      <div style={{ transform: `translateY(${float}px) scale(${0.82 + 0.18 * s}) rotate(${(1 - s) * 3 - 2}deg)`, opacity: Math.min(1, s * 2.5), background: paper, padding: 12, borderRadius: 40, boxShadow: '0 40px 80px -24px rgba(0,0,0,0.7)' }}>
        <Img src={layer.image} style={{ display: 'block', maxWidth: width * 0.7, maxHeight: height * 0.36, borderRadius: 30 }} />
      </div>
    </AbsoluteFill>
  )
}
// ===== END PUNCH LOOK =====

export const Beat: React.FC<{
  text: string
  isHook: boolean
  clipUrl?: string | null
  accent: string
  index: number
  durationInFrames: number
  captionStyle?: CaptionStyle
  captionConfig?: Partial<Record<CaptionStyle, Partial<StyleConfig>>>
  emphasis?: number[]
  zone?: 'top' | 'middle' | 'bottom'
  beatType?: 'clip' | 'text' | 'cta' | 'mockup'
  poster?: string | null
  brandName?: string
  brandLogo?: string | null
  brandWordmark?: string | null
  fieldTone?: 'light' | 'rich' | 'deep'
  // Per-beat field COLOUR override (storyboard edit popup): the whole text/CTA stage
  // re-derives from this hue instead of the brand colour. Absent = brand colour.
  fieldColor?: string | null
  // Per-beat field STYLE (storyboard edit popup): keyed FieldStage treatment. Absent = mesh.
  fieldStyle?: string | null
  kenBurns?: { enabled?: boolean; intensity?: number } | null
  grade?: string | null
  // Speech-synced captions (phase 9): this beat's spoken span in frames LOCAL to the
  // beat (ReelVideo converts from track seconds). Passed through to Captions.
  speech?: { start: number; end: number }
  // Spoken captions (reels premium pass P1): this beat's words with times, frames local to the
  // beat. A footage or mockup beat (not the hook) shows these instead of its on-screen line.
  spoken?: SpokenWord[]
  // The look (reels premium pass P2): this clip's tone, a still from the reel for a text card or
  // the end card to sit on, and the brand's headline font.
  tone?: Tone | null
  clipStart?: number
  speed?: number
  still?: string | null
  headFont?: { family: string; weight: number } | null
  // A saved character's cut-out on a text card or the end card (C1).
  character?: string | null
  // A text card's ground: the next shot's clip, frozen on its first frame (batch 7).
  shot?: { src: string; start?: number } | null
  // The call to action's keyword, held above the last words (punch look, R1).
  heading?: string | null
  // A layer over the footage in the punch look (reels reference 2): checked by cleanLayer.
  layer?: ReelLayer | null
}> = ({ text, isHook, clipUrl, accent, index, durationInFrames, captionStyle, captionConfig, emphasis, zone, beatType, poster, brandName, brandLogo, brandWordmark, fieldTone, fieldColor, fieldStyle, kenBurns, grade, speech, spoken, tone, still, headFont, clipStart, speed, character, shot, heading, layer }) => {
  const saysIt = !isHook && Array.isArray(spoken) && spoken.length > 0
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  // A failed clip fetch (e.g. a Pexels CDN 503) flips this so the beat degrades to the branded
  // gradient instead of failing the whole reel.
  const [clipFailed, setClipFailed] = React.useState(false)

  // Quick fade-in for a clean cut into each beat.
  // The FIRST beat opens on a picture, not a fade from black: the fade made frame 0 of every reel
  // black - the worst first frame for a hook, and the one a platform may take as the cover
  // (October reels audit R1, 8 Oct 2026).
  // In 4 frames, not 5 (P2b): a plain cut shows the new beat at its 4th frame, which was still at 80%,
  // so every cut dipped for a frame.
  const opacity = index === 0 ? 1 : interpolate(frame, [0, 4], [0, 1], { extrapolateRight: 'clamp' })
  // Slow Ken Burns push; alternate direction per beat for variety. Intensity from reel.kenBurns
  // (absent -> 1 = current default; enabled:false or 0 -> static; >1 -> more dramatic).
  const dir = index % 2 === 0 ? 1 : -1
  const kbI = kenBurns ? (kenBurns.enabled === false ? 0 : (typeof kenBurns.intensity === 'number' ? kenBurns.intensity : 1)) : 1
  const k = Math.max(0, kbI)
  // MOTION (reels premium pass P2, 8 Oct 2026): a still gets the slow Ken Burns push; a moving clip
  // only a gentle drift (its own movement is the motion - pushing and panning it as well read as a
  // template). Nothing else zooms: the punch-in a beat went in P2b (Daniel: "jumpy"). The
  // move runs at one steady speed through the beat, so nothing lurches.
  const moving = !!clipUrl && !clipFailed
  const scale = moving
    ? interpolate(frame, [0, durationInFrames], [1 + 0.03 * k, 1 + 0.07 * k], { extrapolateRight: 'clamp' })
    : interpolate(frame, [0, durationInFrames], [1 + 0.06 * k, 1 + 0.16 * k], { extrapolateRight: 'clamp' })
  const panX = moving ? 0 : interpolate(frame, [0, durationInFrames], [0, 22 * dir * k], { extrapolateRight: 'clamp' })
  // Colour grade over the clip layer (reel.grade -> GRADE_PRESETS), after the clip's own tone.
  const gradeFilter = grade && GRADE_PRESETS[grade] ? GRADE_PRESETS[grade] : undefined
  const toneId = `cr-tone-${index}`
  const lookFilter = [tone ? `url(#${toneId})` : '', gradeFilter && gradeFilter !== 'none' ? gradeFilter : ''].filter(Boolean).join(' ') || undefined
  // The brand's headline font for the hook, the text card and the end card (one font a line).
  const styleKey: CaptionStyle = captionStyle || 'pop'
  const headCfg: any = headFont ? { ...(captionConfig || {}), [styleKey]: { ...(((captionConfig || {}) as any)[styleKey] || {}), font: headFont.family, weight: headFont.weight } } : captionConfig

  // Kinetic text beat (Studio v2 slice 1): the words ARE the scene. A slowly drifting
  // brand-colour field (alternating polarity per beat for rhythm) with the caption
  // rendered at hook scale. Footage and caption zones don't apply here.
  // MUST stay byte-identical to the frontend mirror src/remotion/ReelVideo.tsx.
  // ---- PUNCH CARDS (R1, 22 Oct 2026): in the punch look a text card is paper and the end card throws the logo in.
  const punch = captionStyle === 'punch'
  if (punch && beatType === 'text' && !fieldStyle) {
    const fx = (fieldColor && /^#[0-9a-fA-F]{3,8}$/.test(fieldColor)) ? fieldColor : accent
    return <AbsoluteFill style={{ opacity }}><PunchPaper text={text} accent={fx} durationInFrames={durationInFrames} shot={shot} still={still} /><FilmFinish frame={frame} /></AbsoluteFill>
  }
  if (punch && beatType === 'cta' && !fieldStyle) {
    const fx = (fieldColor && /^#[0-9a-fA-F]{3,8}$/.test(fieldColor)) ? fieldColor : accent
    return <AbsoluteFill style={{ opacity }}><PunchEnd text={text} accent={fx} logo={brandLogo} wordmark={brandWordmark} name={brandName} still={still} nameFont={WORDMARK_FONT} durationInFrames={durationInFrames} /><FilmFinish frame={frame} /></AbsoluteFill>
  }
  // ---- end PUNCH CARDS
  // TEXT CARD (P2): the words over a softened still from the reel (or the plain brand colour), in
  // the headline font. The storyboard's own field styles (fieldStyle) keep the old stage below.
  if (beatType === 'text' && !fieldStyle) {
    const fx = (fieldColor && /^#[0-9a-fA-F]{3,8}$/.test(fieldColor)) ? fieldColor : accent
    const ink = (still || (shot && shot.src)) ? '#FFFFFF' : idealText(fx)
    const cardCfg: any = { ...(headCfg || {}), [styleKey]: { ...(((headCfg || {}) as any)[styleKey] || {}), textColor: ink } }
    return (
      <AbsoluteFill style={{ opacity }}>
        <StillGround src={still} accent={fx} frame={frame} durationInFrames={durationInFrames} shot={shot} />
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + (frame / Math.max(1, durationInFrames)) * 0.03})` }}>
          <Captions text={text} accent={(still || (shot && shot.src)) ? fx : ink} isHook style={captionStyle} durationInFrames={durationInFrames} captionConfig={cardCfg} emphasis={emphasis} zone={character ? 'top' : undefined} speech={speech} />
        </div>
        <CardCharacter src={character} size={CARD_CHARACTER.text} frame={frame} fps={fps} durationInFrames={durationInFrames}
          avoid={<Captions text={text} accent={fx} isHook style={captionStyle} durationInFrames={durationInFrames} captionConfig={cardCfg} emphasis={emphasis} zone="top" speech={speech} />} />
        <FilmFinish frame={frame} />
      </AbsoluteFill>
    )
  }
  // END CARD (P2): the call to action over the reel's last shot, softened under the brand colour,
  // with the logo above and the name below - quick in, nothing floating, no light rays. The old
  // card was 2.7 s of logo on a glow, 18% of the 8 Oct reel.
  if (beatType === 'cta' && !fieldStyle) {
    const fx = (fieldColor && /^#[0-9a-fA-F]{3,8}$/.test(fieldColor)) ? fieldColor : accent
    const inS = spring({ frame: frame - 1, fps, config: { damping: 18, mass: 0.6, stiffness: 170 } })
    const nameS = spring({ frame: frame - 7, fps, config: { damping: 18, mass: 0.6, stiffness: 150 } })
    const name = String(brandName || '').trim()
    const ctaCfg: any = { ...(headCfg || {}), [styleKey]: { ...(((headCfg || {}) as any)[styleKey] || {}), textColor: '#FFFFFF' } }
    return (
      <AbsoluteFill style={{ opacity }}>
        <StillGround src={still} accent={fx} frame={frame} durationInFrames={durationInFrames} dim={0.42} tint={0.3} />
        {brandLogo ? (
          // The logo as uploaded - its own shape, never cropped into a tile or recoloured.
          <Img src={brandLogo} style={{ position: 'absolute', left: '50%', top: '20%', width: 150, height: 150, marginLeft: -75, objectFit: 'contain', opacity: inS, transform: `translateY(${(1 - inS) * 24}px) scale(${0.86 + 0.14 * inS})`, filter: 'drop-shadow(0 14px 30px rgba(0,0,0,.45))' }} />
        ) : null}
        <Captions text={text} accent={fx} isHook style={captionStyle} durationInFrames={durationInFrames} captionConfig={ctaCfg} emphasis={emphasis} speech={speech} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: '60%', display: 'flex', justifyContent: 'center', opacity: nameS, transform: `translateY(${(1 - nameS) * 18}px)` }}>
          {brandWordmark ? (
            <Img src={brandWordmark} style={{ maxWidth: 420, maxHeight: 96, objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,.35))' }} />
          ) : name ? (
            <div style={{ fontFamily: WORDMARK_FONT, fontWeight: 400, fontSize: Math.min(64, Math.max(40, Math.round(760 / Math.max(8, name.length)))), color: '#FFFFFF', textShadow: '0 6px 24px rgba(0,0,0,.4)', whiteSpace: 'nowrap' }}>{name}</div>
          ) : null}
        </div>
        <CardCharacter src={character} size={CARD_CHARACTER.cta} frame={frame} fps={fps} durationInFrames={durationInFrames}
          avoid={<>
            <Captions text={text} accent={fx} isHook style={captionStyle} durationInFrames={durationInFrames} captionConfig={ctaCfg} emphasis={emphasis} speech={speech} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: '60%', display: 'flex', justifyContent: 'center' }}>
              {brandWordmark ? <Img src={brandWordmark} style={{ maxWidth: 420, maxHeight: 96, objectFit: 'contain' }} />
                : name ? <div style={{ fontFamily: WORDMARK_FONT, fontWeight: 400, fontSize: Math.min(64, Math.max(40, Math.round(760 / Math.max(8, name.length)))), whiteSpace: 'nowrap' }}>{name}</div> : null}
            </div>
          </>} />
        <FilmFinish frame={frame} />
      </AbsoluteFill>
    )
  }
  if (beatType === 'text') {
    // Field tone: the reel-level look (mood preset / planner choice) wins; without one,
    // beats alternate rich/deep as before. Type colour tracks the tone - deep brand
    // ink on the light cream field, white on deep, auto-contrast on rich.
    const tone = fieldTone || (index % 2 === 1 ? 'deep' : 'rich')
    // fx: the hue this beat's stage derives from — per-beat colour override or brand.
    const fx = (fieldColor && /^#[0-9a-fA-F]{3,8}$/.test(fieldColor)) ? fieldColor : accent
    // Ink follows the STYLE's ground when a treatment is set (light styles → dark type),
    // otherwise the mesh tone logic.
    const textCol = (fieldStyle && fieldStyle !== 'mesh')
      ? (FIELD_LIGHT_STYLES.has(fieldStyle) ? shade(fx, -0.55) : '#FFFFFF')
      : (tone === 'light' ? shade(fx, -0.52) : (tone === 'deep' ? '#FFFFFF' : idealText(fx)))
    // On the light field, preset text colours designed for dark grounds (cream/white)
    // would vanish - override textColor to the tone's ink for this beat only.
    // The ground is light when the TONE says so OR when the chosen field STYLE is a light
    // treatment. Keying only off `tone` was a live readability bug: the storyboard sets
    // field_style WITHOUT field_tone (generate/page.tsx), so tone fell back to deep/rich,
    // this patch never ran, and the preset's cream/white caption colour stayed put on a
    // cream ground - e.g. Silk + pop rendered #FFFFFF on pale mint. Found 2026-08-12 by
    // rendering a still, not by reading the code.
    const groundIsLight = tone === 'light' || (!!fieldStyle && FIELD_LIGHT_STYLES.has(fieldStyle))
    let cfg = captionConfig
    if (groundIsLight && cfg) {
      const patched: any = {}
      for (const k of Object.keys(cfg)) { const v = (cfg as any)[k]; patched[k] = v && v.textColor ? { ...v, textColor: textCol } : v }
      cfg = patched
    }
    return (
      <AbsoluteFill style={{ opacity }}>
        <FieldStage styleKey={fieldStyle} accent={fx} frame={frame} tone={tone} />
        {/* slow push-in keeps the type alive for the whole beat */}
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${1 + (frame / Math.max(1, durationInFrames)) * 0.05})` }}>
          <Captions text={text} accent={textCol} isHook style={captionStyle} durationInFrames={durationInFrames} captionConfig={cfg} emphasis={emphasis} zone={character ? 'top' : undefined} speech={speech} />
        </div>
        <CardCharacter src={character} size={CARD_CHARACTER.text} frame={frame} fps={fps} durationInFrames={durationInFrames}
          avoid={<Captions text={text} accent={textCol} isHook style={captionStyle} durationInFrames={durationInFrames} captionConfig={cfg} emphasis={emphasis} zone="top" speech={speech} />} />
      </AbsoluteFill>
    )
  }



  // Website/mockup beat (Studio v2 slice 4): the scene's poster image (their website,
  // menu, booking page - any tall screenshot) inside a phone frame, slowly scrolling.
  if (beatType === 'mockup') {
    const scroll = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' })
    const rise = interpolate(frame, [0, 12], [60, 0], { extrapolateRight: 'clamp' })
    return (
      <AbsoluteFill style={{ opacity }}>
        <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 15%, ${shade(accent, -0.3)} 0%, ${shade(accent, -0.52)} 60%, ${shade(accent, -0.68)} 100%)` }} />
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '58%', aspectRatio: '9 / 18.5', position: 'relative', transform: `translateY(${rise}px)` }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 54, background: '#141210', boxShadow: '0 50px 100px -40px rgba(0,0,0,.6), inset 0 0 0 3px rgba(255,255,255,.08)' }} />
            <div style={{ position: 'absolute', inset: 10, borderRadius: 46, overflow: 'hidden', background: '#fff' }}>
              {poster ? (
                <Img src={poster} style={{ width: '100%', height: 'auto', minHeight: '100%', objectFit: 'cover', objectPosition: `50% ${scroll}%` }} />
              ) : (
                <AbsoluteFill style={{ background: `linear-gradient(160deg, ${shade(accent, 0.25)}, ${shade(accent, -0.1)})` }} />
              )}
            </div>
            <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)', width: '26%', height: 22, borderRadius: 100, background: '#141210' }} />
          </div>
        </AbsoluteFill>
        {punch
          ? <PunchCaptions words={saysIt ? spoken! : punchLineWords(text, durationInFrames, speech)} heading={heading} accent={accent} font={headFont} />
          : saysIt
          ? <SpokenCaptions words={spoken!} accent={accent} style={captionStyle} captionConfig={captionConfig} />
          : <Captions text={text} accent={accent} isHook={false} style={captionStyle} durationInFrames={durationInFrames} captionConfig={captionConfig} emphasis={emphasis} speech={speech} />}
      </AbsoluteFill>
    )
  }
  // Branded CTA end-card (Studio v2, agency pass): the reel's closer as an EDITORIAL
  // LOCKUP — no container box. The logo levitates in free space, the brand name
  // renders as a serif WORDMARK with an accent full stop (the "Creslo." mark style,
  // every brand gets the same treatment in its own colour), a hairline gradient rule
  // draws beneath it, and the CTA line breathes over the glow. 0.6-1.2s ease-outs;
  // nothing sits still. No footage, no zones.
  if (beatType === 'cta') {
    // fx: per-beat colour override or brand — the whole card (field, glow, rule,
    // wordmark dot) re-derives from it so the hue swap stays harmonised.
    const fx = (fieldColor && /^#[0-9a-fA-F]{3,8}$/.test(fieldColor)) ? fieldColor : accent
    const logoS = spring({ frame: frame - 2, fps, config: { damping: 13, mass: 0.7, stiffness: 120 } })
    const nameS = spring({ frame: frame - 9, fps, config: { damping: 16, mass: 0.8, stiffness: 110 } })
    const rule = interpolate(frame, [16, 34], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const breathe = 1 + Math.sin(frame * 0.09) * 0.012
    const glow = 0.45 + Math.sin(frame * 0.13) * 0.18
    const float = Math.sin(frame * 0.045) * 7 // slow levitation of the whole lockup
    const name = String(brandName || '').trim()
    const endsPunct = /[.!?]$/.test(name)
    // Wordmark scales to the name so long business names never clip at 1080 wide.
    const nameSize = Math.min(84, Math.max(46, Math.round(1000 / Math.max(8, name.length))))
    return (
      <AbsoluteFill style={{ opacity }}>
        {/* the CTA accepts DARK-ground styles/tones only: the identity lockup (cream
            wordmark, glowing rule) needs a dark ground — light styles fall back to mesh */}
        <FieldStage styleKey={(fieldStyle && !FIELD_LIGHT_STYLES.has(fieldStyle)) ? fieldStyle : 'mesh'} accent={fx} frame={frame} tone={fieldTone === 'rich' ? 'rich' : 'deep'} />
        {/* breathing accent glow behind the CTA line */}
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 900, height: 900, transform: 'translate(-50%, -50%)', background: `radial-gradient(circle, ${hexA(fx, 0.3)} 0%, transparent 62%)`, opacity: glow }} />
        {/* identity lockup — floats free, no panel */}
        <div style={{ position: 'absolute', top: '14%', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, transform: `translateY(${float}px)` }}>
          {brandLogo ? (
            <Img src={brandLogo} style={{
              width: 150, height: 150, borderRadius: 36, objectFit: 'cover',
              opacity: logoS, transform: `scale(${0.72 + 0.28 * logoS}) translateY(${(1 - logoS) * 34}px)`,
              boxShadow: `0 46px 90px -36px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.15), 0 0 70px ${hexA(shade(fx, 0.42), 0.3)}`,
            }} />
          ) : null}
          {brandWordmark ? (
            <div style={{ overflow: 'hidden', padding: '0.1em 0.12em' }}>
              {/* the brand's REAL wordmark image (brands.wordmark_url) rising through a mask */}
              <Img src={brandWordmark} style={{
                maxWidth: 640, maxHeight: 150, objectFit: 'contain', display: 'block',
                opacity: nameS, transform: `translateY(${(1 - nameS) * 60}px)`,
                filter: 'drop-shadow(0 10px 34px rgba(0,0,0,.35))',
              }} />
            </div>
          ) : name ? (
            <div style={{ overflow: 'hidden', padding: '0.1em 0.12em' }}>
              {/* serif wordmark rising through a mask — the brand's "name style" moment */}
              <div style={{
                fontFamily: WORDMARK_FONT, fontWeight: 400, fontSize: nameSize, lineHeight: 1.06,
                color: '#FFFFFF', whiteSpace: 'nowrap', textShadow: '0 10px 44px rgba(0,0,0,.4)',
                opacity: nameS, transform: `translateY(${(1 - nameS) * 108}%)`,
              }}>
                {name}{endsPunct ? '' : <span style={{ color: shade(fx, 0.45) }}>.</span>}
              </div>
            </div>
          ) : null}
          <div style={{ width: 210 * rule, height: 3, borderRadius: 4, background: `linear-gradient(90deg, transparent, ${shade(fx, 0.4)}, transparent)`, opacity: rule, boxShadow: `0 0 ${14 + glow * 16}px ${hexA(shade(fx, 0.4), 0.9)}` }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${breathe})` }}>
          <Captions text={text} accent={fx} isHook style={captionStyle} durationInFrames={durationInFrames} captionConfig={captionConfig} emphasis={emphasis} speech={speech} />
        </div>
        <CardCharacter src={character} size={CARD_CHARACTER.cta} frame={frame} fps={fps} durationInFrames={durationInFrames}
          avoid={<Captions text={text} accent={fx} isHook style={captionStyle} durationInFrames={durationInFrames} captionConfig={captionConfig} emphasis={emphasis} speech={speech} />} />
      </AbsoluteFill>
    )
  }
  return (
    <AbsoluteFill style={{ opacity, backgroundColor: '#000' }}>
      <ToneFilter id={toneId} tone={tone} />
      <AbsoluteFill style={{ transform: `scale(${scale}) translateX(${panX}px) translateY(${-punchLift(punch && !isHook ? layer : null, frame, fps, 1920)}px)`, filter: lookFilter }}>
        {clipUrl && !clipFailed ? (
          // Starts a moment in when the backend chose a start point (P3: past the camera settling).
          <OffthreadVideo src={clipUrl} muted playbackRate={speed && speed > 1 ? speed : undefined} trimBefore={clipStart ? Math.round(clipStart * fps) : undefined} onError={() => setClipFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : poster ? (
          // PHOTO BEAT (phase 11 intake lanes): a real still — the business's own menu,
          // product or room — under the same Ken Burns drift the clips get (the parent
          // transform). Doubles as the upgrade path for a FAILED clip fetch: the clip's
          // poster frame reads far better than a bare gradient. MUST stay identical to the mirror.
          <Img src={poster} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <AbsoluteFill
            style={{
              background: `radial-gradient(120% 90% at 50% 18%, ${shade(accent, 0.18)} 0%, ${shade(accent, -0.2)} 55%, ${shade(accent, -0.55)} 100%)`,
            }}
          />
        )}
      </AbsoluteFill>

      {/* legibility gradient */}
      <AbsoluteFill
        style={{
          background: isHook
            ? 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.45) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* TEXT POCKET (P2): a soft shade behind the words, where they sit - cream words on a mid-grey wall measured about 3:1 in the test render (readability law: words on a contrasting ground). None in the punch look since 22 Oct 2026: its words are on paper. */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 78% 15% at 50% ${punch ? 27 : saysIt ? 61 : zone === 'top' ? 19 : (zone === 'middle' || (!zone && isHook)) ? 43 : 61}%, rgba(0,0,0,${punch ? 0 : 0.42}) 0%, rgba(0,0,0,${punch ? 0 : 0.24}) 55%, rgba(0,0,0,0) 100%)` }} />
      <FilmFinish frame={frame} />
      {/* ---- SPED UP TAG (reels brief B2, 21 Oct 2026): a sped-up clip says so, so a screen is never passed off as real
          time. Small, top left, inside the safe area (below the top 14%); lower down when the words sit at the top. */}
      {speed && speed > 1 && clipUrl && !clipFailed ? (
        <div style={{ position: 'absolute', left: 64, top: zone === 'top' ? 560 : 290, padding: '10px 22px', borderRadius: 100, background: 'rgba(0,0,0,0.5)', color: '#FFFFFF', fontFamily: 'Inter, "DM Sans", Arial, sans-serif', fontSize: 30, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sped up {speed}x</div>
      ) : null}
      {/* ---- end SPED UP TAG */}
      {punch
        // ---- PUNCH CAPTIONS (R1): the opening title whole from frame 0; then the words as they are said (or the line paced
        // through the beat), with the call to action's keyword held above them on the last shot.
        ? (isHook ? <PunchTitle text={text} accent={accent} font={headFont} /> : (
          // ---- PUNCH LAYERS (reels reference 2, 22 Oct 2026): the beat's layer under its words. A list label or a step says
          // the line itself, so the words above it stay off, voice or not (Daniel, 22 Oct 2026: "a lot of the text and layers
          // is duplicated"); the call to action's keyword wins over a label, and then the words show with it.
          <>
            {layer && !(layer.kind === 'label' && heading) ? <PunchLayer layer={layer} accent={accent} durationInFrames={durationInFrames} /> : null}
            {(!layer || (layer.kind !== 'label' && layer.kind !== 'steps') || (layer.kind === 'label' && heading)) ? <PunchCaptions words={saysIt ? spoken! : punchLineWords(text, durationInFrames, speech)} heading={heading} accent={accent} font={headFont} zone={layer ? null : zone} dock={layer && layer.kind === 'number' ? punchNumberTop(1080, 1920, layer.text) : null} shown={layer && layer.kind === 'number' ? layer.text : null} /> : null}
          </>
          // ---- end PUNCH LAYERS
        ))
        // ---- end PUNCH CAPTIONS
        : saysIt
        ? <SpokenCaptions words={spoken!} accent={accent} style={captionStyle} captionConfig={captionConfig} />
        : isHook && index === 0
          // ---- OPENING WORDS ON FRAME 0 (Daniel, 21 Oct 2026, decision 3 A): the reel's first frame is its cover in the
          // feed and, with the loop ending, its last frame too - so the opening words are already there, fully shown, from
          // frame 0 (held at their finished state), not popping in. Every other beat keeps its animation. MUST stay
          // identical in both copies.
          ? <Freeze frame={Math.max(0, durationInFrames - 1)}><Captions text={text} accent={accent} isHook={isHook} style={captionStyle} durationInFrames={durationInFrames} captionConfig={headCfg} emphasis={emphasis} zone={zone} speech={speech} /></Freeze>
          // ---- end OPENING WORDS ON FRAME 0
          : <Captions text={text} accent={accent} isHook={isHook} style={captionStyle} durationInFrames={durationInFrames} captionConfig={isHook ? headCfg : captionConfig} emphasis={emphasis} zone={zone} speech={speech} />}
    </AbsoluteFill>
  )
}
