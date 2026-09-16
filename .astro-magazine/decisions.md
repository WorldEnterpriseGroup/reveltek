# Editorial and engineering decisions

## 2026-09-16 — commission mode stays `full_publication` (adoption context recorded elsewhere)

`commission.json` / `scope.json` keep `mode: full_publication` deliberately.
The commission schema (`schemas/commission.schema.json`) allows only
`full_publication | focused_production | audit` — there is no `adoption` mode,
so renaming would break schema validation. The adoption context is already
captured where the contracts expect it: `checkpoint.json` (`commission:
"existing_site_adoption_focused_production"`), the adoption record and route
baseline under `.astro-magazine/adoption/`, and the verify-complete evidence.
No editorial 150-article / 8-brief program is implied for this migration; the
inherited target counts are scaffold defaults, not a work order.

