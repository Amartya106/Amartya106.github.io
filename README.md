# amartya106.github.io

Personal portfolio — robotics, robot learning, computer vision and control.

Live at **https://amartya106.github.io**

## Stack

Plain HTML, CSS and vanilla JavaScript. No build step, no dependencies, no
package manager. Push to `main` and GitHub Pages serves it directly.

## Structure

```
index.html                          Home — hero, focus areas, featured work, contact
projects/index.html                 All projects, filterable by topic
projects/uno-q-vision-servo/        Case study
projects/chair-occupation/          Case study
projects/rl-cartpole-dqn/           Case study
about/index.html                    Background, toolkit, reading list
404.html                            Not-found page
assets/css/main.css                 The entire stylesheet
assets/js/main.js                   Theme toggle, filtering, scroll reveal
assets/img/projects/                Media pulled from the project repos
sitemap.xml, robots.txt             SEO
```

## Local preview

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

A server is needed rather than opening the file directly, because internal links
are root-relative (`/projects/`).

## Adding a project

1. Drop a thumbnail in `assets/img/projects/`.
2. Copy an existing `<article class="card">` block in `projects/index.html`.
3. Set `data-tags` to any of: `robotics`, `rl`, `vision`, `control`, `embedded`.
   These drive the filter buttons.
4. Update the count in `<p class="filter-count">` and, if it's a case study, add
   the URL to `sitemap.xml`.

For a full case study, copy an existing directory under `projects/` and replace
the content inside `<div class="wrap wrap-narrow prose">`.

## Theming

All colours are CSS custom properties defined at the top of `main.css`:
`:root` holds the dark palette, `[data-theme="light"]` overrides it. The accent
colour appears in exactly two places (`--accent`, `--accent-text`) plus
`assets/img/favicon.svg` and the `theme-color` meta tag on each page.
