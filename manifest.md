# Codex N-gram Test Manifest

## Formål
`codex_ngram_test` er en lett, klientbasert N-gram-app for å utforske ordbruk over tid.  
Den skal være enkel å bruke uten forkunnskaper, men fortsatt nyttig for mer avansert utforsking.

## Kjerneverdi
- Gjør tidsserier for ordbruk lesbare og sammenlignbare.
- Prioriterer rask interaksjon (søk, zoom, deling, eksport).
- Holder funksjoner tydelige og forklarbare i UI.

## Primære brukeroppgaver
1. Søke etter ett eller flere ord (kommaseparert).
2. Bytte korpus, språk og grafmodus.
3. Zoome i tid og gå tilbake til definert home-periode.
4. Tolke verdier med tydelig enhet (`%`, `ppm` eller frekvens).
5. Dele resultater via lenke, PNG eller Excel.

## Funksjonskrav
- Søkefelt med placeholder `demokrati`.
- Korpus: `bok` / `avis`.
- Språkvalg (for `avis` brukes fast `nor`).
- Grafmodi:
  - `relative`
  - `absolute`
  - `cumulative`
  - `cohort`
- Grafverktøy:
  - utjevning
  - linjetykkelse
  - transparens
  - fargepalett
  - kurvemønster
  - akseskala (`auto` / `%` / `ppm`)
  - periode (`from` / `to`)
  - case-sensitivitet
- Deling/eksport:
  - `.xlsx`
  - `.png`
  - delbar hash-lenke

## UX-prinsipper
- Tydelige standardvalg og få nødvendige klikk.
- Stabil zoom/pan uten overraskende hopp.
- Synlig enhet i både akse og tooltip.
- Ikke bare farge for kurveskille (også mønster/markør).

## Oppstart
- Første visning bruker standardordet `demokrati`.
- Inputfeltet starter tomt slik at bruker kan skrive direkte.

## Lenker og kompatibilitet
- Støtte for to hash-formater:
  1. legacy-format (`#1_...`)
  2. nytt `v2`-format (`#v2?...`)
- Appen bygges primært for URL-base: `/codex_test` (GitHub Pages for dette repoet).

## Leveransekrav
- Build skal passere i CI-modus (warnings behandles som feil).
- Appen skal fungere på desktop og mobil.
- GitHub Pages-deploy skal være mulig med eksisterende scripts.

## Ikke-mål i denne iterasjonen
- Full testpakke.
- Egen backend i repo.
- Brukerprofiler/personalisering.
