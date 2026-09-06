import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getSampleDatasets } from "../api/client.js";
import DatasetPanel from "../components/panels/DatasetPanel.jsx";
import MobileAlgorithmSelector from "../components/panels/MobileAlgorithmSelector.jsx";
import VisualizerWelcomeState from "../components/panels/VisualizerWelcomeState.jsx";
import ErrorBoundary from "../components/shared/ErrorBoundary.jsx";
import DBSCANViz from "../components/visualizers/DBSCANViz.jsx";
import DecisionTreeViz from "../components/visualizers/DecisionTreeViz.jsx";
import KMeansViz from "../components/visualizers/KMeansViz.jsx";
import KNNViz from "../components/visualizers/KNNViz.jsx";
import LinearRegressionViz from "../components/visualizers/LinearRegressionViz.jsx";
import PCAViz from "../components/visualizers/PCAViz.jsx";
import SVMViz from "../components/visualizers/SVMViz.jsx";
import { useAlgorithmStore } from "../store/algorithmStore.js";
import { useDatasetStore } from "../store/datasetStore.js";
import { exportPDFReport } from "../utils/exportPDF.js";
import {
  buildShareSearch,
  fromShareAlgorithmSlug,
  normalizeDatasetSlug,
} from "../utils/shareUrl.js";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessages.js";

const SUPPORTED_ALGOS = new Set([
  "dbscan",
  "k-means",
  "decision-tree",
  "knn",
  "linear-regression",
  "pca",
  "svm",
]);

const QUICK_START_PRESETS = {
  dbscan: {
    algorithm: "dbscan",
    datasetKey: "moons",
    params: { eps: 0.25, min_samples: 8, metric: "euclidean" },
  },
  "k-means": {
    algorithm: "k-means",
    datasetKey: "blobs",
    params: { k: 3, max_iter: 50, init: "kmeans++" },
  },
  "decision-tree": {
    algorithm: "decision-tree",
    datasetKey: "iris",
    params: { max_depth: 5, criterion: "gini", min_samples_split: 2 },
  },
};

/**
 * Visualizer page with dataset controls and scatter canvas.
 * @returns {JSX.Element}
 */
