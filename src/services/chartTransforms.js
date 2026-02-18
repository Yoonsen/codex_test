const PALETTES = {
  standard: ["#1d4ed8", "#059669", "#dc2626", "#7c3aed", "#ea580c", "#0891b2"],
  colorblind: ["#0072B2", "#009E73", "#D55E00", "#CC79A7", "#E69F00", "#56B4E9"],
  bw: ["#111111", "#333333", "#555555", "#777777", "#999999", "#bbbbbb"]
};

const DASH_PATTERNS = [[], [8, 6], [2, 4], [10, 4, 2, 4], [1, 4], [12, 6]];
const POINT_STYLES = ["circle", "triangle", "rect", "cross", "star", "rectRounded"];

function movingAverage(input, windowSize) {
  if (windowSize <= 1) return [...input];
  const result = [];
  for (let i = 0; i < input.length; i += 1) {
    const from = Math.max(0, i - windowSize + 1);
    const slice = input.slice(from, i + 1);
    const sum = slice.reduce((acc, value) => acc + value, 0);
    result.push(sum / Math.max(1, slice.length));
  }
  return result;
}

function buildBaseSeries(raw, graphType) {
  if (graphType === "absolute") {
    return raw.absolute;
  }
  return raw.relative;
}

function transformMode(dataRows, graphType) {
  if (graphType === "cumulative") {
    return dataRows.map((row) => {
      let acc = 0;
      return row.map((v) => {
        acc += v;
        return acc;
      });
    });
  }
  if (graphType === "cohort") {
    const length = dataRows[0]?.length || 0;
    const totals = new Array(length).fill(0);
    dataRows.forEach((series) => {
      series.forEach((value, idx) => {
        totals[idx] += value;
      });
    });
    return dataRows.map((series) =>
      series.map((value, idx) => {
        const total = totals[idx];
        if (!total) return 0;
        return value / total;
      })
    );
  }
  return dataRows;
}

function pickScale(maxValue, requestedScale) {
  if (requestedScale !== "auto") return requestedScale;
  if (maxValue <= 0) return "%";
  return maxValue < 0.01 ? "ppm" : "%";
}

function scaleValue(value, scale) {
  if (scale === "ppm") return value * 1_000_000;
  if (scale === "%") return value * 100;
  return value;
}

export function getChartModel({ data, graphType, smoothing, scaleMode, palette, pattern }) {
  const labels = data?.dates || [];
  const sourceSeries = data?.series || [];
  const baseRows = sourceSeries.map((series) => buildBaseSeries(series, graphType));
  const modeRows = transformMode(baseRows, graphType);
  const smoothRows = modeRows.map((row) => movingAverage(row, smoothing));
  const maxValue = smoothRows.reduce((maxAcc, row) => {
    const localMax = row.reduce((m, value) => Math.max(m, value), 0);
    return Math.max(maxAcc, localMax);
  }, 0);
  const resolvedScale = graphType === "absolute" ? "raw" : pickScale(maxValue, scaleMode);
  const colors = PALETTES[palette] || PALETTES.standard;

  const datasets = sourceSeries.map((series, idx) => {
    const transformed = smoothRows[idx] || [];
    return {
      label: series.name,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length],
      data: transformed.map((value, pointIdx) => ({
        x: labels[pointIdx],
        y: graphType === "absolute" ? value : scaleValue(value, resolvedScale)
      })),
      borderDash: pattern ? DASH_PATTERNS[idx % DASH_PATTERNS.length] : [],
      pointStyle: pattern ? POINT_STYLES[idx % POINT_STYLES.length] : "circle"
    };
  });

  return {
    labels,
    datasets,
    unit: graphType === "absolute" ? "frekvens" : resolvedScale
  };
}

export function getTableRows(model) {
  const labels = model.labels || [];
  const datasets = model.datasets || [];
  return labels.map((year, idx) => {
    const row = { year };
    datasets.forEach((dataset) => {
      row[dataset.label] = dataset.data[idx]?.y ?? 0;
    });
    return row;
  });
}
