# Changelog

## 2.0.0 — 2026-11-01

- Add a private batch worksheet for up to 50 independently configured analyte/value/unit conversions, with add-current, remove, clear, and UTF-8 CSV export.
- Validate every row and refuse partial exports; preserve unrounded numeric results, canonical unit labels, and the active prolactin assay factor in CSV.
- Keep worksheet inputs in page memory only, outside local storage and share URLs.
- Isolate service-worker cache cleanup from other apps on the same origin, cache navigation under the correct page, and avoid caching failed HTTP pages or value query strings.
- Add a dependency-free Node package manifest and regression tests. Existing formulas and clinical reference data are unchanged.
