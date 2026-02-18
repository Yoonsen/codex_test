import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportXlsx(model) {
  const labels = model?.labels || [];
  const datasets = model?.datasets || [];
  const rows = labels.map((year, idx) => {
    const row = { ar: year };
    datasets.forEach((dataset) => {
      row[dataset.label] = dataset.data[idx]?.y ?? 0;
    });
    return row;
  });

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "ngram");
  const data = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  downloadBlob(
    new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    "ngram-data.xlsx"
  );
}

export default function AppHeader({ appName, shareUrl, chartModel, onExportPng }) {
  const [showInfo, setShowInfo] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

  const shareLabel = useMemo(() => {
    if (!copyStatus) return "Del";
    return copyStatus;
  }, [copyStatus]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyStatus("Lenke kopiert");
      setTimeout(() => setCopyStatus(""), 1800);
    } catch {
      setCopyStatus("Kunne ikke kopiere");
      setTimeout(() => setCopyStatus(""), 1800);
    }
  }

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark">NB</div>
        <div>
          <h1>{appName}</h1>
          <p>Utforsk ordbruk over tid</p>
        </div>
      </div>

      <div className="header-actions">
        <button type="button" className="secondary" onClick={() => setShowInfo(true)}>
          Om appen
        </button>
        <div className="share-menu">
          <button type="button" onClick={() => setMenuOpen((v) => !v)}>
            {shareLabel}
          </button>
          {menuOpen && (
            <div className="menu-panel">
              <button
                type="button"
                onClick={() => {
                  exportXlsx(chartModel);
                  setMenuOpen(false);
                }}
              >
                Last ned .xlsx
              </button>
              <button
                type="button"
                onClick={() => {
                  onExportPng();
                  setMenuOpen(false);
                }}
              >
                Last ned .png
              </button>
              <button
                type="button"
                onClick={() => {
                  copyLink();
                  setMenuOpen(false);
                }}
              >
                Kopier delbar lenke
              </button>
            </div>
          )}
        </div>
      </div>

      {showInfo && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowInfo(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Om {appName}</h2>
            <p>
              N-gram viser hvordan ordbruk endrer seg over tid i Nasjonalbibliotekets materialer.
              Velg ord, korpus og visningsmodus for a utforske data.
            </p>
            <button type="button" onClick={() => setShowInfo(false)}>
              Lukk
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
