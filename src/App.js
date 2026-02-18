import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import AppHeader from "./components/AppHeader";
import NgramChartRecharts from "./components/NgramChartRecharts";
import SearchControls from "./components/SearchControls";
import { APP_CONFIG } from "./config";
import { getChartModel } from "./services/chartTransforms";
import { buildV2Hash, parseHash } from "./services/legacyHash";
import { fetchNgramData } from "./services/ngramProcessor";

const CURRENT_YEAR = new Date().getFullYear();

const DEFAULT_SETTINGS = {
  graphType: "relative",
  corpus: "bok",
  language: "nob",
  caseSensitive: false,
  smoothing: 1,
  scaleMode: "auto",
  lineWidth: 2,
  alpha: 0.9,
  palette: "standard",
  pattern: false
};

export default function App() {
  const [query, setQuery] = useState({ terms: [], from: 1810, to: CURRENT_YEAR });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [data, setData] = useState({ dates: [], series: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [homePeriod, setHomePeriod] = useState({ from: 1810, to: CURRENT_YEAR });

  const chartRef = useRef(null);
  const requestKeyRef = useRef("");

  useEffect(() => {
    const parsed = parseHash(window.location.hash);
    if (!parsed) return;
    if (parsed.query) {
      setQuery((prev) => ({
        ...prev,
        ...parsed.query
      }));
      setHomePeriod({ from: parsed.query.from, to: parsed.query.to });
    }
    if (parsed.settings) {
      setSettings((prev) => ({
        ...prev,
        ...parsed.settings
      }));
    }
  }, []);

  useEffect(() => {
    document.title = APP_CONFIG.appName;
  }, []);

  const effectiveTerms = useMemo(() => {
    if (query.terms.length) return query.terms;
    return ["demokrati"];
  }, [query.terms]);

  const loadData = useCallback(async () => {
    const keyObject = {
      terms: effectiveTerms.join(","),
      from: query.from,
      to: query.to,
      corpus: settings.corpus,
      language: settings.language,
      graphType: settings.graphType,
      caseSensitive: settings.caseSensitive
    };
    const key = JSON.stringify(keyObject);
    if (requestKeyRef.current === key) return;
    requestKeyRef.current = key;

    setLoading(true);
    setError("");
    try {
      const nextData = await fetchNgramData({
        terms: effectiveTerms,
        language: settings.language,
        caseSensitive: settings.caseSensitive,
        corpus: settings.corpus,
        graphType: settings.graphType,
        from: query.from,
        to: query.to
      });
      setData(nextData);
      setLastQuery(effectiveTerms.join(", "));
    } catch (err) {
      setError(err?.message || "Ukjent feil under lasting");
    } finally {
      setLoading(false);
    }
  }, [
    effectiveTerms,
    query.from,
    query.to,
    settings.corpus,
    settings.language,
    settings.graphType,
    settings.caseSensitive
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const hash = buildV2Hash({ query: { ...query, terms: effectiveTerms }, settings });
    window.history.replaceState(null, "", hash);
  }, [query, settings, effectiveTerms]);

  const shareUrl = (() => {
    const fallback = `${window.location.origin}${window.location.pathname}`;
    const base = APP_CONFIG.shareBaseUrl || fallback;
    return `${base}${window.location.hash}`;
  })();

  const chartModel = useMemo(
    () =>
      getChartModel({
        data,
        graphType: settings.graphType,
        smoothing: settings.smoothing,
        scaleMode: settings.scaleMode,
        palette: settings.palette,
        pattern: settings.pattern
      }),
    [data, settings.graphType, settings.smoothing, settings.scaleMode, settings.palette, settings.pattern]
  );

  function handleControlsChange(next) {
    setQuery(next.query);
    setSettings(next.settings);
  }

  function handleSubmit(rawTerms) {
    const parsedTerms = rawTerms
      .split(",")
      .map((term) => term.trim())
      .filter(Boolean);
    setQuery((prev) => ({
      ...prev,
      terms: parsedTerms
    }));
    requestKeyRef.current = "";
  }

  function handleResetPeriod() {
    setQuery((prev) => ({
      ...prev,
      from: homePeriod.from,
      to: homePeriod.to
    }));
    chartRef.current?.resetZoomToHome();
    requestKeyRef.current = "";
  }

  return (
    <main className="app-shell">
      <AppHeader
        appName={APP_CONFIG.appName}
        shareUrl={shareUrl}
        chartModel={chartModel}
        onExportPng={() => chartRef.current?.exportPng()}
      />

      <SearchControls
        query={query}
        settings={settings}
        onChange={handleControlsChange}
        onSubmit={handleSubmit}
        onResetPeriod={handleResetPeriod}
      />

      <section className="status-row">
        {loading && <span>Laster data...</span>}
        {!loading && !error && <span>Sist sok: {lastQuery || "demokrati"}</span>}
        {error && <span className="error">{error}</span>}
      </section>

      <NgramChartRecharts ref={chartRef} data={data} settings={settings} homeWindow={homePeriod} />
    </main>
  );
}
