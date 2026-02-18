const API_BASE = "https://api.nb.no/dhlab/nb_ngram/ngram/query";
const REQUEST_TIMEOUT_MS = 12000;

function withTimeout(url, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timerId),
    url
  };
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export async function fetchNgramData({
  terms,
  language,
  caseSensitive,
  corpus,
  graphType,
  from,
  to
}) {
  const normalizedTerms = (terms || []).filter(Boolean);
  if (!normalizedTerms.length) {
    return { dates: [], series: [] };
  }

  const apiMode = graphType === "absolute" ? "absolutt" : "relative";
  const params = new URLSearchParams({
    terms: normalizedTerms.join(","),
    lang: corpus === "avis" ? "nor" : language,
    case_sens: caseSensitive ? "1" : "0",
    corpus,
    mode: apiMode,
    smooth: "1",
    from: String(from),
    to: String(to)
  });

  const request = withTimeout(`${API_BASE}?${params.toString()}`);
  let response;
  try {
    response = await fetch(request.url, { method: "GET", signal: request.signal });
  } finally {
    request.cleanup();
  }

  if (!response.ok) {
    throw new Error(`API-feil (${response.status})`);
  }

  const payload = await response.json();
  const normalized = normalizeNgramResponse(payload, normalizedTerms, from, to);
  return normalized;
}

export function normalizeNgramResponse(payload, fallbackTerms, from, to) {
  const years = [];
  for (let y = from; y <= to; y += 1) years.push(y);

  const seriesByTerm = new Map(
    (fallbackTerms || []).map((term) => [
      term,
      {
        name: term,
        relative: years.map(() => 0),
        absolute: years.map(() => 0)
      }
    ])
  );

  const list = Array.isArray(payload) ? payload : [];
  list.forEach((entry) => {
    const name = String(entry?.key || "").trim();
    if (!name) return;
    if (!seriesByTerm.has(name)) {
      seriesByTerm.set(name, {
        name,
        relative: years.map(() => 0),
        absolute: years.map(() => 0)
      });
    }
    const target = seriesByTerm.get(name);
    (entry?.values || []).forEach((point) => {
      const year = safeNumber(point?.x);
      const idx = years.indexOf(year);
      if (idx === -1) return;
      target.relative[idx] = safeNumber(point?.y);
      target.absolute[idx] = safeNumber(point?.f);
    });
  });

  return {
    dates: years,
    series: Array.from(seriesByTerm.values())
  };
}
