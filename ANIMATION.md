# Animatie-grammatica

Eén consistente "stem" voor alle beweging op de site. Wijk hier alleen van af met
een goede reden — en documenteer die dan in de component.

## Eén ease-curve

`cubic-bezier(0.16, 1, 0.3, 1)` — een expo-out: snel weg, zacht landen. In
motion/react: `ease: [0.16, 1, 0.3, 1]`. (Er is ook `[0.22, 1, 0.36, 1]` in
omloop — vrijwel identiek; nieuwe code gebruikt `[0.16, 1, 0.3, 1]`.)

## Duren

| Soort                          | Duur        |
|--------------------------------|-------------|
| Entrance / reveal-in           | 0.4–0.6s    |
| Micro-interactie (hover, nudge)| ~0.2s       |
| Route-transitie                | ~0.22–0.28s |
| Crossfade tussen views         | ~0.3s       |

Op touch (`pointer: coarse`) korten reveals automatisch in (zie hieronder).

## Reveal-conventie (belangrijk)

Een `motion.*` met `initial={{ opacity: 0, ... }}` + `whileInView`/`animate`
moet **`data-reveal-on-scroll=""`** op het element hebben **én** `style={{ opacity: 0 }}`
in de SSR-markup. Reden:

- Zonder de inline `style` rendert de server het element zichtbaar; bij hydratie
  springt het naar `opacity:0` en animeert pas daarna in → leest als geflikker.
- `globals.css` zet onder `@media (pointer: coarse)` `[data-reveal-on-scroll]`
  meteen op `opacity:1; transform:none` → op de telefoon staat alles direct in
  beeld (geen lege secties tot de JS laadt, geen geschokte reveals tijdens scroll).
  Dat doen we met CSS i.p.v. een JS-touch-check, want JS-detectie geeft een
  hydratie-mismatch en dus alsnog een flits.

Gebruik bij voorkeur de gedeelde primitieven (`MountReveal`, `RevealOnScroll`,
`AnimatedHeading`) — die regelen dit al. Ad-hoc `motion.div`'s alleen als het echt
moet, en dan met `data-reveal-on-scroll` + SSR-`opacity:0`.

## Reduced-motion

Elke `motion.*` honoreert `useReducedMotion()`: bij `reduce` óf geen animatie
(plain element), óf alleen opacity (geen transform). Tekst-decode/scramble,
confetti, count-ups, cycling-pills, pulserende dots: alles stil onder reduced-motion.

## Ambient-budget

Max **2 doorlopende (ambient) animaties tegelijk per scherm** — bv. de hero-halos +
één scripted mockup-tick. Op mobiel: `globals.css` killt al `wb-mesh-conic`,
`animate-ping`, en `blur-2xl/3xl`-filters op `pointer: coarse`. Geen nieuwe
`repeat: Infinity` buiten transient laadschermen (`PortalLoader`).

## De primitieven

| Component            | Wat                                                      |
|----------------------|----------------------------------------------------------|
| `MountReveal`        | fade+lift bij eerste paint (above-the-fold)              |
| `RevealOnScroll`     | fade+lift wanneer in beeld gescrold                      |
| `AnimatedHeading`    | heading woord-voor-woord, stagger gecapt op ~0.22s       |
| `Eyebrow`/`ScrambleText` | mono `// label`, decode-effect (alleen non-touch)    |
| `FlashCounter`       | getal telt op bij in-view (alleen non-touch)             |
| `RouteTransition`    | portal/admin route-change fade+lift                      |
| marketing `template.tsx` | marketing route-change fade+slide                    |
| `MagneticButton`     | magnetisch hover-effect op CTA's                         |
| `ConfettiBurst`      | eenmalige celebration (livegang, intake-submit)          |
| `Shimmer`            | skeleton-loader-shimmer                                   |
| `Spinner`            | inline spinner                                            |
| `LivePulse`          | groen status-dotje dat pulseert wanneer in beeld         |
| `RotatingPill`/`RotatingWords`/`AvailabilityPill`/`QuoteMarkDraw` | overige kleine effecten |
