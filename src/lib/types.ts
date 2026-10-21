// Shape of a reel — matches what the Creslo backend produces.
// Subject-aware caption placement: the vertical band with the LEAST important
// content in the clip (backend vision pass at clip-match time). Captions anchor
// here so they never cover the clip's main subject. Absent -> legacy anchors.
export type CaptionZone = 'top' | 'middle' | 'bottom'
export type ReelScene = {
  on_screen?: string
  voiceover?: string
  clip_url?: string | null
  poster?: string | null
  clip_id?: number | string | null
  seconds?: number
  // Keyword-emphasis: indices into on_screen.split(/\s+/).filter(Boolean) - the word(s) to emphasise.
  emphasis?: number[]
  caption_zone?: CaptionZone
  // Kinetic text beat (slice 1) / branded CTA end-card (slice 3): no footage needed.
  // 'mockup' (slice 4): the scene's poster image inside a phone frame (their website/menu).
  beat_type?: 'clip' | 'text' | 'cta' | 'mockup'
  // Per-beat field-tone override (the storyboard's ↻ layout swap on text/CTA beats);
  // wins over reel.fieldTone for this beat only.
  field_tone?: 'light' | 'rich' | 'deep'
  // Per-beat field COLOUR override (the storyboard edit popup): the beat's stage
  // re-derives from this hex instead of the brand colour.
  field_color?: string | null
  // Per-beat field STYLE (the storyboard edit popup): keyed FieldStage treatment
  // (silk/espresso/bokeh/horizon/embers/aurora/rays/paper/spot). Absent = mesh.
  field_style?: string | null
  // The clip's colour and exposure evening (backend lib/clipTone, reels premium pass P2): channel
  // gains r/g/b and an exposure gain x, applied as one colour matrix before the reel's grade.
  tone?: { r: number; g: number; b: number; x: number } | null
  // Where the clip starts, in seconds (reels premium pass P3): a moment in, past the camera settling.
  clip_start?: number
  // How fast the clip plays (reels brief B2, 21 Oct 2026): 1, 1.5, 2, 3 or 4. Over 1, the beat shows "Sped up".
  speed?: number
  // A saved character's cut-out on a text card or the end card (reels brief C1, 21 Oct 2026): a PNG with no
  // background, drawn small in the lower-left corner of the safe area. Ignored on footage beats.
  character_cut?: string | null
}

// Single source of truth for caption-style keys. The union AND the render-side
// validation list (ReelVideo.tsx) both derive from this, so adding a style is one edit.
export const CAPTION_STYLE_KEYS = ['pop', 'karaoke', 'clean', 'bold_box', 'typewriter', 'lower_third', 'big_subtitle', 'highlighter'] as const
export type CaptionStyle = typeof CAPTION_STYLE_KEYS[number]

// Per-style visual config — the data the Captions render reads for every visual
// decision. accent is a literal hex OR the sentinel 'brand' (= reel.brandColor).
// A future inputProps.captionConfig can override any field per style (B7) with no redeploy.
export type StyleConfig = {
  font: string
  // Optional display font for the emphasised (keyword) word; the rest use `font`.
  fontSecondary?: string
  textColor: string
  accent: string
  weight: number
  uppercase: boolean
  sizeMul: number
  placement: 'center' | 'lowerThird'
  reveal: 'wordSpring' | 'typewriter' | 'fade'
  // strike/underline (Studio v2 slice 2): animated accent sweep on the emphasised word.
  activeFx: 'none' | 'color' | 'box' | 'highlight' | 'strike' | 'underline' | 'stretch'
  stroke: boolean
  band?: { fill: string; accentEdge: string }
}

