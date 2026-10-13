# Shanthi Productions: cinematic preloader + website

Open `index.html` in a browser (or serve the folder with any static server). No build step.

```
index.html
css/style.css      preloader styles, 6.0 s timeline keyframes, website styles
js/script.js       SITE_CONFIG (contact details), preloader controller, nav, contact form
assets/            SVG equipment + strips, grain.png, 6 placeholder thumbnails
```

## Preloader
- The supplied reference is copied to `assets/preloader-reference.mp4` and played directly, preserving its exact visuals and timing.
- The video is muted and inline; the site fades in after playback. If playback is unavailable, the animated SVG version plays as a fallback.
- Visitors who prefer reduced motion see the static brand ident instead of the video.

## Things to know
- The SVG equipment and strips remain in `assets/` for the animated fallback. Swap any file in `assets/` for your own artwork using the same filename and keep the same proportions.
- The reference has an audio track; it is muted during playback.
- Fonts (Cinzel, Jost, Dancing Script) load from Google Fonts; the preloader waits up to 2.5 s for them and then continues with fallbacks. Self-host them if you need offline use.
- The preloader waits for its media and fallback images, never waits longer than 8 s for assets, runs once per page load, and shows a static final ident for visitors with reduced motion enabled.
- Website copy (About, services) is proposed text. Work tiles are labelled placeholders.
- Contact details are empty by default. Fill in `SITE_CONFIG` at the top of `js/script.js`. Until an email is set, the form explains that it is not connected yet; once set, it opens the visitor's email app.
