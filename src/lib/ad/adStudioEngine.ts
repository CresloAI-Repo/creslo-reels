// Creslo Ad Studio engine - shared rendering source for the in-app composer.
// Ported from the standalone prototype so the app matches it exactly.
// Treatments return HTML strings; the component injects AD_CSS, sets innerHTML,
// then html-to-image rasterises the #cad node. ASCII only (Turbopack-safe).
// @ts-nocheck

export const FONTS_IMPORT_URL = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Serif+Display:ital@0;1&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,400&family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital@0;1&family=Inter:wght@400;500;600;700&family=Manrope:wght@400;600;700;800&family=Work+Sans:wght@400;500;600;700&family=Sora:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;700&family=Oswald:wght@500;600;700&family=Nunito:wght@400;600;700;800&family=Syne:wght@600;700;800&display=swap'

// Treatment CSS. Root id is #cad. Injected once by the component.
const AD_CSS_RAW = `#cad{transform-origin:top left;position:absolute;top:0;left:0}

/* ================= AD BASE ================= */
#cad{width:1080px;--h:1080px;height:var(--h);position:relative;overflow:hidden;font-family:'DM Sans',sans-serif;box-sizing:border-box;
  --accent:#9d6a40;--hfont:'DM Serif Display',serif;background:#0e141a}
#cad .layer{position:absolute;inset:0}
#cad .img{background-image:var(--img);background-size:cover;background-position:var(--fx,50%) var(--fy,50%);transform:translate(var(--ox,0%),var(--oy,0%)) scale(var(--zoom,1)) rotate(var(--rot,0deg))}
#cad .headline em{font-style:normal;color:var(--accent)}
/* Emphasis on a light headline over a photo or dark ground takes the brand colour LIFTED to read
   there (accent-on-dark), not the raw brand colour - a deep red "every day" measured 1.4:1 on the
   barber photo. On the light frosted glass it takes the darkened accent-text instead. */
#cad.cinematic .headline em,#cad.banner .headline em,#cad.diagonal .headline em,#cad.postcard .headline em,#cad.duotone .headline em,#cad.dish .headline em,#cad.chalk .headline em,#cad.escape .headline em,#cad.quote .headline em,#cad.beforeafter .headline em,#cad.baReveal .headline em,#cad.baDiagonal .headline em,#cad.baInset .headline em{color:var(--accent-on-dark)}
#cad.frosted .headline em{color:var(--accent-text)}
#cad .brandrow{display:flex;align-items:center;gap:13px}
#cad .blogo{height:88px;width:auto;max-width:480px;object-fit:contain;display:block;transform:scale(var(--logoscale,1));transform-origin:top left}
#cad .mono{width:54px;height:54px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-family:'DM Serif Display',serif;font-size:26px;font-weight:400}
#cad .bn{font-weight:700}
/* CHARTER LAW B (Doctrine 1.7): word integrity - headlines never break mid-word or
   hyphenate. Overflow is handled by fitAdText()'s ladder step-down, never by clipping. */
#cad .headline,#cad .title,#cad .quote,#cad .big{overflow-wrap:normal;word-break:keep-all;hyphens:none}
/* AUDIT 2 OCT 2026: a headline never ends on one word on its own ("FOR / YOU"). Balanced lines
   instead; fitAdText still steps the size down if a balanced block does not fit. */
#cad .headline,#cad .title,#cad .quote,#cad .eyebrow,#cad .sub{text-wrap:balance}
/* Nothing in a column look may be squeezed to make room: a squeezed part is a silent defect (the
   crest's round initials went oval, the poster's ticker went half height). Overflow instead shows
   up to the proof gate, which steps the type down. Looks that WANT a part to give say so. */
#cad>*{flex-shrink:0}

/* ---- cinematic (full-bleed, dark) ---- */
/* CHARTER LAW A: the scrim COMMITS - no transparent band where long headlines climb;
   the block zone (bottom ~45%) always clears the contrast gate. */
#cad.cinematic .scrim{background:linear-gradient(180deg,rgba(8,10,14,.55) 0%,rgba(8,10,14,.24) 30%,rgba(8,10,14,.62) 56%,rgba(6,8,11,.94) 100%)}
#cad.cinematic .edge{position:absolute;left:0;top:0;bottom:0;width:12px;background:var(--accent)}
#cad.cinematic .brandrow{position:absolute;top:54px;left:64px;z-index:3}
#cad.cinematic .mono{background:var(--panel);color:var(--ink)}
#cad.cinematic .bn{color:var(--ink-on-dark);font-size:21px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
#cad.cinematic .badge{position:absolute;top:56px;right:60px;width:104px;height:104px;border-radius:50%;border:2px solid rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;text-align:center;font-family:'Oswald';font-weight:600;font-size:15px;letter-spacing:.06em;color:var(--ink-on-dark);line-height:1.15;z-index:3}
#cad.cinematic .block{position:absolute;left:64px;bottom:120px;right:120px;z-index:3}
#cad.cinematic .eyebrow{font-family:'Oswald';font-weight:500;font-size:20px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:14px}
#cad.cinematic .headline{font-family:var(--hfont);font-weight:700;font-size:112px;line-height:.9;text-transform:uppercase;color:var(--ink-on-dark);text-shadow:0 4px 24px rgba(0,0,0,.5)}
#cad.cinematic .cta{display:inline-block;margin-top:30px;background:var(--accent-fill);color:var(--on-accent-fill);font-family:'Oswald';font-weight:600;font-size:19px;letter-spacing:.04em;text-transform:uppercase;padding:15px 28px}
#cad.cinematic .url{position:absolute;bottom:46px;right:60px;font-size:14px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8;z-index:3}

/* ---- editorial (side panel, light) ---- */
#cad.editorial{background:var(--surface)}
#cad.editorial .split{position:absolute;inset:0;display:flex}
#cad.editorial .ph{position:relative;flex:1.32;background-image:var(--img);background-size:cover;background-position:center}
#cad.editorial .pane{flex:1;background:var(--surface);padding:84px 60px;display:flex;flex-direction:column}
#cad.editorial .brandrow{margin-bottom:auto}
#cad.editorial .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:48px;height:48px;font-size:22px}
#cad.editorial .bn{color:var(--ink);font-size:20px}
#cad.editorial .eyebrow{font-weight:700;font-size:17px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-text);margin-bottom:22px}
#cad.editorial .headline{font-family:var(--hfont);font-weight:400;font-size:88px;line-height:1.0;color:var(--ink)}
#cad.editorial .sub{font-size:27px;line-height:1.5;color:var(--muted);margin-top:26px}
#cad.editorial .cta{align-self:flex-start;margin-top:34px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:19px;padding:16px 30px;border-radius:40px}
#cad.editorial .url{margin-top:auto;font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}

/* ---- card (listing, light) ---- */
#cad.card{background:var(--panel)}
#cad.card .pad{position:absolute;inset:0;padding:48px 52px;display:flex;flex-direction:column}
#cad.card .top{display:flex;align-items:center;gap:13px;margin-bottom:26px}
#cad.card .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:46px;height:46px;border-radius:10px;font-size:20px}
#cad.card .bn{font-size:20px;color:var(--ink)}
#cad.card .badge{margin-left:auto;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:800;font-size:14px;letter-spacing:.14em;text-transform:uppercase;padding:9px 16px;border-radius:7px}
#cad.card .photo{position:relative;height:560px;border-radius:16px;background-image:var(--img);background-size:cover;background-position:center;flex-shrink:0}
#cad.card .headline{font-family:var(--hfont);font-weight:400;font-size:74px;line-height:.96;color:var(--ink);margin-top:32px}
#cad.card .chips{display:flex;align-items:center;gap:16px;margin-top:22px;font-weight:700;font-size:21px;letter-spacing:.02em;text-transform:uppercase;color:var(--muted)}
#cad.card .chips .d{width:6px;height:6px;border-radius:50%;background:var(--accent)}
#cad.card .foot{margin-top:auto;display:flex;flex-wrap:wrap;align-items:center;gap:14px;border-top:1px solid rgba(0,0,0,.09);padding-top:26px}
#cad.card .sub{font-size:20px;color:var(--muted)}
#cad.card .cta{margin-left:auto;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:18px;padding:15px 28px;border-radius:40px}

/* ---- banner (bold, dark) ---- */
#cad.banner{background:var(--surface-dark)}
#cad.banner .img{bottom:auto;height:60%}
/* CHARTER LAW A (2026-08-08 audit fix): committed warm-ink top scrim behind the over-photo brand
   row + url (accent ::after is only a tint) so both clear the contrast gate over any photo. */
#cad.banner .img::before{content:'';position:absolute;left:0;right:0;top:0;height:200px;background:linear-gradient(180deg,rgba(20,14,8,.6) 0%,rgba(20,14,8,.32) 46%,rgba(20,14,8,0) 100%);z-index:2;pointer-events:none}
#cad.banner .brandrow{position:absolute;top:46px;left:56px;z-index:3}
#cad.banner .mono{background:var(--accent-fill);color:var(--on-accent-fill);font-size:24px}
#cad.banner .bn{color:var(--ink-on-dark);font-size:20px;text-shadow:0 2px 8px rgba(0,0,0,.5)}
#cad.banner .hazard{position:absolute;left:0;right:0;top:calc(60% - 14px);height:14px;background:repeating-linear-gradient(135deg,var(--accent) 0 26px,var(--surface-dark) 26px 52px);z-index:2}
/* CHARTER LAW B: the panel GROWS for long copy instead of swallowing it (the clipped "TO." class). */
#cad.banner .bottom{position:absolute;left:0;right:0;bottom:0;height:auto;min-height:40%;background:var(--surface-dark);padding:44px 60px;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box}
#cad.banner .eyebrow{font-family:'Oswald';font-weight:500;font-size:18px;letter-spacing:.28em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:12px}
#cad.banner .headline{font-family:var(--hfont);font-weight:700;font-size:92px;line-height:.9;text-transform:uppercase;color:var(--ink-on-dark)}
#cad.banner .arow{display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px;margin-top:20px}
#cad.banner .sub{font-size:23px;color:var(--ink-on-dark);opacity:.7}
#cad.banner .cta{margin-left:auto;background:var(--accent-fill);color:var(--on-accent-fill);font-family:'Oswald';font-weight:600;font-size:19px;letter-spacing:.04em;text-transform:uppercase;padding:15px 28px}
#cad.banner .url{position:absolute;top:46px;right:56px;font-size:13px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8;z-index:3}

/* ---- frosted (spa / beauty, light glass) ---- */
#cad.frosted .veil{background:linear-gradient(180deg,rgba(20,30,38,.12),rgba(20,30,38,.42))}
#cad.frosted .brandrow{position:absolute;top:54px;left:60px;z-index:3}
#cad.frosted .mono{background:var(--panel);color:var(--ink);width:48px;height:48px;font-size:22px}
#cad.frosted .bn{color:var(--ink-on-dark);font-size:20px;text-shadow:0 2px 10px rgba(0,0,0,.4)}
#cad.frosted .glass{position:absolute;left:90px;right:90px;bottom:96px;background:rgba(255,255,255,.93);border:1px solid rgba(255,255,255,.6);border-radius:26px;padding:54px 56px;z-index:3;box-shadow:0 30px 60px -30px rgba(0,0,0,.45)}
#cad.frosted .eyebrow{font-weight:700;font-size:16px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent-text);margin-bottom:16px}
#cad.frosted .headline{font-family:var(--hfont);font-weight:400;font-size:76px;line-height:1.0;color:var(--ink)}
#cad.frosted .sub{font-size:24px;line-height:1.5;color:var(--muted);margin-top:20px}
#cad.frosted .cta{display:inline-block;margin-top:26px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:18px;padding:14px 28px;border-radius:40px}
#cad.frosted .url{position:absolute;bottom:46px;right:60px;font-size:13px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8;z-index:3}

/* ---- twotone (hair / beauty, light) ---- */
#cad.twotone{background:var(--surface)}
#cad.twotone .ph{position:absolute;top:0;left:0;right:0;height:600px;background-image:var(--img);background-size:cover;background-position:center}
/* CHARTER LAW A (2026-08-08 audit fix): the brand row rides the raw photo up top. The accent
   ::after is a TINT, not a scrim - so a committed warm-ink top scrim guarantees the wordmark/name
   clears the contrast gate over ANY photo (light skies included). Sits above the photo, below the
   z-index:3 brand row. Warm ink (never pure black), fades out before the copy pane. */
#cad.twotone .ph::before{content:'';position:absolute;left:0;right:0;top:0;height:210px;background:linear-gradient(180deg,rgba(20,14,8,.62) 0%,rgba(20,14,8,.34) 46%,rgba(20,14,8,0) 100%);z-index:2;pointer-events:none}
#cad.twotone .brandrow{position:absolute;top:42px;left:50px;z-index:3}
#cad.twotone .mono{background:var(--panel);color:var(--accent-text);width:46px;height:46px;font-size:20px}
#cad.twotone .bn{color:var(--ink-on-dark);font-size:19px;text-shadow:0 2px 8px rgba(0,0,0,.4)}
#cad.twotone .pane{position:absolute;left:0;right:0;bottom:0;height:480px;background:var(--surface);padding:0 60px;display:flex;flex-direction:column;justify-content:center}
#cad.twotone .eyebrow{font-weight:700;font-size:17px;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-text);margin-bottom:16px}
#cad.twotone .headline{font-weight:800;font-size:86px;line-height:.96;color:var(--ink)}
#cad.twotone .headline em{font-family:var(--hfont);font-weight:400;color:var(--accent-text)}
#cad.twotone .sub{font-size:23px;color:var(--muted);margin-top:18px}
#cad.twotone .cta{align-self:flex-start;margin-top:26px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:18px;padding:15px 28px;border-radius:40px}

/* ---- diagonal (fitness, dark) ---- */
#cad.diagonal{background:var(--surface-dark)}
/* AUDIT 2 OCT 2026: the cut used to be fixed at 56%/78% of the frame, so a two-line headline with a
   badge climbed over it and the badge sat half on the photo, half on the ground. The angled ground
   is now drawn by the text block itself (.block::after below): its slanted top always sits 40px above
   the first line, whatever the copy, and it runs to the bottom of the frame. */
#cad.diagonal .img{clip-path:none}
/* CHARTER LAW A (2026-09-18 audit fix): diagonal was missed by the 2026-08-08 sweep that gave
   banner + twotone a committed top scrim. Its brand row rides the raw photo up top (the img fills
   0..56/78%), so the wordmark/name sat on bare imagery with only a text-shadow. Same committed
   warm-ink top scrim as banner/twotone (never pure/cool black) so the lockup clears the contrast
   gate over ANY photo. Sits inside the clipped photo's kept top band, below the z:3 brand row. */
#cad.diagonal .img::before{content:'';position:absolute;left:0;right:0;top:0;height:210px;background:linear-gradient(180deg,rgba(20,14,8,.62) 0%,rgba(20,14,8,.34) 46%,rgba(20,14,8,0) 100%);z-index:2;pointer-events:none}
#cad.diagonal .brandrow{position:absolute;top:46px;left:56px;z-index:3}
#cad.diagonal .mono{background:var(--accent-fill);color:var(--on-accent-fill);font-size:24px}
#cad.diagonal .bn{color:var(--ink-on-dark);font-size:20px;text-shadow:0 2px 8px rgba(0,0,0,.5)}
#cad.diagonal .block{position:absolute;left:56px;right:80px;bottom:114px;z-index:3}
#cad.diagonal .block::after{content:'';position:absolute;left:-56px;right:-80px;top:-220px;bottom:-1200px;background:var(--surface-dark);clip-path:polygon(0 180px,100% 0,100% 100%,0 100%);z-index:-2;pointer-events:none}
/* CHARTER LAW A: long headlines climb into the photo above the wedge - a soft ink
   pool rides behind the block so every line keeps its ground. */
/* CHARTER §1.8 (2026-09-18 audit fix): warm-ink scrim, not cool near-black. Was rgba(10,12,16)
   (blue-leaning, B>R); every other committed scrim in the studio is warm ink rgba(20,14,8). */
#cad.diagonal .block::before{content:'';position:absolute;inset:-48px -56px -40px;background:linear-gradient(180deg,rgba(20,14,8,0) 0%,rgba(20,14,8,.66) 26%,rgba(20,14,8,.9) 60%);filter:blur(14px);border-radius:32px;z-index:-1}
#cad.diagonal .eyebrow{font-family:'Oswald';font-weight:600;font-size:19px;letter-spacing:.28em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:14px}
#cad.diagonal .headline{font-family:var(--hfont);font-weight:700;font-size:104px;line-height:.88;text-transform:uppercase;color:var(--ink-on-dark)}
#cad.diagonal .cta{display:inline-block;margin-top:26px;background:var(--accent-fill);color:var(--on-accent-fill);font-family:'Oswald';font-weight:600;font-size:19px;letter-spacing:.04em;text-transform:uppercase;padding:15px 28px}
#cad.diagonal .url{position:absolute;bottom:44px;right:56px;font-size:13px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8;z-index:3}

/* ---- postcard (hospitality / holiday let, light) ---- */
#cad.postcard{background:var(--surface)}
#cad.postcard .pic{position:absolute;inset:64px;background-image:var(--img);background-size:cover;background-position:center;box-shadow:0 24px 50px -28px rgba(0,0,0,.45)}
/* CHARTER LAW A: committed from the block zone up. */
#cad.postcard .scrim{position:absolute;inset:64px;background:linear-gradient(180deg,rgba(18,22,26,.14) 0%,rgba(18,22,26,.22) 34%,rgba(18,22,26,.5) 56%,rgba(18,22,26,.82) 100%)}
#cad.postcard .brandrow{position:absolute;top:98px;left:50%;transform:translateX(-50%);z-index:3}
#cad.postcard .blogo{transform-origin:top center}
#cad.postcard .mono{background:var(--panel);color:var(--ink);width:46px;height:46px;font-size:20px}
#cad.postcard .bn{color:var(--ink-on-dark);font-size:19px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
#cad.postcard .block{position:absolute;left:0;right:0;bottom:150px;text-align:center;z-index:3;padding:0 120px}
#cad.postcard .eyebrow{font-weight:600;font-size:16px;letter-spacing:.34em;text-transform:uppercase;color:var(--ink-on-dark);opacity:.9;margin-bottom:18px}
#cad.postcard .headline{font-family:var(--hfont);font-weight:400;font-style:italic;font-size:90px;line-height:1.0;color:var(--ink-on-dark);text-shadow:0 4px 20px rgba(0,0,0,.4)}
#cad.postcard .cta{display:inline-block;margin-top:24px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:18px;padding:14px 30px;border-radius:40px}
#cad.postcard .url{position:absolute;bottom:92px;left:50%;transform:translateX(-50%);font-size:13px;letter-spacing:.22em;color:var(--ink-on-dark);opacity:.8;z-index:3}

/* ---- duotone (events / bold, vibrant) ---- */
#cad.duotone{background:var(--surface-dark)}
#cad.duotone .duo{position:absolute;inset:0;background:var(--accent);opacity:.48}
/* CHARTER LAW A: the tint commits - a 20% wash is not a ground. */
#cad.duotone .duo2{position:absolute;inset:0;background:linear-gradient(160deg,rgba(8,10,14,.22) 0%,rgba(8,10,14,.52) 45%,rgba(8,10,14,.9) 100%)}
#cad.duotone .brandrow{position:absolute;top:50px;left:56px;z-index:3}
#cad.duotone .mono{background:var(--panel);color:var(--accent-text);font-size:24px}
#cad.duotone .bn{color:var(--ink-on-dark);font-size:20px}
#cad.duotone .block{position:absolute;left:56px;right:90px;bottom:114px;z-index:3}
#cad.duotone .eyebrow{font-weight:700;font-size:18px;letter-spacing:.28em;text-transform:uppercase;color:var(--ink-on-dark);opacity:.86;margin-bottom:14px}
#cad.duotone .headline{font-family:var(--hfont);font-weight:700;font-size:106px;line-height:.88;text-transform:uppercase;color:var(--ink-on-dark)}
#cad.duotone .cta{display:inline-block;margin-top:26px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:18px;padding:14px 28px;border-radius:6px}
#cad.duotone .url{position:absolute;bottom:44px;right:56px;font-size:13px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8;z-index:3}

/* ---- spotlight (retail / product, vibrant) ---- */
#cad.spotlight{background:radial-gradient(78% 58% at 50% 32%,var(--accent),var(--surface-dark) 72%)}
#cad.spotlight .disc{position:absolute;top:118px;left:50%;transform:translateX(-50%);width:480px;height:480px;border-radius:50%;background-image:var(--img);background-size:cover;background-position:center;box-shadow:0 30px 70px -18px rgba(0,0,0,.6),0 0 0 10px rgba(255,255,255,.08)}
#cad.spotlight .brandrow{position:absolute;top:48px;left:56px;z-index:3}
/* CHARTER LAW A (2026-08-13 audit fix): the spotlight brand name rides the accent radial at the
   top-left - a LIGHT/saturated ground for light-accent brands. Every other light-name treatment
   (cinematic, banner, frosted, twotone, dish, stay, escape, quote) defends its brandrow name;
   spotlight was the lone exception (light ink, no ground defence). A soft committed ink scrim
   behind the row (ground-first, localised so it never muddies the central glow) plus the shared
   text-shadow guarantee the wordmark/name clear the contrast gate on ANY brand accent. */
#cad.spotlight .brandrow::before{content:'';position:absolute;left:-22px;top:-18px;right:-40px;bottom:-18px;background:radial-gradient(140% 160% at 30% 45%,rgba(15,10,6,.52) 0%,rgba(15,10,6,0) 78%);border-radius:20px;z-index:-1;pointer-events:none}
#cad.spotlight .mono{background:var(--panel);color:var(--accent-text);font-size:24px}
#cad.spotlight .bn{color:var(--ink-on-dark);font-size:20px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
/* SPOTLIGHT LAYOUT (Daniel, 2 Oct 2026: "poor positioning"). The copy used to hang from the
   bottom edge and grow upwards, so any two-line headline plus a badge climbed onto the photo -
   the proof gate then hid the eyebrow and shrank the headline to 59px to cope. The disc is now
   smaller and higher, and the copy owns its own zone underneath it (top 616px to 84px from the
   bottom), centred in that zone, so text and photo never share pixels. */
#cad.spotlight .block{position:absolute;left:0;right:0;top:622px;bottom:92px;display:flex;flex-direction:column;align-items:center;justify-content:safe center;text-align:center;padding:0 90px;z-index:3}
#cad.spotlight .block>*{flex-shrink:0;max-width:100%}
#cad.spotlight .taglist{justify-content:center}
#cad.spotlight .tagbadge{margin-bottom:14px}
#cad.spotlight .eyebrow{font-weight:700;font-size:17px;letter-spacing:.28em;text-transform:uppercase;color:var(--ink-on-dark);opacity:.86;margin-bottom:14px}
#cad.spotlight .headline{font-family:var(--hfont);font-weight:400;font-size:66px;line-height:1.04;color:var(--ink-on-dark)}
#cad.spotlight .headline em{color:var(--accent-on-dark)}
#cad.spotlight .cta{display:inline-block;margin-top:22px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:18px;padding:14px 30px;border-radius:40px}
#cad.spotlight .url{position:absolute;bottom:38px;left:50%;transform:translateX(-50%);font-size:13px;letter-spacing:.22em;color:var(--ink-on-dark);opacity:.8;z-index:3}

/* ---- cutout (product cut out of its photo, on the brand's own colours) - 5 Oct 2026, step 2 of
   the premium adverts. The product sits on its own, background removed (fal Bria RMBG 2.0 via the
   backend), large on the right over a soft halo, with the copy in its own column on the left so
   words and product never share pixels. --cut is the cut-out PNG; the look is only offered when
   one exists (Ad Studio). ---- */
#cad.cutout{background:radial-gradient(40% 44% at 76% 66%,color-mix(in srgb,var(--accent) 60%,var(--ground)),var(--ground))}
#cad.cutout .halo{position:absolute;right:-70px;top:250px;width:660px;height:660px;border-radius:50%;background:radial-gradient(closest-side,rgba(255,255,255,.22),rgba(255,255,255,0));pointer-events:none}
#cad.cutout .pic{position:absolute;right:40px;top:230px;bottom:70px;width:500px;background-image:var(--cut);background-size:contain;background-repeat:no-repeat;background-position:center bottom;filter:drop-shadow(0 34px 34px rgba(0,0,0,.38)) drop-shadow(0 6px 10px rgba(0,0,0,.22));z-index:2}
#cad.cutout .brandrow{position:absolute;top:56px;left:64px;z-index:3}
#cad.cutout .mono{background:var(--panel);color:var(--accent-text);font-size:24px}
#cad.cutout .bn{color:var(--on-ground);font-size:20px}
#cad.cutout .block{position:absolute;left:64px;top:170px;width:450px;bottom:120px;display:flex;flex-direction:column;justify-content:safe center;z-index:3}
#cad.cutout .block>*{flex-shrink:0;max-width:100%}
#cad.cutout .tagbadge{margin-bottom:16px;align-self:flex-start}
#cad.cutout .eyebrow{font-weight:700;font-size:17px;letter-spacing:.26em;text-transform:uppercase;color:var(--on-ground);opacity:.86;margin-bottom:16px}
#cad.cutout .headline{font-family:var(--hfont);font-weight:700;font-size:64px;line-height:1.02;color:var(--on-ground)}
#cad.cutout .headline em{color:var(--em-on-ground)}
#cad.cutout .sub{margin-top:18px;font-size:21px;line-height:1.45;color:var(--on-ground);opacity:.9}
#cad.cutout .taglist{margin-top:18px}
#cad.cutout .cta{align-self:flex-start;margin-top:26px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:19px;padding:15px 30px;border-radius:40px;box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--on-ground) 60%,transparent)}
#cad.cutout .url{position:absolute;bottom:46px;left:64px;font-size:13px;letter-spacing:.22em;color:var(--on-ground);opacity:.8;z-index:3}

/* ---- menu (food: menu board) ---- */
#cad.menu{background:var(--surface);color:var(--ink);padding:80px 74px;display:flex;flex-direction:column}
#cad.menu .brandrow{margin-bottom:38px}
#cad.menu .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:64px;height:64px;border-radius:15px;font-size:30px}
#cad.menu .bn{color:var(--ink);font-size:28px}
#cad.menu .eyebrow{font-weight:700;font-size:21px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent-text);margin-bottom:12px}
#cad.menu .title{font-family:var(--hfont);font-size:92px;line-height:.95;color:var(--ink);margin-bottom:48px}
/* AUDIT 2 OCT 2026: two or three items left half the board empty. The rows now sit in a box that
   takes the free height and spreads them through it (capped, so four items do not fly apart). */
#cad.menu .rows{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:space-evenly;max-height:620px;margin:0 0 30px}
#cad.menu .mr{margin-bottom:0}
#cad.menu .mr .line{display:flex;align-items:baseline;gap:14px}
#cad.menu .mr .nm{font-family:var(--hfont);font-size:44px;color:var(--ink);white-space:nowrap}
#cad.menu .mr .dots{flex:1;border-bottom:3px dotted rgba(0,0,0,.18);transform:translateY(-12px)}
#cad.menu .mr .pr{font-weight:700;font-size:40px;color:var(--accent-text)}
#cad.menu .mr .ds{font-size:23px;color:var(--muted);margin-top:6px}
#cad.menu .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;border-top:2px solid rgba(0,0,0,.12);padding-top:30px}
#cad.menu .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:25px;padding:18px 34px;border-radius:100px}
#cad.menu .url{font-size:20px;letter-spacing:.2em;color:var(--muted)}

/* ---- dish (food: dish hero) ---- */
#cad.dish{background:var(--surface-dark)}
#cad.dish .ph{position:absolute;inset:0;background-image:var(--img);background-size:cover;background-position:center;background-color:#7a3b1c}
/* CHARTER LAW A: no raw-photo band in the block's climb zone. */
#cad.dish .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,12,8,.45) 0%,rgba(20,12,8,.18) 30%,rgba(15,9,6,.56) 56%,rgba(15,9,6,.92) 100%)}
#cad.dish .brandrow{position:absolute;top:60px;left:64px;z-index:3}
#cad.dish .mono{background:rgba(255,255,255,.94);color:var(--ink);width:60px;height:60px;border-radius:14px;font-size:28px}
#cad.dish .bn{color:var(--ink-on-dark);font-size:24px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
#cad.dish .stamp{position:absolute;top:62px;right:64px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:800;font-size:40px;min-width:122px;height:122px;padding:0 18px;border-radius:61px;display:flex;align-items:center;justify-content:center;z-index:3;box-shadow:0 12px 32px -8px rgba(0,0,0,.55)}
#cad.dish .block{position:absolute;left:64px;right:64px;bottom:112px;z-index:3}
#cad.dish .eyebrow{font-weight:600;font-size:22px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:18px}
#cad.dish .headline{font-family:var(--hfont);font-style:italic;font-size:100px;line-height:.94;color:var(--ink-on-dark);text-shadow:0 4px 22px rgba(0,0,0,.5)}
#cad.dish .cta{display:inline-block;margin-top:40px;background:var(--panel);color:var(--ink);font-weight:700;font-size:26px;padding:18px 36px;border-radius:100px}
#cad.dish .url{position:absolute;bottom:54px;right:64px;font-size:18px;letter-spacing:.2em;color:rgba(255,255,255,.82);z-index:3}

/* ---- chalk (food: chalkboard special) ---- */
#cad.chalk{background:var(--surface-dark);color:var(--ink-on-dark);padding:74px;display:flex;flex-direction:column;align-items:center;text-align:center}
#cad.chalk::before{content:'';position:absolute;inset:30px;border:2px solid rgba(239,231,214,.26);border-radius:8px;pointer-events:none}
#cad.chalk .brandrow{z-index:2}
#cad.chalk .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:58px;height:58px;border-radius:14px;font-size:27px}
#cad.chalk .bn{color:var(--ink-on-dark);font-size:24px}
#cad.chalk .mid{margin:auto 0;z-index:2;padding-block:24px}
#cad.chalk .eyebrow{font-weight:600;font-size:24px;letter-spacing:.36em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:22px}
#cad.chalk .headline{font-family:var(--hfont);font-style:italic;font-size:104px;line-height:.97;color:var(--ink-on-dark)}
#cad.chalk .sub{font-size:27px;color:rgba(255,255,255,.66);margin:22px auto 0;max-width:760px;line-height:1.5}
#cad.chalk .price{margin:34px auto 0;width:fit-content;min-width:158px;height:132px;padding:0 44px;border-radius:66px;border:3px solid var(--accent-on-dark);display:flex;align-items:center;justify-content:center;font-family:var(--hfont);font-size:54px;color:var(--accent-on-dark)}
#cad.chalk .url{font-size:18px;letter-spacing:.24em;color:rgba(239,231,214,.82);z-index:2}

/* ---- stay (hospitality: stay card) ---- */
#cad.stay{background:var(--surface)}
#cad.stay .ph{position:absolute;top:0;left:0;right:0;height:660px;background-image:var(--img);background-size:cover;background-position:center;background-color:#2f6e72}
/* CHARTER LAW A (2026-08-08 audit fix): committed warm-ink top scrim behind the over-photo brand
   row (accent ::after is only a tint) so the wordmark/name clears the contrast gate over any photo. */
#cad.stay .ph::before{content:'';position:absolute;left:0;right:0;top:0;height:230px;background:linear-gradient(180deg,rgba(20,14,8,.6) 0%,rgba(20,14,8,.32) 46%,rgba(20,14,8,0) 100%);z-index:2;pointer-events:none}
#cad.stay .brandrow{position:absolute;top:48px;left:54px;z-index:3}
#cad.stay .mono{background:rgba(255,255,255,.94);color:var(--ink);width:56px;height:56px;border-radius:13px;font-size:26px}
#cad.stay .bn{color:var(--ink-on-dark);font-size:23px;text-shadow:0 2px 8px rgba(0,0,0,.35)}
#cad.stay .pane{position:absolute;left:0;right:0;bottom:0;height:auto;min-height:480px;box-sizing:border-box;background:var(--surface);padding:52px 60px;display:flex;flex-direction:column}
#cad.stay .eyebrow{font-weight:700;font-size:20px;letter-spacing:.26em;text-transform:uppercase;color:var(--accent-text);margin-bottom:16px}
#cad.stay .headline{font-family:var(--hfont);font-size:74px;line-height:1;color:var(--ink)}
#cad.stay .facts{display:flex;flex-wrap:wrap;gap:12px 22px;margin-top:24px}
#cad.stay .facts .ch{display:inline-flex;align-items:center;gap:9px;font-weight:600;font-size:23px;color:var(--muted)}
#cad.stay .facts .d{width:8px;height:8px;border-radius:50%;background:var(--accent-text);flex:0 0 auto}
#cad.stay .foot{margin-top:auto;padding-top:22px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px}
#cad.stay .from{font-size:22px;color:var(--muted)}
#cad.stay .from b{font-family:var(--hfont);font-size:40px;color:var(--ink);display:block;font-weight:400}
#cad.stay .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:24px;padding:17px 32px;border-radius:100px;white-space:nowrap}

/* ---- suite (hospitality: suite editorial) ---- */
#cad.suite{display:flex;background:var(--surface)}
#cad.suite .ph{flex:1.25;background-image:var(--img);background-size:cover;background-position:center;background-color:#8a6a3e}
#cad.suite .pane{flex:1;padding:78px 54px;display:flex;flex-direction:column}
#cad.suite .brandrow{margin-bottom:auto}
#cad.suite .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:52px;height:52px;border-radius:12px;font-size:24px}
#cad.suite .bn{color:var(--ink);font-size:22px}
#cad.suite .eyebrow{font-weight:700;font-size:18px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent-text);margin-bottom:14px}
#cad.suite .headline{font-family:var(--hfont);font-size:70px;line-height:1;color:var(--ink)}
#cad.suite .stars{margin-top:16px;display:flex;gap:5px}
#cad.suite .stars svg{fill:var(--accent-text)}
#cad.suite .amen{margin-top:24px;display:flex;flex-direction:column;gap:12px}
#cad.suite .amen div{font-size:23px;color:var(--muted);display:flex;align-items:center;gap:12px}
#cad.suite .amen .tk{color:var(--accent-text);font-weight:800}
#cad.suite .foot{margin-top:auto}
#cad.suite .from{font-size:21px;color:var(--muted)}
#cad.suite .from b{font-family:var(--hfont);font-size:44px;color:var(--ink);display:block;font-weight:400}
#cad.suite .cta{display:inline-block;margin-top:18px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:15px 30px;border-radius:100px}

/* ---- escape (hospitality: postcard) ---- */
#cad.escape{background:var(--surface-dark)}
#cad.escape .pic{position:absolute;inset:60px;background-image:var(--img);background-size:cover;background-position:center;background-color:#357e82}
/* CHARTER LAW A: the centred italic headline sits mid-frame - the scrim commits there too. */
#cad.escape .scrim{position:absolute;inset:60px;background:linear-gradient(180deg,rgba(10,20,21,.2) 0%,rgba(10,20,21,.42) 38%,rgba(10,20,21,.85) 100%)}
#cad.escape .brandrow{position:absolute;top:104px;left:50%;transform:translateX(-50%);z-index:3}
#cad.escape .mono{background:rgba(255,255,255,.94);color:var(--ink);width:54px;height:54px;border-radius:13px;font-size:25px}
#cad.escape .bn{color:var(--ink-on-dark);font-size:22px;text-shadow:0 2px 10px rgba(0,0,0,.4)}
#cad.escape .block{position:absolute;left:60px;right:60px;bottom:206px;text-align:center;z-index:3;padding:0 50px}
#cad.escape .pin{display:inline-flex;align-items:center;gap:10px;font-weight:600;font-size:23px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-on-dark);opacity:.92;margin-bottom:22px}
#cad.escape .headline{font-family:var(--hfont);font-style:italic;font-size:100px;line-height:1;color:var(--ink-on-dark);text-shadow:0 4px 22px rgba(0,0,0,.4)}
/* AUDIT 2 OCT 2026: the line of text was an outlined pill, which looked clumsy once it wrapped to two
   lines. Plain text now, with the button on its own line under it. */
#cad.escape .dates{display:block;margin:24px auto 0;max-width:820px;color:var(--ink-on-dark);font-weight:600;font-size:22px;line-height:1.45;letter-spacing:.04em;text-shadow:0 2px 12px rgba(0,0,0,.45)}
#cad.escape .cta{display:inline-block;margin-top:24px;background:var(--panel);color:var(--ink);font-weight:700;font-size:22px;padding:13px 30px;border-radius:100px}
#cad.escape .url{position:absolute;bottom:104px;left:50%;transform:translateX(-50%);font-size:18px;letter-spacing:.22em;color:rgba(255,255,255,.82);z-index:3}

/* photo adjustments (focal / fade / hue) across every treatment */
#cad .img,#cad.editorial .ph,#cad.twotone .ph,#cad.card .photo,#cad.postcard .pic,#cad.spotlight .disc{opacity:var(--imgop,1);filter:hue-rotate(var(--hue,0deg))}
#cad.editorial .ph,#cad.twotone .ph,#cad.card .photo,#cad.postcard .pic,#cad.spotlight .disc{background-position:var(--fx,50%) var(--fy,50%)}
#cad .img::after,#cad.editorial .ph::after,#cad.twotone .ph::after,#cad.card .photo::after,#cad.postcard .pic::after,#cad.spotlight .disc::after{content:'';position:absolute;inset:0;background:var(--accent);mix-blend-mode:soft-light;opacity:.5;pointer-events:none;border-radius:inherit}
#cad.dish .ph,#cad.stay .ph,#cad.suite .ph,#cad.escape .pic{opacity:var(--imgop,1);filter:hue-rotate(var(--hue,0deg));background-position:var(--fx,50%) var(--fy,50%)}
#cad.dish .ph::after,#cad.stay .ph::after,#cad.suite .ph::after,#cad.escape .pic::after{content:'';position:absolute;inset:0;background:var(--accent);mix-blend-mode:soft-light;opacity:.4;pointer-events:none}
#cad .tagbadge{display:inline-block;width:fit-content;max-width:100%;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:800;font-size:16px;letter-spacing:.12em;text-transform:uppercase;padding:8px 15px;border-radius:6px;margin-bottom:16px}
#cad .taglist{display:flex;flex-wrap:wrap;align-items:center;gap:10px 24px;margin-top:18px;font-weight:700;font-size:19px;letter-spacing:.04em;text-transform:uppercase;color:rgba(255,255,255,.92)}
#cad .taglist .d{width:6px;height:6px;border-radius:50%;background:var(--accent);flex:0 0 auto}
#cad .taglist .ti{display:inline-flex;align-items:center;gap:10px}
#cad.postcard .taglist,#cad.aura .taglist{justify-content:center}
#cad.editorial .taglist,#cad.twotone .taglist,#cad.frosted .taglist{color:var(--muted)}
/* ---- services pack: service list (checklist) ---- */
#cad.checklist{background:var(--panel);padding:78px 76px;display:flex;flex-direction:column}
#cad.checklist .brandrow{margin-bottom:42px}
#cad.checklist .mono{width:64px;height:64px;border-radius:15px;background:var(--accent-fill);color:var(--on-accent-fill);font-size:30px}
#cad.checklist .bn{font-weight:700;font-size:27px;color:var(--ink)}
#cad.checklist .eyebrow{font-weight:700;font-size:21px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent-text);margin-bottom:16px}
#cad.checklist .headline{font-family:var(--hfont);font-size:74px;line-height:1.02;color:var(--ink);margin-bottom:46px}
#cad.checklist .list{display:flex;flex-direction:column;gap:26px;margin:auto 0}
#cad.checklist .list:has(+ .trust){margin-bottom:0}
#cad.checklist .list + .trust{margin-bottom:auto}
#cad.checklist .row{display:flex;align-items:center;gap:20px;font-size:30px;color:var(--ink);font-weight:500}
#cad.checklist .tk{width:46px;height:46px;border-radius:50%;background:var(--accent-fill);color:var(--on-accent-fill);display:flex;align-items:center;justify-content:center;font-size:24px;flex:0 0 auto}
#cad.checklist .trust{display:flex;gap:10px;margin-top:30px;flex-wrap:wrap}
#cad.checklist .trust .t{display:inline-flex;align-items:center;gap:8px;border:1.5px solid rgba(0,0,0,.14);border-radius:100px;padding:11px 20px;font-size:20px;font-weight:600;color:var(--muted)}
#cad.checklist .trust .t .d{width:9px;height:9px;border-radius:50%;background:var(--accent-text)}
#cad.checklist .foot{margin-top:36px;display:flex;align-items:flex-end;justify-content:space-between;gap:18px;border-top:2px solid rgba(0,0,0,.10);padding-top:38px}
#cad.checklist .from{font-size:24px;color:var(--muted)}
#cad.checklist .from b{display:block;font-family:var(--hfont);font-size:54px;color:var(--ink);font-weight:400}
#cad.checklist .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:26px;padding:22px 38px;border-radius:100px;white-space:nowrap}
/* ---- services pack: quote banner ---- */
#cad.quote{background:var(--surface-dark)}
#cad.quote .pic{position:absolute;inset:0;background-image:var(--img);background-size:cover;background-position:var(--fx,50%) var(--fy,50%);opacity:var(--imgop,1);filter:hue-rotate(var(--hue,0deg))}
#cad.quote .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,12,16,.35),rgba(8,12,16,.86))}
#cad.quote .brandrow{position:absolute;top:54px;left:60px;z-index:3}
#cad.quote .mono{width:58px;height:58px;border-radius:13px;background:rgba(255,255,255,.92);color:var(--accent-text);font-size:27px}
#cad.quote .bn{font-weight:700;font-size:24px;color:var(--ink-on-dark);text-shadow:0 2px 8px rgba(0,0,0,.4)}
#cad.quote .block{position:absolute;left:60px;right:60px;bottom:150px;z-index:3}
#cad.quote .eyebrow{font-family:'Oswald';font-weight:600;font-size:24px;letter-spacing:.22em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:18px}
#cad.quote .headline{font-family:var(--hfont);font-size:84px;line-height:.98;color:var(--ink-on-dark);margin-bottom:34px}
#cad.quote .cta{display:inline-block;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:28px;padding:24px 44px;border-radius:100px}
#cad.quote .trust{position:absolute;left:60px;right:60px;bottom:54px;display:flex;gap:14px;flex-wrap:wrap;z-index:3}
#cad.quote .trust .t{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.12);border:1.5px solid rgba(255,255,255,.28);border-radius:100px;padding:13px 22px;font-size:21px;font-weight:600;color:var(--ink-on-dark)}
#cad.quote .trust .t .tk{color:var(--accent-on-dark);font-size:22px}
/* ---- services pack: before / after ---- */
#cad.beforeafter{background:var(--surface-dark)}
#cad.beforeafter .half{position:absolute;top:0;bottom:0;width:50%;background-size:cover;background-position:center}
#cad.beforeafter .before{left:0;background-image:var(--img);filter:saturate(.62) brightness(.82)}
#cad.beforeafter .after{right:0;background-image:var(--img2,var(--img))}
#cad.beforeafter .divide{position:absolute;top:0;bottom:0;left:50%;width:6px;background:var(--panel);transform:translateX(-50%);z-index:3;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 520px),transparent calc(100% - 420px));mask-image:linear-gradient(to bottom,#000 calc(100% - 520px),transparent calc(100% - 420px))}
#cad.beforeafter .knob{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:96px;height:96px;border-radius:50%;background:var(--panel);color:var(--accent-text);display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;z-index:4;box-shadow:0 10px 30px rgba(0,0,0,.3)}
/* CHARTER §1.8/§2 (2026-09-25 audit fix): the before/after family (beforeafter/baReveal/baStack/
   baDiagonal/baInset) was missed by the 2026-09-18 warm-ink sweep that corrected diagonal's scrim.
   Its committed scrims sat on cool blue-leaning near-black rgba(8,12,16) and its tag/chip pills on
   PURE rgba(0,0,0) - both banned by §1.8/§2 ("never pure #000"; warm brand ink, not cool near-black).
   All swapped to the studio's established warm ink rgba(20,14,8); opacities unchanged, so the contrast
   gate is untouched (a hue correction, not a contrast change). Remaining cool scrims in cinematic/
   postcard/duotone/escape/quote/coverStory/openhouse are LOGGED for a follow-up run (not swept blind). */
#cad.beforeafter .tag{position:absolute;top:46px;font-family:'Oswald';font-weight:700;font-size:24px;letter-spacing:.12em;color:var(--ink-on-dark);background:rgba(20,14,8,.42);padding:10px 22px;border-radius:100px;z-index:4}
#cad.beforeafter .tag.l{left:46px}
#cad.beforeafter .tag.r{right:46px;background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.beforeafter .scrim{position:absolute;left:0;right:0;bottom:0;height:360px;background:linear-gradient(transparent,rgba(20,14,8,.92));z-index:5}
#cad.beforeafter .block{position:absolute;left:0;right:0;bottom:0;padding:56px 60px;z-index:6;display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
#cad.beforeafter .bn{font-weight:700;font-size:22px;color:var(--ink-on-dark);opacity:.85;margin-bottom:10px}
/* the brand's own wordmark on the before/after looks (AUDIT 2 OCT 2026: four of them drew no brand at all) */
#cad .bamark{display:block;height:44px;width:auto;max-width:360px;object-fit:contain;object-position:left center;margin-bottom:16px}
#cad.baReveal .bn,#cad.baDiagonal .bn,#cad.baInset .bn{font-weight:700;font-size:22px;color:var(--ink-on-dark);opacity:.85;margin-bottom:12px}
#cad.beforeafter .headline{font-family:var(--hfont);font-size:62px;line-height:1;color:var(--ink-on-dark)}
#cad.beforeafter .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:25px;padding:20px 34px;border-radius:100px;white-space:nowrap;flex:0 0 auto}
/* the web address had no position of its own and printed in the top-left corner over BEFORE */
#cad.beforeafter .url{position:absolute;left:0;right:0;bottom:22px;text-align:center;font-size:13px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8;z-index:6}
#cad.beforeafter .block{padding-bottom:60px}
/* ---- sticker overlay + handles ---- */
#cad .stickerlayer{position:absolute;inset:0;z-index:60;pointer-events:none}
#cad .csticker{position:absolute;transform-origin:center center;pointer-events:auto;cursor:grab;filter:drop-shadow(0 6px 16px rgba(0,0,0,.32))}
#cad .csticker>svg{width:100%;height:100%;display:block;pointer-events:none}
#cad .csticker>img{width:100%;height:100%;display:block;object-fit:contain;pointer-events:none}
#cad .csticker.sel{outline:3px dashed var(--accent);outline-offset:8px;border-radius:10px}
#cad .shandle{position:absolute;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:#fff;border:3px solid var(--accent);pointer-events:auto;z-index:2;box-shadow:0 3px 10px rgba(0,0,0,.28)}
#cad .shandle>svg{width:20px;height:20px;display:block;pointer-events:none}
#cad .srot{top:-62px;left:50%;margin-left:-20px;cursor:grab;color:var(--accent)}
#cad .sscale{right:-20px;bottom:-20px;cursor:nwse-resize;color:var(--accent)}
#cad .sdel{left:-20px;top:-20px;background:#c0564f;border-color:#fff;color:#fff;cursor:pointer}
.csw>svg{width:38px;height:38px;display:block}
/* ---- before/after: reveal slider (dark) ---- */
#cad.baReveal{background:var(--surface-dark)}
#cad.baReveal .half{position:absolute;top:0;bottom:0;width:50%;background-size:cover;background-position:center}
#cad.baReveal .before{left:0;background-image:var(--img);filter:saturate(.7) brightness(.85)}
#cad.baReveal .after{right:0;background-image:var(--img2,var(--img))}
#cad.baReveal .seam{position:absolute;top:0;bottom:0;left:50%;width:4px;background:var(--panel);transform:translateX(-50%);z-index:3;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 560px),transparent calc(100% - 460px));mask-image:linear-gradient(to bottom,#000 calc(100% - 560px),transparent calc(100% - 460px))}
#cad.baReveal .knob{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:104px;height:104px;border-radius:50%;background:var(--panel);color:var(--accent-text);display:flex;align-items:center;justify-content:center;font-size:44px;z-index:4;box-shadow:0 12px 34px rgba(0,0,0,.34)}
#cad.baReveal .tag{position:absolute;top:52px;font-family:'Oswald';font-weight:600;font-size:22px;letter-spacing:.14em;color:var(--ink-on-dark);background:rgba(20,14,8,.5);padding:9px 20px;border-radius:100px;z-index:4}
#cad.baReveal .tag.l{left:52px}
#cad.baReveal .tag.r{right:52px;background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.baReveal .scrim{position:absolute;left:0;right:0;bottom:0;height:420px;background:linear-gradient(transparent,rgba(20,14,8,.94));z-index:5}
#cad.baReveal .block{position:absolute;left:0;right:0;bottom:0;padding:60px 64px;z-index:6}
#cad.baReveal .eyebrow{font-family:'Oswald';font-weight:500;font-size:20px;letter-spacing:.28em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:14px}
#cad.baReveal .headline{font-family:var(--hfont);font-size:74px;line-height:.98;color:var(--ink-on-dark);max-width:900px;text-shadow:0 3px 18px rgba(0,0,0,.5)}
#cad.baReveal .cta{display:inline-block;margin-top:28px;background:var(--accent-fill);color:var(--on-accent-fill);font-family:'Oswald';font-weight:600;font-size:22px;letter-spacing:.04em;text-transform:uppercase;padding:16px 32px;border-radius:100px}
#cad.baReveal .url{position:absolute;bottom:54px;right:60px;font-size:14px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8;z-index:6}
/* ---- before/after: stacked (light) ---- */
#cad.baStack{--h:1350px;background:var(--surface)}
#cad.baStack .pane{position:absolute;left:0;right:0;height:50%;background-size:cover;background-position:center}
#cad.baStack .top{top:0;background-image:var(--img);filter:saturate(.72) brightness(.9)}
#cad.baStack .bot{bottom:0;background-image:var(--img2,var(--img))}
#cad.baStack .seam{position:absolute;left:0;right:0;top:50%;height:8px;background:var(--panel);transform:translateY(-50%);z-index:3}
#cad.baStack .chip{position:absolute;left:56px;font-family:'Oswald';font-weight:600;font-size:22px;letter-spacing:.14em;color:var(--ink-on-dark);background:rgba(20,14,8,.42);padding:10px 22px;border-radius:100px;z-index:4}
#cad.baStack .chip.t{top:56px}
#cad.baStack .chip.b{bottom:275px;background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.baStack .plate{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5;background:var(--panel);border-radius:20px;padding:26px 42px;box-shadow:0 20px 50px -20px rgba(0,0,0,.4);text-align:center;max-width:820px}
#cad.baStack .headline{font-family:var(--hfont);font-size:58px;line-height:1;color:var(--ink)}
#cad.baStack .foot{position:absolute;left:0;right:0;bottom:0;height:190px;background:var(--surface-dark);display:flex;align-items:center;justify-content:space-between;padding:0 56px;z-index:6}
#cad.baStack .bn{color:var(--ink-on-dark);font-weight:700;font-size:26px}
#cad.baStack .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-family:'Oswald';font-weight:600;font-size:22px;text-transform:uppercase;padding:16px 30px;border-radius:100px}
/* ---- before/after: diagonal (dark) ---- */
#cad.baDiagonal{background:var(--surface-dark)}
#cad.baDiagonal .before{position:absolute;inset:0;background-image:var(--img);background-size:cover;background-position:center;filter:saturate(.7) brightness(.82)}
#cad.baDiagonal .after{position:absolute;inset:0;background-image:var(--img2,var(--img));background-size:cover;background-position:center;clip-path:polygon(100% 0,100% 100%,0 100%)}
#cad.baDiagonal .seam{position:absolute;inset:0;background:linear-gradient(to bottom right,transparent calc(50% - 3px),var(--panel) calc(50% - 3px),var(--panel) calc(50% + 3px),transparent calc(50% + 3px));z-index:3;pointer-events:none;-webkit-mask-image:linear-gradient(to bottom,#000 calc(100% - 560px),transparent calc(100% - 460px));mask-image:linear-gradient(to bottom,#000 calc(100% - 560px),transparent calc(100% - 460px))}
#cad.baDiagonal .tag{position:absolute;font-family:'Oswald';font-weight:700;font-size:24px;letter-spacing:.12em;color:var(--ink-on-dark);background:rgba(20,14,8,.5);padding:9px 20px;border-radius:100px;z-index:4}
#cad.baDiagonal .tag.l{top:60px;left:60px}
#cad.baDiagonal .tag.r{bottom:430px;right:60px;background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.baDiagonal .scrim{position:absolute;left:0;right:0;bottom:0;height:360px;background:linear-gradient(transparent,rgba(20,14,8,.92));z-index:5}
#cad.baDiagonal .block{position:absolute;left:0;right:0;bottom:0;padding:56px 60px;z-index:6}
#cad.baDiagonal .headline{font-family:var(--hfont);font-size:70px;line-height:.98;color:var(--ink-on-dark);max-width:860px;text-shadow:0 3px 18px rgba(0,0,0,.5)}
#cad.baDiagonal .cta{display:inline-block;margin-top:24px;background:var(--accent-fill);color:var(--on-accent-fill);font-family:'Oswald';font-weight:600;font-size:21px;text-transform:uppercase;padding:15px 30px;border-radius:100px}
#cad.baDiagonal .url{position:absolute;bottom:52px;right:60px;font-size:14px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8;z-index:6}
/* ---- before/after: inset reveal (dark) ---- */
#cad.baInset{background:var(--surface-dark)}
#cad.baInset .after{position:absolute;inset:0;background-image:var(--img2,var(--img));background-size:cover;background-position:center}
#cad.baInset .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,14,8,.5) 0%,transparent 30%,transparent 50%,rgba(20,14,8,.9) 100%);z-index:2}
#cad.baInset .inset{position:absolute;left:56px;top:130px;width:300px;height:300px;border-radius:20px;background-image:var(--img);background-size:cover;background-position:center;border:5px solid var(--panel);box-shadow:0 16px 40px rgba(0,0,0,.45);z-index:4;filter:saturate(.75)}
#cad.baInset .insetlbl{position:absolute;left:72px;top:150px;font-family:'Oswald';font-weight:700;font-size:17px;letter-spacing:.14em;color:var(--ink-on-dark);background:rgba(20,14,8,.55);padding:7px 15px;border-radius:100px;z-index:5}
#cad.baInset .aftlbl{position:absolute;top:56px;right:56px;font-family:'Oswald';font-weight:700;font-size:22px;letter-spacing:.14em;color:var(--on-accent-fill);background:var(--accent-fill);padding:10px 22px;border-radius:100px;z-index:5}
#cad.baInset .block{position:absolute;left:56px;right:56px;bottom:70px;z-index:5}
#cad.baInset .bn{font-weight:700;font-size:22px;color:var(--ink-on-dark);opacity:.85;margin-bottom:12px}
#cad.baInset .headline{font-family:var(--hfont);font-size:66px;line-height:1;color:var(--ink-on-dark);max-width:640px;text-shadow:0 3px 18px rgba(0,0,0,.5)}
#cad.baInset .cta{display:inline-block;margin-top:30px;background:var(--panel);color:var(--ink);font-family:'Oswald';font-weight:600;font-size:20px;text-transform:uppercase;padding:14px 28px;border-radius:100px}
/* ---- before/after: filmstrip (light) ---- */
#cad.baFilmstrip{--h:1350px;background:var(--surface)}
#cad.baFilmstrip .brand{position:absolute;top:56px;left:60px;right:60px;display:flex;align-items:center;gap:14px;z-index:3}
#cad.baFilmstrip .mono{background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.baFilmstrip .bn{font-size:24px;color:var(--ink)}
#cad.baFilmstrip .blogo{height:48px;max-width:360px}
#cad.baFilmstrip .panels{position:absolute;top:150px;left:60px;right:60px;display:flex;gap:26px}
#cad.baFilmstrip .card{flex:1;background:var(--panel);border-radius:22px;padding:18px 18px 22px;box-shadow:0 18px 44px -26px rgba(43,36,28,.5)}
#cad.baFilmstrip .ph{height:520px;border-radius:14px;background-size:cover;background-position:center}
#cad.baFilmstrip .card.b .ph{background-image:var(--img);filter:saturate(.72)}
#cad.baFilmstrip .card.a .ph{background-image:var(--img2,var(--img))}
#cad.baFilmstrip .lbl{margin-top:16px;font-family:'Oswald';font-weight:600;font-size:22px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent-text);text-align:center}
#cad.baFilmstrip .card.b .lbl{color:var(--muted)}
#cad.baFilmstrip .foot{position:absolute;left:60px;right:60px;top:752px;bottom:90px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
#cad.baFilmstrip .headline{font-family:var(--hfont);font-size:64px;line-height:1.02;color:var(--ink);max-width:900px;margin:0 auto}
#cad.baFilmstrip .cta{display:inline-block;margin-top:26px;background:var(--accent-fill);color:var(--on-accent-fill);font-family:'Oswald';font-weight:600;font-size:22px;text-transform:uppercase;padding:16px 32px;border-radius:100px}
#cad.baFilmstrip .url{position:absolute;bottom:44px;left:0;right:0;text-align:center;font-size:14px;letter-spacing:.24em;color:var(--muted)}
/* ---- testimonial: editorial quote (light) ---- */
#cad.tmQuote{background:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:150px 96px;text-align:center}
#cad.tmQuote .brand{position:absolute;bottom:64px;left:0;right:0;text-align:center;font-weight:700;font-size:22px;color:var(--muted);letter-spacing:.2em;text-transform:uppercase}
#cad.tmQuote .stars{color:var(--accent-text);font-size:40px;letter-spacing:8px;margin-bottom:26px}
#cad.tmQuote .quote{font-family:var(--hfont);font-style:italic;font-size:68px;line-height:1.16;color:var(--ink);max-width:860px}
#cad.tmQuote .cta{margin-top:44px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 34px;border-radius:100px}
#cad.tmQuote .who{margin-top:38px;font-family:'Oswald';font-weight:600;font-size:23px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-text)}
/* ---- testimonial: review card (dark) ---- */
#cad.tmCard{background:var(--surface-dark);display:flex;align-items:center;justify-content:center;padding:96px}
#cad.tmCard .card{background:var(--panel);border-radius:32px;padding:66px 60px;max-width:860px;box-shadow:0 40px 90px -30px rgba(0,0,0,.6)}
#cad.tmCard .rowt{display:flex;align-items:center;gap:22px;margin-bottom:32px}
#cad.tmCard .av{width:90px;height:90px;border-radius:50%;background:var(--accent-fill);color:var(--on-accent-fill);display:flex;align-items:center;justify-content:center;font-family:var(--hfont);font-size:38px;flex:none}
#cad.tmCard .nm{font-weight:700;font-size:29px;color:var(--ink)}
#cad.tmCard .stars{color:var(--accent-text);font-size:25px;letter-spacing:4px;margin-top:8px}
#cad.tmCard .quote{font-family:var(--hfont);font-size:46px;line-height:1.24;color:var(--ink)}
#cad.tmCard .brand{position:absolute;bottom:54px;left:0;right:0;text-align:center;color:var(--ink-on-dark);opacity:.5;font-size:20px;letter-spacing:.2em;text-transform:uppercase}
/* ---- testimonial: photo + quote (light) ---- */
#cad.tmSplit{background:var(--surface)}
#cad.tmSplit .ph{position:absolute;left:0;top:0;bottom:0;width:44%;background-image:var(--img);background-size:cover;background-position:var(--fx,50%) var(--fy,50%);background-color:var(--surface-dark)}
#cad.tmSplit .pane{position:absolute;right:0;top:0;bottom:0;width:56%;padding:90px 68px;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box}
#cad.tmSplit .eyebrow{font-family:'Oswald';font-weight:600;font-size:19px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent-text);margin-bottom:20px}
#cad.tmSplit .stars{color:var(--accent-text);font-size:32px;letter-spacing:6px;margin-bottom:24px}
#cad.tmSplit .quote{font-family:var(--hfont);font-size:54px;line-height:1.16;color:var(--ink)}
#cad.tmSplit .brand{position:absolute;top:64px;left:68px;font-weight:700;font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);z-index:2}
#cad.tmSplit .cta{align-self:flex-start;margin-top:40px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 32px;border-radius:100px}
#cad.tmSplit .who{margin-top:30px;font-weight:700;font-size:23px;color:var(--muted)}
/* ---- testimonial: bold stars (dark) ---- */
#cad.tmStars{--h:1350px;background:var(--surface-dark);padding:130px 84px;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box}
#cad.tmStars .brand{position:absolute;top:64px;left:84px;font-weight:700;font-size:22px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-on-dark);opacity:.55}
#cad.tmStars .stars{color:var(--accent-on-dark);font-size:70px;letter-spacing:10px;margin-bottom:42px}
#cad.tmStars .quote{font-family:var(--hfont);font-size:78px;line-height:1.06;color:var(--ink-on-dark);max-width:900px}
/* the big opening quote mark stands in for the stars when there is no rating; it is part of the
   quote, so it moves with it */
#cad.tmStars .qmark{display:block;font-size:2.8em;line-height:.62;height:.42em;color:var(--accent-on-dark);margin-bottom:.32em}
#cad.tmStars .who{margin-top:44px;font-family:'Oswald';font-weight:600;font-size:26px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent-on-dark)}
#cad.tmStars .cta{align-self:flex-start;margin-top:46px;background:var(--accent-on-dark);color:var(--surface-dark);font-family:'Oswald';font-weight:600;font-size:23px;text-transform:uppercase;padding:17px 32px;border-radius:100px}
/* ---- testimonial: speech bubble (vibrant) ---- */
#cad.tmBubble{background:var(--ground);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:110px 90px}
#cad.tmBubble .brand{position:absolute;top:70px;left:0;right:0;text-align:center;color:var(--on-ground);font-weight:700;font-size:22px;letter-spacing:.2em;text-transform:uppercase}
#cad.tmBubble .bub{position:relative;background:var(--panel);border-radius:40px;padding:58px 56px;max-width:820px}
#cad.tmBubble .bub::after{content:'';position:absolute;left:80px;bottom:-34px;border-width:36px 30px 0 0;border-style:solid;border-color:var(--panel) transparent transparent transparent}
#cad.tmBubble .stars{color:var(--accent-text);font-size:30px;letter-spacing:6px;margin-bottom:20px}
#cad.tmBubble .quote{font-family:var(--hfont);font-size:56px;line-height:1.18;color:var(--ink)}
#cad.tmBubble .who{margin-top:64px;color:var(--on-ground);font-weight:700;font-size:25px;letter-spacing:.04em;text-align:center;max-width:820px}
/* ---- bento (modular tiles, light) - 2026 bento-grid trend ---- */
#cad.bento{background:var(--surface);padding:52px;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:130px 320px 1fr 130px;gap:22px}
#cad.bento .tile{border-radius:26px;position:relative;overflow:hidden}
#cad.bento .t-brand{grid-column:1;grid-row:1;background:var(--panel);display:flex;align-items:center;gap:14px;padding:0 32px}
#cad.bento .t-brand .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:52px;height:52px;border-radius:13px;font-size:24px;flex:0 0 auto}
#cad.bento .t-brand .bn{color:var(--ink);font-size:22px;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.bento .blogo{height:56px;max-width:300px}
#cad.bento .t-photo{grid-column:2;grid-row:1/3;background-image:var(--img);background-size:cover;background-position:var(--fx,50%) var(--fy,50%);background-color:var(--surface-dark);opacity:var(--imgop,1);filter:hue-rotate(var(--hue,0deg))}
#cad.bento .pbadge{position:absolute;top:22px;left:22px;background:var(--panel);color:var(--ink);font-weight:800;font-size:15px;letter-spacing:.14em;text-transform:uppercase;padding:9px 16px;border-radius:100px;max-width:330px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.bento .t-eye{grid-column:1;grid-row:2;background:var(--ground);display:flex;flex-direction:column;justify-content:center;padding:0 34px}
#cad.bento .eyebrow{font-weight:800;font-size:20px;letter-spacing:.22em;text-transform:uppercase;color:var(--on-ground);max-width:400px}
#cad.bento .t-eye .sub{font-size:22px;line-height:1.45;color:var(--on-ground);opacity:.85;margin-top:16px;max-width:400px}
#cad.bento .t-head{grid-column:1/3;grid-row:3;background:var(--panel);display:flex;align-items:center;padding:0 48px}
#cad.bento .headline{font-family:var(--hfont);font-weight:600;font-size:64px;line-height:1.02;color:var(--ink);max-width:860px}
#cad.bento .headline em{color:var(--accent-text)}
#cad.bento .t-chips{grid-column:1;grid-row:4;background:var(--panel);display:flex;align-items:center;gap:12px;padding:0 26px;flex-wrap:wrap;overflow:hidden}
#cad.bento .pill{border:1.5px solid var(--muted);color:var(--muted);font-weight:600;font-size:17px;padding:8px 16px;border-radius:100px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.bento .t-cta{grid-column:2;grid-row:4;background:var(--surface-dark);display:flex;align-items:center;justify-content:center}
#cad.bento .cta{color:var(--ink-on-dark);font-weight:700;font-size:23px;max-width:420px;text-align:center}
/* ---- poster (oversized type, vibrant) - 2026 expressive-typography trend ---- */
#cad.poster{background:var(--ground);padding:64px;display:flex;flex-direction:column}
/* Nothing in the poster column may be squeezed: a tall headline used to crush the kicker and the
   ticker to half height, the proof gate then hid both, and the poster lost its bottom half. */
#cad.poster>*{flex-shrink:0}
/* ...except the headline, which is the one part allowed to give: it takes what height is left, and
   fitAdText steps the type down until the copy fits it, instead of the copy running off the foot. */
#cad.poster>.headline{flex-shrink:1;min-height:0;overflow:hidden;margin-bottom:auto}
#cad.poster .mono{background:var(--panel);color:var(--accent-text);font-size:24px}
#cad.poster .bn{color:var(--on-ground);font-size:21px;max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.poster .kicker{align-self:flex-start;margin-top:54px;background:var(--panel);color:var(--accent-text);font-weight:800;font-size:18px;letter-spacing:.24em;text-transform:uppercase;padding:13px 26px;border-radius:100px;max-width:760px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* CHARTER LAW B: break-word removed - "FOOTBAL L'S" was a firing offence; fitAdText steps the size down instead. */
#cad.poster .headline{font-family:var(--hfont);font-weight:800;font-size:112px;line-height:.94;text-transform:uppercase;color:var(--on-ground);margin-top:36px;max-width:920px}
#cad.poster .headline em{color:var(--em-on-ground);font-style:italic}
#cad.poster .ticker{margin-top:auto;border-top:3px solid var(--on-ground);border-bottom:3px solid var(--on-ground);padding:18px 4px;font-weight:800;font-size:18px;letter-spacing:.14em;text-transform:uppercase;color:var(--on-ground);white-space:nowrap;overflow:hidden;max-width:952px}
#cad.poster .ticker .d{opacity:.8;padding:0 6px}
#cad.poster .foot{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:30px}
#cad.poster .sub{font-size:22px;line-height:1.4;color:var(--on-ground);opacity:.8;max-width:560px}
#cad.poster .cta{background:var(--panel);color:var(--accent-text);font-weight:800;font-size:22px;letter-spacing:.04em;text-transform:uppercase;padding:18px 34px;border-radius:100px;white-space:nowrap;flex:0 0 auto;max-width:500px;overflow:hidden;text-overflow:ellipsis}
/* ---- stat (number-led proof, dark) - data-as-design trend ---- */
#cad.stat{background:var(--surface-dark);padding:72px 68px;display:flex;flex-direction:column}
#cad.stat .mono{background:var(--accent-fill);color:var(--on-accent-fill);font-size:24px}
#cad.stat .bn{color:var(--ink-on-dark);font-size:21px;max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.stat .eyebrow{margin-top:auto;padding-top:40px;font-weight:700;font-size:20px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent-on-dark);max-width:800px}
#cad.stat .big{margin-top:18px;font-family:var(--hfont);font-weight:800;font-size:264px;line-height:.92;letter-spacing:-.02em;color:var(--accent-on-dark);max-width:944px;white-space:nowrap;overflow:hidden}
#cad.stat .bars{display:flex;gap:10px;margin-top:26px}
#cad.stat .bars span{height:12px;border-radius:6px;background:var(--accent-on-dark)}
#cad.stat .bars .b1{width:190px}#cad.stat .bars .b2{width:120px}#cad.stat .bars .b3{width:70px;opacity:.55}#cad.stat .bars .b4{width:38px;opacity:.3}
#cad.stat .headline{font-family:var(--hfont);font-size:60px;line-height:1.04;color:var(--ink-on-dark);margin-top:32px;max-width:880px}
#cad.stat .headline em{color:var(--accent-on-dark)}
#cad.stat .sub{font-size:24px;line-height:1.45;color:var(--ink-on-dark);opacity:.62;margin-top:18px;max-width:800px}
#cad.stat .foot{margin-top:auto;padding-top:36px;display:flex;align-items:center;justify-content:space-between;gap:18px}
#cad.stat .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:17px 32px;border-radius:100px;white-space:nowrap;max-width:500px;overflow:hidden;text-overflow:ellipsis}
#cad.stat .url{font-size:14px;letter-spacing:.2em;color:var(--ink-on-dark);opacity:.8}
/* ---- snapshot (scrapbook polaroid, light, portrait) - UGC / authenticity trend ---- */
#cad.snapshot{--h:1350px;background:var(--surface);padding:60px 64px;display:flex;flex-direction:column;align-items:center;text-align:center}
#cad.snapshot .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:50px;height:50px;font-size:22px}
#cad.snapshot .bn{color:var(--ink);font-size:21px;max-width:460px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.snapshot .frame{position:relative;margin-top:44px;width:760px;background:var(--panel);padding:24px 24px 80px;border-radius:8px;box-shadow:0 28px 60px -26px rgba(0,0,0,.4);transform:rotate(-2.2deg)}
#cad.snapshot .ph{height:560px;background-image:var(--img);background-size:cover;background-position:var(--fx,50%) var(--fy,50%);background-color:var(--surface-dark);opacity:var(--imgop,1);filter:hue-rotate(var(--hue,0deg))}
#cad.snapshot .stick{position:absolute;right:-28px;top:-28px;width:124px;height:124px;border-radius:50%;background:var(--accent-fill);color:var(--on-accent-fill);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;letter-spacing:.08em;text-transform:uppercase;transform:rotate(8deg);box-shadow:0 12px 28px -10px rgba(0,0,0,.35);text-align:center;padding:8px;box-sizing:border-box;overflow:hidden}
#cad.snapshot .cap{position:absolute;left:26px;right:26px;bottom:20px;font-family:var(--hfont);font-style:italic;font-size:34px;color:var(--ink);max-width:708px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.snapshot .headline{font-family:var(--hfont);font-size:60px;line-height:1.06;color:var(--ink);margin-top:56px;max-width:880px}
#cad.snapshot .headline em{color:var(--accent-text)}
#cad.snapshot .sub{font-size:24px;line-height:1.45;color:var(--muted);margin-top:16px;max-width:760px}
#cad.snapshot .chips{display:flex;justify-content:center;gap:12px;margin-top:22px;flex-wrap:wrap;max-width:880px}
#cad.snapshot .pill{border:1.5px solid var(--muted);color:var(--muted);font-weight:600;font-size:18px;padding:9px 18px;border-radius:100px;max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.snapshot .cta{margin-top:auto;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:24px;padding:18px 36px;border-radius:100px;max-width:600px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* ---- aura (atmospheric glow, dark) - 2026 aura-gradient trend ---- */
#cad.aura{background:var(--surface-dark);padding:76px 84px;display:flex;flex-direction:column;align-items:center;text-align:center}
#cad.aura .glow{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none}
#cad.aura .g1{width:680px;height:680px;left:-180px;top:-160px;background:var(--accent);opacity:.55}
#cad.aura .g2{width:600px;height:600px;right:-160px;bottom:-140px;background:var(--accent-on-dark);opacity:.3}
#cad.aura .g3{width:460px;height:460px;left:310px;top:330px;background:var(--accent);opacity:.22}
#cad.aura .brandrow{z-index:2}
#cad.aura .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:54px;height:54px;font-size:24px}
#cad.aura .bn{color:var(--ink-on-dark);font-size:22px;max-width:460px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.aura .mid{margin:auto 0;padding-block:24px;z-index:2;display:flex;flex-direction:column;align-items:center}
#cad.aura .eyebrow{font-weight:600;font-size:19px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:26px;max-width:800px}
#cad.aura .headline{font-family:var(--hfont);font-weight:400;font-size:104px;line-height:1.02;color:var(--ink-on-dark);max-width:880px}
#cad.aura .headline em{color:var(--accent-on-dark);font-style:italic}
#cad.aura .sub{font-size:26px;line-height:1.5;color:var(--ink-on-dark);opacity:.72;margin-top:24px;max-width:720px}
#cad.aura .cta{margin-top:38px;background:var(--accent-on-dark);color:var(--surface-dark);font-weight:700;font-size:21px;padding:17px 36px;border-radius:100px;max-width:600px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.aura .url{z-index:2;font-size:14px;letter-spacing:.24em;color:var(--ink-on-dark);opacity:.8}
/* ---- ticket (event ticket, vibrant) - feed-native print ephemera ---- */
#cad.ticket{background:var(--ground);padding:64px;display:flex;flex-direction:column;align-items:center}
#cad.ticket .brandrow{align-self:flex-start}
#cad.ticket .mono{background:var(--panel);color:var(--accent-text);font-size:24px}
#cad.ticket .bn{color:var(--on-ground);font-size:21px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.ticket .tik{position:relative;margin:auto 0;width:920px;background:var(--panel);border-radius:28px;display:flex;box-shadow:0 30px 70px -30px rgba(0,0,0,.45)}
#cad.ticket .notch{position:absolute;width:40px;height:40px;border-radius:50%;background:var(--ground);right:231px;z-index:2}
#cad.ticket .n1{top:-20px}
#cad.ticket .n2{bottom:-20px}
#cad.ticket .main{flex:1;min-width:0;padding:56px 48px 52px 52px;display:flex;flex-direction:column;text-align:left}
#cad.ticket .eyebrow{font-weight:700;font-size:17px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent-text);margin-bottom:18px;max-width:540px}
#cad.ticket .headline{font-family:var(--hfont);font-weight:700;font-size:62px;line-height:1.02;color:var(--ink);max-width:540px}
#cad.ticket .sub{font-size:22px;line-height:1.45;color:var(--muted);margin-top:18px;max-width:520px}
#cad.ticket .meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px;max-width:540px}
#cad.ticket .pill{border:1.5px solid var(--muted);color:var(--muted);font-weight:600;font-size:17px;padding:8px 16px;border-radius:100px;max-width:250px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.ticket .perf{border-left:3px dashed var(--muted);opacity:.5;margin:30px 0}
#cad.ticket .stub{width:248px;flex:0 0 auto;padding:48px 28px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
#cad.ticket .badge{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:800;font-size:15px;letter-spacing:.16em;text-transform:uppercase;padding:8px 16px;border-radius:100px;max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.ticket .price{font-family:var(--hfont);font-weight:700;font-size:56px;color:var(--ink);margin-top:18px;max-width:190px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.ticket .cta{margin-top:22px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:19px;padding:13px 24px;border-radius:100px;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.ticket .url{font-size:14px;letter-spacing:.24em;color:var(--on-ground);opacity:.8}
/* ---- receipt (till receipt, light, portrait) - feed-native ephemera ---- */
#cad.receipt{--h:1350px;background:var(--surface);padding:64px;display:flex;flex-direction:column;align-items:center}
#cad.receipt .paper{margin:auto 0;width:780px;background:var(--panel);padding:58px 56px 50px;box-shadow:0 30px 60px -30px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;text-align:center;box-sizing:border-box}
#cad.receipt .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:54px;height:54px;font-size:24px}
#cad.receipt .bn{color:var(--ink);font-size:23px;max-width:480px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.receipt .eyebrow{margin-top:26px;font-weight:700;font-size:18px;letter-spacing:.32em;text-transform:uppercase;color:var(--accent-text);max-width:600px}
#cad.receipt .headline{font-family:var(--hfont);font-weight:700;font-size:58px;line-height:1.04;color:var(--ink);margin-top:14px;max-width:640px}
#cad.receipt .tear{width:100%;border-top:3px dashed rgba(0,0,0,.16);margin:30px 0}
#cad.receipt .items{width:100%;display:flex;flex-direction:column;gap:18px}
#cad.receipt .ln{display:flex;align-items:baseline;justify-content:space-between;gap:16px;width:100%}
#cad.receipt .nm{font-weight:600;font-size:27px;color:var(--ink);text-align:left;max-width:500px}
#cad.receipt .pr{font-weight:700;font-size:27px;color:var(--accent-text);flex:0 0 auto;max-width:150px}
#cad.receipt .total{width:100%;display:flex;align-items:center;justify-content:space-between}
#cad.receipt .tl{font-weight:700;font-size:21px;letter-spacing:.28em;text-transform:uppercase;color:var(--muted)}
#cad.receipt .tp{font-family:var(--hfont);font-weight:700;font-size:52px;color:var(--accent-text);max-width:320px;white-space:nowrap;overflow:hidden}
#cad.receipt .bars{margin-top:32px;width:440px;height:60px;background:repeating-linear-gradient(90deg,var(--ink) 0 3px,transparent 3px 8px,var(--ink) 8px 13px,transparent 13px 16px);opacity:.85}
#cad.receipt .sub{font-size:21px;line-height:1.5;color:var(--muted);margin-top:22px;max-width:560px}
#cad.receipt .cta{margin-top:28px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 34px;border-radius:100px;max-width:560px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.receipt .url{font-size:14px;letter-spacing:.24em;color:var(--muted)}
/* ---- convo (chat reply, light) - native DM-style ad trend ---- */
#cad.convo{background:var(--surface);padding:70px 76px;display:flex;flex-direction:column}
#cad.convo .brandrow{margin-bottom:6px}
#cad.convo .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:54px;height:54px;font-size:24px}
#cad.convo .bn{color:var(--ink);font-size:22px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.convo .dot{width:12px;height:12px;border-radius:50%;background:var(--accent-text);margin-left:6px;flex:0 0 auto}
#cad.convo .on{font-size:17px;font-weight:600;color:var(--muted);max-width:220px;white-space:nowrap;overflow:hidden}
#cad.convo .day{align-self:center;margin-top:30px;background:var(--panel);border:1.5px solid rgba(0,0,0,.08);color:var(--muted);font-weight:600;font-size:16px;letter-spacing:.18em;text-transform:uppercase;padding:8px 20px;border-radius:100px;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.convo .row{display:flex;margin-top:28px}
#cad.convo .row.in{justify-content:flex-start}
#cad.convo .row.out{justify-content:flex-end}
#cad.convo .bub{max-width:760px;padding:30px 36px;border-radius:32px;box-sizing:border-box}
#cad.convo .in .bub{background:var(--panel);border:1.5px solid rgba(0,0,0,.08);border-bottom-left-radius:10px}
#cad.convo .in .bub .msg{font-size:31px;line-height:1.4;color:var(--ink);max-width:688px}
#cad.convo .out .bub{background:var(--ground);border-bottom-right-radius:10px}
#cad.convo .headline{font-family:var(--hfont);font-weight:700;font-size:44px;line-height:1.18;color:var(--on-ground);max-width:688px}
#cad.convo .headline em{color:var(--on-ground);font-style:italic;text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:7px}
#cad.convo .quick{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px;justify-content:flex-end}
#cad.convo .pill{border:1.5px solid var(--accent-text);color:var(--accent-text);font-weight:600;font-size:19px;padding:10px 20px;border-radius:100px;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.convo .replybar{margin-top:auto;display:flex;align-items:center;gap:16px;background:var(--panel);border:1.5px solid rgba(0,0,0,.1);border-radius:100px;padding:14px 16px 14px 32px}
#cad.convo .replybar .cta{flex:1;min-width:0;font-weight:600;font-size:24px;color:var(--muted);text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:800px}
#cad.convo .send{width:62px;height:62px;border-radius:50%;background:var(--accent-fill);color:var(--on-accent-fill);display:flex;align-items:center;justify-content:center;font-size:28px;flex:0 0 auto}
#cad.convo .url{margin-top:20px;align-self:center;font-size:13px;letter-spacing:.24em;color:var(--muted)}
/* ---- coverStory (magazine front cover, light, portrait) - 2026 editorial serif revival ---- */
#cad.coverStory{--h:1350px;background:var(--surface);padding:56px 60px;display:flex;flex-direction:column}
#cad.coverStory .topline{display:flex;align-items:center;justify-content:space-between;gap:16px}
#cad.coverStory .issue{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:800;font-size:16px;letter-spacing:.2em;text-transform:uppercase;padding:9px 18px;border-radius:100px;max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.coverStory .date{font-weight:600;font-size:16px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted);max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad .bmark{display:inline-block;height:46px;width:auto;max-width:420px;object-fit:contain;vertical-align:middle}
#cad.coverStory .masthead.hasmark{white-space:normal}
#cad.coverStory .masthead .bmark{height:104px;max-width:900px}
#cad.coverStory .masthead{font-family:var(--hfont);font-weight:700;font-size:112px;line-height:1;text-transform:uppercase;letter-spacing:.02em;color:var(--ink);text-align:center;margin:26px auto 0;max-width:952px;white-space:nowrap;overflow:hidden}
#cad.coverStory .cover{position:relative;margin-top:28px;flex:1 1 auto;height:auto;min-height:600px;max-height:860px;border-radius:18px;overflow:hidden;background-image:var(--img);background-size:cover;background-position:var(--fx,50%) var(--fy,50%);background-color:var(--surface-dark);opacity:var(--imgop,1);filter:hue-rotate(var(--hue,0deg))}
#cad.coverStory .cover .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,12,16,.06) 0%,rgba(10,12,16,.14) 38%,rgba(10,12,16,.52) 68%,rgba(10,12,16,.9) 100%)}
#cad.coverStory .cover .headline{position:absolute;left:48px;right:48px;bottom:42px;font-family:var(--hfont);font-weight:400;font-style:italic;font-size:76px;line-height:1.02;color:var(--ink-on-dark);max-width:856px;text-shadow:0 4px 22px rgba(0,0,0,.45)}
#cad.coverStory .cover .headline em{color:var(--accent-on-dark)}
#cad.coverStory .lines{display:flex;flex-wrap:wrap;gap:12px;margin:26px auto 0;justify-content:center;max-width:952px}
#cad.coverStory .cl{border:1.5px solid var(--muted);color:var(--muted);font-weight:600;font-size:19px;padding:9px 20px;border-radius:100px;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.coverStory .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:18px}
#cad.coverStory .bars{width:140px;height:44px;background:repeating-linear-gradient(90deg,var(--ink) 0 3px,transparent 3px 7px);opacity:.8;flex:0 0 auto}
#cad.coverStory .sub{font-size:21px;line-height:1.4;color:var(--muted);max-width:520px}
#cad.coverStory .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:21px;padding:15px 30px;border-radius:100px;white-space:nowrap;max-width:420px;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
/* ---- torn (torn-paper collage, vibrant) - 2026 mixed-media / anti-flat trend ---- */
#cad.torn{background:var(--ground);padding:58px 64px;display:flex;flex-direction:column}
#cad.torn .mono{background:var(--panel);color:var(--accent-text);font-size:24px}
#cad.torn .bn{color:var(--on-ground);font-size:22px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.torn .paper{position:relative;margin-top:46px;background:var(--panel);padding:64px 58px 84px;transform:rotate(-1.6deg);box-shadow:0 26px 60px -24px rgba(0,0,0,.4);clip-path:polygon(0 0,100% 0,100% 88%,96% 91%,91% 88.6%,86% 92%,80% 89%,74% 92.5%,68% 89.4%,61% 92%,55% 89%,48% 92.6%,42% 89.2%,36% 92%,30% 89.4%,24% 92.4%,18% 89%,12% 92%,6% 89.6%,0 92.4%)}
#cad.torn .stick{position:absolute;right:-14px;top:-162px;width:140px;max-width:140px;height:140px;border-radius:50%;background:var(--surface-dark);color:var(--ink-on-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;line-height:1.1;letter-spacing:.06em;text-transform:uppercase;transform:rotate(7deg);box-shadow:0 12px 28px -10px rgba(0,0,0,.35);text-align:center;padding:16px;box-sizing:border-box;overflow:hidden;overflow-wrap:break-word}
/* The sticker sits OUTSIDE the torn paper (audit 2026-09-30): the paper's clip-path cut it in half,
   so the proof gate hid it on every advert. It now sits above the paper's top-right corner, clear
   of it (the gate also refuses a tag laid over another shape). The wrapper carries the paper's
   old top margin. */
#cad.torn .tornwrap{position:relative;margin:auto 0}
#cad.torn .brandrow{margin-bottom:46px}
#cad.torn .tornwrap .paper{margin-top:0}
#cad.torn .tornwrap .stick{z-index:2}
#cad.torn .eyebrow{font-weight:800;font-size:19px;letter-spacing:.26em;text-transform:uppercase;color:var(--accent-text);margin-bottom:18px;max-width:600px}
#cad.torn .headline{font-family:var(--hfont);font-weight:800;font-size:84px;line-height:.98;color:var(--ink);max-width:760px}
#cad.torn .headline em{color:var(--accent-text);font-style:italic}
#cad.torn .sub{font-size:24px;line-height:1.5;color:var(--muted);margin-top:20px;max-width:700px}
#cad.torn .strip{display:flex;flex-wrap:wrap;gap:12px;margin-top:40px;max-width:900px}
/* the pills belong with the button, not floating halfway down (AUDIT 2 OCT 2026) */
#cad.torn .strip{margin-top:auto}
#cad.torn .strip + .foot{margin-top:0}
#cad.torn .pill{border:2px solid var(--on-ground);color:var(--on-ground);font-weight:700;font-size:19px;padding:9px 20px;border-radius:100px;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.torn .foot{margin-top:auto;padding-top:28px;display:flex;align-items:center;justify-content:space-between;gap:18px}
#cad.torn .cta{background:var(--panel);color:var(--accent-text);font-weight:800;font-size:22px;padding:17px 34px;border-radius:100px;white-space:nowrap;max-width:520px;overflow:hidden;text-overflow:ellipsis}
#cad.torn .url{font-size:14px;letter-spacing:.24em;color:var(--on-ground);opacity:.8;max-width:300px;white-space:nowrap;overflow:hidden}
/* ---- hook (carousel opener, dark) - 2026 carousel-resurgence / stop-the-scroll trend ---- */
#cad.hook{background:var(--surface-dark);padding:72px 76px;display:flex;flex-direction:column}
#cad.hook .peek{position:absolute;top:64px;bottom:64px;right:0;width:22px;background:rgba(255,255,255,.09);border-radius:14px 0 0 14px}
#cad.hook .toprow{display:flex;align-items:center;justify-content:space-between;gap:16px}
#cad.hook .mono{background:var(--accent-fill);color:var(--on-accent-fill);font-size:24px}
#cad.hook .bn{color:var(--ink-on-dark);font-size:21px;max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.hook .idx{font-weight:700;font-size:24px;letter-spacing:.18em;color:var(--accent-on-dark);max-width:220px;white-space:nowrap;overflow:hidden}
#cad.hook .eyebrow{margin-top:66px;font-weight:700;font-size:20px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent-on-dark);max-width:820px}
#cad.hook .headline{font-family:var(--hfont);font-weight:800;font-size:108px;line-height:.96;color:var(--ink-on-dark);margin-top:24px;max-width:880px}
#cad.hook .headline em{color:var(--accent-on-dark)}
#cad.hook .sub{font-size:25px;line-height:1.5;color:var(--ink-on-dark);opacity:.66;margin-top:26px;max-width:760px}
#cad.hook .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:18px}
#cad.hook .dots{display:flex;gap:10px;align-items:center}
#cad.hook .dots span{width:12px;height:12px;border-radius:50%;background:rgba(255,255,255,.25)}
#cad.hook .dots .on{width:34px;border-radius:7px;background:var(--accent-on-dark)}
#cad.hook .cta{display:inline-flex;align-items:center;gap:12px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 32px;border-radius:100px;white-space:nowrap;max-width:520px;overflow:hidden}
/* ---- openhouse (property launch hero, dark, portrait) ---- */
#cad.openhouse{--h:1350px;background:var(--surface-dark)}
#cad.openhouse .ph{position:absolute;inset:0;background-image:var(--img);background-size:cover;background-position:var(--fx,50%) var(--fy,50%);background-color:var(--surface-dark);opacity:var(--imgop,1);filter:hue-rotate(var(--hue,0deg))}
#cad.openhouse .scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,11,15,.5) 0%,rgba(8,11,15,.16) 26%,rgba(8,11,15,.46) 54%,rgba(8,11,15,.94) 100%)}
#cad.openhouse .brandrow{position:absolute;top:56px;left:60px;z-index:3}
#cad.openhouse .mono{background:var(--panel);color:var(--ink);width:54px;height:54px;font-size:25px}
#cad.openhouse .bn{color:var(--ink-on-dark);font-size:22px;text-shadow:0 2px 10px rgba(0,0,0,.5);max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.openhouse .flag{position:absolute;top:58px;right:60px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:800;font-size:16px;letter-spacing:.16em;text-transform:uppercase;padding:11px 20px;border-radius:100px;z-index:3;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.openhouse .block{position:absolute;left:60px;right:60px;bottom:232px;z-index:3}
#cad.openhouse .eyebrow{font-weight:600;font-size:21px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:18px;max-width:860px}
#cad.openhouse .headline{font-family:var(--hfont);font-weight:400;font-size:92px;line-height:1;color:var(--ink-on-dark);max-width:900px;text-shadow:0 4px 22px rgba(0,0,0,.5)}
#cad.openhouse .headline em{color:var(--accent-on-dark);font-style:italic}
#cad.openhouse .specs{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px;max-width:900px}
#cad.openhouse .spec{display:inline-flex;align-items:center;background:rgba(255,255,255,.14);border:1.5px solid rgba(255,255,255,.3);color:var(--ink-on-dark);font-weight:600;font-size:21px;padding:11px 22px;border-radius:100px;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.openhouse .plate{position:absolute;left:60px;right:60px;bottom:56px;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:18px;background:var(--panel);border-radius:20px;padding:26px 34px;box-sizing:border-box}
#cad.openhouse .from{font-size:20px;color:var(--muted);max-width:520px}
#cad.openhouse .from b{display:block;font-family:var(--hfont);font-weight:400;font-size:46px;color:var(--ink);max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.openhouse .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:23px;padding:17px 32px;border-radius:100px;white-space:nowrap;max-width:420px;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
/* ---- versus (comparison card, light) - 2026 comparison-carousel trend ---- */
#cad.versus{background:var(--surface);padding:64px 68px;display:flex;flex-direction:column}
#cad.versus .mono{background:var(--accent-fill);color:var(--on-accent-fill);font-size:24px}
#cad.versus .bn{color:var(--ink);font-size:22px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.versus .eyebrow{margin-top:40px;font-weight:700;font-size:19px;letter-spacing:.26em;text-transform:uppercase;color:var(--accent-text);max-width:860px}
#cad.versus .headline{font-family:var(--hfont);font-weight:700;font-size:72px;line-height:1;color:var(--ink);margin-top:14px;max-width:920px}
#cad.versus .headline em{color:var(--accent-text)}
#cad.versus .cols{display:flex;gap:24px;margin-top:auto}
#cad.versus .headline{margin-bottom:40px}
#cad.versus .col{flex:1;min-width:0;border-radius:24px;padding:36px 34px;display:flex;flex-direction:column;gap:20px}
#cad.versus .col.them{background:var(--panel);border:1.5px solid rgba(0,0,0,.08)}
#cad.versus .col.us{background:var(--ground)}
#cad.versus .tag{align-self:flex-start;font-weight:800;font-size:15px;letter-spacing:.2em;text-transform:uppercase;padding:8px 16px;border-radius:100px;max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.versus .them .tag{background:rgba(0,0,0,.07);color:var(--ink)}
#cad.versus .us .tag{background:var(--panel);color:var(--accent-text)}
#cad.versus .row{display:flex;align-items:flex-start;gap:14px;font-weight:600;font-size:24px;line-height:1.3;max-width:380px}
#cad.versus .them .row{color:var(--muted)}
#cad.versus .us .row{color:var(--on-ground)}
#cad.versus .tx{max-width:320px}
#cad.versus .xk,#cad.versus .tk{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex:0 0 auto;margin-top:-2px}
#cad.versus .xk{background:rgba(0,0,0,.09);color:var(--ink)}
#cad.versus .tk{background:var(--panel);color:var(--accent-text)}
#cad.versus .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:18px}
#cad.versus .sub{font-size:22px;line-height:1.4;color:var(--muted);max-width:520px}
#cad.versus .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:17px 34px;border-radius:100px;white-space:nowrap;max-width:460px;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
#cad.versus .url{margin-top:20px;font-size:13px;letter-spacing:.24em;color:var(--muted);max-width:300px}
/* ---- proofStack (fanned reviews, dark) - social-proof-stack carousel trend ---- */
#cad.proofStack{background:var(--surface-dark);padding:76px 84px;display:flex;flex-direction:column;align-items:center;text-align:center}
#cad.proofStack .brand{font-weight:700;font-size:22px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-on-dark);opacity:.6;max-width:700px;white-space:nowrap;overflow:hidden}
#cad.proofStack .stack{position:relative;margin-top:auto;width:820px}
#cad.proofStack .ghost{position:absolute;left:26px;right:26px;top:20px;bottom:-20px;background:var(--panel);opacity:.3;border-radius:30px;transform:rotate(-3.2deg)}
#cad.proofStack .ghost.g2{left:14px;right:14px;top:9px;bottom:-9px;opacity:.55;transform:rotate(2deg)}
#cad.proofStack .main{position:relative;background:var(--panel);border-radius:30px;padding:56px 54px;box-shadow:0 34px 80px -30px rgba(0,0,0,.6)}
#cad.proofStack .stars{color:var(--accent-text);font-size:34px;letter-spacing:7px;margin:0 auto 24px;max-width:700px}
#cad.proofStack .quote{font-family:var(--hfont);font-size:50px;line-height:1.18;color:var(--ink);max-width:700px;margin:0 auto}
#cad.proofStack .who{margin:28px auto 0;font-weight:700;font-size:22px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent-text);max-width:640px}
#cad.proofStack .count{margin-top:46px;display:inline-flex;align-items:center;gap:12px;border:1.5px solid rgba(255,255,255,.28);color:var(--ink-on-dark);font-weight:600;font-size:21px;padding:12px 26px;border-radius:100px;max-width:720px;white-space:nowrap;overflow:hidden}
#cad.proofStack .cta{margin-top:22px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 34px;border-radius:100px;max-width:560px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.proofStack .url{margin-top:auto;font-size:13px;letter-spacing:.24em;color:var(--ink-on-dark);opacity:.8;max-width:300px}
/* ---- echo (faded echo type, vibrant) - 2026 expressive-typography trend ---- */
#cad.echo{background:var(--ground);padding:64px 70px;display:flex;flex-direction:column}
#cad.echo .mono{background:var(--panel);color:var(--accent-text);font-size:24px}
#cad.echo .bn{color:var(--on-ground);font-size:22px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.echo .kicker{align-self:flex-start;margin-top:44px;background:var(--panel);color:var(--accent-text);font-weight:800;font-size:18px;letter-spacing:.24em;text-transform:uppercase;padding:12px 24px;border-radius:100px;max-width:760px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.echo .stackwrap{margin:auto 0;padding-block:20px;display:flex;flex-direction:column}
#cad.echo .gh{font-family:var(--hfont);font-weight:800;font-size:80px;line-height:1;text-transform:uppercase;color:var(--on-ground);opacity:.16;white-space:nowrap;overflow:hidden;max-width:940px;-webkit-mask-image:linear-gradient(90deg,#000 62%,transparent 96%);mask-image:linear-gradient(90deg,#000 62%,transparent 96%)}
#cad.echo .headline{font-family:var(--hfont);font-weight:800;font-size:84px;line-height:.98;text-transform:uppercase;color:var(--on-ground);max-width:940px;margin:28px 0}
#cad.echo .headline em{color:var(--em-on-ground);font-style:italic}
#cad.echo .foot{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
#cad.echo .sub{font-size:23px;line-height:1.45;color:var(--on-ground);opacity:.82;max-width:560px}
#cad.echo .cta{background:var(--panel);color:var(--accent-text);font-weight:800;font-size:22px;letter-spacing:.02em;text-transform:uppercase;padding:18px 34px;border-radius:100px;white-space:nowrap;max-width:480px;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
#cad.echo .url{margin-top:24px;font-size:13px;letter-spacing:.24em;color:var(--on-ground);opacity:.8;max-width:300px}
/* ---- mist (soft gradient field, light, portrait) - 2026 gradient-mood trend ---- */
#cad.mist{--h:1350px;background:var(--surface);padding:88px 84px;display:flex;flex-direction:column}
#cad.mist .wash{position:absolute;border-radius:50%;filter:blur(110px);pointer-events:none}
#cad.mist .w1{width:760px;height:760px;right:-240px;top:-220px;background:var(--accent);opacity:.26}
#cad.mist .w2{width:640px;height:640px;left:-220px;bottom:-180px;background:var(--accent-on-dark);opacity:.22}
#cad.mist .w3{width:420px;height:420px;right:-120px;bottom:220px;background:var(--accent);opacity:.14}
#cad.mist .brandrow{z-index:2}
#cad.mist .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:54px;height:54px;font-size:24px}
#cad.mist .bn{color:var(--ink);font-size:22px;max-width:460px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.mist .mid{margin:auto 0;z-index:2;display:flex;flex-direction:column;align-items:flex-start}
#cad.mist .eyebrow{font-weight:600;font-size:19px;letter-spacing:.34em;text-transform:uppercase;color:var(--accent-text);margin-bottom:28px;max-width:820px}
#cad.mist .headline{font-family:var(--hfont);font-weight:400;font-size:108px;line-height:1.04;color:var(--ink);max-width:900px}
#cad.mist .headline em{color:var(--accent-text);font-style:italic}
#cad.mist .sub{font-size:27px;line-height:1.55;color:var(--muted);margin-top:30px;max-width:700px}
#cad.mist .rule{width:76px;height:3px;background:var(--accent-text);margin-top:40px}
#cad.mist .pills{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px;max-width:880px;z-index:2}
#cad.mist .pill{border:1.5px solid var(--muted);color:var(--muted);font-weight:600;font-size:19px;padding:10px 22px;border-radius:100px;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.mist .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:18px;z-index:2}
#cad.mist .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:23px;padding:18px 38px;border-radius:100px;white-space:nowrap;max-width:520px;overflow:hidden;text-overflow:ellipsis}
#cad.mist .url{font-size:14px;letter-spacing:.24em;color:var(--muted);max-width:300px}
/* ---- atelier (vertical-spine editorial, light) - 2026 quiet-luxury / editorial serif revival ---- */
#cad.atelier{background:var(--surface);padding:72px 84px 80px 76px;display:flex;flex-direction:column}
#cad.atelier::before{content:'';position:absolute;inset:40px;border:1.5px solid rgba(0,0,0,.14);pointer-events:none}
#cad.atelier .brandrow{margin-left:96px}
#cad.atelier .mono{background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.atelier .bn{color:var(--ink);font-size:22px;max-width:460px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.atelier .spine{position:absolute;left:76px;bottom:112px;writing-mode:vertical-rl;transform:rotate(180deg);font-weight:700;font-size:19px;letter-spacing:.34em;text-transform:uppercase;color:var(--muted);max-height:740px;white-space:nowrap;overflow:hidden}
#cad.atelier .mid{margin:auto 0 auto 96px;display:flex;flex-direction:column;align-items:flex-start}
#cad.atelier .headline{font-family:var(--hfont);font-weight:400;font-size:96px;line-height:1.04;color:var(--ink);max-width:800px}
#cad.atelier .headline em{color:inherit;font-style:italic;text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:5px;text-underline-offset:11px}
#cad.atelier .rule{width:64px;height:4px;background:var(--accent);margin-top:36px}
#cad.atelier .sub{font-size:26px;line-height:1.55;color:var(--muted);margin:30px 0 0;max-width:640px}
#cad.atelier .foot{margin-left:96px;display:flex;align-items:center;justify-content:space-between;gap:18px}
#cad.atelier .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 34px;border-radius:100px;white-space:nowrap;max-width:520px;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
#cad.atelier .url{font-size:14px;letter-spacing:.24em;color:var(--ink);opacity:.8;max-width:300px;white-space:nowrap;overflow:hidden}
/* ---- premiere (film-poster billing block, dark) - 2026 "paused film frame" cinematic serif trend ---- */
#cad.premiere{background:var(--surface-dark);padding:72px 84px;display:flex;flex-direction:column;align-items:center;text-align:center}
#cad.premiere .rules{width:240px;height:7px;border-top:1px solid rgba(255,255,255,.5);border-bottom:1px solid rgba(255,255,255,.5);flex:0 0 auto}
#cad.premiere .brandrow{margin-top:26px}
#cad.premiere .mono{background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.premiere .bn{color:var(--ink-on-dark);font-size:22px;max-width:460px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.premiere .mid{margin:auto 0;padding-block:24px;display:flex;flex-direction:column;align-items:center}
#cad.premiere .eyebrow{font-family:'Oswald',sans-serif;font-weight:500;font-size:20px;letter-spacing:.42em;text-transform:uppercase;color:var(--accent-on-dark);max-width:840px}
#cad.premiere .headline{font-family:var(--hfont);font-weight:700;font-size:112px;line-height:.98;text-transform:uppercase;color:var(--ink-on-dark);margin-top:26px;max-width:900px}
#cad.premiere .headline em{color:var(--accent-on-dark);font-style:italic}
#cad.premiere .billing{margin-top:34px;font-family:'Oswald',sans-serif;font-weight:600;font-size:23px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink-on-dark);max-width:860px}
#cad.premiere .billing .d{color:var(--accent-on-dark);padding:0 10px}
#cad.premiere .credits{margin-top:22px;font-family:'Oswald',sans-serif;font-weight:400;font-size:16px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-on-dark);opacity:.62;line-height:1.7;max-width:720px}
#cad.premiere .datebar{margin-top:40px;border:2px solid var(--accent-on-dark);color:var(--accent-on-dark);font-family:'Oswald',sans-serif;font-weight:600;font-size:24px;letter-spacing:.3em;text-transform:uppercase;padding:14px 34px;max-width:800px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.premiere .foot{display:flex;flex-direction:column;align-items:center;gap:20px}
#cad.premiere .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 36px;border-radius:100px;white-space:nowrap;max-width:520px;overflow:hidden;text-overflow:ellipsis}
#cad.premiere .url{font-size:14px;letter-spacing:.24em;color:var(--ink-on-dark);opacity:.8;max-width:300px;white-space:nowrap;overflow:hidden}
/* ---- timetable (weekly planner rows, vibrant, portrait) - 2026 save-worthy utility trend, fitness-flavoured ---- */
#cad.timetable{--h:1350px;background:var(--ground);padding:64px 68px;display:flex;flex-direction:column}
#cad.timetable .mono{background:var(--panel);color:var(--ink)}
#cad.timetable .bn{color:var(--on-ground);font-size:22px;max-width:460px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.timetable .eyebrow{margin-top:46px;font-weight:800;font-size:20px;letter-spacing:.28em;text-transform:uppercase;color:var(--on-ground);max-width:820px}
#cad.timetable .headline{font-family:var(--hfont);font-weight:700;font-size:96px;line-height:.98;color:var(--on-ground);margin-top:18px;max-width:920px}
#cad.timetable .headline em{color:inherit;font-style:italic;text-decoration:underline;text-decoration-color:var(--em-on-ground);text-decoration-thickness:6px;text-underline-offset:10px}
#cad.timetable .list{margin-top:auto;display:flex;flex-direction:column;gap:20px}
#cad.timetable .headline{margin-bottom:44px}
#cad.timetable .foot{padding-top:28px}
#cad.timetable .row{background:var(--panel);border-radius:20px;padding:26px 30px;display:flex;align-items:center;gap:24px;box-sizing:border-box}
#cad.timetable .day{flex:0 0 auto;min-width:96px;text-align:center;box-sizing:border-box;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:800;font-size:20px;letter-spacing:.1em;text-transform:uppercase;padding:12px 20px;border-radius:12px;max-width:150px;white-space:nowrap;overflow:hidden}
#cad.timetable .cls{font-weight:700;font-size:32px;color:var(--ink);max-width:500px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.timetable .tm{margin-left:auto;font-weight:700;font-size:26px;color:var(--muted);flex:0 0 auto;max-width:170px;white-space:nowrap;overflow:hidden}
#cad.timetable .sub{font-size:24px;line-height:1.5;color:var(--on-ground);opacity:.85;margin:30px 0 0;max-width:760px}
#cad.timetable .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:18px}
#cad.timetable .cta{background:var(--panel);color:var(--ink);font-weight:800;font-size:23px;padding:18px 36px;border-radius:100px;white-space:nowrap;max-width:520px;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
#cad.timetable .url{font-size:14px;letter-spacing:.24em;color:var(--on-ground);opacity:.8;max-width:300px;white-space:nowrap;overflow:hidden}
/* ---- crest (heritage lockup, light) - 2026 warm-heritage / neo-minimal serif trend ---- */
#cad.crest{background:var(--panel);padding:70px 84px;display:flex;flex-direction:column;align-items:center;text-align:center}
#cad.crest .rules{width:520px;max-width:520px;height:9px;border-top:3px solid var(--accent);border-bottom:1px solid var(--accent);flex:0 0 auto}
#cad.crest .mono{margin-top:40px;width:74px;height:74px;border-radius:50%;background:var(--accent-fill);color:var(--on-accent-fill);font-size:32px}
#cad.crest .bn{margin-top:18px;font-weight:700;font-size:24px;letter-spacing:.22em;text-transform:uppercase;color:var(--ink);max-width:820px}
#cad.crest .eyebrow{margin-top:12px;font-weight:700;font-size:19px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted);max-width:820px}
#cad.crest .mid{margin:auto 0;padding-block:24px;display:flex;flex-direction:column;align-items:center}
#cad.crest .headline{font-family:var(--hfont);font-weight:600;font-size:100px;line-height:1.04;color:var(--ink);max-width:860px}
#cad.crest .headline em{color:inherit;font-style:italic;text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:5px;text-underline-offset:12px}
#cad.crest .gem{width:12px;height:12px;background:var(--accent);transform:rotate(45deg);margin:32px auto 0}
#cad.crest .sub{font-size:25px;line-height:1.55;color:var(--muted);margin:26px 0 0;max-width:680px}
#cad.crest .stamp{margin-top:28px;border:1.5px solid var(--muted);color:var(--muted);font-weight:700;font-size:19px;letter-spacing:.26em;text-transform:uppercase;padding:12px 26px;max-width:640px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.crest .foot{display:flex;flex-direction:column;align-items:center;gap:18px}
#cad.crest .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 36px;border-radius:100px;white-space:nowrap;max-width:520px;overflow:hidden;text-overflow:ellipsis}
#cad.crest .url{font-size:14px;letter-spacing:.24em;color:var(--ink);opacity:.8;max-width:300px;white-space:nowrap;overflow:hidden}
/* ==== 2026-09-21: four treatments from the 18 Sept weekly proof (steps, blueprint, burst, letter), approved by Daniel ==== */
/* ---- steps (numbered plan, light, portrait) - 2026 educational / save-worthy carousel trend ---- */
/* NOTE: no --accent-text anywhere in these four - the known open palette bug (BACKLOG.md,
   accent-text vs light surfaces, found 2026-08-12) makes that role fail on light accents
   like gold. New treatments use ink / muted / on-accent / accent-on-dark roles instead. */
#cad.steps{--h:1350px;background:var(--surface);padding:72px 76px;display:flex;flex-direction:column}
#cad.steps .mono{background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.steps .bn{color:var(--ink);font-size:22px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.steps .savebadge{position:absolute;top:72px;right:76px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:800;font-size:16px;letter-spacing:.18em;text-transform:uppercase;padding:11px 20px;border-radius:100px;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.steps .eyebrow{margin-top:46px;font-weight:700;font-size:19px;letter-spacing:.28em;text-transform:uppercase;color:var(--muted);max-width:820px}
#cad.steps .headline{font-family:var(--hfont);font-weight:600;font-size:88px;line-height:1.02;color:var(--ink);margin-top:16px;max-width:920px}
#cad.steps .headline em{color:inherit;font-style:italic;text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:5px;text-underline-offset:10px}
#cad.steps .list{margin-top:48px;display:flex;flex-direction:column;border-bottom:1.5px solid rgba(0,0,0,.1)}
#cad.steps .srow{display:flex;align-items:center;gap:28px;padding:30px 0;border-top:1.5px solid rgba(0,0,0,.1)}
#cad.steps .num{flex:0 0 auto;width:84px;height:84px;max-width:84px;border-radius:20px;background:var(--accent-fill);color:var(--on-accent-fill);display:flex;align-items:center;justify-content:center;font-family:var(--hfont);font-size:38px}
#cad.steps .stx{font-weight:600;font-size:33px;line-height:1.3;color:var(--ink);max-width:700px}
#cad.steps .sub{font-size:24px;line-height:1.5;color:var(--muted);margin:32px 0 0;max-width:760px}
#cad.steps .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:18px}
#cad.steps .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:23px;padding:17px 34px;border-radius:100px;white-space:nowrap;max-width:520px;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
#cad.steps .url{font-size:14px;letter-spacing:.24em;color:var(--ink);opacity:.8;max-width:300px;white-space:nowrap;overflow:hidden}
/* ---- blueprint (technical drawing, dark) - trades-flavoured, analog-utility trend ---- */
#cad.blueprint{background:var(--surface-dark);padding:70px 72px;display:flex;flex-direction:column}
#cad.blueprint .bggrid{position:absolute;inset:0;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 72px),repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,transparent 1px 72px);pointer-events:none}
#cad.blueprint .frameline{position:absolute;inset:36px;border:1.5px solid rgba(255,255,255,.22);pointer-events:none}
#cad.blueprint .brandrow{position:relative;z-index:2}
#cad.blueprint .mono{background:var(--accent-fill);color:var(--on-accent-fill)}
#cad.blueprint .bn{color:var(--ink-on-dark);font-size:22px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.blueprint .stamp{position:absolute;top:66px;right:64px;z-index:2;border:1.5px dashed rgba(255,255,255,.4);color:var(--ink-on-dark);font-weight:600;font-size:16px;letter-spacing:.22em;text-transform:uppercase;padding:12px 20px;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.blueprint .mid{margin:auto 0;position:relative;z-index:2}
#cad.blueprint .eyebrow{font-weight:600;font-size:19px;letter-spacing:.3em;text-transform:uppercase;color:var(--accent-on-dark);margin-bottom:18px;max-width:820px}
#cad.blueprint .headline{font-family:var(--hfont);font-weight:600;font-size:96px;line-height:1;color:var(--ink-on-dark);max-width:880px}
#cad.blueprint .headline em{color:var(--accent-on-dark);font-style:italic}
#cad.blueprint .dim{display:flex;align-items:center;margin-top:38px;max-width:860px}
/* A sub-line too long for the dimension label (audit 2026-09-30: it shrank to a squint between
   the rules) reads as a normal line under a plain rule instead. */
#cad.blueprint .bsub{font-size:24px;line-height:1.45;color:var(--ink-on-dark);opacity:.85;margin:22px 0 0;max-width:820px}
#cad.blueprint .dim .ln{flex:1;height:1.5px;background:rgba(255,255,255,.35);position:relative}
#cad.blueprint .dim .ln::before,#cad.blueprint .dim .ln::after{content:'';position:absolute;top:-7px;width:1.5px;height:15px;background:rgba(255,255,255,.35)}
#cad.blueprint .dim .ln::before{left:0}
#cad.blueprint .dim .ln::after{right:0}
#cad.blueprint .dim .lb{font-weight:600;font-size:20px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-on-dark);padding:0 24px;max-width:560px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
#cad.blueprint .specs{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px;max-width:880px}
#cad.blueprint .spec{border:1.5px solid rgba(255,255,255,.3);color:var(--ink-on-dark);font-weight:600;font-size:20px;padding:10px 20px;max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.blueprint .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:18px;position:relative;z-index:2}
#cad.blueprint .cta{background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:22px;padding:16px 32px;border-radius:6px;white-space:nowrap;max-width:520px;overflow:hidden;text-overflow:ellipsis;flex:0 0 auto}
#cad.blueprint .url{font-size:14px;letter-spacing:.24em;color:var(--ink-on-dark);opacity:.8;max-width:300px;white-space:nowrap;overflow:hidden}
/* ---- burst (flash-offer starburst, vibrant) - 2026 sticker / maximalist type trend ---- */
#cad.burst{background:var(--ground);padding:60px 68px;display:flex;flex-direction:column;align-items:center;text-align:center}
#cad.burst .brandrow{align-self:flex-start}
#cad.burst>*{flex-shrink:0}
#cad.burst .mono{background:var(--panel);color:var(--ink);font-size:24px}
#cad.burst .bn{color:var(--on-ground);font-size:22px;max-width:440px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.burst .headline{font-family:var(--hfont);font-weight:800;font-size:66px;line-height:1;color:var(--on-ground);margin-top:30px;max-width:880px}
#cad.burst .headline em{color:inherit;font-style:italic;text-decoration:underline;text-decoration-thickness:5px;text-underline-offset:9px}
/* AUDIT 2 OCT 2026: the star was a fixed 500px and its top point touched the headline on every
   brand. It now takes the height that is left (container units), keeps 28px clear above and below,
   and everything inside it scales with it. */
#cad.burst .boom{position:relative;margin:28px 0;width:100%;max-width:560px;flex:1 1 0;min-height:240px;max-height:560px;container-type:size;display:flex;align-items:center;justify-content:center}
#cad.burst .spike{position:absolute;left:50%;top:50%;width:70cqmin;height:70cqmin;margin:-35cqmin 0 0 -35cqmin;background:var(--panel)}
#cad.burst .s1{transform:rotate(15deg)}
#cad.burst .s2{transform:rotate(45deg)}
#cad.burst .s3{transform:rotate(75deg)}
#cad.burst .disc{position:relative;width:77cqmin;height:77cqmin;border-radius:50%;background:var(--panel);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:7cqmin;box-sizing:border-box}
#cad.burst .kick{max-width:60cqmin !important;font-weight:800;font-size:max(15px,3.6cqmin);letter-spacing:.2em;text-transform:uppercase;color:var(--ink);max-width:330px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.burst .price{font-family:var(--hfont);font-weight:800;font-size:16cqmin;color:var(--ink);margin-top:6px;max-width:62cqmin;white-space:nowrap;overflow:hidden}
#cad.burst .when{max-width:60cqmin !important;font-weight:700;font-size:max(14px,3.4cqmin);letter-spacing:.12em;text-transform:uppercase;color:var(--ink);margin-top:14px;max-width:330px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.burst .sub{font-size:23px;line-height:1.45;color:var(--on-ground);margin:0;max-width:760px}
#cad.burst .cta{margin-top:22px;background:var(--panel);color:var(--ink);font-weight:800;font-size:23px;padding:17px 36px;border-radius:100px;white-space:nowrap;max-width:560px;overflow:hidden;text-overflow:ellipsis}
#cad.burst .url{margin-top:18px;font-size:14px;letter-spacing:.24em;color:var(--on-ground);opacity:.8;max-width:300px;white-space:nowrap;overflow:hidden}
/* ---- letter (a note from the owner, light) - 2026 founder-story / authenticity trend ---- */
#cad.letter{background:var(--surface);padding:64px;display:flex;align-items:center;justify-content:center}
#cad.letter .paper{position:relative;width:860px;max-width:860px;background:var(--panel);padding:74px 72px 78px;box-shadow:0 30px 70px -30px rgba(0,0,0,.35);display:flex;flex-direction:column;align-items:center;text-align:center;box-sizing:border-box}
#cad.letter .mono{background:var(--accent-fill);color:var(--on-accent-fill);width:58px;height:58px;border-radius:50%;font-size:26px}
#cad.letter .blogo{height:70px;max-width:420px}
#cad.letter .bn{margin-top:16px;font-weight:700;font-size:20px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink);max-width:620px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.letter .rule{width:64px;height:2.5px;background:var(--accent);margin-top:26px}
#cad.letter .eyebrow{margin-top:28px;font-weight:700;font-size:17px;letter-spacing:.3em;text-transform:uppercase;color:var(--ink);max-width:640px}
#cad.letter .headline{font-family:var(--hfont);font-weight:400;font-size:64px;line-height:1.1;color:var(--ink);margin-top:20px;max-width:680px}
#cad.letter .headline em{color:inherit;font-style:italic;text-decoration:underline;text-decoration-color:var(--accent);text-decoration-thickness:4px;text-underline-offset:9px}
#cad.letter .sub{font-family:var(--hfont);font-style:italic;font-size:29px;line-height:1.6;color:var(--muted);margin:26px 0 0;max-width:640px}
#cad.letter .sig{margin-top:32px;font-family:var(--hfont);font-style:italic;font-size:34px;color:var(--ink);max-width:600px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.letter .cta{margin-top:34px;background:var(--accent-fill);color:var(--on-accent-fill);font-weight:700;font-size:21px;padding:15px 32px;border-radius:100px;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#cad.letter .url{position:absolute;bottom:28px;left:0;right:0;text-align:center;font-size:13px;letter-spacing:.24em;color:var(--ink);opacity:.8}`

