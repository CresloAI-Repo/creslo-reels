// AD MOTION - a finished Ad Studio advert as a six-second video (step 4 of the premium adverts,
// Daniel 3 Oct 2026). Rendered on Lambda by the backend's /api/ad/motion.
//
// SAFETY (Daniel: "I want everything safe and nothing able to be exploited"): this composition
// never receives HTML or CSS. It receives plain data - which look, the words, two colours, a font
// key, the picture addresses, the proof's fixes - all checked again by the backend
// (server/services/adMotion.js), and builds the advert itself from the look library mirrored from
// the app (lib/ad/adStudioEngine.ts). Every word is escaped here, whatever the backend did.
//
// The look library, brand fonts and the motion are MIRRORED byte for byte from creslo-frontend
// src/lib (adStudioEngine.ts, brandFonts.ts, adMotion.ts): `npm test` compares them. The app plays
// the same motion in the advert card, so what the owner sees is what the video shows.
import React, { useLayoutEffect, useRef, useState } from 'react'
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion'
import { TREATMENTS, THUMB_CSS, FONTS_IMPORT_URL, deriveBrandPalette, emph, initials, fitAdText } from './lib/ad/adStudioEngine'
import { brandFont, brandFontFor } from './lib/ad/brandFonts'
import { applyMotion, type MotionStyle, MOTION_SECONDS, MOTION_FPS } from './lib/ad/adMotion'

export type AdFixProp = { sel: string; style: Record<string, string>; attr?: Record<string, string> }
export type AdMotionProps = {
  t: string; ratio: number; style: MotionStyle
  copy: { name?: string; eyebrow?: string; headline?: string; sub?: string; cta?: string; badge?: string; chips?: string; price?: string; items?: string }
  rating?: number; site?: string; wordmark?: boolean
  accent: string; accent2?: string; tone?: string; bf?: string
  photo?: string; logo?: string; focus?: { x: number; y: number } | null
  fixes?: AdFixProp[]
}
export const AD_MOTION_FRAMES = MOTION_SECONDS * MOTION_FPS
export const AD_MOTION_FPS = MOTION_FPS

const esc = (s: unknown) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const emphSafe = (s: unknown) => emph(String(s == null ? '' : s).replace(/>/g, '&gt;'))
const safeUrl = (u: unknown) => (typeof u === 'string' && /^https:\/\/[^\s"'<>()]{4,1500}$/.test(u) ? u : '')
const SEL_OK = /^[A-Za-z0-9 .:#>()_,*-]{1,300}$/
const VAL_OK = /^[\w\s#(),.%!-]{0,200}$/
const VAL_BAD = /url\s*\(|image|element\s*\(|attr\s*\(|var\s*\(|expression|src\s*\(/i
const STYLE_KEYS = ['color', 'text-shadow', 'opacity', 'display', 'font-size', 'white-space', 'text-overflow', 'filter']

function params(p: AdMotionProps, logo: string) {
  const c = p.copy || {}
  return {
    name: p.wordmark ? '' : emphSafe(c.name), initials: esc(initials(c.name || '')), logo,
    eyebrow: emphSafe(c.eyebrow), headline: emphSafe(c.headline), sub: emphSafe(c.sub),
    cta: esc(c.cta), badge: esc(c.badge), chips: esc(c.chips), price: esc(c.price), items: esc(c.items),
    rating: Number.isFinite(Number(p.rating)) ? Number(p.rating) : 0,
  }
}

export const AdMotion: React.FC<AdMotionProps> = (p) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const ref = useRef<HTMLDivElement>(null)
  const [handle] = useState(() => delayRender('Advert fonts and pictures'))
  const [ready, setReady] = useState(false)
  const def: any = (TREATMENTS as any)[p.t]
  const bf = brandFontFor(brandFont(p.bf), def, p.t)

  // Build once: the look's own HTML from plain data, the proof's fixes, then wait for the fonts
  // and pictures and fit the words, exactly as the card does.
  useLayoutEffect(() => {
    const node = ref.current
    if (!node || !def) { continueRender(handle); return }
    const logo = safeUrl(p.logo)
    let html = def.render(params(p, logo))
    const site = esc(p.site || '')
    if (site) html = html.replace(/>\s*creslo\.ai\s*</gi, '>' + site + '<')
    node.innerHTML = html
    for (const f of p.fixes || []) {
      if (!f || typeof f.sel !== 'string' || !SEL_OK.test(f.sel)) continue
      let els: Element[] = []
      try { els = Array.from(node.querySelectorAll(f.sel)) } catch { els = [] }
      for (const el of els) {
        for (const k of Object.keys(f.style || {})) if (STYLE_KEYS.includes(k) && VAL_OK.test(String(f.style[k])) && !VAL_BAD.test(String(f.style[k]))) (el as HTMLElement).style.setProperty(k, String(f.style[k]), 'important')
        const src = f.attr && safeUrl(f.attr.src)
        if (src && el.tagName === 'IMG') el.setAttribute('src', src)
      }
    }
    let done = false
    const finish = () => { if (done) return; done = true; try { fitAdText(node) } catch { /* fitting is best-effort */ } setReady(true); continueRender(handle) }
    const imgs = Array.from(node.querySelectorAll('img')).map(im => new Promise(res => { if ((im as HTMLImageElement).complete) res(0); else { im.addEventListener('load', res); im.addEventListener('error', res) } }))
    const photo = safeUrl(p.photo)
    const bg = photo ? new Promise(res => { const im = new Image(); im.onload = res; im.onerror = res; im.src = photo }) : Promise.resolve(0)
    const fam = bf ? bf.family : (def.font || '')
    const fonts = (document as any).fonts.ready.then(() => fam ? (document as any).fonts.load('400 60px ' + fam).catch(() => 0) : 0)
    Promise.all([fonts, bg, ...imgs]).then(finish, finish)
    const guard = setTimeout(finish, 20000)
    return () => clearTimeout(guard)
    // built once per render: the props never change within one video
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Every frame: the advert at this moment of the film.
  useLayoutEffect(() => {
    if (ready && ref.current) applyMotion(ref.current, p.style, (frame / fps) * 1000)
  }, [frame, ready, fps, p.style])

  if (!def) return <AbsoluteFill style={{ background: '#111' }} />
  // tone: the ground taken from the photo when no brand colour belongs in it (Ad Studio lib/adTone, 5 Oct 2026)
  const pal = deriveBrandPalette(p.accent || '#b07a4f', p.accent2 || '', /^#[0-9a-f]{6}$/i.test(p.tone || '') ? p.tone : '')
  const vars: Record<string, string> = {}
  for (const k in pal) vars['--' + k] = (pal as any)[k]
  vars['--hfont'] = bf ? bf.family : def.font
  if (bf) vars['--hw'] = String(bf.weight)
  const photo = safeUrl(p.photo)
  vars['--img'] = photo ? 'url("' + photo + '")' : 'none'
  vars['--h'] = def.ratio + 'px'
  if (p.focus && Number.isFinite(p.focus.x) && Number.isFinite(p.focus.y)) { vars['--fx'] = p.focus.x + '%'; vars['--fy'] = p.focus.y + '%' }
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <link rel="stylesheet" href={FONTS_IMPORT_URL} />
      <style>{THUMB_CSS}</style>
      <div ref={ref} className={'cadthumb ' + p.t} data-bf={bf ? bf.key : undefined}
        style={{ width: 1080, height: def.ratio, position: 'relative', ...(vars as any) }} />
    </AbsoluteFill>
  )
}