export type ReelData = {
  hook?: { on_screen?: string; voiceover?: string; clip_url?: string | null; poster?: string | null; emphasis?: number[]; tone?: { r: number; g: number; b: number; x: number } | null; clip_start?: number; speed?: number } | null
  scenes?: ReelScene[]
  caption?: string
  hashtags?: string[]
  audio?: string | null
  // Look & feel
  brandColor?: string
  // Brand display name + logo for the CTA end-card (slice 3).
  brandName?: string
  brandLogo?: string | null
  // The brand's NAME-STYLE mark image (brands.wordmark_url). When present the CTA
  // end-card shows this exact mark; otherwise the name renders in the serif wordmark style.
  brandWordmark?: string | null
  // Field tone for text beats: 'light' cream editorial / 'rich' saturated mid /
  // 'deep' jewel. Set by mood presets or the planner's look choice; absent = classic
  // alternating rich/deep. The CTA end-card always uses 'deep'.
  fieldTone?: 'light' | 'rich' | 'deep'
  // Audio plumbing (slice 5): background music + optional narration, mixed at render.
  music?: { url?: string; volume?: number } | null
  voiceoverUrl?: string | null
  // Speech-synced captions (phase 9): per-beat spoken spans in SECONDS from the start
  // of the voiceover track, one entry per composition beat (hook first), null where a
  // beat has no spoken line. Captions pace their word reveals across the real span.
  // Absent -> the fixed per-word stagger (current behaviour).
  // Since the premium pass P1 (8 Oct 2026) a beat may also carry its spoken words with times
  // (seconds on the voice track), which footage beats show as the caption, word by word.
  voiceoverTiming?: { beats?: ({ s: number; e: number; words?: { t: string; s: number; e: number }[] } | null)[] } | null
  captionStyle?: CaptionStyle
  captionConfig?: Partial<Record<CaptionStyle, Partial<StyleConfig>>>
  hookSeconds?: number
  // v2 inert plumbing (passed through buildReelRenderProps; the render half consumes these
  // later. Absent -> current behaviour). Shapes are placeholders, refined when each is built.
  transition?: string
  // SFX base URL (phase 4): where the composition finds sfx-whoosh/punch/riser.mp3.
  // Absent -> silent cuts (fail-open; the backend only sets it once the kit exists).
  sfxBase?: string | null
  header?: { text?: string; enabled?: boolean } | null
  grade?: string | null
  kenBurns?: { enabled?: boolean; intensity?: number } | null
  // The brand's headline font (Brand page, the same choice Ad Studio uses), for the hook, text
  // cards and the end card. Absent -> the caption style's own font (reels premium pass P2).
  headFont?: { family: string; weight: number } | null
  // Loop ending (reels brief C2, 21 Oct 2026): the reel ends on half a second of its own opening frame, so it plays
  // round without a jump.
  loopEnd?: boolean
}

export const FPS = 30
export const WIDTH = 1080
export const HEIGHT = 1920

// Frames each cross-scene transition overlaps. Shared between the composition
// and calculateMetadata so the final runtime always matches the timeline.
export const TRANSITION_FRAMES = 8

// One place that decides beat order + durations, used by both the
// composition and calculateMetadata so the timeline always matches.
export type Beat = {
  text: string
  isHook: boolean
  clipUrl?: string | null
  seconds: number
  emphasis?: number[]
  zone?: CaptionZone
  beatType?: 'clip' | 'text' | 'cta' | 'mockup'
  poster?: string | null
  fieldTone?: 'light' | 'rich' | 'deep'
  fieldColor?: string | null
  fieldStyle?: string | null
  tone?: { r: number; g: number; b: number; x: number } | null
  // Seconds into the clip where the beat starts (P3); 0 = the clip's first frame.
  clipStart?: number
  // How fast the clip plays (B2): 1 = real time. Anything over 1 shows the "Sped up" tag.
  speed?: number
  // A saved character's cut-out on a text card or the end card (C1).
  character?: string | null
}

// A clip start in seconds, checked: 0 to 600 (P3 - a stock clip a second or so in; your own clip from
// wherever you chose in it, 15 Oct 2026), else 0.
const startAt = (v: unknown): number => { const n = Number(v); return Number.isFinite(n) && n > 0 && n <= 600 ? n : 0 }
// A clip speed, checked (reels brief B2, 21 Oct 2026): only 1.5, 2, 3 or 4 speed a clip up; anything else plays at 1.
export const CLIP_SPEEDS = [1, 1.5, 2, 3, 4]
const speedOf = (v: unknown): number => { const n = Number(v); return CLIP_SPEEDS.includes(n) ? n : 1 }