// BRAND FONTS (step 3 of the premium adverts, Daniel 3 Oct 2026): the list and the rules live in
// lib/brandFonts.ts. A look whose typeface IS its design (ownFont: true below) keeps it.
// Every rule that sets a headline in --hfont gets a twin that, on an advert with a brand font, sets
// the font's weight instead of the look's.
function withBrandFontWeight(css) {
  const extra = []
  css.replace(/([^{}]+)\{([^{}]*font-family:var\(--hfont\)[^{}]*)\}/g, (m, sel) => {
    const twin = sel.replace(/\/\*[\s\S]*?\*\//g, '').split(',').map(x => x.trim()).filter(x => x.startsWith('#cad')).map(x => x.replace(/^#cad/, '#cad[data-bf]')).join(',')
    if (twin) extra.push(twin + '{font-weight:var(--hw)}')
    return m
  })
  return css + '\n' + extra.join('\n')
}
export const AD_CSS = withBrandFontWeight(AD_CSS_RAW)

export const ACCENTS = ['#3f2e1e','#6f5d3e','#835531','#9d6a40','#c89368','#dcb48c','#e8ddcb','#fffdf8'];

export const STICKER_CATS = ['Sale & badges','Arrows','Sparkle','Marks'];
export const STICKERS = {
  sale_burst: { label:'Sale burst', cat:'Sale & badges', svg:'<svg viewBox="0 0 100 100"><polygon points="50.0,1.0 60.1,12.3 74.5,7.6 77.6,22.4 92.4,25.5 87.7,39.9 99.0,50.0 87.7,60.1 92.4,74.5 77.6,77.6 74.5,92.4 60.1,87.7 50.0,99.0 39.9,87.7 25.5,92.4 22.4,77.6 7.6,74.5 12.3,60.1 1.0,50.0 12.3,39.9 7.6,25.5 22.4,22.4 25.5,7.6 39.9,12.3" fill="var(--accent-fill)"/><text x="50" y="51" text-anchor="middle" dominant-baseline="middle" fill="var(--on-accent-fill)" font-family="Oswald,sans-serif" font-weight="700" font-size="19">SALE</text></svg>' },
  new_circle: { label:'New', cat:'Sale & badges', svg:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="var(--accent-fill)"/><text x="50" y="51" text-anchor="middle" dominant-baseline="middle" fill="var(--on-accent-fill)" font-family="Oswald,sans-serif" font-weight="700" font-size="22">NEW</text></svg>' },
  offer_pill: { label:'Offer', cat:'Sale & badges', svg:'<svg viewBox="0 0 100 100"><rect x="6" y="32" width="88" height="36" rx="18" fill="#fff" stroke="var(--accent)" stroke-width="3.5"/><text x="50" y="51" text-anchor="middle" dominant-baseline="middle" fill="var(--accent-text)" font-family="Oswald,sans-serif" font-weight="700" font-size="18">OFFER</text></svg>' },
  pct: { label:'Percent', cat:'Sale & badges', svg:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="var(--accent-fill)"/><text x="50" y="53" text-anchor="middle" dominant-baseline="middle" fill="var(--on-accent-fill)" font-family="Oswald,sans-serif" font-weight="700" font-size="46">%</text></svg>' },
  arrow_block: { label:'Arrow', cat:'Arrows', svg:'<svg viewBox="0 0 100 100"><polygon points="8,40 58,40 58,24 92,50 58,76 58,60 8,60" fill="var(--accent)"/></svg>' },
  arrow_curve: { label:'Curved arrow', cat:'Arrows', svg:'<svg viewBox="0 0 100 100"><path d="M16 28 C 52 16 82 30 82 58" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round"/><polygon points="82,74 69,52 95,52" fill="var(--accent)"/></svg>' },
  arrow_circle: { label:'Loop arrow', cat:'Arrows', svg:'<svg viewBox="0 0 100 100"><path d="M76 36 A 30 30 0 1 0 80 56" fill="none" stroke="var(--accent)" stroke-width="9" stroke-linecap="round"/><polygon points="80,18 90,42 64,40" fill="var(--accent)"/></svg>' },
  star: { label:'Star', cat:'Sparkle', svg:'<svg viewBox="0 0 100 100"><polygon points="50.0,4.0 61.2,34.6 93.7,35.8 68.1,55.9 77.0,87.2 50.0,69.0 23.0,87.2 31.9,55.9 6.3,35.8 38.8,34.6" fill="#f4b740"/></svg>' },
  sparkle: { label:'Sparkle', cat:'Sparkle', svg:'<svg viewBox="0 0 100 100"><polygon points="50.0,2.0 59.2,40.8 98.0,50.0 59.2,59.2 50.0,98.0 40.8,59.2 2.0,50.0 40.8,40.8" fill="#f4b740"/></svg>' },
  rating: { label:'5 stars', cat:'Sparkle', svg:'<svg viewBox="0 0 100 100"><polygon points="14.0,41.0 16.1,47.1 22.6,47.2 17.4,51.1 19.3,57.3 14.0,53.6 8.7,57.3 10.6,51.1 5.4,47.2 11.9,47.1" fill="#f4b740"/><polygon points="32.0,41.0 34.1,47.1 40.6,47.2 35.4,51.1 37.3,57.3 32.0,53.6 26.7,57.3 28.6,51.1 23.4,47.2 29.9,47.1" fill="#f4b740"/><polygon points="50.0,41.0 52.1,47.1 58.6,47.2 53.4,51.1 55.3,57.3 50.0,53.6 44.7,57.3 46.6,51.1 41.4,47.2 47.9,47.1" fill="#f4b740"/><polygon points="68.0,41.0 70.1,47.1 76.6,47.2 71.4,51.1 73.3,57.3 68.0,53.6 62.7,57.3 64.6,51.1 59.4,47.2 65.9,47.1" fill="#f4b740"/><polygon points="86.0,41.0 88.1,47.1 94.6,47.2 89.4,51.1 91.3,57.3 86.0,53.6 80.7,57.3 82.6,51.1 77.4,47.2 83.9,47.1" fill="#f4b740"/></svg>' },
  check: { label:'Tick', cat:'Marks', svg:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="var(--accent-fill)"/><path d="M32 51 L45 64 L70 37" fill="none" stroke="var(--on-accent-fill)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  heart: { label:'Heart', cat:'Marks', svg:'<svg viewBox="0 0 100 100"><path d="M50 82 C 12 56 18 24 40 24 C 48 24 50 31 50 35 C 50 31 52 24 60 24 C 82 24 88 56 50 82 Z" fill="#e8554e"/></svg>' },
  bubble: { label:'Speech', cat:'Marks', svg:'<svg viewBox="0 0 100 100"><path d="M20 18 H80 a10 10 0 0 1 10 10 V58 a10 10 0 0 1 -10 10 H44 L28 86 V68 H20 a10 10 0 0 1 -10 -10 V28 a10 10 0 0 1 10 -10 Z" fill="#fff" stroke="var(--accent)" stroke-width="3.5" stroke-linejoin="round"/></svg>' },
  pin: { label:'Location', cat:'Marks', svg:'<svg viewBox="0 0 100 100"><path d="M50 12 C 32 12 20 26 20 42 C 20 64 50 88 50 88 C 50 88 80 64 80 42 C 80 26 68 12 50 12 Z" fill="var(--accent)"/><circle cx="50" cy="42" r="12" fill="#fff"/></svg>' },
  bolt: { label:'Bolt', cat:'Marks', svg:'<svg viewBox="0 0 100 100"><polygon points="54,8 26,56 45,56 40,92 76,40 54,40" fill="#f4b740"/></svg>' },
  leaf: { label:'Leaf', cat:'Marks', svg:'<svg viewBox="0 0 100 100"><path d="M80 20 C 40 20 22 48 24 82 C 58 84 84 60 80 20 Z" fill="#5aa469"/><path d="M32 76 C 46 56 62 40 74 28" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.85"/></svg>' },
  sun: { label:'Sun', cat:'Marks', svg:'<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="#f4b740"/><line x1="84.0" y1="50.0" x2="96.0" y2="50.0" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/><line x1="74.0" y1="74.0" x2="82.5" y2="82.5" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/><line x1="50.0" y1="84.0" x2="50.0" y2="96.0" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/><line x1="26.0" y1="74.0" x2="17.5" y2="82.5" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/><line x1="16.0" y1="50.0" x2="4.0" y2="50.0" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/><line x1="26.0" y1="26.0" x2="17.5" y2="17.5" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/><line x1="50.0" y1="16.0" x2="50.0" y2="4.0" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/><line x1="74.0" y1="26.0" x2="82.5" y2="17.5" stroke="#f4b740" stroke-width="6" stroke-linecap="round"/></svg>' },
};

// AUDIT 2 OCT 2026: list items are split on | or new lines. Commas split only when neither is
// present (the model sometimes writes "a, b, c"), so an item with a comma inside stays whole.
export function listOf(v){ const t = String(v || ''); const parts = /[|\n]/.test(t) ? t.split(/\s*[|\n]\s*/) : t.split(/\s*,\s*/); return parts.map(x => x.trim()).filter(Boolean) }
const tagBadge = b => b ? `<div class="tagbadge">${b}</div>` : ''
// Every item carries its own dot (AUDIT 2 OCT 2026): with dots BETWEEN items a wrapped row ended on
// a dangling dot ("POSTS ITSELF *" / "LEARNS WHAT WORKS").
const tagList = c => c ? `<div class="taglist">${listOf(c).map(t => `<span class="ti"><span class="d"></span>${t}</span>`).join('')}</div>` : ''

// ONLY WHAT IS TRUE (Daniel, 2026-09-30: stars and the receipt "Total" only when real).
// Stars appear only when the advert carries a real rating (p.rating, 1-5, read by the studio from
// the brief or the copy - "4.9 from 300 reviews", "5-star"); never a decorative five.
const STAR_CHAR = '&#9733;'
const starRow = (p, cls = 'stars') => {
  const r = Number(p && p.rating)
  if (!(r >= 1 && r <= 5)) return ''
  return `<div class="${cls}">${STAR_CHAR.repeat(Math.round(r))}</div>`
}
// The brand's mark where a name would go: the name, else the logo, else nothing - never
// "creslo.ai" standing in for somebody else's business.
const brandMark = (p, cls = 'brand') => p && p.name ? `<div class="${cls}">${p.name}</div>` : (p && p.logo ? `<div class="${cls} hasmark"><img class="bmark" src="${p.logo}" alt=""></div>` : '')

// LOOK RULE 4 - fit: the most words this look's headline, sub-line and eyebrow hold at full size
// (null = the look does not show that line). Measured by `node scripts/ad-gate.mjs --fit`: the
// largest count that still passes the proof with no part hidden, at most one size step down, the
// headline on 4 lines or fewer (5 on a 1350 look), never above the copy laws (9 / 14 / 4). Sent to
// the copywriter with every request for this look, so it writes copy the design can hold.
// npm run check fails a look without it, and a new look without trial: true (LOOK RULE 5, below).
// need: the parts a list or number look is built around (Compare's two sides, a menu's rows, the
// big number). The proof pulls the advert when they come out empty - an empty "old way" box went
// out in the art-director trial (2 Oct 2026), because Ad Studio never told the proof which part
// that was. auto:false keeps a look out of Auto sets (it stays in Edit by hand).
export const TREATMENTS = {
  cinematic: { label:'Cinematic', note:'Full-bleed, dramatic', ratio:1080, font:"'Oswald',sans-serif", mood:'dark', fit:{headline:8,sub:null,eyebrow:4},
    render:p=>`<div class="layer img"></div><div class="layer scrim"></div><div class="edge"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      
      <div class="block">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  editorial: { label:'Editorial', note:'Magazine side-panel', ratio:1080, font:"'Fraunces',serif", mood:'light', fit:{headline:4,sub:13,eyebrow:4},
    render:p=>`<div class="split"><div class="ph"></div><div class="pane">
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      ${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}${p.sub?`<p class="sub">${p.sub}</p>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}
      <div class="url">creslo.ai</div></div></div>` },
  card: { label:'Listing card', note:'Clean, structured', ratio:1080, font:"'DM Serif Display',serif", mood:'light', fit:{headline:6,sub:14,eyebrow:null},
    render:p=>`<div class="pad"><div class="top">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}${p.badge?`<div class="badge">${p.badge}</div>`:''}</div>
      <div class="photo"></div><h2 class="headline">${p.headline}</h2>
      ${p.chips?`<div class="chips">${p.chips.split(',').map(c=>c.trim()).filter(Boolean).join('<span class="d"></span>')}</div>`:''}
      <div class="foot"><span class="sub">${p.sub||''}</span>${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div></div>` },
  banner: { label:'Bold banner', note:'Strong, trades', ratio:1080, font:"'Oswald',sans-serif", mood:'dark', fit:{headline:4,sub:13,eyebrow:4},
    render:p=>`<div class="layer img"></div><div class="hazard"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="bottom">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}
      <div class="arow"><span class="sub">${p.sub||''}</span>${p.cta?`<div class="cta">${p.cta}</div>`:''}</div></div>
      <div class="url">creslo.ai</div>` },
  frosted: { label:'Frosted glass', note:'Spa, calm', ratio:1080, font:"'DM Serif Display',serif", mood:'light', fit:{headline:9,sub:14,eyebrow:4},
    render:p=>`<div class="layer img"></div><div class="layer veil"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="glass">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}${p.sub?`<p class="sub">${p.sub}</p>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  twotone: { label:'Two-tone', note:'Hair, beauty', ratio:1080, font:"'Fraunces',serif", mood:'light', fit:{headline:4,sub:14,eyebrow:4},
    render:p=>`<div class="ph"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="pane">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}${p.sub?`<p class="sub">${p.sub}</p>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>` },
  diagonal: { label:'Diagonal cut', note:'Fitness, energy', ratio:1080, font:"'Oswald',sans-serif", mood:'dark', fit:{headline:8,sub:null,eyebrow:4},
    render:p=>`<div class="layer img"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="block">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  postcard: { label:'Airy postcard', note:'Hospitality', ratio:1350, font:"'DM Serif Display',serif", mood:'light', fit:{headline:9,sub:null,eyebrow:4},
    render:p=>`<div class="pic"></div><div class="scrim"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="block">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  duotone: { label:'Duotone', note:'Events, bold', ratio:1080, font:"'Syne',sans-serif", mood:'vibrant', fit:{headline:4,sub:null,eyebrow:4},
    render:p=>`<div class="layer img"></div><div class="duo"></div><div class="duo2"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="block">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  spotlight: { label:'Spotlight', note:'Retail, product', ratio:1080, font:"'DM Serif Display',serif", mood:'vibrant', fit:{headline:9,sub:null,eyebrow:4},
    render:p=>`<div class="disc"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="block">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${tagList(p.chips)}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  cutout: { label:'Cut-out', note:'Your product, cut out', ratio:1080, font:"'DM Serif Display',serif", mood:'vibrant', trial:true, fit:{headline:6,sub:14,eyebrow:4},
    render:p=>`<div class="halo"></div><div class="pic"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:''}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="block">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.sub?`<div class="sub">${p.sub}</div>`:''}${tagList(p.chips)}${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  menu: { label:'Menu board', note:'Food: items + prices', ratio:1350, mood:'light', font:"'DM Serif Display',serif", fit:{headline:9,sub:null,eyebrow:4}, need:['.rows .mr'],
    render:p=>{
      const items=listOf(p.items||p.chips)
      const rows=items.map(it=>{const sp=it.lastIndexOf(' ');const last=sp>=0?it.slice(sp+1):'';const hasPr=/\d/.test(last);const nm=hasPr?it.slice(0,sp):it;const pr=hasPr?last:'';return `<div class="mr"><div class="line"><span class="nm">${emph(nm)}</span><span class="dots"></span>${pr?`<span class="pr">${emph(pr)}</span>`:''}</div></div>`}).join('')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="eyebrow">${p.eyebrow}</div><h2 class="title">${p.headline}</h2><div class="rows">${rows}</div>
      <div class="foot">${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:'<span></span>'}<div class="url">creslo.ai</div></div>`
    } },
  dish: { label:'Dish hero', note:'Food: full-bleed dish', ratio:1080, mood:'dark', font:"'DM Serif Display',serif", fit:{headline:9,sub:null,eyebrow:4},
    render:p=>`<div class="ph"></div><div class="scrim"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      ${(p.price||p.badge)?`<div class="stamp">${p.price||p.badge}</div>`:''}
      <div class="block"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  chalk: { label:'Chalkboard', note:'Food: daily special', ratio:1080, mood:'dark', font:"'DM Serif Display',serif", fit:{headline:9,sub:14,eyebrow:4},
    render:p=>`<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="mid"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.sub?`<p class="sub">${p.sub}</p>`:''}${(p.price||p.badge)?`<div class="price">${p.price||p.badge}</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  stay: { label:'Stay card', note:'Hospitality: book a stay', ratio:1080, mood:'light', font:"'DM Serif Display',serif", fit:{headline:9,sub:null,eyebrow:4},
    render:p=>{
      const facts=listOf(p.chips)
      const chips=facts.map(f=>`<span class="ch"><span class="d"></span>${emph(f)}</span>`).join('')
      return `<div class="ph"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="pane"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2><div class="facts">${chips}</div>
      <div class="foot">${(p.price||p.sub)?`<div class="from">From<b>${p.price||p.sub}</b></div>`:'<span></span>'}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div></div>`
    } },
  suite: { label:'Suite editorial', note:'Hospitality: rooms', ratio:1080, mood:'light', font:"'DM Serif Display',serif", fit:{headline:4,sub:null,eyebrow:4},
    render:p=>{
      const star='<svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2l3 6.3 6.9 1-5 4.8 1.2 6.9L12 17.8 5.9 21l1.2-6.9-5-4.8 6.9-1z"></path></svg>'
      const amen=listOf(p.chips).map(a=>`<div><span class="tk">&#10003;</span> ${emph(a)}</div>`).join('')
      return `<div class="ph"></div><div class="pane">
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${(Number(p.rating) >= 1 && Number(p.rating) <= 5) ? `<div class="stars">${star.repeat(Math.round(Number(p.rating)))}</div>` : ''}<div class="amen">${amen}</div>
      <div class="foot">${(p.price||p.sub)?`<div class="from">From<b>${p.price||p.sub}</b></div>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div></div>`
    } },
  escape: { label:'Escape postcard', note:'Hospitality: aspirational', ratio:1350, mood:'dark', font:"'DM Serif Display',serif", fit:{headline:9,sub:14,eyebrow:4},
    render:p=>`<div class="pic"></div><div class="scrim"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="block"><div class="pin"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"></path><circle cx="12" cy="10" r="2.5"></circle></svg>${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.sub?`<div class="dates">${p.sub}</div>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  checklist: { label:'Service list', note:'Services: what is included', ratio:1350, mood:'light', font:"'DM Serif Display',serif", fit:{headline:9,sub:null,eyebrow:4}, need:['.list .row'],
    render:p=>{
      const items=listOf(p.items)
      const rows=items.map(it=>`<div class="row"><span class="tk">&#10003;</span> ${emph(it)}</div>`).join('')
      const trust=listOf(p.chips).map(t=>`<span class="t"><span class="d"></span> ${emph(t)}</span>`).join('')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>
      <div class="list">${rows}</div>
      ${trust?`<div class="trust">${trust}</div>`:''}
      <div class="foot">${p.price?`<div class="from">From <b>${p.price}</b></div>`:'<span></span>'}${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>`
    } },
  quote: { label:'Quote banner', note:'Services: trust + CTA', ratio:1080, mood:'dark', font:"'DM Serif Display',serif", fit:{headline:9,sub:null,eyebrow:4},
    render:p=>{
      const trust=listOf(p.chips).map(t=>`<span class="t"><span class="tk">&#10003;</span> ${emph(t)}</span>`).join('')
      return `<div class="pic"></div><div class="scrim"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="block"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>
      ${trust?`<div class="trust">${trust}</div>`:''}`
    } },
  beforeafter: { label:'Before / after', note:'Services: proof', ratio:1080, font:"'DM Serif Display',serif", concept:'beforeafter', mood:'dark', fit:{headline:9,sub:null,eyebrow:null},
    render:p=>`<div class="half before"></div><div class="half after"></div><div class="divide"></div><div class="knob">&rarr;</div>
      <span class="tag l">BEFORE</span><span class="tag r">AFTER</span>
      <div class="scrim"></div>
      <div class="block"><div>${p.logo?`<img class="bamark" src="${p.logo}" alt="">`:(p.name?`<div class="bn">${p.name}</div>`:'')}<h2 class="headline">${p.headline}</h2></div>${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  baReveal: { label:'Reveal slider', note:'Before/after: slider', ratio:1080, font:"'DM Serif Display',serif", concept:'beforeafter', mood:'dark', fit:{headline:3,sub:null,eyebrow:4},
    render:p=>`<div class="half before"></div><div class="half after"></div><div class="seam"></div><div class="knob">&rarr;</div><span class="tag l">BEFORE</span><span class="tag r">AFTER</span><div class="scrim"></div><div class="block">${p.logo?`<img class="bamark" src="${p.logo}" alt="">`:(p.name?`<div class="bn">${p.name}</div>`:'')}${p.eyebrow?`<div class="eyebrow">${p.eyebrow}</div>`:''}<h2 class="headline">${p.headline}</h2>${p.cta?`<div class="cta">${p.cta}</div>`:''}</div><div class="url">creslo.ai</div>` },
  baStack: { label:'Stacked', note:'Before/after: stacked', ratio:1350, font:"'DM Serif Display',serif", concept:'beforeafter', mood:'light', fit:{headline:9,sub:null,eyebrow:null},
    render:p=>`<div class="pane top"></div><div class="pane bot"></div><div class="seam"></div><span class="chip t">BEFORE</span><span class="chip b">AFTER</span><div class="plate"><h2 class="headline">${p.headline}</h2></div><div class="foot">${p.name?`<div class="bn">${p.name}</div>`:(p.logo?`<img class="blogo" src="${p.logo}" alt="">`:'')}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>` },
  baDiagonal: { label:'Diagonal', note:'Before/after: diagonal', ratio:1080, font:"'DM Serif Display',serif", concept:'beforeafter', mood:'dark', fit:{headline:4,sub:null,eyebrow:null},
    render:p=>`<div class="before"></div><div class="after"></div><div class="seam"></div><span class="tag l">BEFORE</span><span class="tag r">AFTER</span><div class="scrim"></div><div class="block">${p.logo?`<img class="bamark" src="${p.logo}" alt="">`:(p.name?`<div class="bn">${p.name}</div>`:'')}<h2 class="headline">${p.headline}</h2>${p.cta?`<div class="cta">${p.cta}</div>`:''}</div><div class="url">creslo.ai</div>` },
  baInset: { label:'Inset reveal', note:'Before/after: inset', ratio:1080, font:"'DM Serif Display',serif", concept:'beforeafter', mood:'dark', fit:{headline:9,sub:null,eyebrow:null},
    render:p=>`<div class="after"></div><div class="scrim"></div><div class="inset"></div><span class="insetlbl">BEFORE</span><span class="aftlbl">AFTER</span><div class="block">${p.logo?`<img class="bamark" src="${p.logo}" alt="">`:(p.name?`<div class="bn">${p.name}</div>`:'')}<h2 class="headline">${p.headline}</h2>${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>` },
  baFilmstrip: { label:'Filmstrip', note:'Before/after: panels', ratio:1350, font:"'DM Serif Display',serif", concept:'beforeafter', mood:'light', fit:{headline:9,sub:null,eyebrow:null},
    render:p=>`<div class="brand">${p.logo?`<img class="blogo" src="${p.logo}" alt="">`:`<span class="mono">${p.initials}</span>`}${p.name?`<span class="bn">${p.name}</span>`:''}</div><div class="panels"><div class="card b"><div class="ph"></div><div class="lbl">Before</div></div><div class="card a"><div class="ph"></div><div class="lbl">After</div></div></div><div class="foot"><h2 class="headline">${p.headline}</h2>${p.cta?`<div class="cta">${p.cta}</div>`:''}</div><div class="url">creslo.ai</div>` },
  tmQuote: { label:'Quote', note:'Testimonial: editorial', ratio:1080, font:"'DM Serif Display',serif", concept:'testimonial', mood:'light', fit:{headline:9,sub:14,eyebrow:null},
    render:p=>`${brandMark(p)}${starRow(p)}<div class="quote">&ldquo;${p.headline}&rdquo;</div>${p.sub?`<div class="who">${p.sub}</div>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}` },
  tmCard: { label:'Review card', note:'Testimonial: card', ratio:1080, font:"'DM Serif Display',serif", concept:'testimonial', mood:'dark', fit:{headline:9,sub:14,eyebrow:null},
    render:p=>`<div class="card"><div class="rowt"><div class="av">${p.initials}</div><div><div class="nm">${p.sub||p.name||'Client'}</div>${starRow(p)}</div></div><div class="quote">${p.headline}</div></div>${brandMark(p)}` },
  tmSplit: { label:'Photo review', note:'Testimonial: photo', ratio:1080, font:"'DM Serif Display',serif", concept:'testimonial', mood:'light', fit:{headline:9,sub:14,eyebrow:4},
    render:p=>`<div class="ph"></div><div class="pane">${brandMark(p)}<div class="eyebrow">${p.eyebrow||'Client review'}</div>${starRow(p)}<div class="quote">${p.headline}</div>${p.sub?`<div class="who">${p.sub}</div>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>` },
  tmStars: { label:'Bold stars', note:'Testimonial: bold', ratio:1350, font:"'DM Serif Display',serif", concept:'testimonial', mood:'dark', fit:{headline:9,sub:14,eyebrow:null},
    render:p=>`${brandMark(p)}${starRow(p)}<div class="quote">${starRow(p) ? '' : '<span class="qmark">&ldquo;</span>'}${p.headline}</div>${p.sub?`<div class="who">${p.sub}</div>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}` },
  tmBubble: { label:'Speech bubble', note:'Testimonial: bubble', ratio:1080, font:"'DM Serif Display',serif", concept:'testimonial', mood:'vibrant', fit:{headline:9,sub:14,eyebrow:null},
    render:p=>`${brandMark(p)}<div class="bub">${starRow(p)}<div class="quote">${p.headline}</div></div>${p.sub?`<div class="who">${p.sub}</div>`:''}` },
  bento: { label:'Bento grid', note:'Modular tiles, structured', ratio:1080, mood:'light', font:"'Space Grotesk',sans-serif", fit:{headline:9,sub:14,eyebrow:4},
    render:p=>{
      const chips=listOf(p.chips).map(c=>`<span class="pill">${emph(c)}</span>`).join('')
      return `<div class="tile t-brand">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="tile t-photo">${p.badge?`<span class="pbadge">${p.badge}</span>`:''}</div>
      <div class="tile t-eye"><div class="eyebrow">${p.eyebrow}</div>${p.sub?`<p class="sub">${p.sub}</p>`:''}</div>
      <div class="tile t-head"><h2 class="headline">${p.headline}</h2></div>
      <div class="tile t-chips">${chips||'<span></span>'}</div>
      <div class="tile t-cta">${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>`
    } },
  poster: { label:'Type poster', note:'Oversized type, loud', ratio:1080, mood:'vibrant', font:"'Syne',sans-serif", ownFont:true, fit:{headline:4,sub:14,eyebrow:4},
    render:p=>{
      const tick=listOf(p.chips).join(' <span class="d">&middot;</span> ')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      ${p.eyebrow?`<div class="kicker">${p.eyebrow}</div>`:''}
      <h2 class="headline">${p.headline}</h2>
      ${tick?`<div class="ticker">${tick}</div>`:''}
      <div class="foot">${p.sub?`<span class="sub">${p.sub}</span>`:'<span></span>'}${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>`
    } },
  stat: { label:'Big stat', note:'Number-led proof', ratio:1080, mood:'dark', font:"'Sora',sans-serif", ownFont:true, fit:{headline:9,sub:14,eyebrow:4}, need:['.big'],
    render:p=>`<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="eyebrow">${p.eyebrow}</div>
      <div class="big">${p.price||p.badge||''}</div>
      <div class="bars"><span class="b1"></span><span class="b2"></span><span class="b3"></span><span class="b4"></span></div>
      <h2 class="headline">${p.headline}</h2>
      ${p.sub?`<p class="sub">${p.sub}</p>`:''}
      <div class="foot">${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:'<span></span>'}<div class="url">creslo.ai</div></div>` },
  snapshot: { label:'Snapshot', note:'Polaroid scrapbook, UGC feel', ratio:1350, mood:'light', font:"'Cormorant Garamond',serif", fit:{headline:9,sub:14,eyebrow:4},
    render:p=>{
      const chips=listOf(p.chips).map(c=>`<span class="pill">${emph(c)}</span>`).join('')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="frame"><div class="ph"></div>${p.badge?`<span class="stick">${p.badge}</span>`:''}${p.eyebrow?`<div class="cap">${p.eyebrow}</div>`:''}</div>
      <h2 class="headline">${p.headline}</h2>
      ${p.sub?`<p class="sub">${p.sub}</p>`:''}
      ${chips?`<div class="chips">${chips}</div>`:''}
      ${p.cta?`<div class="cta">${p.cta}</div>`:''}`
    } },
  aura: { label:'Aura glow', note:'Atmospheric gradient calm', ratio:1080, mood:'dark', font:"'Playfair Display',serif", fit:{headline:8,sub:14,eyebrow:4},
    render:p=>`<div class="glow g1"></div><div class="glow g2"></div><div class="glow g3"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="mid">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.sub?`<p class="sub">${p.sub}</p>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  ticket: { label:'Event ticket', note:'Events: admit one', ratio:1080, mood:'vibrant', font:"'Space Grotesk',sans-serif", fit:{headline:8,sub:14,eyebrow:4},
    render:p=>{
      const pills=listOf(p.chips).map(c=>`<span class="pill">${emph(c)}</span>`).join('')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="tik"><span class="notch n1"></span><span class="notch n2"></span>
        <div class="main"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.sub?`<p class="sub">${p.sub}</p>`:''}${pills?`<div class="meta">${pills}</div>`:''}</div>
        <div class="perf"></div>
        <div class="stub">${p.badge?`<div class="badge">${p.badge}</div>`:''}${p.price?`<div class="price">${p.price}</div>`:''}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div></div>
      <div class="url">creslo.ai</div>`
    } },
  receipt: { label:'Receipt', note:'Food and retail: the order', ratio:1350, mood:'light', font:"'Space Grotesk',sans-serif", fit:{headline:9,sub:14,eyebrow:4}, need:['.items .ln'],
    render:p=>{
      const items=listOf(p.items||p.chips)
      const rows=items.map(it=>{const sp=it.lastIndexOf(' ');const last=sp>=0?it.slice(sp+1):'';const hasPr=/\d/.test(last);const nm=hasPr?it.slice(0,sp):it;const pr=hasPr?last:'';return `<div class="ln"><span class="nm">${emph(nm)}</span>${pr?`<span class="pr">${emph(pr)}</span>`:''}</div>`}).join('')
      return `<div class="paper">
        <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
        ${p.badge?`<div class="tagbadge" style="margin-top:22px;margin-bottom:0">${p.badge}</div>`:''}
        <div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>
        <div class="tear"></div><div class="items">${rows}</div><div class="tear"></div>
        ${(() => {
          // "Total" only when the prices listed really add up to it (2026-09-30).
          if (!p.price) return ''
          const num = (v) => { const m = String(v || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : NaN }
          const prices = items.map(it => { const sp = it.lastIndexOf(' '); return sp >= 0 ? num(it.slice(sp + 1)) : NaN }).filter(n => !isNaN(n))
          const sum = prices.reduce((a, b) => a + b, 0)
          return prices.length >= 2 && Math.abs(sum - num(p.price)) < 0.005 ? `<div class="total"><span class="tl">Total</span><span class="tp">${p.price}</span></div>` : ''
        })()}
        <div class="bars"></div>
        ${p.sub?`<p class="sub">${p.sub}</p>`:''}
        ${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>
      <div class="url">creslo.ai</div>`
    } },
  convo: { label:'Chat reply', note:'DM-style, feed-native', ratio:1080, mood:'light', font:"'Inter',sans-serif", fit:{headline:9,sub:14,eyebrow:4},
    render:p=>{
      const quick=listOf(p.chips).map(c=>`<span class="pill">${emph(c)}</span>`).join('')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}<span class="dot"></span><span class="on">Online now</span></div>
      <div class="day">${p.eyebrow||'Today'}</div>
      ${p.sub?`<div class="row in"><div class="bub"><div class="msg">${p.sub}</div></div></div>`:''}
      <div class="row out"><div class="bub"><h2 class="headline">${p.headline}</h2></div></div>
      ${quick?`<div class="quick">${quick}</div>`:''}
      ${p.cta?`<div class="replybar"><span class="cta">${p.cta}</span><span class="send">&rarr;</span></div>`:''}
      <div class="url">creslo.ai</div>`
    } },
  coverStory: { label:'Cover story', note:'Magazine front cover', ratio:1350, mood:'light', font:"'Fraunces',serif", fit:{headline:9,sub:14,eyebrow:4},
    render:p=>{
      const lines=listOf(p.chips).map(c=>`<span class="cl">${emph(c)}</span>`).join('')
      return `<div class="topline">${p.badge?`<div class="issue">${p.badge}</div>`:'<span></span>'}<div class="date">${p.eyebrow}</div></div>
      ${p.name ? `<div class="masthead">${p.name}</div>` : (p.logo ? `<div class="masthead hasmark"><img class="bmark" src="${p.logo}" alt=""></div>` : '<div class="masthead"></div>')}
      <div class="cover"><div class="scrim"></div><h2 class="headline">${p.headline}</h2></div>
      ${lines?`<div class="lines">${lines}</div>`:''}
      <div class="foot"><div class="bars"></div>${p.sub?`<span class="sub">${p.sub}</span>`:'<span></span>'}${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>`
    } },
  torn: { label:'Torn paper', note:'Collage, hands-on', ratio:1080, mood:'vibrant', font:"'Syne',sans-serif", fit:{headline:4,sub:14,eyebrow:4},
    render:p=>{
      const pills=listOf(p.chips).map(c=>`<span class="pill">${emph(c)}</span>`).join('')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="tornwrap"><div class="paper"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.sub?`<p class="sub">${p.sub}</p>`:''}</div>${p.badge?`<span class="stick">${p.badge}</span>`:''}</div>
      ${pills?`<div class="strip">${pills}</div>`:''}
      <div class="foot">${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:'<span></span>'}<div class="url">creslo.ai</div></div>`
    } },
  hook: { label:'Swipe hook', note:'Carousel opener', ratio:1080, mood:'dark', font:"'Sora',sans-serif", fit:{headline:6,sub:14,eyebrow:4}, auto:false,
    render:p=>`<div class="peek"></div>
      <div class="toprow"><div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div><div class="idx">${p.badge||'01 / 05'}</div></div>
      <div class="eyebrow">${p.eyebrow}</div>
      <h2 class="headline">${p.headline}</h2>
      ${p.sub?`<p class="sub">${p.sub}</p>`:''}
      <div class="foot"><div class="dots"><span class="on"></span><span></span><span></span><span></span></div>${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>` },
  openhouse: { label:'Open house', note:'Property: launch hero', ratio:1350, mood:'dark', font:"'Playfair Display',serif", fit:{headline:9,sub:null,eyebrow:4},
    render:p=>{
      const specs=listOf(p.chips).map(c=>`<span class="spec">${emph(c)}</span>`).join('')
      return `<div class="ph"></div><div class="scrim"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      ${p.badge?`<div class="flag">${p.badge}</div>`:''}
      <div class="block"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${specs?`<div class="specs">${specs}</div>`:''}</div>
      <div class="plate">${(p.price||p.sub)?`<div class="from">Guide price<b>${p.price||p.sub}</b></div>`:'<span></span>'}${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>`
    } },
  versus: { label:'Compare card', note:'Old way vs your way', ratio:1080, mood:'light', font:"'Space Grotesk',sans-serif", fit:{headline:9,sub:14,eyebrow:4}, need:['.them .row','.us .row'],
    render:p=>{
      const them=listOf(p.items).map(t=>`<div class="row"><span class="xk">&#10007;</span><span class="tx">${emph(t)}</span></div>`).join('')
      const us=listOf(p.chips).map(t=>`<div class="row"><span class="tk">&#10003;</span><span class="tx">${emph(t)}</span></div>`).join('')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>
      <div class="cols"><div class="col them"><span class="tag">The old way</span>${them}</div><div class="col us"><span class="tag">With us</span>${us}</div></div>
      <div class="foot">${p.sub?`<span class="sub">${p.sub}</span>`:'<span></span>'}${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>
      <div class="url">creslo.ai</div>`
    } },
  proofStack: { label:'Proof stack', note:'Testimonial: stacked reviews', ratio:1080, mood:'dark', font:"'DM Serif Display',serif", concept:'testimonial', fit:{headline:9,sub:14,eyebrow:4},
    render:p=>`${brandMark(p)}
      <div class="stack"><div class="ghost"></div><div class="ghost g2"></div><div class="main">${starRow(p)}<div class="quote">${p.headline}</div>${p.sub?`<div class="who">${p.sub}</div>`:''}</div></div>
      ${p.eyebrow?`<div class="count">${p.eyebrow}</div>`:''}
      ${p.cta?`<div class="cta">${p.cta}</div>`:''}
      <div class="url">creslo.ai</div>` },
  echo: { label:'Echo type', note:'Faded echo headline, loud', ratio:1080, mood:'vibrant', font:"'Syne',sans-serif", fit:{headline:4,sub:14,eyebrow:4},
    render:p=>`<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      ${p.eyebrow?`<div class="kicker">${p.eyebrow}</div>`:''}
      ${(() => { const long = String(p.headline || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length > 6; return long ? `<div class="stackwrap"><h2 class="headline">${p.headline}</h2></div>` : `<div class="stackwrap"><div class="gh">${p.headline}</div><h2 class="headline">${p.headline}</h2><div class="gh">${p.headline}</div></div>` })()}
      <div class="foot">${p.sub?`<span class="sub">${p.sub}</span>`:'<span></span>'}${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>
      <div class="url">creslo.ai</div>` },
  mist: { label:'Soft mist', note:'Spa: gradient calm, airy', ratio:1350, mood:'light', font:"'Playfair Display',serif", fit:{headline:9,sub:14,eyebrow:4},
    render:p=>{
      const pills=listOf(p.chips).map(c=>`<span class="pill">${emph(c)}</span>`).join('')
      return `<div class="wash w1"></div><div class="wash w2"></div><div class="wash w3"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="mid">${tagBadge(p.badge)}<div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>${p.sub?`<p class="sub">${p.sub}</p>`:''}<div class="rule"></div>${pills?`<div class="pills">${pills}</div>`:''}</div>
      <div class="foot">${p.cta?`<div class="cta">${p.cta}</div>`:''}<div class="url">creslo.ai</div></div>`
    } },
  atelier: { label:'Atelier', note:'Vertical-spine editorial, quiet luxury', ratio:1080, mood:'light', font:"'Fraunces',serif", fit:{headline:8,sub:14,eyebrow:4},
    render:p=>`<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      ${p.eyebrow?`<div class="spine">${p.eyebrow}</div>`:''}
      <div class="mid"><h2 class="headline">${p.headline}</h2><div class="rule"></div>${p.sub?`<p class="sub">${p.sub}</p>`:''}</div>
      <div class="foot"><div class="url">creslo.ai</div>${p.cta?`<div class="cta">${p.cta}</div>`:''}</div>` },
  premiere: { label:'Premiere', note:'Film-poster billing block', ratio:1080, mood:'dark', font:"'Playfair Display',serif", fit:{headline:5,sub:14,eyebrow:4},
    render:p=>{
      const bill=listOf(p.chips).join('<span class="d">&middot;</span>')
      return `<div class="rules"></div>
      <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="mid"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>
      ${bill?`<div class="billing">${bill}</div>`:''}
      ${p.sub?`<p class="credits">${p.sub}</p>`:''}
      ${p.badge?`<div class="datebar">${p.badge}</div>`:''}</div>
      <div class="foot">${p.cta?`<div class="cta">${p.cta}</div>`:''}<div class="url">creslo.ai</div></div>`
    } },
  timetable: { label:'The week', note:'Fitness: weekly planner, save-worthy', ratio:1350, mood:'vibrant', font:"'Space Grotesk',sans-serif", fit:{headline:9,sub:14,eyebrow:4}, need:['.list .row'],
    render:p=>{
      const items=listOf(p.items||p.chips).slice(0,4)
      const rows=items.map(it=>{const w=it.split(/\s+/);const day=w[0]||'';const tm=w[1]||'';const nm=w.slice(2).join(' ');return `<div class="row"><span class="day">${emph(day)}</span><span class="cls">${emph(nm)}</span><span class="tm">${emph(tm)}</span></div>`}).join('')
      return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
      <div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>
      <div class="list">${rows}</div>
      ${p.sub?`<p class="sub">${p.sub}</p>`:''}
      <div class="foot"><div class="url">creslo.ai</div>${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>`
    } },
  crest: { label:'Crest', note:'Heritage lockup, established and proud', ratio:1080, mood:'light', font:"'Cormorant Garamond',serif", fit:{headline:9,sub:14,eyebrow:4},
    render:p=>`<div class="rules"></div>
      ${p.logo?`<img class="blogo" src="${p.logo}" style="margin-top:40px">`:`<div class="mono">${initials(p.name)}</div>`}
      ${p.name?`<div class="bn">${p.name}</div>`:''}
      ${p.eyebrow?`<div class="eyebrow">${p.eyebrow}</div>`:''}
      <div class="mid"><h2 class="headline">${p.headline}</h2><div class="gem"></div>${p.sub?`<p class="sub">${p.sub}</p>`:''}${p.badge?`<div class="stamp">${p.badge}</div>`:''}</div>
      <div class="foot">${p.cta?`<div class="cta">${p.cta}</div>`:''}<div class="rules"></div><div class="url">creslo.ai</div></div>` },
  // 2026-09-21 - from the 18 Sept weekly proof, approved by Daniel. Light/vibrant ones use ink /
  // muted / on-accent roles only (never --accent-text: open light-accent contrast bug, BACKLOG 2026-08-12).
 steps:{label:'The plan',note:'Numbered steps, save-worthy',ratio:1350,mood:'light',font:"'Fraunces',serif", fit:{headline:9,sub:14,eyebrow:4}, need:['.list .srow'],
  render:p=>{
   const items=listOf(p.items||p.chips).slice(0,4)
   const rows=items.map((it,i)=>`<div class="srow"><span class="num">0${i+1}</span><span class="stx">${emph(it)}</span></div>`).join('')
   return `<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
   ${p.badge?`<div class="savebadge">${p.badge}</div>`:''}
   <div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>
   <div class="list">${rows}</div>
   ${p.sub?`<p class="sub">${p.sub}</p>`:''}
   <div class="foot"><div class="url">creslo.ai</div>${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}</div>`
  }},
 blueprint:{label:'Blueprint',note:'Trades: drawn first then built',ratio:1080,mood:'dark',font:"'Space Grotesk',sans-serif", fit:{headline:8,sub:14,eyebrow:4},
  render:p=>{
   const specs=listOf(p.chips).map(c=>`<span class="spec">${emph(c)}</span>`).join('')
   return `<div class="bggrid"></div><div class="frameline"></div>
   <div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
   ${p.badge?`<div class="stamp">${p.badge}</div>`:''}
   <div class="mid"><div class="eyebrow">${p.eyebrow}</div><h2 class="headline">${p.headline}</h2>
   ${p.sub ? (String(p.sub).replace(/<[^>]+>/g, '').length <= 34
     ? `<div class="dim"><span class="ln"></span><span class="lb">${p.sub}</span><span class="ln"></span></div>`
     : `<div class="dim"><span class="ln"></span></div><p class="bsub">${p.sub}</p>`) : ''}
   ${specs?`<div class="specs">${specs}</div>`:''}</div>
   <div class="foot">${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}<div class="url">creslo.ai</div></div>`
  }},
 burst:{label:'Burst',note:'Retail: flash-offer sticker',ratio:1080,mood:'vibrant',font:"'Nunito',sans-serif", fit:{headline:9,sub:14,eyebrow:3},
  render:p=>`<div class="brandrow">${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}${p.name?`<div class="bn">${p.name}</div>`:''}</div>
   <h2 class="headline">${p.headline}</h2>
   <div class="boom"><span class="spike s1"></span><span class="spike s2"></span><span class="spike s3"></span>
   <div class="disc">${p.badge?`<div class="kick">${p.badge}</div>`:''}${p.price?`<div class="price">${p.price}</div>`:''}${p.eyebrow?`<div class="when">${p.eyebrow}</div>`:''}</div></div>
   ${p.sub?`<p class="sub">${p.sub}</p>`:''}
   ${p.cta?`<div class="cta">${p.cta} &rarr;</div>`:''}
   <div class="url">creslo.ai</div>`},
 letter:{label:'The note',note:'A note from the owner, letterhead',ratio:1080,mood:'light',font:"'Lora',serif", fit:{headline:9,sub:14,eyebrow:4},
  render:p=>`<div class="paper">
   ${p.logo?`<img class="blogo" src="${p.logo}">`:`<div class="mono">${initials(p.name)}</div>`}
   ${p.name?`<div class="bn">${p.name}</div>`:''}
   <div class="rule"></div>
   ${p.eyebrow?`<div class="eyebrow">${p.eyebrow}</div>`:''}
   <h2 class="headline">${p.headline}</h2>
   ${p.sub?`<p class="sub">${p.sub}</p>`:''}
   ${p.name?`<div class="sig">- ${p.name}</div>`:''}
   ${p.cta?`<div class="cta">${p.cta}</div>`:''}
   <div class="url">creslo.ai</div></div>`},
};

// LOOK RULE 5 - a new look starts on trial (Daniel, 2 Oct 2026: "are there any rules you can code
// in to keep this standard of generations"). Add `trial: true` to a new TREATMENTS entry: admins
// see it everywhere (the picker marks it "trial"), customers never get it in a set, a suggestion
// or the looks list. It comes off trial when scripts/ad-gate.mjs passes it and Daniel has seen it
// - then delete the flag and add the key to AD_LOOKS_PASSED in scripts/check-source.mjs.
export const onTrial = (t) => !!(TREATMENTS[t] && TREATMENTS[t].trial)
export const liveLooks = (admin = false) => Object.keys(TREATMENTS).filter(t => admin || !onTrial(t))

export const FLOATING =['cinematic','diagonal','duotone','frosted','banner','postcard','spotlight'];
export const CORNER = {
  tl:{top:'54px',left:'56px',right:'auto',bottom:'auto',transform:'none'},
  tr:{top:'54px',right:'56px',left:'auto',bottom:'auto',transform:'none'},
  bl:{bottom:'54px',left:'56px',top:'auto',right:'auto',transform:'none'},
  br:{bottom:'54px',right:'56px',top:'auto',left:'auto',transform:'none'},
};
export const TEXTPOS_OK = ['cinematic','diagonal','duotone','frosted','postcard','spotlight'];

/* ---------------------------------------------------------------------------
 * LAYOUT CONTRACTS — what each treatment KNOWS about itself.
 *
 * Adaptive placement (src/lib/quietRegion.ts) used to reverse-engineer all of this from a
 * rendered frame, and every single inference broke at least once on 2026-08-13:
 *
 *   inferred                        how it failed
 *   ------------------------------  ------------------------------------------------
 *   rails, by measuring the block   margins came out 13% / 5%, aligned to nothing
 *   scrim owner, by sniffing        `diagonal` already owns its scrim -> double-scrimmed
 *     ::before for a gradient         into an opaque black slab
 *   ink lightness                   NOT inferred at all - hardcoded `inkIsLight: true`,
 *                                     which is simply WRONG for frosted (var(--ink), dark)
 *   logo corners                    assumed all four were free
 *   whether the block may move       assumed yes and off-centre, which breaks postcard
 *     sideways                        and spotlight - both are centred BY DESIGN
 *
 * A treatment knows all of it. It just had no way to say so. Now it does.
 *
 * Every value below is read out of AD_CSS above, not estimated - percentages are the pixel
 * insets over the 1080 frame. If you change a treatment's CSS, change its contract.
 * A treatment with no entry here is not adaptive; that is a visible opt-out, not a silent one.
 * ------------------------------------------------------------------------- */
export const TREATMENT_LAYOUT = {
  // .block left:64 right:120 · .brandrow top:54 left:64 · scrim is a FRAME layer
  cinematic: { rails:{left:5.93,right:11.11}, anchors:['left','right','centre'], inkIsLight:true,
               scrimOwner:'frame', logoCorners:['tl','bl','br'], measure:{natural:83,min:64}, movable:true },
  // .block left:0 right:0 padding:0 120 text-align:CENTRE — moving it sideways breaks the look
  postcard:  { rails:{left:11.11,right:11.11}, anchors:['centre'], inkIsLight:true,
               scrimOwner:'frame', logoCorners:['tl','tr','bl','br'], measure:{natural:78,min:62}, movable:true },
  // .block left:56 right:90 · .brandrow top:50 left:56
  duotone:   { rails:{left:5.19,right:8.33}, anchors:['left','right','centre'], inkIsLight:true,
               scrimOwner:'frame', logoCorners:['tl','bl','br'], measure:{natural:86,min:64}, movable:true },
  // .block left:0 right:0 top:616 bottom:84 padding:0 90 text-align:CENTRE. movable:false - the copy owns
  // the zone under the photo disc; quiet-region placement must not move it (2 Oct 2026).
  spotlight: { rails:{left:8.33,right:8.33}, anchors:['centre'], inkIsLight:true,
               scrimOwner:'frame', logoCorners:['tl','bl','br'], measure:{natural:83,min:64}, movable:false },
  // .glass IS the backing: rgba(255,255,255,.85) travels with the block, so no injected scrim.
  // Ink here is var(--ink) — DARK. This is the one the hardcoded literal got wrong.
  frosted:   { rails:{left:8.33,right:8.33}, anchors:['left','right','centre'], inkIsLight:false,
               scrimOwner:'panel', logoCorners:['tl','tr','bl','br'], measure:{natural:83,min:66}, movable:true },
  // .block::before is a gradient attached to the BLOCK — it already travels. Never inject.
  diagonal:  { rails:{left:5.19,right:7.41}, anchors:['left','right','centre'], inkIsLight:true,
               scrimOwner:'block', logoCorners:['tl','bl','br'], measure:{natural:87,min:66}, movable:true },
};

/** The contract for a treatment, or null when it has not declared one (= not adaptive). */
export function layoutFor(treatment){ return TREATMENT_LAYOUT[treatment] || null; }

export const SAMPLE = 'linear-gradient(135deg, #aeb9c6 0%, #7c8a99 100%)';

export function emph(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/\n/g,'<br>'); }
export function initials(n){ return (n||'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'C'; }

// CHARTER LAW B (Doctrine 1.7/1.8): the typography ladder's step-down, in code.
// After a look renders, every headline-class element is measured against its box;
// anything overflowing (an unbreakable long word, or a copy block taller than its
// zone) steps its font-size DOWN 6% at a time (floor 55%) until it fits. Copy is
// never clipped, never hyphenated, never broken mid-word. Call after every render
// AND after font-load (document.fonts.ready) since metrics change when faces land.
export function fitAdText(root){
  if(!root) return
  // CHARTER LAW B clipping-guard extension (2026-09-11 ad-look audit): .price and .kicker are
  // prominent text (ticket/chalk/menu prices at 54-56px; poster/echo kickers) that were relying on
  // white-space:nowrap+overflow:hidden(+/-ellipsis) instead of the ladder - i.e. they CLIPPED long
  // values (ticket .price had a bare overflow:hidden, no ellipsis) rather than stepping down. Adding
  // them here routes overflow through the same step-down floor as headlines, so a long price/kicker
  // shrinks to fit instead of being chopped. Short values fit at base and the loop never runs.
  // CHARTER LAW B/C clipping-guard extension (2026-10-02 ad-look audit): .masthead and .tp were the
  // SAME failure class the 2026-09-11 sweep missed - both prominent, variable text on white-space:
  // nowrap+overflow:hidden and NOT in the ladder. coverStory's .masthead (112px brand NAME) clipped
  // long names mid-word (also a Law C wordmark-integrity hit - the identity itself getting chopped);
  // receipt's .tp (52px grand TOTAL, p.price) clipped long totals exactly like .price did before its
  // fix. Routing both through the step-down shrinks them to fit instead of chopping. The .masthead
  // .hasmark LOGO variant is already bounded (bmark height:104px/max-width:900px, white-space:normal)
  // and carries no measurable text, so the ladder is a no-op there - only the text name steps down.
  const els=root.querySelectorAll('.headline,.title,.quote,.big,.sub,.cap,.price,.kicker,.masthead,.tp')
  els.forEach((el: any)=>{
    // reset any previous fit so re-renders re-measure from the look's true scale. ('in', not a
    // truthy test: the saved value is '' for a size that comes from the CSS, and '' is falsy, so
    // every second call - paint runs this twice - started from the already-shrunk size.)
    if('fitbase' in el.dataset){ el.style.fontSize=el.dataset.fitbase }
    const base=parseFloat(getComputedStyle(el).fontSize)
    if(!base) return
    el.dataset.fitbase=el.style.fontSize||''
    let size=base
    // Too tall only counts when the box actually limits its height (it clips or has a max height).
    // A display headline set at line-height .9 always reaches a little past its own line box -
    // measured 2 Oct 2026 with the real fonts: a two-word Cinematic
    // headline (Oswald, 112px) was shrunk to 72px on every exported advert, while the preview the
    // customer chose showed it at 112px.
    const ecs=getComputedStyle(el)
    const limited=/(hidden|clip|auto|scroll)/.test(ecs.overflowY)||ecs.maxHeight!=='none'
    const fits=()=>el.scrollWidth<=el.clientWidth+1&&(!limited||el.scrollHeight<=el.clientHeight+Math.max(6,base*0.18))
    let guard=14
    while(!fits()&&size>base*0.55&&guard-->0){
      size=Math.round(size*0.94)
      el.style.fontSize=size+'px'
    }
  })
}

// ---- Hybrid brand palette: derive a full contrast-safe role palette from ONE brand colour.
// Treatments read these role vars (--surface / --ink / --accent / --panel / --on-accent /
// --accent-text / --accent-on-dark / --surface-dark / --ink-on-dark / --muted) instead of
// hardcoded colours, so every ad takes on the user's brand while staying premium + readable.
function _h2hsl(hex){ hex=String(hex||'').replace('#',''); if(hex.length===3)hex=hex.split('').map(c=>c+c).join(''); if(!/^[0-9a-fA-F]{6}$/.test(hex))return null; const r=parseInt(hex.slice(0,2),16)/255,g=parseInt(hex.slice(2,4),16)/255,b=parseInt(hex.slice(4,6),16)/255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b); let h,ss,l=(mx+mn)/2; if(mx===mn){h=ss=0;}else{const d=mx-mn; ss=l>0.5?d/(2-mx-mn):d/(mx+mn); switch(mx){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;default:h=(r-g)/d+4;} h/=6;} return [h*360,ss*100,l*100]; }
function _hsl2hex(h,s,l){ h/=360;s/=100;l/=100; const a=s*Math.min(l,1-l); const f=n=>{const k=(n+h*12)%12; const c=l-a*Math.max(Math.min(k-3,9-k,1),-1); return Math.round(255*c).toString(16).padStart(2,'0');}; return '#'+f(0)+f(8)+f(4); }
// WCAG relative luminance + contrast ratio, so the palette can PICK the higher-contrast ink
// for on-accent text instead of assuming light-on-accent (Charter §1.8 contrast gate first).
function _relLum(hx){ hx=String(hx).replace('#',''); const ch=i=>{const v=parseInt(hx.slice(i,i+2),16)/255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4);}; return 0.2126*ch(0)+0.7152*ch(2)+0.0722*ch(4); }
function _contrast(a,b){ const la=_relLum(a),lb=_relLum(b); return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05); }
// hex2 (optional, step 3 of the premium adverts, 3 Oct 2026): the brand's SECOND colour. When it is
// given and differs from the first, buttons, badges and chips (--accent-fill / --on-accent-fill) are
// drawn in it - deepened only as far as the 4.5:1 button rule needs - while grounds, emphasis and
// decoration stay the first colour. A brand with one colour gets exactly what it got before.
export function deriveBrandPalette(hex, hex2 = '', tone = ''){
  // THE GROUND FOLLOWS THE PHOTO WHEN THE BRAND CANNOT (Daniel, 5 Oct 2026; lib/adTone.ts decides
  // when). The grounds, panels, surfaces and their inks come from the tone; the brand keeps the
  // accent, the button, the badge and the emphasis - each walked until it reads on the tone's grounds.
  if (tone && _h2hsl(tone) && String(tone).toLowerCase() !== String(hex).toLowerCase()) {
    const B = deriveBrandPalette(hex, hex2), T = deriveBrandPalette(tone)
    const bh = _h2hsl(hex) || _h2hsl('#9d6a40'), H = bh[0], S = bh[1], Lb = bh[2]
    const walk = (ss, ll, grounds, step) => {
      let L = ll, c = _hsl2hex(H, ss, L)
      for (let i = 0; i < 60 && grounds.some(g => _contrast(c, g) < 4.5) && L > 2 && L < 98; i++) { L += step; c = _hsl2hex(H, ss, L) }
      return grounds.every(g => _contrast(c, g) >= 4.5) ? c : ''
    }
    const darkGround = _contrast(T['on-ground'], '#ffffff') < _contrast(T['on-ground'], '#000000')
    const em = darkGround ? walk(Math.min(S,85), Math.max(Lb,60), [T.ground], 2) : walk(Math.min(S,72), Math.min(Lb,42), [T.ground], -2)
    return {
      ...T,
      'accent': B.accent, 'on-accent': B['on-accent'],
      'accent-fill': B['accent-fill'], 'on-accent-fill': B['on-accent-fill'],
      'em-on-ground': em || T['em-on-ground'],
      'accent-text': walk(Math.min(S,72), Math.min(Lb,42), [T.surface, T.panel], -2) || T['accent-text'],
      'accent-on-dark': walk(Math.min(S,85), Math.max(Lb,64), [T['surface-dark']], 2) || T['accent-on-dark'],
    }
  }
  const hsl=_h2hsl(hex)||_h2hsl('#9d6a40'); const h=hsl[0], s=hsl[1], l=hsl[2];
  const accent = _hsl2hex(h,s,l);
  // CHARTER §1.8 (2026-09-07 ad-look audit): on-accent text is the higher-contrast of a warm
  // near-black and a warm near-white, BOTH re-derived from the brand hue — never pure #000/#fff,
  // and never a fixed l>62 guess that left white text at ~3.4:1 on a mid-tone accent. Picking by
  // measured contrast flips mid/light accents to dark ink and keeps genuinely dark accents on the
  // near-white, so the CTA / badge / wordmark lockup clears the gate on ANY brand colour.
  const _onAccentDark = _hsl2hex(h, Math.min(s,30), 11);
  const _onAccentLite = _hsl2hex(h, Math.min(s,8), 98);
  const _onAccent = _contrast(accent,_onAccentDark) >= _contrast(accent,_onAccentLite) ? _onAccentDark : _onAccentLite;
  // TEXT TONES THAT PASS ON THEIR OWN (Ad Studio audit, 2026-09-30). accent-text, muted and
  // accent-on-dark were fixed lightness guesses; on yellows, limes and cyans they came out too
  // faint, the proof gate then repainted them in plain ink, and the emphasis lost its colour.
  // Now each is walked darker (or lighter, on the dark ground) in the brand's own hue until it
  // clears 4.5:1 against every ground it is used on - so it stays the brand colour AND reads.
  const surface = _hsl2hex(h, Math.min(s,20), 96), panel = _hsl2hex(h, Math.min(s,12), 99), surfaceDark = _hsl2hex(h, Math.min(s,42), 9);
  const fit = (hh, ss, ll, grounds, step) => {
    let L = ll, c = _hsl2hex(hh, ss, L);
    for (let i = 0; i < 60 && grounds.some(g => _contrast(c, g) < 4.5) && L > 2 && L < 98; i++) { L += step; c = _hsl2hex(hh, ss, L); }
    return c;
  };
  // NO TYPE ON A MID-TONE (Daniel, 2 Oct 2026: "black text on the mid brown background doesn't
  // go well"). A caramel, a sage or a dusty blue sits in the middle of the light scale, where
  // NEITHER ink reads cleanly - dark ink on #b07a4f measured 5.8:1, white 3.4:1. Passing the
  // 4.5:1 minimum is not the bar; a designer would never set copy there. The rule:
  //  - if the better ink already clears 7:1 the brand colour is light or deep enough, use it as is;
  //  - otherwise deepen it, in its own hue, until a near-white ink clears the bar. Big grounds
  //    (poster, echo, torn, ticket, timetable, burst, bubble, panels) go to 7:1; buttons, badges
  //    and chips go to 4.5:1, so they move only a notch and still read as the brand colour.
  // The untouched brand colour stays on everything decorative (rules, dots, glows, photo tints)
  // and comes back as the emphasis colour on the deepened ground.
  const _bestInk = Math.max(_contrast(accent,_onAccentDark), _contrast(accent,_onAccentLite))
  const _deepen = (target) => {
    if (_bestInk >= 7) return accent
    let L = l, c = accent
    for (let i = 0; i < 60 && _contrast(c,_onAccentLite) < target && L > 8; i++) { L -= 1; c = _hsl2hex(h, s, L) }
    return c
  }
  const ground = _deepen(7), accentFill = _deepen(4.5)
  const _inkOn = (bg) => bg === accent ? _onAccent : _onAccentLite
  let fill = accentFill, onFill = _inkOn(accentFill)
  const h2 = hex2 ? _h2hsl(hex2) : null
  if (h2 && String(hex2).toLowerCase() !== String(hex).toLowerCase()) {
    const p2 = deriveBrandPalette(hex2)
    fill = p2['accent-fill']; onFill = p2['on-accent-fill']
  }
  return {
    'accent': accent,
    'on-accent': _onAccent,
    'ground': ground,
    'on-ground': _inkOn(ground),
    // emphasis on the ground: the brand colour itself, lifted until it reads (4.5:1) on the
    // deepened ground; on an untouched ground it keeps the panel-white emphasis where that reads,
    // and the ink itself (the italic carries the stress) on a light brand colour such as yellow.
    'em-on-ground': ground !== accent ? fit(h, Math.min(s,85), Math.max(l,60), [ground], 2) : (_contrast(panel, ground) >= 4.5 ? panel : _onAccent),
    'accent-fill': fill,
    'on-accent-fill': onFill,
    'accent-text': fit(h, Math.min(s,72), Math.min(l,42), [surface, panel], -2),
    'accent-on-dark': fit(h, Math.min(s,85), Math.max(l,64), [surfaceDark], 2),
    'surface': surface,
    'panel': panel,
    'ink': _hsl2hex(h, Math.min(s,26), 14),
    'muted': fit(h, Math.min(s,16), 46, [surface, panel], -2),
    'surface-dark': surfaceDark,
    'ink-on-dark': _hsl2hex(h, Math.min(s,14), 95),
  };
}

export const INDUSTRIES=[
 {key:'other',label:'Other / general',t:['cinematic','editorial','card','banner']},
 {key:'barber',label:'Barber & grooming',t:['cinematic','banner','twotone','duotone']},
 {key:'hair',label:'Hair & beauty',t:['twotone','atelier','editorial','frosted','spotlight','coverStory']},
 {key:'spa',label:'Spa & wellness',t:['aura','mist','atelier','frosted','editorial','postcard']},
 {key:'food',label:'Cafe & restaurant',t:['menu','letter','dish','chalk','crest','receipt','editorial','postcard','duotone']},
 {key:'fitness',label:'Fitness & personal training',t:['stat','timetable','poster','premiere','echo','hook','diagonal','cinematic','banner','duotone']},
 {key:'trades',label:'Trades & construction',t:['quote','blueprint','checklist','versus','beforeafter','banner','cinematic','diagonal']},
 {key:'property',label:'Property & real estate',t:['openhouse','card','editorial','postcard']},
 {key:'retail',label:'Retail & e-commerce',t:['snapshot','burst','coverStory','torn','receipt','spotlight','duotone','card','editorial']},
 {key:'hospitality',label:'Hospitality & holiday lets',t:['stay','letter','suite','crest','escape','postcard','editorial','cinematic']},
 {key:'events',label:'Events & creative',t:['ticket','burst','premiere','poster','echo','torn','duotone','spotlight','cinematic','postcard']},
 {key:'professional',label:'Professional services',t:['bento','letter','steps','versus','hook','convo','editorial','card','duotone']},
];

export const FONT_OPTIONS = [
  { value: '', label: 'Auto (brand default)' },
  { value: "'DM Serif Display',serif", label: 'DM Serif' },
  { value: "'Fraunces',serif", label: 'Fraunces' },
  { value: "'Playfair Display',serif", label: 'Playfair' },
  { value: "'Cormorant Garamond',serif", label: 'Cormorant' },
  { value: "'Lora',serif", label: 'Lora' },
  { value: "'DM Sans',sans-serif", label: 'DM Sans' },
  { value: "'Inter',sans-serif", label: 'Inter' },
  { value: "'Manrope',sans-serif", label: 'Manrope' },
  { value: "'Work Sans',sans-serif", label: 'Work Sans' },
  { value: "'Sora',sans-serif", label: 'Sora' },
  { value: "'Space Grotesk',sans-serif", label: 'Space Grotesk' },
  { value: "'Oswald',sans-serif", label: 'Oswald' },
  { value: "'Nunito',sans-serif", label: 'Nunito' },
  { value: "'Syne',sans-serif", label: 'Syne' },
]

// Map a free-text brand industry to one of our keys (used silently in-app).
// Map a brand's free-text industry to a canonical key.
//
// The customer picks from ~200 granular options in IndustrySelect (creslo-frontend/src/
// components/IndustrySelect.tsx) - "Physiotherapy", "Cleaning services", "CAD / design
// services". This function decides what Creslo actually DOES with that, and until
// 2026-08-24 it collapsed all 200 into twelve coarse buckets by substring match, in an
// order that produced real collisions:
//
//   * "Physiotherapy" contains "therap"      -> matched `spa` and returned before ever
//                                               reaching the physio check three lines down.
//                                               A clinic was being treated as a nail bar.
//   * "Marketing agency" contains "agency"   -> matched `events`.
//   * "Garden centre" contains "garden"      -> a retailer became a landscaper.
//   * "Software / SaaS" matched nothing      -> fell through to `other`, the catch-all,
//                                               which then filled with SaaS formats that
//                                               every unclassified business inherited.
//
// ORDER IS THE WHOLE DESIGN. Specific before general, always: `physio` before `spa`,
// `automotive` before `cleaning` (car valeting is automotive), `engineering` before
// `electrical` (electrical engineering is not an electrician), `retail` before
// `landscaping` (a garden centre sells things).
//
// Adding keys is cheap and worth it: formatStepGrow only generates for keys that have
// brands, so an empty key costs nothing, and the first customer in that niche gets
// formats written for them instead of inheriting the catch-all.
//
// KEEP THIS IDENTICAL TO server/index.js in creslo-backend. The backend test
// server/test/industry-key.test.js reads BOTH copies and fails if the rules drift, so a
// change here without the matching change there will be caught.
export function industryKeyFor(raw){
  const s = (raw || '').toLowerCase()
  const has = (...w) => w.some(x => s.includes(x))
  // SHORT TOKENS NEED BOUNDARIES. Plain substring matching on three- and four-letter
  // words is how "Aerospace" became a spa, "Publishing" and "Government / public sector"
  // became takeaways, and "Courier / delivery" became a deli. All four were found by
  // server/test/industry-key.test.js the first time it ran.
  const word = (...w) => w.some(x => new RegExp('\\b' + x + '\\b').test(s))
  // --- health, before anything that could swallow it ---------------------------------
  // 'physiotherapy' contains 'therap'; 'chiropractor' contains 'practor'. Both must beat spa.
  if (has('physio', 'chiro', 'osteopath', 'sports therap', 'rehabilit', 'podiatr', 'orthotic')) return 'physio'
  if (has('dental', 'dentist', 'orthodont', 'hygienist')) return 'dental'
  if (has('optician', 'optometr', 'pharmac', 'gp /', 'private clinic', 'medical', 'doctor', 'nursing', 'care home', 'social care', 'mental health', 'counselling', 'counseling', 'psycholog', 'psychother')) return 'medical'
  if (word('vet', 'vets') || has('veterinar', 'pet groom', 'pet shop', 'dog walk', 'dog board', 'animal train', 'kennel', 'cattery')) return 'pets'
  // --- appearance -------------------------------------------------------------------
  if (has('barber', 'grooming', 'barbershop')) return 'barber'
  if (has('hair', 'salon', 'beauty', 'nail', 'hairdress', 'stylist', 'lash', 'brow', 'tanning', 'makeup', 'make-up')) return 'hair'
  if (word('spa') || has('wellness', 'massage', 'therap', 'sauna', 'wax', 'facial', 'holistic', 'reiki', 'tattoo', 'aesthetic', 'cosmetic')) return 'spa'
  if (has('fitness', 'gym', 'trainer', 'personal train', 'yoga', 'pilates', 'crossfit', 'bootcamp', 'boxing', 'martial', 'spin class', 'barre', 'dance studio', 'sports coach', 'sports club', 'leisure centre', 'nutrition', 'diet')) return 'fitness'
  // --- food -------------------------------------------------------------------------
  if (has('cafe', 'coffee', 'restaurant', 'food', 'bakery', 'eatery', 'cater', 'takeaway', 'take away', 'takeout', 'patisserie', 'pizz', 'bistro', 'brasserie', 'diner', 'grill', 'canteen', 'juice', 'smoothie', 'ice cream', 'gelato', 'dessert', 'bbq', 'barbecue', 'burger', 'sandwich', 'tapas', 'sushi', 'noodle', 'curry', 'tavern', 'street food', 'brewery', 'distillery', 'butcher', 'greengrocer', 'confectioner', 'bar /') || word('pub', 'deli')) return 'food'
  // --- ORDER MATTERS MOST HERE ------------------------------------------------------
  // engineering first: "Automotive manufacturing" is a manufacturer, not a garage.
  // automotive next:   "Body shop" contains 'shop' and would otherwise become retail.
  // retail last:       "Garden centre" contains 'garden' and would become landscaping.
  if (word('cad') || has('engineer', 'manufactur', 'industrial', 'machinery', 'metalwork', 'fabricat', 'aerospace', '3d print', 'prototyp', 'electronics')) return 'engineering'
  if (word('mot') || has('garage', 'mechanic', 'tyre', 'exhaust', 'body shop', 'bodyshop', 'car deal', 'car hire', 'car valet', 'valeting', 'detailing', 'vehicle', 'automotive')) return 'automotive'
  if (has('garden centre', 'garden center', 'retail', 'shop', 'store', 'ecommerce', 'e-commerce', 'boutique', 'clothing', 'fashion', 'jewel', 'gift', 'florist', 'flower', 'homeware', 'furniture', 'bookshop', 'toy shop', 'convenience')) return 'retail'
  // --- the trades, split so generations can be specific ------------------------------
  if (has('clean', 'housekeep', 'janitor', 'laundry', 'ironing', 'pressure wash', 'jet wash')) return 'cleaning'
  if (has('plumb', 'heating', 'hvac', 'boiler', 'gas engineer', 'gas safe', 'bathroom fit')) return 'plumbing'
  if (has('electrician', 'rewire', 'pat test', 'ev charg')) return 'electrical'
  if (has('landscap', 'garden', 'tree surgeon', 'arborist', 'fencing', 'paving', 'driveway', 'turfing')) return 'landscaping'
  if (has('build', 'construct', 'roof', 'joiner', 'carpent', 'plaster', 'scaffold', 'tiler', 'tiling', 'flooring', 'glazing', 'window', 'painter', 'painting', 'decorat', 'extension', 'renovat', 'loft convers', 'damp proof')) return 'building'
  if (has('trade', 'handyman', 'locksmith', 'removal', 'pest control', 'waste', 'rubbish', 'recycling', 'gutter', 'chimney', 'skip hire')) return 'trades'
  // --- knowledge work ----------------------------------------------------------------
  if (has('software', 'saas', 'web design', 'web develop', 'app develop', 'digital agency', 'it support', 'it services', 'cybersecur', 'data /', 'analytics', 'machine learning', 'ai /', 'gaming', 'tech ', 'platform')) return 'software'
  if (has('financial advis', 'mortgage', 'insurance', 'banking', 'investment', 'wealth', 'fintech', 'payroll')) return 'finance'
  if (has('tutor', 'driving instructor', 'nursery', 'childcare', 'training provider', 'school', 'college', 'music tuition', 'language school', 'education', 'coaching', 'coach')) return 'education'
  if (has('logistics', 'freight', 'courier', 'delivery', 'haulage', 'taxi', 'private hire', 'warehous', 'chauffeur', 'transport')) return 'transport'
  if (has('publishing', 'journalis', 'advertis', 'print', 'signage', 'broadcast', 'podcast', 'content creator', 'influencer', 'media')) return 'media'
  // --- place ------------------------------------------------------------------------
  if (has('estate agent', 'letting', 'property', 'architect', 'interior design', 'surveying', 'surveyor', 'realtor', 'realty')) return 'property'
  if (has('hotel', 'holiday', 'lodge', 'cottage', 'airbnb', 'hospitality', 'b&b', 'bed and breakfast', 'guest house', 'guesthouse', 'resort', 'villa', 'glamping', 'campsite', 'caravan', 'hostel', 'self catering', 'self-catering', 'retreat', 'accommodation', 'travel agency', 'tour operator')) return 'hospitality'
  if (has('event', 'wedding', 'photograph', 'videograph', 'party', 'dj /', 'entertain', 'venue', 'graphic design', 'design studio', 'music /') || word('band')) return 'events'
  // --- the rest ----------------------------------------------------------------------
  if (has('farming', 'agricultur', 'horticultur', 'forestry', 'fishing', 'environmental')) return 'agriculture'
  if (has('renewable', 'solar', 'energy', 'oil & gas', 'utilities')) return 'energy'
  if (has('charity', 'non-profit', 'nonprofit', 'religious', 'public sector', 'government', 'membership', 'community group')) return 'nonprofit'
  if (has('wholesale', 'distribution', 'import', 'export', 'packaging', 'textile')) return 'wholesale'
  // 'agency' lives here, NOT in events: a marketing agency is a professional service.
  if (has('solicit', 'legal', 'lawyer', 'consult', 'marketing', 'agency', 'pr /', 'communications', 'recruit', 'hr services', 'translation', 'accountan', 'bookkeep', 'profession', 'advisor', 'clinic')) return 'professional'
  return 'other'
}

// AD STUDIO USES A DIFFERENT AXIS. industryKeyFor answers "what does this business do",
// which drives content: formats, trends, starter strategy. The look a brand should wear is
// a separate question, and INDUSTRIES / AFFINITY / COPY_SUGGEST / INDUSTRY_STICKERS below
// are all keyed on the twelve visual families rather than the 32 canonical keys.
//
// Collapsing here rather than coarsening industryKeyFor keeps one canonical vocabulary
// shared with the backend, and makes the mapping explicit instead of accidental. Without
// it every new key would miss its lookup and silently fall back to INDUSTRIES[0] - a
// physio clinic quietly styled as "Other / general".
const VISUAL_KEY = {
  barber: 'barber',
  hair: 'hair',
  spa: 'spa', physio: 'spa',
  food: 'food',
  fitness: 'fitness',
  cleaning: 'trades', plumbing: 'trades', electrical: 'trades', landscaping: 'trades',
  building: 'trades', trades: 'trades', automotive: 'trades', transport: 'trades',
  agriculture: 'trades', energy: 'trades',
  property: 'property',
  retail: 'retail', pets: 'retail',
  hospitality: 'hospitality',
  events: 'events', media: 'events',
  professional: 'professional', software: 'professional', engineering: 'professional',
  finance: 'professional', education: 'professional', dental: 'professional',
  medical: 'professional', nonprofit: 'professional', wholesale: 'professional',
  other: 'other',
}
// The visual family for a raw industry string. Ad Studio should call THIS, never
// industryKeyFor directly.
export function visualKeyFor(raw){
  return VISUAL_KEY[industryKeyFor(raw)] || 'other'
}

// Industries whose looks also fit, in priority order - so a brand sees its own
// treatments first, then closely-related trades' treatments, then everything else.
// This is what lets a catering company (food) surface hospitality looks near the top.
const AFFINITY = {
  other: [],
  barber: ['hair','spa'],
  hair: ['barber','spa','retail'],
  spa: ['hair','hospitality'],
  food: ['hospitality','events','retail'],
  fitness: ['spa','events'],
  trades: ['property','professional'],
  property: ['trades','hospitality','professional'],
  retail: ['events','food','hair'],
  hospitality: ['food','events','property'],
  events: ['hospitality','food','retail'],
  professional: ['trades','property'],
}

// Ordered relevance list for an industry: its own treatments first, then related
// industries' treatments, deduped. buildLooks puts these first (in this order) and
// appends any remaining treatments after, so every layout still shows.
export function suitedFor(industryKey, admin = false){
  const own = (INDUSTRIES.find(i => i.key === industryKey) || INDUSTRIES[0])
  const order = []
  const push = (list) => (list || []).forEach(t => { if (TREATMENTS[t] && (admin || !onTrial(t)) && order.indexOf(t) === -1) order.push(t) })
  push(own.t)
  ;(AFFINITY[industryKey] || []).forEach(k => { const r = INDUSTRIES.find(i => i.key === k); if (r) push(r.t) })
  if (!order.length) push(liveLooks(admin).slice(0, 6))   // every suited look on trial: never an empty list
  return order
}

export const DEFAULT_TUNE = {
  mode: 'auto', fx: 50, fy: 50, zoom: 1, rot: 0, fade: 0, hue: 0,
  logoPos: 'auto', tx: 50, ty: 82, talign: 1, textCustom: false, showLogo: true,
}

export const STYLE_KEYS = ['treatment','ratio','accent','font','mode','fx','fy','zoom','rot','fade','hue','logoPos','tx','ty','talign','textCustom']

// Suggestive starter copy per industry - seeded so the preview reads well and
// the fields show relevant examples before the user types. Headlines use
// *asterisks* to accent a word (see emph()).
export const COPY_SUGGEST = {
  other:        { eyebrow: 'Now open',              headline: 'Made *local.* Made well.',   sub: 'Quality you can count on, every time.',     cta: 'Get in touch',        badge: 'TRUSTED',  chips: 'Friendly | Reliable | Local' },
  barber:       { eyebrow: 'Traditional barbering', headline: 'Look *sharp.*',               sub: 'Skin fades, hot towels and a proper chair.', cta: 'Walk-ins welcome',    badge: 'EST. 2019', chips: 'Fades | Beards | Hot towel' },
  hair:         { eyebrow: 'Hair and beauty',       headline: 'Your best *hair* day.',       sub: 'Cut, colour and care by people who get it.', cta: 'Book your slot',      badge: 'NEW IN',   chips: 'Cut | Colour | Style' },
  spa:          { eyebrow: 'Spa and wellness',      headline: 'Switch off. *Unwind.*',       sub: 'Treatments to slow the whole day down.',     cta: 'Reserve your time',   badge: 'RELAX',    chips: 'Massage | Facials | Calm' },
  food:         { eyebrow: 'Fresh today',           headline: 'Made *fresh,* every morning.', sub: 'Proper coffee and food worth the trip.',     cta: 'See the menu',        badge: 'OPEN NOW', chips: 'Coffee | Brunch | Cake', price: '9.50', items: 'Sourdough toast 5 | Flat white 3 | Pistachio cruffin 4' },
  fitness:      { eyebrow: 'Train with us',         headline: 'Stronger *starts here.*',     sub: 'Coaching that meets you where you are.',     cta: 'Start today',         badge: 'JOIN NOW', chips: 'Strength | Classes | Coaching' },
  trades:       { eyebrow: 'Trusted local trade',   headline: 'Done *properly.*',            sub: 'Honest work, fair prices, on time.',         cta: 'Get a quote',         badge: 'INSURED',  chips: 'Free quote | Guaranteed | Local' },
  property:     { eyebrow: 'New to market',         headline: 'Your next *address.*',        sub: 'A home that finally ticks every box.',       cta: 'Book a viewing',      badge: 'FOR SALE', chips: '3 bed | 2 bath | Garden' },
  retail:       { eyebrow: 'New arrivals',          headline: 'Made to be *yours.*',         sub: 'The pieces everyone is asking about.',       cta: 'Shop the drop',       badge: 'NEW IN',   chips: 'New | Limited | In store' },
  hospitality:  { eyebrow: 'Book your stay',        headline: 'Stay a little *longer.*',     sub: 'Open Apr - Oct',                             cta: 'Check availability',  badge: 'BOOK NOW', chips: 'Sleeps 6 | Sea view | Hot tub', price: '120 / night' },
  events:       { eyebrow: 'Save the date',         headline: 'A night to *remember.*',      sub: 'Everything you need for the big one.',       cta: 'Get tickets',         badge: 'LIVE',     chips: 'Live | Limited | Tickets' },
  professional: { eyebrow: 'Expert advice',         headline: 'Advice you can *trust.*',     sub: 'Clear guidance, no jargon, real results.',   cta: 'Book a call',         badge: 'TRUSTED',  chips: 'Free consult | Local | Expert' },
}

// Per-look example copy. When a specialised look is selected these override the industry
// seed for the fields that look actually uses, so the greyed placeholders (and the empty
// preview) match the layout picked. Generic looks fall back to the industry seed above.
export const TREATMENT_HINTS = {
  dish:      { eyebrow: 'House special',  headline: 'Wood-fired *margherita.*',  price: '12',          cta: 'Order now' },
  menu:      { eyebrow: 'Today',          headline: 'On the menu',                items: 'Sourdough toast 5 | Flat white 3 | Pistachio cruffin 4 | Soup of the day 6', cta: 'See full menu' },
  chalk:     { eyebrow: 'Today only',     headline: 'The *daily* special.',       sub: 'Slow-roast beef with all the trimmings.', price: '14' },
  stay:      { eyebrow: 'Book your stay', headline: 'Stay a little *longer.*',     chips: 'Sleeps 6 | Sea view | Hot tub',     price: '120 / night', cta: 'Check availability' },
  suite:     { eyebrow: 'The room',       headline: 'Room to *breathe.*',          chips: 'King bed | Roll-top bath | Breakfast included', price: '95 / night', cta: 'Book direct' },
  escape:    { eyebrow: 'The Cotswolds',  headline: 'Your next *escape.*',          sub: 'Open Apr - Oct',                      cta: 'Plan your trip' },
  checklist: { eyebrow: 'What we do',     headline: 'Spotless, every time.',       items: 'Kitchens & bathrooms deep-cleaned | Eco-friendly products | The same trusted cleaner | Weekly or one-off', chips: 'Fully insured | DBS-checked | 5-star', price: '15/hr', cta: 'Get a free quote' },
  quote:     { eyebrow: 'Free quotes',    headline: 'Booked in *minutes.*',        chips: 'Fully insured | DBS-checked | 5-star rated', cta: 'Get a quote' },
  beforeafter: { headline: 'See the difference.', cta: 'Book a clean' },
  baReveal: { eyebrow: 'Before & after', headline: 'Same job. Totally different story.', cta: 'See the difference' },
  baStack: { headline: 'From tired to transformed.', cta: 'Get a quote' },
  baDiagonal: { headline: 'The difference is night and day.', cta: 'See our work' },
  baInset: { headline: 'One space. Two totally different stories.', cta: 'Book a visit' },
  baFilmstrip: { headline: 'From overgrown to outstanding.', cta: 'See the difference' },
  tmQuote: { headline: 'The best decision we made all year.', sub: 'Sarah T, Leeds' },
  tmCard: { headline: 'Bookings up, stress down. Could not recommend them more.', sub: 'Sarah T' },
  tmSplit: { eyebrow: 'Client review', headline: 'They turned it around in a week. Faultless.', sub: '- James, Manchester' },
  tmStars: { headline: 'Best in the business, hands down.', sub: 'Sarah T, Leeds', cta: 'Get the same' },
  tmBubble: { headline: 'Genuinely made our summer. Thank you!', sub: '- Priya, Bristol' },
  bento:    { eyebrow: 'What we do', headline: 'Rooms that *work* as hard as you do.', sub: 'Design-led interiors for homes and workspaces.', chips: 'Consult | Design | Fit-out', badge: 'STUDIO', cta: 'Book a consultation' },
  poster:   { eyebrow: 'Summer series', headline: 'Move *loud.* Train louder.', sub: 'Six weeks. Every level. No egos.', chips: 'Classes | Coaching | Community', cta: 'Join the club' },
  stat:     { eyebrow: 'The results', price: '94%', headline: 'of members hit their *first goal* inside 12 weeks.', sub: 'Based on 1,200 member check-ins across 2025.', cta: 'Start today' },
  snapshot: { eyebrow: 'Fresh from the kiln', headline: 'Handmade, small batch and *very* limited.', sub: 'The autumn drop lands Friday at 10am.', badge: 'NEW', chips: 'Ceramics | Prints | Gifts', cta: 'Shop the drop' },
  aura:    { eyebrow: 'The reset',  headline: 'Let the day *dissolve.*', sub: 'Ninety minutes that put the whole week back together.', cta: 'Reserve your time' },
  ticket:  { eyebrow: 'Admit one',  headline: 'The *Summer* Sessions.',  sub: 'Live music, street food and late sun on the riverside.', chips: 'Sat 8 Aug | Doors 6pm | Riverside', badge: 'LIVE', price: '18', cta: 'Get tickets' },
  receipt: { eyebrow: 'Your order', headline: 'The usual?',              items: 'Flat white 3.20 | Almond croissant 3.80 | Sourdough loaf 4.50', price: '11.50', sub: 'Baked fresh every morning - order ahead and skip the queue.', cta: 'Order ahead', badge: 'ORDER #047' },
  convo:   { eyebrow: 'Today',      headline: 'Yes - *Thursday 2pm* just opened up.', sub: 'Hi! Any appointments left this week?', chips: 'Book Thursday | See all times', cta: 'Send us a message' },
  coverStory: { eyebrow: 'August 2026', headline: 'The colour season starts *now.*', sub: 'The looks, the drops and the bookings worth knowing this month.', chips: 'New in | Trending | The edit', badge: 'THE EDIT', cta: 'Read more' },
  torn:    { eyebrow: 'The weekend drop', headline: 'Cut. Paste. *Sold out.*', sub: 'Small batch, big energy - most pieces are gone by Sunday.', chips: 'Limited | Handmade | In store', badge: 'NEW', cta: 'Shop the drop' },
  hook:    { eyebrow: 'Save this',  headline: '5 mistakes costing you *clients.*', sub: 'Swipe for the fixes we use with every business we take on.', badge: '01 / 05', cta: 'Swipe' },
  openhouse: { eyebrow: 'Open house - Sat 10am to 2pm', headline: 'The one on *Willow Lane.*', chips: '4 bed | 2 bath | South-facing garden', price: '450,000', badge: 'JUST LISTED', cta: 'Book a viewing' },
  versus:  { eyebrow: 'Why switch', headline: 'There is a *better* way.', items: 'Waiting weeks for a reply | Hidden fees on the invoice | One-size-fits-all advice', chips: 'Same-day response | Fixed and clear pricing | A plan built around you', sub: 'Join 400+ local businesses already switched.', cta: 'Book a free call' },
  proofStack: { eyebrow: '4.9 from 300+ reviews', headline: 'Worth every penny - the team went above and beyond for us.', sub: 'Amy R, Harrogate', cta: 'Read the reviews' },
  echo:    { eyebrow: 'This weekend only', headline: 'Final *few* spaces.', sub: 'When they are gone, they are gone - doors close Sunday.', cta: 'Claim yours' },
  mist:    { eyebrow: 'The slow hour', headline: 'Breathe *out.*', sub: 'One quiet hour that resets the whole week.', chips: 'Massage | Facials | Steam room', cta: 'Reserve your time' },
  atelier: { eyebrow: 'The Autumn Edit', headline: 'Quietly *exceptional* colour.', sub: 'Balayage and gloss by colourists who take their time over it.', cta: 'Book your chair' },
  premiere: { eyebrow: 'The new season presents', headline: 'The *comeback.*', chips: 'Strength | Conditioning | Community', sub: 'Six weeks of graft with a corner that never leaves you. Every level welcome.', badge: 'Opens Mon 28 Sep', cta: 'Start training' },
  timetable: { eyebrow: 'Your week - sorted', headline: 'Pick your *hour.*', items: 'Mon 06:00 Strength | Wed 18:30 Spin | Fri 07:00 Yoga | Sat 09:00 Bootcamp', sub: 'First session free - just turn up with trainers.', cta: 'Book a class' },
  crest:   { eyebrow: 'Harrogate - Est. 2012', headline: 'Proper *afternoon tea.*', sub: 'Baked that morning and served on the good china - Thursday to Sunday.', badge: 'Reservations open', cta: 'Reserve a table' },
  steps: {badge:'Free guide', eyebrow:'Save this for January', headline:'Your tax return in *three* steps.', items:'Send us your paperwork | We prepare and check it | You approve and relax', sub:'Most clients are wrapped up inside a week.', cta:'Book a free call'},
  blueprint: {badge:'Est. 2015', eyebrow:'Fitted furniture - made to measure', headline:'Built to the *millimetre.*', sub:'Drawn first. Built once.', chips:'Free site survey | Fixed quote upfront | 10-year guarantee', cta:'Get a quote'},
  burst: {badge:'Final weekend', price:'50% OFF', eyebrow:'Ends Sunday 6pm', headline:'Everything must *go.*', sub:'Doors open 9am Saturday - when it is gone it is gone.', cta:'Grab a bargain'},
  letter: {eyebrow:'A note from the owner', headline:'Thank you for *ten* years.', sub:'This place started with one oven and a lot of nerve. Ten years on the coffee is better and so are we.', cta:'Come and celebrate with us'},
}

// ---- Looks gallery: live thumbnail previews + fresh, industry-aware variations ----
// A "look" bundles a treatment with an accent + heading font (and its ratio).
// buildLooks() makes a large, shuffleable pool so businesses keep getting fresh
// ads instead of the same fixed handful. Looks whose treatment suits the brand's
// industry get more variations and lead the gallery (flagged suited:true). A new
// seed = a fresh set/order. THUMB_CSS reuses the ad CSS for scaled-down previews.

export const THUMB_CSS = AD_CSS.replace(/#cad/g, '.cadthumb')

const LOOK_FONTS = [
  "'DM Serif Display',serif", "'Fraunces',serif", "'Playfair Display',serif",
  "'Cormorant Garamond',serif", "'Lora',serif", "'Oswald',sans-serif",
  "'Syne',sans-serif", "'Space Grotesk',sans-serif", "'Sora',sans-serif",
  "'Manrope',sans-serif", "'Work Sans',sans-serif",
]

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function shuffleInPlace(arr, rnd) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp }
  return arr
}

// ONE look per treatment = one card per distinct LAYOUT.
// Colour and font are no longer separate gallery entries - they are adjusted on the
// selected look via the accent / font / hue controls. Suited treatments lead the
// gallery; everything renders in the brand's own accent + the treatment's default font.
// suited: array of treatment keys that fit the brand's industry (from suitedFor()).
export function buildLooks({ suited = [], brandAccent = '', seed = 1, admin = false } = {}) {
  const accent = brandAccent || ACCENTS[0]
  const all = liveLooks(admin)
  const suitedList = (suited || []).filter(t => all.indexOf(t) !== -1)
  const isSuited = (t) => suitedList.indexOf(t) !== -1
  const ordered = [...suitedList, ...all.filter(t => !isSuited(t))]
  return ordered.map(t => {
    const def = TREATMENTS[t]
    return { id: t, treatment: t, accent, font: def.font || '', ratio: def.ratio, label: def.label + (def.trial ? ' (trial)' : ''), note: def.note, suited: isSuited(t), trial: !!def.trial }
  })
}
