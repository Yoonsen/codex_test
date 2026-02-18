import { useEffect, useMemo, useState } from "react";

const LANG_OPTIONS = [
  { value: "nob", label: "Bokmal" },
  { value: "nno", label: "Nynorsk" },
  { value: "sme", label: "Samisk" },
  { value: "eng", label: "Engelsk" }
];

export default function SearchControls({ query, settings, onChange, onSubmit, onResetPeriod }) {
  const [localTerms, setLocalTerms] = useState((query.terms || []).join(", "));
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    setLocalTerms((query.terms || []).join(", "));
  }, [query.terms]);

  const languageDisabled = settings.corpus === "avis";
  const languageValue = languageDisabled ? "nor" : settings.language;

  const langList = useMemo(() => {
    if (settings.corpus === "avis") {
      return [{ value: "nor", label: "Norsk (fast for avis)" }];
    }
    return LANG_OPTIONS;
  }, [settings.corpus]);

  function emit(next) {
    onChange({
      query: {
        ...query,
        ...next.query
      },
      settings: {
        ...settings,
        ...next.settings
      }
    });
  }

  return (
    <section className="controls">
      <form
        className="search-row"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(localTerms);
        }}
      >
        <input
          type="text"
          placeholder="demokrati"
          value={localTerms}
          onChange={(e) => setLocalTerms(e.target.value)}
          aria-label="Sok etter ord"
        />
        <button type="submit">Sok</button>
        <button type="button" className="secondary" onClick={() => setToolsOpen(true)}>
          Verktoy
        </button>
      </form>

      <div className="quick-row">
        <label>
          Korpus
          <select
            value={settings.corpus}
            onChange={(e) =>
              emit({
                settings: {
                  corpus: e.target.value,
                  language: e.target.value === "avis" ? "nor" : settings.language
                }
              })
            }
          >
            <option value="bok">Bok</option>
            <option value="avis">Avis</option>
          </select>
        </label>

        <label>
          Sprak
          <select
            value={languageValue}
            disabled={languageDisabled}
            onChange={(e) => emit({ settings: { language: e.target.value } })}
          >
            {langList.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Grafmodus
          <select
            value={settings.graphType}
            onChange={(e) => emit({ settings: { graphType: e.target.value } })}
          >
            <option value="relative">Relativ</option>
            <option value="absolute">Absolutt</option>
            <option value="cumulative">Kumulativ</option>
            <option value="cohort">Kohort</option>
          </select>
        </label>
      </div>

      {toolsOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setToolsOpen(false)}>
          <div className="modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Verktoy</h2>
            <div className="grid-tools">
              <label>
                Utjevning
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={settings.smoothing}
                  onChange={(e) => emit({ settings: { smoothing: Number(e.target.value) } })}
                />
                <span>{settings.smoothing}</span>
              </label>

              <label>
                Linjetykkelse
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={settings.lineWidth}
                  onChange={(e) => emit({ settings: { lineWidth: Number(e.target.value) } })}
                />
                <span>{settings.lineWidth}</span>
              </label>

              <label>
                Transparens
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={settings.alpha}
                  onChange={(e) => emit({ settings: { alpha: Number(e.target.value) } })}
                />
                <span>{settings.alpha.toFixed(1)}</span>
              </label>

              <label>
                Fargepalett
                <select
                  value={settings.palette}
                  onChange={(e) => emit({ settings: { palette: e.target.value } })}
                >
                  <option value="standard">Standard</option>
                  <option value="colorblind">Fargeblind-vennlig</option>
                  <option value="bw">Sort/hvit</option>
                </select>
              </label>

              <label>
                Kurvemonstrer
                <input
                  type="checkbox"
                  checked={settings.pattern}
                  onChange={(e) => emit({ settings: { pattern: e.target.checked } })}
                />
              </label>

              <label>
                Akseskala
                <select
                  value={settings.scaleMode}
                  onChange={(e) => emit({ settings: { scaleMode: e.target.value } })}
                >
                  <option value="auto">Auto</option>
                  <option value="%">%</option>
                  <option value="ppm">ppm</option>
                </select>
              </label>

              <label>
                Fra
                <input
                  type="number"
                  min="1600"
                  max="2100"
                  value={query.from}
                  onChange={(e) => emit({ query: { from: Number(e.target.value) } })}
                />
              </label>

              <label>
                Til
                <input
                  type="number"
                  min="1600"
                  max="2100"
                  value={query.to}
                  onChange={(e) => emit({ query: { to: Number(e.target.value) } })}
                />
              </label>

              <label>
                Case-sensitiv
                <input
                  type="checkbox"
                  checked={settings.caseSensitive}
                  onChange={(e) => emit({ settings: { caseSensitive: e.target.checked } })}
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={onResetPeriod}>
                Zoom home
              </button>
              <button type="button" onClick={() => setToolsOpen(false)}>
                Ferdig
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