export function buildBeats(reel: ReelData): Beat[] {
  const scenes = Array.isArray(reel.scenes) ? reel.scenes : []
  const hook = reel.hook || null
  const hookText = (hook && hook.on_screen) ? hook.on_screen : ''
  const beats: Beat[] = []
  if (hookText) {
    beats.push({
      text: hookText,
      isHook: true,
      // The hook uses its OWN clip when the backend supplies one, so it never
      // repeats beat 1's footage. Falls back to scene 1 only if none was set.
      clipUrl: (hook && hook.clip_url) ? hook.clip_url : (scenes[0] ? scenes[0].clip_url : null),
      // The hook's own still (its clip's poster, or the business's own photo) when the clip cannot
      // play - it opened on a bare brand gradient before (reels premium pass P1, 8 Oct 2026).
      poster: (hook && hook.poster) ? hook.poster : (scenes[0] ? scenes[0].poster || null : null),
      seconds: Math.max(1.5, Math.min(5, Number(reel.hookSeconds) || 2.5)),
      emphasis: (hook && hook.emphasis) || [],
      zone: (hook && (hook as { caption_zone?: CaptionZone }).caption_zone) || (scenes[0] ? scenes[0].caption_zone : undefined),
      tone: (hook && hook.tone) ? hook.tone : (!(hook && hook.clip_url) && scenes[0] ? scenes[0].tone || null : null),
      clipStart: (hook && hook.clip_url) ? startAt(hook.clip_start) : (scenes[0] ? startAt(scenes[0].clip_start) : 0),
      speed: (hook && hook.clip_url) ? speedOf(hook.speed) : (scenes[0] ? speedOf(scenes[0].speed) : 1),
    })
  }
  for (const s of scenes) {
    beats.push({
      text: s.on_screen || '',
      isHook: false,
      clipUrl: s.clip_url || null,
      seconds: Math.max(1.5, Math.min(10, Number(s.seconds) || 3)),
      emphasis: s.emphasis || [],
      zone: s.caption_zone,
      beatType: (s.beat_type === 'text' || s.beat_type === 'cta' || s.beat_type === 'mockup') ? s.beat_type : 'clip',
      poster: s.poster || null,
      fieldTone: (s.field_tone === 'light' || s.field_tone === 'rich' || s.field_tone === 'deep') ? s.field_tone : undefined,
      fieldColor: (typeof s.field_color === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(s.field_color)) ? s.field_color : undefined,
      fieldStyle: (typeof s.field_style === 'string' && /^[a-z]{3,12}$/.test(s.field_style)) ? s.field_style : undefined,
      tone: s.tone || null,
      clipStart: startAt(s.clip_start),
      speed: speedOf(s.speed),
      character: (s.beat_type === 'text' || s.beat_type === 'cta') && typeof s.character_cut === 'string' && /^https:\/\//i.test(s.character_cut) ? s.character_cut : null,
    })
  }
  if (!beats.length) beats.push({ text: '', isHook: true, clipUrl: null, seconds: 3, emphasis: [] })
  return beats
}

// Loop ending (C2): half a second of the reel's opening frame, held at the very end. Only on a reel of two beats or more.
export const LOOP_FRAMES = 15
export const loopsAtEnd = (reel: ReelData): boolean => reel.loopEnd === true && buildBeats(reel).length > 1

export function totalDurationInFrames(reel: ReelData): number {
  const beats = buildBeats(reel)
  // Sum the per-beat frames the way the composition does, then subtract the
  // overlap each transition steals so duration matches the rendered timeline.
  const seqFrames = beats.reduce((sum, b) => sum + Math.max(1, Math.round(b.seconds * FPS)), 0)
  const transitions = Math.max(0, beats.length - 1) * TRANSITION_FRAMES
  return Math.max(FPS, seqFrames - transitions) + (loopsAtEnd(reel) ? LOOP_FRAMES : 0)
}
