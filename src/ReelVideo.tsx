import React from 'react'
import { AbsoluteFill, Audio, Freeze, Sequence, useVideoConfig } from 'remotion'
import { TransitionSeries, linearTiming, type TransitionPresentation } from '@remotion/transitions'
import { Beat } from './components/Beat'
import { buildBeats, loopsAtEnd, LOOP_FRAMES, TRANSITION_FRAMES, CAPTION_STYLE_KEYS, type ReelData, type CaptionStyle } from './lib/types'

// The hash-select fallback (for an absent/invalid captionStyle) is limited to the
// original 3 styles, so the 5 newer styles only ever render when explicitly picked.
const FALLBACK_STYLES = ['pop', 'karaoke', 'clean'] as const

// ---- CUT PRESENTATIONS (Reels v3 cut engine) ----
// Module scope on purpose: a presentation's component must keep the same identity from frame to
// frame. Declared inside ReelVideo, each frame produced a brand-new component type and React
// tore down and rebuilt everything inside it - harmless on Lambda (every frame is rendered on its
// own) but in the browser preview the clip videos were destroyed and reloaded ~10 times a second,
// showing black and stalling playback. Found 2026-09-21. Output is unchanged: same maths, same
// props, only where the functions live. MUST stay identical to the mirror.
type CutPresentation = TransitionPresentation<Record<string, unknown>>
type CutProps<P> = { children: React.ReactNode; presentationDirection: 'entering' | 'exiting'; presentationProgress: number; passedProps: P }
const outCubic = (p: number) => 1 - Math.pow(1 - p, 3)
const WhipPanCut: React.FC<CutProps<{ dir: 1 | -1 }>> = ({ children, presentationDirection, presentationProgress, passedProps }) => {
  const dir = passedProps.dir
  const p = outCubic(presentationProgress)
  const blur = Math.sin(presentationProgress * Math.PI) * 22
  const x = presentationDirection === 'entering' ? (1 - p) * 100 * dir : -p * 100 * dir
  return <AbsoluteFill style={{ transform: `translateX(${x}%)`, filter: `blur(${blur}px)` }}>{children}</AbsoluteFill>
}
// A plain cut (reels premium pass P2, 8 Oct 2026): the outgoing shot holds for half the overlap
// and the next one replaces it outright. Pro editors cut hard by default; an effect on every cut
// is what makes an edit read as a template. Same overlap as the other cuts, so the timeline and
// every timing worked out from it are unchanged. MUST stay identical in both copies.
const HardCut: React.FC<CutProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress }) => {
  const show = presentationDirection === 'entering' ? presentationProgress >= 0.5 : presentationProgress < 0.5
  return <AbsoluteFill style={{ opacity: show ? 1 : 0 }}>{children}</AbsoluteFill>
}
// A dissolve and nothing else (reels premium pass P2b, 8 Oct 2026; Daniel: "the jumpy zoom
// transitions"). It used to scale both shots by 3-3.5% as they crossed, and a punch cut snapped 8-14%
// with a flash. Now the outgoing shot holds and the next one fades in over it, eased, so there is no
// zoom and no dip towards black. MUST stay identical in both copies.
const DissolveCut: React.FC<CutProps<Record<string, never>>> = ({ children, presentationDirection, presentationProgress }) => {
  if (presentationDirection === 'exiting') return <AbsoluteFill>{children}</AbsoluteFill>
  const p = presentationProgress
  return <AbsoluteFill style={{ opacity: p * p * (3 - 2 * p) }}>{children}</AbsoluteFill>
}

