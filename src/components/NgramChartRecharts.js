import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { getChartModel } from "../services/chartTransforms";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, zoomPlugin);

function formatValue(value, unit) {
  if (unit === "%") return `${value.toFixed(4)} %`;
  if (unit === "ppm") return `${value.toFixed(2)} ppm`;
  return Math.round(value).toLocaleString("no-NO");
}

const NgramChartRecharts = forwardRef(function NgramChartRecharts(
  { data, settings, onModelReady, homeWindow },
  ref
) {
  const chartRef = useRef(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [lastZoomTs, setLastZoomTs] = useState(0);
  const model = useMemo(
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

  const chartData = useMemo(
    () => ({
      labels: model.labels,
      datasets: model.datasets.map((dataset) => ({
        ...dataset,
        borderWidth: settings.lineWidth,
        tension: 0.18,
        pointRadius: settings.pattern ? 3 : 2,
        pointHoverRadius: 5,
        fill: false,
        borderColor: dataset.borderColor,
        backgroundColor: `${dataset.backgroundColor}${Math.round(settings.alpha * 255)
          .toString(16)
          .padStart(2, "0")}`
      }))
    }),
    [model, settings.lineWidth, settings.alpha, settings.pattern]
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label(ctx) {
              return `${ctx.dataset.label}: ${formatValue(ctx.parsed.y, model.unit)}`;
            }
          }
        },
        zoom: {
          pan: { enabled: true, mode: "x" },
          zoom: {
            wheel: { enabled: true },
            pinch: { enabled: true },
            mode: "x",
            onZoomComplete: () => setLastZoomTs(Date.now())
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Ar" }
        },
        y: {
          title: { display: true, text: model.unit === "raw" ? "Frekvens" : model.unit }
        }
      },
      onClick(event, elements, chart) {
        if (Date.now() - lastZoomTs < 350) return;
        if (!elements.length) return;
        const first = elements[0];
        const ds = chartData.datasets[first.datasetIndex];
        const value = ds.data[first.index];
        setSelectedPoint({
          year: value.x,
          value: value.y,
          label: ds.label
        });
      }
    }),
    [chartData.datasets, model.unit, lastZoomTs]
  );

  useImperativeHandle(
    ref,
    () => ({
      exportPng() {
        const chart = chartRef.current;
        if (!chart) return;
        const link = document.createElement("a");
        link.href = chart.toBase64Image("image/png", 1);
        link.download = "ngram-graf.png";
        link.click();
      },
      resetZoomToHome() {
        const chart = chartRef.current;
        if (!chart) return;
        chart.resetZoom();
        if (homeWindow?.from && homeWindow?.to) {
          chart.options.scales.x.min = homeWindow.from;
          chart.options.scales.x.max = homeWindow.to;
          chart.update("none");
        }
      }
    }),
    [homeWindow]
  );

  if (onModelReady) {
    onModelReady(model);
  }

  return (
    <section className="chart-shell">
      <div className="chart-meta">
        <strong>Skala:</strong> {model.unit === "raw" ? "Frekvens" : model.unit}
      </div>
      <div className="chart-wrap">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {selectedPoint && (
        <div className="modal-backdrop" role="presentation" onClick={() => setSelectedPoint(null)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Datapunkt</h2>
            <p>
              <strong>{selectedPoint.label}</strong>
            </p>
            <p>
              Ar: {selectedPoint.year} <br />
              Verdi: {formatValue(selectedPoint.value, model.unit)}
            </p>
            <button type="button" onClick={() => setSelectedPoint(null)}>
              Lukk
            </button>
          </div>
        </div>
      )}
    </section>
  );
});

export default NgramChartRecharts;
