import { useState } from "react";
import BuiltInDatasetsTab from "./BuiltInDatasetsTab.jsx";
import CsvUploadTab from "./CsvUploadTab.jsx";
import DrawPlaceholderTab from "./DrawPlaceholderTab.jsx";
import { useDatasetStore } from "../../store/datasetStore.js";

const TABS = [
  { key: "builtin", label: "Built-in" },
  { key: "upload", label: "Upload CSV" },
  { key: "draw", label: "Draw" },
];

/**
 * Dataset source panel for built-ins, CSV uploads, and draw mode.
 * @param {{ embedded?: boolean }} [props]
 * @returns {JSX.Element}
 */
export const DatasetPanel = ({ embedded = false }) => {
  const [activeTab, setActiveTab] = useState("builtin");
  const datasetName = useDatasetStore((state) => state.datasetName);
  const source = useDatasetStore((state) => state.source);
  const setDataset = useDatasetStore((state) => state.setDataset);
  const setColumns = useDatasetStore((state) => state.setColumns);

  /**
   * Handles built-in dataset selection.
   * @param {string} name
   * @param {{ x: number, y: number, label: string | null }[]} points
   * @returns {void}
   */
  const handleBuiltInSelect = (name, points) => {
    setDataset(points, name, "builtin");
    setColumns("x", "y");
  };

  /**
   * Handles uploaded CSV dataset loading.
   * @param {string} name
   * @param {{ x: number, y: number, label: string | null }[]} points
   * @param {string} xColumn
   * @param {string} yColumn
   * @returns {void}
   */
  const handleUploadSelect = (name, points, xColumn, yColumn) => {
    setDataset(points, name, "upload");
    setColumns(xColumn, yColumn);
  };

  const containerClass = embedded
    ? "space-y-4"
    : "space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm";

  return (
    <section className={containerClass}>
      {!embedded ? (
        <header>
          <h2 className="text-lg font-semibold text-slate-900">Dataset Loader</h2>
          <p className="mt-1 text-xs text-slate-500">
            Current: {datasetName || "None"} {datasetName ? `(${source})` : ""}
          </p>
        </header>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              activeTab === tab.key
                ? "bg-primary text-white"
                : "bg-primary-light text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === "builtin" && <BuiltInDatasetsTab onSelectDataset={handleBuiltInSelect} />}
      {activeTab === "upload" && <CsvUploadTab onLoadDataset={handleUploadSelect} />}
      {activeTab === "draw" && <DrawPlaceholderTab />}
    </section>
  );
};

export default DatasetPanel;
