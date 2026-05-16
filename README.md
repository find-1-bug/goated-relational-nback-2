# GOATED Relational n-Back

A working-memory training app focused on **abstract relationships** instead of
single-item n-back. Match the *type* of relationship from N trials ago — spatial,
trait, quantitative, verbal, sound, complex composites, or fully nonverbal RINT.

Built with React + Vite + Tailwind + Three.js. Runs entirely client-side, stores
sessions in `localStorage`. No accounts, no backend, no tracking.

## Run locally

```bash
npm install
npm run dev
```

App starts at http://localhost:5173. Sessions and settings persist in the
browser. Use Stats → Export to back up your data, Import to restore.

## Build

```bash
npm run build       # outputs to dist/
npm run preview     # serve the built bundle on http://localhost:4173
```

The build uses a relative `base: './'` so it works on any host path —
GitHub Pages user site, project site, custom domain, file:// — with no rebuild.

## Deploy to GitHub Pages

This repo ships with a GitHub Actions workflow at
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) that builds and
publishes to GitHub Pages on every push to `main`.

1. Create a GitHub repo and push this project to it (`main` branch).
2. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` — the **Deploy to GitHub Pages** workflow will run and
   publish to `https://<your-user>.github.io/<repo-name>/`.

The router uses **HashRouter**, so deep links (`/#/stats`, `/#/review/abc`) work
on Pages without any rewrite rules. The workflow also copies `index.html` to
`404.html` for good measure.

### Local-only data is yours

Everything you produce — sessions, settings, your customised mode mix — is in
`localStorage` under keys `nback_sessions` and `nback_settings`. The Stats page
has Export / Import buttons (JSON) so you can sync across devices.

## What's in the box

- **Seven relationship categories** — Spatial · Spatial 3D · Trait · Quant · Verbal · Sound · Complex (composite scan-for-difference).
- **Type N-Back**, **Relational Integration (RINT)**, **Nonverbal RINT** (cross-attribute composite), **Mixed**, **Mixed RINT**, **Impossible** (per-stream random rule), **Binary Logic** (AND / OR / XOR / AND-NOT on two n-back signals), **Hierarchical** (category-of-relation n-back).
- **Alien Cube / Square / Tesseract** — relations rendered inside a rotating 3×3×3 cube, 3×3 grid, or 4D tesseract projection; position is its own answerable axis.
- **Variable N**, **Adaptive N**, **Distractors**, **Per-trial Feedback**.
- **Multi-stream**: up to 20 simultaneous independent streams with optional carousel pagination.
- **Stats + Review**: every trial is recorded; replay any session stimulus-by-stimulus.

## Credits

Originally scaffolded on Base44, ported off and made standalone. Thanks to
@Grapist for the feedback that drove most of the recent additions (3-pair
complex relations, nonverbal RINT, per-trial feedback, alien-cube panel bug).
