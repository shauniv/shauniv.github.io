# Rene Herse Tire Pressure Calculator

WordPress plugin providing an interactive tire pressure calculator via the `[tire_pressure_calculator]` shortcode.

## Project structure

- `tire-pressure-calculator.php` — plugin entry point (version number lives here)
- `templates/calculator.php` — calculator HTML rendered by the shortcode
- `tire-pressure-calculator/assets/` — CSS and JS
- `index.html` — standalone HTML version (mirrors `templates/calculator.php`)
- `composer.json` — declares the Plugin Update Checker dependency
- `.github/workflows/release.yml` — builds the plugin ZIP and publishes the GitHub Release

## Releasing a new version

**Never build or upload the ZIP manually.** The GitHub Actions workflow handles it — it runs `composer install`, packages the ZIP with the `vendor/` folder included, and attaches it to the release. Skipping this produces a broken plugin that fails to activate.

The correct process:

1. Update the version number in `tire-pressure-calculator.php` (two places: the header comment and the `RHC_TPC_VERSION` constant).
2. Commit and push the version bump.
3. Tag the commit and push the tag — the workflow fires automatically.

In practice, just say: **"Bump the version to X.X.X, tag it, and push the tag to trigger the release workflow."**