export const Visualizer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { algorithm } = useParams();
  const captureRef = useRef(/** @type {HTMLDivElement | null} */ (null));
  const datasetRestoreKeyRef = useRef("");
  const [statusText, setStatusText] = useState("");
  const [isDatasetPanelOpen, setIsDatasetPanelOpen] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const isSupportedAlgorithm = Boolean(algorithm && SUPPORTED_ALGOS.has(algorithm));
  const displayName = algorithm
    ? algorithm.replace(/-/g, " ")
    : "choose algorithm";
  const points = useDatasetStore((state) => state.points);
  const datasetName = useDatasetStore((state) => state.datasetName);
  const source = useDatasetStore((state) => state.source);
  const xColumn = useDatasetStore((state) => state.xColumn);
  const yColumn = useDatasetStore((state) => state.yColumn);
  const setDataset = useDatasetStore((state) => state.setDataset);
  const setColumns = useDatasetStore((state) => state.setColumns);

  const steps = useAlgorithmStore((state) => state.steps);
  const currentStepIndex = useAlgorithmStore((state) => state.currentStepIndex);
  const currentParams = useAlgorithmStore((state) => state.currentParams);
  const setCurrentStepIndex = useAlgorithmStore((state) => state.setCurrentStepIndex);
  const setPlaying = useAlgorithmStore((state) => state.setPlaying);
  const setSteps = useAlgorithmStore((state) => state.setSteps);

  const isKMeans = algorithm === "k-means";
  const isDBSCAN = algorithm === "dbscan";
  const isDecisionTree = algorithm === "decision-tree";
  const isKNN = algorithm === "knn";
  const isLinearRegression = algorithm === "linear-regression";
  const isPCA = algorithm === "pca";
  const isSVM = algorithm === "svm";

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  useEffect(() => {
    const queryAlgorithm = fromShareAlgorithmSlug(searchParams.get("algo"));
    if (!queryAlgorithm || !SUPPORTED_ALGOS.has(queryAlgorithm)) {
      return;
    }

    if (algorithm !== queryAlgorithm) {
      navigate(`/visualize/${queryAlgorithm}${location.search}`, { replace: true });
    }
  }, [algorithm, location.search, navigate, searchParams]);

  useEffect(() => {
    const datasetSlug = normalizeDatasetSlug(searchParams.get("dataset"));
    if (!datasetSlug) {
      return;
    }

    const restoreKey = `${datasetSlug}|${location.search}`;
    if (datasetRestoreKeyRef.current === restoreKey) {
      return;
    }

    datasetRestoreKeyRef.current = restoreKey;
    let cancelled = false;

    const restoreDataset = async () => {
      try {
        const response = await getSampleDatasets();
        if (cancelled) {
          return;
        }

        const datasetEntries = Object.entries(response.data || {});
        const match = datasetEntries.find(([key]) => normalizeDatasetSlug(key) === datasetSlug);

        if (!match) {
          return;
        }

        const [key, rawPoints] = match;
        const restoredPoints = (Array.isArray(rawPoints) ? rawPoints : []).map((point) => ({
          x: Number(point.x),
          y: Number(point.y),
          label: point.label == null ? null : String(point.label),
        }));
        setDataset(restoredPoints, key, "builtin");
        setColumns("x", "y");
      } catch (error) {
        console.error("[Visualizer] Unable to restore dataset from URL", error);
      }
    };

    restoreDataset();
    return () => {
      cancelled = true;
    };
  }, [location.search, searchParams, setColumns, setDataset]);

  /**
   * Displays one temporary status message.
   * @param {string} message
   */
  const showStatus = (message) => {
    setStatusText(message);
    window.setTimeout(() => {
      setStatusText((current) => (current === message ? "" : current));
    }, 1800);
  };

  /**
   * Exports the current visualizer panel as PNG.
   */
  const handleExportPng = async () => {
    if (!captureRef.current || isExportingPng) {
      return;
    }

    setIsExportingPng(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#ffffff",
        scale: Math.min(2, window.devicePixelRatio || 1),
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: false,
      });

      const timestamp = Date.now();
      const filename = `MLAlgorithmSimulator-${String(algorithm || "visual")}-${timestamp}.png`;
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = filename;
      link.click();
      showStatus("PNG downloaded");
    } catch (error) {
      console.error("[Visualizer] PNG export failed", error);
      showStatus("PNG export failed");
    } finally {
      setIsExportingPng(false);
    }
  };

  /**
   * Exports the report as PDF with final-step screenshot and summaries.
   */
  const handleExportPdf = async () => {
    if (!captureRef.current || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);
    const previousIndex = currentStepIndex;

    try {
      setPlaying(false);
      if (steps.length > 0) {
        setCurrentStepIndex(steps.length - 1);
        await new Promise((resolve) => window.setTimeout(resolve, 220));
      }

      await exportPDFReport({
        element: captureRef.current,
        algorithm: String(algorithm || ""),
        datasetName,
        params: currentParams,
        finalMetrics: steps[steps.length - 1]?.metrics || {},
        steps,
      });
      showStatus("PDF report downloaded");
    } catch (error) {
      console.error("[Visualizer] PDF export failed", error);
      showStatus("PDF export failed");
    } finally {
      if (steps.length > 0) {
        setCurrentStepIndex(previousIndex);
      }
      setIsExportingPdf(false);
    }
  };

  /**
   * Copies current visualizer state as shareable URL.
   */
  const handleCopyLink = async () => {
    try {
      const search = buildShareSearch({
        algorithm: String(algorithm || ""),
        datasetName,
        params: currentParams,
        step: currentStepIndex,
      });
      const basePath = `${window.location.origin}/visualize/${String(
        algorithm || "k-means"
      )}`;
      const shareUrl = `${basePath}${search}`;
      await navigator.clipboard.writeText(shareUrl);
      showStatus("Copied!");
    } catch (error) {
      console.error("[Visualizer] Copy link failed", error);
      showStatus("Copy failed");
    }
  };

  /**
   * Handles top-level mobile algorithm selection.
   * @param {string} nextAlgorithm
   */
  const handleMobileAlgorithmChange = (nextAlgorithm) => {
    if (!nextAlgorithm) {
      navigate("/visualize");
      return;
    }
    navigate(`/visualize/${nextAlgorithm}`);
  };

  /**
   * Applies one welcome-card quick-start preset.
   * @param {"dbscan" | "k-means" | "decision-tree"} presetKey
   * @returns {Promise<void>}
   */
  const handleQuickStart = async (presetKey) => {
    const preset = QUICK_START_PRESETS[presetKey];
    if (!preset) {
      return;
    }

    try {
      const response = await getSampleDatasets();
      const rawPoints = Array.isArray(response.data?.[preset.datasetKey])
        ? response.data[preset.datasetKey]
        : [];

      if (rawPoints.length === 0) {
        showStatus("Quick-start dataset unavailable");
        return;
      }

      const restoredPoints = rawPoints.map((point) => ({
        x: Number(point.x),
        y: Number(point.y),
        label: point.label == null ? null : String(point.label),
      }));

      setDataset(restoredPoints, preset.datasetKey, "builtin");
      setColumns("x", "y");
      setPlaying(false);
      setCurrentStepIndex(0);
      setSteps([]);

      const search = buildShareSearch({
        algorithm: preset.algorithm,
        datasetName: preset.datasetKey,
        params: preset.params,
        step: 0,
      });
      navigate(`/visualize/${preset.algorithm}${search}`);
    } catch (error) {
      console.error("[Visualizer] Quick-start failed", error);
      showStatus(getFriendlyApiErrorMessage(error, "Unable to load quick-start"));
    }
  };

  return (
    <div className="space-y-4">
      <MobileAlgorithmSelector
        value={isSupportedAlgorithm ? String(algorithm) : ""}
        onChange={handleMobileAlgorithmChange}
      />
      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Dataset Loader</h2>
            <p className="text-xs text-slate-500">
              Current: {datasetName || "None"} {datasetName ? `(${source})` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDatasetPanelOpen((open) => !open)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            aria-expanded={isDatasetPanelOpen}
            aria-controls="dataset-loader-panel"
          >
            {isDatasetPanelOpen ? "Hide Loader" : "Show Loader"}
          </button>
        </div>
        {isDatasetPanelOpen ? (
          <div id="dataset-loader-panel" className="mt-4 animate-fade-in">
            <DatasetPanel embedded />
          </div>
        ) : null}
      </section>
      <section
        ref={captureRef}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
      >
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {isSupportedAlgorithm ? displayName.toUpperCase() : "Choose Algorithm"}
            </h1>
            <p className="text-sm text-slate-600">
              Dataset: {datasetName || "Not loaded"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-xs text-slate-500">
              Axes: {xColumn || "x"} vs {yColumn || "y"}
            </p>
            {isSupportedAlgorithm ? (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleExportPng}
                  disabled={isExportingPng}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  {isExportingPng ? "Exporting..." : "Export PNG"}
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                >
                  {isExportingPdf ? "Generating..." : "Download PDF Report"}
                </button>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Copy Link
                </button>
              </div>
            ) : null}
            {statusText ? (
              <p className="text-xs font-medium text-teal-700">{statusText}</p>
            ) : null}
          </div>
        </header>
        {isSupportedAlgorithm ? (
          <ErrorBoundary resetKeys={[String(algorithm || ""), datasetName, points.length]}>
            {isKMeans ? (
              <KMeansViz />
            ) : isDBSCAN ? (
              <DBSCANViz />
            ) : isDecisionTree ? (
              <DecisionTreeViz />
            ) : isKNN ? (
              <KNNViz />
            ) : isLinearRegression ? (
              <LinearRegressionViz />
            ) : isPCA ? (
              <PCAViz />
            ) : isSVM ? (
              <SVMViz />
            ) : null}
          </ErrorBoundary>
        ) : (
          <VisualizerWelcomeState onQuickStart={handleQuickStart} />
        )}
      </section>
    </div>
  );
};

export default Visualizer;
