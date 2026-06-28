# Local preview & UI review

This site deploys to GitHub Pages (Jekyll). Each `.html` file starts with a
`---` Jekyll front matter block. The tooling here lets you render the site
locally and review the UI visually — including from Claude Code agents — without
needing Ruby/Jekyll installed.

## One-time setup

```bash
npm install
npx playwright install chromium
```

## Preview the site in a browser

```bash
npm run serve            # → http://localhost:4000
npm run serve -- 8080    # custom port
```

The preview server (`tools/serve.js`) serves the repo statically and strips the
Jekyll front matter on the fly, so pages render exactly as they do in
production. Pages: `/`, `/services.html`, `/about.html`.

## Capture screenshots for review

```bash
npm run review                       # all pages, desktop + mobile
node tools/screenshot.js /services.html   # specific page(s)
```

Output goes to `.review/` as PNGs (e.g. `home.desktop.png`,
`services-html.mobile.png`). The screenshot tool boots the server on an
ephemeral port, scrolls each page top-to-bottom to trigger the
`IntersectionObserver` reveal animations (so below-the-fold sections aren't
captured blank), then writes a full-page shot at desktop (1440px) and mobile
(390px) widths.

`.review/` is git-ignored — it's a scratch output folder.

## The agent UI-review loop

When working on the UI, an agent should:

1. **Make** the HTML/CSS change.
2. **Capture** the affected page: `node tools/screenshot.js /services.html`
3. **Look** at the result by reading the PNG back (e.g. read
   `.review/services-html.desktop.png`) — the image is returned visually.
4. **Judge** against the request and iterate. Check both `.desktop.png` and
   `.mobile.png` for responsive issues.

This closes the loop: the agent sees its own rendered work instead of guessing
from source. Reviewing both viewports catches layout breaks; the scroll pass
ensures animated/revealed content is actually visible in the shot.

### Notes
- Full-page screenshots render the sticky nav at its scrolled position, so it
  may overlap the hero in the image. That's a capture artifact, not a site bug.
- The preview server has no live-reload — re-run the screenshot command after
  each change.
