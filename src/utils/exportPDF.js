import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const PAGE_MARGIN = 40;

/**
 * Converts route slug to readable label.
 * @param {string} algorithm
 * @returns {string}
 */
const formatAlgorithmName = (algorithm) =>
  String(algorithm || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

/**
 * Converts params object into printable lines.
 * @param {Record<string, unknown>} params
 * @returns {string[]}
 */
const formatParamLines = (params) => {
  const entries = Object.entries(params || {}).filter(([, value]) =>
    ["string", "number", "boolean"].includes(typeof value)
  );
  if (entries.length === 0) {
    return ["No parameters available"];
  }
  return entries.map(([key, value]) => `${key}: ${String(value)}`);
};

/**
 * Derives human-friendly interpretation sentence for one metric.
 * @param {string} metricName
 * @param {string | number | boolean} value
 * @returns {string}
 */
const getMetricInterpretation = (metricName, value) => {
  const numericValue = Number(value);
  if (metricName === "silhouette_score" && Number.isFinite(numericValue)) {
    if (numericValue >= 0.5) {
      return `Silhouette Score of ${numericValue.toFixed(2)} indicates well-separated clusters.`;
    }
    if (numericValue >= 0.2) {
      return `Silhouette Score of ${numericValue.toFixed(2)} suggests moderate cluster overlap.`;
    }
    return `Silhouette Score of ${numericValue.toFixed(2)} indicates poor cluster separation.`;
  }

  if (metricName === "accuracy" && Number.isFinite(numericValue)) {
    return `Accuracy of ${numericValue.toFixed(1)}% summarizes overall correct predictions.`;
  }

  if (metricName === "inertia" && Number.isFinite(numericValue)) {
    return `Inertia of ${numericValue.toFixed(2)} reflects within-cluster compactness (lower is better).`;
  }

  if (metricName === "r2" && Number.isFinite(numericValue)) {
    return `R2 score of ${numericValue.toFixed(3)} indicates explained variance by the fitted line.`;
  }

  if (metricName === "mse" && Number.isFinite(numericValue)) {
    return `MSE of ${numericValue.toFixed(4)} measures mean squared prediction error.`;
  }

  if (metricName === "rmse" && Number.isFinite(numericValue)) {
    return `RMSE of ${numericValue.toFixed(4)} measures prediction error in target units.`;
  }

  return `${metricName} value (${String(value)}) is included in the final model summary.`;
};

/**
 * Filters metrics to primitive values only for PDF table display.
 * @param {Record<string, unknown>} metrics
 * @returns {[string, string | number | boolean][]}
 */
const getMetricEntries = (metrics) =>
  Object.entries(metrics || {}).filter(([, value]) =>
    ["string", "number", "boolean"].includes(typeof value)
  );

/**
 * Captures DOM element as PNG data URL using html2canvas with SVG-friendly options.
 * @param {HTMLElement} element
 * @returns {Promise<{ dataUrl: string, width: number, height: number }>}
 */
const captureElementImage = async (element) => {
  const canvas = await html2canvas(element, {
    backgroundColor: "#ffffff",
    scale: Math.min(2, window.devicePixelRatio || 1),
    useCORS: true,
    allowTaint: true,
    logging: false,
    foreignObjectRendering: false,
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
};

/**
 * Exports a multi-page PDF report for the current visualization.
 * @param {{
 *  element: HTMLElement,
 *  algorithm: string,
 *  datasetName: string,
 *  params: Record<string, unknown>,
 *  finalMetrics: Record<string, unknown>,
 *  steps: Array<{ step_index?: number, step_type?: string, description?: string }>,
 * }} input
 * @returns {Promise<string>} returns generated file name
 */
export const exportPDFReport = async ({
  element,
  algorithm,
  datasetName,
  params,
  finalMetrics,
  steps,
}) => {
  if (!element) {
    throw new Error("Visualization element is not available for PDF export.");
  }

  const safeAlgorithm = formatAlgorithmName(algorithm) || "Algorithm";
  const safeDatasetName = datasetName || "Unknown Dataset";
  const today = new Date();
  const dateLabel = today.toISOString().slice(0, 10);
  const fileName = `MLAlgorithmSimulator-report-${String(algorithm || "visual").toLowerCase()}-${dateLabel}.pdf`;

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.setFontSize(20);
  pdf.text("ML Algorithm Simulator Visualization Report", PAGE_MARGIN, 42);

  pdf.setFontSize(11);
  pdf.text(`Algorithm: ${safeAlgorithm}`, PAGE_MARGIN, 66);
  pdf.text(`Dataset: ${safeDatasetName}`, PAGE_MARGIN, 82);
  pdf.text(`Date: ${dateLabel}`, PAGE_MARGIN, 98);

  pdf.setFontSize(12);
  pdf.text("Parameters", PAGE_MARGIN, 126);
  pdf.setFontSize(10);
  const paramLines = formatParamLines(params);
  let y = 142;
  paramLines.forEach((line) => {
    pdf.text(line, PAGE_MARGIN, y);
    y += 14;
  });

  const capture = await captureElementImage(element);
  const imageMaxWidth = pageWidth - PAGE_MARGIN * 2;
  const imageMaxHeight = 300;
  const aspectRatio = capture.width / Math.max(capture.height, 1);
  let imageWidth = imageMaxWidth;
  let imageHeight = imageWidth / Math.max(aspectRatio, 0.0001);

  if (imageHeight > imageMaxHeight) {
    imageHeight = imageMaxHeight;
    imageWidth = imageHeight * aspectRatio;
  }

  const imageX = (pageWidth - imageWidth) / 2;
  const imageY = Math.min(y + 12, pageHeight - imageHeight - 90);
  pdf.addImage(capture.dataUrl, "PNG", imageX, imageY, imageWidth, imageHeight);

  pdf.setFontSize(10);
  pdf.text(
    `Final state of ${safeAlgorithm} on ${safeDatasetName}`,
    PAGE_MARGIN,
    Math.min(imageY + imageHeight + 18, pageHeight - 40)
  );

  pdf.addPage();
  pdf.setFontSize(16);
  pdf.text("Metrics Summary", PAGE_MARGIN, 42);

  const metricEntries = getMetricEntries(finalMetrics);
  pdf.setFontSize(10);
  let metricsY = 62;
  if (metricEntries.length === 0) {
    pdf.text("No final metrics available.", PAGE_MARGIN, metricsY);
    metricsY += 16;
  } else {
    metricEntries.forEach(([metricName, value]) => {
      const metricText = `${metricName}: ${String(value)}`;
      pdf.text(metricText, PAGE_MARGIN, metricsY);
      metricsY += 13;

      const interpretation = getMetricInterpretation(metricName, value);
      const wrapped = pdf.splitTextToSize(interpretation, pageWidth - PAGE_MARGIN * 2 - 10);
      wrapped.forEach((line) => {
        pdf.text(line, PAGE_MARGIN + 10, metricsY);
        metricsY += 12;
      });
      metricsY += 4;
    });
  }

  if (metricsY > pageHeight - 170) {
    pdf.addPage();
    metricsY = 42;
  }

  pdf.setFontSize(16);
  pdf.text("Step-by-Step Log", PAGE_MARGIN, metricsY + 10);
  pdf.setFontSize(10);
  let logY = metricsY + 28;

  const limitedSteps = Array.isArray(steps) ? steps.slice(0, 20) : [];
  limitedSteps.forEach((step, index) => {
    const title = `#${index + 1} ${String(step.step_type || "step")}`;
    const description = String(step.description || "");

    if (logY > pageHeight - 40) {
      pdf.addPage();
      logY = 42;
    }

    pdf.text(title, PAGE_MARGIN, logY);
    logY += 12;

    const wrappedDescription = pdf.splitTextToSize(
      description,
      pageWidth - PAGE_MARGIN * 2 - 10
    );
    wrappedDescription.forEach((line) => {
      if (logY > pageHeight - 30) {
        pdf.addPage();
        logY = 42;
      }
      pdf.text(line, PAGE_MARGIN + 10, logY);
      logY += 11;
    });
    logY += 5;
  });

  if ((steps || []).length > 20) {
    if (logY > pageHeight - 30) {
      pdf.addPage();
      logY = 42;
    }
    pdf.text(`Only first 20 steps shown out of ${(steps || []).length}.`, PAGE_MARGIN, logY);
  }

  pdf.save(fileName);
  return fileName;
};

export default exportPDFReport;
