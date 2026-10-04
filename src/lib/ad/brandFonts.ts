// BRAND FONTS (step 3 of the premium adverts, Daniel 3 Oct 2026: "Optional brand font").
//
// A brand may choose one headline font from this short list on the Brand page; by default every
// advert look keeps its own font (the one it was designed and measured with). Ad Studio puts the
// chosen font in place of the look's headline font (--hfont), so looks that set their headline in a
// fixed typeface of their own (a chalkboard, a receipt, a letter) keep theirs. Each font carries the
// weight it reads well at: a plain sans at the 400 a serif look uses comes out thin.
//
// Every font here is in FONTS_IMPORT_URL (lib/adStudioEngine), which Ad Studio loads. Gate, 3 Oct 2026
// (scripts/ad-gate.mjs --font=<key>): every font clipped the Type poster and Big stat, whose oversized
// type IS the design - those looks are ownFont and keep theirs; Bold condensed also clipped the Cover
// story masthead (skip). With those, all 53 looks pass in all five fonts.

// skip: looks this font clips in (ad look gate, 3 Oct 2026) - they keep their own font with it.
export type BrandFont = { key: string; label: string; family: string; weight: number; skip?: string[] }

export const BRAND_FONTS: BrandFont[] = [
  { key: 'playfair', label: 'Classic serif', family: "'Playfair Display',serif", weight: 500 },
  { key: 'fraunces', label: 'Soft serif', family: "'Fraunces',serif", weight: 500 },
  { key: 'manrope', label: 'Clean modern', family: "'Manrope',sans-serif", weight: 800 },
  { key: 'oswald', label: 'Bold condensed', family: "'Oswald',sans-serif", weight: 600, skip: ['coverStory'] },
  { key: 'nunito', label: 'Friendly rounded', family: "'Nunito',sans-serif", weight: 800 },
]

export function brandFont(key: unknown): BrandFont | null {
  return BRAND_FONTS.find(f => f.key === key) || null
}

// Just these five, for the Brand page's chips (each chip is written in its own font).
export const BRAND_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500&family=Fraunces:wght@500&family=Manrope:wght@800&family=Oswald:wght@600&family=Nunito:wght@800&display=swap'

// The font a look's headline uses for this brand: the brand font, unless the look keeps its own.
export function brandFontFor(bf: BrandFont | null, look: { ownFont?: boolean } | undefined, key: string): BrandFont | null {
  if (!bf || !look || look.ownFont) return null
  return bf.skip && bf.skip.includes(key) ? null : bf
}
