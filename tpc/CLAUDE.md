# Rene Herse Tire Pressure Calculator

WordPress plugin providing interactive tire calculators. One codebase, two shortcodes, each
intended for its own page:

| Shortcode | Tabs |
| --- | --- |
| `[tire_pressure_calculator]` | Simple · Pro |
| `[tire_finder]` | Tire Finder · How Wide Should I Run? · Will It Fit? |

## Project structure

- `tire-pressure-calculator.php` — plugin entry point. Version number lives here, along with
  `RHC_TPC_TAB_LABELS` (slug → visible label) and `RHC_TPC_SHORTCODES` (shortcode → tab list).
- `templates/shell.php` — tab nav + panel wrappers, driven by a `$tabs` array
- `templates/partials/tab-{slug}.html` — one panel body per tab, **plain HTML, no PHP**
- `tire-pressure-calculator/assets/` — CSS and JS, shared by both shortcodes
- `tools/build-static.mjs` — dev-only generator for the standalone preview pages
- `tools/build-catalog.mjs` — regenerates the tire catalog in the JS from the spreadsheet
- `tools/xlsx-read.mjs` — minimal dependency-free .xlsx reader used by the above
- `Tire Catalog.xlsx` — Jan's tire data, the source of truth for the Tire Finder
- `index.html`, `calculator.html`, `finder.html` — **generated**, do not hand-edit
- `composer.json` — declares the Plugin Update Checker dependency
- `.github/workflows/release.yml` — builds the plugin ZIP and publishes the GitHub Release

## Adding or changing a tab

Panel markup exists in exactly one place — `templates/partials/`. Both the plugin and the
standalone preview pages read those files, so there is nothing to keep in sync by hand.

1. Add/edit `templates/partials/tab-{slug}.html`.
2. Register the slug and its label in `RHC_TPC_TAB_LABELS`, and add it to the right shortcode
   in `RHC_TPC_SHORTCODES`.
3. If the tab has inputs, give it a state prefix in the JS — `TAB_PREFIX`, `TAB_IDS`, `state`,
   and the `onField` wiring in the init block. Tabs with no inputs map to `null`.
4. Run `node tools/build-static.mjs` and commit the regenerated HTML.

The partials are plain HTML precisely so the generator can inline them; keep PHP out of them.
If a partial ever genuinely needs PHP, the generator has to learn to strip it.

The JS must tolerate any tab being absent, since the two shortcodes render different subsets.
Guard shared helpers with null checks; `liveCalc()` is the single gate that stops a calculator
running for a tab that isn't on the page.

## The tire catalog

`Tire Catalog.xlsx` is the source of truth for which tires exist. Jan maintains it; the
`TIRE_CATALOG` array in the JS is **generated from it** and sits between two markers:

```
// ── BEGIN GENERATED CATALOG — do not edit by hand ──
// ── END GENERATED CATALOG ──
```

After Jan sends a new spreadsheet, drop it in as `Tire Catalog.xlsx` and run:

```
node tools/build-catalog.mjs
node tools/build-static.mjs      # the preview pages embed the same JS
```

The generator validates as it reads — unknown tread names, non-numeric or implausible
baselines, bad Y/N values, a tire with no casings, duplicate model+tread within a wheel size.
On any problem it writes nothing and lists what to fix, so a typo in the sheet can't reach the
site silently. Rows with a single populated cell are skipped, which is how Jan's trailing
provenance note survives without tripping it.

The sheet is located by its **headers**, not its tab name — Excel truncates long tab names
to 31 characters and a Save As can rename it, so the first sheet carrying the required
columns wins. Column order doesn't matter either; columns are looked up by name.

Three columns feed the rider-facing name, all verbatim from the sheet:

- **Wheel Size** doubles as the dropdown label, so it appears exactly as typed — `26"`,
  `650B`, `700C / 29"`. `sizePrefix()` takes the part before any ` / ` for tire names, so
  `700C / 29"` becomes `700C x 26 mm Cayuse Pass`. It must be spelled identically on every
  row of a size or the menu gets duplicate entries; the generator warns on near-misses.
- **Nominal Size** is the size in the name: `700C x 32 mm Stampede Pass`.
- **Nominal Size 2** is the parenthetical, printed verbatim, blank meaning none. It is
  fixed per tire on purpose (Jan, 19 Aug): Naches Pass reads `(42 mm)` whether or not the
  rider picked tubeless, even though the tire measures 41–43 depending on casing. The
  measured figure has its own row in the result card.

Pressure is still calculated from the derived width, never from these strings.

A tire's measured width is built up in this order, and only the first step is optional:

```
baseline
  + max(0, rim width − design rim) × 0.3     rim field blank ⇒ this term is zero
  × 1.03  if Extralight
  × 1.01  if tubeless
```

## Result-card browsing

The Tire Finder's Go wider / Go narrower buttons walk `state.tf.ladder`, every tire in the
chosen wheel size ordered by measured width. `state.tf.browse` holds the tire the rider
stepped to; it overrides the recommendation until any input changes, which is why the tab's
fields are wired through `onTfField()` rather than `onField()`. Stepping can land on a tire
of the same width but a different tread — that is deliberate, it is how a rider sees the
casing and tread alternatives rather than only a different number.

## Standalone preview pages

`index.html` (a link hub), `calculator.html`, and `finder.html` are generated by
`node tools/build-static.mjs` and are **not** part of the released plugin — the release
workflow copies an explicit allowlist that excludes the repo root. They exist for local testing
and for sending to Jan and his partners. Regenerate them after any template change.

## Releasing a new version

**Never build or upload the ZIP manually.** The GitHub Actions workflow handles it — it runs `composer install`, packages the ZIP with the `vendor/` folder included, and attaches it to the release. Skipping this produces a broken plugin that fails to activate.

The correct process:

1. Update the version number in `tire-pressure-calculator.php` (two places: the header comment and the `RHC_TPC_VERSION` constant).
2. Commit and push the version bump.
3. Tag the commit and push the tag — the workflow fires automatically.

In practice, just say: **"Bump the version to X.X.X, tag it, and push the tag to trigger the release workflow."**
