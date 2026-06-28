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
node tools/screenshot.js /services.html   # or no arg = all pages
```

Then read the PNGs in `.review/` (e.g. `.review/services-html.desktop.png` and `…mobile.png`) — they come back as images you can inspect. Always check both desktop and mobile. The tool scrolls each page first so the `IntersectionObserver` reveal animations fire before capture (otherwise below-the-fold sections shoot blank). Full details in `DEV.md`.

## Architecture

Three standalone pages, each fully self-contained: `index.html`, `services.html`, `about.html`. Every page bundles its **own** inline `<style>` and `<script>` — there is no shared CSS/JS file. The same design system (the `:root` CSS variables, `nav`, `mobile-menu`, and `footer` blocks) is **duplicated** in each file.

Consequence: a change to shared chrome (nav links, footer, color tokens, fonts) must be applied to all three HTML files to stay consistent. There is no include mechanism in use even though the site runs on Jekyll.

Key conventions, kept identical across pages:
- **Design tokens** live in `:root` (navy/blue palette, `--nav-h`, borders). Reuse these variables rather than hardcoding colors.
- **Fonts**: `Space Grotesk` for headings/brand, `Inter` for body, loaded from Google Fonts.
- **Nav**: fixed top bar with a `#hamburger` button toggling `#mobile-menu` below 860px; nav background darkens on scroll via inline JS.
- **Animations**: an `IntersectionObserver` fades elements in on scroll.
- The **contact form** (`#contact-form` on `index.html`) is **front-end only** — it fakes a submit with `setTimeout` and shows `#form-success`. It does not send anything. Wiring up real delivery requires adding a backend/form service.

## When adding or renaming pages

Keep these in sync manually:
- `sitemap.xml` — list each page URL under the `hwfl850.github.io/citadel-digital` domain, with `lastmod`.
- `robots.txt` — references the sitemap.
- Nav links and footer links in **all three** HTML files.
- The Jekyll front matter (`title`, `description`) at the top of each new HTML file.

## Assets

`logo.png`, `logo-icon.png`, `favicon.png` live at repo root; team photos go in `images/team/`.
