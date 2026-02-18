# Codex N-gram Test Architecture

## 1) Systemoversikt
Appen er en React (CRA) SPA der all runtime-logikk ligger i frontend.

Hovedflyt:
1. Bruker endrer søk/filter.
2. Frontend bygger query mot N-gram API.
3. Respons normaliseres til intern modell.
4. Datasett transformeres per grafmodus.
5. Graf rendres i Chart.js med zoom/pan.
6. Bruker kan eksportere/ dele via hash-lenke.

---

## 2) Kildekode-struktur

### `src/App.js`
- Overordnet state:
  - `query` (`terms`, `from`, `to`)
  - `settings` (grafmodus + visualiseringsinnstillinger)
  - `data`, `loading`, `error`
- Leser hash ved oppstart (`parseHash`).
- Henter data via `fetchNgramData`.
- Oppdaterer URL med `v2` hash.
- Setter `document.title` fra `APP_CONFIG.appName`.

### `src/components/SearchControls.js`
- Søkefelt + dropdowns for korpus/språk/grafmodus.
- Verktøymodal for smoothing, line width, alpha, palette, pattern, scale, period, case.
- Emiterer samlet `{ query, settings }` tilbake til `App`.

### `src/components/NgramChartRecharts.js`
- Chart.js line chart (via `react-chartjs-2`).
- Bruker `getChartModel(...)` for transformerte datasett.
- Zoom/pan via `chartjs-plugin-zoom`.
- Tooltip viser enhet (`%`, `ppm`, `frekvens`).
- Eksponerer `exportPng()` og `resetZoomToHome()` via `ref`.

### `src/components/AppHeader.js`
- App-header med navn, info-modal og delingsmeny.
- Eksport:
  - `.xlsx` (SheetJS)
  - `.png` (chart snapshot)
  - kopier delbar lenke

### `src/services/ngramProcessor.js`
- API-klient + timeout (`AbortController`).
- Bruker fast endpoint:
  - `https://api.nb.no/dhlab/nb_ngram/ngram/query`
- Mapper query-parametre og normaliserer respons til:
  - `{ dates: number[], series: { name, relative[], absolute[] }[] }`

### `src/services/legacyHash.js`
- Parser:
  - legacy hash (`#1_...`)
  - v2 hash (`#v2?...`)
- Bygger v2 hash med eksplisitte params.

### `src/services/chartTransforms.js`
- Datamodeller for graf:
  - mode-transform (`relative`/`absolute`/`cumulative`/`cohort`)
  - moving average
  - auto-skala (`%`/`ppm`)
  - fargepaletter + dash/marker-mønster

### `src/config.js`
- Prosjektspesifikk app-konfig:
  - `appName`
  - `shareBaseUrl` (valgfri)

---

## 3) API-kontrakt

### 3.1 Request
- Metode: `GET`
- Endpoint: `https://api.nb.no/dhlab/nb_ngram/ngram/query`
- Parametre:
  - `terms` (kommaseparert)
  - `lang`
  - `case_sens` (`0|1`)
  - `corpus` (`bok|avis`)
  - `mode` (`relative|absolutt`)
  - `smooth=1`
  - `from`, `to`

### 3.2 Response
- Forventet liste av serier:
  - `key`
  - `values[]` med `x`, `y`, `f`
- Normaliseres til intern datastruktur brukt i chart-laget.

---

## 4) URL- og delingsmodell

- Legacy hash støttes for bakoverkompatibilitet.
- Appen skriver alltid tilbake state som `v2` hash.
- Delbar URL bygges fra:
  - `REACT_APP_SHARE_BASE_URL` hvis satt
  - ellers nåværende origin + path.

---

## 5) Bygg og deploy

- `npm start`: lokal dev.
- `npm run build`: prod-build for `/codex_test`.
- `npm run build:nb`: alternativ build for `/ngram`.
- `npm run deploy`: build + publish til `gh-pages`.

---

## 6) Robusthetsvalg

- Request-timeout i API-lag.
- Deduplisering av identiske forespørsler i `App`.
- Click-after-zoom-beskyttelse i chart.
- CI-vennlig lint-strenghet i build.
