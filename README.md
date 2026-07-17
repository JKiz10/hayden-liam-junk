# hljunkremovalandhauling.com

The website for **H&L Junk Removal & Hauling Solutions, LLC** — League City, TX.

Plain HTML and CSS. **No build step, no npm, no framework.** Edit a file, push to `main`, and it is live in about 45 seconds. That is deliberate: the site loads fast, ranks well, and cannot break because a dependency updated.

---

## How it goes live

GitHub Pages serves `main` from the repo root. Pushing to `main` deploys. There is nothing to run and nothing to build.

- Custom domain lives in `CNAME` (do not delete that file)
- Deploys show up under the repo's **Actions** tab as *"pages build and deployment"*

---

## Layout

Every page is a folder with an `index.html` inside it. That is what makes the URLs clean:

```
dumpster-rental-league-city-tx/index.html  ->  /dumpster-rental-league-city-tx/
```

**A folder without an `index.html` is a live 404.** The link checker below catches that.

| Path | What it is |
|---|---|
| `index.html` | Homepage. Has its own inline CSS (it is the only page that does). |
| `city.css` | Shared stylesheet for the other ~40 pages |
| `book/` | Dumpster booking request form |
| `terms/` | Rental terms. Also the terms URL required for text-message registration. |
| `privacy-policy/` | Privacy policy |
| `dumpster-rental-*/` | Dumpster rental pages (4 cities + the process page) |
| `junk-removal-*/` | City pages |
| `*-removal-*/`, `*-cleanout-*/` | Service pages |
| `blog/` | Guides |
| `gallery.html` | Job photos |
| `images/work/` | Real job photos (jpg + webp) |
| `sitemap.xml`, `robots.txt`, `llms.txt` | For Google and AI crawlers. Must stay at the root. |
| `2d47f1890b2521c7e1e9f2334c05550e.txt` | IndexNow key. Do not rename or delete. |
| `google833062a98901d628.html` | Google Search Console verification. Do not delete. |

---

## Editing a stylesheet

`city.css` is linked as `/city.css?v=2`. **If you change `city.css`, bump that number** (`?v=3`) everywhere it appears, or returning visitors keep the old cached version and your change appears to do nothing.

---

## Link checking

`.github/workflows/link-check.yml` runs on every push and weekly. It fails if any internal link points at a page that does not exist, or if a folder is missing its `index.html`.

**It cannot break the live site.** Pages deploys on its own separate run. A failure here is a red X and an email, nothing more.

To run the same check locally (needs [lychee](https://github.com/lycheeverse/lychee)):

```sh
lychee --no-progress --root-dir "$(pwd)" --index-files index.html --offline './**/*.html'
```

Known gap: lychee does not verify `tel:` or `sms:` links. There are ~240 `tel:` links on this site and they are the main way customers convert, so if the phone number ever changes, grep for it rather than trusting CI:

```sh
grep -ro '8324257749' --include='*.html' . | wc -l
```

---

## House rules for content

These are not style preferences, they are business rules. Breaking them costs money or creates legal exposure.

- **Junk removal is never priced on the site.** Free quotes only. No "starting at," no ranges.
- **Dumpster rental IS priced**, because it is a fixed product: **$399 for 3 days, $475 for 7 days.** Extra days $100/day past the term booked.
- **Never advertise the $100/day extra-day fee.** You do not headline a penalty.
- Say **"fully insured."** Never say "licensed."
- **Oswald is the only font.** Special Elite was removed sitewide and must not come back.
- **No em dashes.** Write short and human, not corporate.
- Never invent reviews, ratings, or business hours.

---

## Where the rest of it lives

Business context, ad assets, SEO audits, and SOPs are in `~/Downloads/H&L Junk Removal/`, not in this repo. This repo is the website only.
