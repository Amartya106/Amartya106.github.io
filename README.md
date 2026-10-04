# amartya106.github.io

Personal portfolio — robotics, robot learning, computer vision and control.

Live at **https://amartya106.github.io**

## Stack

Plain HTML, CSS and vanilla JavaScript. No build step, no JS dependencies, no
package manager (fonts load from Google Fonts). Push to `main` and GitHub Pages serves it directly.

## Structure

```
index.html                          Notebook front page: statement, Fig. 1 live sim, work index, lab log
projects/index.html                 Index of all work, filterable by topic, with status markers
projects/<slug>/index.html          Case studies (manipulator-rl, px4-rotor-failure, safe-rl-nav,
                                    slam-nav-mecanum, rl-cartpole-dqn, chair-occupation, uno-q-vision-servo)
about/index.html                    Background, toolkit, reading
404.html                            Not-found page
assets/css/main.css                 The entire stylesheet (paper/ink tokens, margin notes, booktabs tables)
assets/js/main.js                   Theme toggle and project filtering
assets/js/swarm.js                  Fig. 1: multi-agent consensus/formation demo (canvas, no deps)
assets/img/projects/                Figures pulled from the project repos
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

1. Copy an existing directory under `projects/` and edit the content inside
   `<div class="prose">`.
2. Add a row to `projects/index.html`: copy an `<li data-tags="...">` entry and set
   `data-tags` to any of `rl`, `control`, `robotics`, `vision`, `embedded` (these
   drive the filter buttons). Update the count in `<p class="filter-count">`.
3. Add the URL to `sitemap.xml`.

Status markers: `st-result` (has numbers), `st-wip` (in progress), `st-design`
(team work, foundations).

Margin notes use the checkbox pattern: a `<label class="sn-toggle">`, an
`<input class="sn-cb">` and a `<span class="sidenote">`, with a unique `id` per note.

## Theming

Colours are CSS custom properties at the top of `main.css`: `:root` holds the
paper palette and `:root[data-theme="dark"]` the graphite one. The accent appears
as `--accent` and in `assets/img/favicon.svg`.
