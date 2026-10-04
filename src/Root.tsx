import React from 'react'
import { Composition } from 'remotion'
import { ReelVideo } from './ReelVideo'
import { PromoVideo, PROMO_FPS, PROMO_W, PROMO_H, PROMO_FRAMES } from './PromoVideo'
import { FPS, WIDTH, HEIGHT, totalDurationInFrames, type ReelData } from './lib/types'
import sample from './sample-reel.json'
import { AdMotion, AD_MOTION_FRAMES, AD_MOTION_FPS } from './AdMotion'
import { TREATMENTS } from './lib/ad/adStudioEngine'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelVideo"
        component={ReelVideo as React.FC<Record<string, unknown>>}
        durationInFrames={totalDurationInFrames(sample as ReelData)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={sample as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => ({
          durationInFrames: totalDurationInFrames(props as ReelData),
        })}
      />
      {/* Brand promo (local-first) - see PromoVideo.tsx. Rides in this repo so it
          shares the font pipeline; harmless to the deployed reels site. */}
      <Composition
        id="CresloPromo"
        component={PromoVideo as React.FC<Record<string, unknown>>}
        durationInFrames={PROMO_FRAMES}
        fps={PROMO_FPS}
        width={PROMO_W}
        height={PROMO_H}
        // Audio rides in via --props at render time (or the Studio props panel) once
        // vo.mp3 / music.mp3 land in public/promo/ — null-safe until then.
        defaultProps={{ voiceover: null, music: null, musicVolume: 0.22 }}
      />
      {/* Moving adverts (Ad Studio step 4, 3 Oct 2026) - one finished advert as a 6 s video. Rendered
          by the backend's /api/ad/motion; its height follows the look (1080 square, 1350 portrait). */}
      <Composition
        id="AdMotion"
        component={AdMotion as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={AD_MOTION_FRAMES}
        fps={AD_MOTION_FPS}
        width={1080}
        height={1080}
        defaultProps={{ t: 'cinematic', ratio: 1080, style: 'pop', accent: '#b07a4f', copy: { name: 'Creslo', eyebrow: 'Ad Studio', headline: 'Adverts that *move*', sub: 'The same advert, brought in over six seconds.', cta: 'See it' }, site: 'creslo.ai' } as unknown as Record<string, unknown>}
        calculateMetadata={({ props }) => ({ height: (((TREATMENTS as any)[(props as any).t] || {}).ratio) || 1080 })}
      />
    </>
  )
}
