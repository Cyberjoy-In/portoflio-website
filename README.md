# Joy Halder — Portfolio

An interactive dark/3D portfolio site built from Joy Halder's resume.

## Structure
- `index.html` — the site (HTML, CSS, JS in one file)
- `assets/img/` — profile photo, cyber-awareness camp photos, cyber PS internship photo, and organization logos
- `assets/resume.pdf` — downloadable resume (linked from the "Download Resume" buttons)

## Usage
Open `index.html` directly in a browser, or deploy the whole folder as-is to any static host — no build step needed.

### Deploying on Vercel
1. Push this folder to a GitHub repo (keep `index.html` and `assets/` at the repo root).
2. Import the repo in Vercel.
3. Framework preset: **Other**. Leave build command and output directory empty/default — it's a static site.
4. Deploy. Images load via the relative `assets/img/...` paths, so nothing else is needed.