export const ReelVideo: React.FC<ReelData> = (reel) => {
  const { fps } = useVideoConfig()
  const accent = reel.brandColor || '#E8743B'
  const beats = buildBeats(reel)

  // Pick a caption look AND a transition look per reel, from the reel's own copy:
  // stable for a given reel, varied across different reels.
  const seedStr = String(reel.caption || (reel.hook && reel.hook.on_screen) || '')
  let seed = 0
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0
  // Honour the user's picked caption style when present and valid; otherwise fall back
  // to the per-reel hash-select so un-picked reels still vary.
  const captionStyle = CAPTION_STYLE_KEYS.includes(reel.captionStyle as CaptionStyle)
    ? (reel.captionStyle as CaptionStyle)
    : FALLBACK_STYLES[seed % FALLBACK_STYLES.length]

  // ---- Cut engine (Reels v3, 21 Sep 2026; reels premium passes P2 and P2b, 8 Oct 2026) ----
  // Plain cuts, ONE signature move mid-reel (a motion-blurred whip for a kinetic reel, a dissolve
  // for a soft one) and a dissolve into the end card. No cut zooms (Daniel: "the jumpy zoom
  // transitions"). Seeded from the reel's copy so preview and render always agree; the legacy
  // preset keys still choose the mood, so older reels keep theirs.
  // MUST stay identical to the mirror (creslo-frontend/src/remotion/ReelVideo.tsx).
  // The three cut presentations are defined ONCE at module scope (see CUT PRESENTATIONS above
  // ReelVideo). Building them in here made a new component type on every frame, which made
  // React remount the whole scene - clip <video> included - many times a second in the
  // browser preview. whipPan / dissolve / hardCut below only choose the props.
  const whipPan = (dir: 1 | -1): CutPresentation => ({ component: WhipPanCut as any, props: { dir } })
  const dissolve = (): CutPresentation => ({ component: DissolveCut as any, props: {} })
  const hardCut = (): CutPresentation => ({ component: HardCut as any, props: {} })
  // Each cut carries its KIND so the SFX layer knows what sound rides under it.
  type Cut = { kind: 'whip' | 'drift' | 'hard'; p: CutPresentation }
  // The reel's mood: kinetic (its one move is a whip) or soft (a dissolve). The storyboard's own
  // pick wins, legacy preset keys included; otherwise it comes from the reel's copy.
  const moodKey = String(reel.transition || '')
  const kinetic = ['kinetic', 'slide-from-right', 'slide-from-bottom', 'wipe-from-right'].includes(moodKey) ? true
    : ['soft', 'fade'].includes(moodKey) ? false : seed % 2 === 0

  // Cut bookkeeping (phase 4 SFX): transition i starts where sequence i begins,
  // i.e. cumulative frames minus the overlaps. Selected ONCE here so the visual
  // cut and its sound can never disagree.
  const seqFrames = beats.map(b => Math.max(1, Math.round(b.seconds * fps)))
  const cuts: { at: number; cut: Cut }[] = []
  const beatStarts: number[] = []
  {
    let s = 0
    beats.forEach((b, i) => {
      if (i > 0) {
        s -= TRANSITION_FRAMES
        // CUTS (reels premium pass P2, 8 Oct 2026): plain cuts by default, ONE signature move at the
        // middle of the reel (a motion-blurred whip with its whoosh for the kinetic moods, a soft
        // dissolve for the calm ones), and the end card comes in on a dissolve (P2b). Before,
        // every cut was an effect.
        const mid = Math.max(1, Math.round((beats.length - 1) / 2))
        let cut: Cut
        if (i === beats.length - 1 && beats[i].beatType === 'cta') cut = { kind: 'drift', p: dissolve() }
        else if (i === mid && beats.length >= 4) cut = kinetic ? { kind: 'whip', p: whipPan(seed % 2 === 0 ? 1 : -1) } : { kind: 'drift', p: dissolve() }
        else cut = { kind: 'hard', p: hardCut() }
        cuts.push({ at: s, cut })
      }
      beatStarts.push(s)
      s += seqFrames[i]
    })
  }

  // Speech-synced captions (phase 9): the voiceover plays from frame 0, so a beat's
  // spoken span (seconds on the track) converts to frames LOCAL to that beat by
  // subtracting the beat's start. Only offered when the narration is actually in the
  // mix — without voiceoverUrl the timings describe audio nobody hears.
  const vt = (reel.voiceoverUrl && reel.voiceoverTiming && Array.isArray(reel.voiceoverTiming.beats)) ? reel.voiceoverTiming.beats : null
  const speechFor = (i: number): { start: number; end: number } | undefined => {
    const b = vt && vt[i]
    if (!b || !Number.isFinite(b.s) || !Number.isFinite(b.e) || b.e <= b.s) return undefined
    return { start: Math.round(b.s * fps) - beatStarts[i], end: Math.round(b.e * fps) - beatStarts[i] }
  }
  // Spoken captions (reels premium pass P1, 8 Oct 2026): the beat's words with times, converted
  // from seconds on the voice track to frames local to the beat. Only when the voice is in the mix.
  const spokenFor = (i: number): { t: string; s: number; e: number }[] | undefined => {
    const b = vt && vt[i]
    if (!b || !Array.isArray(b.words) || !b.words.length) return undefined
    return b.words.filter((w) => w && typeof w.t === 'string' && Number.isFinite(w.s) && Number.isFinite(w.e))
      .map((w) => ({ t: w.t, s: Math.round(w.s * fps) - beatStarts[i], e: Math.round(w.e * fps) - beatStarts[i] }))
  }
  // The look, per beat (reels premium pass P2, 8 Oct 2026). A text card sits on the next shot's
  // still (else the last one's); the end card on the shot before it. (The punch-in a beat went in
  // P2b: a 10% zoom in four frames read as a jump.)
  const stillFor = (i: number): string | null => {
    const at = (j: number) => (beats[j] && beats[j].poster) || null
    if (beats[i].beatType === 'text') { for (let j = i + 1; j < beats.length; j++) if (at(j)) return at(j); for (let j = i - 1; j >= 0; j--) if (at(j)) return at(j); return null }
    if (beats[i].beatType === 'cta') { for (let j = i - 1; j >= 0; j--) if (at(j)) return at(j); return null }
    return null
  }

  // ---- MUSIC MIX (October reels audit R1, 8 Oct 2026) ----
  // The bed used to sit at one level from the first frame to the last: never lower under the
  // voice, no fade in, cut dead on the last frame, and quiet when there was no voice (a music-only
  // reel measured -24.8 LUFS). reel.music.volume (default 0.25) is now the level UNDER SPEECH;
  // between lines, and through a reel with no voiceover, the music comes up to 2.4x that (at most
  // 0.8), easing over 8 frames either side of each spoken line. 0.4 s fade in, 1 s fade out.
  // MUST stay identical in both copies (the mirror test compares this block).
  const totalFrames = useVideoConfig().durationInFrames
  const underVoice = (reel.music && typeof reel.music.volume === 'number') ? Math.max(0, Math.min(1, reel.music.volume)) : 0.25
  // Between spoken lines the music lifts about 7.6 dB; with no voice at all it plays near full, so a
  // music-only reel lands near -14 LUFS with the mastered library (measured 8 Oct 2026: -17.5 at 0.6).
  const openVol = reel.voiceoverUrl ? Math.min(0.8, underVoice * 2.4) : Math.min(0.9, underVoice * 3.6)
  const spans: [number, number][] = (vt || [])
    .filter((b): b is { s: number; e: number } => !!b && Number.isFinite(b.s) && Number.isFinite(b.e) && b.e > b.s)
    .map((b) => [Math.round(b.s * fps), Math.round(b.e * fps)])
  const musicVolume = (f: number): number => {
    let v = openVol
    if (reel.voiceoverUrl) {
      if (!spans.length) v = underVoice
      else {
        let d = Infinity
        for (const [s, e] of spans) { if (f >= s && f <= e) { d = 0; break } d = Math.min(d, f < s ? s - f : f - e) }
        v = underVoice + (openVol - underVoice) * Math.min(1, d / 8)
      }
    }
    const fadeIn = Math.min(1, f / Math.max(1, Math.round(fps * 0.4)))
    const fadeOut = Math.min(1, Math.max(0, totalFrames - 1 - f) / fps)
    return Math.max(0, v * Math.min(fadeIn, fadeOut))
  }
  // ---- end MUSIC MIX ----

  // One beat as drawn: in its place on the timeline, and again for the loop ending (C2). MUST stay identical in both copies.
  const beatEl = (b: (typeof beats)[number], i: number) => (
    <Beat text={b.text} isHook={b.isHook} clipUrl={b.clipUrl} accent={accent} index={i} durationInFrames={seqFrames[i]} captionStyle={captionStyle} captionConfig={reel.captionConfig} emphasis={b.emphasis} zone={b.zone} beatType={b.beatType} poster={b.poster} brandName={reel.brandName} brandLogo={reel.brandLogo} brandWordmark={reel.brandWordmark} fieldTone={b.fieldTone || reel.fieldTone} fieldColor={b.fieldColor} fieldStyle={b.fieldStyle} kenBurns={reel.kenBurns} grade={reel.grade} speech={speechFor(i)} spoken={spokenFor(i)} tone={b.tone} clipStart={b.clipStart} speed={b.speed} still={stillFor(i)} headFont={reel.headFont} character={b.character} />
  )

  // Build an alternating Sequence / Transition list for a smooth cut between beats.
  const children: React.ReactNode[] = []
  beats.forEach((b, i) => {
    const frames = seqFrames[i]
    if (i > 0) {
      children.push(
        <TransitionSeries.Transition
          key={`t${i}`}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
          presentation={cuts[i - 1].cut.p}
        />
      )
    }
    children.push(
      <TransitionSeries.Sequence key={`s${i}`} durationInFrames={frames}>
        {beatEl(b, i)}
      </TransitionSeries.Sequence>
    )
  })


  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <TransitionSeries>{children}</TransitionSeries>
      {/* SFX on cuts (Reels v3 phase 4): whoosh under whips (the punch hit has
          had no cut to ride since P2b), a riser into the final beat; dissolves stay silent. Fail-open by design —
          without reel.sfxBase (env-gated server-side) no sound is referenced, so a
          render can never 404 on an asset that hasn't been generated yet.
          MUST stay identical to the mirror. */}
      {reel.sfxBase ? cuts.map((c, n) => {
        const final = n === cuts.length - 1
        const file = final ? 'sfx-riser.mp3' : c.cut.kind === 'whip' ? 'sfx-whoosh.mp3' : null
        if (!file) return null
        const from = Math.max(0, final ? c.at - Math.round(fps * 0.8) : c.at - 2)
        return (
          <Sequence key={`sfx${n}`} from={from} durationInFrames={Math.round(fps * (final ? 2.2 : 1.5))}>
            <Audio src={`${reel.sfxBase}/${file}`} volume={final ? 0.4 : 0.32} />
          </Sequence>
        )
      }) : null}
      {/* Audio (Studio v2 slice 5): background music bed + optional narration track,
          mixed into the render. The music level follows musicVolume (MUSIC MIX above). */}
      {reel.music && reel.music.url ? <Audio src={reel.music.url} volume={musicVolume} /> : null}
      {reel.voiceoverUrl ? <Audio src={reel.voiceoverUrl} /> : null}
      {/* ---- LOOP ENDING (reels brief C2, 21 Oct 2026): the last half second is the reel's own first frame, held, so it
          plays round without a jump. Only when the reel asks for it (loopEnd) and has two beats or more.
          MUST stay identical in both copies. */}
      {loopsAtEnd(reel) ? (
        <Sequence from={totalFrames - LOOP_FRAMES} durationInFrames={LOOP_FRAMES}>
          <Freeze frame={0}>{beatEl(beats[0], 0)}</Freeze>
        </Sequence>
      ) : null}
      {/* ---- end LOOP ENDING */}

      {/* The burnt-in progress bar came out here on 2026-09-23 (Daniel). It was drawn INTO the
          video, so it followed the reel onto Instagram and TikTok, where no other reel has one -
          and those platforms draw their own. The live preview still has its scrub line, which is
          ours and stays on the page only. MUST stay identical to the app's copy. */}
    </AbsoluteFill>
  )
}
