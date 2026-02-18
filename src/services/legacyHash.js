const DEFAULT_FROM = 1810;
const DEFAULT_TO = new Date().getFullYear();

const LEGACY_MODE_MAP = {
  "1": "relative",
  "2": "absolute",
  "3": "cumulative",
  "4": "cohort"
};

const V2_MODE_SET = new Set(["relative", "absolute", "cumulative", "cohort"]);
const V2_CORPUS_SET = new Set(["bok", "avis"]);
const V2_SCALE_SET = new Set(["auto", "%", "ppm"]);
const V2_LANG_SET = new Set(["nob", "nno", "sme", "eng", "nor"]);

function clampInt(input, min, max, fallback) {
  const parsed = Number.parseInt(input, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseTerms(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((term) => term.trim())
    .filter(Boolean);
}

export function parseHash(hashString) {
  const hash = (hashString || "").replace(/^#/, "");
  if (!hash) return null;

  if (hash.startsWith("v2?")) {
    const params = new URLSearchParams(hash.slice(3));
    const from = clampInt(params.get("from"), 1600, 2100, DEFAULT_FROM);
    const to = clampInt(params.get("to"), 1600, 2100, DEFAULT_TO);
    const mode = params.get("mode");
    const corpus = params.get("corpus");
    const lang = params.get("lang");
    const scale = params.get("scale");

    return {
      query: {
        terms: parseTerms(params.get("terms")),
        from: Math.min(from, to),
        to: Math.max(from, to)
      },
      settings: {
        graphType: V2_MODE_SET.has(mode) ? mode : "relative",
        corpus: V2_CORPUS_SET.has(corpus) ? corpus : "bok",
        language: V2_LANG_SET.has(lang) ? lang : "nob",
        caseSensitive: params.get("case") === "1",
        smoothing: clampInt(params.get("smooth"), 1, 15, 1),
        scaleMode: V2_SCALE_SET.has(scale) ? scale : "auto",
        lineWidth: clampInt(params.get("line"), 1, 8, 2),
        alpha: clampInt(params.get("alpha"), 10, 100, 90) / 100,
        palette: params.get("palette") || "standard",
        pattern: params.get("pattern") === "1"
      }
    };
  }

  // Legacy format example:
  // #1_1_1_fred,frihet_1_1_3_1810,2022_2_2_2_12_2
  const tokens = hash.split("_");
  if (tokens.length < 8) return null;

  const terms = parseTerms(tokens[3]);
  const years = (tokens[7] || "").split(",");
  const from = clampInt(years[0], 1600, 2100, DEFAULT_FROM);
  const to = clampInt(years[1], 1600, 2100, DEFAULT_TO);

  return {
    query: {
      terms,
      from: Math.min(from, to),
      to: Math.max(from, to)
    },
    settings: {
      graphType: LEGACY_MODE_MAP[tokens[6]] || "relative",
      corpus: tokens[1] === "2" ? "avis" : "bok",
      language: tokens[1] === "2" ? "nor" : "nob",
      caseSensitive: tokens[0] === "2",
      smoothing: clampInt(tokens[11], 1, 15, 1),
      scaleMode: "auto",
      lineWidth: 2,
      alpha: 0.9,
      palette: "standard",
      pattern: false
    }
  };
}

export function buildV2Hash({ query, settings }) {
  const params = new URLSearchParams();
  params.set("terms", (query.terms || []).join(","));
  params.set("mode", settings.graphType);
  params.set("corpus", settings.corpus);
  params.set("lang", settings.language);
  params.set("case", settings.caseSensitive ? "1" : "0");
  params.set("smooth", String(settings.smoothing));
  params.set("scale", settings.scaleMode);
  params.set("line", String(settings.lineWidth));
  params.set("alpha", String(Math.round(settings.alpha * 100)));
  params.set("palette", settings.palette);
  params.set("pattern", settings.pattern ? "1" : "0");
  params.set("from", String(query.from));
  params.set("to", String(query.to));
  return `#v2?${params.toString()}`;
}
