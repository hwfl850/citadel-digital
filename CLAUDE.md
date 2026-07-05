# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static marketing website for Citadel Digital (website design + digital automation agency). It is a small multi-page site served by **GitHub Pages with Jekyll**, deployed at `https://hwfl850.github.io/citadel-digital/`.

There is no build system, package manager, test suite, or linter. The only "build" is GitHub Pages rendering the Jekyll front matter on push to the default branch.

## Local preview & UI review

Use the bundled Node tooling (setup: `npm install && npx playwright install chromium`):

```bash
npm run serve            # live preview → http://localhost:4000
```

`tools/serve.js` serves the site and **strips the Jekyll front matter on the fly**, so pages render exactly as on GitHub Pages — no Ruby/Jekyll needed.

**Reviewing visual changes (do this for any UI work):** after an HTML/CSS edit, capture and look at the rendered result instead of guessing from source:

```bash
npm run review                            # all pages, desktop + mobile
node tools/screenshot.js /services.html   # specific page(s)
```

Then read the PNGs in `.review/` (e.g. `.review/services-html.desktop.png` and `…mobile.png`) — they come back as images you can inspect. Always check both desktop and mobile. The tool scrolls each page first so the `IntersectionObserver` reveal animations fire before capture (otherwise below-the-fold sections shoot blank). Full details in `DEV.md`.

## Architecture

Three standalone pages, each fully self-contained: `index.html`, `services.html`, `about.html`. Every page bundles its **own** inline `<style>` and `<script>` — there is no shared CSS/JS file. The design system (`:root` CSS variables, `nav`, `mobile-menu`) is **duplicated** in each file.

Consequence: a change to shared chrome (nav links, footer, color tokens, fonts) must be applied to all three HTML files to stay consistent. There is no include mechanism in use even though the site runs on Jekyll.

Shared across all pages:
- **Design tokens** live in `:root` (dark "ink" palette `--ink`/`--ink-2`/`--ink-3`, one `--accent` blue, hairline `--line` borders, `--nav-h`, plus `--serif`/`--mono` font vars). Reuse these variables rather than hardcoding colors.
- **Fonts**: `Geist` for body/UI, `Geist Mono` for eyebrows/labels/indices/footer copy, `Instrument Serif` italic for single accent words in headings (the `em` inside `h1`/`.section-title`/etc.), loaded from Google Fonts.
- **Icons**: inline SVG line icons (1.5px stroke, `currentColor`) — no emoji, no icon font. The same globe/share/phone/calendar icons are duplicated on index and services; keep them in sync.
- **Eyebrows**: mono uppercase labels with a 6px accent square rendered via `::before`.
- **Nav**: fixed top bar with a `#hamburger` button toggling `#mobile-menu` below 860px. Subpages mark the current page's nav link with `class="active"`; index doesn't.
- **Hamburger/mobile-menu JS** (toggle + click-outside close) is the only script all three pages share.

Index-only behavior (not present on services/about):
- Nav background darkens on scroll via inline JS.
- Smooth-scroll handler for `#` anchors with a fixed-nav offset.
- An `IntersectionObserver` fades in the `.svc-row` service ledger rows on scroll (this is what the screenshot tool's scroll pass exists for).
- The **contact form** (`#contact-form`) is **front-end only** — it fakes a submit with `setTimeout` and shows `#form-success`. It does not send anything. Wiring up real delivery requires a backend/form service, and note the inputs currently have `id`s but **no `name` attributes**, which most form services require.

Two footer variants: `index.html` has the full 3-column footer (brand blurb, Company/Legal columns, social links); `services.html` and `about.html` share a compact single-row footer. A footer change usually means editing both variants.

### Cross-page anchor contract

These IDs are link targets from other pages — renaming them breaks navigation:
- `index.html#contact` — linked from every page's "Free Consultation" CTA and footers.
- `services.html#web`, `#social`, `#phone`, `#scheduling` — linked from the homepage service ledger rows.

### Page inventory

| Page | Sections |
|---|---|
| `index.html` | Hero → `#services` ledger (4 rows linking to services.html anchors) → `#contact` (info + fake form) → full footer |
| `services.html` | Page header → 4 `.service` articles (`#web`, `#social`, `#phone`, `#scheduling`) with pill-style `.service-points` → CTA → compact footer |
| `about.html` | `#story` (story text + founder `.team-card`s for Henry White and Keller Leonard) → compact footer |

## When adding or renaming pages

Keep these in sync manually:
- `sitemap.xml` — list each page URL under the `hwfl850.github.io/citadel-digital` domain, with `lastmod`.
- `robots.txt` — references the sitemap.
- Nav links and footer links in **all three** HTML files.
- The Jekyll front matter (`title`, `description`) at the top of each new HTML file.

## Assets & special files

- `logo.png`, `logo-icon.png`, `favicon.png` live at repo root. Pages use `logo-icon.png` for nav/footer branding.
- Team photos go in `images/team/` as `henry-white.jpg` and `keller-leonard.jpg` — **currently absent**. `about.html` falls back to initials placeholders via an inline `onerror`; dropping in files with those exact names lights up the photos with no code change.
- `google331efa24cc9c6714.html` is the Google Search Console verification file — do not delete or rename it.
- `.review/` (screenshot output) and `node_modules/` are git-ignored scratch/dependency dirs.

## Known placeholders

- Footer "Privacy Policy", "Terms of Service", and social links on `index.html` are `href="#"` stubs.
- Contact email is `hello@citadeldigital.com`; the contact form does not actually deliver (see above).
